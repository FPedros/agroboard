import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AGROTERRA_BASES,
  AGROTERRA_PAYMENTS,
  AVAILABLE_YEARS,
  MONTH_LABELS,
  getMetricByMonth,
  getMetricsByYear,
  getProductById,
  type AgroTerraBaseRecord,
} from "@/lib/mockProducts";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
});

const AGROTERRA_CLIENTS_STORAGE_KEY = "agroterra-clients";
const DEFAULT_TOKEN_EXPIRATION = "31/12/2026";
const BASE_HISTORY_START_YEAR = 2024;
const BASE_UPDATE_MONTHS = [4, 10] as const;
const LEGACY_BASE_HISTORY_FIELDS = [
  { date: "2024-04-01", field: "base01042024" },
  { date: "2024-10-01", field: "base01102024" },
  { date: "2025-04-01", field: "base01042025" },
  { date: "2025-10-01", field: "base01102025" },
] as const;

type LegacyBaseHistoryField = (typeof LEGACY_BASE_HISTORY_FIELDS)[number]["field"];
type LegacyAgroTerraClientRecord = Omit<AgroTerraBaseRecord, "baseHistory"> &
  Partial<Record<LegacyBaseHistoryField, boolean>> & {
    baseHistory?: Record<string, boolean>;
  };

const yesNoClass = (value: boolean) =>
  value ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";

const yesNoLabel = (value: boolean) => (value ? "SIM" : "NAO");

const toDate = (value: string) => new Date(`${value}T00:00:00`);

const formatUsDate = (value: string) => usDateFormatter.format(toDate(value));
const formatBaseDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const getBaseStatus = (client: AgroTerraBaseRecord, date: string) => client.baseHistory[date] ?? false;

const getSortedBaseHistory = (client: AgroTerraBaseRecord) =>
  Object.entries(client.baseHistory).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate));

const getEligibleUpdateDates = (referenceDate: Date) => {
  const normalizedToday = new Date(referenceDate);
  normalizedToday.setHours(0, 0, 0, 0);
  const currentYear = normalizedToday.getFullYear();
  const scheduleDates: string[] = [];

  for (let year = currentYear - 3; year <= currentYear + 2; year += 1) {
    scheduleDates.push(`${year}-04-01`, `${year}-10-01`);
  }

  const sortedDates = scheduleDates.sort((a, b) => a.localeCompare(b));
  const todayIso = normalizedToday.toISOString().slice(0, 10);
  const pastDates = sortedDates.filter((date) => date <= todayIso);
  const nextDate = sortedDates.find((date) => date > todayIso) ?? `${currentYear + 1}-04-01`;

  return {
    recentDates: pastDates.slice(-2),
    nextDate,
  };
};

const buildBaseTimelineDates = (startYear: number, endYear: number) => {
  const scheduleDates: string[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    for (const month of BASE_UPDATE_MONTHS) {
      scheduleDates.push(`${year}-${String(month).padStart(2, "0")}-01`);
    }
  }
  return scheduleDates;
};

const linkBaseHistoryDates = (baseHistory: Record<string, boolean>, referenceDate: Date) => {
  const normalizedHistory = { ...baseHistory };
  const { nextDate } = getEligibleUpdateDates(referenceDate);
  const nextDateYear = Number(nextDate.slice(0, 4));
  const endYear = Number.isFinite(nextDateYear) ? nextDateYear : BASE_HISTORY_START_YEAR;
  const timelineDates = buildBaseTimelineDates(BASE_HISTORY_START_YEAR, endYear);

  for (const date of timelineDates) {
    if (normalizedHistory[date] === undefined) {
      normalizedHistory[date] = false;
    }
  }

  return normalizedHistory;
};

type BooleanFormValue = "true" | "false";

type ClientFormState = {
  id: string;
  client: string;
  pricesByMunicipality: BooleanFormValue;
  pricesByPoloAgro: BooleanFormValue;
  returnType: "Municipio" | "Polo";
  baseHistory: Record<string, BooleanFormValue>;
  tokenExpiration: string;
};

const toBooleanFormValue = (value: boolean): BooleanFormValue => (value ? "true" : "false");

const parseBooleanFormValue = (value: BooleanFormValue) => value === "true";

const toAgroTerraClientRecord = (value: unknown): AgroTerraBaseRecord | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as LegacyAgroTerraClientRecord;
  const hasBasicShape =
    typeof candidate.id === "number" &&
    typeof candidate.client === "string" &&
    typeof candidate.pricesByMunicipality === "boolean" &&
    typeof candidate.pricesByPoloAgro === "boolean" &&
    (candidate.returnType === "Municipio" || candidate.returnType === "Polo") &&
    typeof candidate.tokenExpiration === "string";

  if (!hasBasicShape) return null;

  const baseHistory: Record<string, boolean> = {};

  if (candidate.baseHistory && typeof candidate.baseHistory === "object") {
    for (const [date, status] of Object.entries(candidate.baseHistory)) {
      if (typeof status === "boolean") baseHistory[date] = status;
    }
  }

  for (const legacyEntry of LEGACY_BASE_HISTORY_FIELDS) {
    const legacyValue = candidate[legacyEntry.field];
    if (typeof legacyValue === "boolean" && baseHistory[legacyEntry.date] === undefined) {
      baseHistory[legacyEntry.date] = legacyValue;
    }
    if (baseHistory[legacyEntry.date] === undefined) {
      baseHistory[legacyEntry.date] = false;
    }
  }

  return {
    id: candidate.id,
    client: candidate.client,
    pricesByMunicipality: candidate.pricesByMunicipality,
    pricesByPoloAgro: candidate.pricesByPoloAgro,
    returnType: candidate.returnType,
    baseHistory,
    tokenExpiration: candidate.tokenExpiration,
  };
};

const getDefaultAgroTerraClients = (referenceDate: Date) =>
  AGROTERRA_BASES.map((client) => ({
    ...client,
    baseHistory: linkBaseHistoryDates(client.baseHistory, referenceDate),
  }));

const loadAgroTerraClients = (): AgroTerraBaseRecord[] => {
  const referenceDate = new Date();
  if (typeof window === "undefined") return getDefaultAgroTerraClients(referenceDate);

  try {
    const stored = window.localStorage.getItem(AGROTERRA_CLIENTS_STORAGE_KEY);
    if (!stored) return getDefaultAgroTerraClients(referenceDate);

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return getDefaultAgroTerraClients(referenceDate);

    const validRecords = parsed
      .map((record) => toAgroTerraClientRecord(record))
      .filter((record): record is AgroTerraBaseRecord => record !== null)
      .map((record) => ({
        ...record,
        baseHistory: linkBaseHistoryDates(record.baseHistory, referenceDate),
      }));
    return validRecords.length > 0 ? validRecords : getDefaultAgroTerraClients(referenceDate);
  } catch {
    return getDefaultAgroTerraClients(referenceDate);
  }
};

const getNextClientId = (clients: AgroTerraBaseRecord[]) =>
  clients.reduce((maxId, client) => Math.max(maxId, client.id), 0) + 1;

const createNewClientForm = (nextId: number, referenceDate: Date): ClientFormState => ({
  id: String(nextId),
  client: "",
  pricesByMunicipality: "false",
  pricesByPoloAgro: "false",
  returnType: "Municipio",
  baseHistory: Object.fromEntries(
    Object.entries(linkBaseHistoryDates({}, referenceDate)).map(([date, status]) => [
      date,
      toBooleanFormValue(status),
    ]),
  ),
  tokenExpiration: DEFAULT_TOKEN_EXPIRATION,
});

const mapClientToForm = (client: AgroTerraBaseRecord, referenceDate: Date): ClientFormState => ({
  id: String(client.id),
  client: client.client,
  pricesByMunicipality: toBooleanFormValue(client.pricesByMunicipality),
  pricesByPoloAgro: toBooleanFormValue(client.pricesByPoloAgro),
  returnType: client.returnType,
  baseHistory: Object.fromEntries(
    Object.entries(linkBaseHistoryDates(client.baseHistory, referenceDate)).map(([date, status]) => [
      date,
      toBooleanFormValue(status),
    ]),
  ),
  tokenExpiration: client.tokenExpiration,
});

const ProductDetailPage = () => {
  const { productId = "" } = useParams();
  const product = getProductById(productId);
  const defaultYear = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];
  const defaultMonth = Math.min(new Date().getMonth() + 1, 12);
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [agroTerraClients, setAgroTerraClients] = useState<AgroTerraBaseRecord[]>(loadAgroTerraClients);
  const [clientFormMode, setClientFormMode] = useState<"create" | "edit" | null>(null);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [clientFormError, setClientFormError] = useState("");
  const [clientForm, setClientForm] = useState<ClientFormState>(() =>
    createNewClientForm(getNextClientId(loadAgroTerraClients()), new Date()),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AGROTERRA_CLIENTS_STORAGE_KEY, JSON.stringify(agroTerraClients));
  }, [agroTerraClients]);

  if (!product) {
    return (
      <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Produto nao encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O produto informado nao existe no mock atual.
        </p>
        <Link
          to="/app/inicio"
          className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Voltar para inicio
        </Link>
      </section>
    );
  }

  const monthMetric = getMetricByMonth(product, selectedYear, selectedMonth);
  const previousYearMonthMetric = getMetricByMonth(product, selectedYear - 1, selectedMonth);
  const yearMetrics = getMetricsByYear(product, selectedYear);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eligibleUpdateDates = getEligibleUpdateDates(today);
  const editableBaseDates = [...eligibleUpdateDates.recentDates, eligibleUpdateDates.nextDate];
  const latestGridDates = eligibleUpdateDates.recentDates;
  const primaryGridDate = latestGridDates[0] ?? LEGACY_BASE_HISTORY_FIELDS[2].date;
  const secondaryGridDate = latestGridDates[1] ?? LEGACY_BASE_HISTORY_FIELDS[3].date;
  const sortedAgroTerraClients = [...agroTerraClients].sort((a, b) => a.id - b.id);
  const agroTerraClientMap = new Map(sortedAgroTerraClients.map((client) => [client.id, client]));
  const agroTerraPayments = AGROTERRA_PAYMENTS.slice().sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const agroTerraClientSummaries = sortedAgroTerraClients.map((client) => {
    const clientPayments = agroTerraPayments.filter((payment) => payment.clientId === client.id);
    const totalPaidUsd = clientPayments.reduce((sum, payment) => sum + payment.amountUsd, 0);
    const lastPayment = clientPayments[0] ?? null;

    return {
      clientId: client.id,
      clientName: client.client,
      totalPaidUsd,
      lastPaidAt: lastPayment?.paidAt ?? "",
      currentTokenUntil: lastPayment?.tokenValidUntil ?? "",
    };
  });

  const totalRevenueYear = yearMetrics.reduce((sum, metric) => sum + metric.revenue, 0);
  const totalCostYear = yearMetrics.reduce((sum, metric) => sum + metric.cost, 0);
  const averagePerformanceYear =
    yearMetrics.length === 0
      ? 0
      : Number(
          (
            yearMetrics.reduce((sum, metric) => sum + metric.performance, 0) / yearMetrics.length
          ).toFixed(1),
        );

  const updateClientForm = <K extends keyof ClientFormState>(field: K, value: ClientFormState[K]) => {
    setClientForm((current) => ({ ...current, [field]: value }));
  };

  const updateClientBaseHistoryForm = (date: string, value: BooleanFormValue) => {
    setClientForm((current) => ({
      ...current,
      baseHistory: {
        ...current.baseHistory,
        [date]: value,
      },
    }));
  };

  const startCreateClient = () => {
    setClientFormMode("create");
    setEditingClientId(null);
    setClientFormError("");
    setClientForm(createNewClientForm(getNextClientId(sortedAgroTerraClients), today));
  };

  const startEditClient = (client: AgroTerraBaseRecord) => {
    setClientFormMode("edit");
    setEditingClientId(client.id);
    setClientFormError("");
    setClientForm(mapClientToForm(client, today));
  };

  const cancelClientForm = () => {
    setClientFormMode(null);
    setEditingClientId(null);
    setClientFormError("");
  };

  const saveClientForm = (event: React.FormEvent) => {
    event.preventDefault();

    if (!clientFormMode) return;

    const parsedId = Number(clientForm.id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setClientFormError("Informe um ID numerico valido.");
      return;
    }

    const trimmedClientName = clientForm.client.trim();
    if (!trimmedClientName) {
      setClientFormError("Informe o nome do cliente.");
      return;
    }

    const tokenDatePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!tokenDatePattern.test(clientForm.tokenExpiration.trim())) {
      setClientFormError("Data de expiracao invalida. Use DD/MM/AAAA.");
      return;
    }

    const targetClientId = clientFormMode === "edit" && editingClientId !== null ? editingClientId : parsedId;

    if (clientFormMode === "create" && sortedAgroTerraClients.some((client) => client.id === targetClientId)) {
      setClientFormError("Ja existe um cliente com este ID.");
      return;
    }

    const parsedFormBaseHistory = Object.fromEntries(
      Object.entries(clientForm.baseHistory).map(([date, status]) => [date, parseBooleanFormValue(status)]),
    );
    const baseHistory = linkBaseHistoryDates(parsedFormBaseHistory, today);

    for (const date of editableBaseDates) {
      baseHistory[date] = parseBooleanFormValue(clientForm.baseHistory[date] ?? "false");
    }

    const updatedClient: AgroTerraBaseRecord = {
      id: targetClientId,
      client: trimmedClientName,
      pricesByMunicipality: parseBooleanFormValue(clientForm.pricesByMunicipality),
      pricesByPoloAgro: parseBooleanFormValue(clientForm.pricesByPoloAgro),
      returnType: clientForm.returnType,
      baseHistory,
      tokenExpiration: clientForm.tokenExpiration.trim(),
    };

    setAgroTerraClients((current) => {
      if (clientFormMode === "create") {
        return [...current, updatedClient].sort((a, b) => a.id - b.id);
      }
      return current.map((client) => (client.id === targetClientId ? updatedClient : client));
    });

    cancelClientForm();
  };

  return (
    <section className="w-full space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Produto</p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">{product.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Modelo de venda: {product.salesModel}</p>
          </div>
          <div className="flex gap-3">
            <label className="flex flex-col gap-2 text-xs text-muted-foreground">
              Ano
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs text-muted-foreground">
              Mes
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {MONTH_LABELS.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      {product.id === "agroterra" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Bases AgroTerra (mock da planilha)</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ultimas duas atualizacoes de base no grid principal ({formatBaseDate(primaryGridDate)} e{" "}
                {formatBaseDate(secondaryGridDate)}).
              </p>
            </div>
            <button
              type="button"
              onClick={startCreateClient}
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Novo cliente
            </button>
          </div>

          {clientFormMode && (
            <form onSubmit={saveClientForm} className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {clientFormMode === "create" ? "Criar cliente" : "Editar cliente"}
                </h3>
                <button
                  type="button"
                  onClick={cancelClientForm}
                  className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-background"
                >
                  Cancelar
                </button>
              </div>

              {clientFormError && <p className="mt-3 text-xs text-red-600">{clientFormError}</p>}

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  ID
                  <input
                    type="number"
                    value={clientForm.id}
                    onChange={(event) => updateClientForm("id", event.target.value)}
                    disabled={clientFormMode === "edit"}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Cliente
                  <input
                    type="text"
                    value={clientForm.client}
                    onChange={(event) => updateClientForm("client", event.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Retorno
                  <select
                    value={clientForm.returnType}
                    onChange={(event) => updateClientForm("returnType", event.target.value as "Municipio" | "Polo")}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="Municipio">Municipio</option>
                    <option value="Polo">Polo</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Expiracao do token
                  <input
                    type="text"
                    value={clientForm.tokenExpiration}
                    onChange={(event) => updateClientForm("tokenExpiration", event.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Precos por Municipio
                  <select
                    value={clientForm.pricesByMunicipality}
                    onChange={(event) => updateClientForm("pricesByMunicipality", event.target.value as BooleanFormValue)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="true">SIM</option>
                    <option value="false">NAO</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Precos por Polo Agro
                  <select
                    value={clientForm.pricesByPoloAgro}
                    onChange={(event) => updateClientForm("pricesByPoloAgro", event.target.value as BooleanFormValue)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="true">SIM</option>
                    <option value="false">NAO</option>
                  </select>
                </label>

                {clientFormMode === "edit" && (
                  <>
                    {editableBaseDates.map((date) => (
                      <label key={date} className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {formatBaseDate(date)}
                        <select
                          value={clientForm.baseHistory[date] ?? "false"}
                          onChange={(event) =>
                            updateClientBaseHistoryForm(date, event.target.value as BooleanFormValue)
                          }
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                        >
                          <option value="true">SIM</option>
                          <option value="false">NAO</option>
                        </select>
                      </label>
                    ))}
                  </>
                )}
              </div>

              {clientFormMode === "create" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Historico de base iniciado automaticamente como NAO para novo cliente.
                </p>
              )}

              {clientFormMode === "edit" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Edicao de historico limitada as duas ultimas atualizacoes ({formatBaseDate(primaryGridDate)} e{" "}
                  {formatBaseDate(secondaryGridDate)}) e a proxima ({formatBaseDate(eligibleUpdateDates.nextDate)}).
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {clientFormMode === "create" ? "Criar cliente" : "Salvar alteracoes"}
                </button>
                <button
                  type="button"
                  onClick={cancelClientForm}
                  className="h-10 rounded-md border border-input bg-background px-4 text-sm text-foreground hover:bg-muted"
                >
                  Fechar
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Precos por Municipio</th>
                  <th className="px-3 py-2 font-medium">Precos por Polo Agro</th>
                  <th className="px-3 py-2 font-medium">Retorno</th>
                  <th className="px-3 py-2 font-medium">{formatBaseDate(primaryGridDate)}</th>
                  <th className="px-3 py-2 font-medium">{formatBaseDate(secondaryGridDate)}</th>
                  <th className="px-3 py-2 font-medium">Expiracao do token</th>
                  <th className="px-3 py-2 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgroTerraClients.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-3 py-2">{row.id}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{row.client}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${yesNoClass(row.pricesByMunicipality)}`}>
                        {yesNoLabel(row.pricesByMunicipality)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${yesNoClass(row.pricesByPoloAgro)}`}>
                        {yesNoLabel(row.pricesByPoloAgro)}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.returnType}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${yesNoClass(getBaseStatus(row, primaryGridDate))}`}
                      >
                        {yesNoLabel(getBaseStatus(row, primaryGridDate))}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${yesNoClass(getBaseStatus(row, secondaryGridDate))}`}
                      >
                        {yesNoLabel(getBaseStatus(row, secondaryGridDate))}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.tokenExpiration}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => startEditClient(row)}
                        className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {product.id === "agroterra" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Clientes AgroTerra</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O que cada cliente assinou e historico de ativacoes da base.
          </p>

          <div className="mt-4 space-y-3">
            {sortedAgroTerraClients.map((client) => {
              const isOpen = expandedClientId === client.id;
              const clientPayments = agroTerraPayments
                .filter((payment) => payment.clientId === client.id)
                .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
              const latestPayment = clientPayments[0] ?? null;

              return (
                <div key={client.id} className="rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setExpandedClientId(isOpen ? null : client.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/20"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.client}</p>
                      <p className="text-xs text-muted-foreground">
                        ID {client.id} · Retorno: {client.returnType}
                      </p>
                    </div>
                    <span className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
                      {isOpen ? "Ocultar" : "Ver cliente"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-4 py-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Escopo contratado
                          </p>
                          <div className="mt-2 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Precos por Municipio:</span>
                              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${yesNoClass(client.pricesByMunicipality)}`}>
                                {yesNoLabel(client.pricesByMunicipality)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Precos por Polo Agro:</span>
                              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${yesNoClass(client.pricesByPoloAgro)}`}>
                                {yesNoLabel(client.pricesByPoloAgro)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Retorno:</span>
                              <span className="text-foreground">{client.returnType}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Historico de base
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {getSortedBaseHistory(client).map(([date, status]) => (
                              <div key={date} className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1">
                                <span>{formatBaseDate(date)}</span>
                                <span className={`rounded px-2 py-0.5 font-semibold ${yesNoClass(status)}`}>
                                  {yesNoLabel(status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {latestPayment && (
                        <div className="mt-4 rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground">
                          Ultimo pagamento: {formatUsDate(latestPayment.paidAt)} · Metodo: {latestPayment.paymentMethod}
                          {" · "}Token ativo ate: {formatUsDate(latestPayment.tokenValidUntil)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      )}

      {product.id === "agroterra" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Billing & Token Ledger</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registros anuais por cliente com valor pago, data de pagamento, metodo e validade do token.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {agroTerraClientSummaries.map((summary) => (
              <div key={summary.clientId} className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-sm font-semibold text-foreground">{summary.clientName}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total paid</p>
                <p className="text-sm font-medium text-foreground">{usdFormatter.format(summary.totalPaidUsd)}</p>
                {summary.lastPaidAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last payment: {formatUsDate(summary.lastPaidAt)}
                  </p>
                )}
                {summary.currentTokenUntil && (
                  <p className="text-xs text-muted-foreground">
                    Active token until: {formatUsDate(summary.currentTokenUntil)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Payment Ref</th>
                  <th className="px-3 py-2 font-medium">Paid date</th>
                  <th className="px-3 py-2 font-medium">Amount (USD)</th>
                  <th className="px-3 py-2 font-medium">Payment method</th>
                  <th className="px-3 py-2 font-medium">Token valid from</th>
                  <th className="px-3 py-2 font-medium">Token valid until</th>
                  <th className="px-3 py-2 font-medium">Token status</th>
                </tr>
              </thead>
              <tbody>
                {agroTerraPayments.map((payment) => {
                  const clientName = agroTerraClientMap.get(payment.clientId)?.client ?? "-";
                  const validUntilDate = toDate(payment.tokenValidUntil);
                  const daysRemaining = Math.ceil(
                    (validUntilDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
                  );
                  const isTokenActive = daysRemaining >= 0;
                  const tokenStatusClass = isTokenActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800";
                  const tokenStatusLabel = isTokenActive ? `Active (${daysRemaining}d)` : "Expired";

                  return (
                    <tr key={payment.id} className="border-b border-border/60">
                      <td className="px-3 py-2 font-medium text-foreground">{clientName}</td>
                      <td className="px-3 py-2">{payment.paymentReference}</td>
                      <td className="px-3 py-2">{formatUsDate(payment.paidAt)}</td>
                      <td className="px-3 py-2">{usdFormatter.format(payment.amountUsd)}</td>
                      <td className="px-3 py-2">{payment.paymentMethod}</td>
                      <td className="px-3 py-2">{formatUsDate(payment.tokenValidFrom)}</td>
                      <td className="px-3 py-2">{formatUsDate(payment.tokenValidUntil)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${tokenStatusClass}`}>
                          {tokenStatusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Faturamento do mes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {currencyFormatter.format(monthMetric?.revenue ?? 0)}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Custo do mes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {currencyFormatter.format(monthMetric?.cost ?? 0)}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Performance do mes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {percentFormatter.format(monthMetric?.performance ?? 0)}%
          </p>
          {previousYearMonthMetric && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ano anterior ({selectedYear - 1}): {percentFormatter.format(previousYearMonthMetric.performance)}%
            </p>
          )}
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Historico mensal de {selectedYear}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Mes</th>
                  <th className="px-3 py-2 font-medium">Faturamento</th>
                  <th className="px-3 py-2 font-medium">Custo</th>
                  <th className="px-3 py-2 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {yearMetrics.map((metric) => (
                  <tr key={`${metric.year}-${metric.month}`} className="border-b border-border/60">
                    <td className="px-3 py-2">{MONTH_LABELS[metric.month - 1]}</td>
                    <td className="px-3 py-2">{currencyFormatter.format(metric.revenue)}</td>
                    <td className="px-3 py-2">{currencyFormatter.format(metric.cost)}</td>
                    <td className="px-3 py-2">{percentFormatter.format(metric.performance)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Regras comerciais</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            {product.salesRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 rounded-xl bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo anual {selectedYear}</p>
            <p className="text-sm text-foreground">Faturamento: {currencyFormatter.format(totalRevenueYear)}</p>
            <p className="text-sm text-foreground">Custo: {currencyFormatter.format(totalCostYear)}</p>
            <p className="text-sm text-foreground">
              Performance media: {percentFormatter.format(averagePerformanceYear)}%
            </p>
          </div>
        </article>
      </div>
    </section>
  );
};

export default ProductDetailPage;
