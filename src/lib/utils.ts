import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date | number | undefined | null) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(input: string | Date | number | undefined | null) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = formatDate(d);
  const timePart = d.toLocaleTimeString();
  return `${datePart}, ${timePart}`;
}
