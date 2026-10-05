const isStaticClientAsset = (path: string) =>
  path.startsWith("figma-assets/") ||
  /^branch-[1-5]\.(?:jpe?g|webp)$/i.test(path) ||
  /^(?:aromapics|home-pic1)\.(?:png|jpe?g|webp)$/i.test(path);

function getApiBase() {
  // Image URLs are rendered in the browser; never expose Docker's internal
  // backend hostname from the server-only INTERNAL_API_URL setting.
  const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return `${publicBase.replace(/\/+$/, "")}/`;
}

/** Resolve API upload paths against the same backend used by Admin API calls. */
export function resolveImageUrl(value?: string | null): string | null {
  let source = value?.trim().replace(/\\/g, "/");
  if (!source) return null;

  // Some older records were saved while DOMAIN was unset on the backend.
  source = source.replace(/^(?:undefined|null)\/(uploads\/)/i, "/$1");

  if (/^(?:data:|blob:)/i.test(source)) return source;

  if (/^https?:\/\//i.test(source)) {
    try {
      const parsed = new URL(source);
      const isBackendUpload = parsed.pathname.startsWith("/uploads/");
      const isLocalBackend = ["localhost", "127.0.0.1", "backend"].includes(
        parsed.hostname.toLowerCase()
      );
      if (isBackendUpload && isLocalBackend) {
        return new URL(`${parsed.pathname}${parsed.search}`, getApiBase()).toString();
      }
    } catch {
      return null;
    }
    return source;
  }

  if (source.startsWith("//")) return `https:${source}`;

  const withoutLeadingSlash = source.replace(/^\/+/, "");
  if (isStaticClientAsset(withoutLeadingSlash)) {
    return `/${withoutLeadingSlash}`;
  }

  if (/^(?:public\/)?uploads\//i.test(withoutLeadingSlash)) {
    const uploadPath = withoutLeadingSlash.replace(/^public\//i, "");
    return new URL(`/${uploadPath}`, getApiBase()).toString();
  }

  // Root-relative paths outside /uploads are assets served from this frontend.
  if (source.startsWith("/")) return source;

  // Legacy upload records may contain a filename/path without a leading slash.
  return new URL(`/${withoutLeadingSlash}`, getApiBase()).toString();
}
