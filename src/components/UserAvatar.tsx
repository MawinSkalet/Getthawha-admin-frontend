"use client";

import { useState } from "react";
import Image from "next/image";
import { UserIcon } from "@heroicons/react/24/outline";
import { resolveImageUrl } from "@/lib/imageUrl";

type UserAvatarProps = {
  name?: string | null;
  pictureUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "square";
  className?: string;
};

const dimensions = {
  sm: { className: "h-8 w-8 text-xs", pixels: 32 },
  md: { className: "h-10 w-10 text-xs", pixels: 40 },
  lg: { className: "h-12 w-12 text-sm", pixels: 48 },
  xl: { className: "h-20 w-20 text-xl", pixels: 80 },
  "2xl": { className: "h-24 w-24 text-2xl", pixels: 96 },
};

function getInitials(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length
    ? parts.slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase()
    : "";
}

export default function UserAvatar({
  name,
  pictureUrl,
  size = "md",
  shape = "circle",
  className = "",
}: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = resolveImageUrl(pictureUrl);
  const { className: dimensionClass, pixels } = dimensions[size];
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const label = name?.trim() || "Customer";

  return (
    <span
      role="img"
      aria-label={`${label} profile photo`}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-[#E9DFCE] bg-[#F4EAD4] font-semibold text-[#735318] ${shapeClass} ${dimensionClass} ${className}`}
    >
      {src && failedUrl !== src ? (
        <Image
          src={src}
          alt=""
          aria-hidden="true"
          width={pixels}
          height={pixels}
          className="h-full w-full object-cover"
          unoptimized
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <span aria-hidden="true" className="leading-none">
          {getInitials(name) || <UserIcon className="h-1/2 w-1/2" />}
        </span>
      )}
    </span>
  );
}
