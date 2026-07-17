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
    <div className="ui-panel p-3">
      <div className="ui-panel-title mb-2">{title ?? t("format.outputTitle")}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            aria-pressed={outputFormat === option.value}
            key={option.value}
            className={`min-h-[34px] rounded-[7px] border px-3 py-1.5 text-[13px] font-medium transition ${
              outputFormat === option.value ? "border-neutral-950 bg-neutral-950 text-white shadow-sm" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
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
    <div className="ui-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="ui-panel-title">{t("quality.title")}</div>
        <div className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium tabular-nums text-neutral-600">{quality}</div>
      </div>
      <input aria-label={t("quality.ariaLabel")} className="block w-full" max={100} min={1} onChange={(event) => onChange(Number(event.target.value))} type="range" value={quality} />
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
    <div className="ui-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="ui-panel-title">{t("reference.title")}</div>
        {analysis ? <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700"><span className="ui-status-dot" />{t("common.ready")}</div> : null}
      </div>
      <div className="ui-inset p-2.5 text-sm">
        {referenceFile ? (
          <>
            <div className="truncate font-medium text-neutral-900">{referenceFile.name}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {analysis
                ? t("reference.analysisSummary", { width: analysis.width, height: analysis.height, confidence: Math.round(analysis.confidence * 100), method: methodLabel })
                : analyzing
                  ? t("reference.analyzingSubject")
                  : t("reference.noAnalysis")}
            </div>
          </>
        ) : (
          <div className="text-neutral-500">{t("reference.notSelected")}</div>
        )}
      </div>
      {error ? <div className="mt-2 text-xs leading-5 text-rose-600" role="alert">{localizeErrorMessage(error, language)}</div> : null}
      <button
        className="ui-button-secondary mt-2 w-full px-3"
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
    <div className="ui-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="ui-panel-title">{t("adjustment.title")}</div>
        <button className="min-h-8 rounded-md px-2 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40" disabled={disabled} onClick={onReset} type="button">
          {t("common.reset")}
        </button>
      </div>

      <label className="ui-label block">
        {t("adjustment.scale")}
        <div className="mt-1 flex items-center gap-2">
          <input
            aria-label={t("adjustment.scaleSliderAria")}
            className="min-w-0 flex-1"
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
            className="ui-input w-20 px-2 text-right text-sm tabular-nums"
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
          <span className="text-xs text-neutral-500">%</span>
        </div>
      </label>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="ui-label">
          {t("adjustment.offsetX")}
          <input
            className="ui-input mt-1 w-full px-2 text-sm tabular-nums"
            disabled={disabled}
            inputMode="numeric"
            onChange={(event) => onChange({ ...adjustment, offsetX: Number(event.target.value) || 0 })}
            step={1}
            type="number"
            value={adjustment.offsetX}
          />
        </label>
        <label className="ui-label">
          {t("adjustment.offsetY")}
          <input
            className="ui-input mt-1 w-full px-2 text-sm tabular-nums"
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
    <div aria-busy={busy} className="ui-panel sticky bottom-0 z-10 p-3 shadow-[0_-8px_24px_rgba(245,245,245,0.9)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="ui-panel-title">{t("export.title")}</div>
        <div className="text-xs text-neutral-500">{t("queue.count", { count: files })}</div>
      </div>
      <div className="ui-inset truncate px-2.5 py-2 text-xs text-neutral-600" title={outputDir || undefined}>{outputDir || t("export.noFolder")}</div>
      <div className="mt-2 flex gap-2">
        <button className="ui-button-secondary flex-1 px-3" onClick={onChooseFolder} type="button">
          {t("export.chooseFolder")}
        </button>
        {secondaryAction ? (
          <button className="ui-button-secondary px-3" onClick={secondaryAction.onClick} type="button">
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
      <button
        className="ui-button-primary mt-2 w-full px-3"
        disabled={busy || files === 0 || !outputDir}
        onClick={onRun}
        type="button"
      >
        {busy ? t("common.processing") : t("export.batch")}
      </button>
      <span aria-live="polite" className="sr-only">{busy ? t("common.processing") : ""}</span>
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
    <div className="ui-panel p-3">
      <div className="ui-panel-title mb-2">{t("crop.ratioTitle")}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((option) => (
          <button
            aria-pressed={cropPreset === option}
            key={option}
            className={`min-h-[32px] rounded-md border px-2 py-1.5 text-[13px] transition ${
              cropPreset === option ? "border-neutral-950 bg-neutral-950 font-medium text-white" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
            onClick={() => onChange(option)}
            type="button"
          >
            {option === "free" ? t("crop.free") : option}
          </button>
        ))}
      </div>
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
    <div className="ui-panel p-3">
      <div className="ui-panel-title mb-2">{t("crop.regionTitle")}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="ui-label">{t("crop.left")}
          <input className="ui-input mt-1 w-full min-w-0 px-2 text-sm tabular-nums" inputMode="numeric" min={0} onChange={(event) => onChange("left", event.target.value)} step={1} type="number" value={crop?.left ?? ""} />
        </label>
        <label className="ui-label">{t("crop.top")}
          <input className="ui-input mt-1 w-full min-w-0 px-2 text-sm tabular-nums" inputMode="numeric" min={0} onChange={(event) => onChange("top", event.target.value)} step={1} type="number" value={crop?.top ?? ""} />
        </label>
        <label className="ui-label">{t("crop.width")}
          <input className="ui-input mt-1 w-full min-w-0 px-2 text-sm tabular-nums" inputMode="numeric" min={1} onChange={(event) => onChange("width", event.target.value)} step={1} type="number" value={crop?.width ?? ""} />
        </label>
        <label className="ui-label">{t("crop.height")}
          <input className="ui-input mt-1 w-full min-w-0 px-2 text-sm tabular-nums" inputMode="numeric" min={1} onChange={(event) => onChange("height", event.target.value)} step={1} type="number" value={crop?.height ?? ""} />
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
    <div className="ui-panel p-3">
      <div className="ui-panel-title mb-2">{t("resize.presetsTitle")}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            className="min-h-[32px] rounded-md border border-neutral-300 px-2 py-1.5 text-[12px] text-neutral-700 transition hover:bg-neutral-50"
            onClick={() => onApply(preset.width, preset.height)}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
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
    <div className="ui-panel p-3">
      <div className="ui-panel-title mb-2">{t("resize.maximumSizeTitle")}</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="ui-label">{t("resize.maximumWidth")}
          <input className="ui-input mt-1 w-full min-w-0 px-2 text-sm tabular-nums" inputMode="numeric" min={1} onChange={(event) => onWidthChange(event.target.value)} step={1} type="number" value={width} />
        </label>
        <label className="ui-label">{t("resize.maximumHeight")}
          <input className="ui-input mt-1 w-full min-w-0 px-2 text-sm tabular-nums" inputMode="numeric" min={1} onChange={(event) => onHeightChange(event.target.value)} step={1} type="number" value={height} />
        </label>
      </div>
      <label className="mt-2 flex min-h-8 items-center justify-between text-[13px] text-neutral-600">
        {t("resize.lockRatio")}
        <input checked={lockRatio} className="h-4 w-4" onChange={(event) => onLockRatioChange(event.target.checked)} type="checkbox" />
      </label>
    </div>
  );
}
