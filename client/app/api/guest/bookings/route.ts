const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7777";

export async function POST(request: Request) {
  const upstreamResponse = await fetch(new URL("/v1/guest/bookings", apiUrl), {
    body: await request.text(),
    cache: "no-store",
    credentials: "include",
    headers: proxyHeaders(request),
    method: "POST",
  });

  return new Response(upstreamResponse.body, {
    headers: upstreamResponse.headers,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}

function proxyHeaders(request: Request) {
  const headers = new Headers();
  const acceptLanguage = request.headers.get("accept-language");
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");

  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);

  return headers;
}
