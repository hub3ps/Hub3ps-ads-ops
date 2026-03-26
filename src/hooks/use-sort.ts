import { useState } from "react";

export interface SortState {
  column: string;
  dir: "asc" | "desc";
}

export function useSort(defaultColumn: string, defaultDir: "asc" | "desc" = "desc") {
  const [sort, setSort] = useState<SortState>({ column: defaultColumn, dir: defaultDir });

  function toggle(col: string) {
    setSort((prev) =>
      prev.column === col
        ? { column: col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { column: col, dir: "desc" },
    );
  }

  return { sort, toggle };
}

export function sortRows<T>(rows: T[], col: string, dir: "asc" | "desc"): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[col];
    const bv = (b as Record<string, unknown>)[col];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return dir === "asc" ? cmp : -cmp;
  });
}
