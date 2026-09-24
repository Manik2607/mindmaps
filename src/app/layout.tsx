import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Flowy — Infinite Canvas Workspace",
  description: "Flowy is a unified infinite canvas workspace combining Notion-style docs, Excalidraw drawings, Kanban boards, image references, and mind maps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="h-full overflow-hidden flex flex-col bg-canvas text-text-main"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
