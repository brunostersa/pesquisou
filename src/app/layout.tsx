import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AdminModeProvider } from "@/contexts/AdminModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pesquisou - Sistema de Feedback com QR Codes",
  description: "Sistema web para empresários gerarem QR Codes para diferentes áreas da empresa e receberem feedbacks anônimos dos clientes.",
  keywords: "feedback, qr code, pesquisa, cliente, empresa",
  authors: [{ name: "Pesquisou" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <AdminModeProvider>
            {children}
          </AdminModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
