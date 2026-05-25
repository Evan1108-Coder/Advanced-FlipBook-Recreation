import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advanced FlipBook Recreation",
  description: "Local-first AI visual knowledge workspace.",
  icons: []
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
