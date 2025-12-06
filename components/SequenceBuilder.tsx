import React, { useState } from 'react';
import { Plus, Trash2, Clock, Mail, Save, ArrowLeft, FileText, Linkedin, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Sequence, SequenceStep, SequenceType } from '../types';

interface SequenceBuilderProps {
  initialSequence?: Sequence | null;
  initialType?: SequenceType;
  onSave: (sequence: Sequence) => void;
  onCancel: () => void;
}

const EMAIL_TEMPLATES = {
  "cold-outreach": {
    name: "Cold Outreach",
    steps: [
      { id: 't1', type: 'EMAIL' as const, delayDays: 0, subject: "Opportunity at {{company}}", content: "Hi {{firstName}}, I came across your profile and was impressed by your work..." },
      { id: 't2', type: 'WAIT' as const, delayDays: 3, subject: "", content: "" },
      { id: 't3', type: 'EMAIL' as const, delayDays: 0, subject: "Quick follow up", content: "Hi {{firstName}}, just floating this to the top of your inbox..." }
    ]
  },
};

const LINKEDIN_TEMPLATES = {
  "connect": {
    name: "Connection Request",
    steps: [
      { id: 'l1', type: 'EMAIL' as const, delayDays: 0, subject: "", content: "Hi {{firstName}}, I lead engineering at {{company}} and admired your work at {{currentCompany}}. Would love to connect." }
    ]
  },
  "recruit": {
    name: "Recruiter Outreach",
    steps: [
       { id: 'l1', type: 'EMAIL' as const, delayDays: 0, subject: "", content: "Hi {{firstName}}, checking if you're open to new roles?" },
       { id: 'l2', type: 'WAIT' as const, delayDays: 2, subject: "", content: "" },
       { id: 'l3', type: 'EMAIL' as const, delayDays: 0, subject: "", content: "Just wanted to bump this. We are scaling fast!" }
    ]
  }
};

export const SequenceBuilder: React.FC<SequenceBuilderProps> = ({ initialSequence, initialType = 'EMAIL', onSave, onCancel }) => {
  const [name, setName] = useState(initialSequence?.name || '');
  const [type, setType] = useState<SequenceType>(initialSequence?.type || initialType);
  const [steps, setSteps] = useState<SequenceStep[]>(initialSequence?.steps || [
    { id: '1', type: 'EMAIL', subject: '', content: '', delayDays: 0 }
  ]);

  const templates = type === 'EMAIL' ? EMAIL_TEMPLATES : LINKEDIN_TEMPLATES;

  const applyTemplate = (key: string) => {
    // @ts-ignore
    const template = templates[key];
    const newSteps = template.steps.map((s: any, i: number) => ({ ...s, id: `step_${Date.now()}_${i}` }));
    setSteps(newSteps);
    if (!name) setName(template.name);
  };

  const addStep = (stepType: 'EMAIL' | 'WAIT') => {
    setSteps([
      ...steps,
      {
        id: Date.now().toString(),
        type: stepType,
        delayDays: stepType === 'WAIT' ? 2 : 0,
        subject: '',
        content: ''
      }
    ]);
  };

  const updateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleSave = () => {
    if (!name) return alert("Please enter a campaign name");
    
    const newSequence: Sequence = {
      id: initialSequence?.id || Date.now().toString(),
      name,
      type,
      status: initialSequence?.status || 'DRAFT',
      steps,
      stats: initialSequence?.stats || { sent: 0, opened: 0, replied: 0 },
      lastUpdated: new Date()
    };
    onSave(newSequence);
  };

  const insertVariable = (stepId: string, currentContent: string, variable: string) => {
      updateStep(stepId, { content: currentContent + variable });
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-[#F3F4F6] rounded-full text-[#9CA3AF] hover:text-[#111827] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${type === 'LINKEDIN' ? 'bg-blue-50 text-[#0A66C2]' : 'bg-indigo-50 text-[#4338CA]'}`}>
                {type === 'LINKEDIN' ? <Linkedin className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
             </div>
             <div>
                <h2 className="text-lg font-semibold text-[#111827] leading-none">{initialSequence ? 'Edit' : 'New'} {type === 'LINKEDIN' ? 'Campaign' : 'Sequence'}</h2>
                <p className="text-xs text-[#6B7280] mt-1">{type === 'LINKEDIN' ? 'Automated connection requests & messages' : 'Drip email campaign'}</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827]">Cancel</button>
           <button onClick={handleSave} className="px-4 py-2 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] flex items-center gap-2 shadow-sm shadow-[#4338CA]/20">
             <Save className="w-4 h-4" /> Save Campaign
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F7F8FA]">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Template Selector */}
          {!initialSequence && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
               {Object.entries(templates).map(([key, tpl]) => (
                 <button 
                    key={key} 
                    onClick={() => applyTemplate(key)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-xs font-medium text-[#6B7280] hover:border-[#4338CA] hover:text-[#4338CA] whitespace-nowrap transition-all shadow-sm"
                 >
                   <FileText className="w-3 h-3" /> Load: {tpl.name}
                 </button>
               ))}
            </div>
          )}

          {/* Name Input */}
          <div className="pb-4">
            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Campaign Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'LINKEDIN' ? "e.g. Q4 Eng Outreach" : "e.g. Senior Frontend Drip"}
              className="w-full text-3xl font-bold placeholder:text-[#E5E7EB] border-none focus:ring-0 p-0 text-[#111827] bg-transparent"
              autoFocus
            />
          </div>

          {/* Steps */}
          <div className="space-y-6">
             {steps.map((step, index) => (
               <div key={step.id} className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                 
                 {/* Connector Line */}
                 {index < steps.length - 1 && (
                   <div className="absolute left-8 top-16 bottom-[-32px] w-0.5 bg-[#E5E7EB] z-0"></div>
                 )}

                 <div className={`bg-white rounded-xl border shadow-sm overflow-hidden relative z-10 hover:shadow-md transition-all ${step.type === 'WAIT' ? 'border-[#E5E7EB] w-[90%] ml-auto' : 'border-[#E5E7EB]'}`}>
                    
                    {/* Step Header */}
                    <div className="bg-[#F9FAFB] px-5 py-3 border-b border-[#E5E7EB] flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.type === 'EMAIL' ? (type === 'LINKEDIN' ? 'bg-blue-100 text-[#0A66C2]' : 'bg-indigo-100 text-[#4338CA]') : 'bg-orange-100 text-[#D97706]'}`}>
                             {step.type === 'EMAIL' ? (type === 'LINKEDIN' ? <Linkedin className="w-4 h-4" /> : <Mail className="w-4 h-4" />) : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-[#111827] block">
                                {step.type === 'EMAIL' 
                                    ? (type === 'LINKEDIN' ? (index === 0 ? 'Connection Request' : 'Follow-up Message') : `Email Step ${index + 1}`) 
                                    : 'Wait Delay'}
                            </span>
                            {type === 'LINKEDIN' && step.type === 'EMAIL' && index === 0 && (
                                <span className="text-[10px] text-[#6B7280] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Max 300 chars for invites
                                </span>
                            )}
                          </div>
                       </div>
                       <button onClick={() => removeStep(step.id)} className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-2 hover:bg-red-50 rounded-lg">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="p-6">
                       {step.type === 'EMAIL' ? (
                         <div className="space-y-4">
                            {/* Subject Line (Email Only) */}
                            {type === 'EMAIL' && (
                                <div>
                                    <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Subject</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter subject line..."
                                        value={step.subject}
                                        onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                                        className="w-full text-sm font-medium border border-[#E5E7EB] rounded-lg px-3 py-2 focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] focus:outline-none transition-colors text-[#111827]"
                                    />
                                </div>
                            )}

                            {/* Message Body */}
                            <div>
                               <div className="flex justify-between items-center mb-1.5">
                                   <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Message</label>
                                   {type === 'LINKEDIN' && index === 0 && (
                                       <span className={`text-xs font-medium ${step.content?.length! > 300 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                                           {step.content?.length || 0}/300
                                       </span>
                                   )}
                               </div>
                               <textarea 
                                 placeholder={type === 'LINKEDIN' ? "Hi {{firstName}}, I'd like to join your network..." : "Hi {{firstName}}, I saw your profile..."}
                                 value={step.content}
                                 onChange={(e) => updateStep(step.id, { content: e.target.value })}
                                 className={`w-full h-32 text-sm text-[#374151] resize-none focus:outline-none border border-[#E5E7EB] rounded-lg p-3 focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] ${type === 'LINKEDIN' ? 'bg-gray-50' : 'bg-white'}`}
                               />
                            </div>

                            {/* Variables */}
                            <div className="flex items-center gap-2">
                               <span className="text-xs text-[#9CA3AF]">Insert:</span>
                               <button onClick={() => insertVariable(step.id, step.content || '', '{{firstName}}')} className="text-xs bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2 py-1 rounded text-[#4B5563] font-mono transition-colors">{`{{firstName}}`}</button>
                               <button onClick={() => insertVariable(step.id, step.content || '', '{{company}}')} className="text-xs bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2 py-1 rounded text-[#4B5563] font-mono transition-colors">{`{{company}}`}</button>
                            </div>
                         </div>
                       ) : (
                         <div className="flex items-center gap-3 bg-[#FFF7ED] p-4 rounded-lg border border-orange-100">
                            <Clock className="w-5 h-5 text-[#F97316]" />
                            <span className="text-sm text-[#9A3412] font-medium">Wait for</span>
                            <input 
                              type="number" 
                              min="1"
                              value={step.delayDays}
                              onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) })}
                              className="w-16 h-8 px-2 text-center border border-orange-200 rounded bg-white text-sm text-[#111827] focus:border-[#F97316] focus:outline-none"
                            />
                            <span className="text-sm text-[#9A3412] font-medium">days before sending the next message.</span>
                         </div>
                       )}
                    </div>
                 </div>
               </div>
             ))}

             {/* Add Step Buttons */}
             <div className="flex justify-center gap-3 pt-6 pb-12">
                <button 
                    onClick={() => addStep('EMAIL')}
                    className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#4338CA] hover:text-[#4338CA] transition-all shadow-sm flex items-center gap-2 text-[#6B7280]"
                >
                    {type === 'LINKEDIN' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    Add {type === 'LINKEDIN' ? 'Message' : 'Email'}
                </button>
                <button 
                    onClick={() => addStep('WAIT')}
                    className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#F97316] hover:text-[#F97316] transition-all shadow-sm flex items-center gap-2 text-[#6B7280]"
                >
                    <Clock className="w-4 h-4" /> Add Delay
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};