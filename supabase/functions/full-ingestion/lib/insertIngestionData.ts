// lib/insertIngestionData.ts
import { supabase } from "./supabaseClient.ts";

type SourceTag = "buoy" | "forecast";

/* ---------- helpers -------------------------------------------- */
function pacOffsetFor(dateISO: string): string {
  // returns "-07:00" (PDT) or "-08:00" (PST) for that date
  const zone = Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  }).format(new Date(dateISO + ":00"));
  return zone.endsWith("PDT") ? "-07:00" : "-08:00";
}

function ensureIsoPair(row: Record<string, unknown>): { pac: string | null; utc: string | null } {
  const pac =
    (row.timestamp_pacific ?? row.timestampPacific) as string | undefined;
  const utc =
    (row.timestamp_utc     ?? row.timestampUtc    ) as string | undefined;

  if (pac && utc) return { pac, utc };                 // ✅ both present
  if (pac && !utc) return { pac, utc: new Date(pac).toISOString() };

  // no Pacific ISO → rebuild from local timestamp if possible
  if (!pac && typeof row.timestamp === "string") {
    const local = row.timestamp as string;             // "YYYY-MM-DDTHH:MM"
    const iso   = `${local}:00${pacOffsetFor(local)}`; // attach offset
    return { pac: iso, utc: new Date(iso).toISOString() };
  }

  // cannot recover
  return { pac: null, utc: null };
}

/* ---------- main export ---------------------------------------- */
export async function insertIngestionData(
  spot_slug: string,
  rows: Record<string, unknown>[],
  source: SourceTag,
): Promise<void> {
  if (!rows.length) {
    console.warn(`⚠️ insertIngestionData: ${spot_slug}/${source} – no rows`);
    return;
  }

  const payload = rows.flatMap((row) => {
    const { pac, utc } = ensureIsoPair(row);

    if (!pac || !utc) {
      console.error(`⛔ skipped row (no ISO) ${spot_slug}/${source}`, row);
      return [];
    }
    return [{
      ...row,
      spot_slug,
      source,
      timestamp_pacific: pac,
      timestamp_utc    : utc,
    }];
  });

  if (!payload.length) return;   // nothing usable

  const { error } = await supabase
    .from("surf_ingestion_data")
    .upsert(payload, {
      onConflict: "timestamp_utc,spot_slug,source",
    });

  if (error) {
    console.error(`❌ upsert failed ${spot_slug}/${source}`, error);
  } else {
    console.log(`✅ ${spot_slug}: ${payload.length} ${source} rows upserted`);
  }
}
