import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-[#deded8] pb-5">
      <Link
        className="-mx-2 flex min-h-11 items-center gap-2 px-2 text-lg font-semibold tracking-normal"
        to="/"
      >
        <img
          alt=""
          aria-hidden="true"
          className="h-9 w-9"
          height={36}
          src="/bearbnb-logo.svg"
          width={36}
        />
        <span>BearBnB</span>
      </Link>
      {right}
    </header>
  );
}
