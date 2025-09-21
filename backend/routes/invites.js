// backend/routes/invites.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * 1) Отправить приглашение игроку
 * POST /invites/:teamId
 * body: { userId }
 * Только капитан команды может приглашать.
 */
router.post("/:teamId", auth, async (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { userId } = req.body;

  if (!teamId || !userId) return res.status(400).json({ error: "teamId и userId обязательны" });

  try {
    // Проверяем, что текущий юзер — капитан этой команды
    const captainMembership = await prisma.teamMembership.findFirst({
      where: { teamId, userId: req.user.id, role: "captain", leftAt: null },
    });
    if (!captainMembership) {
      return res.status(403).json({ error: "Только капитан может приглашать игроков" });
    }

    // Проверяем, что у приглашённого нет активной команды
    const existingMembership = await prisma.teamMembership.findFirst({
      where: { userId, leftAt: null },
    });
    if (existingMembership) {
      return res.status(400).json({ error: "Игрок уже состоит в другой команде" });
    }

    // Проверяем, что нет уже pending приглашения в эту команду
    const existingInvite = await prisma.invite.findFirst({
      where: { teamId, userId, status: "pending" },
    });
    if (existingInvite) {
      return res.status(400).json({ error: "Уже есть активное приглашение" });
    }

    // Создаём приглашение
    const invite = await prisma.invite.create({
      data: { teamId, userId },
    });

    // Возвращаем расширенные данные: команда + капитан (если есть) + приглашаемый
    const inviteFull = await prisma.invite.findUnique({
      where: { id: invite.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: {
          include: {
            memberships: {
              where: { role: "captain", leftAt: null },
              include: { user: true },
            },
          },
        },
      },
    });

    return res.status(201).json(inviteFull);
  } catch (err) {
    console.error("Ошибка при отправке приглашения:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * 2) Получить список приглашений текущего пользователя
 * GET /invites
 */
router.get("/", auth, async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      where: { userId: req.user.id },
      include: {
        team: {
          include: {
            memberships: {
              where: { role: "captain", leftAt: null },
              include: { user: true },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return res.json(invites);
  } catch (err) {
    console.error("Ошибка получения приглашений:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * 3) Принять приглашение
 * PATCH /invites/:id/accept
 * Логика — атомарно:
 *  - проверяем invite
 *  - проверяем что пользователь не в другой команде
 *  - обновляем invite -> accepted
 *  - создаём teamMembership
 *  - отклоняем остальные pending приглашения этого пользователя
 */
router.patch("/:id/accept", auth, async (req, res) => {
  const inviteId = parseInt(req.params.id, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({ where: { id: inviteId } });
      if (!invite || invite.userId !== req.user.id) {
        const e = new Error("Приглашение не найдено");
        e.status = 404;
        throw e;
      }
      if (invite.status !== "pending") {
        const e = new Error("Приглашение уже обработано");
        e.status = 400;
        throw e;
      }

      // Проверяем, что юзер ещё не в активной команде
      const existing = await tx.teamMembership.findFirst({
        where: { userId: req.user.id, leftAt: null },
      });
      if (existing) {
        const e = new Error("Вы уже состоите в команде");
        e.status = 400;
        throw e;
      }

      // Обновляем статус приглашения
      const acceptedInvite = await tx.invite.update({
        where: { id: inviteId },
        data: { status: "accepted" },
      });

      // Создаём membership
      const membership = await tx.teamMembership.create({
        data: {
          teamId: invite.teamId,
          userId: req.user.id,
          role: "player",
          joinedAt: new Date(),
        },
      });

      // Авто-отклоняем остальные pending приглашения
      await tx.invite.updateMany({
        where: { userId: req.user.id, status: "pending", id: { not: inviteId } },
        data: { status: "declined" },
      });

      // Вернём полезный объект
      const teamWithCaptain = await tx.team.findUnique({
        where: { id: invite.teamId },
        include: {
          memberships: {
            where: { role: "captain", leftAt: null },
            include: { user: true },
          },
        },
      });

      return { acceptedInvite, membership, team: teamWithCaptain };
    });

    return res.json({ message: "Вы вступили в команду!", ...result });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    console.error("Ошибка при принятии приглашения:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * 4) Отклонить приглашение
 * PATCH /invites/:id/decline
 */
router.patch("/:id/decline", auth, async (req, res) => {
  const inviteId = parseInt(req.params.id, 10);

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
      data: { status: "declined" },
    });

    return res.json({ message: "Приглашение отклонено", invite: declined });
  } catch (err) {
    console.error("Ошибка при отклонении приглашения:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
