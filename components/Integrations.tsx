import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

export const Integrations: React.FC = () => {
  const [connected, setConnected] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (id: string) => {
    setConnecting(id);
    setTimeout(() => {
      setConnected([...connected, id]);
      setConnecting(null);
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setConnected(connected.filter(c => c !== id));
  };

  const integrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Connect your Google Workspace to send emails directly from SARAL.',
      icon: (
        <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"></path></svg>
        </div>
      )
    },
    {
      id: 'outlook',
      name: 'Outlook',
      description: 'Sync with Microsoft Outlook 365 for seamless scheduling and mail.',
      icon: (
        <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center shadow-sm">
           <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="#0078D4" d="M1 11.5h6v11.5H1V11.5zm0-10.5h6v9.5H1V1zM8 11.5h15v11.5H8V11.5zm0-10.5h15v9.5H8V1z"></path></svg>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#111827]">Integrations</h2>
        <p className="text-[#6B7280] mt-1">Connect your tools to automate workflows.</p>
      </div>

      <div className="grid gap-4">
        {integrations.map((tool) => {
          const isConnected = connected.includes(tool.id);
          const isConnecting = connecting === tool.id;

          return (
            <div key={tool.id} className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {tool.icon}
                <div>
                  <h3 className="font-semibold text-[#111827] flex items-center gap-2">
                    {tool.name}
                    {isConnected && <span className="text-xs font-medium text-[#059669] bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
                  </h3>
                  <p className="text-[#6B7280] text-sm mt-1 max-w-lg">{tool.description}</p>
                </div>
              </div>
              <div>
                {isConnected ? (
                  <button 
                    onClick={() => handleDisconnect(tool.id)}
                    className="px-4 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-sm font-medium hover:bg-red-50 hover:text-[#EF4444] hover:border-red-100 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(tool.id)}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-[#4338CA] text-white rounded-lg text-sm font-medium hover:bg-[#312E81] transition-colors min-w-[100px] flex justify-center shadow-sm"
                  >
                    {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB] text-center">
        <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center mx-auto mb-3 text-[#9CA3AF]">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-medium text-[#111827]">Need more integrations?</h4>
        <p className="text-xs text-[#6B7280] mt-1 mb-3">We are adding ATS support for Greenhouse and Lever soon.</p>
        <button className="text-xs font-medium text-[#4338CA] hover:underline">Request an integration</button>
      </div>
    </div>
  );
};