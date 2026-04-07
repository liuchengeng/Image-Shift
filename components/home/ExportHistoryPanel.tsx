import type { BatchProcessResult } from "@/src/shared/types/image";
import type { HistoryItem } from "@/components/home/dashboard-utils";

type ExportHistoryPanelProps = {
  outputDir: string;
  result: BatchProcessResult | null;
  history: HistoryItem[];
  onChooseFolder: () => void;
  onRun: () => void;
  ready: boolean;
  busy: boolean;
};

export function ExportHistoryPanel({
  outputDir,
  result,
  history,
  onChooseFolder,
  onRun,
  ready,
  busy
}: ExportHistoryPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Export history</div>
            <div className="text-sm text-slate-500">The latest session entries stay here until you close the app.</div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={onChooseFolder} type="button">
              Choose folder
            </button>
            <button
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || !ready}
              onClick={onRun}
              type="button"
            >
              {busy ? "Processing..." : "Export batch"}
            </button>
          </div>
        </div>
        <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">{outputDir || "No export folder selected."}</div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 font-medium">Latest batch</div>
        <div className="space-y-2">
          {!result ? (
            <div className="rounded-lg border p-3 text-sm text-slate-500">Run a batch to populate this list.</div>
          ) : (
            result.results.map((item) => (
              <div className="rounded-lg border p-3 text-sm" key={item.id}>
                <div className="font-medium">{item.success ? "Export completed" : "Export failed"}</div>
                <div className="mt-1 text-slate-500">{item.success ? item.outputPath : item.error?.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 font-medium">Session history</div>
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="rounded-lg border p-3 text-sm text-slate-500">No export history yet.</div>
          ) : (
            history.map((item) => (
              <div className="rounded-lg border p-3 text-sm" key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{item.title}</div>
                  <div className={`text-xs ${item.success ? "text-emerald-600" : "text-rose-600"}`}>{item.mode}</div>
                </div>
                <div className="mt-1 text-slate-500">{item.detail}</div>
                <div className="mt-1 text-xs text-slate-400">{item.timestamp}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
