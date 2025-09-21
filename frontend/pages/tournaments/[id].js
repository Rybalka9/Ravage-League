// frontend/pages/tournaments/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

export default function TournamentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      setTournament(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить турнир");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const teamId = prompt("Введите ID вашей команды для регистрации:");
      if (!teamId) return;

      await api.post(`/registrations/${id}`, { teamId: parseInt(teamId) });
      toast.success("Вы зарегистрировались в турнир!");
      fetchTournament();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка при регистрации");
    }
  };

  if (loading) return <p className="p-8">Загрузка...</p>;
  if (!tournament) return <p className="p-8">Турнир не найден</p>;

  const progress =
    tournament.maxTeams > 0
      ? Math.round((tournament.currentTeams / tournament.maxTeams) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          {tournament.name}
        </h1>

        {/* 📌 Информация */}
        <div className="space-y-2 mb-6">
          <p>
            <b>Дивизион:</b> {tournament.division?.name}
          </p>
          <p>
            <b>Формат:</b> {tournament.format}
          </p>
          <p>
            <b>Тип:</b> {tournament.type}
          </p>
          <p>
            <b>Статус:</b> {tournament.status}
          </p>
          <p>
            <b>Дата начала:</b>{" "}
            {new Date(tournament.startDate).toLocaleString()}
          </p>
          {tournament.endDate && (
            <p>
              <b>Дата окончания:</b>{" "}
              {new Date(tournament.endDate).toLocaleString()}
            </p>
          )}
          {tournament.prize && (
            <p>
              <b>Приз:</b> {tournament.prize}$
            </p>
          )}
        </div>

        {/* 📌 Прогресс заполненности */}
        <div className="mb-6">
          <p className="mb-2 font-semibold">
            Команды: {tournament.currentTeams}/{tournament.maxTeams || "∞"}
          </p>
          {tournament.maxTeams && (
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* 📌 Кнопка регистрации */}
        {tournament.status === "upcoming" && (
          <button
            onClick={handleRegister}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Зарегистрировать команду
          </button>
        )}

        {/* 📌 Список зарегистрированных команд */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Зарегистрированные команды
          </h2>
          {tournament.registrations.length === 0 ? (
            <p className="text-gray-500">Пока нет команд</p>
          ) : (
            <ul className="space-y-2">
              {tournament.registrations.map((reg) => (
                <li
                  key={reg.id}
                  className="border p-3 rounded-lg flex justify-between"
                >
                  <span>{reg.team.name}</span>
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      reg.status === "registered"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {reg.status === "registered" ? "✅ В игре" : "⏳ В листе ожидания"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 📌 Правила */}
        {tournament.rules && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Правила турнира</h2>
            <p className="whitespace-pre-line">{tournament.rules}</p>
          </div>
        )}
      </div>
    </div>
  );
}
