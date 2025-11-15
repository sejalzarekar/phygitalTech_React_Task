import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  checkEmailUnique,
  generateEmployeeCode,
  addEmployee,
} from "../utils/api";

import { useEmployeeDispatch } from "../context/EmployeeProvider";

const AddEmployee = () => {
  const navigate = useNavigate();
  const dispatch = useEmployeeDispatch();

  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    salary: "",
    dateJoined: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailValid, setEmailValid] = useState(null);
  const [employeeCode, setEmployeeCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty =
    form.name ||
    form.email ||
    form.position ||
    form.salary ||
    form.dateJoined;

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    (async () => {
      const code = await generateEmployeeCode();
      setEmployeeCode(code);
    })();
  }, []);

  useEffect(() => {
    if (!form.email) return;
    setCheckingEmail(true);
    checkEmailUnique(form.email)
      .then((unique) => setEmailValid(unique))
      .finally(() => setCheckingEmail(false));
  }, [form.email]);

  const validate = () => {
    let newErrors = {};
    if (form.name.trim().length < 3)
      newErrors.name = "Name must be at least 3 characters.";

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(form.email))
      newErrors.email = "Invalid email format.";

    if (!form.position)
      newErrors.position = "Position is required.";

    if (!form.salary || Number(form.salary) <= 0)
      newErrors.salary = "Salary must be positive.";

    if (!form.dateJoined)
      newErrors.dateJoined = "Date joined is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBack = () => {
    if (isDirty) {
      const leave = window.confirm(
        "You have unsaved changes. Do you want to leave?"
      );
      if (!leave) return;
    }
    navigate("/employees");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (emailValid === false) {
      alert("Email already exists!");
      return;
    }

    setIsSubmitting(true);

    const newEmployee = {
      id: Date.now(),
      employeeCode,
      ...form,
      salary: Number(form.salary),
      deleted: false,
      statusHistory: [],
    };

    try {
      const saved = await addEmployee(newEmployee);
      dispatch({ type: "add_employee", payload: saved });
      alert("Employee added successfully!");
      navigate("/employees");
    } catch {
      alert("Error saving employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      {/* PAGE HEADER */}
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-outline-secondary me-3" onClick={handleBack}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="fw-bold">Add New Employee</h2>
      </div>

      {/* MAIN CARD */}
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-4">

          {/* SECTION HEADER */}
          <h5 className="fw-bold text-primary mb-3">
            <i className="fa-solid fa-id-card me-2"></i>
            Employee Details
          </h5>

          <p className="mb-4">
            <strong>Employee Code:</strong> {employeeCode || "Generating..."}
          </p>

          <form onSubmit={handleSubmit}>

            {/*  GRID LAYOUT  */}
            <div className="row g-3">

              {/* NAME */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-user me-1"></i> Full Name
                </label>
                <input
                  name="name"
                  className="form-control form-control-lg"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter employee name"
                />
                {errors.name && <small className="text-danger">{errors.name}</small>}
              </div>

              {/* EMAIL */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-envelope me-1"></i> Email
                </label>
                <input
                  name="email"
                  className="form-control form-control-lg"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
                {checkingEmail && <small className="text-primary">Checking email…</small>}
                {emailValid === false && (
                  <small className="text-danger">Email already exists</small>
                )}
                {errors.email && <small className="text-danger">{errors.email}</small>}
              </div>

                {/* POSITION DROPDOWN ONLY */}
                <div className="col-md-6">
                <label className="form-label fw-semibold">
                    <i className="fa-solid fa-briefcase me-1"></i> Position
                </label>

                <select
                    name="position"
                    className="form-select form-select-lg"
                    value={form.position}
                    onChange={handleChange}
                >
                    <option value="">Select Position</option>
                    <option value="HR Executive">HR Executive</option>
                    <option value="Front End Developer">Front End Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Fullstack Developer">Fullstack Developer</option>
                    <option value="UI-UX Designer">UI-UX Designer</option>
                </select>

                {errors.position && (
                    <small className="text-danger">{errors.position}</small>
                )}
                </div>
              {/* SALARY */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-money-bill me-1"></i> Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  className="form-control form-control-lg"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="Enter salary"
                />
                {errors.salary && (
                  <small className="text-danger">{errors.salary}</small>
                )}
              </div>

              {/* STATUS */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-toggle-on me-1"></i> Status
                </label>
                <select
                  name="status"
                  className="form-select form-select-lg"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              {/* DATE JOINED */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-calendar-days me-1"></i> Date Joined
                </label>
                <input
                  type="date"
                  name="dateJoined"
                  className="form-control form-control-lg"
                  value={form.dateJoined}
                  onChange={handleChange}
                />
                {errors.dateJoined && (
                  <small className="text-danger">{errors.dateJoined}</small>
                )}
              </div>

            </div>

            {/* SUBMIT BUTTON */}
            <button
              className="btn btn-primary btn-lg mt-4 px-4"
              type="submit"
              disabled={isSubmitting || checkingEmail}
            >
              {isSubmitting ? "Saving..." : "Add Employee"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
