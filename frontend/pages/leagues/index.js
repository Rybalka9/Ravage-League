import { useEffect, useState } from "react";
import axios from "axios";

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [name, setName] = useState("");
  const [prize, setPrize] = useState("");

  // простейшее хранение статуса админа
  const [isAdmin, setIsAdmin] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const res = await axios.get("http://localhost:4000/leagues");
      setLeagues(res.data);
    } catch (err) {
      console.error("Ошибка загрузки лиг:", err);
    }
  };

  const createLeague = async () => {
    if (!isAdmin) {
      alert("❌ Только админ может создавать лиги");
      return;
    }
    if (!name.trim() || !prize.trim()) return;

    try {
      await axios.post(
        "http://localhost:4000/leagues",
        { name, prize: parseInt(prize) },
        { headers: { "x-role": "admin" } }
      );
      setName("");
      setPrize("");
      fetchLeagues();
    } catch (err) {
      console.error("Ошибка создания лиги:", err);
      alert("Не удалось создать лигу");
    }
  };

  const handleLogin = () => {
    // простейшая заглушка
    if (login === "admin" && password === "secret123") {
      setIsAdmin(true);
      setError("");
    } else {
      setError("Неверный логин или пароль");
      setIsAdmin(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🏆 Лиги Ravage League</h1>

      {!isAdmin ? (
        <div style={{ marginBottom: "20px" }}>
          <h2>Вход для администратора</h2>
          <input
            type="text"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Войти</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <div style={{ marginBottom: "20px" }}>
          <h2>Создать лигу</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название лиги"
          />
          <input
            type="number"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="Призовой фонд ($)"
          />
          <button onClick={createLeague}>Создать</button>
          <p style={{ color: "green" }}>✅ Вы вошли как админ</p>
        </div>
      )}

      <h2>Все лиги:</h2>
      <ul>
        {leagues.map((league) => (
          <li key={league.id}>
            {league.name} — Приз: ${league.prize} (Команд: {league.teams.length})
          </li>
        ))}
      </ul>
    </div>
  );
}
