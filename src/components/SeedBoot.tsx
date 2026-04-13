"use client";

import { useEffect } from "react";
import { ensureSeedAccounts } from "@/lib/data";

export default function SeedBoot() {
  useEffect(() => {
    ensureSeedAccounts().catch(() => {});
  }, []);
  return null;
}
