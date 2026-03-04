import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AGROVALORA_CLIENTS,
  AGROTERRA_BASES,
  AGROTERRA_PAYMENTS,
  AVAILABLE_YEARS,
  fetchAgroValoraBasicReports,
  getMetricByMonth,
  getProductById,
  type AgroValoraBasicPaymentStatus,
  type AgroValoraBasicReportRecord,
  type AgroValoraClientRecord,
  type AgroValoraPlan,
  type AgroTerraBaseRecord,
  type AgroTerraPaymentMethod,
  type AgroTerraPaymentRecord,
} from "@/lib/mockProducts";
import { formatCurrencyBrl, formatCurrencyBrlDashboard } from "@/lib/utils";

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const usDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
});

const AGROTERRA_CLIENTS_STORAGE_KEY = "agroterra-clients";
const AGROTERRA_PAYMENTS_STORAGE_KEY = "agroterra-payments";
const AGROVALORA_CLIENTS_STORAGE_KEY = "agrovalora-clients";
const DEFAULT_TOKEN_EXPIRATION = "31/12/2026";
const BASE_HISTORY_START_YEAR = 2024;
const BASE_UPDATE_MONTHS = [4, 10] as const;
const AGROVALORA_PLAN_ORDER: AgroValoraPlan[] = ["Basic", "Plus", "Premium"];
const ALL_FILTER_VALUE = "__all__";
const LEGACY_BASE_HISTORY_FIELDS = [
  { date: "2024-04-01", field: "base01042024" },
  { date: "2024-10-01", field: "base01102024" },
  { date: "2025-04-01", field: "base01042025" },
  { date: "2025-10-01", field: "base01102025" },
] as const;

const agroValoraBasicStatusClassMap: Record<AgroValoraBasicPaymentStatus, string> = {
  Pago: "bg-emerald-100 text-emerald-800",
  "Aguardando pagamento": "bg-amber-100 text-amber-800",
  "Em preenchimento": "bg-sky-100 text-sky-800",
  Cancelado: "bg-rose-100 text-rose-800",
};

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
const paymentMethodLabelMap: Record<string, string> = {
  ACH: "ACH",
  "Wire Transfer": "Transferencia bancaria",
  "Corporate Card": "Cartao corporativo",
  Check: "Cheque",
};
const formatPaymentMethodLabel = (value: string) => paymentMethodLabelMap[value] ?? value;
const toIsoLocalDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const toIsoDateFromBr = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
};
const parseBrlAmountInput = (value: string) => {
  const sanitized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!sanitized) return null;
  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
};
const parseBrDate = (value: string) => {
  const isoDate = toIsoDateFromBr(value);
  if (!isoDate) return null;
  const parsedDate = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getTokenExpirationInfo = (tokenExpiration: string, referenceDate: Date) => {
  const parsedDate = parseBrDate(tokenExpiration);
  if (!parsedDate) {
    return {
      label: "Data invalida",
      statusClass: "bg-slate-100 text-slate-700",
      daysRemaining: null as number | null,
    };
  }

  const daysRemaining = Math.ceil(
    (parsedDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) {
    return {
      label: "Expirado",
      statusClass: "bg-rose-100 text-rose-800",
      daysRemaining,
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: "Vence em breve",
      statusClass: "bg-amber-100 text-amber-800",
      daysRemaining,
    };
  }

  return {
    label: "Ativo",
    statusClass: "bg-emerald-100 text-emerald-800",
    daysRemaining,
  };
};

const formatBaseDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatOptionalBaseDate = (value: string | null | undefined) => (value ? formatBaseDate(value) : "Nao informado");

const formatOptionalText = (value: string | null | undefined) => {
  if (!value) return "Nao informado";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Nao informado";
};

const formatOptionalCurrencyBrl = (value: number | null | undefined) =>
  typeof value === "number" ? formatCurrencyBrl(value) : "Nao informado";

const getSortedBaseHistory = (client: AgroTerraBaseRecord) =>
  Object.entries(client.baseHistory).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate));

const getVisibleBaseHistory = (client: AgroTerraBaseRecord) => {
  const sortedHistory = getSortedBaseHistory(client);
  const firstActiveIndex = sortedHistory.findIndex(([, status]) => status);
  if (firstActiveIndex === -1) return [];
  return sortedHistory.slice(firstActiveIndex);
};

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
  paymentDate: string;
  paymentAmountBrl: string;
  paymentMethod: AgroTerraPaymentMethod;
  paymentTokenValidFrom: string;
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

const isAgroTerraPaymentRecord = (value: unknown): value is AgroTerraPaymentRecord => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as AgroTerraPaymentRecord;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.clientId === "number" &&
    typeof candidate.paidAt === "string" &&
    typeof candidate.amountUsd === "number" &&
    typeof candidate.paymentMethod === "string" &&
    typeof candidate.paymentStatus === "string" &&
    typeof candidate.tokenValidFrom === "string" &&
    typeof candidate.tokenValidUntil === "string" &&
    typeof candidate.paymentReference === "string"
  );
};

const isAgroValoraPlan = (value: unknown): value is AgroValoraPlan =>
  value === "Basic" || value === "Plus" || value === "Premium";

const toAgroValoraClientRecord = (value: unknown): AgroValoraClientRecord | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as AgroValoraClientRecord;
  const hasBasicShape =
    typeof candidate.id === "number" && typeof candidate.name === "string" && isAgroValoraPlan(candidate.plan);

  if (!hasBasicShape) return null;

  return {
    id: candidate.id,
    name: candidate.name,
    plan: candidate.plan,
  };
};

const loadAgroValoraClients = (): AgroValoraClientRecord[] => {
  if (typeof window === "undefined") return AGROVALORA_CLIENTS;

  try {
    const stored = window.localStorage.getItem(AGROVALORA_CLIENTS_STORAGE_KEY);
    if (!stored) return AGROVALORA_CLIENTS;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return AGROVALORA_CLIENTS;

    const validRecords = parsed
      .map((record) => toAgroValoraClientRecord(record))
      .filter((record): record is AgroValoraClientRecord => record !== null);
    if (validRecords.length === 0) return AGROVALORA_CLIENTS;

    const existingKeys = new Set(validRecords.map((record) => `${record.plan}:${record.name.toLowerCase()}`));
    const missingDefaults = AGROVALORA_CLIENTS.filter(
      (record) => !existingKeys.has(`${record.plan}:${record.name.toLowerCase()}`),
    );
    return [...validRecords, ...missingDefaults];
  } catch {
    return AGROVALORA_CLIENTS;
  }
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

const loadAgroTerraPayments = (): AgroTerraPaymentRecord[] => {
  if (typeof window === "undefined") return AGROTERRA_PAYMENTS;

  try {
    const stored = window.localStorage.getItem(AGROTERRA_PAYMENTS_STORAGE_KEY);
    if (!stored) return AGROTERRA_PAYMENTS;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return AGROTERRA_PAYMENTS;

    const validPayments = parsed.filter(isAgroTerraPaymentRecord);
    return validPayments.length > 0 ? validPayments : AGROTERRA_PAYMENTS;
  } catch {
    return AGROTERRA_PAYMENTS;
  }
};

const createAgroTerraPaymentRecord = ({
  clientId,
  paidAt,
  amountBrl,
  paymentMethod,
  tokenValidFrom,
  tokenValidUntil,
  existingPayments,
}: {
  clientId: number;
  paidAt: string;
  amountBrl: number;
  paymentMethod: AgroTerraPaymentMethod;
  tokenValidFrom: string;
  tokenValidUntil: string;
  existingPayments: AgroTerraPaymentRecord[];
}): AgroTerraPaymentRecord => {
  const baseId = `AGT-${clientId}-${paidAt}`;
  const idCount = existingPayments.filter((payment) => payment.id.startsWith(baseId)).length;
  const id = idCount === 0 ? baseId : `${baseId}-${idCount + 1}`;

  const year = paidAt.slice(0, 4);
  const baseReference = `INV-AGT-${year}-${String(clientId).padStart(5, "0")}`;
  const referenceCount = existingPayments.filter((payment) =>
    payment.paymentReference.startsWith(baseReference),
  ).length;
  const paymentReference = `${baseReference}-${String(referenceCount + 1).padStart(2, "0")}`;

  return {
    id,
    clientId,
    paidAt,
    amountUsd: amountBrl,
    paymentMethod,
    paymentStatus: "Settled",
    tokenValidFrom,
    tokenValidUntil,
    paymentReference,
  };
};

const getNextClientId = (clients: AgroTerraBaseRecord[]) =>
  clients.reduce((maxId, client) => Math.max(maxId, client.id), 0) + 1;

const getNextAgroValoraClientId = (clients: AgroValoraClientRecord[]) =>
  clients.reduce((maxId, client) => Math.max(maxId, client.id), 0) + 1;

const createNewClientForm = (nextId: number, referenceDate: Date): ClientFormState => {
  const defaultTokenValidFrom = formatBaseDate(toIsoLocalDate(referenceDate));

  return {
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
    paymentDate: defaultTokenValidFrom,
    paymentAmountBrl: "",
    paymentMethod: "ACH",
    paymentTokenValidFrom: defaultTokenValidFrom,
  };
};

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
  paymentDate: formatBaseDate(toIsoLocalDate(referenceDate)),
  paymentAmountBrl: "",
  paymentMethod: "ACH",
  paymentTokenValidFrom: formatBaseDate(toIsoLocalDate(referenceDate)),
});

type AgroValoraClientDraftState = Record<AgroValoraPlan, string>;
type AgroValoraClientErrorState = Record<AgroValoraPlan, string>;

const createEmptyAgroValoraDrafts = (): AgroValoraClientDraftState => ({
  Basic: "",
  Plus: "",
  Premium: "",
});

const createEmptyAgroValoraErrors = (): AgroValoraClientErrorState => ({
  Basic: "",
  Plus: "",
  Premium: "",
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
  const [agroTerraPaymentsState, setAgroTerraPaymentsState] =
    useState<AgroTerraPaymentRecord[]>(loadAgroTerraPayments);
  const [agroValoraClients, setAgroValoraClients] = useState<AgroValoraClientRecord[]>(loadAgroValoraClients);
  const [agroValoraBasicReports, setAgroValoraBasicReports] = useState<AgroValoraBasicReportRecord[]>([]);
  const [agroValoraBasicLoading, setAgroValoraBasicLoading] = useState(false);
  const [agroValoraBasicError, setAgroValoraBasicError] = useState("");
  const [expandedAgroValoraReportId, setExpandedAgroValoraReportId] = useState<string | null>(null);
  const [agroValoraBasicClientFilter, setAgroValoraBasicClientFilter] = useState(ALL_FILTER_VALUE);
  const [agroValoraBasicRepresentativeFilter, setAgroValoraBasicRepresentativeFilter] =
    useState(ALL_FILTER_VALUE);
  const [agroValoraClientDrafts, setAgroValoraClientDrafts] = useState<AgroValoraClientDraftState>(
    createEmptyAgroValoraDrafts,
  );
  const [agroValoraClientErrors, setAgroValoraClientErrors] = useState<AgroValoraClientErrorState>(
    createEmptyAgroValoraErrors,
  );
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AGROTERRA_PAYMENTS_STORAGE_KEY, JSON.stringify(agroTerraPaymentsState));
  }, [agroTerraPaymentsState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AGROVALORA_CLIENTS_STORAGE_KEY, JSON.stringify(agroValoraClients));
  }, [agroValoraClients]);

  useEffect(() => {
    if (product?.id !== "agrovalora") return;

    let isMounted = true;
    setAgroValoraBasicLoading(true);
    setAgroValoraBasicError("");

    fetchAgroValoraBasicReports()
      .then((reports) => {
        if (!isMounted) return;
        setAgroValoraBasicReports(reports);
      })
      .catch(() => {
        if (!isMounted) return;
        setAgroValoraBasicError("Nao foi possivel carregar os laudos Basic da API.");
        setAgroValoraBasicReports([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setAgroValoraBasicLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eligibleUpdateDates = getEligibleUpdateDates(today);
  const editableBaseDates = [...eligibleUpdateDates.recentDates, eligibleUpdateDates.nextDate];
  const latestGridDates = eligibleUpdateDates.recentDates;
  const primaryGridDate = latestGridDates[0] ?? LEGACY_BASE_HISTORY_FIELDS[2].date;
  const secondaryGridDate = latestGridDates[1] ?? LEGACY_BASE_HISTORY_FIELDS[3].date;
  const sortedAgroTerraClients = [...agroTerraClients].sort((a, b) => a.id - b.id);
  const agroTerraClientMap = new Map(sortedAgroTerraClients.map((client) => [client.id, client]));
  const agroTerraPayments = [...agroTerraPaymentsState].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const activeAgroTerraPayments = agroTerraPayments.filter(
    (payment) => toDate(payment.tokenValidUntil).getTime() >= today.getTime(),
  );
  const clientIdsWithActivePayment = new Set(activeAgroTerraPayments.map((payment) => payment.clientId));
  const billingRows = [
    ...activeAgroTerraPayments.map((payment) => {
      const validUntilDate = toDate(payment.tokenValidUntil);
      const daysRemaining = Math.ceil((validUntilDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: payment.id,
        clientName: agroTerraClientMap.get(payment.clientId)?.client ?? "-",
        paidAt: payment.paidAt,
        amountBrl: payment.amountUsd,
        paymentMethod: payment.paymentMethod,
        tokenValidFrom: payment.tokenValidFrom,
        tokenValidUntil: payment.tokenValidUntil,
        tokenStatusClass: "bg-emerald-100 text-emerald-800",
        tokenStatusLabel: `Ativo (${daysRemaining} dias)`,
        sortDate: payment.tokenValidUntil,
      };
    }),
    ...sortedAgroTerraClients.flatMap((client) => {
      if (clientIdsWithActivePayment.has(client.id)) return [];
      const tokenExpirationIso = toIsoDateFromBr(client.tokenExpiration);
      if (!tokenExpirationIso) return [];

      const tokenExpirationDate = toDate(tokenExpirationIso);
      if (tokenExpirationDate.getTime() < today.getTime()) return [];

      return [
        {
          id: `cliente-${client.id}-sem-pagamento`,
          clientName: client.client,
          paidAt: null,
          amountBrl: null,
          paymentMethod: null,
          tokenValidFrom: null,
          tokenValidUntil: tokenExpirationIso,
          tokenStatusClass: "bg-emerald-100 text-emerald-800",
          tokenStatusLabel: "Ativo (sem pagamento)",
          sortDate: tokenExpirationIso,
        },
      ];
    }),
  ].sort((a, b) => b.sortDate.localeCompare(a.sortDate) || a.clientName.localeCompare(b.clientName));
  const agroValoraClientsByPlan = Object.fromEntries(
    AGROVALORA_PLAN_ORDER.map((plan) => [
      plan,
      agroValoraClients
        .filter((client) => client.plan === plan)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ]),
  ) as Record<AgroValoraPlan, AgroValoraClientRecord[]>;
  const agroValoraBasicClientOptions = [
    ...new Set([
      ...agroValoraClientsByPlan.Basic.map((client) => client.name),
      ...agroValoraBasicReports
        .map((report) => report.paidByClient)
        .filter((client): client is string => Boolean(client)),
    ]),
  ].sort((a, b) => a.localeCompare(b));
  const agroValoraBasicRepresentativeOptions = [...new Set(agroValoraBasicReports.map((report) => report.solicitante))]
    .sort((a, b) => a.localeCompare(b));
  const filteredAgroValoraBasicReports = agroValoraBasicReports.filter((report) => {
    const matchesClient =
      agroValoraBasicClientFilter === ALL_FILTER_VALUE || report.paidByClient === agroValoraBasicClientFilter;
    const matchesRepresentative =
      agroValoraBasicRepresentativeFilter === ALL_FILTER_VALUE ||
      report.solicitante === agroValoraBasicRepresentativeFilter;
    return matchesClient && matchesRepresentative;
  });
  const agroValoraBasicPaidCount = filteredAgroValoraBasicReports.filter(
    (report) => report.paymentStatus === "Pago",
  ).length;
  const agroValoraBasicPendingCount = filteredAgroValoraBasicReports.filter(
    (report) => report.paymentStatus === "Aguardando pagamento" || report.paymentStatus === "Em preenchimento",
  ).length;
  const agroValoraBasicCanceledCount = filteredAgroValoraBasicReports.filter(
    (report) => report.paymentStatus === "Cancelado",
  ).length;

  const updateAgroValoraClientDraft = (plan: AgroValoraPlan, value: string) => {
    setAgroValoraClientDrafts((current) => ({ ...current, [plan]: value }));
    setAgroValoraClientErrors((current) => ({ ...current, [plan]: "" }));
  };

  const addAgroValoraClient = (plan: AgroValoraPlan) => {
    const clientName = agroValoraClientDrafts[plan].trim();
    if (!clientName) {
      setAgroValoraClientErrors((current) => ({ ...current, [plan]: "Informe o nome do cliente." }));
      return;
    }

    const duplicateClientInPlan = agroValoraClients.some(
      (client) => client.plan === plan && client.name.toLowerCase() === clientName.toLowerCase(),
    );
    if (duplicateClientInPlan) {
      setAgroValoraClientErrors((current) => ({
        ...current,
        [plan]: "Este cliente ja esta cadastrado nesta categoria.",
      }));
      return;
    }

    setAgroValoraClients((current) => [
      ...current,
      {
        id: getNextAgroValoraClientId(current),
        name: clientName,
        plan,
      },
    ]);
    setAgroValoraClientDrafts((current) => ({ ...current, [plan]: "" }));
    setAgroValoraClientErrors((current) => ({ ...current, [plan]: "" }));
  };

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

    let newPaymentRecord: AgroTerraPaymentRecord | null = null;
    if (clientFormMode === "create") {
      if (!tokenDatePattern.test(clientForm.paymentDate.trim())) {
        setClientFormError("Data de pagamento invalida. Use DD/MM/AAAA.");
        return;
      }

      if (!tokenDatePattern.test(clientForm.paymentTokenValidFrom.trim())) {
        setClientFormError("Token valido de invalido. Use DD/MM/AAAA.");
        return;
      }

      const parsedPaymentAmount = parseBrlAmountInput(clientForm.paymentAmountBrl);
      if (parsedPaymentAmount === null) {
        setClientFormError("Valor (BRL) invalido.");
        return;
      }

      const paidAtIso = toIsoDateFromBr(clientForm.paymentDate.trim());
      const tokenValidFromIso = toIsoDateFromBr(clientForm.paymentTokenValidFrom.trim());
      const tokenValidUntilIso = toIsoDateFromBr(clientForm.tokenExpiration.trim());
      if (!paidAtIso || !tokenValidFromIso || !tokenValidUntilIso) {
        setClientFormError("Datas de pagamento/token invalidas. Use DD/MM/AAAA.");
        return;
      }

      newPaymentRecord = createAgroTerraPaymentRecord({
        clientId: targetClientId,
        paidAt: paidAtIso,
        amountBrl: parsedPaymentAmount,
        paymentMethod: clientForm.paymentMethod,
        tokenValidFrom: tokenValidFromIso,
        tokenValidUntil: tokenValidUntilIso,
        existingPayments: agroTerraPaymentsState,
      });
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

    if (newPaymentRecord) {
      setAgroTerraPaymentsState((current) => [newPaymentRecord, ...current]);
    }

    cancelClientForm();
  };

  return (
    <section className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Faturamento do mes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrencyBrlDashboard(monthMetric?.revenue ?? 0)}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Custo do mes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrencyBrlDashboard(monthMetric?.cost ?? 0)}
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

      {product.id === "agroterra" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Faturamento e Controle de Token</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registros anuais por cliente com valor pago, data de pagamento, metodo e validade do token.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Data de pagamento</th>
                  <th className="px-3 py-2 font-medium">Valor (BRL)</th>
                  <th className="px-3 py-2 font-medium">Forma de pagamento</th>
                  <th className="px-3 py-2 font-medium">Token valido de</th>
                  <th className="px-3 py-2 font-medium">Token valido ate</th>
                  <th className="px-3 py-2 font-medium">Status do token</th>
                </tr>
              </thead>
              <tbody>
                {billingRows.map((row) => {
                  return (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="px-3 py-2 font-medium text-foreground">{row.clientName}</td>
                      <td className="px-3 py-2">{row.paidAt ? formatUsDate(row.paidAt) : "-"}</td>
                      <td className="px-3 py-2">
                        {row.amountBrl !== null ? formatCurrencyBrl(row.amountBrl) : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row.paymentMethod ? formatPaymentMethodLabel(row.paymentMethod) : "-"}
                      </td>
                      <td className="px-3 py-2">{row.tokenValidFrom ? formatUsDate(row.tokenValidFrom) : "-"}</td>
                      <td className="px-3 py-2">{formatUsDate(row.tokenValidUntil)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${row.tokenStatusClass}`}>
                          {row.tokenStatusLabel}
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

      {product.id === "agroterra" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Clientes AgroTerra</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                O que cada cliente assinou e historico de ativacoes da base.
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
                  Token valido ate
                  <input
                    type="text"
                    value={clientForm.tokenExpiration}
                    onChange={(event) => updateClientForm("tokenExpiration", event.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  />
                </label>

                {clientFormMode === "create" && (
                  <>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Data de pagamento
                      <input
                        type="text"
                        value={clientForm.paymentDate}
                        onChange={(event) => updateClientForm("paymentDate", event.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Valor (BRL)
                      <input
                        type="text"
                        value={clientForm.paymentAmountBrl}
                        onChange={(event) => updateClientForm("paymentAmountBrl", event.target.value)}
                        placeholder="Ex.: 104000 ou 104.000,00"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Forma de pagamento
                      <select
                        value={clientForm.paymentMethod}
                        onChange={(event) =>
                          updateClientForm("paymentMethod", event.target.value as AgroTerraPaymentMethod)
                        }
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      >
                        <option value="ACH">ACH</option>
                        <option value="Wire Transfer">Transferencia bancaria</option>
                        <option value="Corporate Card">Cartao corporativo</option>
                        <option value="Check">Cheque</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Token valido de
                      <input
                        type="text"
                        value={clientForm.paymentTokenValidFrom}
                        onChange={(event) => updateClientForm("paymentTokenValidFrom", event.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      />
                    </label>
                  </>
                )}

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

          <div className="mt-4 space-y-3">
            {sortedAgroTerraClients.map((client) => {
              const isOpen = expandedClientId === client.id;
              const clientPayments = agroTerraPayments
                .filter((payment) => payment.clientId === client.id)
                .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
              const latestPayment = clientPayments[0] ?? null;
              const visibleBaseHistory = getVisibleBaseHistory(client);
              const tokenInfo = getTokenExpirationInfo(client.tokenExpiration, today);

              return (
                <div key={client.id} className="rounded-xl border border-border">
                  <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start md:justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedClientId(isOpen ? null : client.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-semibold text-foreground">{client.client}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                          Token ate {client.tokenExpiration}
                        </span>
                        <span className={`rounded px-2 py-0.5 font-semibold ${tokenInfo.statusClass}`}>
                          {tokenInfo.label}
                        </span>
                        {tokenInfo.daysRemaining !== null && tokenInfo.daysRemaining >= 0 && (
                          <span className="text-muted-foreground">{tokenInfo.daysRemaining} dias</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ID {client.id} · Retorno: {client.returnType}
                      </p>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditClient(client)}
                        className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedClientId(isOpen ? null : client.id)}
                        className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40"
                      >
                        {isOpen ? "Ocultar" : "Ver cliente"}
                      </button>
                    </div>
                  </div>

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
                          {visibleBaseHistory.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {visibleBaseHistory.map(([date, status]) => (
                                <div key={date} className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1">
                                  <span>{formatBaseDate(date)}</span>
                                  <span className={`rounded px-2 py-0.5 font-semibold ${yesNoClass(status)}`}>
                                    {yesNoLabel(status)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-muted-foreground">Sem base recebida (SIM) ate o momento.</p>
                          )}
                        </div>
                      </div>

                      {latestPayment && (
                        <div className="mt-4 rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground">
                          Ultimo pagamento: {formatUsDate(latestPayment.paidAt)} · Metodo:{" "}
                          {formatPaymentMethodLabel(latestPayment.paymentMethod)}
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

      {product.id === "agrovalora" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Basic: Laudos por representante</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dados recebidos via API do Agrovalora
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <article className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de laudos</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{filteredAgroValoraBasicReports.length}</p>
            </article>
            <article className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pagos</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">{agroValoraBasicPaidCount}</p>
            </article>
            <article className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Aguardando pagamento</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{agroValoraBasicPendingCount}</p>
            </article>
            <article className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cancelados</p>
              <p className="mt-1 text-2xl font-semibold text-rose-700">{agroValoraBasicCanceledCount}</p>
            </article>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Cliente pagador
              <select
                value={agroValoraBasicClientFilter}
                onChange={(event) => setAgroValoraBasicClientFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value={ALL_FILTER_VALUE}>Todos</option>
                {agroValoraBasicClientOptions.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Representante
              <select
                value={agroValoraBasicRepresentativeFilter}
                onChange={(event) => setAgroValoraBasicRepresentativeFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value={ALL_FILTER_VALUE}>Todos</option>
                {agroValoraBasicRepresentativeOptions.map((representative) => (
                  <option key={representative} value={representative}>
                    {representative}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {agroValoraBasicLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando laudos Basic da API...</p>
          ) : agroValoraBasicError ? (
            <p className="mt-4 text-sm text-red-600">{agroValoraBasicError}</p>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[1460px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Registro</th>
                      <th className="px-3 py-2 font-medium">Solicitante</th>
                      <th className="px-3 py-2 font-medium">Cliente</th>
                      <th className="px-3 py-2 font-medium">CPF/CNPJ</th>
                      <th className="px-3 py-2 font-medium">Municipio</th>
                      <th className="px-3 py-2 font-medium">Status pagamento</th>
                      <th className="px-3 py-2 font-medium">Data pagamento</th>
                      <th className="px-3 py-2 font-medium">Metodo pagamento</th>
                      <th className="px-3 py-2 font-medium">Prazo</th>
                      <th className="px-3 py-2 font-medium">NF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgroValoraBasicReports.map((report) => {
                      const prazoDotClass =
                        report.paymentStatus === "Cancelado"
                          ? "bg-rose-500"
                          : report.paymentStatus === "Pago"
                            ? "bg-emerald-500"
                            : "bg-amber-500";

                      const isExpanded = expandedAgroValoraReportId === report.registro;
                      const invoiceDetails = report.invoiceDetails;

                      return (
                        <Fragment key={report.registro}>
                          <tr className="border-b border-border/60">
                            <td className="px-3 py-2">{report.registro}</td>
                            <td className="px-3 py-2">{report.solicitante}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{report.cliente}</td>
                            <td className="px-3 py-2">{report.cpfCnpj}</td>
                            <td className="px-3 py-2">{report.municipio}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  agroValoraBasicStatusClassMap[report.paymentStatus]
                                }`}
                              >
                                {report.paymentStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {report.paymentDate ? formatBaseDate(report.paymentDate) : "-"}
                            </td>
                            <td className="px-3 py-2">{report.paymentMethod ?? "-"}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${prazoDotClass}`} />
                                <span>{report.prazoDiasRestantes} dias restantes</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted/40"
                                onClick={() =>
                                  setExpandedAgroValoraReportId((current) =>
                                    current === report.registro ? null : report.registro,
                                  )
                                }
                              >
                                {isExpanded ? "Ocultar NF" : "Ver NF"}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-b border-border/60 bg-muted/10">
                              <td colSpan={10} className="px-3 py-3">
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                  <section className="rounded-lg border border-border bg-background/70 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Dados da NF
                                    </p>
                                    <dl className="mt-2 space-y-1 text-xs">
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Numero</dt>
                                        <dd>{formatOptionalText(invoiceDetails?.invoiceNumber)}</dd>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Serie</dt>
                                        <dd>{formatOptionalText(invoiceDetails?.invoiceSeries)}</dd>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Emissao</dt>
                                        <dd>{formatOptionalBaseDate(invoiceDetails?.invoiceIssueDate)}</dd>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Valor</dt>
                                        <dd>{formatOptionalCurrencyBrl(invoiceDetails?.invoiceAmountBrl)}</dd>
                                      </div>
                                    </dl>
                                  </section>

                                  <section className="rounded-lg border border-border bg-background/70 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Contato faturamento
                                    </p>
                                    <dl className="mt-2 space-y-1 text-xs">
                                      <div className="space-y-1">
                                        <dt className="text-muted-foreground">Endereco</dt>
                                        <dd>{formatOptionalText(invoiceDetails?.billingAddress)}</dd>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Telefone</dt>
                                        <dd>{formatOptionalText(invoiceDetails?.billingPhone)}</dd>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">E-mail</dt>
                                        <dd>{formatOptionalText(invoiceDetails?.billingEmail)}</dd>
                                      </div>
                                    </dl>
                                  </section>

                                  <section className="rounded-lg border border-border bg-background/70 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Guia de pagamento
                                    </p>
                                    <dl className="mt-2 space-y-1 text-xs">
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Numero da guia</dt>
                                        <dd>{formatOptionalText(invoiceDetails?.paymentGuideNumber)}</dd>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Vencimento</dt>
                                        <dd>{formatOptionalBaseDate(invoiceDetails?.paymentGuideDueDate)}</dd>
                                      </div>
                                      <div className="space-y-1">
                                        <dt className="text-muted-foreground">Linha digitavel</dt>
                                        <dd className="break-all">{formatOptionalText(invoiceDetails?.paymentGuideBarcode)}</dd>
                                      </div>
                                    </dl>
                                  </section>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAgroValoraBasicReports.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Nenhum laudo encontrado com os filtros selecionados.
                </p>
              )}
            </>
          )}
        </article>
      )}

      {product.id === "agrovalora" && (
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Clientes por categoria</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Gestao separada entre os planos Basic, Plus e Premium.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {AGROVALORA_PLAN_ORDER.map((plan) => {
              const clients = agroValoraClientsByPlan[plan];
              return (
                <section key={plan} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{plan}</h3>
                    <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {clients.length} cliente(s)
                    </span>
                  </div>

                  <div className="mt-3">
                    {clients.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {clients.map((client) => (
                          <li
                            key={client.id}
                            className="rounded-md border border-border/70 bg-background px-3 py-2 text-foreground"
                          >
                            {client.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado.</p>
                    )}
                  </div>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      addAgroValoraClient(plan);
                    }}
                    className="mt-4 space-y-2"
                  >
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Novo cliente
                      <input
                        type="text"
                        value={agroValoraClientDrafts[plan]}
                        onChange={(event) => updateAgroValoraClientDraft(plan, event.target.value)}
                        placeholder="Ex.: Banco do Brasil"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      />
                    </label>

                    {agroValoraClientErrors[plan] && (
                      <p className="text-xs text-red-600">{agroValoraClientErrors[plan]}</p>
                    )}

                    <button
                      type="submit"
                      className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Cadastrar cliente
                    </button>
                  </form>
                </section>
              );
            })}
          </div>
        </article>
      )}

    </section>
  );
};

export default ProductDetailPage;
