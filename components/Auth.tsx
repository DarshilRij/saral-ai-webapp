import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Building2,
  User as UserIcon,
  Mail,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User } from "../types";

interface AuthProps {
  onComplete: (user: User) => void;
}

type Mode = "SIGN_IN" | "SIGN_UP";
type Step = "LOGIN" | "OTP" | "ONBOARDING" | "SUCCESS";

// API base (Vite)

// top of file
const API_BASE =
  process.env.MODE === "development"
    ? "/api" // <- local path that Vite will proxy in dev
    : process.env.VITE_API_BASE || (window as any).SARAL_AI_LIVE || "";

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  // allow sending/receiving cookies (backend must set proper CORS & Set-Cookie)
  withCredentials: true,
});

export const Auth: React.FC<AuthProps & { defaultMode?: Mode }> = ({
  defaultMode = "SIGN_IN",
  onComplete,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [step, setStep] = useState<Step>("LOGIN");

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("Recruiter");
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [timeLeft, setTimeLeft] = useState(30);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (step === "OTP" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  // reset when switching mode
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setStep("LOGIN");
    setEmail("");
    setOtp(new Array(6).fill(""));
    setCompany("");
    setRole("Recruiter");
    setTimeLeft(30);
    setError(null);
    setInfo(null);
  };

  // ---------------------------
  // API: send OTP
  // ---------------------------
  const sendOtpRequest = async (targetEmail: string) => {
    if (!targetEmail) throw new Error("Email required");
    const res = await api.post("/auth/send-otp", { email: targetEmail });
    return res.data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    setInfo(null);

    setStep("OTP");
    setLoading(false);

    // try {
    //   await sendOtpRequest(email);
    //   setStep("OTP");
    //   setTimeLeft(30);
    //   setOtp(new Array(6).fill(""));
    //   // focus first OTP input after small delay to ensure render
    //   setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    //   setInfo("OTP sent successfully.");
    // } catch (err: any) {
    //   console.error("send-otp error:", err);
    //   setError(
    //     err?.response?.data?.message ||
    //       err?.message ||
    //       "Failed to send OTP. Try again."
    //   );
    // } finally {
    //   setLoading(false);
    // }
  };

  // ---------------------------
  // OTP input handling
  // ---------------------------
  const handleOtpChange = (value: string, index: number) => {
    // allow only digits
    if (value && isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // ensure single char
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // clear current
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // move to previous
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < otp.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // ---------------------------
  // API: verify OTP
  // ---------------------------
  const verifyOtpRequest = async (targetEmail: string, code: string) => {
    const res = await api.post("/auth/verify-otp", {
      email: targetEmail,
      otp: code,
    });
    return res.data;
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);

    setStep("SUCCESS");
    const user: User = {
      email,
      companyName: company || "Acme Inc",
      credits: 120,
      role,
    };
    onComplete(user);
    setTimeout(() => navigate("/dashboard"), 800);
    setLoading(false);

    // try {
    //   const result = await verifyOtpRequest(email, code);
    //   // Success - call onComplete (if needed) and navigate
    //   setStep("SUCCESS");
    //   setInfo("Verified. Redirecting...");

    //   // If API returned user info, use it; otherwise build basic user
    //   const user: User = {
    //     email,
    //     companyName: company || result?.companyName || "Acme Inc",
    //     credits: result?.credits ?? 120,
    //     role,
    //   };
    //   onComplete(user);

    //   // small delay for success UI then navigate
    //   setTimeout(() => navigate("/dashboard"), 800);
    // } catch (err: any) {
    //   console.error("verify-otp error:", err);
    //   setError(
    //     err?.response?.data?.message ||
    //       err?.message ||
    //       "Invalid or expired OTP. Try again."
    //   );
    //   // clear OTP inputs for user to re-enter
    //   setOtp(new Array(6).fill(""));
    //   setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    // } finally {
    //   setLoading(false);
    // }
  };

  // ---------------------------
  // Onboarding (sign up)
  // ---------------------------
  const handleOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("SUCCESS");
      setTimeout(() => {
        onComplete({
          email,
          companyName: company || "Acme Inc",
          credits: 50,
          role,
        });
        navigate("/dashboard");
      }, 1100);
    }, 900);
  };

  // ---------------------------
  // Resend code
  // ---------------------------
  const resendCode = async () => {
    setError(null);
    setInfo(null);
    // prevent spamming if still waiting
    if (timeLeft > 0) return;
    setLoading(true);
    try {
      await sendOtpRequest(email);
      setOtp(new Array(6).fill(""));
      setTimeLeft(30);
      setInfo("OTP resent.");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      console.error("resend-otp error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to resend OTP. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4338CA]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A78BFA]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center">
            <img
              src="/assets/logo/saral-logo.svg"
              alt="Saral AI Logo"
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
            SARAL AI
          </h1>
          <p className="text-[#6B7280] mt-2">
            The recruiting OS for modern teams.
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
          {step === "SUCCESS" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h2 className="text-2xl font-bold text-[#111827] mb-2">
                You're all set!
              </h2>
              <p className="text-[#6B7280]">
                Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* top progress */}
              <div className="flex justify-center gap-2 mb-6">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step === "LOGIN" ? "w-10 bg-[#4338CA]" : "w-2 bg-[#E5E7EB]"
                  }`}
                ></div>
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step === "OTP" ? "w-10 bg-[#4338CA]" : "w-2 bg-[#E5E7EB]"
                  }`}
                ></div>
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step === "ONBOARDING"
                      ? "w-10 bg-[#4338CA]"
                      : "w-2 bg-[#E5E7EB]"
                  }`}
                ></div>
              </div>

              <h2 className="text-xl font-bold text-[#111827] text-center mb-2">
                {step === "LOGIN" &&
                  (mode === "SIGN_IN"
                    ? "Sign in to your account"
                    : "Create an account")}
                {step === "OTP" && "Verify your identity"}
                {step === "ONBOARDING" && "Setup your workspace"}
              </h2>

              <p className="text-[#6B7280] text-sm text-center mb-6">
                {step === "LOGIN" &&
                  (mode === "SIGN_IN"
                    ? "Enter your work email to get started."
                    : "Enter your work email to create an account.")}
                {step === "OTP" && (
                  <>
                    We sent a secure code to{" "}
                    <span className="font-semibold text-[#111827]">
                      {email}
                    </span>
                  </>
                )}
                {step === "ONBOARDING" && "Tell us a bit about your company."}
              </p>

              {/* show messages */}
              {error && (
                <div className="text-sm text-red-600 mb-4 text-center">
                  {error}
                </div>
              )}
              {info && (
                <div className="text-sm text-green-600 mb-4 text-center">
                  {info}
                </div>
              )}

              {/* LOGIN */}
              {step === "LOGIN" && (
                <form
                  onSubmit={handleLogin}
                  className="space-y-5 animate-fade-in"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all placeholder:text-gray-400 text-sm text-[#111827] font-medium"
                      placeholder="name@company.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-12 bg-[#4338CA] text-white rounded-xl text-sm font-bold hover:bg-[#312E81] transition-all shadow-lg shadow-[#4338CA]/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continue <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP */}
              {step === "OTP" && (
                <form
                  onSubmit={handleOtpSubmit}
                  className="space-y-8 animate-fade-in"
                >
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpInputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        autoFocus={i === 0}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        className="w-12 h-14 text-center text-xl font-bold bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all text-[#111827]"
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading || otp.join("").length < 6}
                      className="w-full h-12 bg-[#4338CA] text-white rounded-xl text-sm font-bold hover:bg-[#312E81] transition-all shadow-lg shadow-[#4338CA]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transform active:scale-[0.98]"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Verify Code"
                      )}
                    </button>

                    <div className="flex justify-between items-center text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("LOGIN");
                          setOtp(new Array(6).fill(""));
                          setError(null);
                        }}
                        className="font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                      >
                        Wrong email?
                      </button>

                      {timeLeft > 0 ? (
                        <span className="text-[#9CA3AF]">
                          Resend code in {timeLeft}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={resendCode}
                          className="font-semibold text-[#4338CA] hover:text-[#312E81] flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* ONBOARDING (Sign up only) */}
              {step === "ONBOARDING" && (
                <form
                  onSubmit={handleOnboarding}
                  className="space-y-5 animate-fade-in"
                >
                  <div className="relative group">
                    <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400 group-focus-within:text-[#4338CA]" />
                      </div>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all text-sm text-[#111827] font-medium"
                        placeholder="Acme Inc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">
                      Your Role
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon className="h-4 w-4 text-gray-400 group-focus-within:text-[#4338CA]" />
                      </div>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all text-sm text-[#111827] font-medium appearance-none cursor-pointer"
                      >
                        <option>Recruiter</option>
                        <option>Hiring Manager</option>
                        <option>Founder</option>
                        <option>Agency</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !company}
                    className="w-full h-12 bg-[#4338CA] text-white rounded-xl text-sm font-bold hover:bg-[#312E81] transition-all shadow-lg shadow-[#4338CA]/25 flex items-center justify-center gap-2 disabled:opacity-70 mt-4 transform active:scale-[0.98] hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer / Mode switch at bottom of card */}
        {step === "LOGIN" ? (
          <div className="text-center mt-6">
            <p className="text-sm text-[#6B7280]">
              {mode === "SIGN_IN"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() =>
                  switchMode(mode === "SIGN_IN" ? "SIGN_UP" : "SIGN_IN")
                }
                className="font-semibold text-[#4338CA] hover:text-[#312E81] transition-colors ml-1"
              >
                {mode === "SIGN_IN" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        ) : (
          <div className="text-center mt-6 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure, enterprise-grade recruiting.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
