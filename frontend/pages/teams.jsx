// frontend/pages/teams.jsx
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export default function TeamsPage() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await api.get("/teams");
      return res.data;
    },
  });

  if (isLoading) return <p>Загрузка...</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-4">Список команд</h1>
      <ul className="space-y-2">
        {teams.map((team) => (
          <li key={team.id} className="border-b pb-2">
            {team.name}{" "}
            {team.division ? (
              <span className="text-sm text-gray-500">
                ({team.division.name})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
