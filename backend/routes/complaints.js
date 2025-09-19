const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * Подать жалобу на турнир или матч
 * - tournamentId или matchId (одно из двух обязательно)
 */
router.post("/", auth, async (req, res) => {
  const { tournamentId, matchId, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Текст жалобы обязателен" });
  }
  if (!tournamentId && !matchId) {
    return res.status(400).json({ error: "Нужно указать tournamentId или matchId" });
  }

  try {
    // Проверка: существует ли турнир или матч
    if (tournamentId) {
      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) {
        return res.status(404).json({ error: "Турнир не найден" });
      }
    }
    if (matchId) {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) {
        return res.status(404).json({ error: "Матч не найден" });
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        tournamentId: tournamentId || null,
        matchId: matchId || null,
        userId: req.user.id,
        text,
        status: "open",
      },
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error("Ошибка при создании жалобы:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Получить все жалобы (только для админа)
 */
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Только админ может просматривать все жалобы" });
  }

  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        tournament: { select: { id: true, name: true } },
        match: { select: { id: true, scheduled: true } },
      },
      orderBy: { id: "desc" },
    });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Получить жалобы текущего пользователя
 */
router.get("/my", auth, async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { userId: req.user.id },
      include: {
        tournament: { select: { id: true, name: true } },
        match: { select: { id: true, scheduled: true } },
      },
      orderBy: { id: "desc" },
    });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Получить конкретную жалобу (админ или автор)
 */
router.get("/:id", auth, async (req, res) => {
  const complaintId = parseInt(req.params.id);

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tournament: { select: { id: true, name: true } },
        match: { select: { id: true, scheduled: true } },
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Жалоба не найдена" });
    }

    if (req.user.role !== "admin" && complaint.userId !== req.user.id) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Изменить статус жалобы (только админ)
 */
router.patch("/:id/status", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Только админ может менять статус жалоб" });
  }

  const complaintId = parseInt(req.params.id);
  const { status } = req.body; // "open" | "in_review" | "resolved"

  if (!["open", "in_review", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Неверный статус" });
  }

  try {
    const complaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: { status },
    });

    res.json(complaint);
  } catch (err) {
    console.error("Ошибка при изменении статуса жалобы:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Удалить жалобу (автор или админ)
 */
router.delete("/:id", auth, async (req, res) => {
  const complaintId = parseInt(req.params.id);

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      return res.status(404).json({ error: "Жалоба не найдена" });
    }

    if (req.user.role !== "admin" && complaint.userId !== req.user.id) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    await prisma.complaint.delete({ where: { id: complaintId } });

    res.json({ message: "Жалоба удалена" });
  } catch (err) {
    console.error("Ошибка при удалении жалобы:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
