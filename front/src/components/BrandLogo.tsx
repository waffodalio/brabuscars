/** Brand mark: the car of the logo in a slanted grey frame, then the wordmark. */
export function BrandLogo() {
  return (
    <span className="chc-logo">
      <span className="chc-logo-badge" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG, no optimisation needed */}
        <img src="/images/logo-car.png" alt="" width={304} height={72} />
      </span>
      <span className="chc-logo-word">BrabusCars</span>
    </span>
  );
}
