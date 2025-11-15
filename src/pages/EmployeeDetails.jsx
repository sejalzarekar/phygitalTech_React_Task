import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchEmployees } from "../utils/api";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const employees = await fetchEmployees();
    const found = employees.find((e) => e.id === id && !e.deleted);

    if (!found) {
      alert("Employee not found");
      navigate("/employees");
      return;
    }

    setEmployee(found);
    setLoading(false);
  }

  if (loading) return <h3>Loading...</h3>;

  const tenure = getTenure(employee.dateJoined);

  return (
    <div style={page}>
      <div style={header}>
        <h1>{employee.name}</h1>
        <button style={backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* Employee Info Card */}
      <div style={card}>
        <h2 style={sectionTitle}>Employee Information</h2>

        <div style={grid}>
          <Info label="Email" value={employee.email} />
          <Info label="Position" value={employee.role} />
          <Info
            label="Status"
            value={employee.status}
            highlight={employee.status === "Active" ? "#d1f7c4" : "#ffd4d4"}
          />
          <Info
            label="Salary"
            value={`₹${Number(employee.salary).toLocaleString()}`}
          />
          <Info label="Employee Code" value={employee.employeeCode} />
          <Info label="Date Joined" value={employee.dateJoined} />

          <Info
            label="Tenure"
            value={`${tenure.years} yrs ${tenure.months} months ${tenure.days} days`}
          />
        </div>
      </div>

      {/* Status History */}
      <div style={{ ...card, marginTop: 30 }}>
        <h2 style={sectionTitle}>Status Change History</h2>

        {(!employee.statusHistory || employee.statusHistory.length === 0) && (
          <p style={{ opacity: 0.8 }}>No status changes yet.</p>
        )}

        {employee.statusHistory?.map((h, idx) => (
          <div key={idx} style={historyItem}>
            <div style={historyDot}></div>
            <div>
              <p style={historyDate}>{h.date}</p>
              <p style={{ margin: "4px 0" }}>
                <strong>{h.oldStatus}</strong> →{" "}
                <strong>{h.newStatus}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Small Reusable Component */
function Info({ label, value, highlight }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={infoLabel}>{label}</p>
      <p
        style={{
          ...infoValue,
          background: highlight || "transparent",
          padding: highlight ? "4px 8px" : 0,
          borderRadius: highlight ? "6px" : 0,
          display: "inline-block",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* Styles */
const page = {
  padding: "30px",
  maxWidth: "900px",
  margin: "0 auto",
  fontFamily: "Inter, sans-serif",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const backBtn = {
  padding: "8px 14px",
  background: "#444",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const card = {
  padding: "25px",
  borderRadius: "14px",
  background: "white",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const sectionTitle = {
  marginBottom: "20px",
  borderLeft: "4px solid #4a90e2",
  paddingLeft: "10px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  columnGap: "40px",
};

const infoLabel = {
  fontSize: "13px",
  fontWeight: 600,
  opacity: 0.6,
  marginBottom: "2px",
};

const infoValue = {
  fontSize: "16px",
  fontWeight: 500,
};

const historyItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "12px 0",
  borderBottom: "1px solid #eee",
};

const historyDot = {
  width: "12px",
  height: "12px",
  background: "#4a90e2",
  borderRadius: "50%",
  marginTop: "5px",
};

const historyDate = {
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "4px",
};

/* Tenure helper */
function getTenure(startDate) {
  if (!startDate) return { years: 0, months: 0, days: 0 };

  const start = new Date(startDate);
  const now = new Date();

  let y = now.getFullYear() - start.getFullYear();
  let m = now.getMonth() - start.getMonth();
  let d = now.getDate() - start.getDate();

  if (d < 0) {
    m--;
    d += 30;
  }
  if (m < 0) {
    y--;
    m += 12;
  }

  return { years: y, months: m, days: d };
}
