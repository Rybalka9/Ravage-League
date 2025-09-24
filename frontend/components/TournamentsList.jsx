import { useEffect, useState } from "react";
import api from "../lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

export default function TournamentsList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await api.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error("Ошибка загрузки турниров:", err);
      toast.error("Не удалось загрузить турниры");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0f1e2e] p-6 rounded-2xl shadow-md mb-8 text-center text-white">
        Загрузка турниров...
      </div>
    );
  }

  if (!tournaments.length) {
    return (
      <div className="bg-[#0f1e2e] p-6 rounded-2xl shadow-md mb-8 text-center text-gray-300">
        Турниры пока не созданы
      </div>
    );
  }

  return (
    <div className="bg-[#0f1e2e] p-6 rounded-2xl shadow-md mb-8 text-white">
      <h2 className="text-2xl font-bold mb-6 text-green-400">🔥 Ближайшие турниры</h2>
      <ul className="space-y-4">
        {tournaments.map((tournament) => (
          <li
            key={tournament.id}
            className="bg-[#182c3d] border border-gray-700 p-5 rounded-xl flex justify-between items-center hover:border-green-500 transition"
          >
            <div>
              <h3 className="font-bold text-lg text-white">{tournament.name}</h3>
              <p className="text-sm text-gray-400">
                Дивизион: {tournament.division?.name || "—"} | Формат:{" "}
                {tournament.format}
              </p>
              <p className="text-sm text-gray-400">
                {tournament.startDate
                  ? new Date(tournament.startDate).toLocaleDateString()
                  : "Дата не указана"}{" "}
                –{" "}
                {tournament.endDate
                  ? new Date(tournament.endDate).toLocaleDateString()
                  : "?"}
              </p>
              <p className="text-sm text-gray-400">
                Зарегистрировано: {tournament.registrations?.length || 0}/
                {tournament.maxTeams || "∞"}
              </p>
              <span
                className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  tournament.status === "upcoming"
                    ? "bg-yellow-600 text-white"
                    : tournament.status === "ongoing"
                    ? "bg-green-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                {tournament.status || "upcoming"}
              </span>
            </div>
            <Link
              href={`/tournaments/${tournament.id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Подробнее
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
