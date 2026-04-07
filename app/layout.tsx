import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image-Shift",
  description: "Local-first desktop batch image processing for Windows"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
