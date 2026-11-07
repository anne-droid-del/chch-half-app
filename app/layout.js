import "./globals.css";

export const metadata = {
  title: "Chch Run",
  description: "Christchurch Half Marathon Training App",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  themeColor: "#1b382b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#1b382b" />
      </head>
      <body>{children}</body>
    </html>
  );
}
