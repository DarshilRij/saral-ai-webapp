// utils/avatar.ts
const pastelColors = [
  "#FCE7F3",
  "#E0F2FE",
  "#E0FBEA",
  "#FFF7E6",
  "#F3E8FF",
  "#FFEFEF",
  "#F0FDF4",
  "#F5F3FF",
  "#E3F2FD",
];

const pickColor = (name?: string | null) => {
  const seed = (name || "user").trim();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pastelColors[Math.abs(hash) % pastelColors.length];
};

const escapeXml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getInitials = (name?: string | null) => {
  const seed = (name || "user").trim();
  return (
    seed
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
};

export const defaultAvatarBase64 = (name?: string | null, size = 128) => {
  const initials = escapeXml(getInitials(name));
  const bg = pickColor(name);
  const fontSize = Math.floor(size / 2.8);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='${bg}' rx='18' ry='18'/>
    <text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, Roboto, Arial, sans-serif' font-weight='600' font-size='${fontSize}' fill='#111827'>${initials}</text>
  </svg>`;

  // Browser-friendly base64 (works on server or client)
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg, "utf8").toString("base64");

  return `data:image/svg+xml;base64,${base64}`;
};

const SKILL_BADGE_CLASSES = [
  "bg-indigo-50 text-indigo-700 border-indigo-100",
  "bg-sky-50 text-sky-700 border-sky-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-teal-50 text-teal-700 border-teal-100",
];

function getSkillBadgeClass(skill: string): string {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = (hash << 5) - hash + skill.charCodeAt(i);
    hash |= 0; // convert to 32-bit int
  }
  const idx = Math.abs(hash) % SKILL_BADGE_CLASSES.length;
  return SKILL_BADGE_CLASSES[idx];
}

export { getSkillBadgeClass };