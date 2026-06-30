import { useState } from "react";
import {
  deleteV1GuestFavoritesById,
  postV1GuestFavorites,
} from "../api/backend/generated";

export type FavoriteState = {
  favorited: boolean;
  favoriteId: string | null;
};

type ToggleState = "idle" | "saving" | "failed";

export function FavoriteToggle({
  place,
  onChange,
  className = "",
}: {
  place: FavoriteState & { id: string };
  onChange: (next: FavoriteState) => void;
  className?: string;
}) {
  const [state, setState] = useState<ToggleState>("idle");

  async function toggleFavorite() {
    setState("saving");

    try {
      if (place.favorited) {
        if (!place.favoriteId) throw new Error("Missing favorite id.");

        const { error } = await deleteV1GuestFavoritesById({
          path: { id: place.favoriteId },
        });
        if (error) throw new Error("Favorite could not be removed.");

        onChange({ favorited: false, favoriteId: null });
      } else {
        const { data, error } = await postV1GuestFavorites({
          body: { placeId: place.id },
        });
        if (error || !data) throw new Error("Favorite could not be saved.");

        onChange({ favorited: true, favoriteId: data.id });
      }

      setState("idle");
    } catch {
      setState("failed");
    }
  }

  const label =
    state === "saving"
      ? "Saving..."
      : place.favorited
        ? "Saved"
        : state === "failed"
          ? "Retry"
          : "Save";

  const tone = place.favorited
    ? "border-[#1d1d1f] bg-[#1d1d1f] text-white hover:bg-[#333336]"
    : state === "failed"
      ? "border-[#f0c9c9] bg-white text-[#9a2d2d] hover:border-[#d99f9f]"
      : "border-[#d9d9d2] bg-white text-[#3f3f3a] hover:border-[#b9b9b1] hover:text-[#18181a]";

  return (
    <button
      aria-pressed={place.favorited}
      className={`inline-flex h-11 items-center gap-2 border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${tone} ${className}`}
      data-testid={`favorite-toggle-${place.id}`}
      disabled={state === "saving"}
      onClick={() => void toggleFavorite()}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill={place.favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {label}
    </button>
  );
}
