"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Store {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Cell {
  id: number;
  number: number;
  storeId: number;
}

export default function NewPackagePage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [senderSearch, setSenderSearch] = useState("");
  const [receiverSearch, setReceiverSearch] = useState("");
  const [description, setDescription] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [packageDate, setPackageDate] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const [senderResults, setSenderResults] = useState<Client[]>([]);
  const [receiverResults, setReceiverResults] = useState<Client[]>([]);
  const [selectedSender, setSelectedSender] = useState<Client | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<Client | null>(null);

  const [freeCells, setFreeCells] = useState<Cell[]>([]);
  const [showNewSender, setShowNewSender] = useState(false);
  const [showNewReceiver, setShowNewReceiver] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch stores on mount
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

  // Fetch free cells when store changes
  useEffect(() => {
    if (!storeId) return;

    const fetchCells = async () => {
      try {
        const response = await fetch(
          `/api/cells?storeId=${storeId}&status=free`
        );
        if (response.ok) {
          const data = await response.json();
          const cellList = Array.isArray(data) ? data : (data.cells || []);
          setFreeCells(cellList);
          if (cellList.length > 0) {
            setCellNumber(String(cellList[0].id));
          }
        }
      } catch (err) {
        console.error("Error fetching cells:", err);
      }
    };

    fetchCells();
  }, [storeId]);

  // Debounced search for sender
  useEffect(() => {
    if (!senderSearch || senderSearch.length < 2) {
      setSenderResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/clients/search?q=${encodeURIComponent(senderSearch)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSenderResults(Array.isArray(data) ? data : (data.clients || []));
        }
      } catch (err) {
        console.error("Error searching senders:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [senderSearch]);

  // Debounced search for receiver
  useEffect(() => {
    if (!receiverSearch || receiverSearch.length < 2) {
      setReceiverResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/clients/search?q=${encodeURIComponent(receiverSearch)}`
        );
        if (response.ok) {
          const data = await response.json();
          setReceiverResults(Array.isArray(data) ? data : (data.clients || []));
        }
      } catch (err) {
        console.error("Error searching receivers:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [receiverSearch]);

  const handleCreateNewClient = async (role: "sender" | "receiver") => {
    if (!newClientName || !newClientPhone) {
      setError("Введите имя и номер телефона");
      return;
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName, phone: newClientPhone }),
      });

      if (response.ok) {
        const data = await response.json();
        const newClient = data.client || data;

        if (role === "sender") {
          setSelectedSender(newClient);
          setSenderSearch(newClient.name);
          setShowNewSender(false);
        } else {
          setSelectedReceiver(newClient);
          setReceiverSearch(newClient.name);
          setShowNewReceiver(false);
        }

        setNewClientName("");
        setNewClientPhone("");
        setError("");
      }
    } catch (err) {
      setError("Ошибка при создании клиента");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!storeId || !selectedSender || !selectedReceiver || !cellNumber) {
      setError("Заполните все обязательные поля");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          senderId: selectedSender.id,
          receiverId: selectedReceiver.id,
          description,
          cellId: cellNumber,
          createdAt: new Date(packageDate).toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const pkg = data.package || data;
        router.push(`/admin/packages/${pkg.id}`);
      } else {
        setError("Ошибка при создании посылки");
      }
    } catch (err) {
      setError("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin"
          className="text-pokemon-blue hover:text-pokemon-yellow transition-colors mb-6 inline-block"
        >
          ← Вернуться
        </Link>

        <h1 className="text-3xl font-bold text-pokemon-yellow mb-8">
          Принять посылку
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="card-dark p-4 border border-pokemon-red text-pokemon-red">
              {error}
            </div>
          )}

          {/* Store Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Магазин *
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="input-dark w-full"
              required
            >
              <option value="">Выберите магазин</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Receiver Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Получатель *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={receiverSearch}
                  onChange={(e) => setReceiverSearch(e.target.value)}
                  placeholder="Поиск получателя"
                  className="input-dark w-full"
                  disabled={showNewReceiver}
                />
                {receiverResults.length > 0 && !showNewReceiver && (
                  <div className="absolute top-full left-0 right-0 bg-pokemon-dark border border-pokemon-blue rounded-lg mt-1 z-10 max-h-48 overflow-y-auto">
                    {receiverResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedReceiver(client);
                          setReceiverSearch(client.name);
                          setReceiverResults([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-pokemon-darker transition-colors border-b border-pokemon-darker last:border-b-0"
                      >
                        <div className="font-medium text-gray-200">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNewReceiver(!showNewReceiver)}
                className="btn-secondary"
              >
                + Новый
              </button>
            </div>
            {selectedReceiver && (
              <p className="text-sm text-pokemon-blue mt-2">
                Выбран: {selectedReceiver.name}
              </p>
            )}

            {showNewReceiver && (
              <div className="mt-4 p-4 bg-pokemon-dark rounded-lg border border-pokemon-blue space-y-2">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Имя получателя"
                  className="input-dark w-full"
                />
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Номер телефона"
                  className="input-dark w-full"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCreateNewClient("receiver")
                  }
                  className="btn-primary w-full"
                >
                  Создать получателя
                </button>
              </div>
            )}
          </div>

          {/* Sender Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Отправитель *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={senderSearch}
                  onChange={(e) => setSenderSearch(e.target.value)}
                  placeholder="Поиск отправителя"
                  className="input-dark w-full"
                  disabled={showNewSender}
                />
                {senderResults.length > 0 && !showNewSender && (
                  <div className="absolute top-full left-0 right-0 bg-pokemon-dark border border-pokemon-blue rounded-lg mt-1 z-10 max-h-48 overflow-y-auto">
                    {senderResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedSender(client);
                          setSenderSearch(client.name);
                          setSenderResults([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-pokemon-darker transition-colors border-b border-pokemon-darker last:border-b-0"
                      >
                        <div className="font-medium text-gray-200">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNewSender(!showNewSender)}
                className="btn-secondary"
              >
                + Новый
              </button>
            </div>
            {selectedSender && (
              <p className="text-sm text-pokemon-blue mt-2">
                Выбран: {selectedSender.name}
              </p>
            )}

            {showNewSender && (
              <div className="mt-4 p-4 bg-pokemon-dark rounded-lg border border-pokemon-blue space-y-2">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Имя отправителя"
                  className="input-dark w-full"
                />
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Номер телефона"
                  className="input-dark w-full"
                />
                <button
                  type="button"
                  onClick={() => handleCreateNewClient("sender")}
                  className="btn-primary w-full"
                >
                  Создать отправителя
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Описание *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание содержимого посылки"
              className="input-dark w-full h-24 resize-none"
              required
            />
          </div>

          {/* Cell Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ячейка *
            </label>
            <select
              value={cellNumber}
              onChange={(e) => setCellNumber(e.target.value)}
              className="input-dark w-full"
              required
            >
              <option value="">Выберите ячейку</option>
              {freeCells.map((cell) => (
                <option key={cell.id} value={cell.id}>
                  Ячейка №{cell.number}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Дата приемки *
            </label>
            <input
              type="datetime-local"
              value={packageDate}
              onChange={(e) => setPackageDate(e.target.value)}
              className="input-dark w-full"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Создание..." : "Создать посылку"}
          </button>
        </form>
      </div>
    </div>
  );
}
