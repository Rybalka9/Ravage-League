// backend/routes/tournamentBracket.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { generateFirstRoundPairs } = require("../lib/bracket");

const router = express.Router();

// POST /tournaments/:id/generate-bracket  (admin)
router.post("/:id/generate-bracket", auth, isAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    // берем только зарегистрированные команды
    const regs = await prisma.tournamentRegistration.findMany({
      where: { tournamentId, status: "registered" },
      include: { team: true }
    });

    const teamIds = regs.map(r => r.teamId);
    if (teamIds.length < 2) return res.status(400).json({ error: "Not enough teams to generate bracket" });

    const pairs = generateFirstRoundPairs(teamIds);

    // создаём матчи первого раунда; ставим scheduled на tournament.startDate (в будущем — распределять по времени)
    const created = [];
    for (const [a, b] of pairs) {
      const match = await prisma.match.create({
        data: {
          tournamentId,
          divisionId: tournament.divisionId,
          teamAId: a, // если a == null — странно; но у нас минимум 2 команды, поэтому a обычно есть
          teamBId: b || null,
          scheduled: tournament.startDate
        }
      });

      // если b == null — это bye: автоматическое прохождение команды a
      if (!b && a) {
        // можно прямо пометить результат и обновить статистику
        await prisma.match.update({ where: { id: match.id }, data: { result: "teamA" } });
        // и применим апдейты статистики (вызов helper'а ниже)
      }

      created.push(match);
    }

    res.json({ message: "Bracket created (first round)", matchesCount: created.length, matches: created });
  } catch (err) {
    console.error("generate-bracket error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
