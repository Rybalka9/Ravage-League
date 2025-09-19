// frontend/pages/login.js
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success("Успешный вход");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h1 className="text-2xl mb-4">Войти</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register("email", { required: true })} placeholder="Email" className="w-full border p-2 rounded" />
        <input {...register("password", { required: true })} type="password" placeholder="Пароль" className="w-full border p-2 rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Войти</button>
      </form>
    </div>
  );
}
