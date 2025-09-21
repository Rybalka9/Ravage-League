// backend/routes/admin.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

// Middleware: только для админа
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Требуются права администратора" });
  }
  next();
}

// ================================
// Управление дивизионами
// ================================
router.post("/divisions", auth, requireAdmin, async (req, res) => {
  const { name, prize } = req.body;

  if (!name) return res.status(400).json({ error: "Название обязательно" });

  try {
    const division = await prisma.division.create({
      data: { name, prize: prize || 0 },
    });
    res.status(201).json(division);
  } catch (err) {
    console.error("Ошибка при создании дивизиона:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/divisions/:id", auth, requireAdmin, async (req, res) => {
  const divisionId = parseInt(req.params.id);
  const { name, prize } = req.body;

  try {
    const division = await prisma.division.update({
      where: { id: divisionId },
      data: { name, prize },
    });
    res.json(division);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================================
// Управление турнирами
// ================================
router.post("/tournaments", auth, requireAdmin, async (req, res) => {
  const { name, divisionId, format, type, startDate, maxTeams, rules } = req.body;

  if (!name || !format || !type || !startDate) {
    return res.status(400).json({ error: "name, format, type, startDate обязательны" });
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        divisionId: divisionId || null,
        format,
        type,
        startDate: new Date(startDate),
        maxTeams: maxTeams || null,
        rules: rules || null,
      },
    });

    res.status(201).json(tournament);
  } catch (err) {
    console.error("Ошибка при создании турнира:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/tournaments/:id", auth, requireAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  const { name, format, type, status, startDate, endDate, maxTeams, rules } = req.body;

  try {
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name,
        format,
        type,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxTeams,
        rules,
      },
    });

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/tournaments/:id", auth, requireAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);

  try {
    await prisma.tournament.delete({ where: { id: tournamentId } });
    res.json({ message: "Турнир удалён" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================================
// Коррекция матча вручную
// ================================
router.patch("/matches/:id/result", auth, requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { result } = req.body; // "teamA" | "teamB" | "draw"

  if (!["teamA", "teamB", "draw"].includes(result)) {
    return res.status(400).json({ error: "Некорректный результат" });
  }

  try {
    const match = await prisma.match.update({
      where: { id: matchId },
      data: { result },
    });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================================
// Баны пользователей и команд
// ================================
router.patch("/users/:id/ban", auth, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const { banned } = req.body; // true | false

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/teams/:id/ban", auth, requireAdmin, async (req, res) => {
  const teamId = parseInt(req.params.id);
  const { banned } = req.body; // true | false

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { banned },
    });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
