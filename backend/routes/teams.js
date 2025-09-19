// backend/routes/teams.js
const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

// ================================
// GET /teams - список всех команд
// ================================
router.get("/", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        memberships: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        league: true
      }
    });

    const formatted = teams.map(team => ({
      id: team.id,
      name: team.name,
      league: team.league ? { id: team.league.id, name: team.league.name } : null,
      members: team.memberships.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role
      }))
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /teams error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================================
// POST /teams - создать новую команду (капитан)
// ===========================================
router.post("/", auth, async (req, res) => {
  const { name } = req.body;
  const userId = req.user?.id;

  if (!name || !name.trim()) return res.status(400).json({ error: "name required" });
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Проверяем, есть ли уже команда с таким именем
    const existing = await prisma.team.findFirst({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Команда с таким именем уже существует" });
    }

    // Создаем команду
    const team = await prisma.team.create({
      data: { name }
    });

    // Создатель автоматически становится капитаном
    await prisma.teamMembership.create({
      data: {
        teamId: team.id,
        userId,
        role: "captain",
        joinedAt: new Date()
      }
    });

    const teamWithMembers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        memberships: {
          where: { leftAt: null },
          include: { user: true }
        }
      }
    });

    res.status(201).json({
      id: teamWithMembers.id,
      name: teamWithMembers.name,
      members: teamWithMembers.memberships.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role
      }))
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Команда с таким именем уже существует (DB constraint)" });
    }
    console.error("POST /teams error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
