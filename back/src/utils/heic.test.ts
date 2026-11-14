import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { processImage } from "../services/imageProcessor";
import { isHeic } from "./heic";

/** 64 × 48 photo saved as HEIC by macOS, then rotated a quarter turn (`irot`). */
const ROTATED_HEIC = readFileSync(join(__dirname, "__fixtures__", "rotated-64x48.heic"));

describe("isHeic", () => {
  it("recognises an iPhone HEIC by its ftyp brand", () => {
    expect(isHeic(ROTATED_HEIC)).toBe(true);
  });

  it("does not take other files for HEIC (AVIF, JPEG, too short)", () => {
    const avif = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from("ftypavif")]);
    expect(isHeic(avif)).toBe(false);
    expect(isHeic(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]))).toBe(false);
    expect(isHeic(Buffer.from("ftyp"))).toBe(false);
  });
});

describe("processImage with HEIC", () => {
  it("converts it to WebP, the camera rotation applied", async () => {
    const result = await processImage(ROTATED_HEIC);
    expect(result.mimeType).toBe("image/webp");
    expect([result.width, result.height]).toEqual([48, 64]);
    expect(result.full.subarray(8, 12).toString("latin1")).toBe("WEBP");
  });

  it("refuses an unreadable HEIC with a clear message", async () => {
    const broken = ROTATED_HEIC.subarray(0, 40);
    await expect(processImage(broken)).rejects.toThrow("Le fichier HEIC n'est pas lisible");
  });
});
