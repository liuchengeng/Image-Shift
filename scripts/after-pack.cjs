const fs = require("node:fs/promises");
const path = require("node:path");

const KEPT_LOCALES = new Set(["en-US.pak", "zh-CN.pak"]);

function assertInside(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing to prune path outside app output: ${resolvedTarget}`);
  }
}

async function removeInside(root, target) {
  assertInside(root, target);
  await fs.rm(target, { recursive: true, force: true });
}

async function pruneModelAssets(appOutDir, unpackedModules) {
  const distDir = path.join(unpackedModules, "@imgly", "background-removal-node", "dist");
  const manifestPath = path.join(distDir, "resources.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const mediumChunks = new Set(manifest["/models/medium"].chunks.map((chunk) => chunk.hash));

  for (const entry of await fs.readdir(distDir, { withFileTypes: true })) {
    if (entry.isFile() && !path.extname(entry.name) && !mediumChunks.has(entry.name)) {
      await removeInside(appOutDir, path.join(distDir, entry.name));
    }
  }
}

async function pruneLocales(appOutDir) {
  const localesDir = path.join(appOutDir, "locales");
  for (const entry of await fs.readdir(localesDir, { withFileTypes: true })) {
    if (entry.isFile() && !KEPT_LOCALES.has(entry.name)) {
      await removeInside(appOutDir, path.join(localesDir, entry.name));
    }
  }
}

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "win32" || context.arch !== 1) {
    return;
  }

  const appOutDir = path.resolve(context.appOutDir);
  const unpackedModules = path.join(appOutDir, "resources", "app.asar.unpacked", "node_modules");
  const onnxBin = path.join(unpackedModules, "onnxruntime-node", "bin", "napi-v3");

  await Promise.all([
    removeInside(appOutDir, path.join(onnxBin, "darwin")),
    removeInside(appOutDir, path.join(onnxBin, "linux")),
    removeInside(appOutDir, path.join(onnxBin, "win32", "arm64")),
    removeInside(appOutDir, path.join(unpackedModules, "@imgly", "background-removal-node", "node_modules", "sharp", "vendor"))
  ]);

  await pruneModelAssets(appOutDir, unpackedModules);
  await pruneLocales(appOutDir);
};
