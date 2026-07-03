import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://house-tasks-app.vercel.app";
  const logoResponse = await fetch(`${siteUrl}/540A_logo.png`);
  const logoBuffer = await logoResponse.arrayBuffer();
  const logoBase64 = Buffer.from(logoBuffer).toString("base64");
  const logoSrc = `data:image/png;base64,${logoBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 52%, #155e75 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "56px",
            display: "flex",
            gap: "42px",
            padding: "56px 64px",
            width: "100%",
          }}
        >
          <img
            src={logoSrc}
            alt="540A Cleaning"
            height={180}
            width={180}
            style={{ borderRadius: "42px" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ color: "#67e8f9", fontSize: "30px", fontWeight: 800, letterSpacing: "0.18em" }}>
              HOUSE TASKS
            </div>
            <div style={{ fontSize: "88px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.92 }}>
              540A Cleaning
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "36px", fontWeight: 600 }}>
              Today, week and month responsibilities in one place.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
