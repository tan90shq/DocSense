const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8001" : "");

export interface Session {
  session_id: number;
  session_title?: string;
  previous_chats: [string, string | { answer: string; citations?: any[] }][];
  chat_summary: string;
}

export interface Citation {
  source_text: string;
  file_name: string;
  page: number;
}

export interface AnswerResponse {
  answer: string;
  citations: Citation[];
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function createSession(): Promise<{ message: string; session_id: number }> {
  const res = await fetch(`${API_BASE}/session-create`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function deleteSession(sessionId: number): Promise<{ message: string; session_id: number }> {
  const res = await fetch(`${API_BASE}/session-delete/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return res.json();
}

export async function fetchSessionDetails(sessionId: number): Promise<Session> {
  const res = await fetch(`${API_BASE}/session/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session details");
  return res.json();
}

export async function fetchPdfs(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/pdfs`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function uploadPdf(file: File): Promise<{ message: string; file_path: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Upload and ingestion failed");
  }

  return res.json();
}

export async function deletePdf(fileName: string): Promise<{ detail: string; file_name: string }> {
  const res = await fetch(`${API_BASE}/delete/${encodeURIComponent(fileName)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
  return res.json();
}

export function getPdfUrl(fileName: string): string {
  return `${API_BASE}/pdf/${encodeURIComponent(fileName)}`;
}

export async function askQuestion(
  sessionId: number,
  query: string,
  includePdf: string[]
): Promise<AnswerResponse> {
  const res = await fetch(`${API_BASE}/ask?session_id=${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      include_pdf: includePdf,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Query failed");
  }

  return res.json();
}

export interface SettingsData {
  model: string;
  available_models: string[];
  qdrant_status: string;
  api_status: string;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`);
    return res.ok;
  } catch {
    return false;
  }
}
