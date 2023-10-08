import { serve } from "bun";
import { parse, serialize } from "cookie";
import { renderToReadableStream } from "react-dom/server";

serve({
  port: 8000,

  async fetch(request: Request) {
    const url = new URL(request.url);
    const cookies = parse(request.headers.get("cookie") ?? "");
    const db = Object.assign({}, cookies);

    if (url.pathname === "/") {
    } else if (url.pathname === "/put") {
      const k = url.searchParams.get("key");
      if (!k) return new Response("Bad Request", { status: 400 });
      const v = url.searchParams.get("value") || "---";
      db[k] = v;
    } else if (url.pathname === "/delete") {
      url.searchParams.forEach((_, k) => delete db[k]);
    } else {
      return new Response("Bad Request", { status: 400 });
    }

    const headers = new Headers();
    headers.append("Content-Type", "text/html");

    Object.keys({ ...cookies, ...db }).forEach((k) => {
      if (db[k])
        headers.append("Set-Cookie", serialize(k, db[k], { httpOnly: true }));
      else
        headers.append(
          "Set-Cookie",
          serialize(k, "❌", { httpOnly: true, expires: new Date(0) }),
        );
    });

    return new Response(
      await renderToReadableStream(
        <body style={{ fontFamily: "system-ui" }}>
          <table style={{ borderSpacing: 10, textAlign: "left" }}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th colSpan={2}></th>
              </tr>
            </thead>

            {Object.entries(db).map(([k, v]) => (
              <tr key={k}>
                <form action="/put">
                  <td>
                    <input name="key" readOnly value={k} />
                  </td>
                  <td>
                    <input name="value" defaultValue={v} />
                  </td>
                  <td>
                    <button type="submit">Save</button>
                  </td>
                </form>
                <td>
                  <a href={`/delete?${k}`}>Delete</a>
                </td>
              </tr>
            ))}

            <tr>
              <form action="/put">
                <td>
                  <input name="key" placeholder="key" autoFocus />
                </td>
                <td>
                  <input name="value" placeholder="value" />
                </td>
                <td colSpan={2}>
                  <button type="submit">+ New</button>
                </td>
              </form>
            </tr>
          </table>
        </body>,
      ),
      {
        headers,
      },
    );
  },
});
