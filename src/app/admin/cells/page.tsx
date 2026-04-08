"use client";

import { useEffect, useState } from "react";

interface Cell {
  id: string;
  storeId: number;
  cellNumber: string;
  storeName: string;
  status: "FREE" | "OCCUPIED";
  clientName?: string;
  packageCount: number;
}

interface Store {
  id: string;
  name: string;
}

export default function CellsPage() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStore, setFilterStore] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  const [cellCount, setCellCount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cellsRes, storesRes] = await Promise.all([
          fetch("/api/cells"),
          fetch("/api/stores"),
        ]);

        if (cellsRes.ok) {
          const data = await cellsRes.json();
          setCells(data.cells || []);
        }

        if (storesRes.ok) {
          const data = await storesRes.json();
          setStores(data.stores || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddCells = async () => {
    if (!selectedStore || !cellCount) {
      setError("Выберите магазин и введите количество");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStore,
          count: parseInt(cellCount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCells((prev) => [...prev, ...(data.cells || [])]);
        setModalOpen(false);
        setSelectedStore("");
        setCellCount("");
      } else {
        setError("Ошибка при добавлении ячеек");
      }
    } catch (err) {
      setError("Ошибка подключения к серверу");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCells = cells.filter((cell) => {
    // BUG-008 fix: compare cell.storeId (not cell.id) with the selected store string
    if (filterStore && String(cell.storeId) !== filterStore) return false;
    if (filterStatus && cell.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pokemon-darkest">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pokemon-yellow border-t-pokemon-blue rounded-full spinner mb-4"></div>
          <p className="text-gray-400">Загрузка ячеек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-pokemon-yellow mb-6 md:mb-0">
            Управление ячейками
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            + Добавить ячейки
          </button>
        </div>

        {/* Filters */}
        <div className="card-dark p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Фильтр по магазину
              </label>
              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Все магазины</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Фильтр по статусу
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-dark w-full"
              >
                <option value="">Все статусы</option>
                <option value="FREE">Свободные</option>
                <option value="OCCUPIED">Занятые</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card-dark overflow-x-auto">
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th>Номер ячейки</th>
                <th>Магазин</th>
                <th>Статус</th>
                <th>Клиент</th>
                <th>Посылок</th>
              </tr>
            </thead>
            <tbody>
              {filteredCells.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <p className="text-gray-400">Ячейки не найдены</p>
                  </td>
                </tr>
              ) : (
                filteredCells.map((cell) => (
                  <tr key={cell.id}>
                    <td className="font-semibold text-pokemon-yellow">
                      {cell.cellNumber}
                    </td>
                    <td>{cell.storeName}</td>
                    <td>
                      {cell.status === "FREE" ? (
                        <span className="badge-stored">Свободна</span>
                      ) : (
                        <span className="badge-transit">Занята</span>
                      )}
                    </td>
                    <td>{cell.clientName || "-"}</td>
                    <td>{cell.packageCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold text-pokemon-yellow mb-4">
              Добавить ячейки
            </h2>

            {error && (
              <p className="text-pokemon-red text-sm mb-4">{error}</p>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Магазин
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Количество
                </label>
                <input
                  type="number"
                  value={cellCount}
                  onChange={(e) => setCellCount(e.target.value)}
                  placeholder="10"
                  className="input-dark w-full"
                  min="1"
                />
              </div>
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
                onClick={handleAddCells}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                {actionLoading ? "..." : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
