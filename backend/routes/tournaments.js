// backend/routes/tournaments.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

// Создать турнир (админ)
router.post("/", auth, isAdmin, async (req, res) => {
  const { name, divisionId, type, format, startDate, endDate, maxTeams, prize, rules, discussion } = req.body;
  if (!name || !divisionId || !type || !startDate) {
    return res.status(400).json({ error: "Укажите обязательные поля: name, divisionId, type, startDate" });
  }

  try {
    // проверим дивизион
    const division = await prisma.division.findUnique({ where: { id: parseInt(divisionId) }});
    if (!division) return res.status(400).json({ error: "Division not found" });

    const tournament = await prisma.tournament.create({
      data: {
        name,
        divisionId: parseInt(divisionId),
        type,
        format: format || "single_elim",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxTeams: maxTeams ? parseInt(maxTeams) : null,
        prize: prize ? parseInt(prize) : null,
        rules: rules || null,
        discussion: discussion || null,
      },
    });

    res.status(201).json(tournament);
  } catch (err) {
    console.error("Ошибка при создании турнира:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получить список турниров
router.get("/", async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        registrations: true,
        division: true,
      },
      orderBy: { startDate: "desc" }
    });

    // добавляем динамический подсчёт текущих зарегистрированных команд
    const result = tournaments.map(t => ({
      ...t,
      currentTeams: t.registrations.filter(r => r.status === "registered").length
    }));

    res.json(result);
  } catch (err) {
    console.error("Ошибка при получении турниров:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получить конкретный турнир
router.get("/:id", async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  if (Number.isNaN(tournamentId)) return res.status(400).json({ error: "Некорректный ID турнира" });

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: { include: { team: true } },
        matches: { include: { teamA: true, teamB: true } },
        division: true,
        complaints: true,
        discussionPosts: { include: { user: true, comments: { include: { user: true } } } }
      }
    });

    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });

    const currentTeams = tournament.registrations.filter(r => r.status === "registered").length;
    res.json({ ...tournament, currentTeams });
  } catch (err) {
    console.error("Ошибка при получении турнира:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Генерация сетки турнира (только админ)
router.post("/:id/generate", auth, isAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { registrations: { where: { status: "registered" }, include: { team: true } } }
    });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const teams = tournament.registrations.map(r => r.team);
    if (teams.length < 2) return res.status(400).json({ error: "Not enough teams to generate bracket" });

    // Только single_elim для старта
    if (tournament.format !== "single_elim") {
      return res.status(400).json({ error: "Bracket generation implemented only for single_elim" });
    }

    // определяем финальный формат (по вашим правилам):
    // если количество команд < = 16 -> финал bo1
    // если 32..128 -> финал bo3
    // если >= 256 -> финал bo5
    let finalFormat = "bo1";
    if (teams.length >= 32 && teams.length <= 128) finalFormat = "bo3";
    if (teams.length >= 256) finalFormat = "bo5";

    // Перемешиваем команды
    teams.sort(() => Math.random() - 0.5);

    const createdMatches = [];

    await prisma.$transaction(async (tx) => {
      // очищаем существующие матчи у этого турнира ? (опционально) - мы не трогаем старые
      // создаём пары: если нечет — одна команда получает bye (teamBId = null)
      for (let i = 0; i < teams.length; i += 2) {
        const teamA = teams[i];
        const teamB = teams[i + 1];

        if (!teamB) {
          // bye: auto advance — создаём матч с teamBId = null и результат teamA
          const m = await tx.match.create({
            data: {
              divisionId: tournament.divisionId,
              tournamentId: tournament.id,
              teamAId: teamA.id,
              teamBId: null,
              scheduled: tournament.startDate,
              result: "teamA"
            }
          });
          createdMatches.push({ ...m, format: "bye (auto-advance)" });
          continue;
        }

        // обычный матч
        const isFinal = (i + 2 === teams.length); // приблизительно последний матч в первой генерации
        const format = isFinal ? finalFormat : "bo1";

        const m = await tx.match.create({
          data: {
            divisionId: tournament.divisionId,
            tournamentId: tournament.id,
            teamAId: teamA.id,
            teamBId: teamB.id,
            scheduled: tournament.startDate,
            result: null
          }
        });
        createdMatches.push({ ...m, format });
      }

      // переводим турнир в ongoing
      await tx.tournament.update({
        where: { id: tournament.id },
        data: { status: "ongoing" }
      });
    });

    res.json({ message: "Bracket generated", matches: createdMatches, finalFormat });
  } catch (err) {
    console.error("Ошибка генерации сетки:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 📌 Обновить турнир (только админ)
 */
router.patch("/:id", auth, isAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  if (Number.isNaN(tournamentId)) {
    return res.status(400).json({ error: "Некорректный ID турнира" });
  }

  try {
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: req.body,
      include: { registrations: true },
    });

    res.json({
      ...tournament,
      currentTeams: tournament.registrations.filter(
        (r) => r.status === "registered"
      ).length,
    });
  } catch (err) {
    console.error("Ошибка при обновлении турнира:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Удалить турнир (только админ)
 */
router.delete("/:id", auth, isAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  if (Number.isNaN(tournamentId)) {
    return res.status(400).json({ error: "Некорректный ID турнира" });
  }

  try {
    await prisma.tournament.delete({ where: { id: tournamentId } });
    res.json({ message: "Турнир удалён" });
  } catch (err) {
    console.error("Ошибка при удалении турнира:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
