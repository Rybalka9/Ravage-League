// backend/routes/invites.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

// 1. Отправить приглашение игроку
router.post("/:teamId", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const { userId } = req.body;

  if (!teamId || !userId) {
    return res.status(400).json({ error: "teamId и userId обязательны" });
  }

  try {
    // Проверяем, что текущий юзер — капитан этой команды
    const membership = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null }
    });
    if (!membership) {
      return res.status(403).json({ error: "Только капитан может приглашать игроков" });
    }

    // Проверяем, что у игрока нет активной команды
    const existingMembership = await prisma.teamMembership.findFirst({
      where: { userId, leftAt: null }
    });
    if (existingMembership) {
      return res.status(400).json({ error: "Игрок уже состоит в другой команде" });
    }

    // Проверяем, что нет активного приглашения в эту же команду
    const existingInvite = await prisma.invite.findFirst({
      where: { teamId, userId, status: "pending" }
    });
    if (existingInvite) {
      return res.status(400).json({ error: "Уже есть активное приглашение" });
    }

    // Создаём приглашение
    const invite = await prisma.invite.create({
      data: { teamId, userId }
    });

    res.status(201).json(invite);
  } catch (err) {
    console.error("Ошибка при отправке приглашения:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Получить список приглашений текущего пользователя
router.get("/", auth, async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      where: { userId: req.user.id },
      include: { team: true }
    });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Принять приглашение
router.patch("/:id/accept", auth, async (req, res) => {
  const inviteId = parseInt(req.params.id);

  try {
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: { team: true }
    });

    if (!invite || invite.userId !== req.user.id) {
      return res.status(404).json({ error: "Приглашение не найдено" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Приглашение уже обработано" });
    }

    // Проверяем, что юзер ещё не в команде
    const existing = await prisma.teamMembership.findFirst({
      where: { userId: req.user.id, leftAt: null }
    });
    if (existing) {
      return res.status(400).json({ error: "Вы уже состоите в команде" });
    }

    // Обновляем статус приглашения
    const accepted = await prisma.invite.update({
      where: { id: inviteId },
      data: { status: "accepted" }
    });

    // Создаём membership
    await prisma.teamMembership.create({
      data: {
        teamId: invite.teamId,
        userId: req.user.id,
        role: "player"
      }
    });

    // Авто-отклоняем остальные pending приглашения
    await prisma.invite.updateMany({
      where: { userId: req.user.id, status: "pending", id: { not: inviteId } },
      data: { status: "declined" }
    });

    res.json({ message: "Вы вступили в команду!", invite: accepted });
  } catch (err) {
    console.error("Ошибка при принятии приглашения:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Отклонить приглашение
router.patch("/:id/decline", auth, async (req, res) => {
  const inviteId = parseInt(req.params.id);

  try {
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.userId !== req.user.id) {
      return res.status(404).json({ error: "Приглашение не найдено" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Приглашение уже обработано" });
    }

    const declined = await prisma.invite.update({
      where: { id: inviteId },
      data: { status: "declined" }
    });

    res.json({ message: "Приглашение отклонено", invite: declined });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
