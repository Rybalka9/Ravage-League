const express = require("express");
const prisma = require("../prismaClient");

const router = express.Router();

/**
 * Общий рейтинг всех команд
 * - сортировка по очкам → победам → ничьим
 */
router.get("/", async (req, res) => {
  try {
    const leaderboard = await prisma.teamStats.findMany({
      include: { team: true },
      orderBy: [
        { points: "desc" },
        { wins: "desc" },
        { draws: "desc" },
      ],
    });

    res.json(
      leaderboard.map((stat, index) => ({
        rank: index + 1,
        teamId: stat.teamId,
        teamName: stat.team.name,
        wins: stat.wins,
        losses: stat.losses,
        draws: stat.draws,
        points: stat.points,
      }))
    );
  } catch (err) {
    console.error("Ошибка получения рейтинга:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Рейтинг в рамках конкретного турнира
 */
router.get("/tournament/:id", async (req, res) => {
  const tournamentId = parseInt(req.params.id);

  try {
    // Получаем список команд из регистраций
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId, status: "accepted" },
      include: { team: { include: { teamStats: true } } },
    });

    const leaderboard = registrations
      .map((r) => ({
        teamId: r.team.id,
        teamName: r.team.name,
        wins: r.team.teamStats?.wins || 0,
        losses: r.team.teamStats?.losses || 0,
        draws: r.team.teamStats?.draws || 0,
        points: r.team.teamStats?.points || 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.draws - a.draws;
      })
      .map((team, index) => ({ rank: index + 1, ...team }));

    res.json(leaderboard);
  } catch (err) {
    console.error("Ошибка получения рейтинга турнира:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
