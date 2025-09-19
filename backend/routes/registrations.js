// backend/routes/registrations.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * Команда подаёт заявку на участие в турнире
 */
router.post("/:tournamentId", auth, async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);

  try {
    // Проверяем, что пользователь капитан
    const membership = await prisma.teamMembership.findFirst({
      where: { userId: req.user.id, role: "captain", leftAt: null },
      include: { team: true }
    });

    if (!membership) {
      return res.status(403).json({ error: "Только капитан может регистрировать команду" });
    }

    // Проверяем, что команда ещё не участвует
    const existing = await prisma.tournamentRegistration.findFirst({
      where: { tournamentId, teamId: membership.teamId }
    });
    if (existing) {
      return res.status(400).json({ error: "Команда уже зарегистрирована в этом турнире" });
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.status !== "upcoming") {
      return res.status(400).json({ error: "Регистрация закрыта" });
    }

    // Проверяем дедлайн регистрации (за 1 час до старта)
    const now = new Date();
    const deadline = new Date(tournament.startDate);
    deadline.setHours(deadline.getHours() - 1);

    if (now >= deadline) {
      return res.status(400).json({ error: "Регистрация уже закрыта (менее часа до старта)" });
    }

    // Проверяем лимит мест
    if (tournament.maxTeams) {
      const count = await prisma.tournamentRegistration.count({ where: { tournamentId } });
      if (count >= tournament.maxTeams) {
        return res.status(400).json({ error: "Все слоты заняты" });
      }
    }

    const reg = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        teamId: membership.teamId,
        status: "approved" // сразу подтверждаем
      }
    });

    res.status(201).json(reg);
  } catch (err) {
    console.error("Ошибка при регистрации команды:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
