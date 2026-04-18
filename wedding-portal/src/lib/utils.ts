import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  amount: number,
  options: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    currency = "ILS",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export function slugify(text: string): string {
  const ascii = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]+/g, "")  // ASCII-only: strips Hebrew and other non-ASCII
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return ascii.length >= 2 ? ascii : "vendor";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${path}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
