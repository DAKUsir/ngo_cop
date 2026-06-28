import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ImpactLens – NGO Impact Reporting Copilot",
  description:
    "AI-powered platform for NGOs to automate data cleaning, KPI extraction, impact prediction, and professional report generation.",
  keywords: "NGO, impact reporting, AI, data analytics, beneficiaries, donor report",
  openGraph: {
    title: "ImpactLens",
    description: "Turn raw NGO data into professional impact reports in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark text-slate-200 font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#1A1730",
              border: "1px solid rgba(108,99,255,0.25)",
              color: "#E2E8F0",
            },
          }}
        />
      </body>
    </html>
  );
}
