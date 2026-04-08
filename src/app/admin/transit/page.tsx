"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TransitPackage {
  id: string;
  cellNumber: string;
  storeName: string;
  senderName: string;
  receiverName: string;
  description: string;
  createdAt: string;
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

export default function TransitPage() {
  const [packages, setPackages] = useState<TransitPackage[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TransitPackage | null>(
    null
  );
  const [selectedCell, setSelectedCell] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        // BUG-005 fix: use /api/transit which returns { packages: [...] }
        const response = await fetch("/api/transit");
        if (response.ok) {
          const data = await response.json();
          setPackages(data.packages || []);
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleOpenModal = async (pkg: TransitPackage) => {
    setSelectedPackage(pkg);
    setSelectedCell("");
    setError("");

    try {
      const response = await fetch("/api/cells?status=free");
      if (response.ok) {
        const data = await response.json();
        setCells(data.cells || []);
      }
    } catch (err) {
      setError("Ошибка при загрузке свободных ячеек");
    }

    setModalOpen(true);
  };

  const handleReceivePackage = async () => {
    if (!selectedCell || !selectedPackage) {
      setError("Выберите ячейку");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECEIVE_TRANSIT",
          cellId: selectedCell,
        }),
      });

      if (response.ok) {
        // Remove package from list
        setPackages(packages.filter((p) => p.id !== selectedPackage.id));
        setModalOpen(false);
      } else {
        setError("Ошибка при приемке посылки");
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
          <p className="text-gray-400">Загрузка транзита...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-pokemon-yellow mb-8">
          Входящий транзит
        </h1>

        {packages.length === 0 ? (
          <div className="card-dark p-8 text-center">
            <p className="text-gray-400">Нет посылок в транзите</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card-dark p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-pokemon-yellow mb-2">
                      {pkg.storeName}
                    </h3>
                    <div className="space-y-1 text-gray-400 text-sm mb-4">
                      <p>
                        <span className="font-semibold">От:</span> {pkg.senderName}
                      </p>
                      <p>
                        <span className="font-semibold">Кому:</span>{" "}
                        {pkg.receiverName}
                      </p>
                      <p>
                        <span className="font-semibold">Описание:</span>{" "}
                        {pkg.description}
                      </p>
                      <p>
                        <span className="font-semibold">Дата:</span>{" "}
                        {formatDate(pkg.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenModal(pkg)}
                    className="btn-primary mt-4 md:mt-0"
                  >
                    Принять
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedPackage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold text-pokemon-yellow mb-4">
              Принять посылку
            </h2>

            <p className="text-gray-300 mb-4">
              Посылка от <strong>{selectedPackage.senderName}</strong> для{" "}
              <strong>{selectedPackage.receiverName}</strong>
            </p>

            {error && (
              <p className="text-pokemon-red text-sm mb-4">{error}</p>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Выберите ячейку
              </label>
              <select
                value={selectedCell}
                onChange={(e) => setSelectedCell(e.target.value)}
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

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Отмена
              </button>
              <button
                onClick={handleReceivePackage}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                {actionLoading ? "..." : "Принять"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
