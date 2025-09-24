// frontend/components/Navbar.jsx
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, role, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full bg-[#0a1f33]/95 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/" className="text-2xl font-bold text-green-400">
          Ravage League
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:text-green-400 transition">Главная</Link>
          <Link href="/teams" className="hover:text-green-400 transition">Команды</Link>
          <Link href="/tournaments" className="hover:text-green-400 transition">Турниры</Link>

          {token ? (
            <>
              {role === "admin" && (
                <Link href="/admin" className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 transition">
                  Админка
                </Link>
              )}
              <button
                onClick={logout}
                className="ml-4 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 hover:text-green-400">Войти</Link>
              <Link
                href="/register"
                className="ml-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 transition"
              >
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
