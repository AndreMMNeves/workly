"use client";

import { useEffect } from "react";
import { ensureSeeded } from "@/lib/db";

export default function SeedBoot() {
  useEffect(() => {
    ensureSeeded();
  }, []);
  return null;
}
