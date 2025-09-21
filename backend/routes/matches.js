// backend/routes/matches.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/**
 * 📌 Сгенерировать сетку турнира (только админ)
 */
router.post("/generate/:tournamentId", auth, isAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);
  if (Number.isNaN(tournamentId)) {
    return res.status(400).json({ error: "Некорректный ID турнира" });
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: "approved" },
          include: { team: true },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: "Турнир не найден" });
    }

    const teams = tournament.registrations.map((r) => r.team);
    if (teams.length < 2) {
      return res
        .status(400)
        .json({ error: "Недостаточно команд для генерации сетки" });
    }

    // Определяем формат финала
    let finalFormat = "bo1";
    if (teams.length >= 32 && teams.length <= 128) finalFormat = "bo3";
    if (teams.length >= 256) finalFormat = "bo5";

    // Рандомизация посева
    teams.sort(() => Math.random() - 0.5);

    const matches = [];
    for (let i = 0; i < teams.length; i += 2) {
      const teamA = teams[i];
      const teamB = teams[i + 1];

      // Автопроход
      if (!teamB) {
        const match = await prisma.match.create({
          data: {
            divisionId: tournament.divisionId,
            tournamentId: tournament.id,
            teamAId: teamA.id,
            teamBId: null,
            scheduled: new Date(),
            result: "teamA",
            format: "bo1",
          },
        });
        matches.push(match);
        continue;
      }

      const isFinal = i + 2 === teams.length;
      const format = isFinal ? finalFormat : "bo1";

      const match = await prisma.match.create({
        data: {
          divisionId: tournament.divisionId,
          tournamentId: tournament.id,
          teamAId: teamA.id,
          teamBId: teamB.id,
          scheduled: new Date(),
          format,
        },
      });

      matches.push(match);
    }

    // Меняем статус турнира
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "ongoing" },
    });

    res.json({ message: "Сетка сгенерирована", matches });
  } catch (err) {
    console.error("Ошибка при генерации сетки:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
