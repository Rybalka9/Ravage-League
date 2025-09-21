// backend/routes/teamMemberships.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * 📌 Пригласить игрока в команду (только капитан)
 */
router.post("/:teamId/invite", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Нужно указать userId" });

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Команда не найдена" });

    // Проверяем, что автор запроса — капитан
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null },
    });
    if (!captain) {
      return res.status(403).json({ error: "Только капитан может приглашать игроков" });
    }

    // Проверяем, не состоит ли уже игрок в этой команде
    const existing = await prisma.teamMembership.findFirst({
      where: { teamId, userId, leftAt: null },
    });
    if (existing) {
      return res.status(409).json({ error: "Игрок уже в команде" });
    }

    // Создаём запись (по умолчанию player)
    const membership = await prisma.teamMembership.create({
      data: {
        teamId,
        userId,
        role: "player",
        joinedAt: new Date(),
      },
    });

    res.status(201).json({ message: "Игрок добавлен в команду", membership });
  } catch (err) {
    console.error("Ошибка при приглашении игрока:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Выйти из команды (сам игрок)
 */
router.post("/:teamId/leave", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);

  try {
    const membership = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, leftAt: null },
    });

    if (!membership) {
      return res.status(404).json({ error: "Вы не состоите в этой команде" });
    }

    // Капитан не может выйти, пока не назначит другого
    if (membership.role === "captain") {
      return res.status(400).json({ error: "Капитан не может выйти — назначьте нового капитана" });
    }

    await prisma.teamMembership.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    res.json({ message: "Вы покинули команду" });
  } catch (err) {
    console.error("Ошибка при выходе из команды:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Кикнуть игрока (только капитан)
 */
router.post("/:teamId/kick", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Нужно указать userId" });

  try {
    // Проверяем капитана
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null },
    });
    if (!captain) {
      return res.status(403).json({ error: "Только капитан может исключать игроков" });
    }

    // Проверяем, что игрок действительно в команде
    const membership = await prisma.teamMembership.findFirst({
      where: { teamId, userId, leftAt: null },
    });
    if (!membership) {
      return res.status(404).json({ error: "Игрок не найден в этой команде" });
    }

    // Нельзя кикнуть капитана (самого себя)
    if (membership.role === "captain") {
      return res.status(400).json({ error: "Нельзя кикнуть капитана" });
    }

    await prisma.teamMembership.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    res.json({ message: "Игрок исключён из команды" });
  } catch (err) {
    console.error("Ошибка при кике игрока:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Передать капитанство другому игроку
 */
router.post("/:teamId/transfer-captain", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Нужно указать userId" });

  try {
    // Проверяем капитана
    const captain = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null },
    });
    if (!captain) {
      return res.status(403).json({ error: "Только текущий капитан может передать лидерство" });
    }

    // Проверяем, что новый капитан в команде
    const newCaptain = await prisma.teamMembership.findFirst({
      where: { teamId, userId, leftAt: null },
    });
    if (!newCaptain) {
      return res.status(404).json({ error: "Игрок не найден в этой команде" });
    }

    // Меняем роли
    await prisma.$transaction([
      prisma.teamMembership.update({
        where: { id: captain.id },
        data: { role: "player" },
      }),
      prisma.teamMembership.update({
        where: { id: newCaptain.id },
        data: { role: "captain" },
      }),
    ]);

    res.json({ message: "Капитанство передано" });
  } catch (err) {
    console.error("Ошибка при передаче капитанства:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
