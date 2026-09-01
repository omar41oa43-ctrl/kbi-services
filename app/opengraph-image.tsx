import { ImageResponse } from "next/og"

export const alt = "KBI Services — on-site device repair and IT services across the UAE"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #05080c 0%, #071d2a 55%, #083344 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}>
          <div style={{ color: "#22d3ee", display: "flex", fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>
            KBI SERVICES
          </div>
          <div style={{ display: "flex", fontSize: 74, fontWeight: 800, letterSpacing: -3, lineHeight: 1.08, marginTop: 26 }}>
            On-Site Device Repair &amp; IT Services
          </div>
          <div style={{ color: "#bae6fd", display: "flex", fontSize: 34, marginTop: 34 }}>
            Serving homes and businesses across all seven Emirates
          </div>
        </div>
      </div>
    ),
    size,
  )
}
