import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  localizeErrorMessage,
  readStoredLanguage,
  syncDocumentLanguage,
  translate,
  translations,
  writeStoredLanguage
} from "../components/home/i18n";

function placeholders(value: string) {
  return [...value.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => match[1]).sort();
}

describe("i18n translations", () => {
  it("keeps both locales complete and non-empty", () => {
    const chineseKeys = Object.keys(translations["zh-CN"]).sort();
    const englishKeys = Object.keys(translations["en-US"]).sort();

    expect(englishKeys).toEqual(chineseKeys);
    expect(chineseKeys.length).toBeGreaterThan(100);
    for (const language of ["zh-CN", "en-US"] as const) {
      for (const value of Object.values(translations[language])) {
        expect(value.trim()).not.toBe("");
      }
    }
  });

  it("uses the same placeholders for every translated key", () => {
    for (const key of Object.keys(translations["zh-CN"]) as Array<keyof typeof translations["zh-CN"]>) {
      expect(placeholders(translations["en-US"][key]), key).toEqual(placeholders(translations["zh-CN"][key]));
    }
  });

  it("translates static and parameterized copy without losing zero values", () => {
    expect(translate("zh-CN", "mode.matchLayout.label")).toBe("版式匹配");
    expect(translate("en-US", "mode.matchLayout.label")).toBe("Match Layout");
    expect(translate("zh-CN", "layout.offset", { x: 0, y: -12 })).toBe("偏移 0, -12 px");
    expect(translate("en-US", "history.successTitle", { name: "demo.png", summary: "PNG" })).toBe(
      "demo.png → PNG"
    );
    expect(translate("en-US", "export.outputTo", { path: "C:/Images" })).not.toMatch(/\{\w+\}/);
  });

  it("covers all tool labels and descriptions in both languages", () => {
    const toolKeys = ["convert", "compress", "removeBackground", "matchLayout", "crop", "resize", "export"] as const;

    for (const language of ["zh-CN", "en-US"] as const) {
      for (const tool of toolKeys) {
        expect(translations[language][`mode.${tool}.label`]).not.toBe("");
        expect(translations[language][`mode.${tool}.description`]).not.toBe("");
      }
    }
  });

  it("localizes known, concatenated, and legacy backend errors", () => {
    expect(localizeErrorMessage("AI background removal failed.", "zh-CN")).toBe("智能抠图失败。");
    expect(
      localizeErrorMessage(
        "Job id is required. Output format must be jpeg, png, or webp.",
        "zh-CN"
      )
    ).toBe("缺少任务编号。 输出格式必须是 JPG、PNG 或 WEBP。");
    expect(localizeErrorMessage("Quality must be between 1 and 100.", "zh-CN")).toBe(
      "质量必须是 1 到 100 之间的整数。"
    );
    expect(localizeErrorMessage("AI background removal failed.", "en-US")).toBe(
      "AI background removal failed."
    );
  });

  it("localizes every dashboard fallback while preserving its English form", () => {
    const fallbacks = [
      ["Desktop processing is unavailable. Run the installed app.", "桌面处理服务不可用，请运行安装后的应用。"],
      ["Failed to load the preview.", "预览加载失败。"],
      ["Choose a reference image first.", "请先选择参考图。"],
      ["Unable to reliably detect and match the subject.", "无法可靠识别并匹配主体。"],
      ["Failed to load the compressed preview.", "压缩预览加载失败。"],
      ["The current environment is unavailable.", "当前环境不可用"],
      ["Failed to estimate output size.", "大小估算失败。"],
      ["The file picker is unavailable. Run the installed app.", "文件选择器不可用，请运行安装后的应用。"],
      ["Failed to import images.", "图片导入失败。"],
      ["The reference image picker is unavailable. Run the installed app.", "参考图选择器不可用，请运行安装后的应用。"],
      ["Failed to analyze the reference image.", "参考图分析失败。"],
      ["The folder picker is unavailable. Run the installed app.", "文件夹选择器不可用，请运行安装后的应用。"],
      ["Failed to choose the output folder.", "输出文件夹选择失败。"],
      ["Image processing is unavailable. Run the installed app.", "图片处理服务不可用，请运行安装后的应用。"],
      ["Draw a crop area before exporting.", "请先绘制裁剪区域再导出。"],
      ["Enter at least a width or height.", "请至少填写宽度或高度。"],
      ["Choose a valid reference image first.", "请先选择有效的参考图。"],
      ["Wait for layout analysis or preview to finish before exporting.", "请等待版式分析或预览完成后再导出。"],
      ["There are no target images to export. Reset or replace failed images.", "没有可导出的目标图，请重置或替换处理失败的图片。"],
      ["Layout matching failed.", "版式匹配失败。"],
      ["Unknown processing error.", "未知处理错误。"],
      ["Batch processing failed.", "批量处理失败。"]
    ] as const;

    for (const [english, chinese] of fallbacks) {
      expect(localizeErrorMessage(english, "en-US")).toBe(english);
      expect(localizeErrorMessage(english, "zh-CN")).toBe(chinese);
    }
  });

  it("keeps unknown details in English and uses a safe Chinese fallback", () => {
    expect(localizeErrorMessage("Unexpected codec failure: 42", "en-US")).toBe(
      "Unexpected codec failure: 42"
    );
    expect(localizeErrorMessage("Unexpected codec failure: 42", "zh-CN")).toBe(
      "处理失败，请检查图片后重试。"
    );
  });

  it("removes Electron IPC prefixes and localizes worker exit details", () => {
    expect(
      localizeErrorMessage(
        "Error invoking remote method 'image:preview-job': Error: Failed to read image size.",
        "zh-CN"
      )
    ).toBe("无法读取图片尺寸。");
    expect(localizeErrorMessage("Image worker exited with code 7.", "zh-CN")).toBe(
      "图片处理进程异常退出（代码 7）。"
    );
  });
});

describe("language persistence", () => {
  it("uses a stable default and storage key", () => {
    expect(DEFAULT_LANGUAGE).toBe("zh-CN");
    expect(LANGUAGE_STORAGE_KEY).toBe("image-shift.language");
  });

  it("reads only supported stored languages", () => {
    expect(readStoredLanguage({ getItem: () => "en-US" })).toBe("en-US");
    expect(readStoredLanguage({ getItem: () => "zh-CN" })).toBe("zh-CN");
    expect(readStoredLanguage({ getItem: () => "fr-FR" })).toBe(DEFAULT_LANGUAGE);
    expect(readStoredLanguage({ getItem: () => null })).toBe(DEFAULT_LANGUAGE);
  });

  it("writes the selected language using the stable key", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };

    writeStoredLanguage(storage, "en-US");
    expect(values.get(LANGUAGE_STORAGE_KEY)).toBe("en-US");
    expect(readStoredLanguage(storage)).toBe("en-US");
  });

  it("falls back safely when storage is unavailable", () => {
    expect(
      readStoredLanguage({
        getItem: () => {
          throw new Error("blocked");
        }
      })
    ).toBe(DEFAULT_LANGUAGE);

    expect(() => writeStoredLanguage({ setItem: () => { throw new Error("blocked"); } }, "en-US")).not.toThrow();
    expect(readStoredLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
  });

  it("synchronizes the HTML language without requiring a real DOM", () => {
    const documentLike = { documentElement: { lang: "zh-CN" } };

    syncDocumentLanguage(documentLike, "en-US");
    expect(documentLike.documentElement.lang).toBe("en-US");
    expect(() => syncDocumentLanguage(undefined, "zh-CN")).not.toThrow();
  });
});

function compileTimeAssertions() {
  translate("en-US", "export.outputTo", { path: "C:/Images" });

  // @ts-expect-error Placeholder names are checked per translation key.
  translate("en-US", "export.outputTo", { outputPath: "C:/Images" });
  // @ts-expect-error Parameterized keys require their interpolation values.
  translate("en-US", "export.outputTo");
  // @ts-expect-error Static keys do not accept arbitrary parameters.
  translate("en-US", "common.clear", { value: "unused" });
  // @ts-expect-error Translation keys are a closed union.
  translate("en-US", "missing.translation.key");
}

void compileTimeAssertions;
