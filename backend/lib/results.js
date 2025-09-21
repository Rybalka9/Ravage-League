// backend/lib/results.js
const prisma = require("../prismaClient");

/**
 * upsert TeamStats and apply a single match result
 * outcome: "win" | "loss" | "draw"
 */
async function upsertAndApplyStat(teamId, outcome) {
  const pointsFor = { win: 3, draw: 1, loss: 0 }; // configurable
  const inc = {
    wins: outcome === "win" ? 1 : 0,
    losses: outcome === "loss" ? 1 : 0,
    draws: outcome === "draw" ? 1 : 0,
    points: pointsFor[outcome] || 0
  };

  // upsert
  await prisma.teamStats.upsert({
    where: { teamId },
    update: {
      wins: { increment: inc.wins },
      losses: { increment: inc.losses },
      draws: { increment: inc.draws },
      points: { increment: inc.points }
    },
    create: {
      teamId,
      wins: inc.wins,
      losses: inc.losses,
      draws: inc.draws,
      points: inc.points
    }
  });
}

/**
 * applyMatchResultAndStats(matchId, resultScoreA, resultScoreB, actorId)
 * resultScoreA/B — int
 */
async function applyMatchResultAndStats(matchId, resultScoreA, resultScoreB, actorId) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");

  let resultStr = null;
  if (resultScoreA > resultScoreB) resultStr = "teamA";
  else if (resultScoreB > resultScoreA) resultStr = "teamB";
  else resultStr = "draw";

  // idempotent update
  await prisma.match.update({
    where: { id: matchId },
    data: { result: resultStr }
  });

  // apply to teamA
  await upsertAndApplyStat(match.teamAId, resultStr === "teamA" ? "win" : (resultStr === "draw" ? "draw" : "loss"));

  // teamB may be null (bye)
  if (match.teamBId) {
    await upsertAndApplyStat(match.teamBId, resultStr === "teamB" ? "win" : (resultStr === "draw" ? "draw" : "loss"));
  }

  return;
}

module.exports = { applyMatchResultAndStats, upsertAndApplyStat };
