// frontend/components/Layout.jsx
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f33] via-[#0b3d2e] to-[#122b42] text-white">
      <Navbar />
      <main className="pt-20 max-w-6xl mx-auto px-6">{children}</main>
    </div>
  );
}
