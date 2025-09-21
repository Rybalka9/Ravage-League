// frontend/pages/divisions/[id].js
import { useRouter } from "next/router";
import Link from "next/link";

const divisionNames = {
  amateur: "Amateur Division",
  "semi-pro": "Semi-Pro Division",
  pro: "Pro Division",
  elite: "Elite Division",
};

export default function DivisionPage() {
  const router = useRouter();
  const { id } = router.query;

  const name = divisionNames[id] || "Unknown Division";

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">
        {name}
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <p className="text-gray-600">
          Здесь будет список команд этого дивизиона (пока заглушка).
        </p>
      </div>

      <div className="mt-6">
        <Link href="/divisions" className="text-blue-600 hover:underline">
          ⬅ Назад к списку дивизионов
        </Link>
      </div>
    </div>
  );
}
