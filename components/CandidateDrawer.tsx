// CandidateDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Github,
  Linkedin,
  Lock,
  Mail,
  Phone,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Copy,
  Unlock as UnlockIcon,
  Star,
} from "lucide-react";
import { Candidate } from "../types";
import { defaultAvatarBase64, getSkillBadgeClass } from "@/utils/constants";
import {
  fetchContactInfo,
  fetchProfileById,
  fetchSaralInsight, // NEW
} from "@/src/api/candidate";
import {
  fetchGithubInsights,
  GitHubInsights,
} from "@/src/api/githubInsights";

interface CandidateDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
  onUnlock: (
    id: string,
    contact?: { emails?: string[]; phones?: string[] } | undefined
  ) => void;
  userCredits: number;
}

type TabKey = "DETAILS" | "INSIGHTS" | "GITHUB_INSIGHTS" | "CONTACT";

function parseDurationToMonths(durationStr: string): number {
  if (!durationStr) return 0;
  const s = String(durationStr).toLowerCase().trim();
  let years = 0,
    months = 0;
  const yMatch = s.match(/(\d+)\s*year/);
  if (yMatch) years = parseInt(yMatch[1], 10);
  const mMatch = s.match(/(\d+)\s*month/);
  if (mMatch) months = parseInt(mMatch[1], 10);
  if (years || months) return years * 12 + months;

  // Handle range: "Jan 2022 - Mar 2024" or "Jan 2022 - Present"
  const rangeMatch = s.match(
    /([a-z]{3,}\s*\d{4})\s*-\s*([a-z]{3,}\s*\d{4}|present)?/i
  );
  if (rangeMatch) {
    const parseMonthYear = (t: string) => {
      const parts = t.trim().split(/\s+/);
      if (parts.length >= 2) {
        const month = parts[0].slice(0, 3);
        const year = parseInt(parts[1], 10);
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        return { year, monthIndex };
      }
      return null;
    };
    const start = parseMonthYear(rangeMatch[1]);
    let end;
    if (!rangeMatch[2] || rangeMatch[2].toLowerCase() === "present") {
      // If end date is missing or "present", use current date
      end = {
        year: new Date().getFullYear(),
        monthIndex: new Date().getMonth(),
      };
    } else {
      end = parseMonthYear(rangeMatch[2]);
    }
    if (start && end) {
      const monthsBetween =
        (end.year - start.year) * 12 + (end.monthIndex - start.monthIndex) + 1;
      return Math.max(0, monthsBetween);
    }
  }

  // Handle single date like "Jan 2024"
  const singleDateMatch = s.match(/^([a-z]{3,})\s*(\d{4})$/i);
  if (singleDateMatch) {
    // If only a start date is present, calculate months till today
    const month = singleDateMatch[1].slice(0, 3);
    const year = parseInt(singleDateMatch[2], 10);
    const startDate = new Date(`${month} 1, ${year}`);
    const endDate = new Date();
    // Calculate months difference
    let months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1;
    return Math.max(0, months);
  }

  // Fallback: do not treat year as months
  return 0;
}

export default function CandidateDrawer({
  candidate,
  onClose,
  onUnlock,
  userCredits,
}: CandidateDrawerProps) {
  // Tabs / generic UI
  const [activeTab, setActiveTab] = useState<TabKey>("DETAILS");
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [tooltip, setTooltip] = useState<null | {
    x: number;
    y: number;
    label: string;
  }>(null);

  // Profile fetch (basic LinkedIn / profile info)
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // NEW: SARAL insights state (lazy-loaded when tab clicked)
  const [saralLoading, setSaralLoading] = useState(false);
  const [saralError, setSaralError] = useState<string | null>(null);
  const [saralData, setSaralData] = useState<any>(null);

  // NEW: GitHub insights state (lazy-loaded when tab clicked)
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubData, setGithubData] = useState<GitHubInsights | null>(null);


  // ---------- RAW MERGE LAYER ----------
  const raw = useMemo(() => {
    const candidateRaw = (candidate as any)?._raw ?? {};

    // Start with raw + profile
    const base: any = {
      ...(candidateRaw || {}),
      ...(profileData?.data ?? {}),
    };

    // If SARAL response available, force its profile_summary into raw.profile_summary
    // This gives us:
    //   - profile_summary.one_line_overview  -> AI verdict
    //   - profile_summary.saral_insight.*   -> strengths / red_flags / best_fit_roles
    if (saralData?.profile_summary) {
      base.profile_summary = {
        ...(base.profile_summary ?? {}),
        ...saralData.profile_summary,
      };
    } else if (saralData?.data?.profile_summary) {
      base.profile_summary = {
        ...(base.profile_summary ?? {}),
        ...saralData.data.profile_summary,
      };
    }

    return base;
  }, [candidate, profileData, saralData]);

  // ---------- INSIGHTS MAPPING LAYER ----------
  const insights = useMemo(() => {
    const fromApi =
      raw?.profile_summary ??
      raw?.insights ??
      (candidate as any)?.insights ??
      {};

    const strengths =
      fromApi?.saral_insight?.strengths ??
      fromApi?.strengths ??
      raw?.strengths ??
      [];

    const redFlags =
      fromApi?.saral_insight?.red_flags ??
      fromApi?.redFlags ??
      raw?.redFlags ??
      [];

    // AI verdict ← one_line_overview (from SARAL)
    const careerVerdict =
      fromApi?.one_line_overview ?? raw?.one_line_overview ?? "No verdict";

    const profExp = Array.isArray(fromApi?.professional_experience)
      ? fromApi.professional_experience
      : raw?.experience ?? raw?.experience_list ?? [];

    const trajectory =
      Array.isArray(profExp) && profExp.length
        ? profExp.map((exp: any) => {
          let duration =
            exp.duration ??
            exp.duration_display ??
            exp.duration_text ??
            exp.dates ??
            exp.company_and_dates ??
            exp.caption ??
            "";

          // If only start_date is present, build duration string for parseDurationToMonths
          if (!duration && exp.start_date?.year) {
            duration = `${exp.start_date?.month ?? ""} ${exp.start_date?.year
              }`;
          }

          const months = parseDurationToMonths(duration);
          return {
            role: exp.job_title ?? exp.title ?? exp.role ?? "—",
            company:
              String(exp.company ?? exp.company_and_dates ?? "")
                .split("•")[0]
                .trim() ||
              exp.company ||
              "—",
            durationRaw: duration,
            months,
            is_current:
              !!exp.is_current ||
              (String(duration).toLowerCase().includes("present")
                ? true
                : false),
          };
        })
        : [];

    return {
      strengths,
      redFlags,
      careerVerdict,
      trajectory,
      // Alternate role suggestions ← best_fit_roles
      bestFitRoles: fromApi?.saral_insight?.best_fit_roles ?? [],
    };
  }, [candidate, raw]);

  // ---------- WORK HISTORY ----------
  const workHistory = useMemo(() => {
    const rawExp =
      raw?.experience ??
      raw?.experience_list ??
      raw?.profile_summary?.professional_experience ??
      [];
    if (!Array.isArray(rawExp) || rawExp.length === 0) return [];
    return rawExp.map((e: any) => {
      let durationStr =
        e.duration ??
        e.duration_display ??
        e.duration_text ??
        e.caption ??
        (e.start_date?.year
          ? `${e.start_date?.month ?? ""} ${e.start_date?.year}`
          : "");

      // Extract clean "Feb 2025 - Present" (remove trailing "· 8 mos")
      let cleanDuration = durationStr
        .replace(/·\s*\d+\s*(mos?|months?)/i, "")
        .trim();

      // Parse months normally
      const months = parseDurationToMonths(durationStr);

      return {
        role: e.title ?? e.job_title ?? e.role ?? "—",
        company:
          (e.subtitle ?? e.company_and_dates ?? "").split("•")[0].trim() ||
          e.company ||
          "—",
        duration: cleanDuration,
        months,
        description:
          e.subComponents &&
            Array.isArray(e.subComponents) &&
            e.subComponents.length
            ? e.subComponents[0].description &&
              Array.isArray(e.subComponents[0].description)
              ? e.subComponents[0].description
                .map((d: any) => (d.text ? d.text : ""))
                .join("\n")
              : e.subComponents[0].description
            : e.description ?? "",
      };
    });
  }, [raw]);

  // Alternate role suggestions: already mapped from best_fit_roles above
  const alternateRoles = useMemo(() => {
    const apiRoles =
      raw?.profile_summary?.saral_insight?.best_fit_roles ??
      raw?.saral_insight?.best_fit_roles ??
      insights.bestFitRoles ??
      [];
    if (Array.isArray(apiRoles) && apiRoles.length) return apiRoles.slice(0, 6);
    const titles =
      (raw?.experience ?? []).map((e: any) => e.title).filter(Boolean) ?? [];
    const unique = Array.from(new Set(titles));
    const fallback = [
      "Backend Engineer",
      "Automation Engineer",
      "SRE / DevOps",
      "API Engineer",
      "Data Engineer",
    ];
    return [...unique, ...fallback].slice(0, 6);
  }, [raw, insights]);

  const education = (candidate as any)?.education ?? raw?.education ?? "";

  const resolveLinkedin = (): string => {
    const url =
      (candidate as any)?.socials?.linkedinUrl ||
      (candidate as any)?.linkedin ||
      raw?.linkedin_url ||
      raw?.linkedin ||
      raw?.profile_summary?.linkedin_url ||
      (candidate as any)?.profile?.linkedin_url ||
      raw?.linkedinUrl ||
      "";

    if (!url) return "";

    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }

    return url;
  };

  const candidateId = (candidate as any)?.id
    ? String((candidate as any).id)
    : null;

  // fetch basic profile when candidate.id changes
  useEffect(() => {
    let cancelled = false;

    const doFetch = async (id: string) => {
      setProfileError(null);
      setProfileLoading(true);
      try {
        const resp = await fetchProfileById(id);
        if (cancelled) return;
        if (!resp || !resp.success) {
          const msg = resp?.message ?? "Failed to fetch profile";
          throw new Error(msg);
        }
        setProfileData(resp);
      } catch (err: any) {
        console.error("[CandidateDrawer] fetch profile error:", err);
        if (!cancelled)
          setProfileError(err?.message ?? "Failed to load profile");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    if (candidateId) {
      doFetch(candidateId);
    } else {
      setProfileData(null);
    }

    // Reset SARAL insights when candidate changes
    setSaralData(null);
    setSaralError(null);
    setSaralLoading(false);

    // Reset GitHub insights when candidate changes
    setGithubData(null);
    setGithubError(null);
    setGithubLoading(false);

    setActiveTab("DETAILS");

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  // contact unlock flow (unchanged)
  const handleUnlockClick = () => {
    if (userCredits >= 5) {
      setShowUnlockConfirm(true);
    } else {
      alert("Not enough credits to unlock contact info.");
    }
  };

  const confirmUnlock = async () => {
    if (!candidate) return;
    setUnlocking(true);
    try {
      if (!candidateId) {
        onUnlock(candidate.id, undefined);
        setShowUnlockConfirm(false);
        alert(
          "No candidate ID available. Credits used but contact not fetched."
        );
        return;
      }

      const resp = await fetchContactInfo(candidateId);
      if (!resp?.success) {
        onUnlock(candidate.id, undefined);
        alert("Failed to fetch contact info: " + (resp?.message ?? "unknown"));
        return;
      }

      const emails: string[] = resp.data?.emails ?? [];
      const phones: string[] = resp.data?.phones ?? [];

      onUnlock(candidate.id, { emails, phones });
    } catch (err: any) {
      console.error("confirmUnlock error:", err);
      alert("Error unlocking contact: " + (err?.message ?? String(err)));
      onUnlock(candidate.id, undefined);
    } finally {
      setShowUnlockConfirm(false);
      setUnlocking(false);
    }
  };

  // NEW: when SARAL tab is clicked, lazy-load insights
  const handleInsightsClick = () => {
    setActiveTab("INSIGHTS");
    if (!candidate?.id || saralData || saralLoading) return;

    (async () => {
      try {
        setSaralError(null);
        setSaralLoading(true);
        const resp = await fetchSaralInsight(String((candidate as any).id));
        if (!resp || !resp.success) {
          throw new Error(resp?.message ?? "Failed to load SARAL insights");
        }
        // We only care about resp.data.* (shape from your sample)
        setSaralData(resp.data);
      } catch (err: any) {
        console.error("[CandidateDrawer] fetch SARAL insight error:", err);
        setSaralError(err?.message ?? "Failed to load SARAL insights");
      } finally {
        setSaralLoading(false);
      }
    })();
  };

  // NEW: when GitHub Insights tab is clicked, lazy-load GitHub analytics
  const handleGithubInsightsClick = () => {
    setActiveTab("GITHUB_INSIGHTS");
    if (!candidate?.socials?.githubUrl || githubData || githubLoading) return;

    (async () => {
      try {
        setGithubError(null);
        setGithubLoading(true);
        const data = await fetchGithubInsights(candidate.socials.githubUrl);
        setGithubData(data);
      } catch (err: any) {
        console.error("[CandidateDrawer] fetch GitHub insights error:", err);
        setGithubError(err?.message ?? "Failed to load GitHub insights");
      } finally {
        setGithubLoading(false);
      }
    })();
  };


  // Chart helpers
  const trajectory = insights.trajectory || [];
  const maxMonths = Math.max(12, ...trajectory.map((t: any) => t.months || 0));
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxMonths * i) / yTicks)
  );

  const totalExperience =
    (candidate as any)?.total_experience ??
    profileData?.data?.total_experience ??
    profileData?.data?.role_experience ??
    null;

  const avatarUrl =
    profileData?.data?.profile_image ||
    (candidate as any)?.avatarUrl ||
    (candidate as any)?.profile_image ||
    null;

  const title =
    (candidate as any)?.title ??
    profileData?.data?.headline ??
    profileData?.data?.role ??
    "";

  const bio =
    (candidate as any)?.bio ??
    raw?.about ??
    (candidate as any)?._raw?.headline ??
    raw?.headline ??
    "";

  if (!candidate) return null;

  // ---------- render ----------
  return (
    <>
      <div
        className="fixed inset-0 bg-[#111827]/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full md:w-[720px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-[#E5E7EB] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-start">
          <div className="flex gap-4 min-w-0">
            <div className="flex-none w-16 h-16 md:w-16 md:h-16 rounded-2xl bg-[#F9FAFB] overflow-hidden shadow-sm border border-[#E5E7EB]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  className="w-full h-full object-cover"
                  alt=""
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (
                      img.src &&
                      img.src.startsWith("data:image/svg+xml;base64")
                    ) {
                      img.onerror = null;
                      return;
                    }
                    img.onerror = null;
                    img.src = defaultAvatarBase64(
                      (candidate?.name as string) || String(candidate?.id)
                    );
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl text-[#9CA3AF] select-none">
                  {String(candidate?.name || candidate?.id || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-lg font-bold text-[#111827]">
                {profileLoading ? (
                  <span className="h-5 w-40 bg-gray-100 rounded animate-pulse block" />
                ) : (
                  profileData?.data?.name ?? candidate.name
                )}
              </div>

              {/* headline + location: allow wrapping */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mt-1 min-w-0">
                <div className="whitespace-normal break-words flex-1 min-w-0">
                  {profileLoading ? (
                    <span className="h-4 w-60 bg-gray-100 rounded animate-pulse block" />
                  ) : (
                    title
                  )}
                </div>

                <span className="text-gray-300">•</span>

                <div className="flex items-center gap-1 whitespace-nowrap">
                  <MapPin className="w-3.5 h-3.5" />
                  {profileLoading ? (
                    <span className="h-4 w-40 bg-gray-100 rounded animate-pulse block" />
                  ) : (
                    profileData?.data?.location ?? candidate.location
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2 items-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${(candidate.matchScore ?? 0) > 90
                    ? "bg-green-50 text-[#059669] border-green-200"
                    : "bg-indigo-50 text-[#4338CA] border-indigo-200"
                    }`}
                >
                  {candidate.matchScore ?? 100}% Match
                </span>
                {resolveLinkedin() && (
                  <a
                    href={resolveLinkedin()}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-full text-[#9CA3AF] hover:text-[#0A66C2] hover:bg-blue-50 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}

                {candidate.socials?.github && (
                  <a
                    href={candidate.socials.githubUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-full text-[#9CA3AF] hover:text-[#111827] hover:bg-gray-50 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F3F4F6] rounded-full text-[#9CA3AF] hover:text-[#111827] transition-colors"
              aria-label="Close candidate drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white sticky top-[72px] z-30">
          <div
            role="tablist"
            aria-label="Candidate sections"
            className="flex items-center gap-3"
          >
            <button
              role="tab"
              aria-selected={activeTab === "DETAILS"}
              onClick={() => setActiveTab("DETAILS")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "DETAILS"
                ? "bg-[#4338CA] text-white"
                : "text-[#6B7280] bg-white border border-[#E5E7EB]"
                }`}
            >
              Details
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "INSIGHTS"}
              onClick={handleInsightsClick} // NEW
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all inline-flex items-center gap-2 ${activeTab === "INSIGHTS"
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md"
                : "text-[#6B7280] bg-white border border-[#E5E7EB]"
                }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white/10">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>SARAL Insights</span>
                <Star
                  className={`w-4 h-4 ${activeTab === "INSIGHTS"
                    ? "text-white/90"
                    : "text-[#9CA3AF]"
                    }`}
                />
              </div>
            </button>

            {candidate?.socials?.githubUrl && (
              <button
                role="tab"
                aria-selected={activeTab === "GITHUB_INSIGHTS"}
                onClick={handleGithubInsightsClick}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all inline-flex items-center gap-2 ${activeTab === "GITHUB_INSIGHTS"
                  ? "bg-[#24292F] text-white shadow-md"
                  : "text-[#6B7280] bg-white border border-[#E5E7EB]"
                  }`}
                disabled={!candidate.socials?.githubUrl}
              >
                <Github className="w-4 h-4" />
                <span>GitHub Insights</span>
              </button>
            )}

            <button
              role="tab"
              aria-selected={activeTab === "CONTACT"}
              onClick={() => setActiveTab("CONTACT")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "CONTACT"
                ? "bg-[#4338CA] text-white"
                : "text-[#6B7280] bg-white border border-[#E5E7EB]"
                }`}
            >
              Contact Details
              {candidate.contactUnlocked ? (
                <UnlockIcon
                  className={`w-4 h-4 ${activeTab === "CONTACT" ? "text-white/90" : "text-[#6B7280]"
                    }`}
                />
              ) : (
                <Lock
                  className={`${activeTab === "CONTACT" ? "text-white/90" : "text-[#6B7280]"
                    } w-4 h-4`}
                />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* DETAILS */}
          {activeTab === "DETAILS" && (
            <section>
              {/* Skills, Experience, Education, About */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileLoading
                    ? // skeleton for skills
                    Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-6 w-16 bg-gray-100 rounded animate-pulse block"
                      />
                    ))
                    : (profileData?.data?.skills ?? candidate.skills ?? [])
                      .length > 0
                      ? (profileData?.data?.skills ?? candidate.skills ?? [])
                        .slice(0, 12)
                        .map((s: string) => (
                          <span
                            key={s}
                            className={`text-xs px-3 py-1 rounded-full border ${getSkillBadgeClass(
                              s
                            )}`}
                          >
                            {s}
                          </span>
                        ))
                      : (raw?.experience ?? [])
                        .flatMap((e: any) => e.skills ?? [])
                        .slice(0, 12)
                        .map((s: string) => (
                          <span
                            key={s}
                            className={`text-xs px-3 py-1 rounded-full border ${getSkillBadgeClass(
                              s
                            )}`}
                          >
                            {s}
                          </span>
                        ))}
                  {(profileData?.data?.skills ?? candidate.skills ?? [])
                    .length === 0 &&
                    (raw?.experience ?? []).flatMap((e: any) => e.skills ?? [])
                      .length === 0 && (
                      <div className="text-sm text-[#9CA3AF]">
                        No skills listed.
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                  Experience
                </h4>
                <div className="space-y-4">
                  {profileLoading ? (
                    // skeleton experience cards
                    Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm animate-pulse"
                      >
                        <div className="h-4 w-40 bg-gray-100 rounded mb-2" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                    ))
                  ) : workHistory.length === 0 ? (
                    <div className="text-sm text-[#9CA3AF]">
                      No experience data.
                    </div>
                  ) : (
                    workHistory.map((job: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="text-sm font-bold text-[#111827]">
                              {job.role}
                            </div>
                            <div className="text-sm text-[#6B7280]">
                              {job.company} •{" "}
                              <span className="text-[#9CA3AF]">
                                {job.duration}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-[#6B7280] flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span>
                              {typeof job.months === "number" &&
                                job.months > 0 ? (
                                job.months >= 12 ? (
                                  <>
                                    {Math.floor(job.months / 12)}y{" "}
                                    {job.months % 12 > 0
                                      ? `${job.months % 12}m`
                                      : ""}
                                  </>
                                ) : (
                                  `${job.months}m`
                                )
                              ) : (
                                "—"
                              )}
                            </span>
                          </div>
                        </div>
                        {job.description && (
                          <p className="mt-3 text-sm text-[#4B5563] whitespace-pre-wrap">
                            {job.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                  Education
                </h4>
                {profileLoading ? (
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-3 text-sm text-[#4B5563]">
                    <GraduationCap className="w-4 h-4 text-[#9CA3AF]" />{" "}
                    <div>{education || "Not specified"}</div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-2">
                  About
                </h4>
                <div className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">
                  {profileLoading ? (
                    <>
                      <div className="h-3 w-full bg-gray-100 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-5/6 bg-gray-100 rounded mb-2 animate-pulse" />
                    </>
                  ) : (
                    bio || "No bio available."
                  )}
                </div>
              </div>
            </section>
          )}

          {/* INSIGHTS */}
          {activeTab === "INSIGHTS" && (
            <section>
              {/* Error state */}
              {saralError && !saralLoading && !saralData && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {saralError}
                </div>
              )}

              {/* Skeleton while fetching SARAL insights */}
              {saralLoading && !saralData ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-56 bg-gray-200 rounded" />
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 bg-gray-100 rounded-xl" />
                    <div className="h-32 bg-gray-100 rounded-xl" />
                  </div>

                  <div className="h-20 bg-gray-100 rounded-xl" />

                  <div className="h-56 bg-gray-100 rounded-xl" />

                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#111827] uppercase tracking-widest">
                        SARAL Insights
                      </div>
                      <div className="text-sm text-[#6B7280]">
                        Career trajectory, strengths & Red Flags
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-white/10 border border-white/10">
                        <Star className="w-4 h-4 text-white/90" />
                        <span className="ml-1 text-xs text-white/90">AI</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths / Red flags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-green-50/50 rounded-xl p-5 border border-green-100">
                      <div className="text-xs font-bold text-[#059669] uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Strengths
                      </div>
                      <ul className="space-y-2">
                        {(insights.strengths || []).map(
                          (s: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-[#374151] font-medium flex items-start gap-2"
                            >
                              <span className="w-1 h-1 rounded-full bg-[#10B981] mt-2 flex-shrink-0" />
                              {s}
                            </li>
                          )
                        )}
                        {(insights.strengths || []).length === 0 && (
                          <div className="text-sm text-[#9CA3AF]">
                            No strengths detected.
                          </div>
                        )}
                      </ul>
                    </div>

                    <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100">
                      <div className="text-xs font-bold text-[#D97706] uppercase tracking-wide mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Red Flags
                      </div>
                      <ul className="space-y-2">
                        {(insights.redFlags || []).map(
                          (s: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-[#374151] font-medium flex items-start gap-2"
                            >
                              <span className="w-1 h-1 rounded-full bg-[#F59E0B] mt-2 flex-shrink-0" />
                              {s}
                            </li>
                          )
                        )}
                        {(insights.redFlags || []).length === 0 && (
                          <div className="text-sm text-[#9CA3AF]">
                            No red flags found.
                          </div>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* AI verdict (mapped from one_line_overview) */}
                  <div className="mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">
                    <div className="text-xs font-bold text-[#111827] uppercase tracking-wide mb-2">
                      AI verdict
                    </div>
                    <div className="text-sm text-[#374151]">
                      {insights.careerVerdict}
                    </div>
                  </div>

                  {/* Alternate roles (from best_fit_roles) */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                      Alternate role suggestions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {alternateRoles.map((r: string, i: number) => (
                        <span
                          key={i}
                          className={`text-xs px-3 py-1 rounded-full border ${getSkillBadgeClass(
                            r
                          )}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Career trajectory chart */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                      Career Trajectory
                    </h4>
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                      <div className="flex items-start gap-6">
                        <div className="flex-1 min-w-0">
                          {/* Line chart version */}
                          <div className="h-56 w-full">
                            {(() => {
                              const W = 600;
                              const H = 220;
                              const padding = {
                                left: 64,
                                right: 24,
                                top: 32, // slightly increased top padding so tooltip doesn't overlap header
                                bottom: 48,
                              };

                              const chartW = W - padding.left - padding.right;
                              const chartH = H - padding.top - padding.bottom;

                              const data = (trajectory || []).slice(0, 10);
                              const maxVal = Math.max(
                                1,
                                ...data.map((t: any) => t.months || 0)
                              );

                              const points = data.map(
                                (node: any, i: number) => {
                                  const x =
                                    padding.left +
                                    (chartW * i) / Math.max(1, data.length - 1);

                                  const y =
                                    padding.top +
                                    chartH -
                                    ((node.months || 0) / maxVal) * chartH;

                                  return {
                                    x,
                                    y,
                                    months: node.months || 0,
                                    label: node.company || node.role || "-",
                                  };
                                }
                              );

                              const pathD = points
                                .map(
                                  (p, i) =>
                                    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
                                )
                                .join(" ");

                              const yTicksCount = 4;
                              const yTickValues = Array.from(
                                { length: yTicksCount + 1 },
                                (_, idx) =>
                                  Math.round((maxVal * idx) / yTicksCount)
                              );

                              // helper to clamp tooltip inside chart bounds
                              const clampTooltip = (tx: number, ty: number) => {
                                const minX = padding.left + 8;
                                const maxX = W - padding.right - 8;
                                const clampedX = Math.max(
                                  minX,
                                  Math.min(tx, maxX)
                                );
                                // keep tooltip at least 8px below top padding
                                const minY = padding.top + 8;
                                const clampedY = Math.max(minY, ty);
                                return { x: clampedX, y: clampedY };
                              };

                              return (
                                <svg
                                  width="100%"
                                  height="100%"
                                  viewBox={`0 0 ${W} ${H}`}
                                  preserveAspectRatio="xMidYMid meet"
                                  style={{ overflow: "visible" }}
                                >
                                  {/* Y Grid + labels */}
                                  {yTickValues.map((val, idx) => {
                                    const y =
                                      padding.top +
                                      chartH -
                                      (val / maxVal) * chartH;

                                    const label =
                                      val >= 12
                                        ? `${Math.round(val / 12)}y`
                                        : `${val}m`;

                                    return (
                                      <g key={idx}>
                                        <line
                                          x1={padding.left}
                                          x2={W - padding.right}
                                          y1={y}
                                          y2={y}
                                          stroke="#F3F4F6"
                                          strokeWidth={1}
                                        />
                                        <text
                                          x={padding.left - 12}
                                          y={y + 4}
                                          fontSize={11}
                                          fill="#9CA3AF"
                                          textAnchor="end"
                                        >
                                          {label}
                                        </text>
                                      </g>
                                    );
                                  })}

                                  {/* X axis */}
                                  <line
                                    x1={padding.left}
                                    x2={W - padding.right}
                                    y1={padding.top + chartH}
                                    y2={padding.top + chartH}
                                    stroke="#E5E7EB"
                                    strokeWidth={1.5}
                                  />

                                  {/* Glow path */}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#8B5CF6"
                                    strokeWidth={12}
                                    opacity={0.18}
                                    strokeLinecap="round"
                                  />

                                  {/* Main line */}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#4338CA"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {/* Points + labels */}
                                  {points.map((p, i) => (
                                    <g key={i}>
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={6}
                                        fill="#fff"
                                        stroke="#4338CA"
                                        strokeWidth={2.5}
                                        onMouseEnter={() =>
                                          setTooltip({
                                            x: p.x,
                                            y: p.y,
                                            label:
                                              p.months >= 12
                                                ? `${Math.floor(
                                                  p.months / 12
                                                )}y ${p.months % 12}m`
                                                : `${p.months}m`,
                                          })
                                        }
                                        onMouseLeave={() => setTooltip(null)}
                                        style={{ cursor: "pointer" }}
                                      />

                                      {/* Company label under X axis */}
                                      <text
                                        x={p.x}
                                        y={padding.top + chartH + 18}
                                        fontSize={11}
                                        fill="#6B7280"
                                        textAnchor="middle"
                                      >
                                        {p.label.length > 18
                                          ? p.label.slice(0, 18) + "…"
                                          : p.label}
                                      </text>
                                    </g>
                                  ))}

                                  {/* Tooltip (clamped) */}
                                  {tooltip &&
                                    (() => {
                                      const pos = clampTooltip(
                                        tooltip.x,
                                        tooltip.y - 12
                                      );
                                      // tooltip rectangle centered on pos.x
                                      const rectW = 84;
                                      const rectH = 26;
                                      const rectX = pos.x - rectW / 2;
                                      const rectY = pos.y - rectH - 12; // above the point
                                      return (
                                        <g>
                                          <rect
                                            x={rectX}
                                            y={rectY}
                                            width={rectW}
                                            height={rectH}
                                            rx={8}
                                            fill="#111827"
                                          />
                                          <text
                                            x={pos.x}
                                            y={rectY + rectH / 2 + 4}
                                            fontSize={11}
                                            fill="#fff"
                                            textAnchor="middle"
                                          >
                                            {tooltip.label}
                                          </text>
                                        </g>
                                      );
                                    })()}
                                </svg>
                              );
                            })()}
                          </div>

                          <div className="mt-2 text-xs text-[#6B7280]">
                            X: company — Y: tenure (months/years)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* GITHUB INSIGHTS */}
          {activeTab === "GITHUB_INSIGHTS" && (
            <section>
              {/* Error state */}
              {githubError && !githubLoading && !githubData && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {githubError}
                </div>
              )}

              {/* Skeleton while fetching GitHub insights */}
              {githubLoading && !githubData ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-56 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 bg-gray-100 rounded-xl" />
                    <div className="h-24 bg-gray-100 rounded-xl" />
                    <div className="h-24 bg-gray-100 rounded-xl" />
                  </div>
                  <div className="h-32 bg-gray-100 rounded-xl" />
                  <div className="h-48 bg-gray-100 rounded-xl" />
                </div>
              ) : githubData ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-md bg-[#24292F] flex items-center justify-center shadow-md">
                      <Github className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#111827] uppercase tracking-widest">
                        GitHub Insights
                      </div>
                      <div className="text-sm text-[#6B7280]">
                        Developer analytics and contribution patterns
                      </div>
                    </div>
                    <a
                      href={`https://github.com/${githubData.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#4338CA] hover:underline flex items-center gap-1"
                    >
                      View Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Developer Score */}
                  <div className="mb-6 bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 text-gray-900 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Developer Score
                        </div>
                        <div className="text-5xl font-bold text-gray-900">
                          {githubData.final_evaluation.developer_score}
                          <span className="text-2xl text-gray-400">/100</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                          Estimated Level
                        </div>
                        <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                          <span className="text-lg font-semibold text-gray-800">
                            {githubData.final_evaluation.estimated_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Overview */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                      <div className="text-xs text-[#6B7280] mb-1">Followers</div>
                      <div className="text-2xl font-bold text-[#111827]">
                        {githubData.profile.followers}
                      </div>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                      <div className="text-xs text-[#6B7280] mb-1">Public Repos</div>
                      <div className="text-2xl font-bold text-[#111827]">
                        {githubData.profile.public_repos}
                      </div>
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                      <div className="text-xs text-[#6B7280] mb-1">Account Age</div>
                      <div className="text-2xl font-bold text-[#111827]">
                        {githubData.profile.account_age_years.toFixed(1)}
                        <span className="text-sm text-[#6B7280] ml-1">yrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                      Activity Overview
                    </h4>
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-center">
                        {/* SVG Radial Graph - Light Mode */}
                        <svg
                          width="280"
                          height="280"
                          viewBox="0 0 280 280"
                          className="overflow-visible"
                        >
                          {/* Grid circles - Changed stroke to #E5E7EB (Gray-200) */}
                          <circle cx="140" cy="140" r="30" fill="none" stroke="#E5E7EB" strokeWidth="1" />
                          <circle cx="140" cy="140" r="60" fill="none" stroke="#E5E7EB" strokeWidth="1" />
                          <circle cx="140" cy="140" r="90" fill="none" stroke="#E5E7EB" strokeWidth="1" />

                          {/* Axis lines - Changed stroke to #E5E7EB (Gray-200) */}
                          <line x1="140" y1="140" x2="140" y2="20" stroke="#E5E7EB" strokeWidth="1" />
                          <line x1="140" y1="140" x2="260" y2="140" stroke="#E5E7EB" strokeWidth="1" />
                          <line x1="140" y1="140" x2="140" y2="260" stroke="#E5E7EB" strokeWidth="1" />
                          <line x1="140" y1="140" x2="20" y2="140" stroke="#E5E7EB" strokeWidth="1" />

                          {/* Data lines - Colors kept vibrant, they pop well on white */}
                          {/* Commits (left) */}
                          <line
                            x1="140"
                            y1="140"
                            x2={140 - (githubData.contribution_style.commits_pct * 1.2)}
                            y2="140"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <circle
                            cx={140 - (githubData.contribution_style.commits_pct * 1.2)}
                            cy="140"
                            r="5"
                            fill="#10B981"
                          />

                          {/* Pull Requests (bottom) */}
                          <line
                            x1="140"
                            y1="140"
                            x2="140"
                            y2={140 + (githubData.contribution_style.pull_requests_pct * 1.2)}
                            stroke="#8B5CF6"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="140"
                            cy={140 + (githubData.contribution_style.pull_requests_pct * 1.2)}
                            r="5"
                            fill="#8B5CF6"
                          />

                          {/* Code Reviews (top) */}
                          <line
                            x1="140"
                            y1="140"
                            x2="140"
                            y2={140 - (githubData.contribution_style.code_reviews_pct * 1.2)}
                            stroke="#3B82F6"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="140"
                            cy={140 - (githubData.contribution_style.code_reviews_pct * 1.2)}
                            r="5"
                            fill="#3B82F6"
                          />

                          {/* Issues (right) */}
                          <line
                            x1="140"
                            y1="140"
                            x2={140 + (githubData.contribution_style.issues_pct * 1.2)}
                            y2="140"
                            stroke="#F59E0B"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <circle
                            cx={140 + (githubData.contribution_style.issues_pct * 1.2)}
                            cy="140"
                            r="5"
                            fill="#F59E0B"
                          />

                          {/* Center dot - darkened slightly to #2563EB for better contrast on white */}
                          <circle cx="140" cy="140" r="6" fill="#2563EB" />

                          {/* Labels - Changed fill to #6B7280 (Gray-500) */}
                          <text
                            x="10"
                            y="145"
                            fill="#6B7280"
                            fontSize="13"
                            fontWeight="500"
                            textAnchor="end"
                          >
                            {githubData.contribution_style.commits_pct}%
                          </text>
                          <text
                            x="10"
                            y="130"
                            fill="#6B7280"
                            fontSize="11"
                            textAnchor="end"
                          >
                            Commits
                          </text>

                          <text
                            x="145"
                            y="275"
                            fill="#6B7280"
                            fontSize="13"
                            fontWeight="500"
                            textAnchor="middle"
                          >
                            {githubData.contribution_style.pull_requests_pct}%
                          </text>
                          <text
                            x="145"
                            y="290"
                            fill="#6B7280"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            Pull requests
                          </text>

                          <text
                            x="145"
                            y="10"
                            fill="#6B7280"
                            fontSize="13"
                            fontWeight="500"
                            textAnchor="middle"
                          >
                            {githubData.contribution_style.code_reviews_pct}%
                          </text>
                          <text
                            x="145"
                            y="22"
                            fill="#6B7280"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            Code review
                          </text>

                          <text
                            x="270"
                            y="145"
                            fill="#6B7280"
                            fontSize="13"
                            fontWeight="500"
                            textAnchor="start"
                          >
                            {githubData.contribution_style.issues_pct}%
                          </text>
                          <text
                            x="270"
                            y="130"
                            fill="#6B7280"
                            fontSize="11"
                            textAnchor="start"
                          >
                            Issues
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Activity Metrics */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                      Activity Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="text-xs text-[#6B7280] mb-1">Total Commits</div>
                        <div className="text-2xl font-bold text-[#111827]">
                          {githubData.activity.total_commits.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="text-xs text-[#6B7280] mb-1">Avg Commits/Month</div>
                        <div className="text-2xl font-bold text-[#111827]">
                          {githubData.activity.avg_commits_per_month.toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="text-xs text-[#6B7280] mb-1">Consistency Score</div>
                        <div className="text-2xl font-bold text-[#111827]">
                          {githubData.activity.consistency_score}
                          <span className="text-sm text-[#6B7280] ml-1">/100</span>
                        </div>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="text-xs text-[#6B7280] mb-1">Active Repos (6mo)</div>
                        <div className="text-2xl font-bold text-[#111827]">
                          {githubData.activity.active_repos_last_6_months}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(githubData.tech_stack)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([lang, count]) => (
                          <span
                            key={lang}
                            className="text-xs px-3 py-1.5 rounded-full border bg-white border-[#E5E7EB] text-[#374151] font-medium"
                          >
                            {lang} ({count})
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Open Source Contributions */}
                  {githubData.open_source.is_open_source_contributor && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                        Open Source Contributions
                      </h4>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <Star className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="text-sm font-semibold text-purple-900">
                              Active Open Source Contributor
                            </div>
                            <div className="text-xs text-purple-700">
                              OSS Score: {githubData.open_source.oss_score}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-purple-700">Pull Requests</div>
                            <div className="text-xl font-bold text-purple-900">
                              {githubData.open_source.prs}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-purple-700">Reviews</div>
                            <div className="text-xl font-bold text-purple-900">
                              {githubData.open_source.reviews}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-purple-700">Issues</div>
                            <div className="text-xl font-bold text-purple-900">
                              {githubData.open_source.issues}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Repository Impact */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                      Repository Impact
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-[#F59E0B]" />
                          <div className="text-xs text-[#6B7280]">Total Stars</div>
                        </div>
                        <div className="text-2xl font-bold text-[#111827]">
                          {githubData.repository_impact.total_stars}
                        </div>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Github className="w-4 h-4 text-[#6B7280]" />
                          <div className="text-xs text-[#6B7280]">Total Forks</div>
                        </div>
                        <div className="text-2xl font-bold text-[#111827]">
                          {githubData.repository_impact.total_forks}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-[#6B7280]">
                  No GitHub profile linked for this candidate.
                </div>
              )}
            </section>
          )}

          {/* CONTACT */}
          {activeTab === "CONTACT" && (
            <section>
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest mb-3">
                Contact Details
              </h4>

              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] relative">
                {!candidate.contactUnlocked && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-6 h-6 text-[#9CA3AF] mb-2" />
                    <p className="text-sm font-medium text-[#111827] mb-3">
                      Unlock contact info
                    </p>

                    {showUnlockConfirm ? (
                      <div className="flex gap-2 w-full max-w-[240px]">
                        <button
                          onClick={() => setShowUnlockConfirm(false)}
                          className="flex-1 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-gray-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmUnlock}
                          disabled={unlocking}
                          className="flex-1 py-1.5 text-xs font-medium bg-[#4338CA] text-white rounded hover:bg-[#312E81]"
                        >
                          {unlocking ? "Unlocking..." : "Use 5 Credits"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleUnlockClick}
                        className="px-4 py-1.5 bg-[#4338CA] text-white rounded-lg text-xs font-medium hover:bg-[#312E81] shadow-sm"
                      >
                        Unlock (5 Credits)
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-sm">
                    <Mail className="w-4 h-4 text-[#9CA3AF]" />
                    <span
                      className={
                        !candidate.contactUnlocked
                          ? "blur-sm"
                          : "text-sm font-medium text-[#111827] select-all"
                      }
                    >
                      {candidate.contactUnlocked
                        ? candidate.email ?? profileData?.data?.email ?? "—"
                        : "user@example.com"}
                    </span>
                    {candidate.contactUnlocked && (
                      <Copy className="w-3 h-3 text-[#D1D5DB] ml-auto cursor-pointer hover:text-[#111827]" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-sm">
                    <Phone className="w-4 h-4 text-[#9CA3AF]" />
                    <span
                      className={
                        !candidate.contactUnlocked
                          ? "blur-sm"
                          : "text-sm font-medium text-[#111827] select-all"
                      }
                    >
                      {candidate.contactUnlocked
                        ? candidate.phone ?? profileData?.data?.phone ?? "—"
                        : "+1 555 000 0000"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
