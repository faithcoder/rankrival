"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let sessionId = localStorage.getItem("rankrival_sid");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("rankrival_sid", sessionId);
    }
    const visitId = `${sessionId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    let firstBeat = true;
    const beat = () => fetch("/api/online", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, visitId: firstBeat ? visitId : undefined }),
    }).then(async (response) => {
      firstBeat = false;
      if (response.ok) {
        const result = await response.json() as { total_visitors: number };
        sessionStorage.setItem("rankrival_visitor_total", String(result.total_visitors));
        window.dispatchEvent(new CustomEvent("rankrival:visitors", { detail: result.total_visitors }));
      }
    }).catch(() => undefined);
    beat();
    const timer = window.setInterval(beat, 30_000);
    return () => window.clearInterval(timer);
  }, [pathname]);

  return null;
}
