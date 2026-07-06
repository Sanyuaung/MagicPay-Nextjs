import type { Metadata } from "next";
import "./globals.css";
import { PageTitleSync } from "@/components/PageTitleSync";
import { GlobalRequestLoader } from "@/components/GlobalRequestLoader";

export const metadata: Metadata = {
  title: "Magic Pay",
  description: "Magic Pay Next.js migration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/backend/assets/images/favicon.ico" />
        <link rel="stylesheet" href="/backend/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/backend/assets/css/app.min.css" />
        <link rel="stylesheet" href="/backend/assets/css/icons.min.css" />
        <link rel="stylesheet" href="/frontend/css/style.css" />
        <link rel="stylesheet" href="/css/toastify.min.css" />
        <link rel="stylesheet" href="/css/daterangepicker.css" />
      </head>
      <body>
        <PageTitleSync />
        <GlobalRequestLoader />
        {children}
      </body>
    </html>
  );
}
