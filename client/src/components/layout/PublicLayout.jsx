// components/layout/PublicLayout.jsx
import Footer from "./Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#1d1d1f]">
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
