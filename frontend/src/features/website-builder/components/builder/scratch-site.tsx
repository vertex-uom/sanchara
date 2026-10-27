"use client";

import type { Palette } from "../brand-colors-form";
import { siteAddress } from "../preview-site";
import type { FontStyle } from "../scratch-steps";
import { DRAFT_KEYS, useSavedDraft, useStepSavedAt } from "../template-draft";
import { FILE_KEYS, useTemplateFiles } from "../template-files";
import { BuilderCanvas } from "./builder-canvas";
import { useBuilder, type Builder } from "./builder-state";
import { NO_BLOCK_IMAGES } from "./settings-panel";
import { canvasLook, defaultStyles, type SiteStyles } from "./site-styles";

type ScratchBasics = {
  name: string;
  tagline: string;
  colors: Palette;
  font: FontStyle;
};

export type ScratchSiteData = {
  builder: Builder;
  name: string;
  tagline: string;
  address: string;
  logo: File | null;
  images: Record<string, File[]>;
  styles: SiteStyles;
  // When the built site was last saved (any session); null if never.
  savedAt: Date | null;
};

// The "Start from scratch" site as saved: for review, preview, publish and
// the published screens (read-only use of the builder state).
export function useScratchSite(hotelName: string): ScratchSiteData {
  const basics = useSavedDraft<ScratchBasics>(DRAFT_KEYS.scratch);
  const name = basics?.name?.trim() || hotelName;
  const tagline = basics?.tagline ?? "";
  const builder = useBuilder({ name, tagline });
  const [logo] = useTemplateFiles<File | null>(FILE_KEYS.scratchLogo, null);
  const [images] = useTemplateFiles(
    FILE_KEYS.scratchBlockImages,
    NO_BLOCK_IMAGES,
  );
  const savedAt = useStepSavedAt(DRAFT_KEYS.scratchSite);
  return {
    builder,
    name,
    tagline,
    address: siteAddress(name),
    logo,
    images,
    styles: builder.site.styles ?? defaultStyles(basics),
    savedAt,
  };
}

// The site read-only, starting on the Home page (its menu links switch
// pages). `scroll` makes it scroll inside a fixed height (device frames);
// otherwise it is as tall as its content.
export function ScratchSiteCanvas({
  site,
  scroll = true,
}: {
  site: ScratchSiteData;
  scroll?: boolean;
}) {
  const page = site.builder.page;
  const canvas = (
    <BuilderCanvas
      builder={site.builder}
      name={site.name}
      tagline={site.tagline}
      logo={site.logo}
      images={site.images}
      previewing
      frameless
      {...canvasLook(site.styles, page.background)}
    />
  );
  return scroll ? (
    <div className="h-full overflow-y-auto">{canvas}</div>
  ) : (
    canvas
  );
}
