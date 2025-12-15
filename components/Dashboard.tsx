import React, { useState } from "react";
import {
  Layout,
  Plus,
  Users,
  Search,
  Mail,
  CreditCard,
  Settings,
  LogOut,
  Grid,
  Zap,
  X,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import {
  ViewState,
  DashboardTab,
  User,
  Project,
  Candidate,
  Sequence,
} from "../types";
import { ProjectView } from "./ProjectView";
import { Credits } from "./Credits";
import { Sequences } from "./Sequences";
import { Integrations } from "./Integrations";
import CandidateDrawer from "./CandidateDrawer";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.SEARCH);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Frontend Engineers",
      description: "React experts",
      candidateCount: 0,
      createdAt: new Date(),
    },
  ]);
  const [currentProjectId, setCurrentProjectId] = useState<string>("1");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(user);

  // Sequence State
  const [sequences, setSequences] = useState<Sequence[]>([
    {
      id: "1",
      name: "Frontend Engineers Outreach",
      type: "EMAIL",
      status: "ACTIVE",
      stats: { sent: 342, opened: 156, replied: 42 },
      lastUpdated: new Date(),
      steps: [
        {
          id: "s1",
          type: "EMAIL",
          subject: "Opportunity at {{company}}",
          content: "Hi {{firstName}}...",
          delayDays: 0,
        },
        { id: "s2", type: "WAIT", delayDays: 2 },
        {
          id: "s3",
          type: "EMAIL",
          subject: "Quick follow up",
          content: "Just checking in...",
          delayDays: 0,
        },
      ],
    },
    {
      id: "2",
      name: "Passive Candidates Drip",
      type: "EMAIL",
      status: "DRAFT",
      stats: { sent: 0, opened: 0, replied: 0 },
      lastUpdated: new Date(),
      steps: [
        {
          id: "s1",
          type: "EMAIL",
          subject: "Hello",
          content: "...",
          delayDays: 0,
        },
      ],
    },
  ]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState(
    currentUser.companyName
  );

  const currentProject =
    projects.find((p) => p.id === currentProjectId) || null;

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    setCreatingProject(true);
    setTimeout(() => {
      const newProj = {
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDesc,
        candidateCount: 0,
        createdAt: new Date(),
      };
      setProjects([...projects, newProj]);
      setCurrentProjectId(newProj.id);
      setActiveTab(DashboardTab.SEARCH);
      setCandidates([]); // Reset for new project
      setNewProjectName("");
      setNewProjectDesc("");
      setCreatingProject(false);
    }, 800);
  };

  // toggleShortlist now persists shortlist per-role/project
  const toggleShortlist = (id: string) => {
    setShortlistedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];

      // persist for current project (if one exists)
      if (currentProject?.name) {
        // update saved candidates count as well (not necessary but helpful)
        saveRoleData(currentProject.name, candidates, next);
      }

      return next;
    });
  };

  // Unlock / other handlers unchanged (keeps previous behavior)
  const handleUnlockCandidate = (
    id: string,
    contact?: { emails?: string[]; phones?: string[] }
  ) => {
    if (!currentUser) return;

    if (currentUser.credits >= 5) {
      setCandidates((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(id)) return c;
          return {
            ...c,
            contactUnlocked: true,
            email: contact?.emails?.[0] ?? (c as any).email ?? null,
            phone: contact?.phones?.[0] ?? (c as any).phone ?? null,
          };
        })
      );

      setSelectedCandidate((prev) =>
        prev && String(prev.id) === String(id)
          ? {
              ...prev,
              contactUnlocked: true,
              email: contact?.emails?.[0] ?? (prev as any).email ?? null,
              phone: contact?.phones?.[0] ?? (prev as any).phone ?? null,
            }
          : prev
      );

      setCurrentUser((prev) => ({
        ...prev,
        credits: Math.max(0, prev.credits - 5),
      }));

      // persist unlocked info for current role
      if (currentProject?.name) {
        saveRoleData(currentProject.name, candidates, shortlistedIds);
      }
    } else {
      alert("Not enough credits to unlock contact details.");
    }
  };

  const handleAddSequence = (newSeq: Sequence) => {
    setSequences([newSeq, ...sequences]);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({ ...currentUser, companyName: editCompanyName });
    setIsProfileModalOpen(false);
  };

  // When sidebar project is clicked, load its data
  useEffect(() => {
    // Load data for the currently selected project on mount & when projects/currentProjectId change
    if (currentProjectId) {
      loadProjectFromStorage(currentProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId, projects]);

  // initial load for default project on first mount
  useEffect(() => {
    if (currentProject) {
      loadProjectFromStorage(currentProject.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden font-sans text-[#111827]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB]">
          <div className="w-6 h-6 bg-[#4338CA] rounded-md mr-3 flex items-center justify-center shadow-md shadow-[#4338CA]/20">
            <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
          </div>
          <span className="font-bold tracking-tight text-[#111827]">
            SARAL AI
          </span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-8">
            <div>
              <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 px-3">
                Projects
              </h3>
              <ul className="space-y-1">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        setCurrentProjectId(p.id);
                        setActiveTab(DashboardTab.SEARCH);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        currentProjectId === p.id &&
                        activeTab === DashboardTab.SEARCH
                          ? "bg-[#F7F8FA] text-[#4338CA]"
                          : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                      }`}
                    >
                      <Grid
                        className={`w-4 h-4 ${
                          currentProjectId === p.id
                            ? "text-[#4338CA]"
                            : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 px-3">
                Workspace
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab(DashboardTab.SEQUENCES)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      activeTab === DashboardTab.SEQUENCES
                        ? "bg-[#F7F8FA] text-[#4338CA]"
                        : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                    }`}
                  >
                    <Mail
                      className={`w-4 h-4 ${
                        activeTab === DashboardTab.SEQUENCES
                          ? "text-[#4338CA]"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    Sequences
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab(DashboardTab.INTEGRATIONS)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      activeTab === DashboardTab.INTEGRATIONS
                        ? "bg-[#F7F8FA] text-[#4338CA]"
                        : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                    }`}
                  >
                    <Zap
                      className={`w-4 h-4 ${
                        activeTab === DashboardTab.INTEGRATIONS
                          ? "text-[#4338CA]"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    Integrations
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab(DashboardTab.CREDITS)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      activeTab === DashboardTab.CREDITS
                        ? "bg-[#F7F8FA] text-[#4338CA]"
                        : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                    }`}
                  >
                    <CreditCard
                      className={`w-4 h-4 ${
                        activeTab === DashboardTab.CREDITS
                          ? "text-[#4338CA]"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    Billing & Plan
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-bold border border-gray-200">
                {currentUser.companyName?.charAt(0) ?? "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111827] truncate w-28">
                  {currentUser.companyName}
                </span>
                <span className="text-[10px] text-[#6B7280] font-medium bg-[#F7F8FA] px-1.5 py-0.5 rounded-full w-fit border border-[#E5E7EB]">
                  {currentUser.credits} Credits
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-[#6B7280] hover:text-[#EF4444] p-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#F7F8FA] relative overflow-hidden">
        {activeTab === DashboardTab.SEARCH && (
          <ProjectView
            candidates={candidates}
            setCandidates={setCandidates}
            currentProject={currentProject}
            onSelectCandidate={setSelectedCandidate}
            toggleShortlist={toggleShortlist}
            shortlistedIds={shortlistedIds}
            sequences={sequences}
            onAddSequence={handleAddSequence}
          />
        )}
        {activeTab === DashboardTab.CREDITS && (
          <Credits
            user={currentUser}
            onBuy={() =>
              setCurrentUser((prev) => ({
                ...prev,
                credits: prev.credits + 500,
              }))
            }
          />
        )}
        {activeTab === DashboardTab.SEQUENCES && (
          <Sequences sequences={sequences} onAddSequence={handleAddSequence} />
        )}
        {activeTab === DashboardTab.INTEGRATIONS && <Integrations />}
      </main>

      {/* Candidate Drawer (slide-over) */}
      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onUnlock={handleUnlockCandidate}
        userCredits={currentUser.credits}
      />

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F7F8FA]">
              <h3 className="font-semibold text-[#111827]">Profile Settings</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.email}
                  className="w-full px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] shadow-md shadow-[#4338CA]/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
