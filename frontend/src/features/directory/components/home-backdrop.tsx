import { RemoteImage } from "@/components/ui/remote-image";
import { HERO_IMAGE_URL } from "../server/home-images";

// Full-bleed hero photo with dark overlays so white text meets WCAG AA.
export function HomeBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand-tropical">
      <RemoteImage src={HERO_IMAGE_URL} alt="" priority width={1920} height={1080} className="size-full object-cover" />
      <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/60 to-transparent" />
    </div>
  );
}
