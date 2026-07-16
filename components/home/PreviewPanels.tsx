import { useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { LayoutMatchResult, PreviewImage } from "@/src/shared/types/image";
import { fitDimensions, formatBytes, type CropBox, type CropHandle, type QueueFile } from "@/components/home/dashboard-utils";
import { useLanguage } from "@/components/home/LanguageProvider";
import { localizeErrorMessage } from "@/components/home/i18n";

type ConvertSummaryPanelProps = {
  files: QueueFile[];
  selectedFile: QueueFile | null;
  targetFormat: string;
  estimatedOutputSizeBytes?: number;
  exportedOutputSizeBytes?: number;
  estimateError?: string;
  estimating?: boolean;
};

type CropEditorPanelProps = {
  preview: PreviewImage | null;
  previewError: string;
  draftCrop: CropBox | null;
  selectedFileName?: string;
  imageRef: RefObject<HTMLImageElement | null>;
  onStagePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onCropPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onHandlePointerDown: (handle: CropHandle, event: PointerEvent<HTMLButtonElement>) => void;
  onRenderedSizeChange: (width: number, height: number) => void;
};

type ResizePreviewPanelProps = {
  preview: PreviewImage | null;
  previewError: string;
  width: string;
  height: string;
  sourceWidth?: number;
  sourceHeight?: number;
};

type CompressPreviewPanelProps = {
  beforePreview: PreviewImage | null;
  beforePreviewError: string;
  afterPreview: PreviewImage | null;
  afterPreviewError: string;
  sourceSizeBytes?: number;
  outputSizeBytes?: number;
  estimatedOutputSizeBytes?: number;
  estimateError?: string;
  estimating?: boolean;
  quality: number;
};

type BackgroundRemovalPanelProps = {
  beforePreview: PreviewImage | null;
  beforePreviewError: string;
  afterPreview: PreviewImage | null;
  afterPreviewError: string;
  estimating: boolean;
};

type LayoutMatchPreviewPanelProps = {
  referencePreview: PreviewImage | null;
  referenceError: string;
  matchedPreview: PreviewImage | null;
  matchedError: string;
  referenceName?: string;
  targetName?: string;
  result?: LayoutMatchResult;
  processing: boolean;
  referenceTransparent: boolean;
};

export function ConvertSummaryPanel({ files, selectedFile, targetFormat, estimatedOutputSizeBytes, exportedOutputSizeBytes, estimateError, estimating }: ConvertSummaryPanelProps) {
  const { language, t } = useLanguage();

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-3">
      <div className="mb-2 font-medium">{t("convert.title")}</div>

      <div className="grid grid-cols-2 divide-x rounded-lg border bg-slate-50">
        <div className="flex items-baseline justify-between gap-3 p-3">
          <div className="text-xs text-slate-500">{t("convert.files")}</div>
          <div className="font-semibold text-slate-900">{t("queue.count", { count: files.length })}</div>
        </div>

        <div className="flex items-baseline justify-between gap-3 p-3">
          <div className="text-xs text-slate-500">{t("convert.output")}</div>
          <div className="font-semibold text-slate-900">{targetFormat}</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border p-3">
        <div className="text-xs font-medium text-slate-500">{t("convert.currentFile")}</div>
        {selectedFile ? (
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="font-medium text-slate-900">{selectedFile.name}</div>
            <div>{t("convert.originalSize", { size: formatBytes(selectedFile.sizeBytes) })}</div>
            <div>{t("convert.outputFormat", { format: targetFormat })}</div>
            <div>
              {t("convert.estimatedSize", { size: estimating ? t("convert.calculating") : estimateError ? localizeErrorMessage(estimateError, language) : formatBytes(estimatedOutputSizeBytes) })}
            </div>
            {exportedOutputSizeBytes ? <div>{t("convert.exportedSize", { size: formatBytes(exportedOutputSizeBytes) })}</div> : null}
          </div>
        ) : (
          <div className="mt-2 text-sm text-slate-500">{t("convert.noImage")}</div>
        )}
      </div>
    </div>
  );
}

export function CompressPreviewPanel(props: CompressPreviewPanelProps) {
  const { language, t } = useLanguage();
  const estimate = props.estimating
    ? t("convert.calculating")
    : props.estimateError
      ? localizeErrorMessage(props.estimateError, language)
      : formatBytes(props.estimatedOutputSizeBytes);

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">{t("compress.previewTitle")}</div>
        <div className="text-xs text-slate-500">{t("compress.quality", { quality: props.quality })}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PreviewSlot label={t("compress.original")} preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot label={t("compress.compressed")} preview={props.afterPreview} error={props.afterPreviewError} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {t("compress.estimateSummary", { source: formatBytes(props.sourceSizeBytes), estimate })}
        {props.outputSizeBytes ? t("compress.exportedAppend", { size: formatBytes(props.outputSizeBytes) }) : ""}
      </div>
    </div>
  );
}

export function BackgroundRemovalPanel(props: BackgroundRemovalPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="font-medium">{t("removeBackground.title")}</div>
        <div aria-live="polite" className="text-xs text-slate-500">{props.estimating ? t("removeBackground.recognizing") : t("common.localProcessing")}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PreviewSlot label={t("removeBackground.original")} preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot checkerboard label={t("removeBackground.transparent")} preview={props.afterPreview} error={props.afterPreviewError || (props.estimating ? t("removeBackground.processing") : "")} />
      </div>
    </div>
  );
}

export function LayoutMatchPreviewPanel(props: LayoutMatchPreviewPanelProps) {
  const { t } = useLanguage();
  const methodLabel = props.result?.method === "alpha" ? t("reference.method.alpha") : props.result?.method === "edge" ? t("reference.method.edge") : t("reference.method.ai");

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{t("layout.previewTitle")}</div>
          <div className="mt-0.5 max-w-[420px] truncate text-xs text-slate-500">
            {props.targetName ? t("layout.target", { name: props.targetName }) : t("layout.selectTargetHint")}
          </div>
        </div>
        <div aria-live="polite" className="shrink-0 text-xs text-slate-500">{props.processing ? t("layout.recognizingAndMatching") : ""}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PreviewSlot
          checkerboard={props.referenceTransparent}
          error={props.referenceError || (props.referenceName ? t("layout.loadingReference") : t("layout.selectReferenceHint"))}
          label={t("layout.referenceLabel")}
          preview={props.referencePreview}
        />
        <PreviewSlot
          checkerboard
          error={props.matchedError || (props.processing ? t("layout.generatingPreview") : t("layout.selectReferenceAndTargetHint"))}
          label={t("layout.matchedLabel")}
          preview={props.matchedPreview}
        />
      </div>

      {props.result ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>{t("layout.autoScale", { value: (props.result.autoScale * 100).toFixed(2) })}</span>
          <span>{t("layout.finalScale", { value: (props.result.finalScale * 100).toFixed(2) })}</span>
          <span>{t("layout.offset", { x: Math.round(props.result.offsetX), y: Math.round(props.result.offsetY) })}</span>
          <span>{t("layout.confidence", { value: Math.round(props.result.confidence * 100) })}</span>
          <span className="text-slate-400">{methodLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export function CropEditorPanel({
  preview,
  previewError,
  draftCrop,
  selectedFileName,
  imageRef,
  onStagePointerDown,
  onCropPointerDown,
  onHandlePointerDown,
  onRenderedSizeChange
}: CropEditorPanelProps) {
  const { language, t } = useLanguage();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !preview) {
      setRenderedSize({ width: 0, height: 0 });
      onRenderedSizeChange(0, 0);
      return;
    }

    const updateSize = () => {
      const nextSize = fitDimensions(
        preview.displayWidth,
        preview.displayHeight,
        Math.max(0, viewport.clientWidth - 32),
        Math.max(0, viewport.clientHeight - 32)
      );
      setRenderedSize((current) => current.width === nextSize.width && current.height === nextSize.height ? current : nextSize);
      onRenderedSizeChange(nextSize.width, nextSize.height);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [onRenderedSizeChange, preview]);

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">{t("crop.editorTitle")}</div>
        <div className="text-xs text-slate-500">{t("crop.editorHint")}</div>
      </div>
      <div ref={viewportRef} className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-lg border bg-slate-100 p-3">
        {!preview ? (
          <div aria-live="polite" className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500" role="status">
            {previewError ? localizeErrorMessage(previewError, language) : selectedFileName ? t("common.loadingPreview") : t("crop.selectImageHint")}
          </div>
        ) : (
          renderedSize.width && renderedSize.height ? (
            <div
              className="relative shrink-0 touch-none"
              onPointerDown={onStagePointerDown}
              style={{ height: renderedSize.height, width: renderedSize.width }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={selectedFileName ?? t("crop.previewAlt")}
                  className="block select-none"
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  ref={imageRef}
                  src={preview.dataUrl}
                  style={{ height: renderedSize.height, width: renderedSize.width }}
                />
                {draftCrop ? (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-slate-950/30" />
                    <div
                      className="absolute touch-none border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.16)]"
                      onPointerDown={onCropPointerDown}
                      style={{ left: draftCrop.left, top: draftCrop.top, width: draftCrop.width, height: draftCrop.height }}
                    >
                      {(["nw", "ne", "sw", "se"] as CropHandle[]).map((handle) => {
                        const position =
                          handle === "nw"
                            ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"
                            : handle === "ne"
                              ? "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"
                              : handle === "sw"
                                ? "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"
                                : "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize";

                        return (
                          <button
                            aria-label={handle === "nw" ? t("crop.handle.nw") : handle === "ne" ? t("crop.handle.ne") : handle === "sw" ? t("crop.handle.sw") : t("crop.handle.se")}
                            className={`absolute h-6 w-6 rounded-full bg-transparent before:absolute before:left-1/2 before:top-1/2 before:h-3.5 before:w-3.5 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border before:border-slate-900 before:bg-white ${position}`}
                            key={handle}
                            onPointerDown={(event) => onHandlePointerDown(handle, event)}
                            type="button"
                          />
                        );
                      })}
                    </div>
                  </>
                ) : null}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

export function ResizePreviewPanel({ preview, previewError, width, height, sourceWidth, sourceHeight }: ResizePreviewPanelProps) {
  const { language, t } = useLanguage();

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">{t("resize.previewTitle")}</div>
        <div className="text-xs text-slate-500">{t("resize.preserveRatio")}</div>
      </div>
      <div className="aspect-video rounded-lg border bg-slate-100">
        {preview ? (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={t("resize.previewTitle")} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
          </div>
        ) : (
          <div aria-live="polite" className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500" role="status">
            {previewError ? localizeErrorMessage(previewError, language) : t("resize.selectImageHint")}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>{t("resize.originalSize", { width: sourceWidth ?? "—", height: sourceHeight ?? "—" })}</span>
        <span>{t("resize.maximumWidthValue", { width: width || t("common.automatic") })}</span>
        <span>{t("resize.maximumHeightValue", { height: height || t("common.automatic") })}</span>
      </div>
    </div>
  );
}

function PreviewSlot({ label, preview, error, checkerboard = false }: { label: string; preview: PreviewImage | null; error: string; checkerboard?: boolean }) {
  const { language, t } = useLanguage();

  return (
    <div className="rounded-lg border bg-slate-100 p-2">
      <div className="mb-1.5 text-xs font-medium text-slate-500">{label}</div>
      <div className={`flex h-[52vh] min-h-[320px] max-h-[460px] items-center justify-center overflow-hidden rounded-md border ${checkerboard ? "transparent-grid" : "bg-white"}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={label} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
        ) : (
          <div aria-live="polite" className="px-4 text-center text-sm text-slate-500" role="status">{error ? localizeErrorMessage(error, language) : t("common.noPreview")}</div>
        )}
      </div>
    </div>
  );
}
