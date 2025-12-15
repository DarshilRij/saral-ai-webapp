const API_BASE = process.env.API_BASE;

export type SearchStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export interface SearchSessionResponse {
  session_id: string;
  status: SearchStatus;
  status_url: string;
}

export interface SearchStatusResponse {
  status: SearchStatus;
  progress?: number;
  result_url?: string;
}

export async function startSearch(
  query: string,
  limit = 15
): Promise<SearchSessionResponse> {
  const resp = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });

  if (!resp.ok) {
    throw new Error(`Search start failed (${resp.status})`);
  }

  return resp.json();
}

export async function getSearchStatus(
  sessionId: string
): Promise<SearchStatusResponse> {
  const resp = await fetch(
    `${API_BASE}/api/search/status/${sessionId}`
  );

  if (!resp.ok) {
    throw new Error(`Status check failed (${resp.status})`);
  }

  return resp.json();
}

export async function getSearchResult(sessionId: string): Promise<any> {
  const resp = await fetch(
    `${API_BASE}/api/search/result/${sessionId}`
  );

  if (!resp.ok) {
    throw new Error(`Result fetch failed (${resp.status})`);
  }

  return resp.json();
}
