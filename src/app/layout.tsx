import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noten-Verwaltung",
  description: "Musiknoten verwalten, hochladen und teilen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
