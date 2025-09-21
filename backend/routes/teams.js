// backend/routes/teams.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * 📌 Получить список всех команд
 */
router.get("/", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        memberships: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        division: true,
      },
    });

    const formatted = teams.map((team) => ({
      id: team.id,
      name: team.name,
      division: team.division
        ? { id: team.division.id, name: team.division.name }
        : null,
      members: team.memberships.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Ошибка при получении списка команд:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/**
 * 📌 Создать команду (капитан)
 */
router.post("/", auth, async (req, res) => {
  const { name } = req.body;
  const userId = req.user?.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Укажите название команды" });
  }
  if (!userId) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  try {
    // Проверка уникальности названия
    const existing = await prisma.team.findUnique({ where: { name } });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Команда с таким названием уже существует" });
    }

    // Создание команды
    const team = await prisma.team.create({
      data: { name },
    });

    // Создатель → капитан
    await prisma.teamMembership.create({
      data: {
        teamId: team.id,
        userId,
        role: "captain",
        joinedAt: new Date(),
      },
    });

    // Получаем команду с участниками
    const teamWithMembers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        memberships: {
          where: { leftAt: null },
          include: { user: true },
        },
      },
    });

    res.status(201).json({
      id: teamWithMembers.id,
      name: teamWithMembers.name,
      members: teamWithMembers.memberships.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Команда с таким названием уже существует (DB)" });
    }
    console.error("Ошибка при создании команды:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
