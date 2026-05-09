import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klarity VoiceNote",
  description: "AI voice intake that turns patient conversations into provider-reviewed mental health notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col">{children}</body>
    </html>
  );
}
