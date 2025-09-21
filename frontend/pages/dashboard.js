// frontend/pages/dashboard.js
import { useEffect, useState } from "react";
import api from "../lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import InvitesList from "../components/InvitesList"; // создадим этот компонент

export default function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get("/teams");
      setTeams(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить команды");
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    try {
      await api.post("/teams", { name: teamName });
      setTeamName("");
      fetchTeams();
      toast.success("Команда создана");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка при создании команды");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        Мой дашборд
      </h1>

      {/* Создание команды */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Создать команду</h2>
        <div className="flex gap-2">
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Название команды"
            className="border px-4 py-2 rounded-lg flex-1"
          />
          <button
            onClick={createTeam}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Создать
          </button>
        </div>
      </div>

      {/* Мои приглашения */}
      <InvitesList />

      {/* Список команд */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Мои команды</h2>
        <ul className="space-y-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className="border p-3 rounded-lg flex justify-between"
            >
              <span>{team.name}</span>
              <Link
                href={`/teams/${team.id}`}
                className="text-blue-600 hover:underline"
              >
                Смотреть
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
