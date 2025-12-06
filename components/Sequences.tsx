import React, { useState } from 'react';
import { Mail, Plus, MoreHorizontal, ArrowUpRight, CheckCircle, Clock, Linkedin, BarChart3, Users, Send } from 'lucide-react';
import { Sequence, SequenceType } from '../types';
import { SequenceBuilder } from './SequenceBuilder';

interface SequencesProps {
  sequences: Sequence[];
  onAddSequence: (s: Sequence) => void;
}

export const Sequences: React.FC<SequencesProps> = ({ sequences, onAddSequence }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<SequenceType>('LINKEDIN');

  const filteredSequences = sequences.filter(s => s.type === activeTab);

  if (isCreating) {
    return (
      <SequenceBuilder 
        initialType={activeTab}
        onSave={(newSeq) => {
          onAddSequence(newSeq);
          setIsCreating(false);
        }}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 h-[calc(100vh-64px)] overflow-y-auto animate-fade-in">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Outreach Campaigns</h2>
          <p className="text-[#6B7280] text-sm mt-1">Automate and track your candidate engagement.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="h-10 px-5 bg-[#4338CA] text-white rounded-lg text-sm font-semibold hover:bg-[#312E81] transition-all flex items-center gap-2 shadow-lg shadow-[#4338CA]/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> New {activeTab === 'LINKEDIN' ? 'Campaign' : 'Sequence'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-[#E5E7EB] w-fit mb-8 shadow-sm">
          <button 
            onClick={() => setActiveTab('LINKEDIN')}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'LINKEDIN' ? 'bg-[#EFF6FF] text-[#0A66C2] shadow-sm' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'}`}
          >
              <Linkedin className="w-4 h-4" /> LinkedIn Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('EMAIL')}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'EMAIL' ? 'bg-[#EEF2FF] text-[#4338CA] shadow-sm' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'}`}
          >
              <Mail className="w-4 h-4" /> Email Sequences
          </button>
      </div>

      {/* Contextual Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
           <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'LINKEDIN' ? 'bg-blue-100 text-[#0A66C2]' : 'bg-indigo-100 text-[#4338CA]'}`}>
                 <Send className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">{activeTab === 'LINKEDIN' ? 'Requests Sent' : 'Emails Delivered'}</span>
           </div>
           <div className="text-3xl font-bold text-[#111827] tracking-tight">1,284</div>
           <div className="flex items-center gap-1 text-[#10B981] text-xs font-medium mt-2 bg-green-50 w-fit px-2 py-0.5 rounded-full">
             <ArrowUpRight className="w-3 h-3" /> +12% this week
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
           <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'LINKEDIN' ? 'bg-blue-100 text-[#0A66C2]' : 'bg-indigo-100 text-[#4338CA]'}`}>
                 {activeTab === 'LINKEDIN' ? <Users className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">{activeTab === 'LINKEDIN' ? 'Connection Rate' : 'Open Rate'}</span>
           </div>
           <div className="text-3xl font-bold text-[#111827] tracking-tight">48.2%</div>
            <div className="flex items-center gap-1 text-[#10B981] text-xs font-medium mt-2 bg-green-50 w-fit px-2 py-0.5 rounded-full">
             <ArrowUpRight className="w-3 h-3" /> +2.4% this week
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
           <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'LINKEDIN' ? 'bg-blue-100 text-[#0A66C2]' : 'bg-indigo-100 text-[#4338CA]'}`}>
                 <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Reply Rate</span>
           </div>
           <div className="text-3xl font-bold text-[#111827] tracking-tight">15.8%</div>
            <div className="flex items-center gap-1 text-[#9CA3AF] text-xs font-medium mt-2 bg-gray-50 w-fit px-2 py-0.5 rounded-full">
             Stable
           </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-8 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex text-xs font-bold text-[#6B7280] uppercase tracking-wider">
          <div className="flex-1">Campaign Name</div>
          <div className="w-32 text-center">Status</div>
          <div className="w-32 text-right">{activeTab === 'LINKEDIN' ? 'Touchpoints' : 'Steps'}</div>
          <div className="w-32 text-right">Sent</div>
          <div className="w-32 text-right">Replied</div>
          <div className="w-16"></div>
        </div>
        
        {filteredSequences.map((seq) => (
          <div key={seq.id} className="px-8 py-5 border-b border-[#E5E7EB] last:border-0 flex items-center hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
            <div className="flex-1">
              <div className="font-semibold text-[#111827] text-sm group-hover:text-[#4338CA] transition-colors">{seq.name}</div>
              <div className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                 <Clock className="w-3 h-3" /> Updated recently
              </div>
            </div>
            <div className="w-32 flex justify-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border
                ${seq.status === 'ACTIVE' ? 'bg-green-50 text-[#059669] border-green-200' : 
                  seq.status === 'DRAFT' ? 'bg-gray-50 text-[#6B7280] border-gray-200' : 'bg-blue-50 text-[#0A66C2] border-blue-200'}`}>
                {seq.status}
              </span>
            </div>
            <div className="w-32 text-right text-sm text-[#4B5563] flex justify-end gap-1 items-center">
                <span className="bg-[#F3F4F6] px-2 py-1 rounded-md text-xs font-semibold">{seq.steps.length}</span>
            </div>
            <div className="w-32 text-right text-sm font-medium text-[#111827]">{seq.stats.sent}</div>
             <div className="w-32 text-right text-sm font-medium text-[#111827]">{seq.stats.replied}</div>
            <div className="w-16 flex justify-end">
              <button className="text-[#9CA3AF] hover:text-[#111827] p-2 hover:bg-[#E5E7EB] rounded-full transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
        {filteredSequences.length === 0 && (
          <div className="p-16 text-center flex flex-col items-center justify-center text-[#6B7280]">
             <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mb-6 border border-[#E5E7EB]">
                {activeTab === 'LINKEDIN' ? <Linkedin className="w-8 h-8 text-[#9CA3AF]" /> : <Mail className="w-8 h-8 text-[#9CA3AF]" />}
             </div>
             <p className="font-medium text-lg text-[#111827]">No {activeTab === 'LINKEDIN' ? 'LinkedIn campaigns' : 'email sequences'} found.</p>
             <p className="text-sm mt-2 max-w-sm mx-auto">Start a new campaign to automate your outreach and save time.</p>
             <button onClick={() => setIsCreating(true)} className="mt-6 px-6 py-2 bg-[#4338CA] text-white text-sm font-medium rounded-lg hover:bg-[#312E81] shadow-lg shadow-[#4338CA]/20">Create First Campaign</button>
          </div>
        )}
      </div>
    </div>
  );
};