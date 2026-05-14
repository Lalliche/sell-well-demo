/* Placeholder text-logos for the pre-launch TrustedBy strip. Each is a
 * tiny stateless component rendering the company name in Sora-bold so the
 * strip looks like a coherent logo row even before real SVGs land. Swap
 * any of these for `<Image src="..." />` when real partner logos arrive. */

const baseClass =
  "font-heading font-bold text-[1.375em] tracking-[-0.02em] text-text-muted whitespace-nowrap select-none";

export const PLACEHOLDER_LOGOS = [
  { id: "atlas-crm",     label: "Atlas CRM" },
  { id: "sahara-stack",  label: "Sahara Stack" },
  { id: "maghreb-cloud", label: "Maghreb Cloud" },
  { id: "casbah-erp",    label: "Casbah ERP" },
  { id: "tindouf-pay",   label: "Tindouf Pay" },
  { id: "oran-logix",    label: "Oran Logix" },
];

export default function PlaceholderLogo({ label }) {
  return <span className={baseClass}>{label}</span>;
}
