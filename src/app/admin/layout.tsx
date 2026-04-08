"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth");
        if (response.ok) {
          setAuthenticated(true);
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    if (pathname !== "/admin/login") {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } finally {
      router.push("/admin/login");
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pokemon-darkest">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pokemon-yellow border-t-pokemon-blue rounded-full spinner mb-4"></div>
          <p className="text-gray-400">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const navLinks = [
    { href: "/admin", label: "Дашборд" },
    { href: "/admin/packages/new", label: "Принять посылку" },
    { href: "/admin/transit", label: "Входящий транзит" },
    { href: "/admin/cells", label: "Ячейки" },
    { href: "/admin/clients", label: "Клиенты" },
    { href: "/admin/stores", label: "Магазины" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-pokemon-darkest">
      {/* Sidebar */}
      <aside
        className={`sidebar-dark w-64 p-6 flex flex-col transition-all duration-300 fixed md:relative md:translate-x-0 h-full z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-2xl font-bold text-pokemon-yellow mb-8">
          Покебарн
        </h2>
        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive(link.href)
                  ? "bg-pokemon-yellow text-pokemon-dark font-semibold"
                  : "text-gray-400 hover:text-pokemon-yellow hover:bg-pokemon-dark"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="btn-danger w-full"
        >
          Выход
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-pokemon-dark border-b border-pokemon-darker h-16 flex items-center px-6 justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-pokemon-yellow hover:text-pokemon-blue transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-pokemon-yellow">
            Покебарн Админ
          </h1>
          <div className="w-6"></div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
