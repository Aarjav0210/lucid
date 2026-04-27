import Link from "next/link";

interface BrandProps {
  href?: string;
}

/** The concentric-circle Lucid wordmark used in the nav and footer. */
export function Brand({ href = "/" }: BrandProps) {
  return (
    <Link href={href} className="brand">
      <span className="brand-mark" aria-hidden="true" />
      <span>
        Lucid <span className="brand-suffix">Bio</span>
      </span>
    </Link>
  );
}
