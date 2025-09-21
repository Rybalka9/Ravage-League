import TournamentsList from "../components/TournamentsList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        🔥 Ravage League 🔥
      </h1>

      {/* Баннер или описание */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-10 rounded-2xl shadow-lg mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Добро пожаловать в Ravage League</h2>
        <p className="text-lg opacity-90">
          Участвуй в турнирах, создавай команды, докажи, что ты лучший!
        </p>
      </div>

      {/* Список турниров */}
      <TournamentsList />
    </div>
  );
}
