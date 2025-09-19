const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * Создать турнир (только админ)
 */
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Только админ может создавать турниры" });
  }

  const { name, leagueId, type, startDate, endDate, maxTeams, rules, discussion } = req.body;

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        leagueId,
        type,
        format: "bo1", // дефолт
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxTeams,
        rules,
        discussion,
      },
    });

    res.status(201).json(tournament);
  } catch (err) {
    console.error("Ошибка при создании турнира:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Получить список всех турниров
 */
router.get("/", async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        registrations: { include: { team: true } },
        matches: true,
        league: true,
      },
    });
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Получить конкретный турнир
 */
router.get("/:id", async (req, res) => {
  const tournamentId = parseInt(req.params.id);

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: { include: { team: true } },
        matches: {
          include: {
            teamA: true,
            teamB: true,
          },
        },
        league: true,
        complaints: true,
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: "Турнир не найден" });
    }

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Обновить турнир (только админ)
 */
router.patch("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Только админ может редактировать турниры" });
  }

  const tournamentId = parseInt(req.params.id);

  try {
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: req.body,
    });

    res.json(tournament);
  } catch (err) {
    console.error("Ошибка при обновлении турнира:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Удалить турнир (только админ)
 */
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Только админ может удалять турниры" });
  }

  const tournamentId = parseInt(req.params.id);

  try {
    await prisma.tournament.delete({ where: { id: tournamentId } });
    res.json({ message: "Турнир удалён" });
  } catch (err) {
    console.error("Ошибка при удалении турнира:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
