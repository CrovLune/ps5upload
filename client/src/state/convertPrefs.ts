import { create } from "zustand";

import type { FpkgCompression } from "../api/fpkg";
import { safeGetItem, safeSetItem } from "../lib/safeStorage";

/**
 * What Convert remembers between sessions, per viewer: where packages go and how hard to
 * compress them. Reads and writes never throw (the browser build may deny storage), and a
 * remembered folder is kept as-is even if it has since gone away: the engine's check says so.
 */
const KEY_DIR = "ps5upload.convert.output_dir";
const KEY_LEVEL = "ps5upload.convert.compression";
const KEY_VERIFY_CHUNK = "ps5upload.convert.verify_chunk_kib";
const LEVELS: readonly FpkgCompression[] = ["fast", "balanced", "smallest"];
/** How much of a file a game image's read-back check reads per call, in KiB. The engine
 *  takes 1024 to 65536; these are the choices offered. */
export const VERIFY_CHUNK_KIB: readonly number[] = [1024, 4096, 8192, 16384, 32768];
/** The fastest in measurement (reading plus hashing on all cores), and the engine's own
 *  default. */
export const DEFAULT_VERIFY_CHUNK_KIB = 8192;

interface ConvertPrefs {
  outputDir: string;
  compression: FpkgCompression;
  /** A game image's read-back check: KiB per read. */
  verifyChunkKib: number;
  setOutputDir: (dir: string) => void;
  setCompression: (c: FpkgCompression) => void;
  setVerifyChunkKib: (kib: number) => void;
}

function storedLevel(): FpkgCompression {
  const v = safeGetItem(KEY_LEVEL);
  return LEVELS.includes(v as FpkgCompression) ? (v as FpkgCompression) : "balanced";
}

export function parseVerifyChunkKib(v: string | null): number {
  const n = Number(v);
  return VERIFY_CHUNK_KIB.includes(n) ? n : DEFAULT_VERIFY_CHUNK_KIB;
}

export const useConvertPrefs = create<ConvertPrefs>((set) => ({
  outputDir: safeGetItem(KEY_DIR) ?? "",
  compression: storedLevel(),
  verifyChunkKib: parseVerifyChunkKib(safeGetItem(KEY_VERIFY_CHUNK)),
  setOutputDir: (dir) => {
    safeSetItem(KEY_DIR, dir);
    set({ outputDir: dir });
  },
  setCompression: (c) => {
    safeSetItem(KEY_LEVEL, c);
    set({ compression: c });
  },
  setVerifyChunkKib: (kib) => {
    const v = VERIFY_CHUNK_KIB.includes(kib) ? kib : DEFAULT_VERIFY_CHUNK_KIB;
    safeSetItem(KEY_VERIFY_CHUNK, String(v));
    set({ verifyChunkKib: v });
  },
}));
