// frontend/pages/index.js
import { useEffect, useState } from "react";
import api from "../lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Home() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  const [teamName, setTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState("");

  useEffect(() => {
    fetchTeams();
    const token = localStorage.getItem("token");
    if (token) {
      fetchUsers();
    }
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

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.warn("Не удалось загрузить игроков:", err?.response?.status);
      setUsers([]); // просто не показываем игроков, если нет доступа
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

  const createPlayer = async () => {
    if (!playerName.trim() || !playerEmail.trim()) return;
    try {
      await api.post("/users", {
        name: playerName,
        email: playerEmail,
        teamId: playerTeamId || null,
      });
      setPlayerName("");
      setPlayerEmail("");
      setPlayerTeamId("");
      fetchUsers();
      toast.success("Игрок создан");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка при создании игрока");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        🔥 Ravage League 🔥
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

      {/* Список команд */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Список команд</h2>
        <ul className="space-y-2">
          {teams.map((team) => (
            <li key={team.id} className="border p-3 rounded-lg flex justify-between">
              <span>{team.name}</span>
              <Link href={`/teams/${team.id}`} className="text-blue-600 hover:underline">
                Смотреть
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Создание игрока */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Создать игрока</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Имя игрока"
            className="border px-4 py-2 rounded-lg"
          />
          <input
            value={playerEmail}
            onChange={(e) => setPlayerEmail(e.target.value)}
            placeholder="Email игрока"
            className="border px-4 py-2 rounded-lg"
          />
          <select
            value={playerTeamId}
            onChange={(e) => setPlayerTeamId(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="">Без команды</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            onClick={createPlayer}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Создать
          </button>
        </div>
      </div>

      {/* Список игроков */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Список игроков</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">
            Только авторизованные пользователи могут видеть игроков
          </p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="border p-3 rounded-lg flex justify-between"
              >
                <span>
                  {user.name} ({user.email})
                </span>
                <span className="text-gray-500">
                  {user.memberships && user.memberships.length > 0
                    ? user.memberships.find((m) => !m.leftAt)?.team?.name || "В команде"
                    : "Без команды"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
