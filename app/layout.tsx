import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kairos — Visual Task Journeys",
  description: "A visual task tracker that turns work into clear, actionable journeys.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Kairos — Visual Task Journeys",
    description: "See work move forward.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kairos visual task journeys" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairos — Visual Task Journeys",
    description: "See work move forward.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
