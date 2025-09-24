import { useEffect, useState } from "react";
import api, { setAuthToken } from "../../lib/api";
import { useRouter } from "next/router";

export default function AdminPage() {
  const [divisionName, setDivisionName] = useState("");
  const [divisions, setDivisions] = useState([]);

  const [tournaments, setTournaments] = useState([]);
  const [tournamentName, setTournamentName] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [format, setFormat] = useState("single_elim");
  const [type, setType] = useState("fastcup");
  const [startDate, setStartDate] = useState("");
  const [maxTeams, setMaxTeams] = useState("");

  const [teams, setTeams] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setAuthToken(token);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [divRes, tourRes, teamRes] = await Promise.all([
        api.get("/divisions"),
        api.get("/tournaments"),
        api.get("/teams"),
      ]);
      setDivisions(divRes.data);
      setTournaments(tourRes.data);
      setTeams(teamRes.data);
      if (divRes.data.length > 0) {
        setSelectedDivision(divRes.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  // ----- DIVISIONS -----
  const createDivision = async () => {
    try {
      await api.post("/divisions", { name: divisionName, maxTeams: 0, description: "" });
      setDivisionName("");
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || "Error");
    }
  };

  const deleteDivision = async (id) => {
    if (!confirm("Удалить дивизион?")) return;
    try {
      await api.delete(`/divisions/${id}`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || "Error");
    }
  };

  // ----- TOURNAMENTS -----
  const createTournament = async () => {
    if (!selectedDivision) return alert("Выберите дивизион");
    try {
      await api.post("/tournaments", {
        name: tournamentName,
        divisionId: selectedDivision,
        type,
        format,
        startDate,
        maxTeams: maxTeams ? parseInt(maxTeams) : null,
      });
      setTournamentName("");
      setMaxTeams("");
      setStartDate("");
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || "Error");
    }
  };

  const deleteTournament = async (id) => {
    if (!confirm("Удалить турнир?")) return;
    try {
      await api.delete(`/tournaments/${id}`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || "Error");
    }
  };

  // ----- TEAMS -----
  const deleteTeam = async (id) => {
    if (!confirm("Удалить команду?")) return;
    try {
      await api.delete(`/teams/${id}`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || "Error");
    }
  };

  const assignTeamToDivision = async (teamId, divisionId) => {
    try {
      await api.put(`/teams/${teamId}`, { divisionId });
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.error || "Error");
    }
  };

  return (
    <div className="p-6 bg-[#0a1f33] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">⚙️ Панель администратора</h1>

      {/* DIVISIONS */}
      <section className="mb-10">
        <h2 className="text-xl mb-2">Дивизионы</h2>
        <div className="flex gap-2 mb-4">
          <input
            placeholder="Название дивизиона"
            value={divisionName}
            onChange={(e) => setDivisionName(e.target.value)}
            className="p-2 rounded bg-[#122b42] border border-gray-600 w-64"
          />
          <button
            onClick={createDivision}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Создать
          </button>
        </div>

        <ul className="space-y-2">
          {divisions.map((d) => (
            <li key={d.id} className="flex justify-between bg-[#122b42] p-2 rounded">
              <span>{d.name}</span>
              <button
                onClick={() => deleteDivision(d.id)}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* TOURNAMENTS */}
      <section className="mb-10">
        <h2 className="text-xl mb-2">Турниры</h2>
        <div className="grid gap-2 mb-4 max-w-xl">
          <input
            placeholder="Название турнира"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            className="p-2 rounded bg-[#122b42] border border-gray-600"
          />

          <select
            value={selectedDivision || ""}
            onChange={(e) => setSelectedDivision(parseInt(e.target.value))}
            className="p-2 rounded bg-[#122b42] border border-gray-600"
          >
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 rounded bg-[#122b42] border border-gray-600"
          >
            <option value="fastcup">Fastcup</option>
            <option value="event">Event</option>
          </select>

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="p-2 rounded bg-[#122b42] border border-gray-600"
          >
            <option value="single_elim">Single Elimination</option>
            <option value="double_elim">Double Elimination</option>
            <option value="round_robin">Round Robin</option>
          </select>

          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 rounded bg-[#122b42] border border-gray-600"
          />

          <input
            type="number"
            placeholder="Макс. команд"
            value={maxTeams}
            onChange={(e) => setMaxTeams(e.target.value)}
            className="p-2 rounded bg-[#122b42] border border-gray-600"
          />

          <button
            onClick={createTournament}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Создать турнир
          </button>
        </div>

        <ul className="space-y-2">
          {tournaments.map((t) => (
            <li key={t.id} className="flex justify-between bg-[#122b42] p-2 rounded">
              <span>
                {t.name} ({t.type}, {t.format})
              </span>
              <button
                onClick={() => deleteTournament(t.id)}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* TEAMS */}
      <section>
        <h2 className="text-xl mb-2">Команды</h2>
        <ul className="space-y-2">
          {teams.map((team) => (
            <li key={team.id} className="flex justify-between bg-[#122b42] p-2 rounded">
              <div>
                <strong>{team.name}</strong>{" "}
                {team.division ? (
                  <span className="text-sm text-gray-400">
                    (Дивизион: {team.division.name})
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">(без дивизиона)</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  onChange={(e) => assignTeamToDivision(team.id, parseInt(e.target.value))}
                  value={team.divisionId || ""}
                  className="bg-[#0a1f33] border border-gray-600 rounded px-2"
                >
                  <option value="">---</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
