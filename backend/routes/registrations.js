// backend/routes/registrations.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /registrations/:tournamentId
 * Зарегистрировать команду в турнире
 */
router.post("/:tournamentId", auth, async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);
  const { teamId } = req.body;
  const user = req.user;

  if (!teamId) return res.status(400).json({ error: "teamId required" });

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const deadline = new Date(tournament.startDate);
    deadline.setHours(deadline.getHours() - 1);
    if (new Date() > deadline) {
      return res.status(400).json({ error: "Registration closed (1 hour before start)" });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.banned) return res.status(403).json({ error: "Team banned" });

    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: user.id, role: "captain", leftAt: null }
    });
    if (!captain) return res.status(403).json({ error: "Only team captain can register the team" });

    if (team.divisionId !== tournament.divisionId) {
      return res.status(400).json({ error: "Team division mismatch for this tournament" });
    }

    const existing = await prisma.tournamentRegistration.findFirst({
      where: { tournamentId, teamId }
    });
    if (existing) return res.status(409).json({ error: "Team already registered" });

    const registeredCount = await prisma.tournamentRegistration.count({
      where: { tournamentId, status: "registered" }
    });

    if (tournament.maxTeams && registeredCount >= tournament.maxTeams) {
      const wait = await prisma.tournamentRegistration.create({
        data: { tournamentId, teamId, status: "waitlisted" }
      });
      return res.status(200).json({ message: "Tournament full, team added to waitlist", registration: wait });
    }

    const reg = await prisma.tournamentRegistration.create({
      data: { tournamentId, teamId, status: "registered" }
    });

    // ✅ Увеличиваем currentTeams
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { currentTeams: { increment: 1 } }
    });

    return res.status(201).json(reg);
  } catch (err) {
    console.error("POST /registrations error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /registrations/:id
 * Отмена регистрации (капитан или админ)
 */
router.delete("/:id", auth, async (req, res) => {
  const regId = parseInt(req.params.id);

  try {
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: regId },
      include: { team: true }
    });

    if (!registration) return res.status(404).json({ error: "Registration not found" });

    const user = req.user;
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId: registration.teamId, userId: user.id, role: "captain", leftAt: null }
    });

    if (!captain && user.role !== "admin") {
      return res.status(403).json({ error: "Only captain or admin can remove registration" });
    }

    await prisma.tournamentRegistration.delete({ where: { id: regId } });

    // ✅ Уменьшаем currentTeams, если команда была реально зарегистрирована
    if (registration.status === "registered") {
      await prisma.tournament.update({
        where: { id: registration.tournamentId },
        data: { currentTeams: { decrement: 1 } }
      });
    }

    return res.json({ message: "Registration removed" });
  } catch (err) {
    console.error("DELETE /registrations error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
