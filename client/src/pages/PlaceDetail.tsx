import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";

export default function PlaceDetail() {
  const { id } = useParams();

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to="/"
          >
            Browse places
          </Link>
        }
      />

      <section className="py-8">
        <h1 className="text-3xl font-semibold tracking-normal text-[#111113]">
          Place details
        </h1>
        <p
          className="mt-6 border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="place-detail-status"
        >
          Details for place {id} are coming soon.
        </p>
      </section>
    </AppShell>
  );
}
