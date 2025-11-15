import React from "react";
import "../style/SummaryCards.css";

export default function SummaryCards({ summary }) {
  const {
    total,
    activeCount,
    inactiveCount,
    activePct,
    topPositions,
    avgTenure,
    addedLast30,
    pctChange
  } = summary;

  return (
    <div className="container mt-4">
      <div className="row g-4">

        {/* Total Employees */}
        <div className="col-md-3 col-sm-6">
          <div className="dash-card gradient-blue shadow-sm">
            <h6>Total Employees</h6>
            <h2>{total}</h2>
          </div>
        </div>

        {/* Active */}
        <div className="col-md-3 col-sm-6">
          <div className="dash-card gradient-green shadow-sm">
            <h6>Active Employees</h6>
            <h2>{activeCount}</h2>
            <p className="small text-white-50">{activePct}% Active</p>
          </div>
        </div>

        {/* Inactive */}
        <div className="col-md-3 col-sm-6">
          <div className="dash-card gradient-red shadow-sm">
            <h6>Inactive Employees</h6>
            <h2>{inactiveCount}</h2>
          </div>
        </div>

        {/* Avg Tenure */}
        <div className="col-md-3 col-sm-6">
          <div className="dash-card gradient-orange shadow-sm">
            <h6>Average Tenure</h6>
            <h2>{avgTenure} yrs</h2>
          </div>
        </div>

        {/* Added in last 30 days */}
        <div className="col-md-3 col-sm-6">
          <div className="dash-card gradient-teal shadow-sm">
            <h6>New in Last 30 Days</h6>
            <h2>{addedLast30}</h2>
          </div>
        </div>

        {/* % Change */}
        <div className="col-md-3 col-sm-6">
          <div className="dash-card gradient-yellow shadow-sm">
            <h6>Growth % Change</h6>
            <h2>{pctChange}%</h2>
          </div>
        </div>

        {/* Top Positions */}
        <div className="col-md-6 col-sm-12">
          <div className="dash-card gradient-purple shadow-sm">
            <h6>Top Positions</h6>
            {topPositions.map((p, i) => (
              <p key={i} className="mb-1">
                <strong>{p.position}</strong> — {p.count}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
