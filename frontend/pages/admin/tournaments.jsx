// frontend/pages/admin/tournaments.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { setAuthToken } from "../../lib/api";
import toast from "react-hot-toast";

// Убедитесь, что токен установлен (AuthContext делает это обычно)
export default function AdminTournamentsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    divisionId: "",
    type: "fastcup",
    format: "single_elim",
    startDate: "",
    maxTeams: "",
    prize: "",
    rules: ""
  });

  // Получаем дивизионы
  const { data: divisions = [], isLoading: divLoading } = useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const res = await api.get("/divisions");
      return res.data;
    }
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await api.get("/tournaments");
      return res.data;
    }
  });

  const createTournament = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/tournaments", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Турнир создан");
      qc.invalidateQueries(["tournaments"]);
      setForm({ name: "", divisionId: "", type: "fastcup", format: "single_elim", startDate: "", maxTeams: "", prize: "", rules: "" });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || "Ошибка создания турнира");
    }
  });

  const createDivision = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/divisions", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Дивизион создан");
      qc.invalidateQueries(["divisions"]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || "Ошибка создания дивизиона");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.divisionId || !form.startDate) {
      return toast.error("Заполните минимум: name, divisionId, startDate");
    }
    createTournament.mutate({
      ...form,
      divisionId: parseInt(form.divisionId),
      maxTeams: form.maxTeams ? parseInt(form.maxTeams) : null,
      prize: form.prize ? parseInt(form.prize) : null
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Админ — Управление турнирами</h1>

      <section className="bg-white p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Создать турнир</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input value={form.name} placeholder="Название" onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 w-full" />
          <select value={form.divisionId} onChange={(e) => setForm({ ...form, divisionId: e.target.value })} className="border p-2 w-full">
            <option value="">Выберите дивизион</option>
            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border p-2">
              <option value="fastcup">fastcup</option>
              <option value="seasonal">seasonal</option>
              <option value="playoff">playoff</option>
              <option value="showmatch">showmatch</option>
            </select>
            <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} className="border p-2">
              <option value="single_elim">single_elim</option>
              <option value="double_elim">double_elim</option>
              <option value="swiss">swiss</option>
            </select>
          </div>
          <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border p-2 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.maxTeams} placeholder="Max teams (opt)" onChange={(e) => setForm({ ...form, maxTeams: e.target.value })} className="border p-2" />
            <input value={form.prize} placeholder="Prize (opt)" onChange={(e) => setForm({ ...form, prize: e.target.value })} className="border p-2" />
          </div>
          <textarea value={form.rules} placeholder="Rules (opt)" onChange={(e) => setForm({ ...form, rules: e.target.value })} className="border p-2 w-full" />
          <div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Tournament</button>
          </div>
        </form>
      </section>

      <section className="bg-white p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Создать дивизион</h2>
        <CreateDivisionForm onCreate={(payload) => createDivision.mutate(payload)} />
      </section>

      <section className="bg-white p-4 rounded">
        <h2 className="font-semibold mb-2">Существующие турниры</h2>
        <ul>
          {tournaments.map(t => (
            <li key={t.id} className="border-b py-2 flex justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-600">{t.division?.name || "—"} • {t.status} • {t.startDate ? new Date(t.startDate).toLocaleString() : ""}</div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  className="px-2 py-1 bg-green-600 text-white rounded"
                  onClick={async () => {
                    try {
                      await api.post(`/tournaments/${t.id}/generate`);
                      toast.success("Сетка сгенерирована");
                      await qc.invalidateQueries(["tournaments"]);
                    } catch (err) {
                      toast.error(err?.response?.data?.error || "Ошибка генерации");
                    }
                  }}
                >
                  Generate Bracket
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CreateDivisionForm({ onCreate }) {
  const [name, setName] = useState("");
  const [maxTeams, setMaxTeams] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!name) return alert("name required");
    onCreate({ name, maxTeams: maxTeams ? parseInt(maxTeams) : 0 });
    setName(""); setMaxTeams("");
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Division name" className="border p-2" />
      <input value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} placeholder="max teams (0 = unlimited)" className="border p-2 w-48" />
      <button className="bg-indigo-600 text-white px-3 rounded">Create Division</button>
    </form>
  );
}
