const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { removeBackground } = require("@imgly/background-removal-node");

function getMimeType(inputPath) {
  const extension = path.extname(inputPath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}

function getAssetDirectory() {
  if (process.resourcesPath && __dirname.includes("app.asar")) {
    return path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "@imgly",
      "background-removal-node",
      "dist"
    );
  }

  return path.resolve(__dirname, "..", "node_modules", "@imgly", "background-removal-node", "dist");
}

async function processTask(task) {
  if (!task?.inputPath || !task?.outputPath) {
    throw new Error("Background removal task is invalid.");
  }

  const source = new Blob([await fs.readFile(task.inputPath)], { type: getMimeType(task.inputPath) });
  const assetDirectory = `${getAssetDirectory()}${path.sep}`;
  const result = await removeBackground(source, {
    publicPath: pathToFileURL(assetDirectory).href,
    model: "medium",
    output: { format: "image/png", quality: 1 }
  });

  await fs.writeFile(task.outputPath, Buffer.from(await result.arrayBuffer()));
  return { outputPath: task.outputPath };
}

function sendResult(message, exitCode) {
  if (!process.send) {
    process.exit(exitCode);
    return;
  }

  process.send(message, () => process.exit(exitCode));
}

process.once("message", async (task) => {
  try {
    sendResult({ type: "success", result: await processTask(task) }, 0);
  } catch (error) {
    sendResult({
      type: "error",
      error: { message: error instanceof Error ? error.message : "AI background removal failed." }
    }, 1);
  }
});

process.on("disconnect", () => process.exit(0));
