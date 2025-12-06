// src/api/apiClient.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions extends RequestInit {
  method?: HttpMethod;
  body?: any;
}

const API_BASE = process.env.API_BASE ?? "";

/**
 * Reusable, strongly typed API request wrapper.
 * T = Response type
 * B = Request body type (default: any)
 */
export async function apiRequest<T = any, B = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const { method = "GET", body, headers, ...rest } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    ...rest,
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);

  let json: any = null;
  try {
    json = await res.json();
  } catch (_) {
    json = null;
  }

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json as T;
}
