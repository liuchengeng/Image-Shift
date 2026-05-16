"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BatchProcessRequest, BatchProcessResult, CropRect, ImportedImageFile, ImageJob, OutputFormat, PreviewImage } from "@/src/shared/types/image";
import { ExportHistoryPanel } from "@/components/home/ExportHistoryPanel";
import { FileListPanel } from "@/components/home/FileListPanel";
import {
  CompressPreviewPanel,
  ConvertSummaryPanel,
  CropEditorPanel,
  ResizePreviewPanel
} from "@/components/home/PreviewPanels";
import {
  AspectRatioCard,
  CropFieldsCard,
  FormatCard,
  QualityCard,
  ResizeFieldsCard,
  ResizePresetCard,
  RunCard
} from "@/components/home/SettingCards";
import {
  buildId,
  clamp,
  COMPRESS_FORMAT_OPTIONS,
  formatBytes,
  getAspectRatioValue,
  getDesktopApi,
  getModeDescription,
  getOutputFormatFromPath,
  moveCropBox,
  resizeCropBox,
  RESIZE_PRESETS,
  TOOL_MODES,
  toCropBox,
  type CropBox,
  type CropHandle,
  type CropPreset,
  type DragState,
  type HistoryItem,
  type QueueFile,
  type ToolMode
} from "@/components/home/dashboard-utils";

type WorkbenchMode = Exclude<ToolMode, "Export">;

export function ImageShiftDashboard() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [desktopReady, setDesktopReady] = useState(false);
  const [activeMode, setActiveMode] = useState<ToolMode>("Convert");
  const [lastWorkbenchMode, setLastWorkbenchMode] = useState<WorkbenchMode>("Convert");
  const [files, setFiles] = useState<QueueFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const [afterPreview, setAfterPreview] = useState<PreviewImage | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [afterPreviewError, setAfterPreviewError] = useState("");
  const [actionError, setActionError] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(82);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BatchProcessResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [draftCrop, setDraftCrop] = useState<CropBox | null>(null);
  const [estimatedOutputSizeBytes, setEstimatedOutputSizeBytes] = useState<number | undefined>();
  const [estimateError, setEstimateError] = useState("");
  const [estimating, setEstimating] = useState(false);

  const selectedFile = useMemo(() => files.find((file) => file.id === selectedFileId) ?? null, [files, selectedFileId]);
  const selectedInputPath = selectedFile?.inputPath;
  const selectedCrop = selectedFile?.crop;
  const selectedCropLeft = selectedCrop?.left;
  const selectedCropTop = selectedCrop?.top;
  const selectedCropWidth = selectedCrop?.width;
  const selectedCropHeight = selectedCrop?.height;
  const resultsById = useMemo(() => new Map(result?.results.map((item) => [item.id, item]) ?? []), [result]);
  const selectedResult = selectedFile ? resultsById.get(selectedFile.id) : undefined;
  const effectiveMode: WorkbenchMode = activeMode === "Export" ? lastWorkbenchMode : activeMode;
  const aspectRatio = getAspectRatioValue(cropPreset);

  useEffect(() => {
    setDesktopReady(Boolean(getDesktopApi()));
  }, []);

  useEffect(() => {
    if (activeMode !== "Export") {
      setLastWorkbenchMode(activeMode);
    }
  }, [activeMode]);

  useEffect(() => {
    if (activeMode === "Compress" && outputFormat === "png") {
      setOutputFormat("jpeg");
    }
  }, [activeMode, outputFormat]);

  useEffect(() => {
    if (files.length === 0) {
      setSelectedFileId(null);
      return;
    }

    if (!selectedFileId || !files.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  useEffect(() => {
    const needsPreview = activeMode === "Compress" || activeMode === "Crop" || activeMode === "Resize";

    if (!needsPreview || !selectedInputPath) {
      setPreview(null);
      setPreviewError("");
      setDraftCrop(null);
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setPreviewError("Desktop bridge is unavailable. Launch the EXE build.");
      return;
    }

    let cancelled = false;
    setPreview(null);
    setPreviewError("");
    setDraftCrop(null);

    desktopApi.loadPreview(selectedInputPath)
      .then((nextPreview) => {
        if (!cancelled) {
          setPreview(nextPreview);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : "Preview failed to load.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeMode, selectedInputPath]);

  useEffect(() => {
    if (activeMode !== "Compress" || !selectedFile) {
      setAfterPreview(null);
      setAfterPreviewError("");
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setAfterPreviewError("Desktop bridge is unavailable. Launch the EXE build.");
      return;
    }

    const compressFormat = outputFormat === "png" ? "jpeg" : outputFormat;
    const job: ImageJob = {
      id: selectedFile.id,
      inputPath: selectedFile.inputPath,
      outputFormat: compressFormat,
      quality
    };

    let cancelled = false;
    setAfterPreview(null);
    setAfterPreviewError("");
    setEstimating(true);
    setEstimateError("");

    const timer = window.setTimeout(() => {
      desktopApi.previewJob(job)
        .then((nextPreview) => {
          if (!cancelled) {
            setAfterPreview(nextPreview);
            setEstimatedOutputSizeBytes(nextPreview.outputSizeBytes);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : "Compressed preview failed to load.";
            setAfterPreviewError(message);
            setEstimatedOutputSizeBytes(undefined);
            setEstimateError(message);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setEstimating(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeMode, outputFormat, quality, selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      setEstimatedOutputSizeBytes(undefined);
      setEstimateError("");
      setEstimating(false);
      return;
    }

    if (activeMode !== "Convert") {
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setEstimatedOutputSizeBytes(undefined);
      setEstimateError("Unavailable outside Electron");
      setEstimating(false);
      return;
    }

    const job: ImageJob = {
      id: selectedFile.id,
      inputPath: selectedFile.inputPath,
      outputFormat,
      quality: outputFormat === "png" ? undefined : quality
    };

    let cancelled = false;
    setEstimating(true);
    setEstimateError("");

    const timer = window.setTimeout(() => {
      desktopApi.estimateJob(job)
        .then((estimate) => {
          if (!cancelled) {
            setEstimatedOutputSizeBytes(estimate.outputSizeBytes);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setEstimatedOutputSizeBytes(undefined);
            setEstimateError(error instanceof Error ? error.message : "Estimate failed");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setEstimating(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeMode, outputFormat, quality, selectedFile]);

  useEffect(() => {
    if (
      activeMode !== "Crop" ||
      dragState ||
      selectedCropLeft === undefined ||
      selectedCropTop === undefined ||
      selectedCropWidth === undefined ||
      selectedCropHeight === undefined ||
      !preview ||
      !imageRef.current
    ) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const nextDraftCrop = {
      left: (selectedCropLeft / preview.width) * rect.width,
      top: (selectedCropTop / preview.height) * rect.height,
      width: (selectedCropWidth / preview.width) * rect.width,
      height: (selectedCropHeight / preview.height) * rect.height
    };

    setDraftCrop((current) => {
      if (
        current &&
        Math.abs(current.left - nextDraftCrop.left) < 1 &&
        Math.abs(current.top - nextDraftCrop.top) < 1 &&
        Math.abs(current.width - nextDraftCrop.width) < 1 &&
        Math.abs(current.height - nextDraftCrop.height) < 1
      ) {
        return current;
      }

      return nextDraftCrop;
    });
  }, [activeMode, dragState, preview, selectedCropHeight, selectedCropLeft, selectedCropTop, selectedCropWidth]);

  useEffect(() => {
    if (!dragState || !preview || !imageRef.current) {
      return;
    }

    const getLocalPointForEffect = (clientX: number, clientY: number) => {
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) {
        return null;
      }

      return {
        rect,
        x: clamp(clientX - rect.left, 0, rect.width),
        y: clamp(clientY - rect.top, 0, rect.height)
      };
    };

    const getCropBoxFromPointerForEffect = (state: DragState, clientX: number, clientY: number) => {
      const local = getLocalPointForEffect(clientX, clientY);
      if (!local) {
        return null;
      }

      if (state.mode === "create") {
        return toCropBox(state.originX, state.originY, local.x, local.y, local.rect.width, local.rect.height, aspectRatio);
      }

      if (state.mode === "move" && state.startCrop) {
        return moveCropBox(state.startCrop, local.x - state.originX, local.y - state.originY, local.rect.width, local.rect.height);
      }

      if (state.mode === "resize" && state.startCrop && state.handle) {
        return resizeCropBox(state.startCrop, state.handle, local.x, local.y, local.rect.width, local.rect.height, aspectRatio);
      }

      return null;
    };

    const persistCropBoxForEffect = (cropBox: CropBox) => {
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height || !selectedFileId) {
        return;
      }

      const crop = {
        left: Math.round((cropBox.left / rect.width) * preview.width),
        top: Math.round((cropBox.top / rect.height) * preview.height),
        width: Math.round((cropBox.width / rect.width) * preview.width),
        height: Math.round((cropBox.height / rect.height) * preview.height)
      };

      setFiles((current) => current.map((file) => (file.id === selectedFileId ? { ...file, crop } : file)));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }

      const nextCrop = getCropBoxFromPointerForEffect(dragState, event.clientX, event.clientY);
      if (nextCrop) {
        setDraftCrop(nextCrop);
      }
    };

    const finishPointer = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }

      const nextCrop = getCropBoxFromPointerForEffect(dragState, event.clientX, event.clientY) ?? draftCrop;
      setDragState(null);

      if (!nextCrop || nextCrop.width < 8 || nextCrop.height < 8) {
        setDraftCrop(null);
        if (selectedFileId) {
          setFiles((current) => current.map((file) => (file.id === selectedFileId ? { ...file, crop: undefined } : file)));
        }
        return;
      }

      setDraftCrop(nextCrop);
      persistCropBoxForEffect(nextCrop);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishPointer);
    window.addEventListener("pointercancel", finishPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointer);
      window.removeEventListener("pointercancel", finishPointer);
    };
  }, [aspectRatio, dragState, draftCrop, preview, selectedFileId]);

  function updateSelectedCrop(crop: CropRect | undefined) {
    if (!selectedFileId) {
      return;
    }

    setFiles((current) => current.map((file) => (file.id === selectedFileId ? { ...file, crop } : file)));
  }

  function appendImportedFiles(importedFiles: ImportedImageFile[]) {
    if (importedFiles.length === 0) {
      return;
    }

    let nextSelectedId: string | null = null;
    setFiles((current) => {
      const existing = new Set(current.map((file) => file.inputPath.toLowerCase()));
      const additions = importedFiles
        .filter((file) => !existing.has(file.inputPath.toLowerCase()))
        .map((file, index) => ({ ...file, id: buildId(index) }));

      nextSelectedId = current[0]?.id ?? additions[0]?.id ?? null;
      return additions.length > 0 ? [...current, ...additions] : current;
    });

    setSelectedFileId((current) => current ?? nextSelectedId);
    setResult(null);
    setActionError("");
  }

  async function importImages() {
    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setActionError("Desktop file picker is unavailable. Launch the EXE build.");
      return;
    }

    try {
      appendImportedFiles(await desktopApi.pickInputFiles());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Import failed.");
    }
  }

  async function chooseOutputDir() {
    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setActionError("Desktop folder picker is unavailable. Launch the EXE build.");
      return;
    }

    try {
      const nextDir = await desktopApi.pickOutputDir();
      if (nextDir) {
        setOutputDir(nextDir);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Choosing an output folder failed.");
    }
  }

  function buildJobsForMode(): ImageJob[] {
    if (effectiveMode === "Convert") {
      return files.map((file) => ({
        id: file.id,
        inputPath: file.inputPath,
        outputFormat,
        quality: outputFormat === "png" ? undefined : quality
      }));
    }

    if (effectiveMode === "Compress") {
      const compressFormat = outputFormat === "png" ? "jpeg" : outputFormat;
      return files.map((file) => ({
        id: file.id,
        inputPath: file.inputPath,
        outputFormat: compressFormat,
        quality
      }));
    }

    if (effectiveMode === "Crop") {
      return files.map((file) => ({
        id: file.id,
        inputPath: file.inputPath,
        outputFormat: getOutputFormatFromPath(file.inputPath),
        crop: file.crop
      }));
    }

    return files.map((file) => ({
      id: file.id,
      inputPath: file.inputPath,
      outputFormat: getOutputFormatFromPath(file.inputPath),
      resize: {
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fit: "inside"
      }
    }));
  }

  async function exportBatch() {
    if (files.length === 0 || !outputDir) {
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setActionError("Desktop processing bridge is unavailable. Launch the EXE build.");
      return;
    }

    if (effectiveMode === "Crop" && !files.some((file) => file.crop)) {
      setActionError("Draw a crop box before exporting in crop mode.");
      return;
    }

    if (effectiveMode === "Resize" && (!width && !height)) {
      setActionError("Resize mode requires a width or height.");
      return;
    }

    const payload: BatchProcessRequest = {
      outputDir,
      jobs: buildJobsForMode()
    };

    setBusy(true);
    setResult(null);
    setActionError("");

    try {
      const nextResult = await desktopApi.processBatch(payload);
      setResult(nextResult);
      const filesById = new Map(files.map((file) => [file.id, file]));

      setHistory((current) => [
        ...nextResult.results.map((item) => {
          const file = filesById.get(item.id);
          return {
            id: `${item.id}-${Date.now()}`,
            title: item.success ? `${file?.name ?? item.id} -> ${getHistoryLabel()}` : `${file?.name ?? item.id} failed`,
            detail: item.success ? `${formatBytes(file?.sizeBytes)} -> ${formatBytes(item.outputSizeBytes)}` : item.error?.message ?? "Unknown processing error.",
            mode: effectiveMode,
            success: item.success,
            timestamp: new Date().toLocaleString()
          };
        }),
        ...current
      ].slice(0, 24));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Batch processing failed.");
    } finally {
      setBusy(false);
    }
  }

  function getHistoryLabel() {
    if (effectiveMode === "Resize") {
      return `${width}x${height}`;
    }

    if (effectiveMode === "Crop") {
      return "CROP";
    }

    if (effectiveMode === "Compress") {
      return (outputFormat === "png" ? "JPEG" : outputFormat.toUpperCase());
    }

    return outputFormat.toUpperCase();
  }

  function clearFiles() {
    setFiles([]);
    setSelectedFileId(null);
    setPreview(null);
    setAfterPreview(null);
    setPreviewError("");
    setAfterPreviewError("");
    setDraftCrop(null);
    setResult(null);
    setActionError("");
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
    setResult(null);
    setAfterPreview(null);
    setAfterPreviewError("");
    if (selectedFileId === id) {
      setDraftCrop(null);
    }
  }

  function updateWidth(value: string) {
    const sanitized = value.replace(/[^\d]/g, "");
    setWidth(sanitized);

    if (lockRatio && preview && sanitized) {
      setHeight(String(Math.round((Number(sanitized) / preview.width) * preview.height)));
    }
  }

  function updateHeight(value: string) {
    const sanitized = value.replace(/[^\d]/g, "");
    setHeight(sanitized);

    if (lockRatio && preview && sanitized) {
      setWidth(String(Math.round((Number(sanitized) / preview.height) * preview.width)));
    }
  }

  function getLocalPoint(clientX: number, clientY: number) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) {
      return null;
    }

    return {
      rect,
      x: clamp(clientX - rect.left, 0, rect.width),
      y: clamp(clientY - rect.top, 0, rect.height)
    };
  }

  function capturePointer(event: React.PointerEvent<HTMLElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onStagePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!preview) {
      return;
    }

    capturePointer(event);
    const local = getLocalPoint(event.clientX, event.clientY);
    if (!local) {
      return;
    }

    setDragState({
      pointerId: event.pointerId,
      mode: "create",
      originX: local.x,
      originY: local.y
    });
    setDraftCrop({
      left: local.x,
      top: local.y,
      width: 0,
      height: 0
    });
  }

  function onCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!draftCrop) {
      return;
    }

    capturePointer(event);
    event.stopPropagation();
    const local = getLocalPoint(event.clientX, event.clientY);
    if (!local) {
      return;
    }

    setDragState({
      pointerId: event.pointerId,
      mode: "move",
      originX: local.x,
      originY: local.y,
      startCrop: draftCrop
    });
  }

  function onHandlePointerDown(handle: CropHandle, event: React.PointerEvent<HTMLButtonElement>) {
    if (!draftCrop) {
      return;
    }

    capturePointer(event);
    event.stopPropagation();
    const local = getLocalPoint(event.clientX, event.clientY);
    if (!local) {
      return;
    }

    setDragState({
      pointerId: event.pointerId,
      mode: "resize",
      originX: local.x,
      originY: local.y,
      startCrop: draftCrop,
      handle
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-6">
          <div className="mb-8 px-2">
            <div className="text-lg font-semibold">ImageFlow</div>
            <div className="text-xs text-slate-500">Desktop image tools</div>
          </div>
          <nav className="space-y-1">
            {TOOL_MODES.map((mode) => (
              <button
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${activeMode === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                key={mode}
                onClick={() => setActiveMode(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Bridge</div>
            <div className={`mt-2 text-sm font-medium ${desktopReady ? "text-emerald-600" : "text-rose-600"}`}>
              {desktopReady ? "Electron connected" : "Electron unavailable"}
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
              Launch the Windows EXE build for file dialogs and image processing.
            </div>
          </div>
        </aside>

        <main className="overflow-x-hidden p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{activeMode}</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Image processing workspace</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{getModeDescription(activeMode)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800" onClick={importImages} type="button">
                Import images
              </button>
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={chooseOutputDir} type="button">
                Choose folder
              </button>
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || files.length === 0 || !outputDir}
                onClick={exportBatch}
                type="button"
              >
                {busy ? "Processing..." : "Export batch"}
              </button>
            </div>
          </div>

          {actionError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div> : null}

          {activeMode !== "Export" ? (
            <div className="grid grid-cols-[260px_minmax(0,1fr)_320px] gap-6">
              <FileListPanel files={files} onClear={clearFiles} onDropFiles={appendImportedFiles} onRemove={removeFile} onSelect={setSelectedFileId} selectedFileId={selectedFileId} />

              {activeMode === "Convert" ? (
                <ConvertSummaryPanel
                  estimatedOutputSizeBytes={estimatedOutputSizeBytes}
                  exportedOutputSizeBytes={selectedResult?.outputSizeBytes}
                  estimateError={estimateError}
                  estimating={estimating}
                  files={files}
                  selectedFile={selectedFile}
                  targetFormat={outputFormat.toUpperCase()}
                />
              ) : null}
              {activeMode === "Compress" ? (
                <CompressPreviewPanel
                  afterPreview={afterPreview}
                  afterPreviewError={afterPreviewError}
                  beforePreview={preview}
                  beforePreviewError={previewError}
                  estimatedOutputSizeBytes={estimatedOutputSizeBytes}
                  estimateError={estimateError}
                  estimating={estimating}
                  outputSizeBytes={selectedResult?.outputSizeBytes}
                  quality={quality}
                  sourceSizeBytes={selectedFile?.sizeBytes}
                />
              ) : null}
              {activeMode === "Crop" ? (
                <CropEditorPanel
                  draftCrop={draftCrop}
                  imageRef={imageRef}
                  onCropPointerDown={onCropPointerDown}
                  onHandlePointerDown={onHandlePointerDown}
                  onStagePointerDown={onStagePointerDown}
                  preview={preview}
                  previewError={previewError}
                  selectedFileName={selectedFile?.name}
                />
              ) : null}
              {activeMode === "Resize" ? (
                <ResizePreviewPanel
                  height={height}
                  preview={preview}
                  previewError={previewError}
                  sourceHeight={preview?.height}
                  sourceWidth={preview?.width}
                  width={width}
                />
              ) : null}

              <div className="space-y-4">
                {activeMode === "Convert" ? (
                  <>
                    <FormatCard outputFormat={outputFormat} onChange={setOutputFormat} />
                    {outputFormat !== "png" ? <QualityCard onChange={setQuality} quality={quality} /> : null}
                  </>
                ) : null}
                {activeMode === "Compress" ? (
                  <>
                    <QualityCard onChange={setQuality} quality={quality} />
                    <FormatCard options={COMPRESS_FORMAT_OPTIONS} outputFormat={outputFormat === "png" ? "jpeg" : outputFormat} onChange={setOutputFormat} title="Compression output" />
                  </>
                ) : null}
                {activeMode === "Crop" ? (
                  <>
                    <AspectRatioCard cropPreset={cropPreset} onChange={setCropPreset} />
                    <CropFieldsCard
                      crop={selectedFile?.crop}
                      onChange={(field, value) =>
                        updateSelectedCrop({
                          ...(selectedFile?.crop ?? { left: 0, top: 0, width: preview?.width ?? 0, height: preview?.height ?? 0 }),
                          [field]: Number(value.replace(/[^\d]/g, "")) || 0
                        })
                      }
                    />
                  </>
                ) : null}
                {activeMode === "Resize" ? (
                  <>
                    <ResizePresetCard
                      onApply={(nextWidth, nextHeight) => {
                        setWidth(String(nextWidth));
                        setHeight(String(nextHeight));
                      }}
                      presets={RESIZE_PRESETS}
                    />
                    <ResizeFieldsCard height={height} lockRatio={lockRatio} onHeightChange={updateHeight} onLockRatioChange={setLockRatio} onWidthChange={updateWidth} width={width} />
                  </>
                ) : null}
                <RunCard
                  busy={busy}
                  files={files.length}
                  onChooseFolder={chooseOutputDir}
                  onRun={exportBatch}
                  outputDir={outputDir}
                  secondaryAction={activeMode === "Crop" ? { label: "Clear crop", onClick: () => { setDraftCrop(null); updateSelectedCrop(undefined); } } : undefined}
                />
              </div>
            </div>
          ) : (
            <ExportHistoryPanel busy={busy} history={history} onChooseFolder={chooseOutputDir} onRun={exportBatch} outputDir={outputDir} ready={files.length > 0 && Boolean(outputDir)} result={result} />
          )}
        </main>
      </div>
    </div>
  );
}
