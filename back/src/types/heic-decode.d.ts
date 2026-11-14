/** `heic-decode` ships no types: the part of its API used by `utils/heic.ts`. */
declare module "heic-decode" {
  interface DecodedImage {
    width: number;
    height: number;
    /** RGBA, 4 bytes per pixel. */
    data: Uint8ClampedArray;
  }
  interface HeicImage {
    width: number;
    height: number;
    decode(): Promise<DecodedImage>;
  }
  function decode(input: { buffer: ArrayBufferLike | Uint8Array }): Promise<DecodedImage>;
  namespace decode {
    function all(input: { buffer: ArrayBufferLike | Uint8Array }): Promise<HeicImage[] & { dispose(): void }>;
  }
  export = decode;
}
