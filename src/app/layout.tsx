import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucid — Sequence Risk Screening",
  description: "Biosecurity sequence screening tool",
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
      </body>
    </html>
  );
}
