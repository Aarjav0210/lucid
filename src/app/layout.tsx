import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Lucid — Biosecurity Infrastructure",
  description: "The complete security layer for bioengineering. Sequence screening, KYC audits, virtual cell models, protocol simulations, and outbreak surveillance.",
  openGraph: {
    title: "Lucid — Biosecurity Infrastructure",
    description:
      "The complete security layer for bioengineering. Sequence screening, KYC audits, virtual cell models, protocol simulations, and outbreak surveillance.",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 537,
        alt: "Lucid Biosecurity Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucid — Biosecurity Infrastructure",
    description:
      "The complete security layer for bioengineering. Sequence screening, KYC audits, virtual cell models, protocol simulations, and outbreak surveillance.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bauhaus-bg text-bauhaus-black antialiased font-outfit">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
