import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: { default: "StudentVoice", template: "%s · StudentVoice" },
  description: "Bilingual, source-protecting civic evidence infrastructure.",
  openGraph: {
    title: "StudentVoice — Evidence, not outrage",
    description: "Verified timelines, protected sources, and accountable public-interest reporting.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "StudentVoice — Evidence, not outrage" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
