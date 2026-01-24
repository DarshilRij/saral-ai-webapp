import React from "react";
import {
  ArrowRight,
  Search,
  Zap,
  Globe,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827] font-sans selection:bg-[#A78BFA]/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/logo/saral-logo.svg"
              alt="Saral AI Logo"
              className="h-10 w-auto"
            />

            <span className="font-semibold tracking-tight text-lg">
              SARAL AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
            <a
              href="#features"
              className="hover:text-[#4338CA] transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="hover:text-[#4338CA] transition-colors"
            >
              Customers
            </a>
            <a
              href="#pricing"
              className="hover:text-[#4338CA] transition-colors"
            >
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="text-sm font-medium text-[#6B7280] hover:text-[#111827]"
              onClick={() => handleStart("/login")}
            >
              Log in
            </button>
            <button
              onClick={() => handleStart("/signup")}
              className="bg-[#4338CA] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#312E81] transition-colors shadow-sm shadow-[#4338CA]/20"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-[#4338CA] mb-8 animate-fade-in-up shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
          v2.0 is now live
        </div>

        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1] mb-6 text-[#111827]">
          Define the role once. <br />
          <span className="text-[#6B7280]">SARAL finds the right talent.</span>
        </h1>

        <p className="text-xl text-[#6B7280] max-w-2xl mx-auto mb-16 font-light leading-relaxed">
          Tell us who you want to hire. SARAL AI finds them across the internet in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-7">
          <button
            onClick={() => handleStart("/signup")}
            className="group h-12 px-8 bg-[#4338CA] text-white rounded-xl font-medium flex items-center gap-2 hover:bg-[#312E81] transition-all shadow-lg shadow-[#4338CA]/30 hover:-translate-y-0.5"
          >
            Start Searching Free{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="h-12 px-8 bg-white text-[#111827] border border-[#E5E7EB] rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Book a Demo
          </button>
        </div>

        <p className="text-xl text-[#6B7280] max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          Built for recruiters who care about speed, relevance, and signal over noise.
        </p>

        {/* Mockup */}
        <div className="relative mx-auto max-w-4xl bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden aspect-[16/10]">
          <div className="absolute top-0 left-0 right-0 h-10 bg-[#F7F8FA] border-b border-[#E5E7EB] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]/60"></div>
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60"></div>
            <div className="w-3 h-3 rounded-full bg-[#10B981]/60"></div>
          </div>
          <div className="pt-16 px-8 pb-8 h-full flex flex-col items-center justify-center bg-white">
            <div className="w-full max-w-lg">
              <div className="text-2xl font-medium text-gray-300 mb-6 text-center">
                "Find me a Senior React Engineer in SF..."
              </div>
              <div className="h-1.5 w-full bg-[#F7F8FA] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#4338CA] rounded-full"></div>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-4 opacity-40 blur-[1px]">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                      <div className="space-y-1">
                        <div className="h-3 w-24 bg-gray-100 rounded"></div>
                        <div className="h-2 w-16 bg-gray-50 rounded"></div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded mb-2"></div>
                    <div className="h-2 w-3/4 bg-gray-50 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Section */}
      <section className="py-12 border-y border-[#E5E7EB] bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-widest mb-8">
            Trusted by modern recruiting teams
          </p>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-[#F7F8FA] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#111827] mb-4">
              Everything you need to hire top 1% talent
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              From sourcing to outreach, we automate the busy work so you can
              focus on closing candidates.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="w-6 h-6" />}
              title="Natural Language Search"
              desc="Just describe who you need. Our AI translates your words into complex boolean queries across platforms."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Instant Scoring"
              desc="Every profile is automatically scored against your job description for relevance and stability."
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Multi-Source Data"
              desc="We aggregate data from LinkedIn, GitHub, Behance, and personal portfolios into one view."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Smart Sequencing"
              desc="Set up multi-step email campaigns with automated follow-ups to triple your response rates."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Verified Contact Info"
              desc="Unlock personal emails and phone numbers with our credit system. 95% deliverability guarantee."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Collaborative Lists"
              desc="Share projects with hiring managers, get feedback, and shortlist candidates together."
            />
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-[#111827] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/assets/logo/saral-logo.svg"
                alt="Saral AI Logo"
                className="h-10 w-auto"
              />
              <span className="font-semibold tracking-tight text-lg">
                SARAL AI
              </span>
            </div>
            <p className="text-[#6B7280] text-sm">
              © 2024 SARAL AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-[#6B7280]">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="p-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-[#F7F8FA] rounded-xl flex items-center justify-center mb-6 text-[#4338CA]">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-3 text-[#111827]">{title}</h3>
    <p className="text-[#6B7280] leading-relaxed text-sm">{desc}</p>
  </div>
);
