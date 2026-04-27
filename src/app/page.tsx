import {
  LandingNav,
  Hero,
  Mission,
  Stacks,
  Affiliations,
  LandingFooter,
} from "@/components/landing";
import "@/components/landing/landing.css";

/**
 * Landing page.
 *
 * Composition only — every section lives in its own component under
 * `src/components/landing/`. Static copy / lists live in `data.ts`.
 * Page-specific styling is fully scoped under `.lucid-landing` so it
 * cannot leak into the rest of the app (e.g. /screening, /report).
 */
export default function LandingPage() {
  return (
    <div className="lucid-landing" data-theme="default">
      <LandingNav />
      <Hero />
      <Mission />
      <Stacks />
      <Affiliations />
      <LandingFooter />
    </div>
  );
}
