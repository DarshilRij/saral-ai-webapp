import { DashboardTab } from "@/types";
import { CreditCard } from "lucide-react";
import React from "react";

type ComingSoonProps = {
  setActiveTab: (tab: DashboardTab) => void;
  headerName: string;
};

const ComingSoon = ({ setActiveTab, headerName }: ComingSoonProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mb-6 border border-[#E5E7EB]">
        <CreditCard className="w-8 h-8 text-[#9CA3AF]" />
      </div>
      <h2 className="text-2xl font-bold text-[#111827] mb-2">{headerName}</h2>
      <p className="text-[#6B7280] mb-6">
        This feature is coming soon. Stay tuned for updates!
      </p>
      <button
        onClick={() => setActiveTab(DashboardTab.SEARCH)}
        className="px-6 py-2 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] shadow-md shadow-[#4338CA]/20"
      >
        Back to Search
      </button>
    </div>
  );
};

export default ComingSoon;
