import React, { useState, useMemo } from "react";
import { softDeleteEmployee, updateEmployee as apiUpdate } from "../utils/api";
import { computeTenureYears, safeParseDate } from "../utils/helpers";

export default function EmployeeTable({
  rows = [],
  loading,
  error,
  totalRows = 0,
  page = 1,
  totalPages = 1,
  onToggleSort,
  currentSorts = [],
  onRowClick,
  dispatch,
  fullList = [],
}) {

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingDeletes, setPendingDeletes] = useState(new Set()); // ids pending API
  const [pendingBulk, setPendingBulk] = useState(false);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    // if all visible selected, clear; else select visible ids
    const visibleIds = rows.map((r) => r.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  // single optimistic soft-delete
  const handleDelete = async (id) => {
    if (!confirm("Delete this employee? (soft-delete)")) return;
    // optimistic: remove from state immediately
    const backup = dispatch ? null : null;
    dispatch({ type: "replace_employees", payload: (prev => {
      return [];
    })});

    setPendingDeletes((s) => new Set(s).add(id));

    try {
      await softDeleteEmployee(id);
      dispatch({ type: "update_employee", payload: { id, deleted: true, deletedAt: new Date().toISOString() } });
      setSelectedIds((s) => { const n = new Set(s); n.delete(id); return n; });
      setPendingDeletes((s) => { const n = new Set(s); n.delete(id); return n; });
    } catch (err) {
      setPendingDeletes((s) => { const n = new Set(s); n.delete(id); return n; });
      alert("Delete failed: " + (err?.message || "Unknown"));
    }
  };

  // Bulk delete (optimistic): mark all selected as deleted
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("No rows selected");
      return;
    }
    if (!confirm(`Delete ${selectedIds.size} selected employees?`)) return;
    setPendingBulk(true);

    const selectedArray = Array.from(selectedIds);
    selectedArray.forEach((id) => {
      dispatch({ type: "update_employee", payload: { id, deleted: true, deletedAt: new Date().toISOString() } });
    });

    const failures = [];
    await Promise.all(
      selectedArray.map(async (id) => {
        try {
          await softDeleteEmployee(id);
        } catch (err) {
          failures.push(id);
        }
      })
    );

    if (failures.length) {
      failures.forEach((id) =>
        dispatch({
          type: "update_employee",
          payload: { id, deleted: false },
        })
      );
      alert(`Failed to delete ${failures.length} items.`);
    } else {
      alert("Bulk delete successful.");
    }

    setSelectedIds(new Set());
    setPendingBulk(false);
  };

  // Bulk status update (Active/Inactive)
  const handleBulkStatus = async (newStatus) => {
    if (selectedIds.size === 0) {
      alert("No rows selected");
      return;
    }
    if (!confirm(`Mark ${selectedIds.size} selected employees as ${newStatus}?`)) return;
    setPendingBulk(true);
    const selectedArray = Array.from(selectedIds);

    selectedArray.forEach((id) => {
      const existing = fullList.find((r) => r.id === id) || {};
      const updated = { ...existing, status: newStatus };
      dispatch({ type: "update_employee", payload: updated });
    });

    const failures = [];
    await Promise.all(
      selectedArray.map(async (id) => {
        try {
          const existing = fullList.find((r) => r.id === id) || {};
          await apiUpdate({ ...existing, status: newStatus });
        } catch (err) {
          failures.push(id);
        }
      })
    );

    if (failures.length) {
      alert(`Failed to update status for ${failures.length} items.`);
    } else {
      alert(`Status updated to ${newStatus}.`);
    }

    setSelectedIds(new Set());
    setPendingBulk(false);
  };

  const isAllVisibleSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  return (
    <div>
      <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={handleBulkDelete} disabled={pendingBulk}>Bulk Delete</button>
        <button onClick={() => handleBulkStatus("Active")} disabled={pendingBulk}>Mark Active</button>
        <button onClick={() => handleBulkStatus("Inactive")} disabled={pendingBulk}>Mark Inactive</button>
        <div style={{ marginLeft: "auto" }}><small>{totalRows} matching</small></div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr>
            <th style={thStyle}><input type="checkbox" checked={isAllVisibleSelected} onChange={toggleSelectAll} /></th>
            <SortableHeader title="Name" onClick={() => onToggleSort("name")} activeKey={currentSortKey(currentSorts, "name")} dir={currentSortDir(currentSorts, "name")} />
            <SortableHeader title="Email" onClick={() => onToggleSort("email")} activeKey={currentSortKey(currentSorts, "email")} dir={currentSortDir(currentSorts, "email")} />
            <SortableHeader title="Position" onClick={() => onToggleSort("position")} activeKey={currentSortKey(currentSorts, "position")} dir={currentSortDir(currentSorts, "position")} />
            <th style={thStyle}>Status</th>
            <SortableHeader title="Salary" onClick={() => onToggleSort("salary")} activeKey={currentSortKey(currentSorts, "salary")} dir={currentSortDir(currentSorts, "salary")} />
            <SortableHeader title="Date Joined" onClick={() => onToggleSort("dateJoined")} activeKey={currentSortKey(currentSorts, "dateJoined")} dir={currentSortDir(currentSorts, "dateJoined")} />
            <th style={thStyle}>Tenure</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr><td colSpan={9} style={{ padding: 12 }}>Loading...</td></tr>
          )}

          {!loading && rows.length === 0 && (
            <tr><td colSpan={9} style={{ padding: 12 }}>No results</td></tr>
          )}

          {!loading && rows.map((r) => {
            const tenure = computeTenureYears(safeParseDate(r.dateJoined));
            const checked = selectedIds.has(r.id);
            return (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={tdStyle}><input type="checkbox" checked={checked} onChange={() => toggleSelect(r.id)} /></td>
                <td style={tdStyle}><a href="#" onClick={(e) => { e.preventDefault(); onRowClick(r.id); }}>{r.name}</a></td>
                <td style={tdStyle}>{r.email}</td>
                <td style={tdStyle}>{r.position || r.role}</td>
                <td style={tdStyle}>{r.status || "Active"}</td>
                <td style={tdStyle}>{r.salary ? Number(r.salary).toLocaleString() : "-"}</td>
                <td style={tdStyle}>{r.dateJoined || "-"}</td>
                <td style={tdStyle}>{tenure ? `${tenure} yrs` : "-"}</td>
                <td style={tdStyle}>
                  <button onClick={() => onRowClick(r.id)}>View</button>
                  <button disabled={pendingDeletes.has(r.id)} onClick={() => handleDelete(r.id)}>
                    {pendingDeletes.has(r.id) ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <small>Page {page} of {totalPages}</small>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <PageButton page={1} label="First" disabled={page === 1} />
          <PageButton page={page - 1} label="Prev" disabled={page === 1} />
          <PageButton page={page + 1} label="Next" disabled={page === totalPages} />
          <PageButton page={totalPages} label="Last" disabled={page === totalPages} />
        </div>
      </div>
    </div>
  );
}

// helper small components and styles
const thStyle = { padding: "8px 10px", textAlign: "left", background: "#f3f4f6", fontWeight: 600 };
const tdStyle = { padding: "8px 10px", borderBottom: "1px solid #f3f4f6" };

function SortableHeader({ title, onClick, activeKey, dir }) {
  const arrow = dir === "asc" ? "▲" : dir === "desc" ? "▼" : "↕";
  return (
    <th style={thStyle}>
      <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
        {title} {activeKey ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </button>
    </th>
  );
}

function currentSortKey(sorts, key) {
  return sorts.find((s) => s.key === key) ? key : null;
}
function currentSortDir(sorts, key) {
  const f = sorts.find((s) => s.key === key);
  return f ? f.dir : null;
}

function PageButton({ page, label, disabled }) {
  const sp = new URLSearchParams(window.location.search);
  sp.set("page", String(page));
  const href = `${window.location.pathname}?${sp.toString()}`;

  return (
    <a href={href} onClick={(e) => { if (disabled) { e.preventDefault(); return; } }}>
      <button disabled={disabled}>{label}</button>
    </a>
  );
}
