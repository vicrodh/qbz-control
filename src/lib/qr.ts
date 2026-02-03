export type QrConfig = {
  baseUrl: string;
  token: string;
  name?: string;
  version?: string;
};

export function parseQrPayload(payload: string): QrConfig | null {
  const trimmed = payload.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const json = JSON.parse(trimmed) as {
      url?: string;
      token?: string;
      api_key?: string;
      name?: string;
      version?: string;
    };

    const baseUrl = json.url?.trim();
    const token = (json.token || json.api_key || "").trim();

    if (!baseUrl || !token) {
      return null;
    }

    return {
      baseUrl,
      token,
      name: json.name,
      version: json.version
    };
  } catch {
    return null;
  }
}
