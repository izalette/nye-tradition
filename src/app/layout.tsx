import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYE tradition — Secret friend, enemy & cooking",
  description:
    "Welcome to the NYE Group: three games each year — secret friend, secret enemy, and NYE cooking partner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
