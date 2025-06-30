// lib/insertIngestionData.ts
import { supabase } from "./supabaseClient.ts";

type SourceTag = "buoy" | "forecast";

/* ---------- helpers -------------------------------------------- */
function pacOffsetFor(dateISO: string): string {
  // returns "-07:00" (PDT) or "-08:00" (PST)
  const zone = Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  }).format(new Date(dateISO + ":00"));
  return zone.endsWith("PDT") ? "-07:00" : "-08:00";
}

function ensureIsoPair(row: Record<string, unknown>): { pac: string | null; utc: string | null } {
  const pac = (row.timestamp_pacific ?? row.timestampPacific) as string | undefined;
  const utc = (row.timestamp_utc ?? row.timestampUtc) as string | undefined;

  if (pac && utc) return { pac, utc };
  if (pac && !utc) return { pac, utc: new Date(pac).toISOString() };

  if (!pac && typeof row.timestamp === "string") {
    const local = row.timestamp as string; // "YYYY-MM-DDTHH:MM"
    const iso = `${local}:00${pacOffsetFor(local)}`;
    return { pac: iso, utc: new Date(iso).toISOString() };
  }

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

  // build & filter payload
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
      timestamp_utc: utc,
    }];
  });
  if (!payload.length) return;

  console.log("🧪 First row in payload:", payload[0]);

  // chunk into batches to lower CPU & HTTP overhead
  const chunkSize = 800;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const batch = payload.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("surf_ingestion_data")
      .upsert(batch, {
        onConflict: "spot_slug,timestamp_utc,source",
        ignoreDuplicates: true,
        count: 'exact',
      });

    if (error) {
      console.error(`❌ chunk upsert failed ${spot_slug}/${source}`, error);
    } else {
      console.log(`✅ ${spot_slug}: upserted rows ${i + 1}–${i + batch.length}`);
    }
  }
}
