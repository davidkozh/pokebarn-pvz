"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Package {
  id: string;
  cellNumber: string;
  storeName: string;
  senderName: string;
  description: string;
  createdAt: string;
  status: "STORED" | "IN_TRANSIT" | "ISSUED";
  pickedUpAt?: string;
  pickedUpBy?: string;
  eventLog?: Array<{ timestamp: string; action: string }>;
}

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 11) return phone;
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "STORED":
      return <span className="badge-stored">На хранении</span>;
    case "IN_TRANSIT":
      return <span className="badge-transit">В пути 🚚</span>;
    case "ISSUED":
      return <span className="badge-issued">Выдана</span>;
    default:
      return null;
  }
};

export default function ClientPackagesPage() {
  const params = useParams();
  const router = useRouter();
  const phone = params.phone as string;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`/api/packages?receiverPhone=${phone}`);
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        setPackages(data.packages || []);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [phone]);

  const activePackages = packages.filter((p) =>
    ["STORED", "IN_TRANSIT"].includes(p.status)
  );
  const historyPackages = packages.filter((p) => p.status === "ISSUED");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pokemon-darkest">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pokemon-yellow border-t-pokemon-blue rounded-full spinner mb-4"></div>
          <p className="text-gray-400">Загрузка посылок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pokemon-darkest p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-pokemon-blue hover:text-pokemon-yellow transition-colors mb-4 inline-block"
          >
            ← Вернуться на главную
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-pokemon-yellow mb-2">
            Мои посылки
          </h1>
          <p className="text-gray-400">{formatPhone(phone)}</p>
        </div>

        {/* Active Packages Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Активные посылки</h2>
          {activePackages.length === 0 ? (
            <div className="card-dark p-8 text-center">
              <p className="text-gray-400">Посылок не найдено</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePackages.map((pkg) => (
                <div key={pkg.id} className="card-dark p-6">
                  {/* Package Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-pokemon-yellow">
                          {pkg.status === "IN_TRANSIT"
                            ? "В пути 🚚"
                            : `Ячейка ${pkg.cellNumber}`}
                        </h3>
                        {getStatusBadge(pkg.status)}
                      </div>
                      <p className="text-gray-400">{pkg.storeName}</p>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="space-y-2 mb-4 text-gray-300">
                    <p>
                      <span className="font-semibold text-gray-300">От:</span>{" "}
                      {pkg.senderName}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-300">
                        Описание:
                      </span>{" "}
                      {pkg.description}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-300">Дата:</span>{" "}
                      {formatDate(pkg.createdAt)}
                    </p>
                  </div>

                  {/* Log Toggle */}
                  {pkg.eventLog && pkg.eventLog.length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedLog(
                          expandedLog === pkg.id ? null : pkg.id
                        )
                      }
                      className="text-pokemon-blue hover:text-pokemon-yellow text-sm font-semibold transition-colors"
                    >
                      {expandedLog === pkg.id
                        ? "Скрыть историю"
                        : "Показать историю"}
                    </button>
                  )}

                  {/* Log */}
                  {expandedLog === pkg.id && pkg.eventLog && (
                    <div className="mt-4 pt-4 border-t border-pokemon-darker">
                      <div className="space-y-2">
                        {pkg.eventLog.map((log, idx) => (
                          <p key={idx} className="text-sm text-gray-400">
                            <span className="text-gray-500">
                              {formatDate(log.timestamp)}
                            </span>{" "}
                            - {log.action}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Section */}
        {historyPackages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">История</h2>
            <div className="space-y-4">
              {historyPackages.map((pkg) => (
                <div key={pkg.id} className="card-dark p-6 opacity-75">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-300">
                          Ячейка {pkg.cellNumber}
                        </h3>
                        {getStatusBadge(pkg.status)}
                      </div>
                      <p className="text-gray-400">{pkg.storeName}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-gray-400 text-sm">
                    <p>
                      <span className="font-semibold">От:</span> {pkg.senderName}
                    </p>
                    <p>
                      <span className="font-semibold">Описание:</span>{" "}
                      {pkg.description}
                    </p>
                    <p>
                      <span className="font-semibold">Дата получения:</span>{" "}
                      {formatDate(pkg.createdAt)}
                    </p>
                    {pkg.pickedUpAt && (
                      <p>
                        <span className="font-semibold">Дата выдачи:</span>{" "}
                        {formatDate(pkg.pickedUpAt)}
                        {pkg.pickedUpBy && ` (${pkg.pickedUpBy})`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
