// backend/routes/divisions.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// 📌 Получить список всех дивизионов
router.get("/", async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      include: {
        teams: true,
        tournaments: true,
      },
    });
    res.json(divisions);
  } catch (err) {
    console.error("Ошибка при получении дивизионов:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 📌 Создать новый дивизион (только админ)
router.post("/", auth, isAdmin, async (req, res) => {
  const { name, maxTeams, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Укажите название дивизиона" });
  }

  try {
    const newDivision = await prisma.division.create({
      data: {
        name,
        maxTeams: maxTeams ? parseInt(maxTeams) : 0,
        description: description || null,
      },
    });
    res.json(newDivision);
  } catch (err) {
    console.error("Ошибка при создании дивизиона:", err);
    res.status(500).json({ error: err.message || "Ошибка сервера" });
  }
});

// 📌 Удалить дивизион (только админ)
router.delete("/:id", auth, isAdmin, async (req, res) => {
  const divisionId = parseInt(req.params.id);

  if (Number.isNaN(divisionId)) {
    return res.status(400).json({ error: "Некорректный ID" });
  }

  try {
    await prisma.division.delete({ where: { id: divisionId } });
    res.json({ message: "Дивизион удалён" });
  } catch (err) {
    console.error("Ошибка при удалении дивизиона:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
