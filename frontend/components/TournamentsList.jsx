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
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 text-center">
        Загрузка турниров...
      </div>
    );
  }

  if (!tournaments.length) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 text-center text-gray-500">
        Турниры пока не созданы
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4">🔥 Ближайшие турниры</h2>
      <ul className="space-y-3">
        {tournaments.map((tournament) => (
          <li
            key={tournament.id}
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg">{tournament.name}</h3>
              <p className="text-sm text-gray-600">
                Дивизион: {tournament.division?.name || "—"} | Формат:{" "}
                {tournament.format}
              </p>
              <p className="text-sm text-gray-600">
                {tournament.startDate
                  ? new Date(tournament.startDate).toLocaleDateString()
                  : "Дата не указана"}{" "}
                –{" "}
                {tournament.endDate
                  ? new Date(tournament.endDate).toLocaleDateString()
                  : "?"}
              </p>
              <p className="text-sm text-gray-600">
                Зарегистрировано: {tournament.registrations?.length || 0}/
                {tournament.maxTeams || "∞"}
              </p>
              <span
                className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  tournament.status === "upcoming"
                    ? "bg-yellow-200 text-yellow-800"
                    : tournament.status === "ongoing"
                    ? "bg-green-200 text-green-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {tournament.status || "upcoming"}
              </span>
            </div>
            <Link
              href={`/tournaments/${tournament.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Подробнее
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
