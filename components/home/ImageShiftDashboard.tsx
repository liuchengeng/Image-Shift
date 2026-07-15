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

const USER_ERROR_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["Background removal task is invalid.", "抠图任务无效。"],
  ["AI background removal failed.", "智能抠图失败。"],
  ["Unable to read image dimensions for cropping.", "无法读取图片尺寸，不能裁剪。"],
  ["Crop region is outside the image bounds.", "裁剪区域超出了图片范围。"],
  ["Crop values must be integers.", "裁剪参数必须是整数。"],
  ["Crop bounds must be non-negative and dimensions must be > 0.", "裁剪位置不能为负数，宽高必须大于 0。"],
  ["Failed to read image size.", "无法读取图片尺寸。"],
  ["Failed to read preview image size.", "无法读取预览图片尺寸。"],
  ["Image worker task is invalid.", "图片处理任务无效。"],
  ["A reference image path is required.", "缺少参考图路径。"],
  ["Unknown image worker task.", "未知的图片处理任务。"],
  ["Image worker failed.", "图片处理失败。"],
  ["The transparent image does not have a distinct subject boundary.", "透明图片没有清晰的主体边界。"],
  ["No subject could be distinguished from the background.", "无法从背景中识别主体。"],
  ["The subject does not have a stable edge against the sampled background.", "主体与背景之间没有稳定边界。"],
  ["The detected subject fills the canvas and cannot be aligned reliably.", "主体铺满画布，无法可靠对齐。"],
  ["The subject boundary confidence is too low.", "主体边界识别置信度过低。"],
  ["Failed to read image size for layout matching.", "无法读取用于版式匹配的图片尺寸。"],
  ["No recognizable subject was found.", "未找到可识别的主体。"],
  ["The local AI model could not identify a reliable subject boundary.", "本地 AI 无法识别可靠的主体边界。"],
  ["Layout reference analysis is missing.", "缺少参考图分析结果。"],
  ["Layout reference analysis is invalid.", "参考图分析结果无效。"],
  ["Layout reference subject bounds are outside the canvas.", "参考图主体范围超出了画布。"],
  ["Layout adjustment is invalid.", "版式微调参数无效。"],
  ["Failed to read target image size for layout matching.", "无法读取目标图尺寸。"],
  ["The calculated layout scale is outside the supported range.", "计算出的缩放比例超出支持范围。"],
  ["The adjusted subject is outside the output canvas.", "调整后的主体超出了输出画布。"],
  ["This file format is not supported for preview.", "该文件格式不支持预览。"],
  ["This file format is not supported for layout matching.", "该文件格式不支持版式匹配。"],
  ["No jobs to process.", "没有可处理的任务。"],
  ["Output folder is required.", "请选择输出文件夹。"],
  ["Processing failed.", "处理失败。"],
  ["Job id is required.", "缺少任务编号。"],
  ["Input path is required.", "缺少输入文件路径。"],
  ["Output format must be jpeg, png, or webp.", "输出格式必须是 JPG、PNG 或 WEBP。"],
  ["Quality must be an integer from 1 to 100.", "质量必须是 1 到 100 之间的整数。"],
  ["Background removal output must be PNG or WEBP.", "智能抠图只能输出 PNG 或 WEBP。"],
  ["Resize width/height must be positive integers when provided.", "输出宽高必须是正整数。"],
  ["Output directory is required.", "请选择输出文件夹。"],
  ["At least one job is required.", "请至少添加一个处理任务。"]
];

function localizeErrorMessage(message: string) {
  return USER_ERROR_REPLACEMENTS.reduce(
    (localized, [source, target]) => localized.split(source).join(target),
    message
  );
}

function getUserErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? localizeErrorMessage(error.message) : fallback;
}

export function ImageShiftDashboard() {
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
    const needsPreview = activeMode === "Compress" || activeMode === "Remove BG" || activeMode === "Match Layout" || activeMode === "Crop" || activeMode === "Resize";

    if (!needsPreview || !selectedInputPath) {
      setPreview(null);
      setPreviewError("");
      setDraftCrop(null);
      return;
    }

    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setPreviewError("桌面处理服务不可用，请运行安装后的应用。");
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
          setPreviewError(getUserErrorMessage(error, "预览加载失败。"));
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
      setAfterPreviewError(referenceError || "请先选择参考图。");
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
      setAfterPreviewError("桌面处理服务不可用，请运行安装后的应用。");
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
                ? "无法可靠识别并匹配主体。"
                : isBackgroundRemoval
                  ? "智能抠图失败。"
                  : "压缩预览加载失败。"
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
      setEstimateError("当前环境不可用");
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
            setEstimateError(getUserErrorMessage(error, "大小估算失败。"));
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
      setActionError("文件选择器不可用，请运行安装后的应用。");
      return;
    }

    try {
      appendImportedFiles(await desktopApi.pickInputFiles());
    } catch (error) {
      setActionError(getUserErrorMessage(error, "图片导入失败。"));
    }
  }

  async function chooseReferenceFile() {
    const desktopApi = getDesktopApi();
    if (!desktopApi) {
      setReferenceError("参考图选择器不可用，请运行安装后的应用。");
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
      setReferenceError(getUserErrorMessage(error, "参考图分析失败。"));
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
      setActionError("文件夹选择器不可用，请运行安装后的应用。");
      return;
    }

    try {
      const nextDir = await desktopApi.pickOutputDir();
      if (nextDir) {
        setOutputDir(nextDir);
      }
    } catch (error) {
      setActionError(getUserErrorMessage(error, "输出文件夹选择失败。"));
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
      setActionError("图片处理服务不可用，请运行安装后的应用。");
      return;
    }

    if (effectiveMode === "Crop" && !files.some((file) => file.crop)) {
      setActionError("请先绘制裁剪区域再导出。");
      return;
    }

    if (effectiveMode === "Resize" && (!width && !height)) {
      setActionError("请至少填写宽度或高度。");
      return;
    }

    if (effectiveMode === "Match Layout") {
      if (!referenceAnalysis) {
        setActionError("请先选择有效的参考图。");
        return;
      }

      if (referenceAnalyzing || layoutPreviewWorkerBusy) {
        setActionError("请等待版式分析或预览完成后再导出。");
        return;
      }

      if (validLayoutFiles.length === 0) {
        setActionError("没有可导出的目标图，请重置或替换处理失败的图片。");
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
      const nextResult: BatchProcessResult = {
        ...rawResult,
        results: rawResult.results.map((item) => item.error
          ? { ...item, error: { ...item.error, message: localizeErrorMessage(item.error.message) } }
          : item)
      };
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
            : { ...file, layoutError: item.error?.message ?? "版式匹配失败。" };
        }));
      }

      setHistory((current) => [
        ...nextResult.results.map((item) => {
          const file = filesById.get(item.id);
          return {
            id: `${item.id}-${Date.now()}`,
            title: item.success ? `${file?.name ?? item.id} → ${getHistoryLabel()}` : `${file?.name ?? item.id} 导出失败`,
            detail: item.success ? `${formatBytes(file?.sizeBytes)} → ${formatBytes(item.outputSizeBytes)}` : item.error?.message ?? "未知处理错误。",
            mode: effectiveMode,
            success: item.success,
            timestamp: new Date().toLocaleString()
          };
        }),
        ...current
      ].slice(0, 24));
    } catch (error) {
      setActionError(getUserErrorMessage(error, "批量处理失败。"));
    } finally {
      setBusy(false);
    }
  }

  function getHistoryLabel() {
    if (effectiveMode === "Resize") {
      return `${width || "自动"} × ${height || "自动"}`;
    }

    if (effectiveMode === "Crop") {
      return "已裁剪";
    }

    if (effectiveMode === "Compress") {
      return (outputFormat === "png" ? "JPEG" : outputFormat.toUpperCase());
    }

    if (effectiveMode === "Remove BG") {
      return (outputFormat === "jpeg" ? "PNG" : outputFormat.toUpperCase());
    }

    if (effectiveMode === "Match Layout") {
      return "已匹配";
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
    <div className="h-screen overflow-hidden bg-[#f6f7fb] text-slate-900">
      <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4">
        <div className="shrink-0 text-base font-semibold tracking-tight">Image-Shift</div>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="图片处理工具">
          {TOOL_MODES.map((mode) => (
            <button
              aria-current={activeMode === mode ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${activeMode === mode ? "bg-slate-900 font-medium text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              key={mode}
              onClick={() => setActiveMode(mode)}
              type="button"
            >
              {getModeLabel(mode)}
            </button>
          ))}
        </nav>
        <button className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" onClick={importImages} type="button">
          添加图片
        </button>
      </header>

      <main className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden">
        {actionError ? <div className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</div> : null}

        {activeMode !== "Export" ? (
          <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)_280px] items-start gap-4 p-4">
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

            <section className="min-w-0 self-start">
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

            <aside className="min-h-0 self-stretch overflow-y-auto pr-1">
              <div className="space-y-3">
                {activeMode === "Convert" ? (
                  <>
                    <FormatCard outputFormat={outputFormat} onChange={setOutputFormat} />
                    {outputFormat !== "png" ? <QualityCard onChange={setQuality} quality={quality} /> : null}
                  </>
                ) : null}
                {activeMode === "Compress" ? (
                  <>
                    <QualityCard onChange={setQuality} quality={quality} />
                    <FormatCard options={COMPRESS_FORMAT_OPTIONS} outputFormat={outputFormat === "png" ? "jpeg" : outputFormat} onChange={setOutputFormat} title="压缩格式" />
                  </>
                ) : null}
                {activeMode === "Remove BG" ? (
                  <FormatCard
                    options={TRANSPARENT_FORMAT_OPTIONS}
                    outputFormat={outputFormat === "jpeg" ? "png" : outputFormat}
                    onChange={setOutputFormat}
                    title="透明图格式"
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
                <RunCard
                  busy={busy || layoutOperationBusy}
                  files={activeMode === "Match Layout" ? layoutReadyFileCount : files.length}
                  onChooseFolder={chooseOutputDir}
                  onRun={exportBatch}
                  outputDir={outputDir}
                  secondaryAction={activeMode === "Crop" ? { label: "清除裁剪", onClick: () => { setDraftCrop(null); updateSelectedCrop(undefined); } } : undefined}
                />
              </div>
            </aside>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <ExportHistoryPanel busy={busy || layoutOperationBusy} history={history} onChooseFolder={chooseOutputDir} onRun={exportBatch} outputDir={outputDir} ready={runnableFileCount > 0 && Boolean(outputDir) && !layoutOperationBusy} result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
