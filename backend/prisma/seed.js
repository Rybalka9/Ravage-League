// backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем сидинг базы...");

  // Создаем дивизионы
  const divisions = await prisma.division.createMany({
    data: [
      { name: "Amateur", maxTeams: 500000, description: "Начальный уровень" },
      { name: "Semi-pro", maxTeams: 128, description: "Полупрофессиональный уровень" },
      { name: "Pro", maxTeams: 64, description: "Профессиональный уровень" },
      { name: "Elite", maxTeams: 16, description: "Высший дивизион" },
    ],
    skipDuplicates: true, // если уже есть такие записи — пропускаем
  });

  console.log("✅ Дивизионы созданы:", divisions);

  // Берём id дивизионов
  const amateur = await prisma.division.findUnique({ where: { name: "Amateur" } });
  const semiPro = await prisma.division.findUnique({ where: { name: "Semi-pro" } });
  const pro = await prisma.division.findUnique({ where: { name: "Pro" } });
  const elite = await prisma.division.findUnique({ where: { name: "Elite" } });

  // Создаем тестовые команды
  if (amateur) {
    await prisma.team.create({
      data: { name: "Noobs United", divisionId: amateur.id },
    });
  }
  if (semiPro) {
    await prisma.team.create({
      data: { name: "Half-Pros", divisionId: semiPro.id },
    });
  }
  if (pro) {
    await prisma.team.create({
      data: { name: "Pro Killers", divisionId: pro.id },
    });
  }
  if (elite) {
    await prisma.team.create({
      data: { name: "Elite Gods", divisionId: elite.id },
    });
  }

  console.log("✅ Тестовые команды созданы");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🌱 Сидинг завершён!");
  })
  .catch(async (e) => {
    console.error("❌ Ошибка при сидинге:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
