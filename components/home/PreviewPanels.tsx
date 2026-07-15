import { useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { LayoutMatchResult, PreviewImage } from "@/src/shared/types/image";
import { fitDimensions, formatBytes, type CropBox, type CropHandle, type QueueFile } from "@/components/home/dashboard-utils";

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
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-3">
      <div className="mb-2 font-medium">格式转换</div>

      <div className="grid grid-cols-2 divide-x rounded-lg border bg-slate-50">
        <div className="flex items-baseline justify-between gap-3 p-3">
          <div className="text-xs text-slate-500">文件</div>
          <div className="font-semibold text-slate-900">{files.length} 张</div>
        </div>

        <div className="flex items-baseline justify-between gap-3 p-3">
          <div className="text-xs text-slate-500">输出</div>
          <div className="font-semibold text-slate-900">{targetFormat}</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border p-3">
        <div className="text-xs font-medium text-slate-500">当前文件</div>
        {selectedFile ? (
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="font-medium text-slate-900">{selectedFile.name}</div>
            <div>原始大小：{formatBytes(selectedFile.sizeBytes)}</div>
            <div>导出格式：{targetFormat}</div>
            <div>
              预计大小：{estimating ? "计算中…" : estimateError ? estimateError : formatBytes(estimatedOutputSizeBytes)}
            </div>
            {exportedOutputSizeBytes ? <div>已导出大小：{formatBytes(exportedOutputSizeBytes)}</div> : null}
          </div>
        ) : (
          <div className="mt-2 text-sm text-slate-500">未选择图片</div>
        )}
      </div>
    </div>
  );
}

export function CompressPreviewPanel(props: CompressPreviewPanelProps) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">压缩预览</div>
        <div className="text-xs text-slate-500">质量 {props.quality}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PreviewSlot label="原图" preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot label="压缩后" preview={props.afterPreview} error={props.afterPreviewError} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        原始 {formatBytes(props.sourceSizeBytes)} {"→"} 预计 {props.estimating ? "计算中…" : props.estimateError ? props.estimateError : formatBytes(props.estimatedOutputSizeBytes)}
        {props.outputSizeBytes ? ` → 已导出 ${formatBytes(props.outputSizeBytes)}` : ""}
      </div>
    </div>
  );
}

export function BackgroundRemovalPanel(props: BackgroundRemovalPanelProps) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="font-medium">智能抠图</div>
        <div className="text-xs text-slate-500">{props.estimating ? "正在识别主体…" : "本机处理"}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PreviewSlot label="原图" preview={props.beforePreview} error={props.beforePreviewError} />
        <PreviewSlot checkerboard label="透明背景" preview={props.afterPreview} error={props.afterPreviewError || (props.estimating ? "正在处理中…" : "")} />
      </div>
    </div>
  );
}

export function LayoutMatchPreviewPanel(props: LayoutMatchPreviewPanelProps) {
  const methodLabel = props.result?.method === "alpha" ? "透明通道" : props.result?.method === "edge" ? "边缘识别" : "AI";

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">参考图 / 匹配结果</div>
          <div className="mt-0.5 max-w-[420px] truncate text-xs text-slate-500">
            {props.targetName ? `目标：${props.targetName}` : "请从文件队列中选择目标图。"}
          </div>
        </div>
        {props.processing ? <div className="shrink-0 text-xs text-slate-500">正在识别并匹配…</div> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PreviewSlot
          checkerboard={props.referenceTransparent}
          error={props.referenceError || (props.referenceName ? "正在载入参考图…" : "请选择参考图。")}
          label="参考图"
          preview={props.referencePreview}
        />
        <PreviewSlot
          checkerboard
          error={props.matchedError || (props.processing ? "正在生成匹配预览…" : "请选择参考图和目标图。")}
          label="匹配结果"
          preview={props.matchedPreview}
        />
      </div>

      {props.result ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>自动缩放 <strong className="font-medium text-slate-900">{(props.result.autoScale * 100).toFixed(2)}%</strong></span>
          <span>最终缩放 <strong className="font-medium text-slate-900">{(props.result.finalScale * 100).toFixed(2)}%</strong></span>
          <span>偏移 <strong className="font-medium text-slate-900">{Math.round(props.result.offsetX)}, {Math.round(props.result.offsetY)} px</strong></span>
          <span>置信度 <strong className="font-medium text-slate-900">{Math.round(props.result.confidence * 100)}%</strong></span>
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
        <div className="font-medium">裁剪编辑器</div>
        <div className="text-xs text-slate-500">拖动选框，或拖动四角调整大小</div>
      </div>
      <div ref={viewportRef} className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-lg border bg-slate-100 p-3">
        {!preview ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
            {previewError || (selectedFileName ? "正在载入预览…" : "请从文件队列中选择图片。")}
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
                  alt={selectedFileName ?? "预览"}
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
          ) : null
        )}
      </div>
    </div>
  );
}

export function ResizePreviewPanel({ preview, previewError, width, height, sourceWidth, sourceHeight }: ResizePreviewPanelProps) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">尺寸调整预览</div>
        <div className="text-xs text-slate-500">保持原始比例</div>
      </div>
      <div className="aspect-video rounded-lg border bg-slate-100">
        {preview ? (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="尺寸调整预览" className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
            {previewError || "请选择图片以查看尺寸调整结果。"}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>原始尺寸 <strong className="font-medium text-slate-900">{sourceWidth && sourceHeight ? `${sourceWidth} × ${sourceHeight}` : "—"}</strong></span>
        <span>最大宽度 <strong className="font-medium text-slate-900">{width || "自动"}</strong></span>
        <span>最大高度 <strong className="font-medium text-slate-900">{height || "自动"}</strong></span>
      </div>
    </div>
  );
}

function PreviewSlot({ label, preview, error, checkerboard = false }: { label: string; preview: PreviewImage | null; error: string; checkerboard?: boolean }) {
  return (
    <div className="rounded-lg border bg-slate-100 p-2">
      <div className="mb-1.5 text-xs font-medium text-slate-500">{label}</div>
      <div className={`flex h-[52vh] min-h-[320px] max-h-[460px] items-center justify-center overflow-hidden rounded-md border ${checkerboard ? "transparent-grid" : "bg-white"}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={label} className="max-h-full max-w-full object-contain" src={preview.dataUrl} />
        ) : (
          <div className="px-4 text-center text-sm text-slate-500">{error || "暂无预览。"}</div>
        )}
      </div>
    </div>
  );
}
