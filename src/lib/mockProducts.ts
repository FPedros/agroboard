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

export type AgroValoraPlan = "Basic" | "Plus" | "Premium";

export type AgroValoraClientRecord = {
  id: number;
  name: string;
  plan: AgroValoraPlan;
};

export type AgroValoraBasicPaymentStatus =
  | "Pago"
  | "Aguardando pagamento"
  | "Em preenchimento"
  | "Cancelado";

export type AgroValoraBasicPaymentMethod = "PIX" | "Boleto" | "Cartao" | "Transferencia";

export type AgroValoraBasicInvoiceDetails = {
  invoiceNumber: string | null;
  invoiceSeries: string | null;
  invoiceIssueDate: string | null;
  invoiceAmountBrl: number | null;
  billingAddress: string | null;
  billingPhone: string | null;
  billingEmail: string | null;
  paymentGuideNumber: string | null;
  paymentGuideDueDate: string | null;
  paymentGuideBarcode: string | null;
};

export type AgroValoraBasicReportRecord = {
  registro: string;
  pacote: string;
  solicitante: string;
  cliente: string;
  cpfCnpj: string;
  municipio: string;
  prazoDiasRestantes: number;
  paymentStatus: AgroValoraBasicPaymentStatus;
  paymentDate: string | null;
  paymentMethod: AgroValoraBasicPaymentMethod | null;
  paidByClient: string | null;
  invoiceDetails?: AgroValoraBasicInvoiceDetails;
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

export const AGROVALORA_CLIENTS: AgroValoraClientRecord[] = [
  {
    id: 1,
    name: "Santander",
    plan: "Basic",
  },
  {
    id: 2,
    name: "Bradesco",
    plan: "Basic",
  },
  {
    id: 5,
    name: "Banco Safra",
    plan: "Basic",
  },
  {
    id: 3,
    name: "Bradesco",
    plan: "Plus",
  },
  {
    id: 4,
    name: "Santander",
    plan: "Premium",
  },
];

export const AGROVALORA_BASIC_REPORTS: AgroValoraBasicReportRecord[] = [
  {
    registro: "8483",
    pacote: "Laudo Basic",
    solicitante: "Santander Comercial20",
    cliente: "Rani Evangelista Troncha Neto",
    cpfCnpj: "944.170.831-34",
    municipio: "Jau/SP",
    prazoDiasRestantes: 13,
    paymentStatus: "Em preenchimento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8482",
    pacote: "Laudo Basic",
    solicitante: "Engenhar Consultoria Agropecuaria E Florestal Ltda",
    cliente: "Valmir Kampin Melo",
    cpfCnpj: "744.803.165-15",
    municipio: "Itabela/BA",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8481",
    pacote: "Laudo Basic",
    solicitante: "Jardel Cordovil Da Silva",
    cliente: "Flavio Henrique Souza",
    cpfCnpj: "015.902.246-04",
    municipio: "N/A",
    prazoDiasRestantes: 13,
    paymentStatus: "Em preenchimento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8480",
    pacote: "Laudo Basic",
    solicitante: "Jardel Cordovil Da Silva",
    cliente: "Emily Emanuelle Goncalves Morais",
    cpfCnpj: "202.926.282-67",
    municipio: "N/A",
    prazoDiasRestantes: 13,
    paymentStatus: "Em preenchimento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8479",
    pacote: "Laudo Basic",
    solicitante: "Engenhar Consultoria Agropecuaria E Florestal Ltda",
    cliente: "Valmir Kampin Melo",
    cpfCnpj: "744.803.165-15",
    municipio: "Itabela/BA",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8478",
    pacote: "Laudo Basic",
    solicitante: "Dc Consultoria E Treinamento Ltda",
    cliente: "Rivadavia Velho Correa Meyer",
    cpfCnpj: "005.218.460-99",
    municipio: "Mostardas/RS",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8477",
    pacote: "Laudo Basic",
    solicitante: "Agrozoocred - Assessoria E Planejamento Ltda",
    cliente: "Cristiano De Mello Alvares",
    cpfCnpj: "06.074.691/0002-35",
    municipio: "Palmas/TO",
    prazoDiasRestantes: 13,
    paymentStatus: "Aguardando pagamento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8476",
    pacote: "Laudo Basic",
    solicitante: "Engenhar Consultoria Agropecuaria E Florestal Ltda",
    cliente: "Valmir Kampin Melo",
    cpfCnpj: "744.803.165-15",
    municipio: "Itabela/BA",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8475",
    pacote: "Laudo Basic",
    solicitante: "Engenhar Consultoria Agropecuaria E Florestal Ltda",
    cliente: "Valmir Kampin Melo",
    cpfCnpj: "744.803.165-15",
    municipio: "Itabela/BA",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8474",
    pacote: "Laudo Basic",
    solicitante: "Engenhar Consultoria Agropecuaria E Florestal Ltda",
    cliente: "Valmir Kampin Melo",
    cpfCnpj: "744.803.165-15",
    municipio: "Itabela/BA",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8473",
    pacote: "Laudo Basic",
    solicitante: "Avant Agro Planejamento Agropecuario Ltda",
    cliente: "Carlos Braz De Oliveira Pires",
    cpfCnpj: "070.733.991-04",
    municipio: "Guaira/SP",
    prazoDiasRestantes: 13,
    paymentStatus: "Aguardando pagamento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8472",
    pacote: "Laudo Basic",
    solicitante: "Assessoria Agropecuaria Marcon Ltda",
    cliente: "Valter Jose Potter",
    cpfCnpj: "013.180.000-97",
    municipio: "Dom Pedrito/RS",
    prazoDiasRestantes: 13,
    paymentStatus: "Aguardando pagamento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8471",
    pacote: "Laudo Basic",
    solicitante: "Certa Consultoria Extensao Rural E Tecnicas Agro",
    cliente: "Pedro Resende De Oliveira",
    cpfCnpj: "018.997.961-50",
    municipio: "Piraquara/GO",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8470",
    pacote: "Laudo Basic",
    solicitante: "Di-Bio Solucoes Agroambientais Ltda",
    cliente: "Valdo Angelo Citra Junior",
    cpfCnpj: "295.624.468-08",
    municipio: "N/A",
    prazoDiasRestantes: 13,
    paymentStatus: "Em preenchimento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8469",
    pacote: "Laudo Basic",
    solicitante: "Mdm Consultoria Ambiental E Planejamento Agropecuario",
    cliente: "Jose Luiz Sebastiani",
    cpfCnpj: "159.919.549-68",
    municipio: "Campos Novos/SC",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "Cartao",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8468",
    pacote: "Laudo Basic",
    solicitante: "Avant Agro Planejamento Agropecuario Ltda",
    cliente: "Joao Carlos De Godoy",
    cpfCnpj: "792.201.348-53",
    municipio: "Apucarana/SP",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8467",
    pacote: "Laudo Basic",
    solicitante: "Fabio Henrique Da Fonseca E Cia Ltda",
    cliente: "Antonio Claudio Maximiano",
    cpfCnpj: "802.826.019-53",
    municipio: "Apucarana/PR",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "Cartao",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8466",
    pacote: "Laudo Basic",
    solicitante: "Di-Bio Solucoes Agroambientais Ltda",
    cliente: "Floresval Vivan",
    cpfCnpj: "361.548.149-68",
    municipio: "N/A",
    prazoDiasRestantes: 13,
    paymentStatus: "Em preenchimento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8465",
    pacote: "Laudo Basic",
    solicitante: "Agroconsult Consultoria Agropecuaria Ltda",
    cliente: "Edson Augusto Fosch",
    cpfCnpj: "344.434.601-87",
    municipio: "Canarana/MT",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8464",
    pacote: "Laudo Basic",
    solicitante: "Dc Consultoria E Treinamento Ltda",
    cliente: "Jeronimo Message Dutra",
    cpfCnpj: "976.400.930-15",
    municipio: "Santo Antonio Da Patrulha/RS",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-09",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8463",
    pacote: "Laudo Basic",
    solicitante: "Santander Comercial93",
    cliente: "Andre Luiz Pacheco Azevedo",
    cpfCnpj: "022.659.021-60",
    municipio: "Porto Nacional/TO",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "Cartao",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8462",
    pacote: "Laudo Basic",
    solicitante: "Assistagro Agricultura Ltda",
    cliente: "Gilmar Scariot",
    cpfCnpj: "354.447.460-34",
    municipio: "Lagoa Vermelha/RS",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8461",
    pacote: "Laudo Basic",
    solicitante: "Santander Comercial43",
    cliente: "Manoel Martin",
    cpfCnpj: "395.195.387-04",
    municipio: "Sao Felipe D Oeste/RO",
    prazoDiasRestantes: 13,
    paymentStatus: "Aguardando pagamento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8460",
    pacote: "Laudo Basic",
    solicitante: "Assistagro Agricultura Ltda",
    cliente: "Gustavo Pelisser Crestani",
    cpfCnpj: "038.479.400-90",
    municipio: "Lagoa Vermelha/RS",
    prazoDiasRestantes: 13,
    paymentStatus: "Aguardando pagamento",
    paymentDate: null,
    paymentMethod: null,
    paidByClient: "Banco Safra",
  },
  {
    registro: "8459",
    pacote: "Laudo Basic",
    solicitante: "F&M Comercializacao E Importacao Ltda",
    cliente: "Wilson Fernandes Da Silva",
    cpfCnpj: "709.430.608-34",
    municipio: "Nossa Senhora Do Livramento/MT",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "Cartao",
    paidByClient: "Banco Safra",
  },
  {
    registro: "8458",
    pacote: "Laudo Basic",
    solicitante: "Agroconsult Consultoria Agropecuaria Ltda",
    cliente: "Iron Francisco Da Silva",
    cpfCnpj: "950.759.289-87",
    municipio: "Nova Xavantina/MT",
    prazoDiasRestantes: 13,
    paymentStatus: "Pago",
    paymentDate: "2025-07-08",
    paymentMethod: "PIX",
    paidByClient: "Banco Safra",
  },
];

const AGROVALORA_BILLING_CONTACTS: Record<
  string,
  { billingAddress: string; billingPhone: string; billingEmail: string }
> = {
  "Banco Safra": {
    billingAddress: "Av. Paulista, 2100 - Bela Vista, Sao Paulo - SP",
    billingPhone: "+55 (11) 3175-8248",
    billingEmail: "cobranca.empresas@safra.com.br",
  },
  Bradesco: {
    billingAddress: "Cidade de Deus, s/n - Vila Yara, Osasco - SP",
    billingPhone: "+55 (11) 3684-7022",
    billingEmail: "cobranca.empresas@bradesco.com.br",
  },
  Santander: {
    billingAddress: "Av. Pres. Juscelino Kubitschek, 2041 - Sao Paulo - SP",
    billingPhone: "+55 (11) 3012-3336",
    billingEmail: "cobranca.empresas@santander.com.br",
  },
};

const buildDefaultDueDate = (prazoDiasRestantes: number) => {
  const baseDate = new Date("2025-07-09T00:00:00");
  baseDate.setDate(baseDate.getDate() + Math.max(prazoDiasRestantes, 0));
  return baseDate.toISOString().slice(0, 10);
};

const buildPaymentGuideBarcode = (registro: string) => {
  const digits = registro.replace(/\D/g, "");
  return digits.padEnd(44, "0").slice(0, 44);
};

const buildAgroValoraInvoiceDetails = (
  report: AgroValoraBasicReportRecord,
): AgroValoraBasicInvoiceDetails => {
  const contact = AGROVALORA_BILLING_CONTACTS[report.paidByClient ?? ""] ?? {
    billingAddress: "Nao informado",
    billingPhone: "Nao informado",
    billingEmail: "nao-informado@agrovalora.local",
  };
  const dueDate = report.paymentDate ?? buildDefaultDueDate(report.prazoDiasRestantes);

  return {
    invoiceNumber: `NF-${report.registro}`,
    invoiceSeries: "1",
    invoiceIssueDate: report.paymentDate ?? "2025-07-09",
    invoiceAmountBrl: 450,
    billingAddress: contact.billingAddress,
    billingPhone: contact.billingPhone,
    billingEmail: contact.billingEmail,
    paymentGuideNumber: `GUIA-${report.registro}`,
    paymentGuideDueDate: dueDate,
    paymentGuideBarcode: buildPaymentGuideBarcode(report.registro),
  };
};

export const fetchAgroValoraBasicReports = async (): Promise<AgroValoraBasicReportRecord[]> => {
  await new Promise((resolve) => setTimeout(resolve, 220));
  return AGROVALORA_BASIC_REPORTS.map((report) => ({
    ...report,
    invoiceDetails: report.invoiceDetails ?? buildAgroValoraInvoiceDetails(report),
  }));
};

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
