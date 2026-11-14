/**
 * HEIC / HEIF — the default photo format of iPhones. sharp's prebuilt
 * libvips cannot decode it (HEVC is patent-encumbered, only AVIF is
 * bundled), so these photos are decoded by libheif compiled to WebAssembly
 * (`heic-decode`), then handed to sharp as raw pixels.
 */

/** Major brands of an HEIC / HEIF file (`ftyp` box at offset 4). */
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);

export function isHeic(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("latin1", 4, 8) === "ftyp" &&
    HEIF_BRANDS.has(buffer.toString("latin1", 8, 12))
  );
}

export interface RawImage {
  width: number;
  height: number;
  /** RGBA pixels. */
  data: Buffer;
}

/**
 * Decodes the main image of an HEIC file, the camera's rotation applied.
 * Its size is checked before decoding (`maxPixels`): an oversized image
 * never reaches memory. Throws on an unreadable file.
 */
export async function decodeHeic(buffer: Buffer, maxPixels: number): Promise<RawImage> {
  // Loaded on first use: the WebAssembly module weighs a few MB.
  const { default: decode } = await import("heic-decode");
  const images = await decode.all({ buffer });
  try {
    const main = images[0];
    if (!main) throw new Error("No image in the HEIC file");
    if (main.width * main.height > maxPixels) throw new RangeError("HEIC image too large");
    const { width, height, data } = await main.decode();
    return { width, height, data: Buffer.from(data.buffer, data.byteOffset, data.byteLength) };
  } finally {
    images.dispose();
  }
}
