import { getBaseUrl } from "@/lib/api";
import { resolveImageUrl } from "@/lib/imageUrl";

export async function uploadImage(
  file: File,
  opts?: { fieldName?: string; signal?: AbortSignal }
) {
  const fieldName = opts?.fieldName || "file";
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${getBaseUrl()}/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
    signal: opts?.signal,
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {}
    throw new Error(`Upload failed ${res.status}: ${body}`.trim());
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON from upload");
  }

  // Prefer explicit absolute URL if present
  if (!data || typeof data !== "object") {
    throw new Error("Upload response missing data object");
  }

  const payload = data as Record<string, unknown>;

  let url: string | undefined;
  if (typeof payload.url === "string") {
    url = payload.url;
  }

  // Fallbacks
  if (!url) {
    const fallback =
      (payload.filePath as string | undefined) ||
      (payload.path as string | undefined) ||
      (payload.fileURL as string | undefined);
    url = fallback;
  }

  if (!url) throw new Error("Upload response missing url/filePath");

  const resolvedUrl = resolveImageUrl(url);
  if (!resolvedUrl) throw new Error("Upload response contained an invalid image URL");
  return resolvedUrl;
}
