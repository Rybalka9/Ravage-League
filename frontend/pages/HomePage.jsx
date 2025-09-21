import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth"; // твой хук для проверки авторизации
import { Link } from "react-router-dom";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    fetch("/api/tournaments")
      .then(res => res.json())
      .then(data => setTournaments(data))
      .catch(err => console.error("Ошибка загрузки турниров:", err));
  }, []);

  if (loading) return <p className="text-center mt-10">Загрузка...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      {!user ? (
        <Landing tournaments={tournaments} />
      ) : (
        <Dashboard user={user} tournaments={tournaments} />
      )}
    </div>
  );
}

// =====================
// Landing (не авторизован)
// =====================
function Landing({ tournaments }) {
  return (
    <div>
      {/* Герой-блок */}
      <section className="text-center py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Добро пожаловать в Лигу</h1>
        <p className="text-lg mb-6">Играйте в турнирах, собирайте команду и побеждайте!</p>
        <div className="flex justify-center gap-4">
          <Link to="/register">
            <Button size="lg" variant="secondary">Регистрация</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="bg-white text-purple-600">
              Войти
            </Button>
          </Link>
        </div>
      </section>

      {/* Ближайшие турниры */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Ближайшие турниры</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tournaments.length === 0 ? (
            <p className="text-gray-500">Нет активных турниров</p>
          ) : (
            tournaments.slice(0, 6).map(t => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle>{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Дивизион: {t.division?.name || "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Начало: {new Date(t.startDate).toLocaleDateString()}
                  </p>
                  <Link to={`/tournaments/${t.id}`}>
                    <Button className="mt-3 w-full">Подробнее</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Как это работает */}
      <section className="mt-16 bg-gray-100 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Как это работает?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Создай аккаунт</h3>
            <p className="text-gray-600">Зарегистрируйся и получи доступ к турнирам.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">2. Собери команду</h3>
            <p className="text-gray-600">Пригласи друзей или присоединись к существующей команде.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">3. Играй и побеждай</h3>
            <p className="text-gray-600">Участвуй в турнирах и поднимайся в рейтинге.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// =====================
// Dashboard (авторизован)
// =====================
function Dashboard({ user, tournaments }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Привет, {user.name} 👋</h1>

      {/* Мои команды */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Мои команды</h2>
          <Link to="/teams/create">
            <Button>Создать команду</Button>
          </Link>
        </div>
        {/* TODO: тут подгружаем API /teams (где user состоит) */}
        <p className="text-gray-500">У тебя пока нет команд.</p>
      </section>

      {/* Мои приглашения */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Приглашения</h2>
        {/* TODO: компонент InvitesList */}
        <p className="text-gray-500">Нет приглашений.</p>
      </section>

      {/* Активные турниры */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Активные турниры</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tournaments.length === 0 ? (
            <p className="text-gray-500">Нет активных турниров</p>
          ) : (
            tournaments.map(t => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle>{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Дивизион: {t.division?.name || "—"}</p>
                  <p className="text-sm text-gray-600">
                    Начало: {new Date(t.startDate).toLocaleDateString()}
                  </p>
                  <Link to={`/tournaments/${t.id}`}>
                    <Button className="mt-3 w-full">Подробнее</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
