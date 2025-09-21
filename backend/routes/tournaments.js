// backend/routes/tournaments.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/**
 * 📌 Создать турнир (только админ)
 */
router.post("/", auth, isAdmin, async (req, res) => {
  const { name, divisionId, type, format, startDate, endDate, maxTeams, rules, discussion, prize } = req.body;

  if (!name || !divisionId || !type || !startDate) {
    return res.status(400).json({ error: "Укажите обязательные поля: name, divisionId, type, startDate" });
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        divisionId: parseInt(divisionId),
        type,
        format: format || "single_elim", // дефолт
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxTeams: maxTeams ? parseInt(maxTeams) : null,
        prize: prize ? parseInt(prize) : null,
        rules: rules || null,
        discussion: discussion || null,
      },
      include: {
        registrations: true,
        division: true,
      },
    });

    res.status(201).json({
      ...tournament,
      currentTeams: 0, // ⚡ при создании всегда 0
    });
  } catch (err) {
    console.error("Ошибка при создании турнира:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Получить список всех турниров
 */
router.get("/", async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        registrations: true,
        division: true,
      },
    });

    const result = tournaments.map((t) => ({
      ...t,
      currentTeams: t.registrations.filter((r) => r.status === "registered").length,
    }));

    res.json(result);
  } catch (err) {
    console.error("Ошибка при получении турниров:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Получить конкретный турнир
 */
router.get("/:id", async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  if (Number.isNaN(tournamentId)) {
    return res.status(400).json({ error: "Некорректный ID турнира" });
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: { include: { team: true } },
        matches: { include: { teamA: true, teamB: true } },
        division: true,
        complaints: true,
        discussionPosts: {
          include: { user: true, comments: { include: { user: true } } },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: "Турнир не найден" });
    }

    const currentTeams = tournament.registrations.filter(
      (r) => r.status === "registered"
    ).length;

    res.json({
      ...tournament,
      currentTeams,
    });
  } catch (err) {
    console.error("Ошибка при получении турнира:", err);
    res.status(500).json({ error: "Ошибка сервера" });
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
