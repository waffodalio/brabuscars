type Props = {
  /** Translated alternative text. */
  label: string;
};

/**
 * Full-bleed background photo of the home banner: a Lamborghini Huracán on a
 * sunlit country road — a still taken from Andi Dautaj's footage. The car sits
 * left of centre; the text and the "See listings" button are on the right
 * (`.chc-hero-bg` / `.chc-hero-veil`). Served from `public/images` (no
 * third-party request) as WebP at two widths, number plate blurred.
 *
 * Source: Andi Dautaj on Pexels (Pexels License — free commercial use,
 * attribution not required): https://www.pexels.com/video/20153917/
 */
export function HeroCarPhoto({ label }: Props) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-lambo-1600.webp"
        srcSet="/images/hero-lambo-960.webp 960w, /images/hero-lambo-1600.webp 1600w"
        sizes="(min-width: 1200px) 1140px, 100vw"
        width={1600}
        height={900}
        alt={label}
        fetchPriority="high"
        className="chc-hero-bg"
      />
      <div className="chc-hero-veil" aria-hidden="true" />
    </>
  );
}
