export type AppLanguage = "zh-CN" | "en-US";

export const DEFAULT_LANGUAGE: AppLanguage = "zh-CN";
export const LANGUAGE_STORAGE_KEY = "image-shift.language";

const zhCN = {
  "language.switchAria": "切换界面语言",
  "language.chinese": "中文",
  "language.english": "English",
  "nav.toolsAria": "图片处理工具",
  "common.addImages": "添加图片",
  "common.clear": "清空",
  "common.remove": "移除",
  "common.reset": "重置",
  "common.ready": "已就绪",
  "common.processing": "正在处理…",
  "common.loadingPreview": "正在载入预览…",
  "common.localProcessing": "本机处理",
  "common.automatic": "自动",
  "common.noPreview": "暂无预览。",
  "common.completed": "已完成",
  "common.failed": "失败",
  "common.successCount": "{count} 成功",
  "common.failureCount": "{count} 失败",
  "common.imageCount": "图片：{count} 张",
  "mode.convert.label": "格式转换",
  "mode.convert.description": "转换图片格式。",
  "mode.compress.label": "图片压缩",
  "mode.compress.description": "压缩体积并对比效果。",
  "mode.removeBackground.label": "智能抠图",
  "mode.removeBackground.description": "使用本地 AI 移除背景。",
  "mode.matchLayout.label": "版式匹配",
  "mode.matchLayout.description": "按参考图匹配主体位置与大小。",
  "mode.crop.label": "图片裁剪",
  "mode.crop.description": "裁剪并保留选中区域。",
  "mode.resize.label": "调整尺寸",
  "mode.resize.description": "按最大宽高等比缩放。",
  "mode.export.label": "导出记录",
  "mode.export.description": "查看本次会话的导出记录。",
  "queue.title": "文件队列",
  "queue.count": "{count} 张",
  "queue.dropHint": "拖入 JPG、PNG 或 WEBP",
  "format.outputTitle": "输出格式",
  "format.compressionTitle": "压缩格式",
  "format.transparentTitle": "透明图格式",
  "quality.title": "质量",
  "quality.ariaLabel": "质量",
  "reference.title": "参考图",
  "reference.method.alpha": "透明通道",
  "reference.method.edge": "边缘检测",
  "reference.method.ai": "AI",
  "reference.analysisSummary": "{width} × {height} px · {confidence}% · {method}",
  "reference.analyzingSubject": "正在识别主体…",
  "reference.noAnalysis": "暂无分析结果",
  "reference.notSelected": "未选择参考图",
  "reference.analyzing": "正在分析…",
  "reference.change": "更换参考图",
  "reference.select": "选择参考图",
  "adjustment.title": "单图微调",
  "adjustment.scale": "缩放",
  "adjustment.scaleSliderAria": "缩放滑块",
  "adjustment.scalePercentAria": "缩放百分比",
  "adjustment.offsetX": "X 偏移（px）",
  "adjustment.offsetY": "Y 偏移（px）",
  "export.title": "导出",
  "export.noFolder": "未选择导出文件夹",
  "export.chooseFolder": "选择文件夹",
  "export.batch": "批量导出",
  "export.all": "导出全部",
  "export.outputTo": "输出到：{path}",
  "export.outputUnset": "尚未选择输出文件夹",
  "export.historyTitle": "导出记录",
  "export.latestBatch": "最近一批：",
  "export.emptyHistory": "完成一次导出后，结果会显示在这里。",
  "export.latestBatchFiles": "最近一批文件",
  "export.currentSession": "本次会话",
  "history.successTitle": "{name} → {summary}",
  "history.failureTitle": "{name} 导出失败",
  "history.sizeDetail": "{source} → {output}",
  "history.unknownError": "未知处理错误。",
  "history.cropped": "已裁剪",
  "history.matched": "已匹配",
  "crop.ratioTitle": "裁剪比例",
  "crop.free": "自由",
  "crop.regionTitle": "裁剪区域（px）",
  "crop.left": "左",
  "crop.top": "上",
  "crop.width": "宽",
  "crop.height": "高",
  "crop.clear": "清除裁剪",
  "crop.editorTitle": "裁剪编辑器",
  "crop.editorHint": "拖动选框，或拖动四角调整大小",
  "crop.selectImageHint": "请从文件队列中选择图片。",
  "crop.previewAlt": "预览",
  "crop.handle.nw": "从左上角调整裁剪框",
  "crop.handle.ne": "从右上角调整裁剪框",
  "crop.handle.sw": "从左下角调整裁剪框",
  "crop.handle.se": "从右下角调整裁剪框",
  "resize.presetsTitle": "常用尺寸",
  "resize.maximumSizeTitle": "最大尺寸（px）",
  "resize.maximumWidth": "最大宽度",
  "resize.maximumHeight": "最大高度",
  "resize.lockRatio": "锁定宽高比",
  "resize.previewTitle": "尺寸调整预览",
  "resize.preserveRatio": "保持原始比例",
  "resize.selectImageHint": "请选择图片以查看尺寸调整结果。",
  "resize.originalSize": "原始尺寸 {width} × {height}",
  "resize.maximumWidthValue": "最大宽度 {width}",
  "resize.maximumHeightValue": "最大高度 {height}",
  "convert.title": "格式转换",
  "convert.files": "文件",
  "convert.output": "输出",
  "convert.currentFile": "当前文件",
  "convert.originalSize": "原始大小：{size}",
  "convert.outputFormat": "导出格式：{format}",
  "convert.estimatedSize": "预计大小：{size}",
  "convert.exportedSize": "已导出大小：{size}",
  "convert.calculating": "计算中…",
  "convert.noImage": "未选择图片",
  "compress.previewTitle": "压缩预览",
  "compress.quality": "质量 {quality}",
  "compress.original": "原图",
  "compress.compressed": "压缩后",
  "compress.estimateSummary": "原始 {source} → 预计 {estimate}",
  "compress.exportedAppend": " → 已导出 {size}",
  "removeBackground.title": "智能抠图",
  "removeBackground.recognizing": "正在识别主体…",
  "removeBackground.original": "原图",
  "removeBackground.transparent": "透明背景",
  "removeBackground.processing": "正在处理中…",
  "layout.previewTitle": "参考图 / 匹配结果",
  "layout.target": "目标：{name}",
  "layout.selectTargetHint": "请从文件队列中选择目标图。",
  "layout.recognizingAndMatching": "正在识别并匹配…",
  "layout.loadingReference": "正在载入参考图…",
  "layout.selectReferenceHint": "请选择参考图。",
  "layout.generatingPreview": "正在生成匹配预览…",
  "layout.selectReferenceAndTargetHint": "请选择参考图和目标图。",
  "layout.referenceLabel": "参考图",
  "layout.matchedLabel": "匹配结果",
  "layout.autoScale": "自动缩放 {value}%",
  "layout.finalScale": "最终缩放 {value}%",
  "layout.offset": "偏移 {x}, {y} px",
  "layout.confidence": "置信度 {value}%",
  "error.desktopProcessingUnavailable": "桌面处理服务不可用，请运行安装后的应用。",
  "error.imageProcessingUnavailable": "图片处理服务不可用，请运行安装后的应用。",
  "error.previewLoadFailed": "预览加载失败。",
  "error.selectReferenceFirst": "请先选择参考图。",
  "error.layoutUnreliable": "无法可靠识别并匹配主体。",
  "error.backgroundRemovalFailed": "智能抠图失败。",
  "error.compressionPreviewFailed": "压缩预览加载失败。",
  "error.environmentUnavailable": "当前环境不可用",
  "error.sizeEstimateFailed": "大小估算失败。",
  "error.filePickerUnavailable": "文件选择器不可用，请运行安装后的应用。",
  "error.importFailed": "图片导入失败。",
  "error.referencePickerUnavailable": "参考图选择器不可用，请运行安装后的应用。",
  "error.referenceAnalysisFailed": "参考图分析失败。",
  "error.folderPickerUnavailable": "文件夹选择器不可用，请运行安装后的应用。",
  "error.outputFolderSelectionFailed": "输出文件夹选择失败。",
  "error.drawCropBeforeExport": "请先绘制裁剪区域再导出。",
  "error.enterResizeDimension": "请至少填写宽度或高度。",
  "error.selectValidReference": "请先选择有效的参考图。",
  "error.waitLayoutAnalysis": "请等待版式分析或预览完成后再导出。",
  "error.noExportableTargets": "没有可导出的目标图，请重置或替换处理失败的图片。",
  "error.layoutMatchFailed": "版式匹配失败。",
  "error.unknownProcessing": "未知处理错误。",
  "error.unexpectedTechnical": "处理失败，请检查图片后重试。",
  "error.batchFailed": "批量处理失败。",
  "backendError.backgroundRemovalTaskInvalid": "抠图任务无效。",
  "backendError.aiBackgroundRemovalFailed": "智能抠图失败。",
  "backendError.aiBackgroundRemovalTimedOut": "智能抠图超时。",
  "backendError.cropDimensionsUnreadable": "无法读取图片尺寸，不能裁剪。",
  "backendError.cropOutsideBounds": "裁剪区域超出了图片范围。",
  "backendError.cropValuesIntegers": "裁剪参数必须是整数。",
  "backendError.cropBoundsInvalid": "裁剪位置不能为负数，宽高必须大于 0。",
  "backendError.imageSizeUnreadable": "无法读取图片尺寸。",
  "backendError.previewSizeUnreadable": "无法读取预览图片尺寸。",
  "backendError.imageWorkerTaskInvalid": "图片处理任务无效。",
  "backendError.referencePathRequired": "缺少参考图路径。",
  "backendError.unknownImageWorkerTask": "未知的图片处理任务。",
  "backendError.imageWorkerFailed": "图片处理失败。",
  "backendError.imageWorkerInvalidResponse": "图片处理进程返回了无效结果。",
  "backendError.imageWorkerStartFailed": "图片处理进程启动失败。",
  "backendError.imageWorkerExitSignal": "图片处理进程异常退出（信号 {signal}）。",
  "backendError.imageWorkerExitCode": "图片处理进程异常退出（代码 {code}）。",
  "backendError.imageProcessingTimedOut": "图片处理超时。",
  "backendError.imageProcessingFailed": "图片处理失败。",
  "backendError.transparentBoundaryMissing": "透明图片没有清晰的主体边界。",
  "backendError.subjectNotDistinguished": "无法从背景中识别主体。",
  "backendError.subjectEdgeUnstable": "主体与背景之间没有稳定边界。",
  "backendError.subjectFillsCanvas": "主体铺满画布，无法可靠对齐。",
  "backendError.subjectConfidenceLow": "主体边界识别置信度过低。",
  "backendError.layoutImageSizeUnreadable": "无法读取用于版式匹配的图片尺寸。",
  "backendError.subjectNotRecognizable": "未找到可识别的主体。",
  "backendError.aiSubjectBoundaryUnreliable": "本地 AI 无法识别可靠的主体边界。",
  "backendError.layoutReferenceMissing": "缺少参考图分析结果。",
  "backendError.layoutReferenceInvalid": "参考图分析结果无效。",
  "backendError.layoutReferenceBoundsOutside": "参考图主体范围超出了画布。",
  "backendError.layoutAdjustmentInvalid": "版式微调参数无效。",
  "backendError.layoutTargetSizeUnreadable": "无法读取目标图尺寸。",
  "backendError.layoutScaleUnsupported": "计算出的缩放比例超出支持范围。",
  "backendError.adjustedSubjectOutside": "调整后的主体超出了输出画布。",
  "backendError.previewFormatUnsupported": "该文件格式不支持预览。",
  "backendError.layoutFormatUnsupported": "该文件格式不支持版式匹配。",
  "backendError.noJobs": "没有可处理的任务。",
  "backendError.outputFolderRequired": "请选择输出文件夹。",
  "backendError.processingFailed": "处理失败。",
  "backendError.jobPayloadInvalid": "处理任务数据无效。",
  "backendError.jobIdRequired": "缺少任务编号。",
  "backendError.inputPathRequired": "缺少输入文件路径。",
  "backendError.outputFormatInvalid": "输出格式必须是 JPG、PNG 或 WEBP。",
  "backendError.qualityInvalid": "质量必须是 1 到 100 之间的整数。",
  "backendError.backgroundRemovalFormatInvalid": "智能抠图只能输出 PNG 或 WEBP。",
  "backendError.resizeDimensionsInvalid": "输出宽高必须是正整数。",
  "backendError.outputDirectoryRequired": "请选择输出文件夹。",
  "backendError.atLeastOneJobRequired": "请至少添加一个处理任务。",
  "backendError.layoutBoundsRequired": "缺少主体范围。",
  "backendError.layoutBoundsInvalid": "主体范围必须使用有限的非负坐标，且宽高必须大于 0。",
  "backendError.layoutBoundsOutside": "主体范围必须位于参考图画布内。",
  "backendError.layoutReferenceRequired": "缺少参考图分析结果。",
  "backendError.layoutReferenceDimensionsInvalid": "参考图宽高必须是正整数。",
  "backendError.layoutReferenceConfidenceInvalid": "参考图置信度必须在 0 到 1 之间。",
  "backendError.layoutReferenceMethodInvalid": "参考图识别方式必须是 alpha、edge 或 ai。",
  "backendError.layoutBackgroundInvalid": "版式背景必须是透明或纯色。",
  "backendError.layoutBackgroundColorInvalid": "版式纯色背景的 RGBA 通道必须是 0 到 255 之间的整数。",
  "backendError.layoutAdjustmentRequired": "缺少版式微调参数。",
  "backendError.layoutScaleMultiplierInvalid": "版式缩放倍数必须是大于 0 的有限数字。",
  "backendError.layoutOffsetsInvalid": "版式 X/Y 偏移必须是有限数字。",
  "backendError.layoutMatchOptionsRequired": "缺少版式匹配参数。",
  "backendError.layoutOperationConflict": "版式匹配不能与裁剪、调整尺寸或智能抠图同时使用。"
} as const;

export type TranslationKey = keyof typeof zhCN;
export type TranslationValue = string | number;

type PlaceholderNames<Value extends string> =
  Value extends `${string}{${infer Name}}${infer Rest}` ? Name | PlaceholderNames<Rest> : never;

type SamePlaceholders<Left extends string, Right extends string> =
  [PlaceholderNames<Left>] extends [PlaceholderNames<Right>]
    ? [PlaceholderNames<Right>] extends [PlaceholderNames<Left>]
      ? true
      : false
    : false;

type ValidatedTranslation<Target extends Record<TranslationKey, string>> = {
  [Key in TranslationKey]: SamePlaceholders<(typeof zhCN)[Key], Target[Key]> extends true
    ? Target[Key]
    : never;
};

function defineTranslation<const Target extends Record<TranslationKey, string>>(
  target: Target & ValidatedTranslation<Target>
) {
  return target;
}

const enUS = defineTranslation({
  "language.switchAria": "Switch interface language",
  "language.chinese": "中文",
  "language.english": "English",
  "nav.toolsAria": "Image processing tools",
  "common.addImages": "Add images",
  "common.clear": "Clear",
  "common.remove": "Remove",
  "common.reset": "Reset",
  "common.ready": "Ready",
  "common.processing": "Processing…",
  "common.loadingPreview": "Loading preview…",
  "common.localProcessing": "On-device processing",
  "common.automatic": "Auto",
  "common.noPreview": "No preview available.",
  "common.completed": "Completed",
  "common.failed": "Failed",
  "common.successCount": "{count} succeeded",
  "common.failureCount": "{count} failed",
  "common.imageCount": "Images: {count}",
  "mode.convert.label": "Convert",
  "mode.convert.description": "Convert image formats.",
  "mode.compress.label": "Compress",
  "mode.compress.description": "Reduce file size and compare the result.",
  "mode.removeBackground.label": "Remove BG",
  "mode.removeBackground.description": "Remove backgrounds with local AI.",
  "mode.matchLayout.label": "Match Layout",
  "mode.matchLayout.description": "Match subject position and size to a reference image.",
  "mode.crop.label": "Crop",
  "mode.crop.description": "Crop and keep the selected area.",
  "mode.resize.label": "Resize",
  "mode.resize.description": "Scale proportionally within maximum dimensions.",
  "mode.export.label": "History",
  "mode.export.description": "View exports from this session.",
  "queue.title": "File queue",
  "queue.count": "{count}",
  "queue.dropHint": "Drop JPG, PNG, or WEBP files here",
  "format.outputTitle": "Output format",
  "format.compressionTitle": "Compression format",
  "format.transparentTitle": "Transparent format",
  "quality.title": "Quality",
  "quality.ariaLabel": "Quality",
  "reference.title": "Reference image",
  "reference.method.alpha": "Alpha channel",
  "reference.method.edge": "Edge detection",
  "reference.method.ai": "AI",
  "reference.analysisSummary": "{width} × {height} px · {confidence}% · {method}",
  "reference.analyzingSubject": "Detecting subject…",
  "reference.noAnalysis": "No analysis available",
  "reference.notSelected": "No reference image selected",
  "reference.analyzing": "Analyzing…",
  "reference.change": "Change reference",
  "reference.select": "Select reference",
  "adjustment.title": "Per-image adjustment",
  "adjustment.scale": "Scale",
  "adjustment.scaleSliderAria": "Scale slider",
  "adjustment.scalePercentAria": "Scale percentage",
  "adjustment.offsetX": "X offset (px)",
  "adjustment.offsetY": "Y offset (px)",
  "export.title": "Export",
  "export.noFolder": "No export folder selected",
  "export.chooseFolder": "Choose folder",
  "export.batch": "Export batch",
  "export.all": "Export all",
  "export.outputTo": "Output to: {path}",
  "export.outputUnset": "No output folder selected",
  "export.historyTitle": "Export history",
  "export.latestBatch": "Latest batch: ",
  "export.emptyHistory": "Export results will appear here.",
  "export.latestBatchFiles": "Latest batch files",
  "export.currentSession": "This session",
  "history.successTitle": "{name} → {summary}",
  "history.failureTitle": "{name} export failed",
  "history.sizeDetail": "{source} → {output}",
  "history.unknownError": "Unknown processing error.",
  "history.cropped": "Cropped",
  "history.matched": "Matched",
  "crop.ratioTitle": "Crop ratio",
  "crop.free": "Free",
  "crop.regionTitle": "Crop area (px)",
  "crop.left": "Left",
  "crop.top": "Top",
  "crop.width": "Width",
  "crop.height": "Height",
  "crop.clear": "Clear crop",
  "crop.editorTitle": "Crop editor",
  "crop.editorHint": "Drag the selection or its corners to resize",
  "crop.selectImageHint": "Select an image from the file queue.",
  "crop.previewAlt": "Preview",
  "crop.handle.nw": "Resize crop from top-left",
  "crop.handle.ne": "Resize crop from top-right",
  "crop.handle.sw": "Resize crop from bottom-left",
  "crop.handle.se": "Resize crop from bottom-right",
  "resize.presetsTitle": "Common sizes",
  "resize.maximumSizeTitle": "Maximum size (px)",
  "resize.maximumWidth": "Maximum width",
  "resize.maximumHeight": "Maximum height",
  "resize.lockRatio": "Lock aspect ratio",
  "resize.previewTitle": "Resize preview",
  "resize.preserveRatio": "Preserve original aspect ratio",
  "resize.selectImageHint": "Select an image to preview the resized result.",
  "resize.originalSize": "Original size {width} × {height}",
  "resize.maximumWidthValue": "Maximum width {width}",
  "resize.maximumHeightValue": "Maximum height {height}",
  "convert.title": "Convert",
  "convert.files": "Files",
  "convert.output": "Output",
  "convert.currentFile": "Current file",
  "convert.originalSize": "Original size: {size}",
  "convert.outputFormat": "Output format: {format}",
  "convert.estimatedSize": "Estimated size: {size}",
  "convert.exportedSize": "Exported size: {size}",
  "convert.calculating": "Calculating…",
  "convert.noImage": "No image selected",
  "compress.previewTitle": "Compressed preview",
  "compress.quality": "Quality {quality}",
  "compress.original": "Original",
  "compress.compressed": "Compressed",
  "compress.estimateSummary": "Original {source} → Estimated {estimate}",
  "compress.exportedAppend": " → Exported {size}",
  "removeBackground.title": "Remove background",
  "removeBackground.recognizing": "Detecting subject…",
  "removeBackground.original": "Original",
  "removeBackground.transparent": "Transparent background",
  "removeBackground.processing": "Processing…",
  "layout.previewTitle": "Reference / Matched result",
  "layout.target": "Target: {name}",
  "layout.selectTargetHint": "Select a target image from the file queue.",
  "layout.recognizingAndMatching": "Detecting and matching…",
  "layout.loadingReference": "Loading reference image…",
  "layout.selectReferenceHint": "Select a reference image.",
  "layout.generatingPreview": "Generating matched preview…",
  "layout.selectReferenceAndTargetHint": "Select a reference and target image.",
  "layout.referenceLabel": "Reference",
  "layout.matchedLabel": "Matched result",
  "layout.autoScale": "Auto scale {value}%",
  "layout.finalScale": "Final scale {value}%",
  "layout.offset": "Offset {x}, {y} px",
  "layout.confidence": "Confidence {value}%",
  "error.desktopProcessingUnavailable": "Desktop processing is unavailable. Run the installed app.",
  "error.imageProcessingUnavailable": "Image processing is unavailable. Run the installed app.",
  "error.previewLoadFailed": "Failed to load the preview.",
  "error.selectReferenceFirst": "Choose a reference image first.",
  "error.layoutUnreliable": "Unable to reliably detect and match the subject.",
  "error.backgroundRemovalFailed": "Background removal failed.",
  "error.compressionPreviewFailed": "Failed to load the compressed preview.",
  "error.environmentUnavailable": "The current environment is unavailable.",
  "error.sizeEstimateFailed": "Failed to estimate output size.",
  "error.filePickerUnavailable": "The file picker is unavailable. Run the installed app.",
  "error.importFailed": "Failed to import images.",
  "error.referencePickerUnavailable": "The reference image picker is unavailable. Run the installed app.",
  "error.referenceAnalysisFailed": "Failed to analyze the reference image.",
  "error.folderPickerUnavailable": "The folder picker is unavailable. Run the installed app.",
  "error.outputFolderSelectionFailed": "Failed to choose the output folder.",
  "error.drawCropBeforeExport": "Draw a crop area before exporting.",
  "error.enterResizeDimension": "Enter at least a width or height.",
  "error.selectValidReference": "Choose a valid reference image first.",
  "error.waitLayoutAnalysis": "Wait for layout analysis or preview to finish before exporting.",
  "error.noExportableTargets": "There are no target images to export. Reset or replace failed images.",
  "error.layoutMatchFailed": "Layout matching failed.",
  "error.unknownProcessing": "Unknown processing error.",
  "error.unexpectedTechnical": "Processing failed. Check the image and try again.",
  "error.batchFailed": "Batch processing failed.",
  "backendError.backgroundRemovalTaskInvalid": "Background removal task is invalid.",
  "backendError.aiBackgroundRemovalFailed": "AI background removal failed.",
  "backendError.aiBackgroundRemovalTimedOut": "AI background removal timed out.",
  "backendError.cropDimensionsUnreadable": "Unable to read image dimensions for cropping.",
  "backendError.cropOutsideBounds": "Crop region is outside the image bounds.",
  "backendError.cropValuesIntegers": "Crop values must be integers.",
  "backendError.cropBoundsInvalid": "Crop bounds must be non-negative and dimensions must be > 0.",
  "backendError.imageSizeUnreadable": "Failed to read image size.",
  "backendError.previewSizeUnreadable": "Failed to read preview image size.",
  "backendError.imageWorkerTaskInvalid": "Image worker task is invalid.",
  "backendError.referencePathRequired": "A reference image path is required.",
  "backendError.unknownImageWorkerTask": "Unknown image worker task.",
  "backendError.imageWorkerFailed": "Image worker failed.",
  "backendError.imageWorkerInvalidResponse": "Image worker returned an invalid response.",
  "backendError.imageWorkerStartFailed": "Image worker failed to start.",
  "backendError.imageWorkerExitSignal": "Image worker exited with signal {signal}.",
  "backendError.imageWorkerExitCode": "Image worker exited with code {code}.",
  "backendError.imageProcessingTimedOut": "Image processing timed out.",
  "backendError.imageProcessingFailed": "Image processing failed.",
  "backendError.transparentBoundaryMissing": "The transparent image does not have a distinct subject boundary.",
  "backendError.subjectNotDistinguished": "No subject could be distinguished from the background.",
  "backendError.subjectEdgeUnstable": "The subject does not have a stable edge against the sampled background.",
  "backendError.subjectFillsCanvas": "The detected subject fills the canvas and cannot be aligned reliably.",
  "backendError.subjectConfidenceLow": "The subject boundary confidence is too low.",
  "backendError.layoutImageSizeUnreadable": "Failed to read image size for layout matching.",
  "backendError.subjectNotRecognizable": "No recognizable subject was found.",
  "backendError.aiSubjectBoundaryUnreliable": "The local AI model could not identify a reliable subject boundary.",
  "backendError.layoutReferenceMissing": "Layout reference analysis is missing.",
  "backendError.layoutReferenceInvalid": "Layout reference analysis is invalid.",
  "backendError.layoutReferenceBoundsOutside": "Layout reference subject bounds are outside the canvas.",
  "backendError.layoutAdjustmentInvalid": "Layout adjustment is invalid.",
  "backendError.layoutTargetSizeUnreadable": "Failed to read target image size for layout matching.",
  "backendError.layoutScaleUnsupported": "The calculated layout scale is outside the supported range.",
  "backendError.adjustedSubjectOutside": "The adjusted subject is outside the output canvas.",
  "backendError.previewFormatUnsupported": "This file format is not supported for preview.",
  "backendError.layoutFormatUnsupported": "This file format is not supported for layout matching.",
  "backendError.noJobs": "No jobs to process.",
  "backendError.outputFolderRequired": "Output folder is required.",
  "backendError.processingFailed": "Processing failed.",
  "backendError.jobPayloadInvalid": "Job payload is invalid.",
  "backendError.jobIdRequired": "Job id is required.",
  "backendError.inputPathRequired": "Input path is required.",
  "backendError.outputFormatInvalid": "Output format must be jpeg, png, or webp.",
  "backendError.qualityInvalid": "Quality must be an integer from 1 to 100.",
  "backendError.backgroundRemovalFormatInvalid": "Background removal output must be PNG or WEBP.",
  "backendError.resizeDimensionsInvalid": "Resize width/height must be positive integers when provided.",
  "backendError.outputDirectoryRequired": "Output directory is required.",
  "backendError.atLeastOneJobRequired": "At least one job is required.",
  "backendError.layoutBoundsRequired": "Layout subject bounds are required.",
  "backendError.layoutBoundsInvalid": "Layout subject bounds must use finite, non-negative coordinates and positive dimensions.",
  "backendError.layoutBoundsOutside": "Layout subject bounds must fit inside the reference canvas.",
  "backendError.layoutReferenceRequired": "Layout reference analysis is required.",
  "backendError.layoutReferenceDimensionsInvalid": "Layout reference dimensions must be positive integers.",
  "backendError.layoutReferenceConfidenceInvalid": "Layout reference confidence must be between 0 and 1.",
  "backendError.layoutReferenceMethodInvalid": "Layout reference method must be alpha, edge, or ai.",
  "backendError.layoutBackgroundInvalid": "Layout background must be transparent or solid.",
  "backendError.layoutBackgroundColorInvalid": "Layout solid background RGBA channels must be integers from 0 to 255.",
  "backendError.layoutAdjustmentRequired": "Layout adjustment is required.",
  "backendError.layoutScaleMultiplierInvalid": "Layout scale multiplier must be a finite number greater than 0.",
  "backendError.layoutOffsetsInvalid": "Layout X/Y offsets must be finite numbers.",
  "backendError.layoutMatchOptionsRequired": "Layout match options are required.",
  "backendError.layoutOperationConflict": "Layout matching cannot be combined with crop, resize, or background removal."
});

export const translations = {
  "zh-CN": zhCN,
  "en-US": enUS
} as const satisfies Record<AppLanguage, Record<TranslationKey, string>>;

export type TranslationParamsFor<Key extends TranslationKey> =
  [PlaceholderNames<(typeof zhCN)[Key]>] extends [never]
    ? never
    : { [Name in PlaceholderNames<(typeof zhCN)[Key]>]: TranslationValue };

type KeysWithParameters = {
  [Key in TranslationKey]: [PlaceholderNames<(typeof zhCN)[Key]>] extends [never] ? never : Key;
}[TranslationKey];

type KeysWithoutParameters = {
  [Key in TranslationKey]: [PlaceholderNames<(typeof zhCN)[Key]>] extends [never] ? Key : never;
}[TranslationKey];

export type Translator = {
  <Key extends KeysWithParameters>(key: Key, params: TranslationParamsFor<Key>): string;
  <Key extends KeysWithoutParameters>(key: Key, params?: never): string;
};

function renderTranslation(
  language: AppLanguage,
  key: TranslationKey,
  params?: Record<string, TranslationValue>
) {
  return translations[language][key].replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, name: string) => {
    const value = params?.[name];
    return value === undefined ? placeholder : String(value);
  });
}

export function translate<Key extends KeysWithParameters>(
  language: AppLanguage,
  key: Key,
  params: TranslationParamsFor<Key>
): string;
export function translate<Key extends KeysWithoutParameters>(
  language: AppLanguage,
  key: Key,
  params?: never
): string;
export function translate(
  language: AppLanguage,
  key: TranslationKey,
  params?: Record<string, TranslationValue>
) {
  return renderTranslation(language, key, params);
}

export function createTranslator(language: AppLanguage): Translator {
  return ((key: TranslationKey, params?: Record<string, TranslationValue>) =>
    renderTranslation(language, key, params)) as Translator;
}

const BACKEND_ERROR_TRANSLATIONS = [
  ["Desktop processing is unavailable. Run the installed app.", "error.desktopProcessingUnavailable"],
  ["Image processing is unavailable. Run the installed app.", "error.imageProcessingUnavailable"],
  ["Failed to load the preview.", "error.previewLoadFailed"],
  ["Choose a reference image first.", "error.selectReferenceFirst"],
  ["Unable to reliably detect and match the subject.", "error.layoutUnreliable"],
  ["Background removal failed.", "error.backgroundRemovalFailed"],
  ["Failed to load the compressed preview.", "error.compressionPreviewFailed"],
  ["The current environment is unavailable.", "error.environmentUnavailable"],
  ["Failed to estimate output size.", "error.sizeEstimateFailed"],
  ["The file picker is unavailable. Run the installed app.", "error.filePickerUnavailable"],
  ["Failed to import images.", "error.importFailed"],
  ["The reference image picker is unavailable. Run the installed app.", "error.referencePickerUnavailable"],
  ["Failed to analyze the reference image.", "error.referenceAnalysisFailed"],
  ["The folder picker is unavailable. Run the installed app.", "error.folderPickerUnavailable"],
  ["Failed to choose the output folder.", "error.outputFolderSelectionFailed"],
  ["Draw a crop area before exporting.", "error.drawCropBeforeExport"],
  ["Enter at least a width or height.", "error.enterResizeDimension"],
  ["Choose a valid reference image first.", "error.selectValidReference"],
  ["Wait for layout analysis or preview to finish before exporting.", "error.waitLayoutAnalysis"],
  ["There are no target images to export. Reset or replace failed images.", "error.noExportableTargets"],
  ["Layout matching failed.", "error.layoutMatchFailed"],
  ["Unknown processing error.", "error.unknownProcessing"],
  ["Batch processing failed.", "error.batchFailed"],
  ["Background removal task is invalid.", "backendError.backgroundRemovalTaskInvalid"],
  ["AI background removal failed.", "backendError.aiBackgroundRemovalFailed"],
  ["AI background removal timed out.", "backendError.aiBackgroundRemovalTimedOut"],
  ["Unable to read image dimensions for cropping.", "backendError.cropDimensionsUnreadable"],
  ["Crop region is outside the image bounds.", "backendError.cropOutsideBounds"],
  ["Crop values must be integers.", "backendError.cropValuesIntegers"],
  ["Crop bounds must be non-negative and dimensions must be > 0.", "backendError.cropBoundsInvalid"],
  ["Failed to read image size.", "backendError.imageSizeUnreadable"],
  ["Failed to read preview image size.", "backendError.previewSizeUnreadable"],
  ["Image worker task is invalid.", "backendError.imageWorkerTaskInvalid"],
  ["A reference image path is required.", "backendError.referencePathRequired"],
  ["Unknown image worker task.", "backendError.unknownImageWorkerTask"],
  ["Image worker failed.", "backendError.imageWorkerFailed"],
  ["Image worker returned an invalid response.", "backendError.imageWorkerInvalidResponse"],
  ["Image worker failed to start.", "backendError.imageWorkerStartFailed"],
  ["Image processing timed out.", "backendError.imageProcessingTimedOut"],
  ["Image processing failed.", "backendError.imageProcessingFailed"],
  ["The transparent image does not have a distinct subject boundary.", "backendError.transparentBoundaryMissing"],
  ["No subject could be distinguished from the background.", "backendError.subjectNotDistinguished"],
  ["The subject does not have a stable edge against the sampled background.", "backendError.subjectEdgeUnstable"],
  ["The detected subject fills the canvas and cannot be aligned reliably.", "backendError.subjectFillsCanvas"],
  ["The subject boundary confidence is too low.", "backendError.subjectConfidenceLow"],
  ["Failed to read image size for layout matching.", "backendError.layoutImageSizeUnreadable"],
  ["No recognizable subject was found.", "backendError.subjectNotRecognizable"],
  ["The local AI model could not identify a reliable subject boundary.", "backendError.aiSubjectBoundaryUnreliable"],
  ["Layout reference analysis is missing.", "backendError.layoutReferenceMissing"],
  ["Layout reference analysis is invalid.", "backendError.layoutReferenceInvalid"],
  ["Layout reference subject bounds are outside the canvas.", "backendError.layoutReferenceBoundsOutside"],
  ["Layout adjustment is invalid.", "backendError.layoutAdjustmentInvalid"],
  ["Failed to read target image size for layout matching.", "backendError.layoutTargetSizeUnreadable"],
  ["The calculated layout scale is outside the supported range.", "backendError.layoutScaleUnsupported"],
  ["The adjusted subject is outside the output canvas.", "backendError.adjustedSubjectOutside"],
  ["This file format is not supported for preview.", "backendError.previewFormatUnsupported"],
  ["This file format is not supported for layout matching.", "backendError.layoutFormatUnsupported"],
  ["No jobs to process.", "backendError.noJobs"],
  ["Output folder is required.", "backendError.outputFolderRequired"],
  ["Processing failed.", "backendError.processingFailed"],
  ["Job payload is invalid.", "backendError.jobPayloadInvalid"],
  ["Job id is required.", "backendError.jobIdRequired"],
  ["Input path is required.", "backendError.inputPathRequired"],
  ["Output format must be jpeg, png, or webp.", "backendError.outputFormatInvalid"],
  ["Quality must be an integer from 1 to 100.", "backendError.qualityInvalid"],
  ["Quality must be between 1 and 100.", "backendError.qualityInvalid"],
  ["Background removal output must be PNG or WEBP.", "backendError.backgroundRemovalFormatInvalid"],
  ["Resize width/height must be positive integers when provided.", "backendError.resizeDimensionsInvalid"],
  ["Resize width and height must be positive integers.", "backendError.resizeDimensionsInvalid"],
  ["Output directory is required.", "backendError.outputDirectoryRequired"],
  ["At least one job is required.", "backendError.atLeastOneJobRequired"],
  ["Layout subject bounds are required.", "backendError.layoutBoundsRequired"],
  ["Layout subject bounds must use finite, non-negative coordinates and positive dimensions.", "backendError.layoutBoundsInvalid"],
  ["Layout subject bounds must fit inside the reference canvas.", "backendError.layoutBoundsOutside"],
  ["Layout reference analysis is required.", "backendError.layoutReferenceRequired"],
  ["Layout reference dimensions must be positive integers.", "backendError.layoutReferenceDimensionsInvalid"],
  ["Layout reference confidence must be between 0 and 1.", "backendError.layoutReferenceConfidenceInvalid"],
  ["Layout reference method must be alpha, edge, or ai.", "backendError.layoutReferenceMethodInvalid"],
  ["Layout background must be transparent or solid.", "backendError.layoutBackgroundInvalid"],
  ["Layout solid background RGBA channels must be integers from 0 to 255.", "backendError.layoutBackgroundColorInvalid"],
  ["Layout adjustment is required.", "backendError.layoutAdjustmentRequired"],
  ["Layout scale multiplier must be a finite number greater than 0.", "backendError.layoutScaleMultiplierInvalid"],
  ["Layout X/Y offsets must be finite numbers.", "backendError.layoutOffsetsInvalid"],
  ["Layout match options are required.", "backendError.layoutMatchOptionsRequired"],
  ["Layout matching cannot be combined with crop, resize, or background removal.", "backendError.layoutOperationConflict"]
] as const satisfies ReadonlyArray<readonly [string, KeysWithoutParameters]>;

export function localizeErrorMessage(message: string, language: AppLanguage) {
  const withoutIpcPrefix = message.replace(
    /^Error invoking remote method ['"][^'"]+['"]:\s*(?:Error:\s*)?/,
    ""
  );
  const withWorkerExitDetails = withoutIpcPrefix
    .replace(/Image worker exited with signal ([^.]+)\./g, (_match, signal: string) =>
      renderTranslation(language, "backendError.imageWorkerExitSignal", { signal })
    )
    .replace(/Image worker exited with code ([^.]+)\./g, (_match, code: string) =>
      renderTranslation(language, "backendError.imageWorkerExitCode", { code })
    );

  const localized = BACKEND_ERROR_TRANSLATIONS.reduce(
    (localized, [source, key]) => localized.split(source).join(renderTranslation(language, key)),
    withWorkerExitDetails
  );

  if (language === "zh-CN" && localized === withWorkerExitDetails && /[A-Za-z]{3}/.test(localized)) {
    return renderTranslation(language, "error.unexpectedTechnical");
  }

  return localized;
}

type ReadableStorage = {
  getItem(key: string): string | null;
};

type WritableStorage = {
  setItem(key: string, value: string): void;
};

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "zh-CN" || value === "en-US";
}

function getBrowserStorage(): ReadableStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getBrowserWritableStorage(): WritableStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredLanguage(storage?: ReadableStorage | null): AppLanguage {
  try {
    const value = (storage ?? getBrowserStorage())?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    return isAppLanguage(value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function writeStoredLanguage(storage: WritableStorage | null | undefined, language: AppLanguage): void;
export function writeStoredLanguage(language: AppLanguage): void;
export function writeStoredLanguage(
  storageOrLanguage: WritableStorage | AppLanguage | null | undefined,
  maybeLanguage?: AppLanguage
) {
  const language = typeof storageOrLanguage === "string" ? storageOrLanguage : maybeLanguage;
  const storage = typeof storageOrLanguage === "string" ? getBrowserWritableStorage() : storageOrLanguage;
  if (!language) {
    return;
  }

  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage may be blocked or unavailable. Language switching should still work for this session.
  }
}

type DocumentLike = {
  documentElement?: {
    lang: string;
  } | null;
};

export function syncDocumentLanguage(documentLike: DocumentLike | null | undefined, language: AppLanguage): void;
export function syncDocumentLanguage(language: AppLanguage): void;
export function syncDocumentLanguage(
  documentOrLanguage: DocumentLike | AppLanguage | null | undefined,
  maybeLanguage?: AppLanguage
) {
  const language = typeof documentOrLanguage === "string" ? documentOrLanguage : maybeLanguage;
  const documentLike = typeof documentOrLanguage === "string"
    ? (typeof document === "undefined" ? undefined : document)
    : documentOrLanguage;

  if (language && documentLike?.documentElement) {
    documentLike.documentElement.lang = language;
  }
}
