import { Button } from "../../components";
import type { AmprPacksReadiness, ImageFormat } from "../../api/fpkg";
import { DEFAULT_VERIFY_CHUNK_KIB, VERIFY_CHUNK_KIB, useConvertPrefs } from "../../state/convertPrefs";
import { useTr } from "../../state/lang";

// The options of a game image (③ Options when "A game image" is what Convert makes): its
// filesystem, .ffpfsc compression, AMPR LZ4 asset packs for a libSceAmpr game, and how the
// read-back check reads.

/** The AMPR LZ4 asset-pack option for a libSceAmpr game's .exfat image. */
export interface Lz4Choice {
  /** What the check found about the game's own ampr_emu. */
  readiness: AmprPacksReadiness;
  on: boolean;
  onToggle: (on: boolean) => void;
  /** A profile read from a .toml file (its name); null packs with the built-in one. */
  profileName: string | null;
  onProfile: (profile: { name: string; text: string } | null) => void;
}

/** Packing replaces .ffpfsc compression: the packs are already compressed, and the engine
 *  writes them into a plain exFAT image only. */
export function lz4Active(format: ImageFormat, lz4: Lz4Choice | undefined): boolean {
  return format === "exfat" && !!lz4?.on && !lz4.readiness.refusal;
}

function Lz4Option({ lz4 }: { lz4: Lz4Choice }) {
  const tr = useTr();
  const refusal = lz4.readiness.refusal;
  return (
    <div className="space-y-1" data-testid="lz4-option">
      <label className="flex cursor-pointer items-start gap-2.5 text-xs">
        <input
          type="checkbox"
          checked={lz4.on && !refusal}
          disabled={!!refusal}
          onChange={(e) => lz4.onToggle(e.target.checked)}
          className="checkbox mt-px h-4 w-4 shrink-0"
        />
        <span className="min-w-0">
          <span className="block font-medium text-[var(--color-text)]">
            {tr("fpkg.image.lz4", undefined, "AMPR LZ4 asset packs (smaller, for ShadowMount+)")}
          </span>
          <span className="mt-0.5 block leading-relaxed text-[var(--color-muted)]">
            {tr(
              "fpkg.image.lz4_body",
              undefined,
              "Packs the game's data into LZ4 asset packs that the game's own ampr_emu (fakelib/libSceAmpr.sprx) reads back, so the image is smaller. Executables, system files and already-compressed media stay as they are. Plain .exfat only, without .ffpfsc compression.",
            )}
          </span>
        </span>
      </label>
      {refusal ? (
        <div className="text-xs text-[var(--color-warn)]">
          {tr("fpkg.image.lz4_unavailable", { reason: refusal }, "Not available for this game: {reason}")}
        </div>
      ) : (
        lz4.readiness.runtime_version && (
          <div className="text-xs text-[var(--color-muted)]">
            {tr(
              "fpkg.image.lz4_runtime",
              { version: lz4.readiness.runtime_version },
              "The game's ampr_emu: {version}",
            )}
          </div>
        )
      )}
      {lz4.on && !refusal && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lz4.profileName ? (
            <>
              <span className="text-[var(--color-muted)]">
                {tr("fpkg.image.lz4_profile_named", { name: lz4.profileName }, "Profile: {name}")}
              </span>
              <Button variant="ghost" onClick={() => lz4.onProfile(null)}>
                {tr("fpkg.image.lz4_profile_clear", undefined, "Use the built-in profile")}
              </Button>
            </>
          ) : (
            <label className="cursor-pointer text-[var(--color-accent)] underline">
              {tr("fpkg.image.lz4_profile", undefined, "Use a profile (.toml)…")}
              <input
                type="file"
                accept=".toml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void file.text().then((text) => lz4.onProfile({ name: file.name, text }));
                }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

/** Which image to make: the filesystem (UFS2 .ffpkg, what ShadowMount+ recommends, or exFAT),
 *  and whether to compress it into a .ffpfsc. */
export function ImageChoice({
  format,
  compress,
  onChoice,
  lz4,
}: {
  format: ImageFormat;
  compress: boolean;
  onChoice: (format: ImageFormat, compress: boolean) => void;
  lz4?: Lz4Choice;
}) {
  const tr = useTr();
  const setFormat = (f: ImageFormat) => onChoice(f, compress);
  const setCompress = (c: boolean) => onChoice(format, c);
  const packing = lz4Active(format, lz4);
  const options: { id: ImageFormat; label: string; body: string }[] = [
    {
      id: "ffpkg",
      label: tr("fpkg.image.ffpkg", undefined, ".ffpkg (UFS2), recommended"),
      body: tr(
        "fpkg.image.ffpkg_body",
        undefined,
        "What ShadowMount+ recommends for most games.",
      ),
    },
    {
      id: "exfat",
      label: tr("fpkg.image.exfat_choice", undefined, ".exfat"),
      body: tr(
        "fpkg.image.exfat_body",
        undefined,
        "For games that only work like content on an external drive.",
      ),
    },
    {
      id: "ffpfs",
      label: tr("fpkg.image.ffpfs", undefined, ".ffpfs (PFS), experimental"),
      body: tr(
        "fpkg.image.ffpfs_body",
        undefined,
        "Experimental in ShadowMount+ 1.7. File names must be plain ASCII; the image's own name is kept to 63 characters.",
      ),
    },
  ];
  return (
    <div className="mt-1 space-y-2" data-testid="image-choice">
      <div className="grid gap-2 2xl:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={format === o.id}
            onClick={() => setFormat(o.id)}
            className={`border rounded-[var(--radius-card)] transition-[background-color,border-color,box-shadow] px-3.5 py-3 text-left text-xs ${
              format === o.id
                ? "border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[var(--color-surface-raised)] shadow-[var(--edge-highlight),var(--shadow-1)] ring-1 ring-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)]"
            }`}
          >
            <div className="font-semibold text-[var(--color-text)]">{o.label}</div>
            <div className="mt-0.5 text-[var(--color-muted)]">{o.body}</div>
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs">
        <input
          type="checkbox"
          checked={compress && !packing}
          disabled={packing}
          onChange={(e) => setCompress(e.target.checked)}
          className="checkbox mt-px h-4 w-4 shrink-0"
        />
        <span className="min-w-0">
          <span className="block font-medium text-[var(--color-text)]">
            {tr("fpkg.image.compress", undefined, "Compress it into a .ffpfsc")}
          </span>
          <span className="mt-0.5 block leading-relaxed text-[var(--color-muted)]">
            {tr(
              "fpkg.image.compress_body_v2",
              undefined,
              "Usually 40–60% smaller, slower to make, and always mounted read-only. It is compressed as it is written, so only the compressed file is ever on disk.",
            )}
          </span>
        </span>
      </label>
      {lz4 && format === "exfat" && <Lz4Option lz4={lz4} />}
      <VerifyChunkOption />
    </div>
  );
}

/** How much the read-back check reads per call. Measured on a 10 GB image: 1–32 MiB are
 *  within 15% of each other once the reader fetches whole runs of clusters, and 8 MiB was
 *  fastest; the choice is here for anyone whose disk says otherwise. */
function VerifyChunkOption() {
  const tr = useTr();
  const kib = useConvertPrefs((s) => s.verifyChunkKib);
  const set = useConvertPrefs((s) => s.setVerifyChunkKib);
  return (
    <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" data-testid="verify-chunk">
      <span className="min-w-0">
        <span className="block font-medium text-[var(--color-text)]">
          {tr("fpkg.image.verify_chunk", undefined, "Read-back check, per read")}
        </span>
        <span className="mt-0.5 block leading-relaxed text-[var(--color-muted)]">
          {tr(
            "fpkg.image.verify_chunk_body",
            undefined,
            "After writing, the image is read back and every file hash-checked. 8 MiB was fastest in measurement; try another if your disk disagrees. The check itself is the same at any size.",
          )}
        </span>
      </span>
      <select
        value={kib}
        onChange={(e) => set(Number(e.target.value))}
        className="select w-auto!"
        aria-label={tr("fpkg.image.verify_chunk", undefined, "Read-back check, per read")}
      >
        {VERIFY_CHUNK_KIB.map((k) => (
          <option key={k} value={k}>
            {k === DEFAULT_VERIFY_CHUNK_KIB
              ? tr("fpkg.image.verify_chunk_default", { n: k / 1024 }, "{n} MiB (default)")
              : tr("fpkg.image.verify_chunk_mib", { n: k / 1024 }, "{n} MiB")}
          </option>
        ))}
      </select>
    </label>
  );
}
