export async function searchCandidates(prompt: string): Promise<any> {
  const resp = await fetch(`${process.env.API_BASE}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: prompt,
      limit: 15,
    }),
  });
  if (!resp.ok) {
    throw new Error(`API request failed with status ${resp.status}`);
  }
  return resp;
}
