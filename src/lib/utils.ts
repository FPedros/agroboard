import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const normalizeCurrencySpacing = (value: string) => value.replace(/\u00a0/g, " ");

const brlStrictFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brlWithoutCentsFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const brlCompactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const formatCurrencyBrl = (value: number) => normalizeCurrencySpacing(brlStrictFormatter.format(value));

export const formatCurrencyBrlDashboard = (value: number) => {
  const absValue = Math.abs(value);

  if (absValue >= 100_000) {
    return normalizeCurrencySpacing(brlCompactFormatter.format(value));
  }

  if (Number.isInteger(value)) {
    return normalizeCurrencySpacing(brlWithoutCentsFormatter.format(value));
  }

  return normalizeCurrencySpacing(brlStrictFormatter.format(value));
};
