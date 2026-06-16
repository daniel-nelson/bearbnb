"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type LabeledValue = {
  value: string;
  label: string;
};

type Room = {
  id: string;
  type: string;
  displayType: string;
  title: string;
  appliances?: LabeledValue[];
  bedTypes?: LabeledValue[];
  bathOrShowerStyle?: LabeledValue;
};

type PlaceDetail = {
  id: string;
  title: string;
  style: string;
  displayStyle: string;
  sleeps: number;
  rooms: Room[];
};

export default function PlaceDetailPage() {
  const params = useParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [status, setStatus] = useState("Loading place...");

  useEffect(() => {
    async function loadPlace() {
      const response = await fetch(`/api/guest/places/${params.id}`, {
        headers: {
          "accept-language": "en-US",
        },
      });

      if (!response.ok) {
        setStatus("This place is not available right now.");
        return;
      }

      const body = (await response.json()) as PlaceDetail;
      setPlace(body);
      setStatus("");
    }

    void loadPlace();
  }, [params.id]);

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#1d1d1f]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#deded8] pb-5">
          <Link
            className="-mx-2 flex min-h-11 items-center px-2 text-lg font-semibold tracking-normal"
            href="/"
          >
            BearBnB
          </Link>
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            href="/"
          >
            All places
          </Link>
        </header>

        {status ? (
          <p className="mt-10 border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]">
            {status}
          </p>
        ) : place ? (
          <>
            <section className="border-b border-[#deded8] py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 lg:py-14">
              <div>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-normal text-[#111113] sm:text-6xl">
                  {place.title}
                </h1>
              </div>
              <dl className="mt-8 grid grid-cols-2 border border-[#deded8] bg-white lg:mt-0">
                <div className="border-b border-r border-[#deded8] p-4">
                  <dt className="text-sm font-medium text-[#707069]">Sleeps</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {place.sleeps}
                  </dd>
                </div>
                <div className="border-b border-[#deded8] p-4">
                  <dt className="text-sm font-medium text-[#707069]">Style</dt>
                  <dd className="mt-2 text-lg font-semibold">
                    {place.displayStyle}
                  </dd>
                </div>
                <div className="col-span-2 p-4">
                  <dt className="text-sm font-medium text-[#707069]">Rooms</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {place.rooms.length}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="py-10">
              <div className="mb-6">
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
                  What is inside
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
          </>
        ) : null}
      </div>
    </main>
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

function roomDetailLabels(room: Room) {
  if (room.appliances?.length) {
    return room.appliances.map((appliance) => appliance.label);
  }

  if (room.bedTypes?.length) {
    return room.bedTypes.map((bedType) => bedType.label);
  }

  if (room.bathOrShowerStyle) {
    return [room.bathOrShowerStyle.label];
  }

  return [];
}
