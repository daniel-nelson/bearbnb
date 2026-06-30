import { client } from "./generated/client.gen";

const apiHost =
  import.meta.env.VITE_API_HOST ??
  (import.meta.env.VITE_PSYCHIC_ENV === "test"
    ? "http://localhost:7778"
    : "http://localhost:7777");

client.setConfig({
  baseUrl: apiHost,
  credentials: "omit",
});
