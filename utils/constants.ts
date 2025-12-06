// utils/avatar.ts
const pastelColors = [
  "#FCE7F3", "#E0F2FE", "#E0FBEA", "#FFF7E6", "#F3E8FF",
  "#FFEFEF", "#F0FDF4", "#F5F3FF", "#E3F2FD",
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
