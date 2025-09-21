import { useEffect, useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function InvitesList() {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await api.get("/invites");
      setInvites(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить приглашения");
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/invites/${id}/${action}`);
      toast.success(
        action === "accept" ? "Вы приняли приглашение" : "Приглашение отклонено"
      );
      fetchInvites();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка при обработке приглашения");
    }
  };

  if (!invites.length) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 text-center text-gray-500">
        У вас нет приглашений
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4">Мои приглашения</h2>
      <ul className="space-y-3">
        {invites.map((invite) => (
          <li
            key={invite.id}
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <span>
              Приглашение в <b>{invite.team.name}</b>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(invite.id, "accept")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Принять
              </button>
              <button
                onClick={() => handleAction(invite.id, "decline")}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Отклонить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
