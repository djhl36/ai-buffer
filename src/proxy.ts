import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

export function proxy(req: NextRequest) {
  const user = process.env.ADMIN_USER ?? "admin";
  const pass = process.env.ADMIN_PASSWORD ?? "";

  if (!pass) return unauthorized();

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const base64 = auth.slice("Basic ".length);

  let decoded = "";
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return unauthorized();
  }

  const [u, p] = decoded.split(":");

  if (u !== user || p !== pass) {
    return unauthorized();
  }

  return NextResponse.next();
}