import { Link } from "react-router-dom";
import "../style/TopNav.css";

export default function TopNav() {
  return (
    <nav className="topnav">
      <h2 className="logo">Employee Manager</h2>

      <div className="links">
        <Link to="/">Dashboard</Link>
        <Link to="/employees">Employees</Link>
        <Link to="/add">Add Employee</Link>
      </div>
    </nav>
  );
}
