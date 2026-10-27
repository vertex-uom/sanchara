import { CentralFooter } from "@/components/shell/central-footer";
import { CentralHeader } from "@/components/shell/central-header";
import { PropertyComingSoon } from "@/features/directory";
import { HeaderAccount } from "@/features/guest-auth";

// Not indexed: a temporary page shared by every property until property pages exist.
export const metadata = {
  title: "Coming soon",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="relative flex flex-1 flex-col">
      <CentralHeader active="discover" action={<HeaderAccount />} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <PropertyComingSoon />
      </main>
      <CentralFooter />
    </div>
  );
}
