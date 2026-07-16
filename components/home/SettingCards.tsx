import type { CropRect, ImportedImageFile, LayoutAdjustment, LayoutReferenceAnalysis, OutputFormat } from "@/src/shared/types/image";
import { FORMAT_OPTIONS, type CropPreset } from "@/components/home/dashboard-utils";
import { useLanguage } from "@/components/home/LanguageProvider";
import { localizeErrorMessage } from "@/components/home/i18n";

export function FormatCard({
  outputFormat,
  onChange,
  title,
  options = FORMAT_OPTIONS
}: {
  outputFormat: OutputFormat;
  onChange: (value: OutputFormat) => void;
  title?: string;
  options?: { value: OutputFormat; label: string }[];
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 font-medium">{title ?? t("format.outputTitle")}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            aria-pressed={outputFormat === option.value}
            key={option.value}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
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
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="font-medium">{t("quality.title")}</div>
        <div className="text-sm text-slate-500">{quality}</div>
      </div>
      <input aria-label={t("quality.ariaLabel")} className="w-full accent-slate-900" max={100} min={1} onChange={(event) => onChange(Number(event.target.value))} type="range" value={quality} />
    </div>
  );
}

export function LayoutReferenceCard({
  referenceFile,
  analysis,
  error,
  analyzing,
  onChoose
}: {
  referenceFile: ImportedImageFile | null;
  analysis: LayoutReferenceAnalysis | null;
  error: string;
  analyzing: boolean;
  onChoose: () => void;
}) {
  const { language, t } = useLanguage();
  const methodLabel = analysis?.method === "alpha"
    ? t("reference.method.alpha")
    : analysis?.method === "edge"
      ? t("reference.method.edge")
      : analysis?.method === "ai"
        ? t("reference.method.ai")
        : "";

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-medium">{t("reference.title")}</div>
        {analysis ? <div className="text-xs text-emerald-600">{t("common.ready")}</div> : null}
      </div>
      <div className="rounded-lg border bg-slate-50 p-3 text-sm">
        {referenceFile ? (
          <>
            <div className="truncate font-medium text-slate-900">{referenceFile.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              {analysis
                ? t("reference.analysisSummary", { width: analysis.width, height: analysis.height, confidence: Math.round(analysis.confidence * 100), method: methodLabel })
                : analyzing
                  ? t("reference.analyzingSubject")
                  : t("reference.noAnalysis")}
            </div>
          </>
        ) : (
          <div className="text-slate-500">{t("reference.notSelected")}</div>
        )}
      </div>
      {error ? <div className="mt-2 text-xs leading-5 text-rose-600" role="alert">{localizeErrorMessage(error, language)}</div> : null}
      <button
        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={analyzing}
        onClick={onChoose}
        type="button"
      >
        {analyzing ? t("reference.analyzing") : referenceFile ? t("reference.change") : t("reference.select")}
      </button>
    </div>
  );
}

export function LayoutAdjustmentCard({
  adjustment,
  disabled,
  onChange,
  onReset
}: {
  adjustment: LayoutAdjustment;
  disabled: boolean;
  onChange: (next: LayoutAdjustment) => void;
  onReset: () => void;
}) {
  const { t } = useLanguage();
  const scalePercent = Number((adjustment.scaleMultiplier * 100).toFixed(2));

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-medium">{t("adjustment.title")}</div>
        <button className="text-xs text-slate-500 hover:text-slate-900 disabled:opacity-40" disabled={disabled} onClick={onReset} type="button">
          {t("common.reset")}
        </button>
      </div>

      <label className="block text-xs text-slate-500">
        {t("adjustment.scale")}
        <div className="mt-1 flex items-center gap-2">
          <input
            aria-label={t("adjustment.scaleSliderAria")}
            className="min-w-0 flex-1 accent-slate-900"
            disabled={disabled}
            max={150}
            min={50}
            onChange={(event) => onChange({ ...adjustment, scaleMultiplier: Number(event.target.value) / 100 })}
            step={0.1}
            type="range"
            value={Math.min(150, Math.max(50, scalePercent))}
          />
          <input
            aria-label={t("adjustment.scalePercentAria")}
            className="w-20 rounded-lg border px-2 py-1.5 text-right text-sm"
            disabled={disabled}
            max={400}
            min={10}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value) && value >= 10 && value <= 400) {
                onChange({ ...adjustment, scaleMultiplier: value / 100 });
              }
            }}
            step={0.1}
            type="number"
            value={scalePercent}
          />
          <span className="text-xs text-slate-500">%</span>
        </div>
      </label>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">
          {t("adjustment.offsetX")}
          <input
            className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            disabled={disabled}
            inputMode="numeric"
            onChange={(event) => onChange({ ...adjustment, offsetX: Number(event.target.value) || 0 })}
            step={1}
            type="number"
            value={adjustment.offsetX}
          />
        </label>
        <label className="text-xs text-slate-500">
          {t("adjustment.offsetY")}
          <input
            className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            disabled={disabled}
            inputMode="numeric"
            onChange={(event) => onChange({ ...adjustment, offsetY: Number(event.target.value) || 0 })}
            step={1}
            type="number"
            value={adjustment.offsetY}
          />
        </label>
      </div>
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
  const { t } = useLanguage();

  return (
    <div aria-busy={busy} className="rounded-2xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-medium">{t("export.title")}</div>
        <div className="text-xs text-slate-500">{t("queue.count", { count: files })}</div>
      </div>
      <div className="truncate rounded-lg border bg-slate-50 px-2.5 py-2 text-xs text-slate-600" title={outputDir || undefined}>{outputDir || t("export.noFolder")}</div>
      <div className="mt-2 flex gap-2">
        <button className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={onChooseFolder} type="button">
          {t("export.chooseFolder")}
        </button>
        {secondaryAction ? (
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={secondaryAction.onClick} type="button">
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
      <button
        className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={busy || files === 0 || !outputDir}
        onClick={onRun}
        type="button"
      >
        {busy ? t("common.processing") : t("export.batch")}
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
  const { t } = useLanguage();
  const options: CropPreset[] = ["free", "1:1", "4:5", "16:9"];

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 font-medium">{t("crop.ratioTitle")}</div>
      {options.map((option) => (
        <button
          aria-pressed={cropPreset === option}
          key={option}
          className={`mb-1.5 w-full rounded-lg border px-3 py-1.5 text-left text-sm transition ${
            cropPreset === option ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
          }`}
          onClick={() => onChange(option)}
          type="button"
        >
          {option === "free" ? t("crop.free") : option}
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
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 font-medium">{t("crop.regionTitle")}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="text-xs text-slate-500">{t("crop.left")}
          <input className="mt-1 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm text-slate-900" inputMode="numeric" onChange={(event) => onChange("left", event.target.value)} value={crop?.left ?? ""} />
        </label>
        <label className="text-xs text-slate-500">{t("crop.top")}
          <input className="mt-1 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm text-slate-900" inputMode="numeric" onChange={(event) => onChange("top", event.target.value)} value={crop?.top ?? ""} />
        </label>
        <label className="text-xs text-slate-500">{t("crop.width")}
          <input className="mt-1 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm text-slate-900" inputMode="numeric" onChange={(event) => onChange("width", event.target.value)} value={crop?.width ?? ""} />
        </label>
        <label className="text-xs text-slate-500">{t("crop.height")}
          <input className="mt-1 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm text-slate-900" inputMode="numeric" onChange={(event) => onChange("height", event.target.value)} value={crop?.height ?? ""} />
        </label>
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
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 font-medium">{t("resize.presetsTitle")}</div>
      {presets.map((preset) => (
        <button
          key={preset.label}
          className="mb-1.5 w-full rounded-lg border px-3 py-1.5 text-left text-sm transition hover:bg-slate-50"
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
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="mb-2 font-medium">{t("resize.maximumSizeTitle")}</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">{t("resize.maximumWidth")}
          <input className="mt-1 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm text-slate-900" inputMode="numeric" onChange={(event) => onWidthChange(event.target.value)} value={width} />
        </label>
        <label className="text-xs text-slate-500">{t("resize.maximumHeight")}
          <input className="mt-1 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm text-slate-900" inputMode="numeric" onChange={(event) => onHeightChange(event.target.value)} value={height} />
        </label>
      </div>
      <label className="mt-2 flex items-center justify-between text-sm text-slate-600">
        {t("resize.lockRatio")}
        <input checked={lockRatio} className="h-4 w-4" onChange={(event) => onLockRatioChange(event.target.checked)} type="checkbox" />
      </label>
    </div>
  );
}
