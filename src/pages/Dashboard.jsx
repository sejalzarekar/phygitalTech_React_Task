import React, { useMemo, useCallback } from "react";
import { useEmployeeState, useEmployeeDispatch } from "../context/EmployeeProvider";
import { fetchEmployees as apiFetchEmployees } from "../utils/api";
import LoadingPlaceholder from "../components/LoadingPlaceholder";
import SummaryCards from "../components/SummaryCards";
import { groupByPosition } from "../utils/helpers";

export default function Dashboard() {
  const { employees = [], loading, error } = useEmployeeState();
  const dispatch = useEmployeeDispatch();

  // Retry fetch
  const handleRetry = useCallback(async () => {
    dispatch({ type: "fetch_start" });
    try {
      const data = await apiFetchEmployees();
      dispatch({ type: "fetch_success", payload: data });
    } catch (err) {
      dispatch({ type: "fetch_error", payload: err.message || "Fetch failed" });
    }
  }, [dispatch]);

  // Not deleted employees only
  const activeEmployees = useMemo(
    () => employees.filter((e) => !e.deleted),
    [employees]
  );

  const summary = useMemo(() => {
    const total = activeEmployees.length;

    // Active vs inactive
    const activeCount = activeEmployees.filter(
      (e) => (e.status || "Active").toLowerCase() === "active"
    ).length;
    const inactiveCount = total - activeCount;
    const activePct = total ? Math.round((activeCount / total) * 100) : 0;

    // Top positions
    const posCounts = groupByPosition(activeEmployees);
    const topPositions = Object.entries(posCounts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Average tenure
    const avgTenure =
      total === 0
        ? 0
        : (
            activeEmployees.reduce((sum, e) => {
              const joined = new Date(e.dateJoined);
              const years = (Date.now() - joined) / (1000 * 60 * 60 * 24 * 365);
              return sum + years;
            }, 0) / total
          ).toFixed(1);

    // Growth values
    const now = Date.now();
    const days30 = 1000 * 60 * 60 * 24 * 30;

    const addedLast30 = activeEmployees.filter(
      (e) => now - new Date(e.dateJoined) <= days30
    ).length;

    const addedPrev30 = activeEmployees.filter((e) => {
      const diff = now - new Date(e.dateJoined);
      return diff > days30 && diff <= days30 * 2;
    }).length;

    const pctChange =
      addedPrev30 === 0
        ? addedLast30 > 0
          ? 100
          : 0
        : Math.round(((addedLast30 - addedPrev30) / addedPrev30) * 100);

    return {
      total,
      activeCount,
      inactiveCount,
      activePct,
      topPositions,
      avgTenure,
      addedLast30,
      pctChange,
    };
  }, [activeEmployees]);

  return (
    <div>
      <h1 className="dashboard-title text-center mb-4">Dashboard</h1>

      {loading && <LoadingPlaceholder />}

      {error && (
        <div style={{ padding: 16, background: "#fee2e2", borderRadius: 8 }}>
          <strong style={{ color: "#b91c1c" }}>Error:</strong> {error}
          <div style={{ marginTop: 8 }}>
            <button onClick={handleRetry}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && <SummaryCards summary={summary} />}
    </div>
  );
}
