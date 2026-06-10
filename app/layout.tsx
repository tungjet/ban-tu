import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { FooterClient } from "@/components/FooterClient";
import ReferralCapture from "@/components/ReferralCapture";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://noithatgiare.shop'),
  title: "Tủ Nhựa Giá Rẻ | Nội thất cao cấp, chống nước 100%",
  description: "Chuyên cung cấp tủ quần áo, giường, tủ bếp nhựa Đài Loan, Ecoplast, nhôm kính với chất lượng hàng đầu. Bảo hành 10 năm.",
  openGraph: {
    title: "Tủ Nhựa Giá Rẻ | Nội thất nhựa và nhôm cao cấp",
    description: "Giải pháp nội thất hoàn hảo chống mối mọt, chống nước 100% cho gia đình bạn.",
    url: "https://noithatgiare.shop",
    siteName: "Tủ Nhựa Giá Rẻ",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tủ Nhựa Giá Rẻ",
    description: "Chuyên cung cấp nội thất nhựa Đài Loan, Ecoplast chất lượng hàng đầu.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className={`${inter.variable} font-sans min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <SessionProvider>
          <Suspense fallback={<div className="h-16 border-b border-slate-200 bg-white" />}>
            <Header />
          </Suspense>
          <CartDrawer />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "12px",
                background: "#1e293b",
                color: "#f8fafc",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#f8fafc" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#f8fafc" },
              },
            }}
          />
          <div className="flex-1 w-full">
            {children}
          </div>
          <FooterClient />
          <ReferralCapture />
        </SessionProvider>
      </body>
    </html>
  );
}
