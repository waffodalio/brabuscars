import Alert from "react-bootstrap/Alert";

/**
 * The recurring `{error && <Alert variant="danger">{error}</Alert>}` block,
 * as a component: renders nothing when there's no message, so call sites
 * don't need the guard themselves.
 */
export function ErrorAlert({
  message,
  className,
}: {
  message: string | undefined;
  className?: string;
}) {
  if (!message) return null;
  return (
    <Alert variant="danger" className={className}>
      {message}
    </Alert>
  );
}
