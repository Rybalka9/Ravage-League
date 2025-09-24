// frontend/pages/tournaments.jsx
import TournamentsList from "../components/TournamentsList";

export default function TournamentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f33] via-[#0b3d2e] to-[#122b42] p-8 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-green-200">
            Турниры
          </h1>
          <p className="text-gray-300">
            Список ближайших ивентов по дивизионам Ravage League — участвуй, регистрируй
            команды и следи за прогрессом.
          </p>
        </div>

        {/* Список турниров (компонент сам рендерит карточки) */}
        <TournamentsList />
      </div>
    </div>
  );
}
