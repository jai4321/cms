import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the backend base URL.
 * - In a VS Code dev tunnel the frontend hostname contains the port in the subdomain
 *   (e.g. session-3000.inc1.devtunnels.ms). We swap the port to 4000 automatically,
 *   so the tunnel URL never needs to be hardcoded in .env files.
 * - Otherwise falls back to NEXT_PUBLIC_API_URL or http://localhost:4000.
 */
export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.includes('.devtunnels.ms')) {
      return `${protocol}//${hostname.replace(/-(\d+)\./, '-4000.')}`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}
