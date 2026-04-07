import type { ImportedImageFile } from "@/src/shared/types/image";
import { formatBytes, getDroppedFiles, type QueueFile } from "@/components/home/dashboard-utils";

type FileListPanelProps = {
  files: QueueFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDropFiles: (files: ImportedImageFile[]) => void;
};

export function FileListPanel({
  files,
  selectedFileId,
  onSelect,
  onRemove,
  onClear,
  onDropFiles
}: FileListPanelProps) {
  return (
    <div
      className="rounded-2xl border bg-white p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropFiles(getDroppedFiles(event));
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-medium">Files</div>
        <button className="text-xs text-slate-500 transition hover:text-slate-900" onClick={onClear} type="button">
          Clear all
        </button>
      </div>
      <div className="mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Drop JPG, PNG or WEBP files here.
      </div>
      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed p-3 text-sm text-slate-500">No images imported yet.</div>
        ) : (
          files.map((file) => {
            const active = file.id === selectedFileId;
            return (
              <div
                className={`rounded-lg border p-3 transition ${active ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50"}`}
                key={file.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(file.id)} type="button">
                    <div className="truncate text-sm font-medium">{file.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatBytes(file.sizeBytes)}</div>
                  </button>
                  <button className="text-xs text-slate-400 hover:text-slate-900" onClick={() => onRemove(file.id)} type="button">
                    Remove
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
