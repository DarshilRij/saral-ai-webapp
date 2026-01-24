import { apiRequest } from "./apiClient";

interface ProfileResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

interface ContactInfoResponse {
  success: boolean;
  message?: string;
  data: {
    emails: string[];
    phones: string[];
    linkedin_url: string;
  };
}

interface SaralInsightResponseData {
  candidate_id: string;
  candidate_name: string;
  profile_summary: {
    career_stability_overview?: {
      average_tenure?: string;
      current_role?: string;
      total_experience?: string;
    };
    one_line_overview?: string;
    professional_experience?: any[];
    profile_summary?: string;
    saral_insight?: {
      best_fit_roles?: string[];
      red_flags?: string[];
      strengths?: string[];
    };
  };
}

interface SaralInsightResponse {
  success: boolean;
  message?: string;
  data: SaralInsightResponseData;
}

/**
 * Fetch full candidate profile by id.
 */
export async function fetchProfileById(id: string) {
  return apiRequest<ProfileResponse>("/api/profile/" + encodeURIComponent(id), {
    method: "GET",
  });
}

/** existing contact helper kept here for convenience */
export async function fetchContactInfo(candidateId: string) {
  return apiRequest<ContactInfoResponse>(`/api/contact-info/${candidateId}`, {
    method: "GET",
  });
}

/**
 * NEW: Fetch SARAL insight for a candidate.
 * Matches the GET {{SARAL ENDPOINT}}/api/saral-insight/:id shown in Postman.
 */
export async function fetchSaralInsight(candidateId: string) {
  return apiRequest<SaralInsightResponse>(
    "/api/saral-insight/" + encodeURIComponent(candidateId),
    {
      method: "GET",
    }
  );
}
