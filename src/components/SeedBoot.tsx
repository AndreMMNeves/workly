"use client";

import { useEffect } from "react";
import { ensureSeedAccounts, materializeRecurring } from "@/lib/data";

export default function SeedBoot() {
  useEffect(() => {
    (async () => {
      try {
        await ensureSeedAccounts();
        await materializeRecurring();
      } catch {
        // ignore boot errors — page still loads
      }
    })();
  }, []);
  return null;
}
