import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Layout from "@/components/layout/Layout";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resto",
  description: "Resto",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Layout>{children}</Layout>
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
              className: "!bg-white !text-neutral-900 dark:!bg-neutral-900 dark:!text-white border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
