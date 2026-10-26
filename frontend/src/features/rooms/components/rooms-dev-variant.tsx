"use client";

// DEV ONLY: renders the Rooms & Units page in states the mock data can't
// show (read-only, loading, error). Used by app/backoffice/(dev)/rooms-test.
// Lives in the feature so the client bundle doesn't pull in the server-only
// page shell from the feature's entry point. Delete with the dev page.
import { apiError } from "@/lib/api-client/errors";
import type { RoomsApi } from "../api";
import { RoomsWorkspace } from "./rooms-workspace";

export type RoomsDevVariant = "readonly" | "loading" | "error";

const never = () => new Promise<never>(() => undefined);
const fail = () => Promise.reject(apiError(500, "server_error", "Server error."));

const LOADING_API: RoomsApi = {
  listRoomTypes: never,
  listUnits: never,
  createUnit: never,
  updateUnit: never,
  createRoomType: never,
  updateRoomType: never,
};

const ERROR_API: RoomsApi = {
  listRoomTypes: fail,
  listUnits: fail,
  createUnit: fail,
  updateUnit: fail,
  createRoomType: fail,
  updateRoomType: fail,
};

const PLACE = { name: "Palm Breeze Guest House", location: "Galle, Sri Lanka" };

export function RoomsDevVariantView({ variant }: { variant: RoomsDevVariant }) {
  return (
    <main className="flex flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <p className="rounded-lg bg-office-tint-orange px-3 py-2 text-sm text-office-label">Dev variant: {variant}</p>
      <RoomsWorkspace
        propertyId="palm-breeze"
        place={PLACE}
        canManageRooms={variant !== "readonly"}
        api={variant === "loading" ? LOADING_API : variant === "error" ? ERROR_API : undefined}
      />
    </main>
  );
}
