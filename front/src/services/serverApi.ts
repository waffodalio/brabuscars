import { headers } from "next/headers";
import type { Listing } from "@/types/listing";

/**
 * API reads made by the Next server itself (page metadata), never from the
 * browser. Address of the API, read at run time (one image per commit):
 * `API_INTERNAL_URL` (inside Docker: `http://back:4000/api`), else
 * `NEXT_PUBLIC_API_URL` when absolute (local dev), else the public `/api` of
 * the site the visitor reached.
 */
async function apiBase(): Promise<string> {
  const internal = process.env.API_INTERNAL_URL;
  if (internal) return internal.replace(/\/$/, "");
  const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";
  if (/^https?:\/\//.test(publicUrl)) return publicUrl.replace(/\/$/, "");
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}${publicUrl.replace(/\/$/, "")}`;
}

/**
 * A published listing, or `null` (not found, not published, API slow or
 * down): metadata is a bonus and never delays or breaks the page. The
 * visitor's address is passed on so the API's rate limit counts each
 * visitor, not the front server as one.
 */
export async function fetchPublicListing(id: number): Promise<Listing | null> {
  try {
    const forwardedFor = (await headers()).get("x-forwarded-for");
    const response = await fetch(`${await apiBase()}/listings/${id}`, {
      cache: "no-store",
      headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined,
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { success?: boolean; data?: Listing };
    return body.success && body.data ? body.data : null;
  } catch {
    return null;
  }
}
