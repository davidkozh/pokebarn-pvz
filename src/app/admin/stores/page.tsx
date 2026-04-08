"use client";

import { useEffect, useState } from "react";

interface Store {
  id: string;
  name: string;
  totalCells: number;
  occupiedCells: number;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewStoreForm, setShowNewStoreForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

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
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleAddStore = async () => {
    if (!newStoreName) {
      setError("Введите название магазина");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStoreName }),
      });

      if (response.ok) {
        const data = await response.json();
        setStores((prev) => [
          ...prev,
          {
            id: data.store.id,
            name: data.store.name,
            totalCells: 0,
            occupiedCells: 0,
          },
        ]);
        setNewStoreName("");
        setShowNewStoreForm(false);
      } else {
        setError("Ошибка при создании магазина");
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
          <p className="text-gray-400">Загрузка магазинов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-pokemon-yellow mb-6 md:mb-0">
            Магазины
          </h1>
          <button
            onClick={() => setShowNewStoreForm(!showNewStoreForm)}
            className="btn-primary"
          >
            + Новый магазин
          </button>
        </div>

        {/* New Store Form */}
        {showNewStoreForm && (
          <div className="card-dark p-6 mb-8">
            {error && (
              <p className="text-pokemon-red text-sm mb-4">{error}</p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название магазина
                </label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Введите название магазина"
                  className="input-dark w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewStoreForm(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddStore}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  {actionLoading ? "..." : "Создать"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stores Grid */}
        {stores.length === 0 ? (
          <div className="card-dark p-8 text-center">
            <p className="text-gray-400">Магазины не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div key={store.id} className="card-dark p-6">
                <h3 className="text-xl font-bold text-pokemon-yellow mb-4">
                  {store.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Ячейки</p>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Загруженность</span>
                      <span>
                        {store.occupiedCells}/{store.totalCells}
                      </span>
                    </div>
                    <div className="w-full bg-pokemon-darker rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-pokemon-yellow h-full transition-all"
                        style={{
                          width:
                            store.totalCells > 0
                              ? `${(store.occupiedCells / store.totalCells) * 100}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-pokemon-darker">
                    <p className="text-gray-400 text-sm">
                      Свободных ячеек:{" "}
                      <span className="text-pokemon-blue font-semibold">
                        {Math.max(0, store.totalCells - store.occupiedCells)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
