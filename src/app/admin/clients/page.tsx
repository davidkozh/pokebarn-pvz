"use client";

import { useEffect, useState } from "react";

interface Client {
  id: string;
  name: string;
  phone: string;
  activePackageCount: number;
}

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 11) return phone;
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAddClient = async () => {
    if (!newClientName || !newClientPhone) {
      setError("Введите имя и номер телефона");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          phone: newClientPhone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClients((prev) => [
          ...prev,
          {
            id: data.client.id,
            name: data.client.name,
            phone: data.client.phone,
            activePackageCount: 0,
          },
        ]);
        setNewClientName("");
        setNewClientPhone("");
        setShowNewClientForm(false);
      } else {
        setError("Ошибка при создании клиента");
      }
    } catch (err) {
      setError("Ошибка подключения к серверу");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pokemon-darkest">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pokemon-yellow border-t-pokemon-blue rounded-full spinner mb-4"></div>
          <p className="text-gray-400">Загрузка клиентов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-pokemon-yellow mb-6 md:mb-0">
            Клиенты
          </h1>
          <button
            onClick={() => setShowNewClientForm(!showNewClientForm)}
            className="btn-primary"
          >
            + Новый клиент
          </button>
        </div>

        {/* New Client Form */}
        {showNewClientForm && (
          <div className="card-dark p-6 mb-8">
            {error && (
              <p className="text-pokemon-red text-sm mb-4">{error}</p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Введите имя клиента"
                  className="input-dark w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className="input-dark w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewClientForm(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddClient}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  {actionLoading ? "..." : "Создать"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="card-dark p-6 mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или номеру телефона"
            className="input-dark w-full"
          />
        </div>

        {/* Table */}
        <div className="card-dark overflow-x-auto">
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Номер телефона</th>
                <th>Активные посылки</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">
                    <p className="text-gray-400">Клиенты не найдены</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-semibold text-pokemon-yellow">
                      {client.name}
                    </td>
                    <td>{formatPhone(client.phone)}</td>
                    <td>
                      {client.activePackageCount > 0 ? (
                        <span className="badge-transit">
                          {client.activePackageCount}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
