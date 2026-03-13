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

// ─── Data ─────────────────────────────────────────────────
const RULES = [
  {
    event: 'Reporte recibe voto ✅ "Disponible"',
    points: "+1",
    color: "text-green-400",
  },
  {
    event: 'Reporte recibe voto ⬜ "Ya no disponible"',
    points: "-1",
    color: "text-zinc-400",
  },
  {
    event: 'Reporte alcanza 3 votos 🔴 "fraude"',
    points: "-10",
    color: "text-red-400",
  },
  {
    event: "Reporte marcado fraude dominante",
    points: "-5",
    color: "text-orange-400",
  },
  {
    event: "Voto coincide con la mayoría",
    points: "+0.5",
    color: "text-green-400",
  },
  { event: "Score > 20", points: "20 días ⭐", color: "text-yellow-400" },
  { event: "Score < -20", points: "restricted ⚠️", color: "text-orange-400" },
  { event: "Score < -50", points: "banned 🚫", color: "text-red-400" },
];

type Section = "users" | "reports" | "feedback" | "activity";

// ─── Nav card ────────────────────────────────────────────
function NavCard({
  id,
  active,
  icon,
  label,
  count,
  sub,
  onClick,
}: {
  id: Section;
  active: Section;
  icon: string;
  label: string;
  count: React.ReactNode;
  sub?: string;
  onClick: (s: Section) => void;
}) {
  const isActive = id === active;
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 min-w-[140px] md:min-w-0 flex flex-col gap-1 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
        isActive
          ? "bg-white text-black border-white/20"
          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div
        className={`text-2xl font-bold ${isActive ? "text-black" : "text-white"}`}
      >
        {count}
      </div>
      {sub && <div className="text-[10px] truncate opacity-60">{sub}</div>}
    </button>
  );
}

// ─── Status badge ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-900/50 text-green-400 border-green-800",
    restricted: "bg-orange-900/50 text-orange-400 border-orange-800",
    banned: "bg-red-900/50 text-red-400 border-red-800",
    inactive: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${map[status] ?? map.active}`}
    >
      {status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("users");

  // Modals
  const [showRules, setShowRules] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [statusChangeComment, setStatusChangeComment] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    id: string;
    payload?: any;
  } | null>(null);

  // ── Users ─────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    restricted: 0,
    banned: 0,
  });
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  // ── Reports ───────────────────────────────────────
  const [reports, setReports] = useState<any[]>([]);
  const [lastReport, setLastReport] = useState<any>(null);
  const [hasMoreReports, setHasMoreReports] = useState(false);
  const [reportFilter, setReportFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reportCount, setReportCount] = useState(0); // Activos
  const [totalReportCount, setTotalReportCount] = useState(0); // Todos (incl. inactivos)

  // ── Feedback ──────────────────────────────────────
  const [feedback, setFeedback] = useState<any[]>([]);
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const [hasMoreFeedback, setHasMoreFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Activity ──────────────────────────────────────
  const [activity, setActivity] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  const PAGE = 10;

  // ─── Admin check & load ───────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const init = async () => {
      try {
        const token = await user.getIdTokenResult(true);
        if (token.claims.admin !== true) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        await Promise.all([
          loadUsers(),
          loadReports(),
          loadFeedback(),
          loadActivity(),
          loadRanking(),
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUsers = async () => {
    const snap = await getDocs(
      query(collection(db, "users"), orderBy("reputationScore", "desc")),
    );
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUsers(all);
    setUserStats({
      total: all.length,
      active: all.filter((u: any) => !u.status || u.status === "active").length,
      restricted: all.filter((u: any) => u.status === "restricted").length,
      banned: all.filter((u: any) => u.status === "banned").length,
    });
  };

  const loadReports = async () => {
    const now = new Date().toISOString();
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(PAGE),
    );
    const snap = await getDocs(q);
    const fetchedReports = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // 🔥 Lazy Cleanup: buscar reportes que expiraron pero siguen "active"
    const expiredToCleanup = fetchedReports.filter(
      (r) => r.status === "active" && r.expiresAt < now,
    );

    if (expiredToCleanup.length > 0) {
      console.log(`Cleaning up ${expiredToCleanup.length} expired reports...`);
      await Promise.all(
        expiredToCleanup.map((r) =>
          updateDoc(doc(db, "reports", r.id), { status: "inactive" }),
        ),
      );
      // Actualizar estado local para que refleje el cambio de inmediato
      setReports(
        fetchedReports.map((r) =>
          r.status === "active" && r.expiresAt < now
            ? { ...r, status: "inactive" }
            : r,
        ),
      );
    } else {
      setReports(fetchedReports);
    }

    setLastReport(snap.docs[snap.docs.length - 1]);
    setHasMoreReports(snap.docs.length === PAGE);

    // Solo contar los que REALMENTE están activos (después del cleanup los datos son consistentes)
    const activeQuery = query(
      collection(db, "reports"),
      where("status", "==", "active"),
    );
    const activeSnap = await getCountFromServer(activeQuery);
    const totalSnap = await getCountFromServer(collection(db, "reports"));

    setReportCount(activeSnap.data().count);
    setTotalReportCount(totalSnap.data().count);
  };

  const loadFeedback = async () => {
    const q = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc"),
      limit(PAGE),
    );
    const snap = await getDocs(q);
    setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLastFeedback(snap.docs[snap.docs.length - 1]);
    setHasMoreFeedback(snap.docs.length === PAGE);
    const [total, pending] = await Promise.all([
      getCountFromServer(collection(db, "feedback")),
      getCountFromServer(
        query(collection(db, "feedback"), where("resolved", "==", false)),
      ),
    ]);
    setFeedbackCount(total.data().count);
    setPendingCount(pending.data().count);
  };

  const loadActivity = async () => {
    const snap = await getDocs(
      query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(10)),
    );
    setActivity(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const loadRanking = async () => {
    const snap = await getDocs(
      query(
        collection(db, "users"),
        orderBy("reputationScore", "desc"),
        limit(50),
      ),
    );
    setRanking(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const loadMoreReports = async () => {
    if (!lastReport) return;
    const now = new Date().toISOString();
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      startAfter(lastReport),
      limit(PAGE),
    );
    const snap = await getDocs(q);
    const fetchedMore = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // 🔥 Lazy Cleanup in Pagination
    const expiredToCleanup = fetchedMore.filter(
      (r) => r.status === "active" && r.expiresAt < now,
    );

    if (expiredToCleanup.length > 0) {
      await Promise.all(
        expiredToCleanup.map((r) =>
          updateDoc(doc(db, "reports", r.id), { status: "inactive" }),
        ),
      );
      setReports((p) => [
        ...p,
        ...fetchedMore.map((r) =>
          r.status === "active" && r.expiresAt < now
            ? { ...r, status: "inactive" }
            : r,
        ),
      ]);
    } else {
      setReports((p) => [...p, ...fetchedMore]);
    }

    setLastReport(snap.docs[snap.docs.length - 1]);
    setHasMoreReports(snap.docs.length === PAGE);
  };

  const loadMoreFeedback = async () => {
    if (!lastFeedback) return;
    const q = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc"),
      startAfter(lastFeedback),
      limit(PAGE),
    );
    const snap = await getDocs(q);
    setFeedback((p) => [
      ...p,
      ...snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ]);
    setLastFeedback(snap.docs[snap.docs.length - 1]);
    setHasMoreFeedback(snap.docs.length === PAGE);
  };

  // ─── Actions ─────────────────────────────────────────
  const changeUserStatus = async (
    uid: string,
    newStatus: string,
    comment: string,
  ) => {
    const historyEntry = {
      status: newStatus,
      comment,
      changedAt: new Date().toISOString(),
      changedBy: user?.uid,
    };

    const userRef = doc(db, "users", uid);
    const userDoc = await getDocs(
      query(collection(db, "users"), where("id", "==", uid)),
    ); // This is a bit redundant if we have the list, but safer.
    // Actually, we have the user object in selectedUser or the users list.
    const currentUserData = users.find((u) => u.id === uid);
    const currentHistory = currentUserData?.statusHistory || [];

    await updateDoc(userRef, {
      status: newStatus,
      statusHistory: [...currentHistory, historyEntry],
    });

    setUsers((prev) =>
      prev.map((u) =>
        u.id === uid
          ? {
              ...u,
              status: newStatus,
              statusHistory: [...(u.statusHistory || []), historyEntry],
            }
          : u,
      ),
    );
    setUserStats((prev) => {
      const updated = users.map((u) =>
        u.id === uid ? { ...u, status: newStatus } : u,
      );
      return {
        total: updated.length,
        active: updated.filter((u) => !u.status || u.status === "active")
          .length,
        restricted: updated.filter((u) => u.status === "restricted").length,
        banned: updated.filter((u) => u.status === "banned").length,
      };
    });
    if (selectedUser?.id === uid)
      setSelectedUser((p: any) => ({
        ...p,
        status: newStatus,
        statusHistory: [...(p.statusHistory || []), historyEntry],
      }));
    toast.success(`Usuario → ${newStatus}`);
    setStatusChangeComment("");
  };

  const toggleReportStatus = async (id: string) => {
    const r = reports.find((x) => x.id === id);
    if (!r) return;
    const next = r.status === "inactive" ? "active" : "inactive";

    const updateData: any = { status: next };

    // 🔥 Si estamos activando, reseteamos la fecha de expiración a 14 días a partir de hoy
    if (next === "active") {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + 14);
      updateData.expiresAt = expires.toISOString();
      updateData.updatedAt = now.toISOString();
    }

    await updateDoc(doc(db, "reports", id), updateData);

    setReports((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...updateData } : x)),
    );
    setReportCount((prev) => prev + (next === "active" ? 1 : -1));
    toast.success(
      next === "active"
        ? "Reporte reactivado (14 días más)"
        : "Reporte deshabilitado",
    );
  };

  const toggleFeedbackResolved = async (id: string) => {
    const f = feedback.find((x) => x.id === id);
    if (!f) return;
    const next = !f.resolved;
    await updateDoc(doc(db, "feedback", id), { resolved: next });
    setFeedback((prev) =>
      prev.map((x) => (x.id === id ? { ...x, resolved: next } : x)),
    );
    setPendingCount((p) => p + (next ? -1 : 1));
    toast.success(next ? "Marcado como resuelto" : "Marcado como pendiente");
  };

  // ─── Guards ───────────────────────────────────────────
  if (!user)
    return <div className="p-10 text-white">Debes iniciar sesión.</div>;
  if (!isAdmin && !loading)
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-semibold">Acceso restringido</h2>
        <a
          href="/"
          className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium"
        >
          Volver al mapa
        </a>
      </div>
    );
  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Cargando panel...</span>
      </div>
    );

  // ─── Filters ──────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    if (userFilter !== "all" && u.status !== userFilter) return false;
    if (userSearch) {
      const t = `${u.displayName ?? ""} ${u.email ?? ""}`.toLowerCase();
      if (!t.includes(userSearch.toLowerCase())) return false;
    }
    return true;
  });

  const filteredReports = reports.filter((r) => {
    if (reportFilter === "active" && r.status === "inactive") return false;
    if (reportFilter === "inactive" && r.status !== "inactive") return false;
    if (reportSearch) {
      const t = `${r.description ?? ""} ${r.price ?? ""}`.toLowerCase();
      if (!t.includes(reportSearch.toLowerCase())) return false;
    }
    return true;
  });

  const filteredFeedback = feedback.filter((f) => {
    if (feedbackFilter === "pending" && f.resolved) return false;
    if (feedbackFilter === "resolved" && !f.resolved) return false;
    return true;
  });

  const fmtDate = (raw: any) =>
    new Date(raw?.seconds ? raw.seconds * 1000 : raw).toLocaleDateString(
      "es-MX",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );

  const rankEmoji = (i: number) => ["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`;

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-sm font-semibold text-gray-400 tracking-widest uppercase">
          Admin
        </h1>
        <button
          onClick={() => setShowRules(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
        >
          <span>📋</span> Reglas
        </button>
      </div>

      {/* ── NAV CARDS ───────────────────────────────────── */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto no-scrollbar md:flex-wrap">
        <NavCard
          id="users"
          active={activeSection}
          icon="👥"
          label="Usuarios"
          count={userStats.total}
          sub={`${userStats.active} activos`}
          onClick={setActiveSection}
        />
        <NavCard
          id="reports"
          active={activeSection}
          icon="📌"
          label="Reportes"
          count={
            <div className="flex items-baseline">
              <span
                className={
                  activeSection === "reports" ? "text-black" : "text-white"
                }
              >
                {reportCount}
              </span>
              <span className="text-sm opacity-40 ml-1">
                / {totalReportCount}
              </span>
            </div>
          }
          sub="activos de total"
          onClick={setActiveSection}
        />
        <NavCard
          id="feedback"
          active={activeSection}
          icon="💬"
          label="Feedback"
          count={feedbackCount}
          sub={`${pendingCount} pendientes`}
          onClick={setActiveSection}
        />
        <NavCard
          id="activity"
          active={activeSection}
          icon="⚡"
          label="Actividad"
          count="→"
          sub="Recientes · Ranking"
          onClick={setActiveSection}
        />
      </div>

      {/* ── SECTION CONTENT ─────────────────────────────── */}
      <div className="px-4 pb-10 pt-2 space-y-3">
        {/* ══ USUARIOS ══════════════════════════════════════ */}
        {activeSection === "users" && (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              {[
                { label: "Total", value: userStats.total, color: "text-white" },
                {
                  label: "Activos",
                  value: userStats.active,
                  color: "text-green-400",
                },
                {
                  label: "Restringidos",
                  value: userStats.restricted,
                  color: "text-orange-400",
                },
                {
                  label: "Baneados",
                  value: userStats.banned,
                  color: "text-red-400",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-xl py-3"
                >
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Distribution bar */}
            {userStats.total > 0 && (
              <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                <div
                  className="bg-green-500"
                  style={{
                    width: `${(userStats.active / userStats.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-orange-400"
                  style={{
                    width: `${(userStats.restricted / userStats.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(userStats.banned / userStats.total) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm md:text-base focus:outline-none focus:border-white/30"
              />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-white"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="restricted">Restringidos</option>
                <option value="banned">Baneados</option>
              </select>
            </div>

            {/* User list */}
            <div className="space-y-1.5">
              {filteredUsers.map((u, idx) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all text-left cursor-pointer"
                >
                  <span className="text-xs text-gray-500 w-5 text-center">
                    {rankEmoji(idx)}
                  </span>
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt=""
                      className="w-8 h-8 rounded-full border border-white/20 object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm flex-shrink-0">
                      👤
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.displayName ?? "Sin nombre"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {u.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={u.status ?? "active"} />
                    <span className="text-xs text-yellow-400 font-medium w-10 text-right">
                      ⭐{u.reputationScore ?? 0}
                    </span>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center text-gray-600 py-6 text-sm">
                  Sin resultados
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ REPORTES ══════════════════════════════════════ */}
        {activeSection === "reports" && (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Buscar reporte..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm md:text-base focus:outline-none focus:border-white/30"
              />
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-white"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="space-y-1.5">
              {filteredReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      {r.description || "Sin descripción"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex gap-2 items-center">
                      <StatusBadge status={r.status} />
                      {r.price && <span>· {r.price}</span>}
                      {r.createdAt && <span>· {fmtDate(r.createdAt)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "report", id: r.id })
                    }
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                      r.status === "inactive"
                        ? "bg-green-900/50 text-green-400 hover:bg-green-900"
                        : "bg-red-900/50 text-red-400 hover:bg-red-900"
                    }`}
                  >
                    {r.status === "inactive" ? "Activar" : "Desactivar"}
                  </button>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="text-center text-gray-600 py-6 text-sm">
                  Sin reportes activos
                </div>
              )}
              {hasMoreReports && (
                <button
                  onClick={loadMoreReports}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                >
                  Cargar más →
                </button>
              )}
            </div>
          </>
        )}

        {/* ══ FEEDBACK ══════════════════════════════════════ */}
        {activeSection === "feedback" && (
          <>
            <div className="flex gap-2 mb-1">
              {["all", "pending", "resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFeedbackFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    feedbackFilter === f
                      ? "bg-white text-black font-medium"
                      : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  {
                    {
                      all: "Todos",
                      pending: "Pendientes",
                      resolved: "Resueltos",
                    }[f]
                  }
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {filteredFeedback.map((f) => (
                <div
                  key={f.id}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">
                        {f.type} · {fmtDate(f.createdAt)}
                      </div>
                      <div className="text-sm">{f.message}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        f.resolved
                          ? "border-green-800 text-green-400"
                          : "border-yellow-800 text-yellow-400"
                      }`}
                    >
                      {f.resolved ? "Resuelto" : "Pendiente"}
                    </span>
                  </div>
                  {!f.resolved && (
                    <button
                      onClick={() =>
                        setConfirmAction({ type: "feedback", id: f.id })
                      }
                      className="text-xs px-3 py-1 rounded-lg bg-green-900/40 text-green-400 hover:bg-green-900/70 cursor-pointer transition-colors"
                    >
                      Marcar resuelto
                    </button>
                  )}
                </div>
              ))}
              {filteredFeedback.length === 0 && (
                <div className="text-center text-gray-600 py-6 text-sm">
                  Sin resultados
                </div>
              )}
              {hasMoreFeedback && (
                <button
                  onClick={loadMoreFeedback}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                >
                  Cargar más →
                </button>
              )}
            </div>
          </>
        )}

        {/* ══ ACTIVIDAD ═════════════════════════════════════ */}
        {activeSection === "activity" && (
          <div className="space-y-4">
            {/* Recent reports */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Últimos reportes
              </div>
              <div className="space-y-1.5">
                {activity.map((r) => {
                  const d = r.createdAt?.seconds
                    ? new Date(r.createdAt.seconds * 1000)
                    : new Date(r.createdAt);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10"
                    >
                      {r.creatorPhotoUrl ? (
                        <img
                          src={r.creatorPhotoUrl}
                          alt=""
                          className="w-7 h-7 rounded-full border border-white/20 object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs flex-shrink-0">
                          👤
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">
                          {r.description || "Sin descripción"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.price ? `$${r.price}` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                        {d.toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ranking */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Ranking de reputación
              </div>
              <div className="space-y-1.5">
                {ranking.map((u, idx) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-sm w-6 text-center">
                      {rankEmoji(idx)}
                    </span>
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt=""
                        className="w-7 h-7 rounded-full border border-white/20 object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs flex-shrink-0">
                        👤
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-sm truncate">
                      {u.displayName ?? "Sin nombre"}
                    </div>
                    <StatusBadge status={u.status ?? "active"} />
                    <span className="text-xs text-yellow-400 font-medium w-10 text-right">
                      ⭐{u.reputationScore ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── USER DETAIL MODAL ─────────────────────────────── */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-[9000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-white/10">
              {selectedUser.photoURL ? (
                <img
                  src={selectedUser.photoURL}
                  alt=""
                  className="w-14 h-14 rounded-full border border-white/20 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {selectedUser.displayName ?? "Sin nombre"}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {selectedUser.email}
                </div>
                <div className="mt-1">
                  <StatusBadge status={selectedUser.status ?? "active"} />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b border-white/10">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-yellow-400 text-xl font-bold">
                  {selectedUser.reputationScore ?? 0}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Score</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl font-bold">
                  {selectedUser.contributionsCount ?? 0}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Contribuciones
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="px-4 py-3 space-y-1.5 border-b border-white/10">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Admin</span>
                <span>{selectedUser.isAdmin ? "✅ Sí" : "❌ No"}</span>
              </div>
              {selectedUser.createdAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Registro</span>
                  <span>{fmtDate(selectedUser.createdAt)}</span>
                </div>
              )}
              {selectedUser.lastLogin && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Último login</span>
                  <span>{fmtDate(selectedUser.lastLogin)}</span>
                </div>
              )}
            </div>

            {/* History */}
            <div className="px-4 py-3 border-b border-white/10 max-h-40 overflow-y-auto">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                Historial de cambios
              </div>
              {selectedUser.statusHistory &&
              selectedUser.statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {selectedUser.statusHistory
                    .slice()
                    .reverse()
                    .map((h: any, i: number) => (
                      <div
                        key={i}
                        className="text-[11px] border-l border-white/10 pl-2"
                      >
                        <div className="flex justify-between text-gray-400 mb-0.5">
                          <StatusBadge status={h.status} />
                          <span>{fmtDate(h.changedAt)}</span>
                        </div>
                        <div className="text-gray-200 leading-tight">
                          {h.comment}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-[11px] text-gray-600">
                  Sin historial registrado.
                </div>
              )}
            </div>

            {/* Status controls */}
            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-500 mb-2">Cambiar estado</div>
              <div className="flex gap-2">
                {["active", "restricted", "banned"].map((s) => (
                  <button
                    key={s}
                    disabled={selectedUser.status === s}
                    onClick={() =>
                      setConfirmAction({
                        type: "userStatus",
                        id: selectedUser.id,
                        payload: s,
                      })
                    }
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      s === "active"
                        ? "bg-green-900/50 text-green-400 hover:bg-green-900"
                        : s === "restricted"
                          ? "bg-orange-900/50 text-orange-400 hover:bg-orange-900"
                          : "bg-red-900/50 text-red-400 hover:bg-red-900"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2 rounded-lg text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 transition-colors cursor-pointer mt-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DIALOG ────────────────────────────────── */}
      {confirmAction && (
        <ConfirmDialog
          open
          title="Confirmar acción"
          description={
            confirmAction.type === "userStatus"
              ? `¿Cambiar estado del usuario a "${confirmAction.payload}"?`
              : confirmAction.type === "report"
                ? "¿Cambiar estado del reporte?"
                : "¿Cambiar estado del feedback?"
          }
          showInput={confirmAction.type === "userStatus"}
          inputPlaceholder="Escribe el motivo del cambio (ej. Usuario sospechoso, múltiples reportes falsos...)"
          inputValue={statusChangeComment}
          onInputChange={setStatusChangeComment}
          onCancel={() => {
            setConfirmAction(null);
            setStatusChangeComment("");
          }}
          onConfirm={async () => {
            if (confirmAction.type === "userStatus")
              await changeUserStatus(
                confirmAction.id,
                confirmAction.payload,
                statusChangeComment,
              );
            if (confirmAction.type === "report")
              await toggleReportStatus(confirmAction.id);
            if (confirmAction.type === "feedback")
              await toggleFeedbackResolved(confirmAction.id);
            setConfirmAction(null);
          }}
        />
      )}

      {/* ── RULES MODAL ───────────────────────────────────── */}
      {showRules && (
        <div
          className="fixed inset-0 z-[9000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-sm">
                📋 Reglas del sistema de puntos
              </h2>
              <button
                onClick={() => setShowRules(false)}
                className="text-gray-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left p-3 text-gray-500 font-medium">
                      Evento
                    </th>
                    <th className="text-right p-3 text-gray-500 font-medium">
                      Efecto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RULES.map((r, i) => (
                    <tr
                      key={i}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 text-gray-300">{r.event}</td>
                      <td className={`p-3 text-right font-bold ${r.color}`}>
                        {r.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-[10px] text-zinc-600">
                Sistema de modificación automática pendiente de Firebase
                Functions (Fase 4).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
