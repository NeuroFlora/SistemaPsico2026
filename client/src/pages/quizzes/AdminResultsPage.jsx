import React from "react";
import { quizzesApi } from "../../services/quizzesService";
import SeverityBadge from "../../components/quizzes/SeverityBadge";
import { useAuth } from "../../contexts/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const SEVS = ["MINIMA", "LEVE", "MODERADA", "SEVERA"];
const ADMIN_ROLES = new Set([
  USER_ROLES.PSICOLOGO,
  USER_ROLES.ORIENTADOR,
  USER_ROLES.ADMIN_INSTITUCION,
  USER_ROLES.SUPER_ADMIN_INSTITUCION,
  USER_ROLES.SUPER_ADMIN_NACIONAL,
]);

export default function AdminResultsPage() {
  const { user } = useAuth();
  const canAccess = ADMIN_ROLES.has(user?.rol) ||
    user?.instituciones?.some(i => ADMIN_ROLES.has(i.rol));

  const [institutionId, setInstitutionId] = React.useState(
    user?.instituciones?.find((m) => m.isMembershipActiva)?.institucionId ||
      user?.instituciones?.[0]?.institucionId ||
      ""
  );
  const [codigo, setCodigo] = React.useState("");
  const [severidad, setSeveridad] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [total, setTotal] = React.useState(0);

  const fetchData = React.useCallback(() => {
    if (!institutionId) return;
    setLoading(true);
    setError("");
    quizzesApi
      .adminResults({
        institutionId,
        codigo: codigo || undefined,
        severidad: severidad || undefined,
        page,
        pageSize,
      })
      .then((res) => {
        setRows(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((e) => setError(e.data?.message || e.message || "Error cargando"))
      .finally(() => setLoading(false));
  }, [institutionId, codigo, severidad, page, pageSize]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!canAccess) return <div className="p-6 text-red-600">No autorizado.</div>;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Resultados de quizzes</h1>

      <div className="bg-white rounded-xl border p-4 shadow-sm grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-gray-600">Institución</label>
          <select
            value={institutionId}
            onChange={(e) => {
              setInstitutionId(e.target.value);
              setPage(1);
            }}
            className="w-full border rounded-lg px-2 py-1"
          >
            {(user?.instituciones || []).map((m) => (
              <option key={m.institucionId} value={m.institucionId}>
                {m.institucionNombre || m.institucionId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Código (BAI, BDI2)</label>
          <input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setPage(1);
            }}
            className="w-full border rounded-lg px-2 py-1"
            placeholder="BAI"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Severidad</label>
          <select
            value={severidad}
            onChange={(e) => {
              setSeveridad(e.target.value);
              setPage(1);
            }}
            className="w-full border rounded-lg px-2 py-1"
          >
            <option value="">Todas</option>
            {SEVS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-4">Cargando...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Estudiante</th>
                <th className="text-left p-3">Quiz</th>
                <th className="text-left p-3">Código</th>
                <th className="text-left p-3">Versión</th>
                <th className="text-left p-3">Puntaje</th>
                <th className="text-left p-3">Severidad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    {new Date(r.fechaEnvio).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {r.estudianteNombre || r.estudianteId}
                  </td>
                  <td className="p-3">{r.titulo}</td>
                  <td className="p-3 font-mono">{r.codigo}</td>
                  <td className="p-3">{r.version}</td>
                  <td className="p-3">{r.puntajeTotal}</td>
                  <td className="p-3">
                    <SeverityBadge value={r.severidad} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Total: {total} · Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded border ${
              page <= 1 ? "text-gray-400" : "hover:bg-gray-50"
            }`}
          >
            Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 rounded border ${
              page >= totalPages ? "text-gray-400" : "hover:bg-gray-50"
            }`}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
