"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  occupiedCellsByStore: Array<{ storeName: string; occupied: number; total: number }>;
  packagesInTransit: number;
  recentLogs: Array<{ timestamp: string; action: string; packageId: string }>;
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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pokemon-darkest">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pokemon-yellow border-t-pokemon-blue rounded-full spinner mb-4"></div>
          <p className="text-gray-400">Загрузка дашборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-pokemon-darkest min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-pokemon-yellow mb-8">Дашборд</h1>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Transit Packages */}
          <div className="card-dark p-6">
            <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase">
              Посылок в пути
            </h3>
            <div className="text-4xl font-bold text-pokemon-yellow">
              {data?.packagesInTransit || 0}
            </div>
          </div>

          {/* Occupied Cells by Store */}
          {data?.occupiedCellsByStore.map((store) => (
            <div key={store.storeName} className="card-dark p-6">
              <h3 className="text-gray-400 text-sm font-semibold mb-4 uppercase">
                {store.storeName}
              </h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Ячейки</span>
                  <span>
                    {store.occupied}/{store.total}
                  </span>
                </div>
                <div className="w-full bg-pokemon-darker rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-pokemon-yellow h-full transition-all"
                    style={{
                      width: `${(store.occupied / store.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {store.total - store.occupied} свободных
              </p>
            </div>
          ))}
        </div>

        {/* Recent Actions */}
        <div className="card-dark p-6">
          <h2 className="text-2xl font-bold text-pokemon-yellow mb-6">
            Последние действия
          </h2>
          {data?.recentLogs && data.recentLogs.length > 0 ? (
            <div className="space-y-3">
              {data.recentLogs.slice(0, 5).map((log, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 bg-pokemon-darker rounded-lg hover:bg-pokemon-dark transition-colors"
                >
                  <div>
                    <p className="text-gray-300 font-medium">{log.action}</p>
                    <p className="text-gray-500 text-sm">
                      Посылка: {log.packageId}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Нет действий</p>
          )}
        </div>
      </div>
    </div>
  );
}
