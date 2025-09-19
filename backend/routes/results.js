// backend/routes/results.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /results/:matchId/report
 * - Reporter (must be captain of one of the teams) reports score for the match.
 * Body: { scoreA: Int, scoreB: Int }
 */
router.post("/:matchId/report", auth, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const reporterId = req.user.id;
  const { scoreA, scoreB } = req.body;

  if (typeof scoreA !== "number" || typeof scoreB !== "number") {
    return res.status(400).json({ error: "scoreA and scoreB must be numbers" });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { teamA: true, teamB: true },
    });
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Проверяем право репортить — репортер должен быть капитаном teamA или teamB (или админ)
    const isAdmin = req.user.role === "admin";
    const captainA = await prisma.teamMembership.findFirst({
      where: { teamId: match.teamAId, userId: reporterId, role: "captain", leftAt: null },
    });
    const captainB = match.teamBId
      ? await prisma.teamMembership.findFirst({
          where: { teamId: match.teamBId, userId: reporterId, role: "captain", leftAt: null },
        })
      : null;

    if (!isAdmin && !captainA && !captainB) {
      return res.status(403).json({ error: "Только капитан одной из команд (или админ) может отправить репорт" });
    }

    // Создаём репорт
    const report = await prisma.matchReport.create({
      data: {
        matchId,
        reporterId,
        scoreA,
        scoreB,
        status: "pending",
      },
    });

    return res.status(201).json({ message: "Report created", report });
  } catch (err) {
    console.error("Error creating match report:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /results/:matchId/reports
 * - View all reports for a match (captains, admins)
 */
router.get("/:matchId/reports", auth, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  try {
    const reports = await prisma.matchReport.findMany({
      where: { matchId },
      include: { reporter: { select: { id: true, name: true, email: true } } },
      orderBy: { reportedAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /results/reports/:reportId/confirm
 * - The other team/captain confirms the report (if matches). If confirmed by other side, it becomes "confirmed" and we attempt to finalize automatically.
 */
router.post("/reports/:reportId/confirm", auth, async (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const userId = req.user.id;

  try {
    const report = await prisma.matchReport.findUnique({
      where: { id: reportId },
      include: { match: true, reporter: true },
    });
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.status !== "pending") return res.status(400).json({ error: "Report is not pending" });

    const match = await prisma.match.findUnique({ where: { id: report.matchId } });
    if (!match) return res.status(404).json({ error: "Match not found" });

    // кто может подтвердить: капитан противоположной команды или админ
    const isAdmin = req.user.role === "admin";

    // find opposite team id
    const reporterIsTeamA = report.reporterId && (await prisma.teamMembership.findFirst({
      where: { userId: report.reporterId, teamId: match.teamAId, leftAt: null },
    }));

    const opponentTeamId = reporterIsTeamA ? match.teamBId : match.teamAId;

    const captainOfOpponent = opponentTeamId
      ? await prisma.teamMembership.findFirst({
          where: { teamId: opponentTeamId, userId, role: "captain", leftAt: null },
        })
      : null;

    if (!isAdmin && !captainOfOpponent) {
      return res.status(403).json({ error: "Только капитан другой команды (или админ) может подтвердить" });
    }

    // Обновляем report -> confirmed. Указываем confirmedBy
    const updated = await prisma.matchReport.update({
      where: { id: reportId },
      data: { status: "confirmed", confirmedBy: userId },
    });

    // если обе стороны подтвердили — финализируем:
    // (упрощённо) — если существует другой report с то же score от другой стороны и status confirmed OR
    // либо можем считать, что single confirmation + initial report is enough.
    // Здесь мы попытаемся автоматически применить результат, если confirmed.

    // Авто-финализация: применяем результат немедленно (админ может override позже)
    await applyMatchResultAndStats(report.matchId, report.scoreA, report.scoreB, userId);

    return res.json({ message: "Report confirmed and match finalized automatically", report: updated });
  } catch (err) {
    console.error("Error confirming report:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /results/reports/:reportId/reject
 * - Opponent rejects the report. It becomes "rejected".
 */
router.post("/reports/:reportId/reject", auth, async (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const userId = req.user.id;

  try {
    const report = await prisma.matchReport.findUnique({ where: { id: reportId }, include: { match: true } });
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.status !== "pending") return res.status(400).json({ error: "Report is not pending" });

    const match = report.match;

    // кто может отклонить: капитан противоположной команды или админ
    const isAdmin = req.user.role === "admin";
    const reporterIsTeamA = await prisma.teamMembership.findFirst({
      where: { userId: report.reporterId, teamId: match.teamAId, leftAt: null }
    });
    const opponentTeamId = reporterIsTeamA ? match.teamBId : match.teamAId;
    const captainOfOpponent = opponentTeamId
      ? await prisma.teamMembership.findFirst({
          where: { teamId: opponentTeamId, userId, role: "captain", leftAt: null },
        })
      : null;

    if (!isAdmin && !captainOfOpponent) {
      return res.status(403).json({ error: "Только капитан другой команды (или админ) может отклонить" });
    }

    const updated = await prisma.matchReport.update({
      where: { id: reportId },
      data: { status: "rejected" },
    });

    return res.json({ message: "Report rejected", report: updated });
  } catch (err) {
    console.error("Error rejecting report:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /results/reports/:reportId/finalize
 * - Admin finalizes the report (applies result overriding if necessary)
 * Body (optional): { overrideScoreA, overrideScoreB } - admin may override reported scores
 */
router.post("/reports/:reportId/finalize", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const reportId = parseInt(req.params.reportId);
  const { overrideScoreA, overrideScoreB } = req.body;

  try {
    const report = await prisma.matchReport.findUnique({ where: { id: reportId }, include: { match: true } });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const scoreA = typeof overrideScoreA === "number" ? overrideScoreA : report.scoreA;
    const scoreB = typeof overrideScoreB === "number" ? overrideScoreB : report.scoreB;

    // Mark report as finalized
    await prisma.matchReport.update({
      where: { id: reportId },
      data: { status: "finalized", finalizedBy: req.user.id },
    });

    // apply result
    await applyMatchResultAndStats(report.matchId, scoreA, scoreB, req.user.id);

    return res.json({ message: "Report finalized and match result applied" });
  } catch (err) {
    console.error("Error finalizing report:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------------
   HELPERS
   ------------------------- */

/**
 * Apply match result to Match and update TeamStats
 * - resultScoreA, resultScoreB: integers
 * - actorId: user who triggered (for audit)
 */
async function applyMatchResultAndStats(matchId, resultScoreA, resultScoreB, actorId) {
  // fetch match
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found in applyMatchResultAndStats");

  // determine result string
  let resultStr = null;
  if (resultScoreA > resultScoreB) resultStr = "teamA";
  else if (resultScoreB > resultScoreA) resultStr = "teamB";
  else resultStr = "draw";

  // если результат уже есть
  if (match.result) {
    // если совпадает → ничего не делаем (идемпотентность)
    if (match.result === resultStr) {
      return;
    }

    // если отличается (например, админ изменил) → нужно пересчитать
    await rollbackStats(match);
  }

  // update match result
  await prisma.match.update({
    where: { id: matchId },
    data: { result: resultStr },
  });

  // update stats for teamA
  await upsertAndApplyStat(
    match.teamAId,
    resultStr === "teamA" ? "win" : resultStr === "draw" ? "draw" : "loss"
  );

  // update stats for teamB if exists
  if (match.teamBId) {
    await upsertAndApplyStat(
      match.teamBId,
      resultStr === "teamB" ? "win" : resultStr === "draw" ? "draw" : "loss"
    );
  }

  return;
}

/**
 * Откат статистики команд, если матч уже имел результат
 */
async function rollbackStats(match) {
  if (match.result === "teamA") {
    await decrementStat(match.teamAId, "win");
    if (match.teamBId) await decrementStat(match.teamBId, "loss");
  } else if (match.result === "teamB") {
    await decrementStat(match.teamBId, "win");
    await decrementStat(match.teamAId, "loss");
  } else if (match.result === "draw") {
    await decrementStat(match.teamAId, "draw");
    if (match.teamBId) await decrementStat(match.teamBId, "draw");
  }
}

/**
 * Уменьшить статистику команды
 */
async function decrementStat(teamId, outcome) {
  if (!teamId) return;
  if (outcome === "win") {
    await prisma.teamStats.update({
      where: { teamId },
      data: { wins: { decrement: 1 }, points: { decrement: 3 } },
    });
  } else if (outcome === "loss") {
    await prisma.teamStats.update({
      where: { teamId },
      data: { losses: { decrement: 1 } },
    });
  } else if (outcome === "draw") {
    await prisma.teamStats.update({
      where: { teamId },
      data: { draws: { decrement: 1 }, points: { decrement: 1 } },
    });
  }
}

/**
 * Upsert TeamStats and increment fields according to outcome
 * outcome: "win" | "loss" | "draw"
 */
async function upsertAndApplyStat(teamId, outcome) {
  // create TeamStats row if missing
  await prisma.teamStats.upsert({
    where: { teamId },
    update: {},
    create: { teamId },
  });

  if (outcome === "win") {
    await prisma.teamStats.update({
      where: { teamId },
      data: { wins: { increment: 1 }, points: { increment: 3 } },
    });
  } else if (outcome === "loss") {
    await prisma.teamStats.update({
      where: { teamId },
      data: { losses: { increment: 1 } },
    });
  } else if (outcome === "draw") {
    await prisma.teamStats.update({
      where: { teamId },
      data: { draws: { increment: 1 }, points: { increment: 1 } },
    });
  }
}

module.exports = router;
