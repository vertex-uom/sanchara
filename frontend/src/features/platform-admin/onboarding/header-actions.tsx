import { Suspense } from "react";
import { Download, UserRoundCheck, UsersRound } from "lucide-react";
import { AdminButton, AdminButtonLink, AdminSkeleton } from "../components/ui";
import { getNextApplicationToReview } from "../server/onboarding";
import { applicationHref, applicationsHref } from "./search-params";

// Page-level actions from the design: Bulk assign · Export · Review next.
// Bulk assign and Export are placeholders until reviewer teams and exports
// exist in the API.
export function HeaderActions() {
  return (
    <>
      {/* TODO(onboarding): bulk-assign applications to a reviewer. */}
      <AdminButton icon={UsersRound} placeholder>
        Bulk assign
      </AdminButton>
      {/* TODO(onboarding): export the filtered list as CSV. */}
      <AdminButton icon={Download} placeholder>
        Export
      </AdminButton>
      <Suspense fallback={<AdminSkeleton className="h-[34px] w-[122px] rounded-md" />}>
        <ReviewNext />
      </Suspense>
    </>
  );
}

async function ReviewNext() {
  const next = await getNextApplicationToReview();
  return (
    <AdminButtonLink href={next ? applicationHref(next.id) : applicationsHref({ status: "open" })} icon={UserRoundCheck} variant="primary">
      Review next
      {next ? <span className="sr-only">: {next.businessName}</span> : null}
    </AdminButtonLink>
  );
}
