// frontend/pages/register.js
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const { register: doRegister } = useAuth();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      await doRegister(data);
      toast.success("Успешная регистрация. Войдите.");
      router.push("/login");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Ошибка регистрации");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h1 className="text-2xl mb-4">Регистрация</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register("name", { required: true })} placeholder="Имя" className="w-full border p-2 rounded" />
        <input {...register("email", { required: true })} placeholder="Email" className="w-full border p-2 rounded" />
        <input {...register("password", { required: true })} type="password" placeholder="Пароль" className="w-full border p-2 rounded" />
        <button className="w-full bg-green-600 text-white py-2 rounded">Зарегистрироваться</button>
      </form>
    </div>
  );
}
