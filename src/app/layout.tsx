import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYE tradition — Secret friend, enemy & cooking",
  description:
    "NYE tradition: join an event, then get your private assignments for the group chat.",
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
