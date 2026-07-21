const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const KEPT_LOCALES = new Set(["en-US.pak", "zh-CN.pak"]);
const ARCH_NAMES = new Map([
  [0, "ia32"],
  [1, "x64"],
  [2, "armv7l"],
  [3, "arm64"]
]);

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

async function pruneOnnxRuntimes(appOutDir, onnxBin, platformName, archName) {
  for (const platformEntry of await fs.readdir(onnxBin, { withFileTypes: true })) {
    if (platformEntry.isDirectory() && platformEntry.name !== platformName) {
      await removeInside(appOutDir, path.join(onnxBin, platformEntry.name));
    }
  }

  const platformDir = path.join(onnxBin, platformName);
  for (const archEntry of await fs.readdir(platformDir, { withFileTypes: true })) {
    if (archEntry.isDirectory() && archEntry.name !== archName) {
      await removeInside(appOutDir, path.join(platformDir, archEntry.name));
    }
  }
}

async function adHocSignMacApp(appOutDir) {
  const appBundle = (await fs.readdir(appOutDir)).find((entry) => entry.endsWith(".app"));
  if (!appBundle) {
    throw new Error(`Unable to find a macOS app bundle in ${appOutDir}`);
  }

  await execFileAsync("/usr/bin/codesign", [
    "--force",
    "--deep",
    "--sign",
    "-",
    path.join(appOutDir, appBundle)
  ]);
}

module.exports = async function afterPack(context) {
  const appOutDir = path.resolve(context.appOutDir);
  const unpackedModules = path.join(appOutDir, "resources", "app.asar.unpacked", "node_modules");
  const onnxBin = path.join(unpackedModules, "onnxruntime-node", "bin", "napi-v3");
  const archName = ARCH_NAMES.get(context.arch);

  if (!archName) {
    throw new Error(`Unsupported packaging architecture: ${context.arch}`);
  }

  await pruneOnnxRuntimes(appOutDir, onnxBin, context.electronPlatformName, archName);

  if (context.electronPlatformName === "win32") {
    await removeInside(
      appOutDir,
      path.join(unpackedModules, "@imgly", "background-removal-node", "node_modules", "sharp", "vendor")
    );
  }

  await Promise.all([pruneModelAssets(appOutDir, unpackedModules), pruneLocales(appOutDir)]);

  if (context.electronPlatformName === "darwin") {
    await adHocSignMacApp(appOutDir);
  }
};
