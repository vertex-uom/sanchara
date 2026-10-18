import type { ComponentProps } from "react";

type RemoteImageProps = Omit<ComponentProps<"img">, "src" | "alt" | "loading"> & {
  src: string;
  alt: string;
  priority?: boolean;
};

// Single wrapper for remote images. Swap the <img> for next/image here once
// images.remotePatterns is configured in next.config.ts.
export function RemoteImage({ src, alt, priority = false, ...props }: RemoteImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- temporary until remotePatterns is approved
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      {...props}
    />
  );
}
