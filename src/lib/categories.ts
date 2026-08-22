export const CATEGORIES = [
  ["seo-ai-visibility", "SEO & AI Visibility"],
  ["ai-agents-infrastructure", "AI Agents & Infrastructure"],
  ["ai-media-generation", "AI Media Generation"],
  ["marketing-advertising", "Marketing & Advertising"],
  ["developer-tools", "Developer Tools"],
  ["productivity-personal-tools", "Productivity & Personal Tools"],
  ["people-profiles", "People & Profiles"],
  ["design-creative", "Design & Creative"],
  ["social-media-creator-tools", "Social Media & Creator Tools"],
  ["writing-content", "Writing & Content"],
  ["sales-lead-generation", "Sales & Lead Generation"],
  ["business-finance-legal", "Business, Finance & Legal"],
  ["games-entertainment", "Games & Entertainment"],
  ["education-learning", "Education & Learning"],
  ["health-fitness-wellness", "Health, Fitness & Wellness"],
  ["ecommerce-retail", "Ecommerce & Retail"],
  ["directories-launch-discovery", "Directories, Launch & Discovery"],
  ["hiring-jobs-careers", "Hiring, Jobs & Careers"],
  ["audio-voice-podcasting", "Audio, Voice & Podcasting"],
  ["crypto-web3-investing", "Crypto, Web3 & Investing"],
  ["agencies-studios-services", "Agencies, Studios & Services"],
  ["security-privacy-compliance", "Security, Privacy & Compliance"],
  ["travel-local-lifestyle", "Travel, Local & Lifestyle"],
  ["media-news", "Media & News"],
  ["domains-web-assets", "Domains & Web Assets"],
  ["leaderboards-attention", "Leaderboards & Attention Markets"],
  ["real-estate-property", "Real Estate & Property"],
  ["other", "Other"],
] as const;

export type CategorySlug = (typeof CATEGORIES)[number][0];
export const CATEGORY_SLUGS = new Set<string>(CATEGORIES.map(([slug]) => slug));
export const categoryLabel = (slug: string) => CATEGORIES.find(([value]) => value === slug)?.[1] ?? "Other";
