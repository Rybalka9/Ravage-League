// frontend/pages/index.js
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { motion } from "framer-motion";

export default function Home() {
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await api.get("/teams");
      return res.data;
    },
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await api.get("/tournaments");
      return res.data;
    },
  });

  return (
    <div className="flex flex-col items-center">
      {/* Баннер */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl bg-gradient-to-r from-green-900 to-blue-900 rounded-xl shadow-lg p-10 text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-green-300 mb-4">
          🔥 Ravage League 🔥
        </h1>
        <p className="text-lg text-gray-200 mb-6">
          Испытай силы в честных матчах. Собери команду и докажи, что ты лучший!
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/tournaments"
            className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-white transition transform hover:scale-105"
          >
            Смотреть турниры
          </Link>
          <Link
            href="/teams"
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-white transition transform hover:scale-105"
          >
            Смотреть команды
          </Link>
        </div>
      </motion.div>

      {/* Центральный блок */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-5xl bg-black/90 rounded-xl shadow-xl p-8 space-y-8"
      >
        {/* Текущие турниры */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Текущие турниры</h2>
            <Link href="/tournaments" className="text-green-400 hover:underline">
              Все турниры →
            </Link>
          </div>
          {tournaments.length > 0 ? (
            <ul className="space-y-2">
              {tournaments.map((t) => (
                <motion.li
                  key={t.id}
                  whileHover={{ scale: 1.03 }}
                  className="bg-gray-800 p-3 rounded-lg shadow transition"
                >
                  {t.name}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">Турниры пока не созданы</p>
          )}
        </section>

        {/* Лучшие команды */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Лучшие команды</h2>
            <Link href="/teams" className="text-green-400 hover:underline">
              Все команды →
            </Link>
          </div>
          {teams.length > 0 ? (
            <ul className="space-y-2">
              {teams.map((team) => (
                <motion.li
                  key={team.id}
                  whileHover={{ scale: 1.03 }}
                  className="bg-gray-800 p-3 rounded-lg shadow transition"
                >
                  {team.name}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">Команды пока не созданы</p>
          )}
        </section>

        {/* Новости */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Новости лиги</h2>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-900/60 text-green-200 p-4 rounded-lg shadow"
          >
            📢 Старт регистрации на первый сезон Ravage League! Подай заявку на
            участие.
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}
