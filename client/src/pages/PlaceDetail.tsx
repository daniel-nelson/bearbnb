import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getV1VisitorPlacesById } from "../api/backend/generated";
import type { PlaceForVisitors } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";

type Room = PlaceForVisitors["rooms"][number];

export default function PlaceDetail() {
  const { id } = useParams();
  const [place, setPlace] = useState<PlaceForVisitors | null>(null);
  const [status, setStatus] = useState("Loading place...");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadPlace(placeId: string) {
      const { data, error } = await getV1VisitorPlacesById({
        path: { id: placeId },
      });

      if (!active) return;

      if (error || !data) {
        setStatus("This place is not available right now.");
        return;
      }

      setPlace(data);
      setStatus("");
    }

    void loadPlace(id);

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to="/"
          >
            All places
          </Link>
        }
      />

      {status ? (
        <p
          className="mt-10 border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="place-detail-status"
        >
          {status}
        </p>
      ) : place ? (
        <section className="py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:py-14">
          <div className="min-w-0">
            <h1
              className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-normal text-[#111113] sm:text-6xl"
              data-testid="place-detail-title"
            >
              {place.title}
            </h1>

            {place.rooms.length > 0 && (
              <section className="mt-10 border-t border-[#deded8] pt-8">
                <div className="mb-6">
                  <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
                    Rooms
                  </h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {place.rooms.map((room) => (
                    <article
                      className="border border-[#deded8] bg-white p-4"
                      key={room.id}
                    >
                      <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                        {room.displayType}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#171719]">
                        {room.title}
                      </h3>
                      <RoomDetails room={room} />
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="mt-8 self-start border border-[#deded8] bg-white lg:sticky lg:top-6 lg:mt-0">
            <dl className="grid grid-cols-2">
              <div className="border-r border-[#deded8] p-4">
                <dt className="text-sm font-medium text-[#707069]">Sleeps</dt>
                <dd className="mt-2 text-2xl font-semibold">{place.sleeps}</dd>
              </div>
              <div className="p-4">
                <dt className="text-sm font-medium text-[#707069]">Rooms</dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {place.rooms.length}
                </dd>
              </div>
              <div className="col-span-2 border-t border-[#deded8] p-4">
                <dt className="text-sm font-medium text-[#707069]">Style</dt>
                <dd className="mt-2 text-lg font-semibold">
                  {place.displayStyle}
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      ) : null}
    </AppShell>
  );
}

function RoomDetails({ room }: { room: Room }) {
  const labels = roomDetailLabels(room);

  if (!labels.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {labels.map((label, index) => (
        <li
          className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
          key={`${label}-${index}`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

function roomDetailLabels(room: Room): string[] {
  switch (room.type) {
    case "Kitchen":
      return room.appliances.map((appliance) => appliance.label);
    case "Bedroom":
      return room.bedTypes.map((bedType) => bedType.label);
    case "Bathroom":
      return [room.bathOrShowerStyle.label];
    case "Den":
    case "LivingRoom":
      return [];
    default: {
      const _never: never = room;
      throw new Error(`Unhandled room type: ${String(_never)}`);
    }
  }
}
