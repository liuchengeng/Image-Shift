"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BatchProcessRequest,
  BatchProcessResult,
  CropRect,
  ImageJob,
  ImageJobPreview,
  ImportedImageFile,
  LayoutReferenceAnalysis,
  OutputFormat,
  PreviewImage
} from "@/src/shared/types/image";
import { ExportHistoryPanel } from "@/components/home/ExportHistoryPanel";
import { FileListPanel } from "@/components/home/FileListPanel";
import { LanguageProvider, LanguageToggle, useLanguage } from "@/components/home/LanguageProvider";
import { localizeErrorMessage } from "@/components/home/i18n";
import {
  BackgroundRemovalPanel,
  CompressPreviewPanel,
  ConvertSummaryPanel,
  CropEditorPanel,
  LayoutMatchPreviewPanel,
  ResizePreviewPanel
} from "@/components/home/PreviewPanels";
import {
  AspectRatioCard,
  CropFieldsCard,
  FormatCard,
  LayoutAdjustmentCard,
  LayoutReferenceCard,
  QualityCard,
  ResizeFieldsCard,
  ResizePresetCard,
  RunCard
} from "@/components/home/SettingCards";
import {
  buildId,
  clamp,
  COMPRESS_FORMAT_OPTIONS,
  createDefaultLayoutAdjustment,
  formatBytes,
  getAspectRatioValue,
  getDesktopApi,
  getDroppedFiles,
  getModeLabel,
  getOutputFormatFromPath,
  moveCropBox,
  resizeCropBox,
  RESIZE_PRESETS,
  TRANSPARENT_FORMAT_OPTIONS,
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

function getUserErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function BrandMark() {
  return (
    <div aria-hidden="true" className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-neutral-950 text-white shadow-sm">
      <span className="absolute h-3.5 w-3.5 -translate-x-0.5 -translate-y-0.5 rounded-[3px] border border-white/45" />
      <span className="absolute h-3.5 w-3.5 translate-x-0.5 translate-y-0.5 rounded-[3px] border border-white" />
    </div>
  );
}

function ToolIcon({ mode }: { mode: ToolMode }) {
  const commonProps = {
    "aria-hidden": true,
    fill: "none",
    height: 15,
    viewBox: "0 0 24 24",
    width: 15
  } as const;

  if (mode === "Convert") {
    return <svg {...commonProps}><path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  }

  if (mode === "Compress") {
    return <svg {...commonProps}><path d="M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  }

  if (mode === "Remove BG") {
    return <svg {...commonProps}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z" stroke="currentColor" strokeWidth="1.6" /><path d="m7 16 3.3-3.3a1 1 0 0 1 1.4 0L14 15l1.2-1.2a1 1 0 0 1 1.4 0L18 15.2M8 8h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
  }

  if (mode === "Match Layout") {
    return <svg {...commonProps}><rect height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="13" x="3.5" y="3.5" /><path d="M9.5 7.5h10a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2h-10a1 1 0 0 1-1-1v-10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
  }

  if (mode === "Crop") {
    return <svg {...commonProps}><path d="M7 3v14h14M3 7h14v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  }

  if (mode === "Resize") {
    return <svg {...commonProps}><path d="M8 4H4v4m12-4h4v4M8 20H4v-4m12 4h4v-4M4 8l5-5m11 5-5-5M4 16l5 5m11-5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
  }

  return <svg {...commonProps}><path d="M6 3.5h12A1.5 1.5 0 0 1 19.5 5v15.5l-3-2-3 2-3-2-3 2-3-2V5A1.5 1.5 0 0 1 6 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /><path d="M8 8h8m-8 4h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></svg>;
}

type EmptyWorkspaceProps = {
  activeMode: WorkbenchMode;
  onAddImages: () => void;
  onDropFiles: (files: ImportedImageFile[]) => void;
  settings: React.ReactNode;
  exportControls: React.ReactNode;
};

function EmptyWorkspace({ activeMode, onAddImages, onDropFiles, settings, exportControls }: EmptyWorkspaceProps) {
  const { language, t } = useLanguage();

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_288px] gap-3 p-3">
      <section
        className="ui-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onDropFiles(getDroppedFiles(event));
        }}
      >
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-3">
          <h1 className="ui-panel-title">{t("queue.title")}</h1>
          <span className="text-xs text-neutral-500">JPG · PNG · WEBP</span>
        </div>
        <div className="empty-workspace-stage flex min-h-0 flex-1 items-center justify-center p-6 text-center">
          <div className="rounded-xl border border-neutral-200 bg-white/95 px-8 py-7 shadow-sm backdrop-blur-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700">
              <svg aria-hidden="true" fill="none" height="19" viewBox="0 0 24 24" width="19">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-neutral-900">{t("queue.dropHint")}</div>
            <button className="ui-button-primary mt-4 px-4" onClick={onAddImages} type="button">
              {t("common.addImages")}
            </button>
          </div>
        </div>
      </section>

      <aside className="settings-rail ui-panel h-full min-h-0 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-neutral-200 px-3">
            <ToolIcon mode={activeMode} />
            <div className="ui-panel-title">{getModeLabel(activeMode, language)}</div>
          </div>
          {settings}
          {exportControls}
        </div>
      </aside>
    </div>
  );
}

export function ImageShiftDashboard() {
  return (
    <LanguageProvider>
      <ImageShiftDashboardContent />
    </LanguageProvider>
  );
}

function ImageShiftDashboardContent() {
  const { language, t } = useLanguage();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const referenceAnalysisCache = useRef(new Map<string, LayoutReferenceAnalysis>());
  const layoutPreviewWorkerBusyRef = useRef(false);
  const layoutPreviewPendingRef = useRef(false);
  const [activeMode, setActiveMode] = useState<ToolMode>("Convert");
  const [lastWorkbenchMode, setLastWorkbenchMode] = useState<WorkbenchMode>("Convert");
  const [files, setFiles] = useState<QueueFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const [afterPreview, setAfterPreview] = useState<ImageJobPreview | null>(null);
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
  const [cropPreviewSize, setCropPreviewSize] = useState({ width: 0, height: 0 });
  const [estimatedOutputSizeBytes, setEstimatedOutputSizeBytes] = useState<number | undefined>();
  const [estimateError, setEstimateError] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [referenceFile, setReferenceFile] = useState<ImportedImageFile | null>(null);
  const [referenceAnalysis, setReferenceAnalysis] = useState<LayoutReferenceAnalysis | null>(null);
  const [referencePreview, setReferencePreview] = useState<PreviewImage | null>(null);
  const [referenceError, setReferenceError] = useState("");
  const [referenceAnalyzing, setReferenceAnalyzing] = useState(false);
  const [layoutPreviewWorkerBusy, setLayoutPreviewWorkerBusy] = useState(false);
  const [layoutPreviewRetryRevision, setLayoutPreviewRetryRevision] = useState(0);

  const selectedFile = useMemo(() => files.find((file) => file.id === selectedFileId) ?? null, [files, selectedFileId]);
  const selectedInputPath = selectedFile?.inputPath;
  const selectedCrop = selectedFile?.crop;
  const selectedCropLeft = selectedCrop?.left;
  const selectedCropTop = selectedCrop?.top;
  const selectedCropWidth = selectedCrop?.width;
  const selectedCropHeight = selectedCrop?.height;
  const selectedLayoutAdjustment = selectedFile?.layoutAdjustment ?? createDefaultLayoutAdjustment();
  const resultsById = useMemo(() => new Map(result?.results.map((item) => [item.id, item]) ?? []), [result]);
  const selectedResult = selectedFile ? resultsById.get(selectedFile.id) : undefined;
  const effectiveMode: WorkbenchMode = activeMode === "Export" ? lastWorkbenchMode : activeMode;
  const aspectRatio = getAspectRatioValue(cropPreset);
  const validLayoutFiles = useMemo(
    () => files.filter((file) => !file.layoutError),
    [files]
  );
  const layoutReadyFileCount = referenceAnalysis ? validLayoutFiles.length : 0;
  const runnableFileCount = effectiveMode === "Match Layout" ? layoutReadyFileCount : files.length;
  const layoutOperationBusy = effectiveMode === "Match Layout" && (referenceAnalyzing || layoutPreviewWorkerBusy);
  const handleCropPreviewSizeChange = useCallback((width: number, height: number) => {
    setCropPreviewSize((current) => current.width === width && current.height === height ? current : { width, height });
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
    if (activeMode === "Remove BG" && outputFormat === "jpeg") {
      setOutputFormat("png");
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
    const needsPreview = activeMode === "Convert" || activeMode === "Compress" || activeMode === "Remove BG" || activeMode === "Match Layout" || activeMode === "Crop" || activeMode === "Resize";

    if (!needsPreview || !selectedInputPath) {
      setPreview(null);
      setPreviewError("");
      setDraftCrop(null);
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setPreviewError("Desktop processing is unavailable. Run the installed app.");
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
          setPreviewError(getUserErrorMessage(error, "Failed to load the preview."));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeMode, selectedInputPath]);

  useEffect(() => {
    const supportedMode = activeMode === "Compress" || activeMode === "Remove BG" || activeMode === "Match Layout";
    if (!supportedMode || !selectedFile) {
      setAfterPreview(null);
      setAfterPreviewError("");
      return;
    }

    const isLayoutMatch = activeMode === "Match Layout";
    if (isLayoutMatch && !referenceAnalysis) {
      setAfterPreview(null);
      setAfterPreviewError(referenceError || "Choose a reference image first.");
      setEstimating(false);
      return;
    }

    if (isLayoutMatch && selectedFile.layoutError) {
      setAfterPreview(null);
      setAfterPreviewError(selectedFile.layoutError);
      setEstimating(false);
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setAfterPreviewError("Desktop processing is unavailable. Run the installed app.");
      return;
    }

    const isBackgroundRemoval = activeMode === "Remove BG";
    const targetFormat = isLayoutMatch
      ? getOutputFormatFromPath(selectedFile.inputPath)
      : isBackgroundRemoval
        ? (outputFormat === "jpeg" ? "png" : outputFormat)
        : (outputFormat === "png" ? "jpeg" : outputFormat);
    const job: ImageJob = {
      id: selectedFile.id,
      inputPath: selectedFile.inputPath,
      outputFormat: targetFormat,
      quality: isBackgroundRemoval || targetFormat === "png" ? undefined : isLayoutMatch ? 95 : quality,
      removeBackground: isBackgroundRemoval,
      layoutMatch: isLayoutMatch && referenceAnalysis
        ? { reference: referenceAnalysis, adjustment: selectedFile.layoutAdjustment }
        : undefined
    };

    let cancelled = false;
    setAfterPreview(null);
    setAfterPreviewError("");
    setEstimating(true);
    setEstimateError("");

    const timer = window.setTimeout(() => {
      if (isLayoutMatch) {
        if (layoutPreviewWorkerBusyRef.current) {
          layoutPreviewPendingRef.current = true;
          return;
        }

        layoutPreviewWorkerBusyRef.current = true;
        setLayoutPreviewWorkerBusy(true);
      }

      desktopApi.previewJob(job)
        .then((nextPreview) => {
          if (!cancelled) {
            setAfterPreview(nextPreview);
            setEstimatedOutputSizeBytes(nextPreview.outputSizeBytes);
            if (isLayoutMatch) {
              setFiles((current) => current.map((file) => file.id === selectedFile.id && file.layoutError ? { ...file, layoutError: undefined } : file));
            }
          }
        })
        .catch((error) => {
          if (!cancelled) {
            const message = getUserErrorMessage(
              error,
              isLayoutMatch
                ? "Unable to reliably detect and match the subject."
                : isBackgroundRemoval
                  ? "AI background removal failed."
                  : "Failed to load the compressed preview."
            );
            setAfterPreviewError(message);
            setEstimatedOutputSizeBytes(undefined);
            setEstimateError(message);
            if (isLayoutMatch) {
              setFiles((current) => current.map((file) => file.id === selectedFile.id ? { ...file, layoutError: message } : file));
            }
          }
        })
        .finally(() => {
          if (isLayoutMatch) {
            layoutPreviewWorkerBusyRef.current = false;
            setLayoutPreviewWorkerBusy(false);
            setEstimating(false);
            if (layoutPreviewPendingRef.current) {
              layoutPreviewPendingRef.current = false;
              setLayoutPreviewRetryRevision((current) => current + 1);
            }
          }

          if (!isLayoutMatch && !cancelled) {
            setEstimating(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeMode, layoutPreviewRetryRevision, outputFormat, quality, referenceAnalysis, referenceError, selectedFile]);

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
      setEstimateError("The current environment is unavailable.");
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
            setEstimateError(getUserErrorMessage(error, "Failed to estimate output size."));
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
  }, [activeMode, cropPreviewSize.height, cropPreviewSize.width, dragState, preview, selectedCropHeight, selectedCropLeft, selectedCropTop, selectedCropWidth]);

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
        .map((file, index) => ({ ...file, id: buildId(index), layoutAdjustment: createDefaultLayoutAdjustment() }));

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
      setActionError("The file picker is unavailable. Run the installed app.");
      return;
    }

    try {
      appendImportedFiles(await desktopApi.pickInputFiles());
    } catch (error) {
      setActionError(getUserErrorMessage(error, "Failed to import images."));
    }
  }

  async function chooseReferenceFile() {
    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setReferenceError("The reference image picker is unavailable. Run the installed app.");
      return;
    }

    try {
      const picked = await desktopApi.pickReferenceFile();
      if (!picked) {
        return;
      }

      setReferenceFile(picked);
      setReferenceAnalysis(null);
      setReferencePreview(null);
      setReferenceError("");
      setReferenceAnalyzing(true);
      setAfterPreview(null);
      setAfterPreviewError("");
      setFiles((current) => current.map((file) => file.layoutError ? { ...file, layoutError: undefined } : file));

      const cached = referenceAnalysisCache.current.get(picked.inputPath);
      const [analysis, loadedPreview] = await Promise.all([
        cached ? Promise.resolve(cached) : desktopApi.analyzeLayoutReference(picked.inputPath),
        desktopApi.loadPreview(picked.inputPath)
      ]);

      referenceAnalysisCache.current.set(picked.inputPath, analysis);
      setReferenceAnalysis(analysis);
      setReferencePreview(loadedPreview);
    } catch (error) {
      setReferenceAnalysis(null);
      setReferencePreview(null);
      setReferenceError(getUserErrorMessage(error, "Failed to analyze the reference image."));
    } finally {
      setReferenceAnalyzing(false);
    }
  }

  function updateSelectedLayoutAdjustment(next: QueueFile["layoutAdjustment"]) {
    if (!selectedFileId) {
      return;
    }

    setFiles((current) => current.map((file) => file.id === selectedFileId
      ? {
          ...file,
          layoutAdjustment: next,
          layoutError: undefined
        }
      : file));
  }

  async function chooseOutputDir() {
    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setActionError("The folder picker is unavailable. Run the installed app.");
      return;
    }

    try {
      const nextDir = await desktopApi.pickOutputDir();
      if (nextDir) {
        setOutputDir(nextDir);
      }
    } catch (error) {
      setActionError(getUserErrorMessage(error, "Failed to choose the output folder."));
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

    if (effectiveMode === "Remove BG") {
      const transparentFormat = outputFormat === "jpeg" ? "png" : outputFormat;
      return files.map((file) => ({
        id: file.id,
        inputPath: file.inputPath,
        outputFormat: transparentFormat,
        removeBackground: true
      }));
    }

    if (effectiveMode === "Match Layout") {
      if (!referenceAnalysis) {
        return [];
      }

      return validLayoutFiles.map((file) => {
        const targetFormat = getOutputFormatFromPath(file.inputPath);
        return {
          id: file.id,
          inputPath: file.inputPath,
          outputFormat: targetFormat,
          quality: targetFormat === "png" ? undefined : 95,
          layoutMatch: {
            reference: referenceAnalysis,
            adjustment: file.layoutAdjustment
          }
        };
      });
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
      setActionError("Image processing is unavailable. Run the installed app.");
      return;
    }

    if (effectiveMode === "Crop" && !files.some((file) => file.crop)) {
      setActionError("Draw a crop area before exporting.");
      return;
    }

    if (effectiveMode === "Resize" && (!width && !height)) {
      setActionError("Enter at least a width or height.");
      return;
    }

    if (effectiveMode === "Match Layout") {
      if (!referenceAnalysis) {
        setActionError("Choose a valid reference image first.");
        return;
      }

      if (referenceAnalyzing || layoutPreviewWorkerBusy) {
        setActionError("Wait for layout analysis or preview to finish before exporting.");
        return;
      }

      if (validLayoutFiles.length === 0) {
        setActionError("There are no target images to export. Reset or replace failed images.");
        return;
      }
    }

    const payload: BatchProcessRequest = {
      outputDir,
      jobs: buildJobsForMode()
    };

    setBusy(true);
    setResult(null);
    setActionError("");

    try {
      const rawResult = await desktopApi.processBatch(payload);
      const nextResult = rawResult;
      setResult(nextResult);
      const filesById = new Map(files.map((file) => [file.id, file]));

      if (effectiveMode === "Match Layout") {
        const layoutResults = new Map(nextResult.results.map((item) => [item.id, item]));
        setFiles((current) => current.map((file) => {
          const item = layoutResults.get(file.id);
          if (!item) {
            return file;
          }

          return item.success
            ? { ...file, layoutError: undefined }
            : { ...file, layoutError: item.error?.message ?? "Layout matching failed." };
        }));
      }

      setHistory((current) => [
        ...nextResult.results.map((item) => {
          const file = filesById.get(item.id);
          return {
            id: `${item.id}-${Date.now()}`,
            fileName: file?.name ?? item.id,
            detail: item.success ? `${formatBytes(file?.sizeBytes)} → ${formatBytes(item.outputSizeBytes)}` : item.error?.message ?? "Unknown processing error.",
            summary: getHistorySummary(),
            mode: effectiveMode,
            success: item.success,
            timestamp: Date.now()
          };
        }),
        ...current
      ].slice(0, 24));
    } catch (error) {
      setActionError(getUserErrorMessage(error, "Batch processing failed."));
    } finally {
      setBusy(false);
    }
  }

  function getHistorySummary(): HistoryItem["summary"] {
    if (effectiveMode === "Resize") {
      return { kind: "resize", width: width || undefined, height: height || undefined };
    }

    if (effectiveMode === "Crop") {
      return { kind: "crop" };
    }

    if (effectiveMode === "Match Layout") {
      return { kind: "layout" };
    }

    if (effectiveMode === "Compress") {
      return { kind: "format", format: (outputFormat === "png" ? "jpeg" : outputFormat).toUpperCase() };
    }

    if (effectiveMode === "Remove BG") {
      return { kind: "format", format: (outputFormat === "jpeg" ? "png" : outputFormat).toUpperCase() };
    }

    return { kind: "format", format: outputFormat.toUpperCase() };
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

  const activeSettings = (
    <>
      {activeMode === "Convert" ? (
        <>
          <FormatCard outputFormat={outputFormat} onChange={setOutputFormat} />
          {outputFormat !== "png" ? <QualityCard onChange={setQuality} quality={quality} /> : null}
        </>
      ) : null}
      {activeMode === "Compress" ? (
        <>
          <QualityCard onChange={setQuality} quality={quality} />
          <FormatCard options={COMPRESS_FORMAT_OPTIONS} outputFormat={outputFormat === "png" ? "jpeg" : outputFormat} onChange={setOutputFormat} title={t("format.compressionTitle")} />
        </>
      ) : null}
      {activeMode === "Remove BG" ? (
        <FormatCard
          options={TRANSPARENT_FORMAT_OPTIONS}
          outputFormat={outputFormat === "jpeg" ? "png" : outputFormat}
          onChange={setOutputFormat}
          title={t("format.transparentTitle")}
        />
      ) : null}
      {activeMode === "Match Layout" ? (
        <>
          <LayoutReferenceCard
            analysis={referenceAnalysis}
            analyzing={referenceAnalyzing}
            error={referenceError}
            onChoose={chooseReferenceFile}
            referenceFile={referenceFile}
          />
          <LayoutAdjustmentCard
            adjustment={selectedLayoutAdjustment}
            disabled={!selectedFile || !referenceAnalysis || layoutPreviewWorkerBusy}
            onChange={updateSelectedLayoutAdjustment}
            onReset={() => updateSelectedLayoutAdjustment(createDefaultLayoutAdjustment())}
          />
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
    </>
  );

  const exportControls = (
    <RunCard
      busy={busy || layoutOperationBusy}
      files={activeMode === "Match Layout" ? layoutReadyFileCount : files.length}
      onChooseFolder={chooseOutputDir}
      onRun={exportBatch}
      outputDir={outputDir}
      secondaryAction={activeMode === "Crop" ? { label: t("crop.clear"), onClick: () => { setDraftCrop(null); updateSelectedCrop(undefined); } } : undefined}
    />
  );

  return (
    <div className="h-screen overflow-hidden bg-[var(--ui-canvas)] text-neutral-900">
      <header className="flex h-[52px] items-center gap-2 border-b border-neutral-200 bg-white px-3">
        <div className="flex shrink-0 items-center gap-2 pr-1">
          <BrandMark />
          <div className="text-[15px] font-semibold tracking-[-0.02em]">Image-Shift</div>
        </div>
        <div aria-hidden="true" className="mx-1 h-5 w-px bg-neutral-200" />
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto" aria-label={t("nav.toolsAria")}>
          {TOOL_MODES.map((mode) => (
            <button
              aria-current={activeMode === mode ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[13px] transition ${activeMode === mode ? "border-neutral-200 bg-neutral-100 font-medium text-neutral-950 shadow-sm" : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"}`}
              data-testid={`tool-${mode.toLowerCase().replaceAll(" ", "-")}`}
              key={mode}
              onClick={() => setActiveMode(mode)}
              type="button"
            >
              <ToolIcon mode={mode} />
              {getModeLabel(mode, language)}
            </button>
          ))}
        </nav>
        <LanguageToggle />
        <button className="ui-button-primary flex shrink-0 items-center gap-1.5 px-3" onClick={importImages} type="button">
          <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>
          {t("common.addImages")}
        </button>
      </header>

      <main className="flex h-[calc(100vh-52px)] min-h-0 flex-col overflow-hidden">
        {actionError ? <div className="mx-3 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{localizeErrorMessage(actionError, language)}</div> : null}

        {activeMode !== "Export" ? (
          files.length === 0 ? (
            <EmptyWorkspace
              activeMode={activeMode}
              exportControls={exportControls}
              onAddImages={importImages}
              onDropFiles={appendImportedFiles}
              settings={activeSettings}
            />
          ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[216px_minmax(0,1fr)_288px] items-stretch gap-3 p-3">
            <div className="min-h-0 self-stretch overflow-hidden">
              <FileListPanel
                files={files}
                onClear={clearFiles}
                onDropFiles={appendImportedFiles}
                onRemove={removeFile}
                onSelect={setSelectedFileId}
                selectedFileId={selectedFileId}
                showLayoutStatus={activeMode === "Match Layout"}
              />
            </div>

            <section className="h-full min-h-0 min-w-0 self-stretch">
              {activeMode === "Convert" ? (
                <ConvertSummaryPanel
                  estimatedOutputSizeBytes={estimatedOutputSizeBytes}
                  exportedOutputSizeBytes={selectedResult?.outputSizeBytes}
                  estimateError={estimateError}
                  estimating={estimating}
                  files={files}
                  onAddImages={importImages}
                  preview={preview}
                  previewError={previewError}
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
              {activeMode === "Remove BG" ? (
                <BackgroundRemovalPanel
                  afterPreview={afterPreview}
                  afterPreviewError={afterPreviewError}
                  beforePreview={preview}
                  beforePreviewError={previewError}
                  estimating={estimating}
                />
              ) : null}
              {activeMode === "Match Layout" ? (
                <LayoutMatchPreviewPanel
                  matchedError={afterPreviewError}
                  matchedPreview={afterPreview}
                  processing={referenceAnalyzing || layoutPreviewWorkerBusy || estimating}
                  referenceError={referenceError}
                  referenceName={referenceFile?.name}
                  referencePreview={referencePreview}
                  referenceTransparent={referenceAnalysis?.background.mode === "transparent"}
                  result={afterPreview?.layoutMatch}
                  targetName={selectedFile?.name}
                />
              ) : null}
              {activeMode === "Crop" ? (
                <CropEditorPanel
                  draftCrop={draftCrop}
                  imageRef={imageRef}
                  onCropPointerDown={onCropPointerDown}
                   onHandlePointerDown={onHandlePointerDown}
                   onRenderedSizeChange={handleCropPreviewSizeChange}
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
            </section>

            <aside className="settings-rail ui-panel h-full min-h-0 self-stretch overflow-y-auto">
              <div className="flex min-h-full flex-col">
                {activeSettings}
                {exportControls}
              </div>
            </aside>
          </div>
          )
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ExportHistoryPanel busy={busy || layoutOperationBusy} history={history} onChooseFolder={chooseOutputDir} onRun={exportBatch} outputDir={outputDir} ready={runnableFileCount > 0 && Boolean(outputDir) && !layoutOperationBusy} result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
