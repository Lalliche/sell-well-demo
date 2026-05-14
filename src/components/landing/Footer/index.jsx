/* The Footer is a single-component module — no server/client split needed.
 * `Footer.jsx` is already a client component (uses useTranslations + the
 * locale switcher). Re-export so imports stay symmetric with the other
 * landing folders. */
export { default } from "./Footer";
