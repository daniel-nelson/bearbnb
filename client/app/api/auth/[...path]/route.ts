const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7777";

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, context: AuthRouteContext) {
  return proxyAuthRequest(request, context);
}

export async function POST(request: Request, context: AuthRouteContext) {
  return proxyAuthRequest(request, context);
}

async function proxyAuthRequest(request: Request, context: AuthRouteContext) {
  const { path } = await context.params;
  const upstreamResponse = await fetch(`${apiUrl}/api/auth/${path.join("/")}`, {
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
    cache: "no-store",
    credentials: "include",
    headers: proxyHeaders(request),
    method: request.method,
  });

  return new Response(upstreamResponse.body, {
    headers: upstreamResponse.headers,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}

function proxyHeaders(request: Request) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const origin = request.headers.get("origin");

  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);
  if (origin) headers.set("origin", origin);

  return headers;
}
