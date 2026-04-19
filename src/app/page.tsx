"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { getCalApi } from "@calcom/embed-react";

const CAL_LINK = "aarjav-jain/lucid-bio";
import {
  Circle,
  Square,
  Triangle,
  ArrowRight,
  Shield,
  Search,
  Globe,
  FlaskConical,
  Activity,
  Dna,
  Box,
  Fingerprint,
  Layers,
} from "lucide-react";

/* ─── Geometric decorations ─── */

function BauhausLogo() {
  return (
    <div className="flex items-center gap-2">
      <Circle className="w-5 h-5 fill-bauhaus-red text-bauhaus-red" />
      <Square className="w-5 h-5 fill-bauhaus-blue text-bauhaus-blue" />
      <Triangle className="w-5 h-5 fill-bauhaus-yellow text-bauhaus-yellow" />
    </div>
  );
}

/* ─── Product definitions ─── */

type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
  borderColor: string;
  href: string | null;
  featured?: boolean;
};

const products: Product[] = [
  {
    id: "screening",
    name: "Sequence Screening",
    tagline: "Multi-approach biosecurity analysis",
    description:
      "Multi-layered screening that catches harmful sequences standard BLAST-based analysis misses — combining sequence, structural, and functional approaches to flag threats that evade conventional detection.",
    icon: Search,
    accentBg: "bg-bauhaus-blue",
    accentText: "text-white",
    borderColor: "border-bauhaus-blue",
    href: "/screening",
    featured: true,
  },
  {
    id: "kyc",
    name: "Automated KYC Audits",
    tagline: "Know your customer, instantly",
    description:
      "Compliance checks for biological material orders. Flag high-risk actors before synthesis begins.",
    icon: Shield,
    accentBg: "bg-bauhaus-red",
    accentText: "text-white",
    borderColor: "border-bauhaus-red",
    href: null,
  },
  {
    id: "virtual-cell",
    name: "Virtual Cell World Models",
    tagline: "Test novel pathogens safely",
    description:
      "High-fidelity in silico environments to model novel pathogen behavior before any wet-lab work begins.",
    icon: Globe,
    accentBg: "bg-bauhaus-yellow",
    accentText: "text-bauhaus-black",
    borderColor: "border-bauhaus-yellow",
    href: null,
  },
  {
    id: "protocol-sim",
    name: "Protocol Preparedness Simulations",
    tagline: "Hyper-realistic response training",
    description:
      "Full-fidelity outbreak scenario simulations to train teams and stress-test containment protocols.",
    icon: FlaskConical,
    accentBg: "bg-bauhaus-black",
    accentText: "text-white",
    borderColor: "border-bauhaus-black",
    href: null,
  },
  {
    id: "outbreak-tracker",
    name: "Pathogen Outbreak Tracker",
    tagline: "Real-time global surveillance",
    description:
      "Live monitoring of pathogen outbreak signals across global health networks, flagging biosecurity-relevant events as they emerge.",
    icon: Activity,
    accentBg: "bg-bauhaus-red",
    accentText: "text-white",
    borderColor: "border-bauhaus-red",
    href: null,
  },
];

/* ─── Product Card ─── */

function ProductCard({ product, onComingSoon }: { product: Product; onComingSoon: () => void }) {
  const Icon = product.icon;

  const cardContent = (
    <div
      className="group relative flex flex-col h-full border-2 border-bauhaus-black bg-white shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className={`h-1.5 w-full ${product.accentBg}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 flex items-center justify-center ${product.accentBg}`}>
            <Icon className={`w-4 h-4 ${product.accentText}`} />
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/40 mb-1">
          {product.tagline}
        </p>
        <h3 className="text-base font-black uppercase tracking-tighter leading-tight mb-2">
          {product.name}
        </h3>
        <p className="text-xs font-medium text-bauhaus-black/60 leading-relaxed flex-1">
          {product.description}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black">
            Launch
          </span>
          <ArrowRight className="w-3 h-3 text-bauhaus-black transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );

  if (product.href) {
    return (
      <Link
        href={product.href}
        className="contents"
        onClick={() => track("product_click", { product: product.id, name: product.name })}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      onClick={() => {
        track("product_click", { product: product.id, name: product.name });
        onComingSoon();
      }}
      className="contents"
    >
      {cardContent}
    </div>
  );
}

/* ─── Landing Page ─── */

export default function LandingPage() {
  const featured = products.find((p) => p.featured)!;
  const rest = products.filter((p) => !p.featured);

  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const showComingSoon = useCallback(() => setToast(true), []);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "intro" });
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "light",
      });
    })();
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 border-b-4 border-bauhaus-black bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <span className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
            Lucid
          </span>
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
              Biosecurity Infrastructure
            </span>
            <a
              href="mailto:aarjav02@gmail.com"
              className="text-xs font-bold uppercase tracking-widest text-bauhaus-black border-2 border-bauhaus-black px-3 py-1.5 hover:bg-bauhaus-black hover:text-white transition-colors"
            >
              Contact
            </a>
            <button
              data-cal-namespace="intro"
              data-cal-link={CAL_LINK}
              data-cal-config='{"layout":"month_view","theme":"light"}'
              onClick={() => track("book_call_click", { location: "nav" })}
              className="text-xs font-bold uppercase tracking-widest text-white bg-bauhaus-black border-2 border-bauhaus-black px-3 py-1.5 hover:bg-bauhaus-blue hover:border-bauhaus-blue transition-colors"
            >
              Book a Call
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="border-b-4 border-bauhaus-black overflow-x-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left: copy */}
          <div className="lg:col-span-7 py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
              The Complete
              <br />
              <span className="text-bauhaus-red">Security</span>
              <br />
              Layer For
              <br />
              <span className="text-bauhaus-blue">Biosynthesis</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg font-medium text-bauhaus-black/65 max-w-xl leading-relaxed">
              Prevent biosecurity threats before they emerge.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-bauhaus-black text-white font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-black/80 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                Explore Products
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                data-cal-namespace="intro"
                data-cal-link={CAL_LINK}
                data-cal-config='{"layout":"month_view","theme":"light"}'
                onClick={() => track("book_call_click", { location: "hero" })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-bauhaus-black font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                Book a Call
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: geometric Bauhaus panel */}
          <div className="hidden lg:flex lg:col-span-5 border-l-4 border-bauhaus-black relative overflow-hidden">
            {/* Color blocks */}
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 bg-bauhaus-red" />
              <div className="flex-1 bg-bauhaus-yellow" />
              <div className="flex-1 bg-bauhaus-blue" />
            </div>
            {/* Overlapping circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-52 h-52 rounded-full border-[14px] border-white opacity-20" />
            </div>
            {/* Geometric shapes */}
            <div className="absolute bottom-6 right-6 w-32 h-32 bg-bauhaus-black opacity-15" />
            <div className="absolute top-6 left-6 w-20 h-20 bg-white opacity-10" />
            {/* Text overlay */}
            <div className="relative z-10 flex flex-col justify-end p-8">
              <p className="text-white font-black text-4xl uppercase tracking-tighter leading-none opacity-90">
                Bio
                <br />
                Security
                <br />
                Covered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-b-4 border-bauhaus-black bg-bauhaus-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {[
              { label: "Analysis Approaches", value: "4" },
              { label: "Threat Databases", value: "5+" },
              { label: "Products", value: "5" },
              { label: "Coverage", value: "End-to-End" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 text-center px-4 py-1.5">
                <p className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-bauhaus-yellow">
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="products" className="border-b-4 border-bauhaus-black bg-bauhaus-bg scroll-mt-[72px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 bg-bauhaus-black flex items-center justify-center shrink-0">
              <Square className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
              Products
            </h2>
            <div className="flex-1 h-0.5 bg-bauhaus-black/10 ml-2" />
          </div>

          {/* Featured card (Sequence Screening) — full width */}
          <div className="mb-3">
            <Link href={featured.href!} className="block" onClick={() => track("product_click", { product: featured.id, name: featured.name })}>
              <div className="group relative border-2 border-bauhaus-black bg-white shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 overflow-hidden">
                <div className="h-1.5 w-full bg-bauhaus-blue" />
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  {/* Left: text */}
                  <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-bauhaus-blue">
                          <Search className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-600 px-2 py-0.5">
                          Live
                        </span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/40 mb-1.5">
                        {featured.tagline}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-tight mb-3">
                        {featured.name}
                      </h3>
                      <p className="text-sm font-medium text-bauhaus-black/60 leading-relaxed max-w-2xl">
                        {featured.description}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-blue">
                        Launch Tool
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-bauhaus-blue transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                  {/* Right: visual */}
                  <div className="hidden lg:flex bg-bauhaus-blue items-center justify-center p-8 border-l-2 border-bauhaus-black min-h-[200px]">
                    <div className="w-full max-w-[280px]">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 text-center">
                        Analysis Layers
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Sequence", Icon: Dna },
                          { label: "Structure", Icon: Box },
                          { label: "Function", Icon: Fingerprint },
                          { label: "Synergistic", Icon: Layers },
                        ].map(({ label, Icon }) => (
                          <div
                            key={label}
                            className="flex flex-col items-start gap-2 px-3 py-3 border border-white/25 bg-white/5"
                          >
                            <Icon className="w-5 h-5 text-white/90" />
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Remaining 4 products in a 4-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rest.map((product) => (
              <ProductCard key={product.id} product={product} onComingSoon={showComingSoon} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mission Strip ─── */}
      <section className="border-b-4 border-bauhaus-black bg-bauhaus-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/50 mb-3">
              Our Mission
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter leading-tight text-bauhaus-black">
              We&apos;re building the security infrastructure that scales with biology&apos;s potential, so breakthrough science doesn&apos;t become a breakthrough threat.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-bauhaus-black text-white border-t-4 border-bauhaus-black mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-lg font-black uppercase tracking-tighter">
              Lucid
            </span>
            <span className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
              <img src="/Brown University Icon.png" alt="Brown University" className="h-5 w-auto opacity-40 grayscale brightness-200" />
              <img src="/UPenn Shield Icon.png" alt="University of Pennsylvania" className="h-5 w-auto opacity-40 grayscale brightness-200" />
              <img src="/Yale Bulldogs Logo.png" alt="Yale University" className="h-5 w-auto opacity-40 grayscale brightness-200" />
              <img src="/Kings College London Icon.png" alt="King's College London" className="h-5 w-auto opacity-40 grayscale brightness-200" />
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 text-center sm:text-right">
              The Complete Security Layer for Biosynthesis
              <br />
              Sequence &middot; Structure &middot; Function &middot; Surveillance
            </p>
            <div className="flex items-center gap-2">
              <a
                href="mailto:aarjav02@gmail.com"
                className="px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-white/40 text-white/70 hover:bg-white hover:text-bauhaus-black transition-colors"
              >
                Get in Touch
              </a>
              <button
                data-cal-namespace="intro"
                data-cal-link={CAL_LINK}
                data-cal-config='{"layout":"month_view","theme":"light"}'
                onClick={() => track("book_call_click", { location: "footer" })}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-white bg-white text-bauhaus-black hover:bg-bauhaus-blue hover:border-bauhaus-blue hover:text-white transition-colors"
              >
                Book a Call
              </button>
            </div>
          </div>
        </div>
      </footer>
      {/* ─── Toast ─── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="px-5 py-3 bg-bauhaus-black text-white text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_rgba(18,18,18,0.3)]">
          Coming Soon — Stay Tuned
        </div>
      </div>
    </main>
  );
}
