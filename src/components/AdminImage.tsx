"use client";

import { useState, type ComponentProps } from "react";
import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { resolveImageUrl } from "@/lib/imageUrl";

type ImageProps = ComponentProps<typeof Image>;

type AdminImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
};

export default function AdminImage({
  src,
  fallbackSrc,
  alt,
  className = "",
  onError,
  ...imageProps
}: AdminImageProps) {
  const primary = resolveImageUrl(src);
  const fallback = resolveImageUrl(fallbackSrc);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const activeSource =
    (primary && primary !== failedSource && primary) ||
    (fallback && fallback !== failedSource && fallback) ||
    null;

  if (!activeSource) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`flex items-center justify-center overflow-hidden bg-[#F1E9DB] text-[#9A856A] ${className}`}
      >
        <PhotoIcon aria-hidden="true" className="h-1/3 min-h-5 w-1/3 min-w-5" />
      </span>
    );
  }

  return (
    <Image
      {...imageProps}
      src={activeSource}
      alt={alt}
      className={className}
      sizes={imageProps.sizes || "(max-width: 640px) 25vw, 96px"}
      unoptimized={!activeSource.startsWith("/")}
      onError={(event) => {
        setFailedSource(activeSource);
        onError?.(event);
      }}
    />
  );
}
