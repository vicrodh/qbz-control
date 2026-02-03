import type { ApiConfig } from "./types";

export async function apiFetch(
  config: ApiConfig,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!config.baseUrl || !config.token) {
    throw new Error("Missing connection settings");
  }

  const headers = new Headers(options.headers || {});
  headers.set("X-API-Key", config.token);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res;
}

export async function apiJson<T>(
  config: ApiConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(config, path, options);
  return res.json() as Promise<T>;
}

export function buildWsUrl(config: ApiConfig): string {
  const url = new URL(config.baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/ws";
  url.search = `token=${encodeURIComponent(config.token)}`;
  return url.toString();
}
