"use client";

import { useMemo, useState } from "react";
import type { BatchProcessRequest, BatchProcessResult, OutputFormat } from "@/src/shared/types/image";

type AppFile = {
  id: string;
  inputPath: string;
};

export default function HomePage() {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [outputDir, setOutputDir] = useState<string>("");
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState<number>(80);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [result, setResult] = useState<BatchProcessResult | null>(null);
  const [zipName, setZipName] = useState<string>("export.zip");
  const [zipMsg, setZipMsg] = useState<string>("");

  const successFiles = useMemo(() => {
    if (!result) return [];
    return result.results.filter((r) => r.success && r.outputPath).map((r) => r.outputPath as string);
  }, [result]);

  async function onPickFiles() {
    const picked = await window.imageShift.imageApi.pickInputFiles();
    const mapped = picked.map((p, idx) => ({ id: `${Date.now()}-${idx}`, inputPath: p }));
    setFiles(mapped);
  }

  async function onPickOutputDir() {
    const dir = await window.imageShift.imageApi.pickOutputDir();
    if (dir) setOutputDir(dir);
  }

  async function onProcess() {
    if (files.length === 0 || !outputDir) return;

    setBusy(true);
    setZipMsg("");
    try {
      const payload: BatchProcessRequest = {
        jobs: files.map((f) => ({
          id: f.id,
          inputPath: f.inputPath,
          outputPath: `${outputDir}/placeholder.${format}`,
          outputDir,
          format,
          quality,
          resize: {
            width: width ? Number(width) : undefined,
            height: height ? Number(height) : undefined,
            fit: "inside" as const
          }
        }))
      };

      const processed = await window.imageShift.imageApi.processBatch(payload);
      setResult(processed);
    } finally {
      setBusy(false);
    }
  }

  async function onZipExport() {
    if (!outputDir || successFiles.length === 0) return;
    const zipPath = `${outputDir}/${zipName || "export.zip"}`;
    const res = await window.imageShift.imageApi.exportZip({ files: successFiles, zipPath });
    setZipMsg(res.success ? `ZIP exported: ${res.zipPath}` : `ZIP failed: ${res.error}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Image-Shift</h1>
        <p className="mt-1 text-slate-600">Desktop MVP - local image batch processing</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Upload Panel</h2>
          <button className="mt-3 rounded bg-slate-900 px-3 py-2 text-white" onClick={onPickFiles}>
            Pick Images
          </button>
          <ul className="mt-3 max-h-56 overflow-auto text-sm text-slate-700">
            {files.map((f) => (
              <li key={f.id} className="truncate">{f.inputPath}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Controls Panel</h2>
          <div className="mt-3 space-y-2 text-sm">
            <label className="block">
              Format
              <select className="ml-2 rounded border px-2 py-1" value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)}>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </label>
            <label className="block">
              Quality
              <input className="ml-2 w-24 rounded border px-2 py-1" type="number" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
            </label>
            <label className="block">
              Width
              <input className="ml-2 w-24 rounded border px-2 py-1" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="optional" />
            </label>
            <label className="block">
              Height
              <input className="ml-2 w-24 rounded border px-2 py-1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="optional" />
            </label>
            <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={onPickOutputDir}>
              Pick Output Folder
            </button>
            <p className="truncate text-xs text-slate-600">{outputDir || "No output folder selected"}</p>
            <button className="rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-50" disabled={busy || files.length === 0 || !outputDir} onClick={onProcess}>
              {busy ? "Processing..." : "Process Batch"}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Preview / Result Panel</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>Processed: {result ? result.results.filter((r) => r.success).length : 0}</p>
            <p>Failed: {result ? result.results.filter((r) => !r.success).length : 0}</p>
            <input className="w-full rounded border px-2 py-1" value={zipName} onChange={(e) => setZipName(e.target.value)} placeholder="export.zip" />
            <button className="rounded bg-indigo-600 px-3 py-2 text-white disabled:opacity-50" disabled={successFiles.length === 0 || !outputDir} onClick={onZipExport}>
              Export ZIP
            </button>
            <p className="text-xs text-slate-600">{zipMsg}</p>
            <ul className="max-h-40 overflow-auto text-xs text-slate-700">
              {result?.results.map((r) => (
                <li key={r.id} className="truncate">
                  {r.success ? `✅ ${r.outputPath}` : `❌ ${r.error?.message}`}
                </li>
              ))}
            </ul>
          </div>
        </section>
import { ControlsPanel } from "@/components/panels/ControlsPanel";
import { PreviewPanel } from "@/components/panels/PreviewPanel";
import { UploadPanel } from "@/components/panels/UploadPanel";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="mt-1 text-slate-600">{APP_TAGLINE} — MVP scaffold</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <UploadPanel />
        <PreviewPanel />
        <ControlsPanel />
      </section>
    </main>
  );
}
