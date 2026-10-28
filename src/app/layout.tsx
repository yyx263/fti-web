import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 将字体注册为 CSS 变量，供全局样式按需引用。
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 全站默认元数据；子页面可定义自己的标题和描述。
export const metadata: Metadata = {
  title: "FTI 手记",
  description: "记录 DIY、插画、摄影作品与日常随笔。",
};

/** 全站根布局，统一语言、字体和导航，children 为当前路由内容。 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Cn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
