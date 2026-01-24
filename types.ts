export enum ViewState {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  ONBOARDING = "ONBOARDING",
  DASHBOARD = "DASHBOARD",
}

export enum DashboardTab {
  SEARCH = "SEARCH",
  PROJECTS = "PROJECTS",
  CANDIDATES = "CANDIDATES",
  SEQUENCES = "SEQUENCES",
  CREDITS = "CREDITS",
  INTEGRATIONS = "INTEGRATIONS",
}

export type SequenceType = "EMAIL" | "LINKEDIN";

export interface Skill {
  name: string;
}

export interface CareerNode {
  role: string;
  company: string;
  duration: string;
  type: "stable" | "promotion" | "job-hop" | "gap";
}

export interface SaralInsights {
  strengths: string[];
  redFlags: string[];
  altRoles: string[]; // 2 alternative roles
  trajectory: CareerNode[];
  stabilityScore: number; // 1-10
  careerVerdict?: string;
}

export interface WorkHistoryItem {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export type OutreachStatus =
  | "NOT_CONTACTED"
  | "CONTACTED"
  | "REVERTED"
  | "CONVERTED";

export interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  experienceYears: number;
  matchScore: number; // 0-100
  skills: string[];
  currentCompany?: string;
  avatarUrl?: string;
  bio: string;
  education: string;
  contactUnlocked: boolean;
  email?: string;
  phone?: string;
  avgTenure?: string;
  openToWork: boolean;
  socials: {
    linkedin?: boolean;
    github?: boolean;
    behance?: boolean;
    linkedinUrl?: string;
    githubUrl?: string;
  };
  insights: SaralInsights;
  outreachStatus: OutreachStatus;
  workHistory?: WorkHistoryItem[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  candidateCount: number;
  createdAt: Date;
  prompt?: string;
}

export interface User {
  email: string;
  companyName: string;
  credits: number;
  role?: string;
}

export interface SequenceStep {
  id: string;
  type: "EMAIL" | "WAIT";
  subject?: string;
  content?: string;
  delayDays: number;
}

export interface Sequence {
  id: string;
  name: string;
  type: SequenceType;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  steps: SequenceStep[];
  stats: {
    sent: number;
    opened: number;
    replied: number;
  };
  lastUpdated: Date;
}

export interface Invoice {
  id: string;
  amount: number;
  date: string;
  status: "PAID" | "PENDING";
  planName: string;
}
