import { useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { LayoutMatchResult, PreviewImage } from "@/src/shared/types/image";
import { fitDimensions, formatBytes, type CropBox, type CropHandle, type QueueFile } from "@/components/home/dashboard-utils";
import { useLanguage } from "@/components/home/LanguageProvider";
import { localizeErrorMessage } from "@/components/home/i18n";

type ConvertSummaryPanelProps = {
  files: QueueFile[];
  selectedFile: QueueFile | null;
  preview: PreviewImage | null;
  previewError: string;
  onAddImages: () => void;
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

export function ConvertSummaryPanel({ files, selectedFile, preview, previewError, onAddImages, targetFormat, estimatedOutputSizeBytes, exportedOutputSizeBytes, estimateError, estimating }: ConvertSummaryPanelProps) {
  const { language, t } = useLanguage();

  return (
    <div className="ui-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="ui-panel-title">{t("convert.title")}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1">{t("queue.count", { count: files.length })}</span>
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-medium text-neutral-700">{targetFormat}</span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={selectedFile?.name ?? t("convert.title")} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
        ) : (
          <div aria-live="polite" className="flex max-w-xs flex-col items-center px-6 text-center" role="status">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm">
              <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
                <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.5" width="18" x="3" y="4" />
                <circle cx="8.25" cy="9" fill="currentColor" r="1.25" />
                <path d="m5.5 17 4.2-4.2a1 1 0 0 1 1.42 0l2.1 2.1 1.65-1.65a1 1 0 0 1 1.42 0L18.75 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="text-sm font-medium text-neutral-700">
              {previewError ? localizeErrorMessage(previewError, language) : selectedFile ? t("common.loadingPreview") : t("convert.noImage")}
            </div>
            {!selectedFile ? (
              <button className="ui-button-primary mt-3 px-3" onClick={onAddImages} type="button">
                {t("common.addImages")}
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="ui-inset mt-2.5 min-h-[42px] px-3 py-2">
        {selectedFile ? (
          <div className="flex min-w-0 items-center justify-between gap-4 text-xs text-neutral-500">
            <div className="min-w-0 truncate font-medium text-neutral-800" title={selectedFile.name}>{selectedFile.name}</div>
            <div className="flex shrink-0 items-center gap-3">
              <span>{t("convert.originalSize", { size: formatBytes(selectedFile.sizeBytes) })}</span>
              <span>{t("convert.estimatedSize", { size: estimating ? t("convert.calculating") : estimateError ? localizeErrorMessage(estimateError, language) : formatBytes(estimatedOutputSizeBytes) })}</span>
              {exportedOutputSizeBytes ? <span>{t("convert.exportedSize", { size: formatBytes(exportedOutputSizeBytes) })}</span> : null}
            </div>
          </div>
        ) : (
          <div className="text-xs text-neutral-400">{t("convert.currentFile")} · —</div>
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
    <div className="ui-panel flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="ui-panel-title">{t("compress.previewTitle")}</div>
        <div className="text-xs text-neutral-500">{t("compress.quality", { quality: props.quality })}</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <PreviewSlot label={t("compress.original")} preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot label={t("compress.compressed")} preview={props.afterPreview} error={props.afterPreviewError} />
      </div>
      <div className="mt-2 text-xs text-neutral-500">
        {t("compress.estimateSummary", { source: formatBytes(props.sourceSizeBytes), estimate })}
        {props.outputSizeBytes ? t("compress.exportedAppend", { size: formatBytes(props.outputSizeBytes) }) : ""}
      </div>
    </div>
  );
}

export function BackgroundRemovalPanel(props: BackgroundRemovalPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="ui-panel flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="ui-panel-title">{t("removeBackground.title")}</div>
        <div aria-live="polite" className="text-xs text-neutral-500">{props.estimating ? t("removeBackground.recognizing") : ""}</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <PreviewSlot label={t("removeBackground.original")} preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot checkerboard label={t("removeBackground.transparent")} preview={props.afterPreview} error={props.afterPreviewError || (props.estimating ? t("removeBackground.processing") : "")} />
      </div>
    </div>
  );
}

export function LayoutMatchPreviewPanel(props: LayoutMatchPreviewPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="ui-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="ui-panel-title">{t("layout.previewTitle")}</div>
          {props.targetName ? <div className="mt-0.5 max-w-[420px] truncate text-xs text-neutral-500">{t("layout.target", { name: props.targetName })}</div> : null}
        </div>
        <div aria-live="polite" className="shrink-0 text-xs text-neutral-500">{props.processing ? t("layout.recognizingAndMatching") : ""}</div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
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
        <div className="ui-inset mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs text-neutral-600">
          <span>{t("layout.finalScale", { value: (props.result.finalScale * 100).toFixed(2) })}</span>
          <span>{t("layout.offset", { x: Math.round(props.result.offsetX), y: Math.round(props.result.offsetY) })}</span>
          <span>{t("layout.confidence", { value: Math.round(props.result.confidence * 100) })}</span>
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
    <div className="ui-panel flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="ui-panel-title">{t("crop.editorTitle")}</div>
        <div className="text-xs text-neutral-500">{t("crop.editorHint")}</div>
      </div>
      <div ref={viewportRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 p-3">
        {!preview ? (
          <div aria-live="polite" className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500" role="status">
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
                    <div
                      className="absolute touch-none border-2 border-white bg-transparent shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_0_0_9999px_rgba(0,0,0,0.32)]"
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
                            tabIndex={-1}
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
    <div className="ui-panel flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 ui-panel-title">{t("resize.previewTitle")}</div>
      <div className="min-h-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-100">
        {preview ? (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={t("resize.previewTitle")} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
          </div>
        ) : (
          <div aria-live="polite" className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500" role="status">
            {previewError ? localizeErrorMessage(previewError, language) : t("resize.selectImageHint")}
          </div>
        )}
      </div>
      <div className="ui-inset mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs text-neutral-600">
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
    <div className="flex min-h-0 flex-col rounded-lg border border-neutral-200 bg-neutral-50 p-2">
      <div className="mb-1.5 text-xs font-medium text-neutral-500">{label}</div>
      <div className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-neutral-200 ${checkerboard ? "transparent-grid" : "bg-white"}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={label} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
        ) : (
          <div aria-live="polite" className="px-4 text-center text-sm text-neutral-500" role="status">{error ? localizeErrorMessage(error, language) : t("common.noPreview")}</div>
        )}
      </div>
    </div>
  );
}
