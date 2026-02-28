import { useMemo, useRef, useState, type MouseEvent } from "react";
import { AVAILABLE_YEARS, MONTH_LABELS, PRODUCTS, getMetricByMonth, type ProductId } from "@/lib/mockProducts";

const chartColors = ["#22C55E", "#14B8A6", "#38BDF8", "#F59E0B", "#EF4444", "#A78BFA"];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const chartWidth = 980;
const chartHeight = 320;
const chartPadding = { top: 20, right: 24, bottom: 40, left: 50 };
const chartTooltipWidth = 228;
const chartTooltipHeight = 58;

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

type HoverPoint = {
  productId: ProductId;
  productName: string;
  color: string;
  month: number;
  value: number;
  cumulativeValue: number;
  x: number;
  y: number;
};

const getAvailableMonthsForYear = (year: number, referenceDate: Date) => {
  const referenceYear = referenceDate.getFullYear();

  if (year < referenceYear) {
    return MONTH_LABELS.map((_, index) => index + 1);
  }

  if (year > referenceYear) {
    return [];
  }

  return Array.from({ length: referenceDate.getMonth() + 1 }, (_, index) => index + 1);
};

const StarterHomePage = () => {
  const latestYear = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }, []);
  const defaultYear = Math.min(latestYear, yesterday.getFullYear());
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedProductId, setSelectedProductId] = useState<ProductId | null>(null);
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const availableMonths = useMemo(
    () => getAvailableMonthsForYear(selectedYear, yesterday),
    [selectedYear, yesterday],
  );
  const hasDataForYear = availableMonths.length > 0;

  const activeMonth = hasDataForYear ? availableMonths[availableMonths.length - 1] : 1;
  const selectedProduct = selectedProductId ? PRODUCTS.find((product) => product.id === selectedProductId) : null;
  const dataWindowLabel =
    selectedYear === yesterday.getFullYear()
      ? `${selectedYear} ate ${dateFormatter.format(yesterday)}`
      : `${selectedYear} completo`;

  const toggleProductSelection = (productId: ProductId) => {
    setSelectedProductId((current) => (current === productId ? null : productId));
  };

  const monthlyComparison = useMemo(
    () =>
      availableMonths.map((month) => ({
        label: MONTH_LABELS[month - 1],
        month,
        byProduct: PRODUCTS.map((product) => ({
          productId: product.id,
          productName: product.name,
          performance: getMetricByMonth(product, selectedYear, month)?.performance ?? 0,
        })),
      })),
    [availableMonths, selectedYear],
  );

  const lineChartData = useMemo(() => {
    const xRange = chartWidth - chartPadding.left - chartPadding.right;
    const xForMonth = (month: number) => chartPadding.left + ((month - 1) / 11) * xRange;

    if (monthlyComparison.length === 0) {
      return {
        series: PRODUCTS.map((product, index) => ({
          product,
          color: chartColors[index % chartColors.length],
          points: "",
        })),
        safeMin: 0,
        safeMax: 1,
        yForValue: () => chartHeight - chartPadding.bottom,
        xForMonth,
      };
    }

    const allValues = monthlyComparison.flatMap((entry) => entry.byProduct.map((product) => product.performance));
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const safeMin = Math.floor(minValue - 2);
    const safeMax = Math.ceil(maxValue + 2);
    const yRange = Math.max(safeMax - safeMin, 1);
    const yRangePixels = chartHeight - chartPadding.top - chartPadding.bottom;

    const yForValue = (value: number) =>
      chartHeight - chartPadding.bottom - ((value - safeMin) / yRange) * yRangePixels;

    const series = PRODUCTS.map((product, index) => {
      const points = monthlyComparison.map((entry) => {
        const value = entry.byProduct.find((item) => item.productId === product.id)?.performance ?? 0;
        return `${xForMonth(entry.month)},${yForValue(value)}`;
      });

      return {
        product,
        color: chartColors[index % chartColors.length],
        points: points.join(" "),
      };
    });

    return {
      series,
      safeMin,
      safeMax,
      yForValue,
      xForMonth,
    };
  }, [monthlyComparison]);

  const yearOverYearData = useMemo(
    () => {
      if (!hasDataForYear) return [];

      return PRODUCTS.map((product) => {
        const current = getMetricByMonth(product, selectedYear, activeMonth)?.performance ?? 0;
        const previous = getMetricByMonth(product, selectedYear - 1, activeMonth)?.performance ?? 0;
        return {
          productId: product.id,
          productName: product.name,
          current,
          previous,
          delta: Number((current - previous).toFixed(1)),
        };
      });
    },
    [activeMonth, hasDataForYear, selectedYear],
  );

  const monthRevenue = useMemo(() => {
    if (!hasDataForYear) return 0;
    if (selectedProduct) return getMetricByMonth(selectedProduct, selectedYear, activeMonth)?.revenue ?? 0;

    return PRODUCTS.reduce(
      (sum, product) => sum + (getMetricByMonth(product, selectedYear, activeMonth)?.revenue ?? 0),
      0,
    );
  }, [activeMonth, hasDataForYear, selectedProduct, selectedYear]);

  const monthCost = useMemo(() => {
    if (!hasDataForYear) return 0;
    if (selectedProduct) return getMetricByMonth(selectedProduct, selectedYear, activeMonth)?.cost ?? 0;

    return PRODUCTS.reduce(
      (sum, product) => sum + (getMetricByMonth(product, selectedYear, activeMonth)?.cost ?? 0),
      0,
    );
  }, [activeMonth, hasDataForYear, selectedProduct, selectedYear]);

  const monthPerformance = useMemo(() => {
    if (!hasDataForYear) return 0;
    if (selectedProduct) return getMetricByMonth(selectedProduct, selectedYear, activeMonth)?.performance ?? 0;

    return yearOverYearData.length === 0
      ? 0
      : Number(
          (
            yearOverYearData.reduce((sum, product) => sum + product.current, 0) / yearOverYearData.length
          ).toFixed(1),
        );
  }, [activeMonth, hasDataForYear, selectedProduct, selectedYear, yearOverYearData]);

  const maxYoY = Math.max(
    1,
    ...yearOverYearData.map((entry) => Math.max(entry.current, entry.previous)),
  );

  const handleSeriesMouseMove = (
    event: MouseEvent<SVGPolylineElement>,
    product: (typeof PRODUCTS)[number],
    color: string,
  ) => {
    if (!svgRef.current || availableMonths.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const boundedX = Math.min(Math.max(cursorX, chartPadding.left), chartWidth - chartPadding.right);

    const closestMonth = availableMonths.reduce((closest, month) => {
      const currentDistance = Math.abs(lineChartData.xForMonth(month) - boundedX);
      const closestDistance = Math.abs(lineChartData.xForMonth(closest) - boundedX);
      return currentDistance < closestDistance ? month : closest;
    }, availableMonths[0]);

    const monthValue = getMetricByMonth(product, selectedYear, closestMonth)?.performance ?? 0;
    const availableUntilMonth = availableMonths.filter((month) => month <= closestMonth);
    const cumulativeValue =
      availableUntilMonth.length === 0
        ? monthValue
        : Number(
            (
              availableUntilMonth.reduce(
                (sum, month) => sum + (getMetricByMonth(product, selectedYear, month)?.performance ?? 0),
                0,
              ) / availableUntilMonth.length
            ).toFixed(1),
          );

    setHoverPoint({
      productId: product.id,
      productName: product.name,
      color,
      month: closestMonth,
      value: monthValue,
      cumulativeValue,
      x: lineChartData.xForMonth(closestMonth),
      y: lineChartData.yForValue(monthValue),
    });
  };

  const hoverTooltip = hoverPoint
    ? {
        monthLabel: MONTH_LABELS[hoverPoint.month - 1],
        x: Math.min(
          Math.max(hoverPoint.x + 10, chartPadding.left),
          chartWidth - chartPadding.right - chartTooltipWidth,
        ),
        y: Math.max(chartPadding.top, hoverPoint.y - chartTooltipHeight - 10),
      }
    : null;

  return (
    <section className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Faturamento do mes ({selectedProduct?.name ?? "Todos"})
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(monthRevenue)}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Custo do mes ({selectedProduct?.name ?? "Todos"})
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(monthCost)}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Performance do mes ({selectedProduct?.name ?? "Todos"})
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{percentFormatter.format(monthPerformance)}%</p>
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Comparativo de performance
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              selecione um produto
            </p>
          </div>
          <label className="flex w-full flex-col gap-2 text-xs text-muted-foreground md:w-40">
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
        </div>

        {hasDataForYear ? (
          <>
            <div className="mt-4 overflow-x-auto">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="min-w-[740px] w-full"
                onMouseLeave={() => setHoverPoint(null)}
              >
                {[0, 1, 2, 3, 4].map((step) => {
                  const value =
                    lineChartData.safeMin + ((lineChartData.safeMax - lineChartData.safeMin) / 4) * step;
                  const y = lineChartData.yForValue(value);
                  return (
                    <g key={step}>
                      <line
                        x1={chartPadding.left}
                        y1={y}
                        x2={chartWidth - chartPadding.right}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={0.12}
                      />
                      <text
                        x={chartPadding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-muted-foreground text-[10px]"
                      >
                        {percentFormatter.format(value)}%
                      </text>
                    </g>
                  );
                })}

                {MONTH_LABELS.map((label, monthIndex) => {
                  const month = monthIndex + 1;
                  const x = lineChartData.xForMonth(month);
                  const isAvailable = availableMonths.includes(month);
                  return (
                    <text
                      key={label}
                      x={x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                      opacity={isAvailable ? 1 : 0.35}
                    >
                      {label}
                    </text>
                  );
                })}

                {lineChartData.series.map((series) => {
                  const isSelected = selectedProductId === series.product.id;
                  const hasSelection = selectedProductId !== null;
                  return (
                    <polyline
                      key={series.product.id}
                      fill="none"
                      stroke={series.color}
                      strokeWidth={isSelected ? 4 : 2.5}
                      strokeOpacity={hasSelection && !isSelected ? 0.2 : 1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={series.points}
                      className="cursor-pointer"
                      onClick={() => toggleProductSelection(series.product.id)}
                      onMouseMove={(event) => handleSeriesMouseMove(event, series.product, series.color)}
                    />
                  );
                })}

                {hoverPoint && hoverTooltip && (
                  <g pointerEvents="none">
                    <line
                      x1={hoverPoint.x}
                      y1={chartPadding.top}
                      x2={hoverPoint.x}
                      y2={chartHeight - chartPadding.bottom}
                      stroke={hoverPoint.color}
                      strokeOpacity={0.35}
                      strokeDasharray="4 4"
                    />
                    <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4.5" fill={hoverPoint.color} />
                    <g transform={`translate(${hoverTooltip.x}, ${hoverTooltip.y})`}>
                      <rect
                        width={chartTooltipWidth}
                        height={chartTooltipHeight}
                        rx="8"
                        ry="8"
                        fill="hsl(var(--card))"
                        stroke="hsl(var(--border))"
                      />
                      <text x="10" y="16" fontSize="11" fontWeight="600" fill="hsl(var(--foreground))">
                        {hoverPoint.productName}
                      </text>
                      <text x="10" y="32" fontSize="10" fill="hsl(var(--muted-foreground))">
                        Mes {hoverTooltip.monthLabel}: {percentFormatter.format(hoverPoint.value)}%
                      </text>
                      <text x="10" y="47" fontSize="10" fill="hsl(var(--muted-foreground))">
                        Até {hoverTooltip.monthLabel}/{selectedYear}: {percentFormatter.format(hoverPoint.cumulativeValue)}%
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  selectedProductId === null
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-foreground hover:bg-muted/70"
                }`}
              >
                Todos os produtos
              </button>
              {lineChartData.series.map((series) => {
                const isSelected = selectedProductId === series.product.id;
                return (
                  <button
                    key={series.product.id}
                    type="button"
                    onClick={() => toggleProductSelection(series.product.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                    <span>{series.product.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nao ha dados para {selectedYear} ate {dateFormatter.format(yesterday)}.
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Comparativo ano a ano ({MONTH_LABELS[activeMonth - 1]} {selectedYear} vs {selectedYear - 1})
        </h2>

        {hasDataForYear ? (
          <div className="mt-4 space-y-4">
            {yearOverYearData.map((entry) => {
              const currentWidth = `${Math.max((entry.current / maxYoY) * 100, 2)}%`;
              const previousWidth = `${Math.max((entry.previous / maxYoY) * 100, 2)}%`;
              const deltaClass = entry.delta >= 0 ? "text-emerald-600" : "text-red-500";

              return (
                <div key={entry.productId} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{entry.productName}</p>
                    <p className={`text-xs font-medium ${deltaClass}`}>
                      {entry.delta >= 0 ? "+" : ""}
                      {percentFormatter.format(entry.delta)} p.p.
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-xs text-muted-foreground">{selectedYear - 1}</span>
                      <div className="h-2.5 flex-1 rounded-full bg-muted">
                        <div className="h-2.5 rounded-full bg-slate-400" style={{ width: previousWidth }} />
                      </div>
                      <span className="w-12 text-right text-xs text-foreground">
                        {percentFormatter.format(entry.previous)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-xs text-muted-foreground">{selectedYear}</span>
                      <div className="h-2.5 flex-1 rounded-full bg-muted">
                        <div className="h-2.5 rounded-full bg-primary" style={{ width: currentWidth }} />
                      </div>
                      <span className="w-12 text-right text-xs text-foreground">
                        {percentFormatter.format(entry.current)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Comparativo indisponivel para {selectedYear} ate {dateFormatter.format(yesterday)}.
          </div>
        )}
      </article>
    </section>
  );
};

export default StarterHomePage;
