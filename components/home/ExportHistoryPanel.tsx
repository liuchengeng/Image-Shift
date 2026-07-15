import type { BatchProcessResult } from "@/src/shared/types/image";
import { getModeLabel, type HistoryItem } from "@/components/home/dashboard-utils";

type ExportHistoryPanelProps = {
  outputDir: string;
  result: BatchProcessResult | null;
  history: HistoryItem[];
  onChooseFolder: () => void;
  onRun: () => void;
  ready: boolean;
  busy: boolean;
};

function getHistoryFileName(item: HistoryItem) {
  if (item.success) {
    const separator = Math.max(item.title.lastIndexOf(" → "), item.title.lastIndexOf(" -> "));
    return separator >= 0 ? item.title.slice(0, separator) : item.title;
  }

  return item.title.replace(/(?: failed| 导出失败)$/, "");
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
  const latestSuccesses = result?.results.filter((item) => item.success).length ?? 0;
  const latestFailures = result?.results.length ? result.results.length - latestSuccesses : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="font-medium">导出</div>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={onChooseFolder} type="button">
              选择文件夹
            </button>
            <button
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || !ready}
              onClick={onRun}
              type="button"
            >
              {busy ? "正在处理…" : "导出全部"}
            </button>
          </div>
        </div>
        <div className="truncate rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600" title={outputDir || undefined}>
          {outputDir ? `输出到：${outputDir}` : "尚未选择输出文件夹"}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">导出记录</div>
          {result ? (
            <div className="text-xs text-slate-500">
              最近一批：<span className="text-emerald-600">{latestSuccesses} 成功</span>
              {latestFailures > 0 ? <span className="ml-2 text-rose-600">{latestFailures} 失败</span> : null}
            </div>
          ) : null}
        </div>

        {!result && history.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed px-3 py-6 text-center text-sm text-slate-500">
            完成一次导出后，结果会显示在这里。
          </div>
        ) : null}

        {result ? (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-slate-500">最近一批文件</div>
            <div className="divide-y rounded-lg border px-3">
              {result.results.map((item) => (
                <div className="flex items-start gap-3 py-2.5 text-sm" key={item.id}>
                  <div className={`mt-0.5 shrink-0 text-xs font-medium ${item.success ? "text-emerald-600" : "text-rose-600"}`}>
                    {item.success ? "已完成" : "失败"}
                  </div>
                  <div className={`min-w-0 flex-1 text-slate-600 ${item.success ? "truncate" : "break-words"}`} title={item.success ? item.outputPath : undefined}>
                    {item.success ? item.outputPath : item.error?.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className={`${result ? "mt-4 border-t pt-4" : "mt-3"}`}>
            <div className="mb-1 text-xs font-medium text-slate-500">本次会话</div>
            <div className="divide-y">
              {history.map((item) => (
                <div className="flex items-start justify-between gap-4 py-2.5 text-sm" key={item.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{getHistoryFileName(item)}</div>
                      <span className={`shrink-0 text-xs ${item.success ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.success ? "已完成" : "失败"}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500" title={item.detail}>{item.detail}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-slate-500">{getModeLabel(item.mode)}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{item.timestamp}</div>
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
