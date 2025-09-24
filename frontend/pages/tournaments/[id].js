import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function TournamentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    if (id) fetchTournament();
    fetchMyTeams();
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

  const fetchMyTeams = async () => {
    try {
      const res = await api.get("/teams/my");
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async () => {
    if (!selectedTeam) {
      toast.error("Выберите команду для регистрации!");
      return;
    }
    try {
      await api.post(`/registrations/${id}`, { teamId: parseInt(selectedTeam) });
      toast.success("Вы зарегистрировались в турнир!");
      fetchTournament();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка при регистрации");
    }
  };

  if (loading) return <p className="p-8 text-white">Загрузка...</p>;
  if (!tournament) return <p className="p-8 text-white">Турнир не найден</p>;

  const progress =
    tournament.maxTeams > 0
      ? Math.round((tournament.currentTeams / tournament.maxTeams) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f33] via-[#0b3d2e] to-[#122b42] p-8 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        {/* 🔥 Шапка */}
        <div className="bg-gradient-to-r from-green-700 to-blue-700 p-8 rounded-2xl shadow-lg mb-8">
          <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
          <p className="opacity-80">
            {tournament.division?.name} • {tournament.format} • {tournament.type}
          </p>
        </div>

        {/* 📌 Информация */}
        <div className="bg-[#0f1e2e] p-6 rounded-xl shadow mb-6 space-y-2">
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

        {/* 📌 Прогресс */}
        {tournament.maxTeams && (
          <div className="bg-[#0f1e2e] p-6 rounded-xl shadow mb-6">
            <p className="mb-2 font-semibold">
              Команды: {tournament.currentTeams}/{tournament.maxTeams}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 📌 Регистрация */}
        {tournament.status === "upcoming" && (
          <div className="bg-[#0f1e2e] p-6 rounded-xl shadow mb-6">
            <h2 className="text-lg font-semibold mb-3">Регистрация</h2>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 mr-3"
            >
              <option value="">-- Выберите команду --</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRegister}
              className="bg-green-600 px-5 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Зарегистрировать
            </button>
          </div>
        )}

        {/* 📌 Список команд */}
        <div className="bg-[#0f1e2e] p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Команды</h2>
          {tournament.registrations.length === 0 ? (
            <p className="text-gray-400">Пока нет команд</p>
          ) : (
            <ul className="space-y-2">
              {tournament.registrations.map((reg) => (
                <li
                  key={reg.id}
                  className="flex justify-between items-center bg-[#182c3d] p-3 rounded-lg"
                >
                  <span>{reg.team.name}</span>
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      reg.status === "registered"
                        ? "bg-green-600 text-white"
                        : "bg-yellow-600 text-white"
                    }`}
                  >
                    {reg.status === "registered"
                      ? "✅ В игре"
                      : "⏳ В листе ожидания"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 📌 Правила */}
        {tournament.rules && (
          <div className="bg-[#0f1e2e] p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Правила турнира</h2>
            <p className="whitespace-pre-line text-gray-300">
              {tournament.rules}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
