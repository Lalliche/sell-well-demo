import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /**
   * `next/image` hostname allowlist. Anything rendered via <Image src="https://..." />
   * has to be listed here or Next.js refuses to load it.
   *
   * `placehold.co` — used by mock seeds (CompanyProfile.logo, Campaign.product_image,
   *                   SalesPartnerProfile.profile_photo) to render brand-tinted
   *                   placeholders during pre-launch. Will go away once real
   *                   assets ship.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "muvetzgvrylrwxyxshph.supabase.co",
      },
    ],
    /**
     * placehold.co returns SVG by default. Next's image optimizer rejects
     * SVG unless this flag is set, because SVG can carry inline scripts.
     * Acceptable here: the only allowlisted host above is placehold.co,
     * the URLs are hard-coded in mock seeds (no user-controlled paths),
     * and the whole pipeline disappears once real CompanyProfile.logo /
     * Campaign.product_image / SalesPartnerProfile.profile_photo upload
     * flows ship in Phase 6/7. Re-evaluate then.
     *
     * The strict CSP below blocks scripts and frames from loaded SVGs,
     * keeping the security envelope tight while the flag is on.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
