// backend/routes/registrations.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin"); // для админских операций при необходимости

const router = express.Router();

/**
 * POST /registrations/:tournamentId
 * body: { teamId }
 * Только капитан команды может регистрировать команду в турнире.
 * Регистрация закрывается за 1 час до старта (deadline).
 * Если турнир заполнен -> добавляем в waitlist.
 */
router.post("/:tournamentId", auth, async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);
  const { teamId } = req.body;
  const user = req.user;

  if (!teamId) return res.status(400).json({ error: "teamId required" });

  try {
    // загружаем турнир и команду
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    // дедлайн: 1 час до старта
    const deadline = new Date(tournament.startDate);
    deadline.setHours(deadline.getHours() - 1);
    if (new Date() > deadline) {
      return res.status(400).json({ error: "Registration closed (1 hour before start)" });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.banned) return res.status(403).json({ error: "Team banned" });

    // только капитан (или админ) может регать команду
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: user.id, role: "captain", leftAt: null }
    });
    if (!captain && user.role !== "admin") {
      return res.status(403).json({ error: "Only team captain can register the team" });
    }

    // команда должна принадлежать дивизиону турнира (если требуется)
    if (team.divisionId !== tournament.divisionId) {
      return res.status(400).json({ error: "Team division mismatch for this tournament" });
    }

    // атомарный блок: проверить, создать регистрацию или waitlist
    const result = await prisma.$transaction(async (tx) => {
      // есть ли уже регистрация
      const existing = await tx.tournamentRegistration.findFirst({
        where: { tournamentId, teamId }
      });
      if (existing) {
        throw { status: 409, message: "Team already registered or in waitlist" };
      }

      // сколько уже зарегистрировано
      const registeredCount = await tx.tournamentRegistration.count({
        where: { tournamentId, status: "registered" }
      });

      if (tournament.maxTeams && registeredCount >= tournament.maxTeams) {
        // турнир заполнён -> добавляем в waitlist
        const wait = await tx.tournamentRegistration.create({
          data: { tournamentId, teamId, status: "waitlisted" }
        });
        return { waitlist: true, registration: wait };
      } else {
        const reg = await tx.tournamentRegistration.create({
          data: { tournamentId, teamId, status: "registered" }
        });
        return { waitlist: false, registration: reg };
      }
    });

    if (result.waitlist) {
      return res.status(200).json({ message: "Tournament full, team added to waitlist", registration: result.registration });
    } else {
      return res.status(201).json(result.registration);
    }
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    console.error("POST /registrations error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /registrations/:tournamentId/:teamId
 * Отмена регистрации команды (капитан команды или админ).
 * Автоматически поднимает первого в waitlist (FIFO) в registered если место освободилось.
 */
router.delete("/:tournamentId/:teamId", auth, async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);
  const teamId = parseInt(req.params.teamId);
  const user = req.user;

  try {
    // проверим полномочия: капитан или админ
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: user.id, role: "captain", leftAt: null }
    });
    if (!captain && user.role !== "admin") {
      return res.status(403).json({ error: "Only team captain or admin can withdraw registration" });
    }

    await prisma.$transaction(async (tx) => {
      const reg = await tx.tournamentRegistration.findFirst({
        where: { tournamentId, teamId, status: "registered" }
      });
      if (!reg) {
        throw { status: 404, message: "Registration not found (or not active)" };
      }

      // помечаем как withdrawn (сохраняем историю)
      await tx.tournamentRegistration.update({
        where: { id: reg.id },
        data: { status: "withdrawn" }
      });

      // авто-подъём первого waitlisted
      const next = await tx.tournamentRegistration.findFirst({
        where: { tournamentId, status: "waitlisted" },
        orderBy: { id: "asc" }
      });
      if (next) {
        await tx.tournamentRegistration.update({
          where: { id: next.id },
          data: { status: "registered" }
        });
      }
    });

    res.json({ message: "Registration withdrawn (and waitlist promoted if any)" });
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    console.error("DELETE /registrations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
