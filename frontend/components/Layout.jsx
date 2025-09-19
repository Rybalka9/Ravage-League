// frontend/components/Layout.jsx
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}

function Header() {
  const { token, role, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          Ravage League
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:underline"> Главная </Link>
          <Link href="/teams" className="hover:underline"> Команды </Link>
          <Link href="/tournaments" className="hover:underline"> Турниры </Link>

          {token ? (
            <>
              {role === "admin" && (
                <Link href="/admin" className="ml-2 px-3 py-1 rounded border"> Админка </Link>
              )}
              <button
                onClick={logout}
                className="ml-4 text-sm bg-red-500 text-white px-3 py-1 rounded"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2"> Войти </Link>
              <Link href="/register" className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"> Регистрация </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
