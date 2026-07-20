import type { ImportedImageFile } from "@/src/shared/types/image";
import { formatBytes, getDroppedFiles, type QueueFile } from "@/components/home/dashboard-utils";
import { useLanguage } from "@/components/home/LanguageProvider";
import { localizeErrorMessage } from "@/components/home/i18n";

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
  const { language, t } = useLanguage();

  return (
    <div
      className="ui-panel flex h-full min-h-0 flex-col p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropFiles(getDroppedFiles(event));
      }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="ui-panel-title flex items-center gap-2">
          {t("queue.title")}
          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium leading-none text-neutral-500">
            {files.length}
          </span>
        </div>
        {files.length > 0 ? (
          <button className="text-xs text-neutral-500 transition hover:text-neutral-950" onClick={onClear} type="button">
            {t("common.clear")}
          </button>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col space-y-1.5 overflow-y-auto pr-1">
        {files.length === 0 ? (
          <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 text-center">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm">
              <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
              </svg>
            </div>
            <div className="text-sm font-medium text-neutral-700">{t("queue.dropHint")}</div>
            <div className="mt-1.5 text-[11px] font-medium tracking-wide text-neutral-400">JPG · PNG · WEBP</div>
          </div>
        ) : (
          files.map((file) => {
            const active = file.id === selectedFileId;
            return (
              <div
                className={`group relative rounded-lg border px-2.5 py-2 transition ${active ? "border-neutral-300 bg-neutral-50 shadow-sm before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-r before:bg-blue-600" : "border-transparent hover:border-neutral-200 hover:bg-neutral-50"}`}
                key={file.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <button aria-pressed={active} className="min-w-0 flex-1 text-left" onClick={() => onSelect(file.id)} type="button">
                    <div className="truncate text-[13px] font-medium text-neutral-800">{file.name}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-500">{formatBytes(file.sizeBytes)}</div>
                    {showLayoutStatus && file.layoutError ? <div className="mt-1 text-xs leading-4 text-rose-600">{localizeErrorMessage(file.layoutError, language)}</div> : null}
                  </button>
                  <button aria-label={`${t("common.remove")}: ${file.name}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-base leading-none text-neutral-400 opacity-70 transition hover:bg-neutral-200 hover:text-neutral-900 group-hover:opacity-100" onClick={() => onRemove(file.id)} title={t("common.remove")} type="button">
                    ×
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
