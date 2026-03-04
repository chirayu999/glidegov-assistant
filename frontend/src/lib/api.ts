const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(Array.isArray(err.error) ? err.error.join(", ") : err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

// --- Sessions ---
export interface SessionCreateResponse {
  session_id: string;
  status: string;
  locale: string;
  created_at: string;
}

export interface SessionShowResponse {
  session_id: string;
  status: string;
  locale: string;
  last_step: string | null;
  expires_at: string | null;
  last_progress: {
    scheme_id: number;
    scheme_name: string;
    current_step_index: number;
    total_steps: number;
    state: string;
    progress_percentage: number;
  } | null;
}

export interface SessionUpdateParams {
  last_step?: string;
  status?: string;
}

export function createSession(locale = "en"): Promise<SessionCreateResponse> {
  return request("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ locale }),
  });
}

export function getSession(id: string): Promise<SessionShowResponse> {
  return request(`/api/sessions/${id}`);
}

export function updateSession(id: string, params: SessionUpdateParams): Promise<{ session_id: string; status: string; last_step: string | null }> {
  return request(`/api/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}

// --- Conversation turns ---
export interface Turn {
  id: number;
  role: "user" | "assistant";
  content_text: string | null;
  content_type: string;
  created_at: string;
}

export interface TurnsIndexResponse {
  session_id: string;
  turns: Turn[];
}

export interface CreateTurnParams {
  role: "user" | "assistant";
  content_text: string;
  content_type?: string;
}

export function getTurns(sessionId: string): Promise<TurnsIndexResponse> {
  return request(`/api/sessions/${sessionId}/turns`);
}

export function createTurn(sessionId: string, turn: CreateTurnParams): Promise<Turn> {
  return request(`/api/sessions/${sessionId}/turns`, {
    method: "POST",
    body: JSON.stringify({
      turn: { ...turn, content_type: turn.content_type ?? "text" },
    }),
  });
}

// --- Session schemes (discovered + eligibility) ---
export interface SessionSchemeEligibility {
  status: "eligible" | "action_required" | "ineligible";
  reason: string | null;
  missing_info: string[];
}

export interface SessionScheme {
  id: number;
  name: string;
  summary: string | null;
  source_url: string | null;
  domain: string | null;
  eligibility: SessionSchemeEligibility | null;
}

export interface SessionSchemesResponse {
  schemes: SessionScheme[];
}

export function getSessionSchemes(sessionId: string): Promise<SessionSchemesResponse> {
  return request(`/api/sessions/${sessionId}/schemes`);
}

// --- Scheme discovery ---
export interface DiscoverScheme {
  id: number;
  external_id: string;
  name: string;
  source_url: string | null;
  domain: string | null;
  summary: string | null;
}

export interface DiscoverSyncResponse {
  schemes: DiscoverScheme[];
}

export interface DiscoverAsyncResponse {
  job_id: string;
  status: string;
}

export function discoverSchemes(
  sessionId: string,
  query: string,
  async = true
): Promise<DiscoverSyncResponse | DiscoverAsyncResponse> {
  const params = new URLSearchParams({ query, session_id: sessionId });
  if (async) params.set("async", "true");
  return request(`/api/schemes/discover?${params}`, { method: "POST" });
}

// --- Eligibility check ---
export interface EligibilityResultItem {
  scheme_id: number;
  scheme_name: string;
  status: "eligible" | "action_required" | "ineligible" | "error";
  reason?: string;
  missing_info?: string[];
}

export interface EligibilityCheckResponse {
  results: EligibilityResultItem[];
}

export interface EligibilityCheckAsyncResponse {
  job_id: string;
  status: string;
}

export function checkEligibility(
  sessionId: string,
  schemeIds: number[],
  profile: Record<string, unknown>,
  async = true
): Promise<EligibilityCheckResponse | EligibilityCheckAsyncResponse> {
  const body: Record<string, unknown> = { session_id: sessionId, scheme_ids: schemeIds, profile };
  const url = async ? "/api/eligibility/check?async=true" : "/api/eligibility/check";
  return request(url, { method: "POST", body: JSON.stringify(body) });
}

// --- Form navigation ---
export interface FormNavigationStartResponse {
  job_id: string;
  status: string;
}

export function startFormNavigation(
  sessionId: string,
  schemeId: string,
  startUrl: string,
  piiData?: Record<string, string>
): Promise<FormNavigationStartResponse> {
  return request("/api/form_navigation/start", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      scheme_id: schemeId,
      start_url: startUrl,
      pii_data: piiData ?? {},
    }),
  });
}

export function submitFormData(sessionId: string, data: Record<string, string>): Promise<{ status: string }> {
  return request("/api/form_navigation/submit_data", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, data }),
  });
}

export function submitOtp(sessionId: string, otp: string): Promise<{ status: string }> {
  return request("/api/form_navigation/submit_otp", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, otp }),
  });
}

export interface FormProgressItem {
  scheme_id: number;
  scheme_name: string;
  current_step_index: number;
  total_steps: number;
  state: string;
  progress_percentage: number;
  last_activity_at: string | null;
}

export interface FormStatusResponse {
  session_id: string;
  form_progresses: FormProgressItem[];
}

export function getFormStatus(sessionId: string, schemeId?: string): Promise<FormStatusResponse> {
  const params = new URLSearchParams({ session_id: sessionId });
  if (schemeId) params.set("scheme_id", schemeId);
  return request(`/api/form_navigation/status?${params}`);
}

export { API_URL };
