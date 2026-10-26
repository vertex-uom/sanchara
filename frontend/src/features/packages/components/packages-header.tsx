import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

type PackagesHeaderProps = { place: { name: string; location: string }; createHref: string };

export function PackagesHeader({ place, createHref }: PackagesHeaderProps) {
  return (
    <PageHeader
      title="Packages"
      place={place}
      action={
        <Button asChild variant="office" className="h-11 gap-2 rounded-lg px-4 text-base font-semibold md:h-10">
          <Link href={createHref} scroll={false}>
            <Plus aria-hidden="true" className="size-5" />
            Create package
          </Link>
        </Button>
      }
    />
  );
}
