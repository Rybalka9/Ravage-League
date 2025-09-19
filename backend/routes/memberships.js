// backend/routes/memberships.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * Игрок выходит из команды
 */
router.post("/leave/:teamId", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);

  try {
    const membership = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, leftAt: null }
    });

    if (!membership) {
      return res.status(404).json({ error: "Вы не состоите в этой команде" });
    }

    // Если капитан выходит
    if (membership.role === "captain") {
      const members = await prisma.teamMembership.findMany({
        where: { teamId, leftAt: null }
      });

      if (members.length > 1) {
        // назначаем нового капитана (первого попавшегося игрока)
        const newCaptain = members.find(m => m.userId !== req.user.id);
        await prisma.teamMembership.update({
          where: { id: newCaptain.id },
          data: { role: "captain" }
        });
      } else {
        // если капитан был один, удаляем команду
        await prisma.team.delete({ where: { id: teamId } });
      }
    }

    // помечаем выход
    await prisma.teamMembership.update({
      where: { id: membership.id },
      data: { leftAt: new Date() }
    });

    res.json({ message: "Вы вышли из команды" });
  } catch (err) {
    console.error("Ошибка выхода из команды:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Капитан кикает игрока
 */
router.post("/kick/:teamId/:userId", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const userId = parseInt(req.params.userId);

  try {
    // проверяем, что текущий юзер — капитан
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null }
    });
    if (!captain) {
      return res.status(403).json({ error: "Только капитан может кикать игроков" });
    }

    // находим игрока
    const member = await prisma.teamMembership.findFirst({
      where: { teamId, userId, leftAt: null }
    });
    if (!member) {
      return res.status(404).json({ error: "Игрок не найден в команде" });
    }

    if (member.role === "captain") {
      return res.status(400).json({ error: "Нельзя кикнуть капитана" });
    }

    await prisma.teamMembership.update({
      where: { id: member.id },
      data: { leftAt: new Date() }
    });

    res.json({ message: "Игрок кикнут" });
  } catch (err) {
    console.error("Ошибка кика игрока:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Передача капитанства другому игроку
 */
router.post("/transfer-captain/:teamId/:userId", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const newCaptainId = parseInt(req.params.userId);

  try {
    // проверяем, что текущий юзер — капитан
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null }
    });
    if (!captain) {
      return res.status(403).json({ error: "Только капитан может передавать капитанство" });
    }

    // проверяем, что кандидат существует в команде
    const member = await prisma.teamMembership.findFirst({
      where: { teamId, userId: newCaptainId, leftAt: null }
    });
    if (!member) {
      return res.status(404).json({ error: "Игрок не найден в команде" });
    }

    // обновляем роли
    await prisma.teamMembership.update({
      where: { id: captain.id },
      data: { role: "player" }
    });

    await prisma.teamMembership.update({
      where: { id: member.id },
      data: { role: "captain" }
    });

    res.json({ message: "Капитанство передано" });
  } catch (err) {
    console.error("Ошибка передачи капитанства:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
