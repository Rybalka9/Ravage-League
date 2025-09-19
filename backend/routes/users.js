// backend/routes/users.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/**
 * GET /users
 * Доступно только админу
 */
router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberships: {
          where: { leftAt: null },
          include: { team: true }
        }
      }
    });
    res.json(users);
  } catch (err) {
    console.error("Ошибка при получении пользователей:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /users/me
 * Профиль текущего пользователя (по токену)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberships: {
          where: { leftAt: null },
          include: { team: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    res.json(user);
  } catch (err) {
    console.error("Ошибка при получении профиля:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /users/:id
 * Профиль другого пользователя (без e-mail, только публичные данные)
 */
router.get("/:id", auth, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (Number.isNaN(userId)) return res.status(400).json({ error: "Invalid user id" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        memberships: {
          where: { leftAt: null },
          include: {
            team: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    res.json(user);
  } catch (err) {
    console.error("Ошибка при получении пользователя:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
