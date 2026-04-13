"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setLeaving(true), 2800),
      setTimeout(() => setMounted(false), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!mounted) return null;

  const bars = [
    { targetHeight: "h-12", delay: "[transition-delay:0ms]" },
    { targetHeight: "h-6", delay: "[transition-delay:150ms]" },
    { targetHeight: "h-10", delay: "[transition-delay:300ms]" },
    { targetHeight: "h-6", delay: "[transition-delay:450ms]" },
    { targetHeight: "h-16", delay: "[transition-delay:600ms]" },
  ];

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-500 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-end gap-1.5 h-16 mb-6">
        {bars.map((bar, index) => (
          <div
            key={index}
            className={`w-3 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)] ${
              phase >= 1 ? bar.targetHeight : "h-0"
            } ${bar.delay}`}
          />
        ))}
      </div>

      <div className="overflow-hidden h-14">
        <h1
          className={`text-4xl font-bold tracking-tight text-white transition-all duration-1000 ease-out transform ${
            phase >= 2
              ? "translate-y-0 opacity-100 tracking-wide"
              : "translate-y-full opacity-0"
          }`}
        >
          Workly
        </h1>
      </div>

      <div className="mt-8 h-6 flex items-center justify-center">
        <p
          className={`text-sm text-zinc-500 transition-all duration-700 ${
            phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          Sincronizando dados de forma segura...
        </p>
      </div>

      <div className="absolute bottom-10 w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className={`h-full bg-emerald-500 transition-all ease-out ${
            phase === 0
              ? "w-0"
              : phase === 1
                ? "w-1/3 duration-1000"
                : phase === 2
                  ? "w-2/3 duration-1000"
                  : "w-full duration-1000"
          }`}
        />
      </div>
    </div>
  );
}
