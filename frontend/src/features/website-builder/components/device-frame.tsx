"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "cn";

export type Device = "desktop" | "tablet" | "mobile";

// Size the site is laid out at (CSS px), before it is scaled into the frame.
const VIEWPORTS: Record<Device, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 820, height: 600 },
  mobile: { width: 390, height: 780 },
};

// On-screen frame width: capped, and short enough to fit under the top bar.
const FRAME_WIDTHS: Record<Device, string> = {
  desktop: "min(100%, 1000px, calc((100dvh - 15rem) * 1.6))",
  tablet: "min(100%, 640px, calc((100dvh - 13rem) * 1.37))",
  mobile: "min(100%, 300px, calc((100dvh - 14rem) * 0.5))",
};

type DeviceFrameProps = {
  device: Device;
  // Shown in the desktop browser bar.
  url: string;
  // CSS width of the frame; defaults to a size that fits the preview page.
  width?: string;
  children: ReactNode;
};

// Laptop, tablet or phone drawn around the site preview.
export function DeviceFrame({
  device,
  url,
  width,
  children,
}: DeviceFrameProps) {
  const frameWidth = width ?? FRAME_WIDTHS[device];
  const screen = <ScaledScreen device={device}>{children}</ScaledScreen>;

  if (device === "desktop") {
    return (
      <div
        className="mx-auto flex flex-col items-center"
        style={{ width: frameWidth }}
      >
        <div className="relative w-full rounded-[1.4rem] border-2 border-[#3b4250] bg-[#1d2430] p-2.5 shadow-2xl">
          <span
            aria-hidden="true"
            className="absolute top-0 left-1/2 h-2.5 w-20 -translate-x-1/2 rounded-b-lg bg-[#0e131b]"
          />
          <div className="overflow-hidden rounded-md bg-white">
            <div className="flex h-7 items-center gap-1.5 border-b border-black/5 bg-[#eef1f4] px-3">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#ff5f57]"
              />
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#febc2e]"
              />
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#28c840]"
              />
              <span className="mx-auto w-1/2 truncate rounded bg-white px-3 py-0.5 text-center text-[0.65rem] text-[#64748b]">
                {url}
              </span>
            </div>
            {screen}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="relative h-3.5 w-[112%] rounded-b-2xl bg-linear-to-b from-[#e3e7ec] to-[#c9d0d8] shadow-lg"
        >
          <span className="absolute top-0 left-1/2 h-1.5 w-24 -translate-x-1/2 rounded-b-md bg-[#b8c0ca]" />
        </div>
      </div>
    );
  }

  const phone = device === "mobile";
  return (
    <div
      className={cn(
        "relative mx-auto border-2 border-[#3b4250] bg-[#1d2430] shadow-2xl",
        phone ? "rounded-[2.6rem] p-2.5" : "rounded-[1.8rem] p-3",
      )}
      style={{ width: frameWidth }}
    >
      <div
        className={cn(
          "overflow-hidden bg-white",
          phone ? "rounded-[2rem]" : "rounded-[1.1rem]",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-between px-5 text-[0.7rem] font-semibold text-[#0b2240]",
            phone ? "h-9" : "h-7",
          )}
        >
          <span>9:41</span>
          {phone ? (
            <span
              aria-hidden="true"
              className="absolute top-1.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0e131b]"
            />
          ) : null}
          <span aria-hidden="true" className="flex gap-1">
            <span className="h-2 w-3 rounded-sm bg-[#0b2240]" />
            <span className="h-2 w-4 rounded-sm bg-[#0b2240]" />
          </span>
        </div>
        {screen}
      </div>
    </div>
  );
}

// Lays the site out at the device's real width, then scales it to the frame.
function ScaledScreen({
  device,
  children,
}: {
  device: Device;
  children: ReactNode;
}) {
  const { width, height } = VIEWPORTS[device];
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / width),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  const style: CSSProperties = {
    width,
    height,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    visibility: scale ? "visible" : "hidden",
  };

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className="absolute top-0 left-0" style={style}>
        {children}
      </div>
    </div>
  );
}
