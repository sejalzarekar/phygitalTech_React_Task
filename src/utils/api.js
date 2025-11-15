const LS_KEY = "employees_db";

const wait = (ms = 500) => new Promise(res => setTimeout(res, ms));

const maybeFail = () => {};

// Sample  employees
const sampleEmployees = [
  {
    id: "1",
    name: "Rohit Desai",
    email: "rohit.desai@example.com",
    role: "Backend Developer",
    position: "Backend Developer",
    status: "Active",
    dateJoined: "2024-02-10",
    employeeCode: "EMP-2025-003",
    deleted: false,
    salary: 10000,
    statusHistory: [], 
  },
  {
    id: "2",
    name: "Sejal Desai",
    email: "sejal.desai@example.com",
    role: "Frontend Developer",
    position: "Frontend Developer",
    status: "Active",
    dateJoined: "2023-09-15",
    employeeCode: "EMP-2024-003",
    deleted: false,
    salary: 100000,
    statusHistory: [],  
  },
];


// Read DB from LocalStorage
const readDB = () => {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : null;
};

// Write DB to LocalStorage
const writeDB = (data) => {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
};

export async function fetchEmployees() {
  await wait(700);

  let data = readDB();

  if (!data) {
    writeDB(sampleEmployees);
    data = sampleEmployees;
  }

  return data;
}

export async function addEmployee(employee) {
  await wait(500);

  const db = readDB() || [];

  const newEmp = {
    ...employee,
    id: String(Date.now()),
    deleted: false,
  };

  const updated = [...db, newEmp];
  writeDB(updated);

  return newEmp;
}


export async function softDeleteEmployee(id) {
  await wait(500);

  const db = readDB() || [];
  const updated = db.map((e) =>
    e.id === id ? { ...e, deleted: true, deletedAt: new Date().toISOString() } : e
  );

  writeDB(updated);
  return id;
}

export async function checkEmailUnique(email) {
  await wait(400);

  const db = readDB() || [];
  const exists = db.some((e) => e.email === email && !e.deleted);

  return !exists;
}

export function generateEmployeeCode() {
  const db = readDB() || [];
  const year = new Date().getFullYear();

  const count = db.length + 1;
  const padded = String(count).padStart(3, "0");

  return `EMP-${year}-${padded}`;
}

export async function updateEmployee(employee) {
  await wait(500);

  const db = readDB() || [];
  const old = db.find(e => e.id === employee.id);

  let updatedStatusHistory = old?.statusHistory || [];

  if (old && old.status !== employee.status) {
    updatedStatusHistory = [
      {
        date: new Date().toISOString().split("T")[0],
        oldStatus: old.status,
        newStatus: employee.status
      },
      ...updatedStatusHistory
    ];
  }

  const updated = db.map(e =>
    e.id === employee.id
      ? { ...employee, statusHistory: updatedStatusHistory }
      : e
  );

  writeDB(updated);
  return { ...employee, statusHistory: updatedStatusHistory };
}

