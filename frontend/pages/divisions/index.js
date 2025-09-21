// frontend/pages/divisions/index.js
import Link from "next/link";

const divisions = [
  { id: "amateur", name: "Amateur Division", description: "Начальный уровень для новичков" },
  { id: "semi-pro", name: "Semi-Pro Division", description: "Средний уровень, крепкие команды" },
  { id: "pro", name: "Pro Division", description: "Профессиональные команды высокого уровня" },
  { id: "elite", name: "Elite Division", description: "Топ-уровень. Только лучшие из лучших" },
];

export default function DivisionsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        🏆 Divisions of Ravage League
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {divisions.map((division) => (
          <Link key={division.id} href={`/divisions/${division.id}`}>
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer">
              <h2 className="text-2xl font-semibold text-blue-600 mb-2">
                {division.name}
              </h2>
              <p className="text-gray-600">{division.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
