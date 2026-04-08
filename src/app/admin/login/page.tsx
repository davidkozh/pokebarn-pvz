"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Неправильный пароль");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        router.push("/admin");
      } else {
        setError("Ошибка входа");
        setLoading(false);
      }
    } catch (err) {
      setError("Ошибка подключения к серверу");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pokemon-darkest px-4">
      <div className="card-dark w-full max-w-md p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-pokemon-yellow text-center mb-8">
          Вход в панель управления
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="input-dark w-full"
              disabled={loading}
            />
            {error && (
              <p className="text-pokemon-red text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
