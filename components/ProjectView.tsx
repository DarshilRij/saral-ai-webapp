import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Filter,
  MoreHorizontal,
  Heart,
  MessageSquare,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  ChevronRight,
  X,
  SlidersHorizontal,
  Search as SearchIcon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Mail,
  Phone,
  Github,
  Linkedin,
  ExternalLink,
  ChevronLeft,
  Send,
  Copy,
  Loader2,
  Check,
} from "lucide-react";
import { Candidate, Project, Sequence } from "../types";
import { generateCandidates } from "../services/geminiService";
import { SequenceBuilder } from "./SequenceBuilder";
import { defaultAvatarBase64 } from "@/utils/constants";
import { exportProjects } from "@/src/api/project";

interface ProjectViewProps {
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  currentProject: Project | null;
  onSelectCandidate: (c: Candidate) => void;
  toggleShortlist: (id: string) => void;
  shortlistedIds: string[];
  sequences: Sequence[];
  onAddSequence: (s: Sequence) => void;
}

interface FilterState {
  minScore: number;
  minExperience: number;
  location: string;
  skill: string;
  company: string;
  avgTenure: string;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  candidates,
  setCandidates,
  currentProject,
  onSelectCandidate,
  toggleShortlist,
  shortlistedIds,
  sequences,
  onAddSequence,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Modals
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [showBulkLinkedInModal, setShowBulkLinkedInModal] = useState(false);

  // Bulk Selection
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);

  // Outreach Modal State
  const [outreachCandidateId, setOutreachCandidateId] = useState<string | null>(
    null
  );
  const [outreachMode, setOutreachMode] = useState<"LINKEDIN" | "MAIL">(
    "LINKEDIN"
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = window.innerWidth < 768;
  const itemsPerPage = isMobile ? 10 : 15;

  // View & Filter State
  const [viewMode, setViewMode] = useState<"search" | "shortlist">("search");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minScore: 0,
    minExperience: 0,
    location: "",
    skill: "",
    company: "",
    avgTenure: "",
  });

  // Bulk LinkedIn State
  const [bulkMessageTemplate, setBulkMessageTemplate] = useState(
    "Hi {{firstName}}, I'm impressed by your work at {{company}}. Let's connect!"
  );

  const loadingSteps = [
    "Fetching profile data from multiple sources...",
    "Running semantic search and LLM matching...",
    "Ranking candidates using weighted scoring...",
    "Preparing insights and match list...",
  ];

  const confirmSearch = () => {
    if (!prompt.trim()) return;
    setShowCreditWarning(true);
  };

  // Replace your existing handleSearch with this version and add the helper below.

  const mapApiResultToCandidate = (r: any): Candidate => {
    // defensive mapping with fallbacks
    const id = String(r.id ?? r.linkedin_url ?? r.profile_pic ?? Math.random());
    const name = r.name ?? "Unknown";
    const avatarUrl =
      defaultAvatarBase64(r.name ?? String(r.id ?? Math.random())) ??
      r.profile_pic ??
      r.profilePic ??
      r.avatarUrl ??
      defaultAvatarBase64(r.name ?? String(r.id ?? Math.random()));
    const location = r.location ?? r.experience?.[0]?.location ?? "";
    const title =
      r.headline ??
      r.experience?.[0]?.title ??
      r.title ??
      (r.experience && r.experience.length ? r.experience[0].title : "") ??
      "";
    const currentCompany =
      r.experience?.find((x: any) => x.is_current)?.company ??
      r.experience?.[0]?.company ??
      r.currentCompany ??
      "";
    const email = r.email ?? null;
    const phone = r.phone ?? null;

    // matchScore: prefer role_match_score (0-1 or maybe 0-100), normalize to 0-100
    let matchScore = 0;
    if (typeof r.experience_score === "number") {
      matchScore =
        r.experience_score > 1 ? r.experience_score : r.experience_score * 100;
    } else if (typeof r.experience_score === "string") {
      const parsed = parseFloat(r.experience_score);
      matchScore = parsed > 1 ? parsed : parsed * 100;
    } else if (typeof r.semantic_similarity === "number") {
      matchScore =
        r.semantic_similarity > 1
          ? r.semantic_similarity
          : r.semantic_similarity * 100;
    } else if (r.score_breakdown?.role_match_score) {
      matchScore = Number(r.score_breakdown.role_match_score);
    }

    const experienceYears =
      Number(
        r.total_experience ?? r.role_experience ?? r.role_experience_years ?? 0
      ) || 0;

    const skills =
      Array.isArray(r.skills) && r.skills.length > 0
        ? r.skills
        : r.experience?.flatMap((exp: any) => exp.skills ?? []) ?? [];

    const socials = {
      linkedin: !!r.linkedin_url || !!r.linkedinUrl || !!r.linkedin,
      linkedinUrl: r.linkedin_url ?? r.linkedinUrl ?? r.linkedin ?? "",
      github: !!r.github,
      githubUrl: r.github ?? "",
    };

    return {
      id,
      name,
      title,
      currentCompany,
      avatarUrl,
      location,
      matchScore: Math.round(matchScore),
      experienceYears,
      skills,
      email,
      phone,
      contactUnlocked: Boolean(email || phone),
      openToWork: Boolean(r.open_to_work || r.openToWork),
      socials,
      // extras used elsewhere in UI
      avgTenure: r.avgTenure ?? "",
      outreachStatus: r.outreachStatus ?? "NOT_CONTACTED",
      // keep raw data if you want to inspect later
      _raw: r,
    } as unknown as Candidate;
  };

  const handleSearch = async () => {
    setShowCreditWarning(false);
    setLoading(true);
    setLoadingStep(0);
    setViewMode("search");
    setCandidates([]);
    setCurrentPage(1);

    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < loadingSteps.length) {
        setLoadingStep(stepIdx);
      }
    }, 1500);

    try {
      // call your local API from the screenshot
      const resp = await exportProjects(prompt);

      if (!resp.ok) {
        throw new Error(`Search API error: ${resp.status} ${resp.statusText}`);
      }

      const json = await resp.json();

      // defensive: the sample response nests results under data.results
      const hits =
        json?.data?.results ??
        json?.results ??
        json?.data ??
        (Array.isArray(json) ? json : []);

      const mapped: Candidate[] = Array.isArray(hits)
        ? hits.map(mapApiResultToCandidate)
        : [];

      // ensure interval cleared even if mapping is fast
      clearInterval(stepInterval);

      // small delay to preserve loading animation feel (optional)
      setTimeout(() => {
        setCandidates(mapped);
        setLoading(false);
        setLoadingStep(loadingSteps.length - 1);
      }, 400); // reduced delay since we call a real API
    } catch (e) {
      console.error("handleSearch error:", e);
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      minScore: 0,
      minExperience: 0,
      location: "",
      skill: "",
      company: "",
      avgTenure: "",
    });
  };

  // Filter Logic
  const filteredCandidates = candidates.filter((c) => {
    if (viewMode === "shortlist" && !shortlistedIds.includes(c.id))
      return false;
    if (c.matchScore < filters.minScore) return false;
    if (c.experienceYears < filters.minExperience) return false;
    if (
      filters.location &&
      !c.location.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;
    if (
      filters.skill &&
      !c.skills.some((s) =>
        s.toLowerCase().includes(filters.skill.toLowerCase())
      )
    )
      return false;
    if (
      filters.company &&
      !c.currentCompany?.toLowerCase().includes(filters.company.toLowerCase())
    )
      return false;
    if (filters.avgTenure && !c.avgTenure?.includes(filters.avgTenure))
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeFilterCount =
    (filters.minScore > 0 ? 1 : 0) +
    (filters.minExperience > 0 ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.skill ? 1 : 0) +
    (filters.company ? 1 : 0) +
    (filters.avgTenure ? 1 : 0);

  // Handlers
  const toggleBulkSelection = (id: string) => {
    setSelectedForBulk((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedForBulk.length === filteredCandidates.length) {
      setSelectedForBulk([]);
    } else {
      setSelectedForBulk(filteredCandidates.map((c) => c.id));
    }
  };

  const outreachCandidate = candidates.find(
    (c) => c.id === outreachCandidateId
  );

  const handleOutreachOpen = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOutreachCandidateId(id);
  };

  const generateLinkedInMessage = (c: Candidate) => {
    return `Hi ${
      c.name.split(" ")[0]
    },\n\nI came across your profile and was impressed by your work at ${
      c.currentCompany
    }. We're looking for a ${
      c.title
    } who matches your exact skillset.\n\nWould you be open to a quick chat?\n\nBest,\n[Your Name]`;
  };

  // Render Logic
  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6B7280]">
        <p>Select or create a project to start.</p>
      </div>
    );
  }

  // Loader
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-50">
        <div className="w-full max-w-md text-left p-8">
          <div className="space-y-6">
            {loadingSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 transition-all duration-500 ${
                  idx <= loadingStep
                    ? "opacity-100 transform translate-x-0"
                    : "opacity-20 transform -translate-x-4"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    idx < loadingStep
                      ? "bg-[#10B981] text-white"
                      : idx === loadingStep
                      ? "bg-[#4338CA] text-white animate-pulse"
                      : "bg-gray-200"
                  }`}
                >
                  {idx < loadingStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : idx === loadingStep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  )}
                </div>
                <span
                  className={`text-lg font-medium ${
                    idx === loadingStep ? "text-[#111827]" : "text-[#6B7280]"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty State (New Search)
  if (candidates.length === 0 && !loading && viewMode === "search") {
    return (
      <div className="max-w-4xl mx-auto pt-32 px-6 text-center animate-fade-in relative z-10">
        <h2 className="text-4xl font-semibold text-[#111827] mb-4 tracking-tight">
          Find your next hire.
        </h2>
        <p className="text-[#6B7280] mb-10 max-w-lg mx-auto text-lg">
          Describe the ideal candidate. Our AI searches across LinkedIn, GitHub,
          and portfolios.
        </p>

        <div className="relative max-w-2xl mx-auto mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#4338CA]/20 via-[#A78BFA]/20 to-[#4338CA]/20 rounded-2xl blur opacity-40"></div>
          <div className="relative bg-white rounded-2xl shadow-xl shadow-[#4338CA]/5 border border-[#E5E7EB] flex flex-col overflow-hidden transition-all focus-within:shadow-2xl focus-within:border-[#A78BFA]/50">
            <div className="p-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Find me a Senior Product Designer in New York with Fintech experience and 5+ years tenure..."
                className="w-full h-20 resize-none outline-none text-[#111827] placeholder:text-[#9CA3AF] text-lg bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    confirmSearch();
                  }
                }}
              />
            </div>
            <div className="px-3 py-2 bg-white border-t border-[#E5E7EB] flex justify-between items-center">
              <div className="flex gap-2">
                <button className="text-xs font-medium px-2 py-1 rounded bg-[#F7F8FA] text-[#6B7280] hover:text-[#4338CA] hover:bg-[#F3F4F6] transition-colors">
                  Add Filter
                </button>
                <button className="text-xs font-medium px-2 py-1 rounded bg-[#F7F8FA] text-[#6B7280] hover:text-[#4338CA] hover:bg-[#F3F4F6] transition-colors">
                  Upload Job Doc
                </button>
              </div>
              <button
                onClick={confirmSearch}
                disabled={!prompt.trim()}
                className="h-9 px-4 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" /> Run Search
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Senior React Native Dev",
            "Growth Marketing Manager",
            "Golang Engineer in Berlin",
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => setPrompt(tag)}
              className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-full text-sm text-[#6B7280] hover:border-[#4338CA] hover:text-[#4338CA] hover:shadow-sm transition-all"
            >
              {tag}
            </button>
          ))}
        </div>

        {shortlistedIds.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setViewMode("shortlist")}
              className="text-sm text-[#6B7280] hover:text-[#4338CA] underline"
            >
              View {shortlistedIds.length} shortlisted candidates
            </button>
          </div>
        )}

        {showCreditWarning && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F59E0B]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827] mb-2">
                Start New Search?
              </h3>
              <p className="text-[#6B7280] text-sm mb-6">
                This action will utilize your credits to find and score new
                candidates. Are you sure you want to proceed?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreditWarning(false)}
                  className="flex-1 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-[#F7F8FA]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearch}
                  className="flex-1 py-2.5 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81]"
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main List View
  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1 bg-[#F7F8FA] p-1 rounded-lg border border-[#E5E7EB]">
            <button
              onClick={() => {
                setViewMode("search");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "search"
                  ? "bg-white text-[#4338CA] shadow-sm ring-1 ring-[#E5E7EB]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => {
                setViewMode("shortlist");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === "shortlist"
                  ? "bg-white text-[#4338CA] shadow-sm ring-1 ring-[#E5E7EB]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Shortlisted
              {shortlistedIds.length > 0 && (
                <span className="bg-[#E5E7EB] text-[#6B7280] px-1.5 py-0.5 rounded-full text-[10px]">
                  {shortlistedIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#F7F8FA] border-[#D1D5DB] text-[#111827]"
                  : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#4338CA] text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Filter Popover */}
            {showFilters && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 animate-fade-in-up p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#111827] text-sm">
                    Refine Results
                  </h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-4 h-4 text-[#9CA3AF] hover:text-[#111827]" />
                  </button>
                </div>
                <div className="space-y-5">
                  {/* Score Filter */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-[#374151]">
                        Min Match Score
                      </span>
                      <span className="text-[#6B7280]">
                        {filters.minScore}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.minScore}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minScore: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#4338CA]"
                    />
                  </div>

                  {/* Experience Filter */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-[#374151]">
                        Min Experience
                      </span>
                      <span className="text-[#6B7280]">
                        {filters.minExperience} years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={filters.minExperience}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minExperience: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#4338CA]"
                    />
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="e.g. San Francisco"
                        value={filters.location}
                        onChange={(e) =>
                          setFilters({ ...filters, location: e.target.value })
                        }
                        className="w-full pl-8 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#4338CA] focus:border-[#4338CA]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4F6] flex justify-between items-center">
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-1.5 bg-[#4338CA] text-white text-xs font-medium rounded-lg hover:bg-[#312E81]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setCandidates([]);
              setPrompt("");
              setViewMode("search");
            }}
            className="h-9 px-4 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#312E81] transition-colors shadow-sm"
          >
            New Search
          </button>
        </div>
      </div>

      {/* Floating Action Bar for Bulk (Shortlist Mode) */}
      {viewMode === "shortlist" && selectedForBulk.length > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-[#111827] text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 border border-[#374151]">
            <span className="text-sm font-medium">
              {selectedForBulk.length} selected
            </span>
            <div className="h-4 w-px bg-gray-700"></div>
            <button
              onClick={() => setShowBulkLinkedInModal(true)}
              className="flex items-center gap-2 text-sm font-medium hover:text-[#A78BFA] transition-colors"
            >
              <Linkedin className="w-4 h-4" /> Start LinkedIn Campaign
            </button>
            <div className="h-4 w-px bg-gray-700"></div>
            <button
              onClick={() => setSelectedForBulk([])}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {filteredCandidates.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#9CA3AF]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 border border-[#E5E7EB]">
              {viewMode === "shortlist" ? (
                <Heart className="w-6 h-6 text-[#D1D5DB]" />
              ) : (
                <SearchIcon className="w-6 h-6 text-[#D1D5DB]" />
              )}
            </div>
            <p className="font-medium text-[#6B7280]">No candidates found.</p>
          </div>
        ) : (
          <>
            {viewMode === "shortlist" && (
              <div className="mb-4 flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  className="rounded border-[#D1D5DB] text-[#4338CA] focus:ring-0 w-4 h-4 cursor-pointer"
                  checked={
                    selectedForBulk.length === filteredCandidates.length &&
                    filteredCandidates.length > 0
                  }
                  onChange={selectAllFiltered}
                />
                <span className="text-sm text-[#6B7280]">Select All</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 mb-12">
              {paginatedCandidates.map((candidate) => {
                const isShortlisted = shortlistedIds.includes(candidate.id);
                const isSelected = selectedForBulk.includes(candidate.id);

                return (
                  <div
                    key={candidate.id}
                    className={`group bg-white rounded-xl border p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between
                        ${
                          isSelected
                            ? "border-[#4338CA] ring-1 ring-[#4338CA]"
                            : "border-[#E5E7EB]"
                        }
                    `}
                    onClick={() => onSelectCandidate(candidate)}
                  >
                    {/* Checkbox for Shortlist Bulk Actions */}
                    {viewMode === "shortlist" && (
                      <div
                        className="absolute top-4 left-4 z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-[#D1D5DB] text-[#4338CA] focus:ring-0 w-4 h-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleBulkSelection(candidate.id)}
                        />
                      </div>
                    )}

                    {/* Shortlist Button (Top Right) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShortlist(candidate.id);
                      }}
                      className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isShortlisted
                          ? "bg-red-50 text-[#EF4444]"
                          : "bg-[#F9FAFB] text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280]"
                      }`}
                      title={
                        isShortlisted
                          ? "Remove from Shortlist"
                          : "Add to Shortlist"
                      }
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isShortlisted ? "fill-current" : ""
                        }`}
                      />
                    </button>

                    <div>
                      <div
                        className={`flex items-start gap-4 mb-4 ${
                          viewMode === "shortlist" ? "pl-6" : ""
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-[#E5E7EB]">
                          {candidate.avatarUrl && (
                            <img
                              src={candidate.avatarUrl}
                              className="w-full h-full object-cover"
                              alt=""
                              onError={(e) => {
                                const img = e.currentTarget;
                                // if already using our base64 fallback, don't reassign (prevents loop)
                                if (
                                  img.src &&
                                  img.src.startsWith(
                                    "data:image/svg+xml;base64"
                                  )
                                ) {
                                  img.onerror = null;
                                  return;
                                }
                                img.onerror = null;
                                img.src = defaultAvatarBase64(
                                  candidate.name || candidate.id
                                );
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#111827] truncate text-lg">
                              {candidate.name}
                            </h3>
                            {candidate.openToWork && (
                              <span
                                className="w-2 h-2 rounded-full bg-[#10B981]"
                                title="Open to Work"
                              ></span>
                            )}
                          </div>
                          <p className="text-sm text-[#6B7280] truncate font-medium">
                            {candidate.title}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                            {candidate.currentCompany}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-5">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            candidate.matchScore > 90
                              ? "bg-green-50 text-[#059669] border-green-100"
                              : candidate.matchScore > 80
                              ? "bg-indigo-50 text-[#4338CA] border-indigo-100"
                              : "bg-yellow-50 text-[#D97706] border-yellow-100"
                          }`}
                        >
                          {candidate.matchScore}% Match
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[#6B7280] px-2 py-0.5 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                          <Briefcase className="w-3 h-3" />{" "}
                          {candidate.experienceYears}y
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#6B7280] px-2 py-0.5 bg-[#F9FAFB] rounded border border-[#E5E7EB] truncate max-w-[100px]">
                          <MapPin className="w-3 h-3" /> {candidate.location}
                        </div>
                      </div>

                      {/* Unlocked Info Footer Minimal */}
                      {candidate.contactUnlocked && (
                        <div className="mb-4 pt-3 border-t border-[#F3F4F6] flex flex-col gap-1 text-xs text-[#4B5563]">
                          {candidate.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-[#9CA3AF]" />{" "}
                              {candidate.email}
                            </div>
                          )}
                          {candidate.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-[#9CA3AF]" />{" "}
                              {candidate.phone}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div
                      className="flex justify-between items-center pt-2 mt-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-1">
                        {candidate.socials.linkedin && (
                          <a
                            href={candidate.socials.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-full text-[#9CA3AF] hover:text-[#0A66C2] hover:bg-blue-50 transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {candidate.socials.github && (
                          <button
                            className="p-2 rounded-lg hover:bg-gray-100 text-[#9CA3AF] hover:text-[#111827] transition-colors"
                            title="View GitHub"
                          >
                            <Github className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {(viewMode === "shortlist" || isShortlisted) && (
                        <button
                          onClick={(e) => handleOutreachOpen(e, candidate.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4338CA] text-white hover:bg-[#312E81] transition-all shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Sequence
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 pb-8 sticky bottom-0 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md shadow-lg border border-[#E5E7EB] rounded-full px-4 py-2 flex items-center gap-4 pointer-events-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[#6B7280]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-[#4B5563]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[#6B7280]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bulk LinkedIn Modal */}
      {showBulkLinkedInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
              <h3 className="font-semibold text-[#111827] flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" /> Bulk LinkedIn
                Campaign
              </h3>
              <button onClick={() => setShowBulkLinkedInModal(false)}>
                <X className="w-5 h-5 text-[#9CA3AF] hover:text-[#111827]" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/3 border-r border-[#E5E7EB] p-6 overflow-y-auto bg-[#F9FAFB]">
                <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-4">
                  Message Template
                </h4>
                <textarea
                  value={bulkMessageTemplate}
                  onChange={(e) => setBulkMessageTemplate(e.target.value)}
                  className="w-full h-64 p-4 bg-white border border-[#E5E7EB] rounded-xl text-sm leading-relaxed focus:outline-none focus:border-[#4338CA] resize-none mb-4 text-[#111827]"
                />
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-md w-fit">
                  <span>Variables:</span>
                  <code className="bg-gray-100 px-1 rounded text-[#4B5563]">{`{{firstName}}`}</code>
                  <code className="bg-gray-100 px-1 rounded text-[#4B5563]">{`{{company}}`}</code>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">
                    Execution Queue ({selectedForBulk.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {selectedForBulk.map((id) => {
                    const cand = candidates.find((c) => c.id === id);
                    if (!cand) return null;
                    const msg = bulkMessageTemplate
                      .replace("{{firstName}}", cand.name.split(" ")[0])
                      .replace(
                        "{{company}}",
                        cand.currentCompany || "your company"
                      );

                    return (
                      <div
                        key={id}
                        className="border border-[#E5E7EB] rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                            <img
                              src={cand.avatarUrl}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          </div>
                          <div>
                            <div className="font-medium text-[#111827]">
                              {cand.name}
                            </div>
                            <div className="text-xs text-[#6B7280] truncate w-48">
                              {msg}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copy Message"
                            onClick={() => navigator.clipboard.writeText(msg)}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={cand.socials.linkedinUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-[#0A66C2] text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outreach Modal (Individual) */}
      {outreachCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex h-[600px]">
              {/* Left Sidebar: Context */}
              <div className="w-1/3 bg-[#F9FAFB] border-r border-[#E5E7EB] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {outreachCandidate.avatarUrl && (
                      <img
                        src={outreachCandidate.avatarUrl}
                        className="w-full h-full object-cover"
                        alt=""
                        onError={(e) => {
                          const img = e.currentTarget;
                          // if already using our base64 fallback, don't reassign (prevents loop)
                          if (
                            img.src &&
                            img.src.startsWith("data:image/svg+xml;base64")
                          ) {
                            img.onerror = null;
                            return;
                          }
                          img.onerror = null;
                          img.src = defaultAvatarBase64(
                            outreachCandidate.name || outreachCandidate.id
                          );
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[#111827] leading-tight">
                      {outreachCandidate.name}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {outreachCandidate.title}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">
                      Status
                    </div>
                    <div className="space-y-2">
                      {[
                        "NOT_CONTACTED",
                        "CONTACTED",
                        "REVERTED",
                        "CONVERTED",
                      ].map((status) => (
                        <label
                          key={status}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              outreachCandidate.outreachStatus === status
                                ? "border-[#4338CA] bg-[#4338CA]"
                                : "border-[#D1D5DB] bg-white"
                            }`}
                          >
                            {outreachCandidate.outreachStatus === status && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-[#6B7280] group-hover:text-[#111827] transition-colors">
                            {status.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">
                      Details
                    </div>
                    <div className="text-xs text-[#6B7280] space-y-1">
                      <p>
                        {outreachCandidate.contactUnlocked
                          ? outreachCandidate.email
                          : "Email locked"}
                      </p>
                      <p>
                        {outreachCandidate.contactUnlocked
                          ? outreachCandidate.phone
                          : "Phone locked"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Action Area */}
              <div className="flex-1 flex flex-col">
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center">
                  <div className="flex gap-6">
                    <button
                      onClick={() => setOutreachMode("LINKEDIN")}
                      className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${
                        outreachMode === "LINKEDIN"
                          ? "border-[#4338CA] text-[#4338CA]"
                          : "border-transparent text-[#9CA3AF] hover:text-[#6B7280]"
                      }`}
                    >
                      LinkedIn Message
                    </button>
                    <button
                      onClick={() => setOutreachMode("MAIL")}
                      className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${
                        outreachMode === "MAIL"
                          ? "border-[#4338CA] text-[#4338CA]"
                          : "border-transparent text-[#9CA3AF] hover:text-[#6B7280]"
                      }`}
                    >
                      Email Sequence
                    </button>
                  </div>
                  <button onClick={() => setOutreachCandidateId(null)}>
                    <X className="w-5 h-5 text-[#9CA3AF] hover:text-[#111827]" />
                  </button>
                </div>

                <div className="flex-1 p-6 bg-white overflow-y-auto">
                  {outreachMode === "LINKEDIN" ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-[#0A66C2]">
                          <Linkedin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#111827]">
                            Connect & Message
                          </h4>
                          <p className="text-xs text-[#6B7280] mt-1">
                            Send a connection request with this personalized
                            note.
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          className="w-full h-48 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111827] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] resize-none"
                          defaultValue={generateLinkedInMessage(
                            outreachCandidate
                          )}
                        />
                        <button
                          className="absolute top-3 right-3 p-1.5 bg-white shadow-sm border border-[#E5E7EB] rounded hover:bg-gray-50 text-[#6B7280] hover:text-[#111827] transition-colors"
                          title="Copy to Clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex justify-end pt-2">
                        <a
                          href={outreachCandidate.socials.linkedinUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-lg text-sm font-medium hover:bg-[#006396] transition-colors"
                        >
                          Open LinkedIn Profile{" "}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                        <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          defaultValue={`Role at ${currentProject.name}`}
                          className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#4338CA]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">
                          Message Body
                        </label>
                        <textarea
                          className="w-full h-48 p-4 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] resize-none"
                          defaultValue={`Hi ${
                            outreachCandidate.name.split(" ")[0]
                          },\n\nI'm recruiting for a ${
                            outreachCandidate.title
                          } position and your background stood out to me.\n\nLet's chat?`}
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button className="flex items-center gap-2 px-6 py-2 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] transition-colors">
                          Send Email <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
