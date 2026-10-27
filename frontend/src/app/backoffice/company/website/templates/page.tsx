import { WebsiteBuilderMethod } from "@/features/website-builder";

export const metadata = { title: "Website Builder" };

export default function Page() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col px-4 py-6 outline-none sm:px-6 lg:px-8 xl:px-12"
    >
      <WebsiteBuilderMethod />
    </main>
  );
}
