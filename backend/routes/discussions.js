const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * 📌 Создать пост в обсуждении турнира
 */
router.post("/posts", auth, async (req, res) => {
  const { tournamentId, content } = req.body;

  if (!tournamentId || !content) {
    return res.status(400).json({ error: "Нужно указать tournamentId и content" });
  }

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return res.status(404).json({ error: "Турнир не найден" });
    }

    const post = await prisma.discussionPost.create({
      data: {
        tournamentId,
        userId: req.user.id,
        content,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Ошибка при создании поста:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 📌 Получить посты турнира
 */
router.get("/posts/:tournamentId", async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);

  try {
    const posts = await prisma.discussionPost.findMany({
      where: { tournamentId },
      include: {
        user: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    console.error("Ошибка при получении постов:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 📌 Добавить комментарий к посту
 */
router.post("/comments", auth, async (req, res) => {
  const { postId, content } = req.body;

  if (!postId || !content) {
    return res.status(400).json({ error: "Нужно указать postId и content" });
  }

  try {
    const post = await prisma.discussionPost.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: "Пост не найден" });
    }

    const comment = await prisma.discussionComment.create({
      data: {
        postId,
        userId: req.user.id,
        content,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error("Ошибка при создании комментария:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 📌 Удалить пост (автор или админ)
 */
router.delete("/posts/:id", auth, async (req, res) => {
  const postId = parseInt(req.params.id);

  try {
    const post = await prisma.discussionPost.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: "Пост не найден" });

    if (req.user.role !== "admin" && post.userId !== req.user.id) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    await prisma.discussionPost.delete({ where: { id: postId } });

    res.json({ message: "Пост удалён" });
  } catch (err) {
    console.error("Ошибка при удалении поста:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 📌 Удалить комментарий (автор или админ)
 */
router.delete("/comments/:id", auth, async (req, res) => {
  const commentId = parseInt(req.params.id);

  try {
    const comment = await prisma.discussionComment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Комментарий не найден" });

    if (req.user.role !== "admin" && comment.userId !== req.user.id) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    await prisma.discussionComment.delete({ where: { id: commentId } });

    res.json({ message: "Комментарий удалён" });
  } catch (err) {
    console.error("Ошибка при удалении комментария:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
