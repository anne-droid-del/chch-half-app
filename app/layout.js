import "./globals.css";

export const metadata = {
  title: "Chch Half 2027 Tracker",
  description: "Aerobic Half Marathon Training App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
