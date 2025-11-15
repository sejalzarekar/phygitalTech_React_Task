import React from "react";

export default function LoadingPlaceholder() {
  
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 8, background: "#e6eef6", minHeight: 72 }}>
          <div style={{ width: "60%", height: 16, background: "#cfe0f3", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ width: "40%", height: 12, background: "#dbeefb", borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
