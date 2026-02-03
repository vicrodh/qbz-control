export type StoredConfig = {
  baseUrl: string;
  token: string;
};

const KEY = "qbz-control-config";

export function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { baseUrl: "", token: "" };
    }
    const parsed = JSON.parse(raw) as Partial<StoredConfig>;
    return {
      baseUrl: parsed.baseUrl || "",
      token: parsed.token || ""
    };
  } catch {
    return { baseUrl: "", token: "" };
  }
}

export function saveConfig(config: StoredConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(KEY);
}
