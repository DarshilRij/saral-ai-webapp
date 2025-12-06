import React, { useState } from 'react';
import { CreditCard, Check, Clock, Zap, Star, Shield, X, Download, FileText } from 'lucide-react';
import { User, Invoice } from '../types';

interface CreditsProps {
  user: User;
  onBuy: () => void;
}

export const Credits: React.FC<CreditsProps> = ({ user, onBuy }) => {
  const [showPricing, setShowPricing] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

  // Mock Invoices
  const invoices: Invoice[] = [
    { id: 'INV-001', amount: 4999, date: 'Oct 24, 2024', status: 'PAID', planName: 'Growth Plan' },
    { id: 'INV-002', amount: 1299, date: 'Sep 24, 2024', status: 'PAID', planName: 'Starter Plan' },
  ];

  const handleSelectPlan = () => {
    setShowPricing(false);
    onBuy();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 animate-fade-in h-[calc(100vh-64px)] overflow-y-auto">
      <h2 className="text-2xl font-semibold text-[#111827] mb-2">Billing & Credits</h2>
      <p className="text-[#6B7280] mb-8">Manage your plan and usage.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Current Balance */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-[#4338CA]">
             <CreditCard className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between mb-6 relative">
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Available Credits</h3>
          </div>
          <div className="text-5xl font-bold text-[#111827] mb-2 tracking-tight relative">{user.credits}</div>
          <p className="text-sm text-[#6B7280] mb-8 relative">Approx. {Math.floor(user.credits / 5)} profile unlocks remaining.</p>
          <div className="flex gap-3 relative">
            <button 
              onClick={() => setShowPricing(true)} 
              className="px-6 py-2.5 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] transition-colors shadow-lg shadow-[#4338CA]/20"
            >
              Buy Credits
            </button>
             <button 
                onClick={() => setShowInvoices(true)}
                className="px-6 py-2.5 bg-white text-[#111827] border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
             >
              Invoices
            </button>
          </div>
        </div>

        {/* Plan Details */}
        <div className="bg-gradient-to-br from-[#312E81] to-[#4338CA] rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-widest">Current Plan</h3>
            <span className="bg-white/10 border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded">PRO</span>
          </div>
          <div className="text-2xl font-semibold mb-6 relative">Professional Plan</div>
          <div className="space-y-4 relative">
             <div className="flex items-center gap-3 text-sm text-indigo-100">
               <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center"><Check className="w-3 h-3 text-[#10B981]" /></div>
               Unlimited searches
             </div>
             <div className="flex items-center gap-3 text-sm text-indigo-100">
               <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center"><Check className="w-3 h-3 text-[#10B981]" /></div>
               AI Analysis & Scoring
             </div>
             <div className="flex items-center gap-3 text-sm text-indigo-100">
               <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center"><Check className="w-3 h-3 text-[#10B981]" /></div>
               Email Sequencing
             </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-medium text-[#111827] mb-4">Usage History</h3>
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB] flex justify-between text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          <span>Action</span>
          <span>Cost</span>
          <span>Date</span>
        </div>
        {[1,2,3].map((i) => (
          <div key={i} className="px-6 py-4 border-b border-[#E5E7EB] last:border-0 flex justify-between items-center text-sm hover:bg-[#F9FAFB] transition-colors">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">
                 <Clock className="w-4 h-4" />
               </div>
               <span className="text-[#111827] font-medium">Unlock Contact: Senior React Dev</span>
             </div>
             <div className="flex items-center justify-end gap-12 w-1/3">
               <span className="text-[#EF4444] font-medium bg-red-50 px-2 py-0.5 rounded text-xs">-5 credits</span>
               <span className="text-[#9CA3AF] text-xs">Oct 24, 2024</span>
             </div>
          </div>
        ))}
      </div>

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
                 <div>
                   <h2 className="text-xl font-bold text-[#111827]">Top up Credits</h2>
                   <p className="text-sm text-[#6B7280]">Choose a package that fits your hiring needs.</p>
                 </div>
                 <button onClick={() => setShowPricing(false)} className="p-2 hover:bg-[#E5E7EB] rounded-full transition-colors"><X className="w-5 h-5 text-[#9CA3AF]" /></button>
              </div>
              <div className="p-8 grid md:grid-cols-3 gap-6">
                 {/* Starter */}
                 <div className="border border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg transition-all hover:border-[#4338CA]">
                    <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center mb-4"><Zap className="w-5 h-5 text-[#6B7280]" /></div>
                    <h3 className="font-bold text-lg text-[#111827]">Starter</h3>
                    <div className="text-3xl font-bold mt-2 text-[#111827]">₹1,299</div>
                    <p className="text-sm text-[#6B7280] mt-1">100 Credits</p>
                    <button onClick={handleSelectPlan} className="w-full mt-6 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#111827] hover:text-white hover:border-[#111827] transition-colors text-[#111827]">Select Plan</button>
                    <ul className="mt-6 space-y-3">
                       <li className="text-sm text-[#6B7280] flex gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 20 Contact Unlocks</li>
                       <li className="text-sm text-[#6B7280] flex gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Basic Sequencing</li>
                    </ul>
                 </div>
                 
                 {/* Pro */}
                 <div className="border border-[#312E81] bg-[#1E1B4B] rounded-xl p-6 text-white transform scale-105 shadow-xl">
                    <div className="flex justify-between items-start">
                       <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4"><Star className="w-5 h-5 text-[#A78BFA]" /></div>
                       <span className="bg-[#A78BFA] text-[#111827] text-[10px] font-bold px-2 py-1 rounded">POPULAR</span>
                    </div>
                    <h3 className="font-bold text-lg">Growth</h3>
                    <div className="text-3xl font-bold mt-2">₹4,999</div>
                    <p className="text-sm text-indigo-200 mt-1">500 Credits</p>
                    <button onClick={handleSelectPlan} className="w-full mt-6 py-2 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] transition-colors shadow-lg">Select Plan</button>
                    <ul className="mt-6 space-y-3">
                       <li className="text-sm text-indigo-100 flex gap-2"><Check className="w-4 h-4 text-[#A78BFA]" /> 100 Contact Unlocks</li>
                       <li className="text-sm text-indigo-100 flex gap-2"><Check className="w-4 h-4 text-[#A78BFA]" /> Advanced AI Scoring</li>
                       <li className="text-sm text-indigo-100 flex gap-2"><Check className="w-4 h-4 text-[#A78BFA]" /> Priority Support</li>
                    </ul>
                 </div>

                 {/* Scale */}
                 <div className="border border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg transition-all hover:border-[#4338CA]">
                    <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center mb-4"><Shield className="w-5 h-5 text-[#6B7280]" /></div>
                    <h3 className="font-bold text-lg text-[#111827]">Scale</h3>
                    <div className="text-3xl font-bold mt-2 text-[#111827]">₹12,999</div>
                    <p className="text-sm text-[#6B7280] mt-1">2000 Credits</p>
                    <button onClick={handleSelectPlan} className="w-full mt-6 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#111827] hover:text-white hover:border-[#111827] transition-colors text-[#111827]">Select Plan</button>
                    <ul className="mt-6 space-y-3">
                       <li className="text-sm text-[#6B7280] flex gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 400 Contact Unlocks</li>
                       <li className="text-sm text-[#6B7280] flex gap-2"><Check className="w-4 h-4 text-[#10B981]" /> API Access</li>
                    </ul>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Invoices Modal */}
      {showInvoices && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                 <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
                     <h3 className="font-semibold text-[#111827]">Invoices</h3>
                     <button onClick={() => setShowInvoices(false)}><X className="w-5 h-5 text-[#9CA3AF] hover:text-[#111827]" /></button>
                 </div>
                 <div className="p-2">
                     <table className="w-full text-left text-sm">
                         <thead className="text-[#6B7280] font-medium border-b border-[#E5E7EB]">
                             <tr>
                                 <th className="px-4 py-3">Invoice ID</th>
                                 <th className="px-4 py-3">Date</th>
                                 <th className="px-4 py-3">Plan</th>
                                 <th className="px-4 py-3">Amount</th>
                                 <th className="px-4 py-3 text-right">Download</th>
                             </tr>
                         </thead>
                         <tbody>
                             {invoices.map(inv => (
                                 <tr key={inv.id} className="hover:bg-[#F9FAFB] border-b border-[#F9FAFB] last:border-0">
                                     <td className="px-4 py-3 font-medium text-[#111827] flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#9CA3AF]" /> {inv.id}
                                     </td>
                                     <td className="px-4 py-3 text-[#6B7280]">{inv.date}</td>
                                     <td className="px-4 py-3 text-[#4B5563]">{inv.planName}</td>
                                     <td className="px-4 py-3 text-[#111827] font-medium">₹{inv.amount.toLocaleString()}</td>
                                     <td className="px-4 py-3 text-right">
                                         <button className="text-[#9CA3AF] hover:text-[#111827] transition-colors"><Download className="w-4 h-4 ml-auto" /></button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};