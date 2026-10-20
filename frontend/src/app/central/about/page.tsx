import { CentralFooter } from "@/components/shell/central-footer";
import { CentralHeader } from "@/components/shell/central-header";
import { AboutSections } from "@/features/about";
import { HeaderAccount } from "@/features/guest-auth";

export const metadata = {
  title: "About",
  description:
    "Sanchara is a trusted directory of small, independently owned stays across Sri Lanka. Book direct on each property's own website, commission-free.",
};

export default function Page() {
  return (
    <div className="relative flex flex-1 flex-col">
      <CentralHeader active="about" action={<HeaderAccount />} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <AboutSections />
      </main>
      <CentralFooter />
    </div>
  );
}
