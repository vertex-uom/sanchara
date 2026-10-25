"use client";

import { useEffect, useMemo } from "react";
import { BedDouble, type LucideIcon } from "lucide-react";
import { cn } from "cn";

type LocalThumbnailProps = {
  file: File | undefined;
  className: string;
  // Shown when there is no file yet.
  placeholderIcon?: LucideIcon;
};

// Preview of a file picked in this browser (not uploaded yet).
export function LocalThumbnail({
  file,
  className,
  placeholderIcon: Icon = BedDouble,
}: LocalThumbnailProps) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!url) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center bg-office-chip text-office-muted",
          className,
        )}
      >
        <Icon className="size-5" strokeWidth={1.5} />
      </span>
    );
  }
  // Local object URL preview, so next/image is not used.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={cn("object-cover", className)} />;
}
