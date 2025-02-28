import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manga Reader",
  description:
    "Read the latest mangas out there in a simple and easy to use website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialised`}>{children}</body>
    </html>
  );
}
