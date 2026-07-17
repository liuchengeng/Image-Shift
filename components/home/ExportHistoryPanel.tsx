import type { BatchProcessResult } from "@/src/shared/types/image";
import { getModeLabel, type HistoryItem } from "@/components/home/dashboard-utils";
import { useLanguage } from "@/components/home/LanguageProvider";
import { localizeErrorMessage, type Translator } from "@/components/home/i18n";

type ExportHistoryPanelProps = {
  outputDir: string;
  result: BatchProcessResult | null;
  history: HistoryItem[];
  onChooseFolder: () => void;
  onRun: () => void;
  ready: boolean;
  busy: boolean;
};

function formatHistorySummary(item: HistoryItem, t: Translator) {
  if (item.summary.kind === "resize") {
    return `${item.summary.width ?? t("common.automatic")} × ${item.summary.height ?? t("common.automatic")}`;
  }

  if (item.summary.kind === "crop") {
    return t("history.cropped");
  }

  if (item.summary.kind === "layout") {
    return t("history.matched");
  }

  return item.summary.format;
}

export function ExportHistoryPanel({
  outputDir,
  result,
  history,
  onChooseFolder,
  onRun,
  ready,
  busy
}: ExportHistoryPanelProps) {
  const { language, t } = useLanguage();
  const latestSuccesses = result?.results.filter((item) => item.success).length ?? 0;
  const latestFailures = result?.results.length ? result.results.length - latestSuccesses : 0;

  return (
    <div aria-busy={busy} className="mx-auto max-w-[1180px] space-y-3">
      <div className="ui-panel p-3">
        <div className="mb-2.5 flex items-center justify-between gap-4">
          <div className="ui-panel-title">{t("export.title")}</div>
          <div className="flex gap-2">
            <button className="ui-button-secondary px-3" onClick={onChooseFolder} type="button">
              {t("export.chooseFolder")}
            </button>
            <button
              className="ui-button-primary px-3"
              disabled={busy || !ready}
              onClick={onRun}
              type="button"
            >
              {busy ? t("common.processing") : t("export.all")}
            </button>
          </div>
        </div>
        <div className="ui-inset truncate px-3 py-2 text-sm text-neutral-600" title={outputDir || undefined}>
          {outputDir ? t("export.outputTo", { path: outputDir }) : t("export.outputUnset")}
        </div>
      </div>

      <div className="ui-panel p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="ui-panel-title">{t("export.historyTitle")}</div>
          <div aria-atomic="true" aria-live="polite" className="text-xs text-neutral-500">
            {result ? (
              <>
                {t("export.latestBatch")}<span className="text-emerald-700">{t("common.successCount", { count: latestSuccesses })}</span>
                {latestFailures > 0 ? <span className="ml-2 text-rose-600">{t("common.failureCount", { count: latestFailures })}</span> : null}
              </>
            ) : null}
          </div>
        </div>

        {!result && history.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-10 text-center text-sm text-neutral-500">
            {t("export.emptyHistory")}
          </div>
        ) : null}

        {result ? (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-neutral-500">{t("export.latestBatchFiles")}</div>
            <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 px-3">
              {result.results.map((item) => (
                <div className="flex items-start gap-3 py-2.5 text-sm" key={item.id}>
                  <div className={`mt-0.5 shrink-0 text-xs font-medium ${item.success ? "text-emerald-700" : "text-rose-600"}`}>
                    {item.success ? t("common.completed") : t("common.failed")}
                  </div>
                  <div className={`min-w-0 flex-1 text-neutral-600 ${item.success ? "truncate" : "break-words"}`} title={item.success ? item.outputPath : undefined}>
                    {item.success ? item.outputPath : localizeErrorMessage(item.error?.message ?? "Unknown processing error.", language)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className={`${result ? "mt-4 border-t pt-4" : "mt-3"}`}>
            <div className="mb-1 text-xs font-medium text-neutral-500">{t("export.currentSession")}</div>
            <div className="divide-y">
              {history.map((item) => (
                <div className="flex items-start justify-between gap-4 py-2.5 text-sm" key={item.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{item.fileName}</div>
                      <span className={`shrink-0 text-xs ${item.success ? "text-emerald-700" : "text-rose-600"}`}>
                        {item.success ? t("common.completed") : t("common.failed")}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-neutral-500" title={item.success ? item.detail : localizeErrorMessage(item.detail, language)}>{item.success ? item.detail : localizeErrorMessage(item.detail, language)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-neutral-500">{getModeLabel(item.mode, language)}</div>
                    {item.success ? <div className="mt-0.5 text-xs text-neutral-500">{formatHistorySummary(item, t)}</div> : null}
                    <div className="mt-0.5 text-xs text-neutral-500">{new Date(item.timestamp).toLocaleString(language)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
