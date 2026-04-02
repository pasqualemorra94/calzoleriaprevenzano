/** Base application types shared across the app */

/** Language codes supported by the app */
export type SupportedLocale = "it";

/** Navigation item for the main nav */
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

/** Social link */
export interface SocialLink {
  platform: string;
  href: string;
  icon: string;
}

/** Product category */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

/** Trust badge for the trust strip */
export interface TrustBadge {
  icon: string;
  title: string;
  subtitle?: string;
  value?: number;
  suffix?: string;
}
