const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7777";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL("/v1/guest/places", apiUrl);
  const cursor = requestUrl.searchParams.get("cursor");

  if (cursor) upstreamUrl.searchParams.set("cursor", cursor);

  const upstreamResponse = await fetch(upstreamUrl, {
    cache: "no-store",
    headers: {
      "accept-language": request.headers.get("accept-language") ?? "en-US",
    },
    method: "GET",
  });

  return new Response(upstreamResponse.body, {
    headers: upstreamResponse.headers,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}
