"use client";

import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  where,
} from "firebase/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "react-toastify";

export default function AdminPage() {
  const { user } = useAuth();

  // States para Feedback
  const [feedback, setFeedback] = useState<any[]>([]);
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const [hasMoreFeedback, setHasMoreFeedback] = useState(false);

  // States para Reportes
  const [reports, setReports] = useState<any[]>([]);
  const [lastReport, setLastReport] = useState<any>(null);
  const [hasMoreReports, setHasMoreReports] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filtros y UI
  const [filter, setFilter] = useState("all");
  const [filterReports, setFilterReports] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Secciones Colapsables
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);
  const [isReportsOpen, setIsReportsOpen] = useState(true);

  // Contadores
  const [stats, setStats] = useState({
    totalFeedback: 0,
    pendingFeedback: 0,
    activeReports: 0,
    inactiveReports: 0,
  });

  const [confirmAction, setConfirmAction] = useState<{
    type: "resolve" | "disable" | null;
    id: string | null;
  }>({ type: null, id: null });

  const PAGE_SIZE = 10;

  // 🔐 NUEVO CHECK ADMIN (solo con Custom Claims)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const token = await user.getIdTokenResult(true); // fuerza refresh
        if (token.claims.admin === true) {
          setIsAdmin(true);
          await loadStats();
          await loadInitialData();
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error verificando admin:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortOrder]);

  const loadStats = async () => {
    try {
      const fTotal = await getCountFromServer(collection(db, "feedback"));
      const fPending = await getCountFromServer(
        query(collection(db, "feedback"), where("resolved", "==", false)),
      );
      const rActive = await getCountFromServer(
        query(collection(db, "reports"), where("status", "==", "active")),
      );
      const rInactive = await getCountFromServer(
        query(collection(db, "reports"), where("status", "==", "inactive")),
      );

      setStats({
        totalFeedback: fTotal.data().count,
        pendingFeedback: fPending.data().count,
        activeReports: rActive.data().count,
        inactiveReports: rInactive.data().count,
      });
    } catch (error) {
      console.error("Error loading stats", error);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    const fQ = query(
      collection(db, "feedback"),
      orderBy("createdAt", sortOrder),
      limit(PAGE_SIZE),
    );
    const rQ = query(
      collection(db, "reports"),
      orderBy("createdAt", sortOrder),
      limit(PAGE_SIZE),
    );

    const [fSnap, rSnap] = await Promise.all([getDocs(fQ), getDocs(rQ)]);

    setFeedback(fSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLastFeedback(fSnap.docs[fSnap.docs.length - 1]);
    setHasMoreFeedback(fSnap.docs.length === PAGE_SIZE);

    setReports(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLastReport(rSnap.docs[rSnap.docs.length - 1]);
    setHasMoreReports(rSnap.docs.length === PAGE_SIZE);

    setLoading(false);
  };

  const loadMoreFeedback = async () => {
    if (!lastFeedback) return;
    const q = query(
      collection(db, "feedback"),
      orderBy("createdAt", sortOrder),
      startAfter(lastFeedback),
      limit(PAGE_SIZE),
    );
    const snap = await getDocs(q);
    setFeedback((prev) => [
      ...prev,
      ...snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ]);
    setLastFeedback(snap.docs[snap.docs.length - 1]);
    setHasMoreFeedback(snap.docs.length === PAGE_SIZE);
  };

  const loadMoreReports = async () => {
    if (!lastReport) return;
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", sortOrder),
      startAfter(lastReport),
      limit(PAGE_SIZE),
    );
    const snap = await getDocs(q);
    setReports((prev) => [
      ...prev,
      ...snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ]);
    setLastReport(snap.docs[snap.docs.length - 1]);
    setHasMoreReports(snap.docs.length === PAGE_SIZE);
  };

  if (!user) return <div className="p-10">Debes iniciar sesión.</div>;
  if (!isAdmin && !loading)
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10">
        <h2 className="text-2xl mb-2 font-semibold">Acceso Restringido 🔒</h2>
        <p className="text-gray-400 mb-6">
          No tienes permisos para ver este panel.
        </p>
        <a
          href="/"
          className="px-6 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-xl font-medium"
        >
          Volver al Inicio
        </a>
      </div>
    );
  if (loading && feedback.length === 0 && reports.length === 0)
    return <div className="p-10">Cargando...</div>;

  const toggleResolved = async (id: string) => {
    const item = feedback.find((f) => f.id === id);
    if (!item) return;
    const newValue = !item.resolved;

    try {
      await updateDoc(doc(db, "feedback", id), {
        resolved: newValue,
      });

      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, resolved: newValue } : f)),
      );
      toast.success(
        newValue ? "Marcado como resuelto" : "Marcado como pendiente",
      );
      loadStats();
    } catch (err) {
      toast.error("Error al actualizar feedback");
    }
  };

  const toggleReportStatus = async (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    const newStatus = report.status === "inactive" ? "active" : "inactive";

    try {
      await updateDoc(doc(db, "reports", id), {
        status: newStatus,
      });

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
      toast.success(
        newStatus === "active" ? "Reporte reactivado" : "Reporte deshabilitado",
      );
      loadStats();
    } catch (err) {
      toast.error("Error al actualizar reporte");
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    if (filter === "pending" && item.resolved) return false;
    if (filter === "resolved" && !item.resolved) return false;
    if (searchTerm) {
      const text = `${item.message || ""} ${item.type || ""}`.toLowerCase();
      if (!text.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  const filteredReports = reports.filter((report) => {
    if (filterReports === "active" && report.status === "inactive")
      return false;
    if (filterReports === "inactive" && report.status !== "inactive")
      return false;
    if (searchTerm) {
      const text =
        `${report.description || ""} ${report.price || ""} ${report.phone || ""}`.toLowerCase();
      if (!text.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white p-10 space-y-8">
      <h1 className="text-3xl font-semibold mb-8">Panel Admin</h1>

      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <div className="text-gray-400 text-sm">Total Feedback</div>
          <div className="text-2xl font-bold">{stats.totalFeedback}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <div className="text-gray-400 text-sm">Pendientes FB</div>
          <div className="text-2xl font-bold text-yellow-500">
            {stats.pendingFeedback}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <div className="text-gray-400 text-sm">Reportes Activos</div>
          <div className="text-2xl font-bold text-green-500">
            {stats.activeReports}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
          <div className="text-gray-400 text-sm">Reportes Inactivos</div>
          <div className="text-2xl font-bold text-red-500">
            {stats.inactiveReports}
          </div>
        </div>
      </div>

      {/* Buscador y Ordenamiento */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="🔎 Buscar en los registros cargados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-black border border-white/20 p-2 rounded focus:outline-none focus:border-blue-500"
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
          className="bg-black border border-white/20 p-2 rounded text-white"
        >
          <option value="desc">📆 Más recientes primero</option>
          <option value="asc">📆 Más antiguos primero</option>
        </select>
      </div>

      {/* Feedback Section */}
      <section className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <div
          className="flex items-center justify-between mb-4 cursor-pointer select-none"
          onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-2xl">
              Feedback {isFeedbackOpen ? "🔼" : "🔽"}
            </h2>
            {isFeedbackOpen && (
              <select
                value={filter}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-black border border-white/20 p-1 text-sm rounded text-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="resolved">Resueltos</option>
              </select>
            )}
          </div>
        </div>

        {isFeedbackOpen && (
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="border border-white/10 p-4 rounded-xl bg-black"
              >
                <div className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                  <span>
                    {item.type} • {item.resolved ? "Resuelto" : "Pendiente"}
                  </span>
                  {item.createdAt && (
                    <span className="text-xs">
                      {new Date(
                        item.createdAt?.seconds
                          ? item.createdAt.seconds * 1000
                          : item.createdAt,
                      ).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="mb-3">{item.message}</div>
                {!item.resolved && (
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "resolve", id: item.id })
                    }
                    className="px-4 py-1 bg-green-600 rounded text-sm hover:bg-green-700 transition-colors hover:cursor-pointer"
                  >
                    Marcar como resuelto
                  </button>
                )}
              </div>
            ))}

            {filteredFeedback.length === 0 && (
              <div className="text-gray-500 py-4">
                No hay feedback que coincida con los filtros locales.
              </div>
            )}

            {hasMoreFeedback && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreFeedback}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg hover:cursor-pointer"
                >
                  📄 Cargar más feedback
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Reports Section */}
      <section className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <div
          className="flex items-center justify-between mb-4 cursor-pointer select-none"
          onClick={() => setIsReportsOpen(!isReportsOpen)}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-2xl">Reportes {isReportsOpen ? "🔼" : "🔽"}</h2>
            {isReportsOpen && (
              <select
                value={filterReports}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setFilterReports(e.target.value)}
                className="bg-black border border-white/20 p-1 text-sm rounded text-white"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Deshabilitados</option>
              </select>
            )}
          </div>
        </div>

        {isReportsOpen && (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="border border-white/10 p-4 rounded-xl flex flex-col items-start bg-black"
              >
                <div className="text-sm text-gray-400 mb-2 w-full flex items-center justify-between">
                  <span>Status: {report.status}</span>
                  {report.createdAt && (
                    <span className="text-xs">
                      {new Date(
                        report.createdAt?.seconds
                          ? report.createdAt.seconds * 1000
                          : report.createdAt,
                      ).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  {report.description || report.price || "Sin descripción"}
                </div>
                <button
                  onClick={() =>
                    setConfirmAction({ type: "disable", id: report.id })
                  }
                  className={`px-4 py-1 rounded text-sm transition-colors hover:cursor-pointer ${
                    report.status === "inactive"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {report.status === "inactive"
                    ? "Reactivar reporte"
                    : "Deshabilitar reporte"}
                </button>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="text-gray-500 py-4">
                No hay reportes que coincidan con los filtros locales.
              </div>
            )}

            {hasMoreReports && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreReports}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg hover:cursor-pointer"
                >
                  📄 Cargar más reportes
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {confirmAction.type && (
        <ConfirmDialog
          open={true}
          title="Confirmar acción"
          description={
            confirmAction.type === "resolve"
              ? "¿Seguro que quieres cambiar el estado de este feedback?"
              : "¿Seguro que quieres cambiar el estado de este reporte?"
          }
          onCancel={() => setConfirmAction({ type: null, id: null })}
          onConfirm={async () => {
            if (confirmAction.type === "resolve" && confirmAction.id) {
              await toggleResolved(confirmAction.id);
            }

            if (confirmAction.type === "disable" && confirmAction.id) {
              await toggleReportStatus(confirmAction.id);
            }

            setConfirmAction({ type: null, id: null });
          }}
        />
      )}
    </div>
  );
}
