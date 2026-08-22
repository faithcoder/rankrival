export function formatMoney(amount: number): string {
  const dollars = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function formatMoneyCents(amount: number): string {
  return formatMoney(amount);
}

export function timeAgo(date: string | number | Date): string {
  const then = new Date(date).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function extractDomain(url: string): string {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

export function normalizeUrl(url: string): string {
  let u = url.trim();
  if (/^@[A-Za-z0-9_]{1,15}$/.test(u)) u = `https://x.com/${u.slice(1)}`;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (parsed.username || parsed.password) return "";
    parsed.search = "";
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

const blockedHosts = ["discord.com", "discord.gg", "discordapp.com", "t.me", "telegram.me", "telegram.org", "whatsapp.com", "chat.whatsapp.com", "signal.group", "signal.me", "m.me", "messenger.com", "bit.ly", "tinyurl.com", "t.co", "goo.gl", "shorturl.at", "cutt.ly", "ow.ly", "buff.ly", "rebrand.ly", "is.gd"];

export function validatePublicListingUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
    if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0" || host === "::1") return "Local and private addresses are not allowed";
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return "Local and private addresses are not allowed";
    if (blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return "Chat, invite, and shortened links are not allowed";
    if (/(^|\.)(porn|xxx|nsfw)(\.|$)/i.test(host)) return "Adult-content links are not allowed";
    return null;
  } catch {
    return "Please enter a valid public URL";
  }
}

export function formatClicks(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
