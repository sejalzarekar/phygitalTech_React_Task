import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  useEmployeeState,
  useEmployeeDispatch,
} from "../context/EmployeeProvider";
import EmployeeTable from "../components/EmployeeTable";
import useDebounce from "../hooks/useDebounce";
import { useSearchParams, useNavigate } from "react-router-dom";
import { safeParseDate } from "../utils/helpers";

export default function EmployeesPage() {
  const { employees = [], loading, error } = useEmployeeState();
  const dispatch = useEmployeeDispatch();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

 const handleRowClick = (id) => {
  navigate(`/employee/${id}`);
};


  const [query, setQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(query, 300);

  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [positionFilter, setPositionFilter] = useState(searchParams.get("position") || "all");
  const [salaryRange, setSalaryRange] = useState(searchParams.get("salary") || "all");

  const sortParam = searchParams.get("sort") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const activeList = useMemo(
    () => employees.filter((e) => !e.deleted),
    [employees]
  );

  // unique positions
  const positions = useMemo(() => {
    const set = new Set();
    activeList.forEach((e) => {
      const pos = (e.position || e.role || "Unknown").trim();
      if (pos) set.add(pos);
    });
    return Array.from(set).sort();
  }, [activeList]);

  
  const filtered = useMemo(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();

    return activeList.filter((e) => {
      if (q) {
        const hit =
          (e.name || "").toLowerCase().includes(q) ||
          (e.email || "").toLowerCase().includes(q);
        if (!hit) return false;
      }

      if (statusFilter !== "all") {
        const s = (e.status || "Active").toLowerCase();
        if (statusFilter === "active" && s !== "active") return false;
        if (statusFilter === "inactive" && s !== "inactive") return false;
      }

      if (positionFilter !== "all") {
        const pos = (e.position || e.role || "").trim();
        if (pos !== positionFilter) return false;
      }

      if (salaryRange !== "all") {
        const salary = Number(e.salary || 0);
        if (salaryRange === "lt50" && !(salary < 50000)) return false;
        if (salaryRange === "50to100" && !(salary >= 50000 && salary <= 100000)) return false;
        if (salaryRange === "gt100" && !(salary > 100000)) return false;
      }

      return true;
    });
  }, [activeList, debouncedQuery, statusFilter, positionFilter, salaryRange]);

  
  const parseSort = (s) => {
    if (!s) return [];
    return s.split(",").map((pair) => {
      const [key, dir] = pair.split(":");
      return { key, dir: dir === "desc" ? "desc" : "asc" };
    });
  };

  const applySort = (list, sorts) => {
    if (!sorts.length) return list;

    return [...list].sort((a, b) => {
      for (const s of sorts) {
        if (s.key === "salary") {
          const na = Number(a.salary || 0);
          const nb = Number(b.salary || 0);
          if (na !== nb) return s.dir === "asc" ? na - nb : nb - na;
        } else if (s.key === "dateJoined") {
          const da = safeParseDate(a.dateJoined) || new Date(0);
          const db = safeParseDate(b.dateJoined) || new Date(0);
          if (da.getTime() !== db.getTime())
            return s.dir === "asc" ? da - db : db - da;
        } else {
          const ka = (a[s.key] ?? "").toString().toLowerCase();
          const kb = (b[s.key] ?? "").toString().toLowerCase();
          if (ka < kb) return s.dir === "asc" ? -1 : 1;
          if (ka > kb) return s.dir === "asc" ? 1 : -1;
        }
      }
      return 0;
    });
  };

  const sorts = useMemo(() => parseSort(sortParam), [sortParam]);
  const sorted = useMemo(() => applySort(filtered, sorts), [filtered, sorts]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, pageParam), totalPages);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);


  useEffect(() => {
    const params = {};
    if (query) params.q = query;
    if (statusFilter !== "all") params.status = statusFilter;
    if (positionFilter !== "all") params.position = positionFilter;
    if (salaryRange !== "all") params.salary = salaryRange;
    if (sortParam) params.sort = sortParam;

    params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [query, statusFilter, positionFilter, salaryRange, sortParam, page]);

  // SORT TOGGLE
  const toggleSortKey = useCallback(
    (key) => {
      const existing = parseSort(sortParam);
      const idx = existing.findIndex((s) => s.key === key);

      let next;
      if (idx === -1) next = [{ key, dir: "asc" }, ...existing];
      else if (existing[idx].dir === "asc") {
        existing[idx].dir = "desc";
        next = existing;
      } else next = existing.filter((s) => s.key !== key);

      const encoded = next.map((s) => `${s.key}:${s.dir}`).join(",");
      const newParams = Object.fromEntries([...searchParams.entries()]);

      if (encoded) newParams.sort = encoded;
      else delete newParams.sort;

      newParams.page = "1";
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams, sortParam]
  );

  return (
    <div className="container mt-4">
      {/* PAGE TITLE */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Employee Management</h2>
      </div>

      {/* FILTER CARD */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">

            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search employee by name or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="all">All Positions</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
              >
                <option value="all">All Salaries</option>
                <option value="lt50">&lt; 50k</option>
                <option value="50to100">50k - 100k</option>
                <option value="gt100">&gt; 100k</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* TABLE */}
      <EmployeeTable
        rows={paginated}
        loading={loading}
        error={error}
        totalRows={sorted.length}
        page={page}
        totalPages={totalPages}
        onToggleSort={toggleSortKey}
        currentSorts={sorts}
        onRowClick={handleRowClick} 
        dispatch={dispatch}
        fullList={sorted}
      />

    </div>
  );
}
