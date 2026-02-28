export type ProductId =
  | "agroone"
  | "agroterra"
  | "agrotracker"
  | "agrovalora"
  | "bdonline"
  | "cropdata";

export type MonthlyMetric = {
  year: number;
  month: number;
  revenue: number;
  cost: number;
  performance: number;
};

export type ProductMock = {
  id: ProductId;
  name: string;
  salesModel: string;
  salesRules: string[];
  metrics: MonthlyMetric[];
};

export type AgroTerraBaseRecord = {
  id: number;
  client: string;
  pricesByMunicipality: boolean;
  pricesByPoloAgro: boolean;
  returnType: "Municipio" | "Polo";
  baseHistory: Record<string, boolean>;
  tokenExpiration: string;
};

export type AgroTerraPaymentMethod = "ACH" | "Wire Transfer" | "Corporate Card" | "Check";

export type AgroTerraPaymentStatus = "Settled" | "Pending" | "Failed";

export type AgroTerraPaymentRecord = {
  id: string;
  clientId: number;
  paidAt: string;
  amountUsd: number;
  paymentMethod: AgroTerraPaymentMethod;
  paymentStatus: AgroTerraPaymentStatus;
  tokenValidFrom: string;
  tokenValidUntil: string;
  paymentReference: string;
};

type ProductDefinition = {
  id: ProductId;
  name: string;
  salesModel: string;
  salesRules: string[];
  revenueBase: number;
  costBase: number;
  revenueGrowth: number;
  costGrowth: number;
  seasonalOffset: number;
};

export const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export const AVAILABLE_YEARS = [2024, 2025, 2026] as const;

const PRODUCT_DEFINITIONS: ProductDefinition[] = [
  {
    id: "agroone",
    name: "AgroOne",
    salesModel: "Licenca enterprise + onboarding consultivo",
    salesRules: [
      "Contrato anual com renovacao automatica",
      "Desconto progressivo por volume de usuarios",
      "Setup cobrado apenas na primeira contratacao",
    ],
    revenueBase: 760000,
    costBase: 420000,
    revenueGrowth: 1.18,
    costGrowth: 1.09,
    seasonalOffset: 0,
  },
  {
    id: "agroterra",
    name: "AgroTerra",
    salesModel: "Assinatura mensal por modulo ativado",
    salesRules: [
      "Modulos adicionais elevam ticket medio",
      "Cobertura por regiao afeta precificacao",
      "Clientes com contrato anual recebem bonus de suporte",
    ],
    revenueBase: 510000,
    costBase: 315000,
    revenueGrowth: 1.12,
    costGrowth: 1.07,
    seasonalOffset: 1.2,
  },
  {
    id: "agrotracker",
    name: "AgroTracker",
    salesModel: "Licenca por dispositivo monitorado",
    salesRules: [
      "Plano base inclui ate 100 ativos rastreados",
      "Tarifa adicional por faixa de monitoramento",
      "Integracao de terceiros cobra fee unico",
    ],
    revenueBase: 430000,
    costBase: 285000,
    revenueGrowth: 1.15,
    costGrowth: 1.08,
    seasonalOffset: 2.4,
  },
  {
    id: "agrovalora",
    name: "AgroValora",
    salesModel: "Projeto sob demanda + retainer trimestral",
    salesRules: [
      "Faturamento dividido por marcos de entrega",
      "Retainer minimo de 3 meses por cliente",
      "Pacotes premium incluem equipe dedicada",
    ],
    revenueBase: 390000,
    costBase: 228000,
    revenueGrowth: 1.11,
    costGrowth: 1.06,
    seasonalOffset: 3.1,
  },
  {
    id: "bdonline",
    name: "BD-Online",
    salesModel: "Plano SaaS por cota de dados consultados",
    salesRules: [
      "Excedente de consultas e cobrado por lote",
      "Plano anual reduz custo por cota em 12%",
      "Clientes enterprise tem SLA diferenciado",
    ],
    revenueBase: 360000,
    costBase: 214000,
    revenueGrowth: 1.1,
    costGrowth: 1.05,
    seasonalOffset: 4.2,
  },
  {
    id: "cropdata",
    name: "CropData",
    salesModel: "Assinatura por area monitorada (hectare)",
    salesRules: [
      "Pacotes variam por faixa de hectares",
      "Cobertura satelital premium e opcional",
      "Desconto para cooperativas com multiplas fazendas",
    ],
    revenueBase: 335000,
    costBase: 205000,
    revenueGrowth: 1.09,
    costGrowth: 1.05,
    seasonalOffset: 5.3,
  },
];

const toMonthlyMetrics = (definition: ProductDefinition): MonthlyMetric[] => {
  return AVAILABLE_YEARS.flatMap((year, yearIndex) => {
    const yearlyRevenueGrowth = Math.pow(definition.revenueGrowth, yearIndex);
    const yearlyCostGrowth = Math.pow(definition.costGrowth, yearIndex);

    return MONTH_LABELS.map((_, monthIndex) => {
      const month = monthIndex + 1;
      const seasonalWave =
        1 + Math.sin(((monthIndex + definition.seasonalOffset) / 12) * Math.PI * 2) * 0.1;
      const quarterlyBump = month % 3 === 0 ? 1.03 : 1;
      const costWave =
        1 + Math.cos(((monthIndex + definition.seasonalOffset) / 12) * Math.PI * 2) * 0.05;

      const revenue = Math.round(
        definition.revenueBase * yearlyRevenueGrowth * seasonalWave * quarterlyBump,
      );
      const cost = Math.round(definition.costBase * yearlyCostGrowth * costWave);
      const performance = Number((((revenue - cost) / revenue) * 100).toFixed(1));

      return {
        year,
        month,
        revenue,
        cost,
        performance,
      };
    });
  });
};

export const PRODUCTS: ProductMock[] = PRODUCT_DEFINITIONS.map((definition) => ({
  id: definition.id,
  name: definition.name,
  salesModel: definition.salesModel,
  salesRules: definition.salesRules,
  metrics: toMonthlyMetrics(definition),
}));

export const AGROTERRA_BASES: AgroTerraBaseRecord[] = [
  {
    id: 45,
    client: "ACELEN",
    pricesByMunicipality: true,
    pricesByPoloAgro: false,
    returnType: "Municipio",
    baseHistory: {
      "2024-04-01": false,
      "2024-10-01": false,
      "2025-04-01": false,
      "2025-10-01": true,
    },
    tokenExpiration: "23/01/2027",
  },
  {
    id: 110,
    client: "ITAU",
    pricesByMunicipality: false,
    pricesByPoloAgro: true,
    returnType: "Polo",
    baseHistory: {
      "2024-04-01": false,
      "2024-10-01": false,
      "2025-04-01": true,
      "2025-10-01": true,
    },
    tokenExpiration: "22/07/2026",
  },
  {
    id: 46,
    client: "JOHN DEERE",
    pricesByMunicipality: false,
    pricesByPoloAgro: true,
    returnType: "Municipio",
    baseHistory: {
      "2024-04-01": false,
      "2024-10-01": true,
      "2025-04-01": true,
      "2025-10-01": true,
    },
    tokenExpiration: "29/12/2026",
  },
];

export const AGROTERRA_PAYMENTS: AgroTerraPaymentRecord[] = [
  {
    id: "AGT-45-2024",
    clientId: 45,
    paidAt: "2024-01-24",
    amountUsd: 92000,
    paymentMethod: "ACH",
    paymentStatus: "Settled",
    tokenValidFrom: "2024-01-24",
    tokenValidUntil: "2025-01-23",
    paymentReference: "INV-AGT-2024-00045",
  },
  {
    id: "AGT-45-2025",
    clientId: 45,
    paidAt: "2025-01-24",
    amountUsd: 98000,
    paymentMethod: "ACH",
    paymentStatus: "Settled",
    tokenValidFrom: "2025-01-24",
    tokenValidUntil: "2026-01-23",
    paymentReference: "INV-AGT-2025-00045",
  },
  {
    id: "AGT-45-2026",
    clientId: 45,
    paidAt: "2026-01-24",
    amountUsd: 104000,
    paymentMethod: "ACH",
    paymentStatus: "Settled",
    tokenValidFrom: "2026-01-24",
    tokenValidUntil: "2027-01-23",
    paymentReference: "INV-AGT-2026-00045",
  },
  {
    id: "AGT-110-2024",
    clientId: 110,
    paidAt: "2024-07-23",
    amountUsd: 84000,
    paymentMethod: "Wire Transfer",
    paymentStatus: "Settled",
    tokenValidFrom: "2024-07-23",
    tokenValidUntil: "2025-07-22",
    paymentReference: "INV-AGT-2024-00110",
  },
  {
    id: "AGT-110-2025",
    clientId: 110,
    paidAt: "2025-07-23",
    amountUsd: 91000,
    paymentMethod: "Wire Transfer",
    paymentStatus: "Settled",
    tokenValidFrom: "2025-07-23",
    tokenValidUntil: "2026-07-22",
    paymentReference: "INV-AGT-2025-00110",
  },
  {
    id: "AGT-46-2024",
    clientId: 46,
    paidAt: "2024-12-30",
    amountUsd: 102000,
    paymentMethod: "Corporate Card",
    paymentStatus: "Settled",
    tokenValidFrom: "2024-12-30",
    tokenValidUntil: "2025-12-29",
    paymentReference: "INV-AGT-2024-00046",
  },
  {
    id: "AGT-46-2025",
    clientId: 46,
    paidAt: "2025-12-30",
    amountUsd: 109000,
    paymentMethod: "Corporate Card",
    paymentStatus: "Settled",
    tokenValidFrom: "2025-12-30",
    tokenValidUntil: "2026-12-29",
    paymentReference: "INV-AGT-2025-00046",
  },
];

export const PRODUCT_IDS = PRODUCTS.map((product) => product.id);

export const getProductById = (productId: string) => PRODUCTS.find((product) => product.id === productId);

export const getMetricByMonth = (product: ProductMock, year: number, month: number) =>
  product.metrics.find((metric) => metric.year === year && metric.month === month);

export const getMetricsByYear = (product: ProductMock, year: number) =>
  product.metrics.filter((metric) => metric.year === year);

export const getAnnualAveragePerformance = (product: ProductMock, year: number) => {
  const yearlyMetrics = getMetricsByYear(product, year);
  if (yearlyMetrics.length === 0) return 0;
  const total = yearlyMetrics.reduce((sum, metric) => sum + metric.performance, 0);
  return Number((total / yearlyMetrics.length).toFixed(1));
};
