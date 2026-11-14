import sharp, { type Sharp } from "sharp";
import { ApiError } from "../utils/ApiError";
import { decodeHeic, isHeic } from "../utils/heic";

const ALLOWED_INPUT_FORMATS = new Set(["jpeg", "png", "webp"]);
const FORMAT_ERROR = "Format non supporté (acceptés : JPEG, PNG, WebP, HEIC)";
const MAX_DIMENSION = 2000;
const THUMBNAIL_DIMENSION = 400;
/** ~50 MP — rejects decompression-bomb images well before they hurt. */
const MAX_INPUT_PIXELS = 50_000_000;

export interface ProcessedImage {
  /** Full-size WebP. */
  full: Buffer;
  /** 400 px WebP thumbnail. */
  thumbnail: Buffer;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Opens an upload for processing: JPEG / PNG / WebP straight with sharp,
 * iPhone HEIC decoded first (see `utils/heic.ts`). Anything else is refused.
 */
async function openImage(input: Buffer): Promise<Sharp> {
  if (isHeic(input)) {
    let image;
    try {
      image = await decodeHeic(input, MAX_INPUT_PIXELS);
    } catch (err) {
      throw ApiError.badRequest(
        err instanceof RangeError ? "Image trop grande (50 mégapixels max)" : "Le fichier HEIC n'est pas lisible",
      );
    }
    return sharp(image.data, {
      raw: { width: image.width, height: image.height, channels: 4 },
      limitInputPixels: MAX_INPUT_PIXELS,
    });
  }

  let format: string | undefined;
  try {
    ({ format } = await sharp(input).metadata());
  } catch {
    throw ApiError.badRequest("Le fichier n'est pas une image lisible");
  }
  if (!format || !ALLOWED_INPUT_FORMATS.has(format)) throw ApiError.badRequest(FORMAT_ERROR);
  return sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS });
}

/**
 * Validates an uploaded image and re-encodes it: EXIF/orientation applied then
 * stripped, downscaled to {@link MAX_DIMENSION}, output as WebP, plus a
 * thumbnail. Re-encoding also neutralises embedded payloads.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const pipeline = (await openImage(input)).rotate();

  const full = await pipeline
    .clone()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const thumbnail = await pipeline
    .clone()
    .resize({
      width: THUMBNAIL_DIMENSION,
      height: THUMBNAIL_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    full: full.data,
    thumbnail,
    mimeType: "image/webp",
    width: full.info.width,
    height: full.info.height,
    sizeBytes: full.data.length,
  };
}
