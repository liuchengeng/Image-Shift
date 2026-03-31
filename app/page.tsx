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
