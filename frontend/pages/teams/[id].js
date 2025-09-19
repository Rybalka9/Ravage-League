// frontend/pages/teams/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

export default function TeamPage() {
  const router = useRouter();
  const { id } = router.query;

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");

  useEffect(() => {
    if (id) {
      fetchTeam();
    }
  }, [id]);

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data);
      setPlayers(res.data.members || []);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить команду");
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerEmail.trim()) return;
    try {
      await api.post("/users", {
        name: newPlayerName,
        email: newPlayerEmail,
        teamId: id,
      });
      setNewPlayerName("");
      setNewPlayerEmail("");
      fetchTeam();
      toast.success("Игрок добавлен");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка при добавлении игрока");
    }
  };

  if (!team) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">
        Команда: {team.name}
      </h1>

      {/* Добавление игрока */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Добавить игрока</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Имя игрока"
            className="border px-4 py-2 rounded-lg"
          />
          <input
            value={newPlayerEmail}
            onChange={(e) => setNewPlayerEmail(e.target.value)}
            placeholder="Email игрока"
            className="border px-4 py-2 rounded-lg"
          />
          <button
            onClick={addPlayer}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Список игроков */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Игроки команды</h2>
        <ul className="space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="border p-3 rounded-lg flex justify-between"
            >
              <span>
                {player.name} ({player.email})
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ⬅ Назад к списку команд
        </Link>
      </div>
    </div>
  );
}
