import type { ImportedImageFile } from "@/src/shared/types/image";
import { formatBytes, getDroppedFiles, type QueueFile } from "@/components/home/dashboard-utils";

type FileListPanelProps = {
  files: QueueFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDropFiles: (files: ImportedImageFile[]) => void;
  showLayoutStatus?: boolean;
};

export function FileListPanel({
  files,
  selectedFileId,
  onSelect,
  onRemove,
  onClear,
  onDropFiles,
  showLayoutStatus = false
}: FileListPanelProps) {
  return (
    <div
      className="flex max-h-[calc(100vh-168px)] min-h-0 flex-col self-start rounded-xl border bg-white p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropFiles(getDroppedFiles(event));
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-medium">文件队列 <span className="ml-1 text-xs font-normal text-slate-400">{files.length}</span></div>
        <button className="text-xs text-slate-500 transition hover:text-slate-900" onClick={onClear} type="button">
          清空
        </button>
      </div>
      <div className="min-h-0 space-y-1.5 overflow-y-auto pr-1">
        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-sm leading-6 text-slate-500">
            拖入 JPG、PNG 或 WEBP
          </div>
        ) : (
          files.map((file) => {
            const active = file.id === selectedFileId;
            return (
              <div
                className={`rounded-lg border px-2.5 py-2 transition ${active ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50"}`}
                key={file.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(file.id)} type="button">
                    <div className="truncate text-sm font-medium">{file.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatBytes(file.sizeBytes)}</div>
                    {showLayoutStatus && file.layoutError ? <div className="mt-1 text-xs leading-4 text-rose-600">{file.layoutError}</div> : null}
                  </button>
                  <button className="text-xs text-slate-400 hover:text-slate-900" onClick={() => onRemove(file.id)} type="button">
                    移除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
