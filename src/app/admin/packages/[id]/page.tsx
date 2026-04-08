"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PackageDetail {
  id: string;
  cellNumber: string;
  storeName: string;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  description: string;
  createdAt: string;
  status: "STORED" | "IN_TRANSIT" | "ISSUED";
  pickedUpAt?: string;
  pickedUpBy?: string;
  eventLog: Array<{ timestamp: string; action: string }>;
}

interface Store {
  id: string;
  name: string;
}

interface Cell {
  id: string;
  cellNumber: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 11) return phone;
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
};

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "issue" | "transit" | "cell" | null
  >(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedValue, setSelectedValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await fetch(`/api/packages/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPkg(data.package);
        }
      } catch (err) {
        console.error("Error fetching package:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch("/api/stores");
        if (response.ok) {
          const data = await response.json();
          setStores(data.stores || []);
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };

    fetchStores();
  }, []);

  const handleOpenModal = async (
    type: "issue" | "transit" | "cell"
  ) => {
    setModalType(type);
    setSelectedValue("");
    setError("");

    if (type === "transit") {
      try {
        const response = await fetch("/api/stores");
        if (response.ok) {
          const data = await response.json();
          setStores(data.stores || []);
        }
      } catch (err) {
        setError("Ошибка при загрузке магазинов");
      }
    } else if (type === "cell" && pkg) {
      try {
        const response = await fetch(`/api/cells?storeId=${pkg.id}&status=free`);
        if (response.ok) {
          const data = await response.json();
          setCells(data.cells || []);
        }
      } catch (err) {
        setError("Ошибка при загрузке ячеек");
      }
    }

    setModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedValue) {
      setError("Выберите значение");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const body: any = { action: "" };

      if (modalType === "issue") {
        body.action = "ISSUE";
        body.pickedUpBy = selectedValue || pkg?.receiverName;
      } else if (modalType === "transit") {
        body.action = "SEND_TRANSIT";
        body.targetStoreId = selectedValue;
      } else if (modalType === "cell") {
        body.action = "CHANGE_CELL";
        body.cellId = selectedValue;
      }

      const response = await fetch(`/api/packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setPkg(data.package);
        setModalOpen(false);
      } else {
        setError("Ошибка при выполнении действия");
      }
    } catch (err) {
      setError("Ошибка подключения к серверу");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pokemon-darkest">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pokemon-yellow border-t-pokemon-blue rounded-full spinner mb-4"></div>
          <p className="text-gray-400">Загрузка посылки...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="p-6 bg-pokemon-darkest min-h-screen">
        <p className="text-gray-400">Посылка не найдена</p>
      </div>
    );
  }

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

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="text-pokemon-blue hover:text-pokemon-yellow transition-colors mb-6 inline-block"
        >
          ← Вернуться
        </Link>

        <div className="card-dark p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-pokemon-yellow mb-2">
                Ячейка {pkg.cellNumber}
              </h1>
              <p className="text-gray-400">{pkg.storeName}</p>
            </div>
            {getStatusBadge(pkg.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-pokemon-darker">
            <div>
              <p className="text-gray-500 text-sm mb-1">Отправитель</p>
              <p className="text-gray-200 font-semibold">{pkg.senderName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Получатель</p>
              <p className="text-gray-200 font-semibold">{pkg.receiverName}</p>
              <p className="text-gray-400 text-sm">{formatPhone(pkg.receiverPhone)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Описание</p>
              <p className="text-gray-200">{pkg.description}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Дата приемки</p>
              <p className="text-gray-200">{formatDate(pkg.createdAt)}</p>
            </div>
            {pkg.pickedUpAt && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Дата выдачи</p>
                <p className="text-gray-200">{formatDate(pkg.pickedUpAt)}</p>
              </div>
            )}
            {pkg.pickedUpBy && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Выдана</p>
                <p className="text-gray-200">{pkg.pickedUpBy}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {pkg.status === "STORED" && (
              <>
                <button
                  onClick={() => handleOpenModal("issue")}
                  className="btn-primary"
                >
                  Выдать посылку
                </button>
                <button
                  onClick={() => handleOpenModal("transit")}
                  className="btn-info"
                >
                  Отправить в другой магазин
                </button>
                <button
                  onClick={() => handleOpenModal("cell")}
                  className="btn-secondary"
                >
                  Изменить ячейку
                </button>
              </>
            )}
            {pkg.status === "IN_TRANSIT" && (
              <button onClick={() => handleOpenModal("transit")} className="btn-primary">
                Принять посылку
              </button>
            )}
          </div>
        </div>

        {/* Event Log */}
        <div className="card-dark p-8">
          <h2 className="text-2xl font-bold text-pokemon-yellow mb-6">
            События
          </h2>
          {pkg.eventLog && pkg.eventLog.length > 0 ? (
            <div className="space-y-3">
              {pkg.eventLog.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-pokemon-darker rounded-lg"
                >
                  <div className="w-2 h-2 bg-pokemon-yellow rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-gray-200 font-medium">{log.action}</p>
                    <p className="text-gray-500 text-sm">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Нет событий</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold text-pokemon-yellow mb-4">
              {modalType === "issue" && "Выдать посылку"}
              {modalType === "transit" && "Отправить в другой магазин"}
              {modalType === "cell" && "Выбрать ячейку"}
            </h2>

            {error && (
              <p className="text-pokemon-red text-sm mb-4">{error}</p>
            )}

            <div className="mb-6">
              {modalType === "issue" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Кто забирает?
                  </label>
                  <input
                    type="text"
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    placeholder={pkg.receiverName}
                    className="input-dark w-full"
                  />
                </div>
              )}

              {modalType === "transit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Целевой магазин
                  </label>
                  <select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="input-dark w-full"
                  >
                    <option value="">Выберите магазин</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === "cell" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Свободная ячейка
                  </label>
                  <select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="input-dark w-full"
                  >
                    <option value="">Выберите ячейку</option>
                    {cells.map((cell) => (
                      <option key={cell.id} value={cell.id}>
                        {cell.cellNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Отмена
              </button>
              <button
                onClick={handleAction}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                {actionLoading ? "..." : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
