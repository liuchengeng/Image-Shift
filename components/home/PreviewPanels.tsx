import type { PointerEvent, RefObject } from "react";
import type { PreviewImage } from "@/src/shared/types/image";
import { formatBytes, type CropBox, type CropHandle, type QueueFile } from "@/components/home/dashboard-utils";

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

export function ConvertSummaryPanel({ files, selectedFile, targetFormat, estimatedOutputSizeBytes, exportedOutputSizeBytes, estimateError, estimating }: ConvertSummaryPanelProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">Convert batch</div>
        <div className="text-xs text-slate-500">No preview in convert mode</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Selection</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{files.length}</div>
          <div className="mt-1 text-sm text-slate-500">images queued for conversion</div>
        </div>

        <div className="rounded-xl border bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Target format</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{targetFormat}</div>
          <div className="mt-1 text-sm text-slate-500">exported format for the current batch</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-4">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Current file</div>
        {selectedFile ? (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="font-medium text-slate-900">{selectedFile.name}</div>
            <div>Original size: {formatBytes(selectedFile.sizeBytes)}</div>
            <div>Export as: {targetFormat}</div>
            <div>
              Estimated output: {estimating ? "Calculating..." : estimateError ? estimateError : formatBytes(estimatedOutputSizeBytes)}
            </div>
            {exportedOutputSizeBytes ? <div>Exported size: {formatBytes(exportedOutputSizeBytes)}</div> : null}
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-500">Select a file from the queue.</div>
        )}
      </div>
    </div>
  );
}

export function CompressPreviewPanel(props: CompressPreviewPanelProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">Compressed preview</div>
        <div className="text-xs text-slate-500">Quality {props.quality}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <PreviewSlot label="Original" preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot label="Compressed" preview={props.afterPreview} error={props.afterPreviewError} />
      </div>
      <div className="mt-4 text-xs text-slate-500">
        Original {formatBytes(props.sourceSizeBytes)} {"->"} Estimated {props.estimating ? "Calculating..." : props.estimateError ? props.estimateError : formatBytes(props.estimatedOutputSizeBytes)}
        {props.outputSizeBytes ? ` -> Exported ${formatBytes(props.outputSizeBytes)}` : ""}
      </div>
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
  onHandlePointerDown
}: CropEditorPanelProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">Crop editor</div>
        <div className="text-xs text-slate-500">Drag the box or use corners to resize</div>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-xl border bg-slate-100">
        {!preview ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
            {previewError || (selectedFileName ? "Loading preview..." : "Select a file from the list.")}
          </div>
        ) : (
          <div className="h-full w-full overflow-auto overscroll-contain">
            <div
              className="flex min-h-full min-w-full items-center justify-center p-4"
              style={{ height: `max(100%, ${preview.displayHeight + 32}px)`, width: `max(100%, ${preview.displayWidth + 32}px)` }}
            >
              <div
                className="relative shrink-0 touch-none"
                onPointerDown={onStagePointerDown}
                style={{ height: preview.displayHeight, width: preview.displayWidth }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={selectedFileName ?? "Preview"}
                  className="block select-none"
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  ref={imageRef}
                  src={preview.dataUrl}
                  style={{ height: preview.displayHeight, width: preview.displayWidth }}
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
                            className={`absolute h-3.5 w-3.5 rounded-full border border-slate-900 bg-white ${position}`}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ResizePreviewPanel({ preview, previewError, width, height, sourceWidth, sourceHeight }: ResizePreviewPanelProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">Resize output</div>
        <div className="text-xs text-slate-500">Keeps original proportions</div>
      </div>
      <div className="aspect-video rounded-xl border bg-slate-100">
        {preview ? (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Resize preview" className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
            {previewError || "Select a file to inspect resize output."}
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Original</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {sourceWidth && sourceHeight ? `${sourceWidth} x ${sourceHeight}` : "--"}
          </div>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Max width</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{width || "Auto"}</div>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Max height</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{height || "Auto"}</div>
        </div>
      </div>
    </div>
  );
}

function PreviewSlot({ label, preview, error }: { label: string; preview: PreviewImage | null; error: string }) {
  return (
    <div className="rounded-xl border bg-slate-100 p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-white">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={label} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
        ) : (
          <div className="px-6 text-center text-sm text-slate-500">{error || "No preview available."}</div>
        )}
      </div>
    </div>
  );
}
