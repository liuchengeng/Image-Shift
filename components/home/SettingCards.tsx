import type { CropRect, OutputFormat } from "@/src/shared/types/image";
import { FORMAT_OPTIONS, type CropPreset } from "@/components/home/dashboard-utils";

export function FormatCard({
  outputFormat,
  onChange,
  title = "Output format",
  options = FORMAT_OPTIONS
}: {
  outputFormat: OutputFormat;
  onChange: (value: OutputFormat) => void;
  title?: string;
  options?: { value: OutputFormat; label: string }[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 font-medium">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`rounded-lg border p-3 text-sm transition ${
              outputFormat === option.value ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
            }`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function QualityCard({ quality, onChange }: { quality: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="font-medium">Quality</div>
        <div className="text-sm text-slate-500">{quality}</div>
      </div>
      <input className="w-full accent-slate-900" max={100} min={1} onChange={(event) => onChange(Number(event.target.value))} type="range" value={quality} />
    </div>
  );
}

export function RunCard({
  outputDir,
  files,
  busy,
  onChooseFolder,
  onRun,
  secondaryAction
}: {
  outputDir: string;
  files: number;
  busy: boolean;
  onChooseFolder: () => void;
  onRun: () => void;
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 font-medium">Export</div>
      <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">{outputDir || "No export folder selected."}</div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-lg border p-2 text-sm hover:bg-slate-50" onClick={onChooseFolder} type="button">
          Choose folder
        </button>
        {secondaryAction ? (
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={secondaryAction.onClick} type="button">
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
      <button
        className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={busy || files === 0 || !outputDir}
        onClick={onRun}
        type="button"
      >
        {busy ? "Processing..." : "Export batch"}
      </button>
    </div>
  );
}

export function AspectRatioCard({
  cropPreset,
  onChange
}: {
  cropPreset: CropPreset;
  onChange: (preset: CropPreset) => void;
}) {
  const options: CropPreset[] = ["free", "1:1", "4:5", "16:9"];

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 font-medium">Crop shape</div>
      {options.map((option) => (
        <button
          key={option}
          className={`mb-2 w-full rounded-lg border p-2 text-left text-sm transition ${
            cropPreset === option ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
          }`}
          onClick={() => onChange(option)}
          type="button"
        >
          {option === "free" ? "Free" : option}
        </button>
      ))}
    </div>
  );
}

export function CropFieldsCard({
  crop,
  onChange
}: {
  crop?: CropRect;
  onChange: (field: keyof CropRect, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 font-medium">Crop area (px)</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <input onChange={(event) => onChange("left", event.target.value)} placeholder="Left" value={crop?.left ?? ""} />
        <input onChange={(event) => onChange("top", event.target.value)} placeholder="Top" value={crop?.top ?? ""} />
        <input onChange={(event) => onChange("width", event.target.value)} placeholder="Width" value={crop?.width ?? ""} />
        <input onChange={(event) => onChange("height", event.target.value)} placeholder="Height" value={crop?.height ?? ""} />
      </div>
    </div>
  );
}

export function ResizePresetCard({
  presets,
  onApply
}: {
  presets: { label: string; width: number; height: number }[];
  onApply: (width: number, height: number) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 font-medium">Presets</div>
      {presets.map((preset) => (
        <button
          key={preset.label}
          className="mb-2 w-full rounded-lg border p-2 text-left text-sm transition hover:bg-slate-50"
          onClick={() => onApply(preset.width, preset.height)}
          type="button"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export function ResizeFieldsCard({
  width,
  height,
  lockRatio,
  onWidthChange,
  onHeightChange,
  onLockRatioChange
}: {
  width: string;
  height: string;
  lockRatio: boolean;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onLockRatioChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 font-medium">Max size</div>
      <div className="grid grid-cols-2 gap-2">
        <input inputMode="numeric" onChange={(event) => onWidthChange(event.target.value)} placeholder="Max width" value={width} />
        <input inputMode="numeric" onChange={(event) => onHeightChange(event.target.value)} placeholder="Max height" value={height} />
      </div>
      <label className="mt-3 flex items-center justify-between text-sm text-slate-600">
        Sync fields
        <input checked={lockRatio} className="h-4 w-4" onChange={(event) => onLockRatioChange(event.target.checked)} type="checkbox" />
      </label>
    </div>
  );
}
