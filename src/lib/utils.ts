import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ApiResponse, PaginatedResponse } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalize API response that may be PaginatedResponse<T> or T[] into { items, total, totalPages }. */
export function getItemsFromResponse<T>(
  response: ApiResponse<PaginatedResponse<T> | T[]>
): { items: T[]; total: number; totalPages: number } | null {
  if (!response.success || response.data == null) return null
  const raw = response.data
  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length, totalPages: 1 }
  }
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    Array.isArray((raw as PaginatedResponse<T>).data)
  ) {
    const p = raw as PaginatedResponse<T>
    return {
      items: p.data,
      total: p.total ?? p.data.length,
      totalPages: p.totalPages ?? 1,
    }
  }
  return null
}
