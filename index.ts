import { serve } from "bun";
import { parse, serialize } from "cookie";

serve({
  port: 8000,
  fetch(request: Request) {
    const url = new URL(request.url);
    const cookies = parse(request.headers.get("cookie") ?? "");
    const db = Object.assign({}, cookies);

    if (url.pathname === "/") {
    } else if (url.pathname === "/put") {
      url.searchParams.forEach((v, k) => (db[k] = v));
    } else if (url.pathname === "/delete") {
      url.searchParams.forEach((_, k) => delete db[k]);
    } else {
      return new Response("Bad Request", { status: 400 });
    }

    const headers = new Headers();
    Object.keys(cookies).forEach((k) => {
      if (db[k])
        headers.append("Set-Cookie", serialize(k, db[k], { httpOnly: true }));
      else
        headers.append(
          "Set-Cookie",
          serialize(k, "❌", { httpOnly: true, expires: new Date(0) }),
        );
    });

    return Response.json(db, { headers });
  },
});
