"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 1) return `+7 (${cleaned}`;
    if (cleaned.length <= 4) return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    if (cleaned.length <= 7)
      return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    if (cleaned.length <= 9)
      return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPhoneDisplay(e.target.value);
    setPhone(value);
    setError("");
  };

  const validatePhone = (phoneValue: string): boolean => {
    const cleaned = phoneValue.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError("Введите корректный номер телефона (10 цифр)");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(phone)) return;

    const cleaned = phone.replace(/\D/g, "");
    const normalizedPhone = `7${cleaned}`;
    router.push(`/my/${normalizedPhone}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pokemon-darkest px-4">
      <div className="card-dark w-full max-w-md p-8 shadow-2xl">
        {/* Pokéball Header */}
        <div className="flex justify-center mb-8">
          <div className="text-6xl">⚡</div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-pokemon-yellow mb-2">
          Покебарн
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Сервис хранения посылок
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Номер телефона
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 (___) ___-__-__"
              className="input-dark w-full text-lg"
              maxLength={18}
            />
            {error && <p className="text-pokemon-red text-sm mt-2">{error}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full text-lg font-semibold py-3"
          >
            Найти посылки
          </button>
        </form>

        {/* Footer Info */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Введите свой номер телефона, чтобы посмотреть ваши посылки
        </p>
      </div>
    </div>
  );
}
