/**
 * File metadata helpers — used by `DocumentCard` and any other surface
 * that displays an uploaded file or external video URL.
 *
 * Pure functions, no React. Keeps the card component free of detection
 * noise and lets us unit-test the inference once.
 */

const VIDEO_PROVIDERS = [
  { name: "youtube", host: /(?:youtube\.com|youtu\.be)/ },
  { name: "loom",    host: /loom\.com/ },
  { name: "vimeo",   host: /vimeo\.com/ },
];

/**
 * Returns one of: 'pdf' | 'pptx' | 'image' | 'zip' | 'video' | 'other'.
 * `kind` carries the high-level intent (file vs URL); the file URL is
 * inspected for extension, the external URL is matched against known
 * video providers.
 */
export function inferFileKind({ kind, fileUrl, externalUrl }) {
  if (kind === "url" && externalUrl) {
    try {
      const u = new URL(externalUrl);
      if (VIDEO_PROVIDERS.some((p) => p.host.test(u.host))) return "video";
    } catch {
      // malformed URL — fall through to 'other'
    }
    return "other";
  }
  if (!fileUrl) return "other";
  const ext = (fileUrl.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "ppt" || ext === "pptx") return "pptx";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (ext === "zip") return "zip";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "other";
}

/**
 * Returns the matched video provider name ('youtube' | 'loom' | 'vimeo')
 * or null. Used by the preview modal to pick an embed strategy.
 */
export function detectVideoProvider(url) {
  try {
    const u = new URL(url);
    const match = VIDEO_PROVIDERS.find((p) => p.host.test(u.host));
    return match?.name ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the embed URL for a YouTube / Loom / Vimeo share URL, or null
 * when no embed shape is known. The preview modal injects the result
 * into an `<iframe src=...>`.
 */
export function toEmbedUrl(url) {
  const provider = detectVideoProvider(url);
  if (!provider) return null;
  try {
    const u = new URL(url);
    if (provider === "youtube") {
      // Handles both https://youtu.be/<id> and https://youtube.com/watch?v=<id>
      const id = u.host.includes("youtu.be")
        ? u.pathname.replace(/^\//, "")
        : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (provider === "loom") {
      // https://loom.com/share/<id> → /embed/<id>
      const id = u.pathname.replace(/^\/(?:share|embed)\//, "");
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (provider === "vimeo") {
      // https://vimeo.com/<id> → https://player.vimeo.com/video/<id>
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Trailing component of a path, defensive against query strings. */
export function fileNameFromUrl(url) {
  if (!url) return "";
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() ?? "") || "";
  } catch {
    return url.split("/").pop() ?? "";
  }
}

/** Bytes → "1.2 MB" / "640 KB". Returns "" when size is unknown. */
export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
