import { notFound } from "next/navigation";

/**
 * Catch-all for any path under /[locale]/* that doesn't match a real route.
 * Calling notFound() triggers the locale-level not-found.jsx which has the
 * full design system, fonts, and i18n providers available.
 */
export default function CatchAll() {
  notFound();
}
