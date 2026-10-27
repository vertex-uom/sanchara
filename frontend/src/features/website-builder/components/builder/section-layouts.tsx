import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionType =
  | "hero"
  | "about"
  | "rooms"
  | "amenities"
  | "gallery"
  | "testimonials"
  | "booking"
  | "contact";

export type SectionLayout = {
  label: string;
  description: string;
  thumb: ReactNode;
};

// Thumbnail parts: a beach "photo", text bars and a button, drawn with CSS.
function Pic({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block bg-[linear-gradient(180deg,#8fcbe8_0%,#c7e7f3_42%,#2aa3b4_52%,#5cc3c8_62%,#e8d6ae_78%,#d9c08f_100%)]",
        className,
      )}
    />
  );
}

function Bar({
  w,
  dark,
  className,
}: {
  w: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block h-1.5 rounded-full",
        dark ? "bg-[#0b2240]" : "bg-white",
        className,
      )}
      style={{ width: w }}
    />
  );
}

function Btn({ className }: { className?: string }) {
  return (
    <span
      className={cn("block h-2 w-8 rounded-sm bg-office-primary", className)}
    />
  );
}

function Lines({ dark = true, count = 2 }: { dark?: boolean; count?: number }) {
  return (
    <span className="flex flex-col gap-1">
      {Array.from({ length: count }, (_, index) => (
        <Bar
          key={index}
          w={index === count - 1 ? "60%" : "90%"}
          dark={dark}
          className="h-1 opacity-40"
        />
      ))}
    </span>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("block overflow-hidden rounded-sm bg-white", className)}
    >
      {children}
    </span>
  );
}

function Dots({ count = 3 }: { count?: number }) {
  return (
    <span className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-1 rounded-full",
            index ? "bg-white/60" : "bg-white",
          )}
        />
      ))}
    </span>
  );
}

function Arrow({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white shadow",
        side === "left" ? "left-1.5" : "right-1.5",
      )}
    />
  );
}

const frame = "relative flex h-full w-full overflow-hidden bg-[#f6f8f9]";

// Layouts for each section; the first is the default.
export const SECTION_LAYOUTS: Record<SectionType, SectionLayout[]> = {
  hero: [
    {
      label: "Full image",
      description: "Large photo with text on the left",
      thumb: (
        <span className={frame}>
          <Pic className="absolute inset-0" />
          <span className="relative flex flex-col justify-center gap-1.5 pl-[12%]">
            <Bar w="4.5rem" />
            <Bar w="3.5rem" />
            <Bar w="2.5rem" className="h-1 opacity-80" />
            <Btn className="mt-1" />
          </span>
        </span>
      ),
    },
    {
      label: "Split",
      description: "Text and photo side by side",
      thumb: (
        <span className={cn(frame, "bg-white")}>
          <span className="flex w-1/2 flex-col justify-center gap-1.5 pl-[8%]">
            <Bar w="80%" dark />
            <Bar w="65%" dark />
            <Bar w="55%" dark className="h-1 opacity-40" />
            <Btn className="mt-1" />
          </span>
          <Pic className="w-1/2" />
        </span>
      ),
    },
    {
      label: "Centered",
      description: "Centered text over a dimmed photo",
      thumb: (
        <span className={frame}>
          <Pic className="absolute inset-0" />
          <span className="absolute inset-0 bg-black/30" />
          <span className="relative flex w-full flex-col items-center justify-center gap-1.5">
            <Bar w="5rem" />
            <Bar w="3.5rem" />
            <Bar w="2rem" className="mt-1 h-2 rounded-sm" />
          </span>
        </span>
      ),
    },
    {
      label: "Slider",
      description: "Multiple photos with arrows",
      thumb: (
        <span className={frame}>
          <Pic className="absolute inset-0" />
          <Arrow side="left" />
          <Arrow side="right" />
          <Dots />
        </span>
      ),
    },
  ],
  about: [
    {
      label: "Text + photo",
      description: "Your story beside a photo",
      thumb: (
        <span className={cn(frame, "items-center gap-[6%] bg-white px-[8%]")}>
          <span className="flex flex-1 flex-col gap-1.5">
            <Bar w="70%" dark />
            <Lines count={3} />
          </span>
          <Pic className="h-[70%] flex-1 rounded-sm" />
        </span>
      ),
    },
    {
      label: "Photo left",
      description: "Photo first, then your story",
      thumb: (
        <span className={cn(frame, "items-center gap-[6%] bg-white px-[8%]")}>
          <Pic className="h-[70%] flex-1 rounded-sm" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Bar w="70%" dark />
            <Lines count={3} />
          </span>
        </span>
      ),
    },
    {
      label: "Centered",
      description: "Centered text, no photo",
      thumb: (
        <span
          className={cn(
            frame,
            "flex-col items-center justify-center gap-1.5 bg-white px-[15%]",
          )}
        >
          <Bar w="50%" dark />
          <Bar w="100%" dark className="h-1 opacity-40" />
          <Bar w="90%" dark className="h-1 opacity-40" />
          <Bar w="60%" dark className="h-1 opacity-40" />
        </span>
      ),
    },
  ],
  rooms: [
    {
      label: "Cards",
      description: "Room cards in a grid",
      thumb: (
        <span className={cn(frame, "flex-col gap-1.5 p-[6%]")}>
          <Bar w="35%" dark />
          <span className="grid flex-1 grid-cols-3 gap-1.5">
            {[0, 1, 2].map((index) => (
              <Card key={index}>
                <Pic className="h-3/5" />
                <span className="block p-1">
                  <Bar w="80%" dark className="h-1 opacity-60" />
                </span>
              </Card>
            ))}
          </span>
        </span>
      ),
    },
    {
      label: "List",
      description: "Rooms in rows with photos",
      thumb: (
        <span className={cn(frame, "flex-col gap-1.5 p-[6%]")}>
          {[0, 1, 2].map((index) => (
            <Card key={index} className="flex flex-1 items-center gap-1.5">
              <Pic className="h-full w-1/4" />
              <Bar w="40%" dark className="h-1 opacity-60" />
              <Bar
                w="15%"
                dark
                className="ml-auto mr-1.5 h-1 bg-office-primary"
              />
            </Card>
          ))}
        </span>
      ),
    },
    {
      label: "Featured",
      description: "One large room, others smaller",
      thumb: (
        <span className={cn(frame, "gap-1.5 p-[6%]")}>
          <Card className="flex-[1.4]">
            <Pic className="h-4/5" />
            <span className="block p-1">
              <Bar w="60%" dark className="h-1 opacity-60" />
            </span>
          </Card>
          <span className="flex flex-1 flex-col gap-1.5">
            {[0, 1].map((index) => (
              <Card key={index} className="flex-1">
                <Pic className="h-full" />
              </Card>
            ))}
          </span>
        </span>
      ),
    },
  ],
  amenities: [
    {
      label: "Icon grid",
      description: "Amenities with icons in columns",
      thumb: (
        <span className={cn(frame, "flex-col gap-2 bg-white p-[8%]")}>
          <Bar w="35%" dark />
          <span className="grid flex-1 grid-cols-3 content-center gap-x-2 gap-y-2.5">
            {Array.from({ length: 6 }, (_, index) => (
              <span key={index} className="flex items-center gap-1">
                <span className="size-2.5 shrink-0 rounded-full bg-office-primary/30" />
                <Bar w="70%" dark className="h-1 opacity-40" />
              </span>
            ))}
          </span>
        </span>
      ),
    },
    {
      label: "Tags",
      description: "Amenities as rounded tags",
      thumb: (
        <span className={cn(frame, "flex-col gap-2 bg-white p-[8%]")}>
          <Bar w="35%" dark />
          <span className="flex flex-1 flex-wrap content-center gap-1.5">
            {["2.5rem", "3rem", "2rem", "3.5rem", "2.5rem", "2rem"].map(
              (w, index) => (
                <span
                  key={index}
                  className="h-3 rounded-full border border-office-primary/40"
                  style={{ width: w }}
                />
              ),
            )}
          </span>
        </span>
      ),
    },
  ],
  gallery: [
    {
      label: "Grid",
      description: "An even grid of photos",
      thumb: (
        <span
          className={cn(frame, "grid grid-cols-4 grid-rows-2 gap-1 p-[6%]")}
        >
          {Array.from({ length: 8 }, (_, index) => (
            <Pic key={index} className="rounded-[2px]" />
          ))}
        </span>
      ),
    },
    {
      label: "Mosaic",
      description: "One large photo with smaller ones",
      thumb: (
        <span
          className={cn(frame, "grid grid-cols-4 grid-rows-2 gap-1 p-[6%]")}
        >
          <Pic className="col-span-2 row-span-2 rounded-[2px]" />
          {Array.from({ length: 4 }, (_, index) => (
            <Pic key={index} className="rounded-[2px]" />
          ))}
        </span>
      ),
    },
    {
      label: "Slider",
      description: "One photo at a time with arrows",
      thumb: (
        <span className={cn(frame, "p-[6%]")}>
          <span className="relative block h-full w-full overflow-hidden rounded-sm">
            <Pic className="absolute inset-0" />
            <Arrow side="left" />
            <Arrow side="right" />
            <Dots count={4} />
          </span>
        </span>
      ),
    },
    {
      label: "Strip",
      description: "A row of photos edge to edge",
      thumb: (
        <span className={cn(frame, "flex-col justify-center gap-2 py-[8%]")}>
          <Bar w="30%" dark className="ml-[6%]" />
          <span className="flex h-1/2 gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <Pic key={index} className="flex-1" />
            ))}
          </span>
        </span>
      ),
    },
  ],
  testimonials: [
    {
      label: "Cards",
      description: "Review cards side by side",
      thumb: (
        <span className={cn(frame, "flex-col gap-2 p-[7%]")}>
          <Bar w="40%" dark />
          <span className="grid flex-1 grid-cols-2 gap-1.5">
            {[0, 1].map((index) => (
              <Card key={index} className="flex flex-col gap-1 p-1.5">
                <span className="h-1 w-6 rounded-full bg-amber-400" />
                <Lines count={3} />
              </Card>
            ))}
          </span>
        </span>
      ),
    },
    {
      label: "Single quote",
      description: "One large quote, centered",
      thumb: (
        <span
          className={cn(
            frame,
            "flex-col items-center justify-center gap-1.5 bg-white px-[14%]",
          )}
        >
          <span className="font-serif text-xl leading-none text-office-primary/50">
            “
          </span>
          <Bar w="100%" dark className="h-1.5 opacity-60" />
          <Bar w="80%" dark className="h-1.5 opacity-60" />
          <Bar w="30%" dark className="mt-1 h-1 opacity-40" />
        </span>
      ),
    },
    {
      label: "List",
      description: "Reviews stacked in a column",
      thumb: (
        <span className={cn(frame, "flex-col gap-1.5 p-[7%]")}>
          {[0, 1, 2].map((index) => (
            <Card
              key={index}
              className="flex flex-1 items-center gap-1.5 px-1.5"
            >
              <span className="size-3 shrink-0 rounded-full bg-office-tint-teal" />
              <Lines count={2} />
            </Card>
          ))}
        </span>
      ),
    },
  ],
  booking: [
    {
      label: "Availability bar",
      description: "Dates and guests in one row",
      thumb: (
        <span
          className={cn(
            frame,
            "flex-col items-center justify-center gap-1.5 px-[6%]",
          )}
        >
          <Bar w="40%" dark />
          <Bar w="55%" dark className="h-1 opacity-40" />
          <span className="mt-1 flex w-full items-center gap-1 rounded-sm bg-white p-1 shadow">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="h-2.5 flex-1 rounded-[2px] border border-black/15"
              />
            ))}
            <Btn className="h-2.5 w-7" />
          </span>
        </span>
      ),
    },
    {
      label: "Call to action",
      description: "Text, perks and a button beside a photo",
      thumb: (
        <span className={cn(frame, "items-center gap-[6%] bg-white px-[7%]")}>
          <span className="flex flex-1 flex-col gap-1.5">
            <Bar w="85%" dark />
            <Bar w="65%" dark />
            <span className="my-0.5 flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className="size-2 rounded-full border border-office-primary/50"
                />
              ))}
            </span>
            <Btn />
          </span>
          <Pic className="h-[78%] flex-1 rounded-t-full rounded-b-sm" />
        </span>
      ),
    },
  ],
  contact: [
    {
      label: "Details + map",
      description: "Contact details beside a map",
      thumb: (
        <span className={cn(frame, "items-center gap-[6%] bg-white px-[8%]")}>
          <span className="flex flex-1 flex-col gap-1.5">
            <Bar w="60%" dark />
            <Lines count={3} />
          </span>
          <MapThumb className="h-[70%] flex-1" />
        </span>
      ),
    },
    {
      label: "Map first",
      description: "A wide map with details below",
      thumb: (
        <span className={cn(frame, "flex-col gap-1.5 bg-white p-[6%]")}>
          <MapThumb className="h-3/5" />
          <span className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((index) => (
              <Bar key={index} w="80%" dark className="h-1 opacity-40" />
            ))}
          </span>
        </span>
      ),
    },
    {
      label: "Simple",
      description: "Contact details only, centered",
      thumb: (
        <span
          className={cn(
            frame,
            "flex-col items-center justify-center gap-1.5 bg-white",
          )}
        >
          <Bar w="35%" dark />
          <Bar w="50%" dark className="h-1 opacity-40" />
          <Bar w="40%" dark className="h-1 opacity-40" />
          <Bar w="45%" dark className="h-1 opacity-40" />
        </span>
      ),
    },
  ],
};

function MapThumb({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-sm bg-[#e3efe8]",
        className,
      )}
    >
      <span className="absolute inset-x-0 bottom-0 h-1/4 bg-[#cfe6ee]" />
      <span className="absolute inset-x-0 top-1/2 h-1 bg-white" />
      <span className="absolute inset-y-0 left-2/5 w-1 bg-white" />
      <span className="absolute top-[30%] left-1/2 size-2 rounded-full bg-office-primary" />
    </span>
  );
}
