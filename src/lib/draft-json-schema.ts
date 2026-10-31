import { z } from "zod";

/**
 * JSON accepted in Studio drafts (blocks, display prefs). Nested objects and
 * arrays are allowed — display prefs hold qrSettings, designLayers and
 * themeOverrides — but depth, width and string size are bounded.
 * Root cause of "Niet opgeslagen": the old schema accepted only flat values,
 * so every nested pref was refused before the save ran.
 */
export const DRAFT_JSON_MAX_DEPTH = 8;
export const DRAFT_JSON_MAX_BYTES = 512 * 1024;

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function jsonAt(depth: number): z.ZodType<Json> {
  const leaf = z.union([z.string().max(20_000), z.number().finite(), z.boolean(), z.null()]);
  if (depth >= DRAFT_JSON_MAX_DEPTH) return leaf;
  return z.lazy(() =>
    z.union([leaf, z.array(jsonAt(depth + 1)).max(200), z.record(z.string().max(200), jsonAt(depth + 1))]),
  ) as z.ZodType<Json>;
}

export const draftJsonRecordSchema = z
  .record(z.string().max(200), jsonAt(1))
  .refine((v) => JSON.stringify(v).length <= DRAFT_JSON_MAX_BYTES, { message: "validation: draft too large" });
