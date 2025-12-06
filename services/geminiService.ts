
import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, CareerNode, SaralInsights } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// We will generate a base set and then multiply/vary them to reach 50 for the UI demo 
// to ensure speed and reliability without hitting massive token limits for a single call.
const candidateSchema = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          title: { type: Type.STRING },
          location: { type: Type.STRING },
          experienceYears: { type: Type.NUMBER },
          matchScore: { type: Type.NUMBER },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          currentCompany: { type: Type.STRING },
          bio: { type: Type.STRING },
          education: { type: Type.STRING },
          avgTenure: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlag: { type: Type.STRING },
          altRole1: { type: Type.STRING },
          altRole2: { type: Type.STRING },
        },
        required: ["name", "title", "location", "experienceYears", "matchScore", "skills", "bio", "education", "strengths", "redFlag"],
      },
    },
  },
};

const generateTrajectory = (years: number): CareerNode[] => {
  const nodes: CareerNode[] = [];
  const companies = ["TechCorp", "StartupX", "Innovate Inc", "Global Systems", "DevStudio", "Creative Minds"];
  const roles = ["Junior Dev", "Mid-Level Engineer", "Senior Engineer", "Tech Lead", "Engineering Manager"];
  
  let remainingYears = years;
  let roleIdx = Math.max(0, Math.floor(years / 3));

  while (remainingYears > 0) {
    const duration = Math.min(remainingYears, Math.floor(Math.random() * 3) + 1);
    const company = companies[Math.floor(Math.random() * companies.length)];
    const role = roles[Math.min(roles.length - 1, roleIdx)];
    
    nodes.push({
      company,
      role,
      duration: `${duration} yrs`,
      type: duration > 2 ? 'stable' : 'job-hop'
    });
    
    remainingYears -= duration;
    if (remainingYears > 0 && Math.random() > 0.5) roleIdx = Math.max(0, roleIdx - 1);
  }
  return nodes.reverse(); // Newest first
};

export const generateCandidates = async (jobDescription: string): Promise<Candidate[]> => {
  try {
    const model = "gemini-2.5-flash";
    // We ask for 8 distinct archetypes and will multiply them to 50
    const prompt = `
      Generate 8 distinct, realistic candidate profiles for: "${jobDescription}".
      Include a specific 'redFlag' (e.g. "Short tenure in last role", "Gap in 2022") and 3 'strengths'.
      Suggest 2 alternative roles they could fit.
    `;

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: candidateSchema,
        temperature: 0.8,
      }
    });

    const jsonText = result.text;
    if (!jsonText) return [];

    const parsed = JSON.parse(jsonText);
    const baseCandidates = parsed.candidates || [];
    
    // Multiply to 50
    const fullList: Candidate[] = [];
    for (let i = 0; i < 50; i++) {
      const base = baseCandidates[i % baseCandidates.length];
      const variance = Math.floor(Math.random() * 10) - 5; // +/- 5 score
      
      const insights: SaralInsights = {
        strengths: base.strengths || ["Fast learner", "Team player", "Technical depth"],
        redFlags: [base.redFlag || "None"],
        altRoles: [base.altRole1 || "Backend Dev", base.altRole2 || "System Architect"],
        trajectory: generateTrajectory(base.experienceYears),
        stabilityScore: Math.min(10, Math.max(1, Math.floor(base.matchScore / 10))),
        careerVerdict: base.matchScore > 85 ? "Strong Candidate" : "Potential Match",
      };

      fullList.push({
        ...base,
        id: `cand_${Date.now()}_${i}`,
        matchScore: Math.min(99, Math.max(60, base.matchScore + variance)),
        avatarUrl: `https://i.pravatar.cc/150?u=${base.name.replace(/\s/g, '')}${i}`,
        contactUnlocked: false,
        email: `${base.name.toLowerCase().replace(/\s/g, '.')}@example.com`,
        phone: "+1 (555) 012-3456",
        openToWork: Math.random() > 0.7, // 30% chance
        outreachStatus: 'NOT_CONTACTED',
        socials: {
          linkedin: true,
          github: Math.random() > 0.3,
          behance: Math.random() > 0.8,
          linkedinUrl: `https://linkedin.com/in/${base.name.toLowerCase().replace(/\s/g, '-')}`
        },
        insights,
        workHistory: insights.trajectory.map(t => ({
           role: t.role,
           company: t.company,
           duration: t.duration,
           description: `Focused on delivering high-quality code and collaborating with cross-functional teams at ${t.company}.`
        }))
      });
    }

    // Sort by match score
    return fullList.sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
};
