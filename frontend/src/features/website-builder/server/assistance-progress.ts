// Progress of a WEMIXT "done-for-you" request, as the assistance API will
// return it. Times are offsets from when the request was sent, so the page
// can show real dates for the owner's own request.

export type AssistanceStage =
  "submitted" | "assigned" | "designing" | "review" | "published";

export type AssistanceProgress = {
  stage: AssistanceStage;
  designer: { name: string; role: string; online: boolean };
  // Days after sending.
  draftAfterDays: number;
  launchAfterDays: number;
  revisionsLeft: number;
  revisionsTotal: number;
  // {firstName} is replaced with the owner's first name.
  messages: { id: string; afterMinutes: number; text: string }[];
};

// TEMPORARY fixture. Replace the body with the assistance API call once the
// API client exists; the return type stays the same.
export async function getAssistanceProgress(): Promise<AssistanceProgress> {
  return {
    stage: "designing",
    designer: {
      name: "Amaya Perera",
      role: "Web designer · WEMIXT",
      online: true,
    },
    draftAfterDays: 4,
    launchAfterDays: 10,
    revisionsLeft: 2,
    revisionsTotal: 2,
    messages: [
      {
        id: "designer-1",
        afterMinutes: 15,
        text: "Hi {firstName}! I'm Amaya, your WEMIXT designer. Thanks for the details — I'll share the first draft soon.",
      },
    ],
  };
}
