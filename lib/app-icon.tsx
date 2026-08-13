import { ImageResponse } from "next/og";

export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f6f5e",
          color: "#fffdf9",
          fontSize: Math.round(size * 0.46),
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        H
      </div>
    ),
    { width: size, height: size },
  );
}
