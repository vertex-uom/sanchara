import { CentralFooter } from "@/components/shell/central-footer";
import { CentralHeader } from "@/components/shell/central-header";
import { ContactSections } from "@/features/contact";
import { HeaderAccount } from "@/features/guest-auth";

export const metadata = {
  title: "Contact us",
  description: "Questions, support or partnerships — get in touch with the Sanchara team. We reply within 24 hours on business days.",
};

export default function Page() {
  return (
    <div className="relative flex flex-1 flex-col">
      <CentralHeader active="contact" action={<HeaderAccount />} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <ContactSections />
      </main>
      <CentralFooter />
    </div>
  );
}
