import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Badge,
  Card,
  Alert,
  Form,
  InputGroup,
  Container,
} from "react-bootstrap";
import {
  Users,
  UserPlus,
  RefreshCw,
  Trash2,
  Eye,
  Pencil,
  Search,
  User,
  Download,
  Upload,
} from "lucide-react"; 
import { getEmployees, deleteEmployee, getImageUrl } from "../Service/api";
import { useTheme } from "../context/ThemeContext";

import AddEmployeeForm from "./EmployeeForm";
import EmployeeDetail from "./EmployeeDetail";

function Employee() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editEmployee, setEditEmployee] = useState(null);
  const [view, setView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  
  const fileInputRef = useRef(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data?.employees)
          ? data.employees
          : [];
      setEmployees(normalized);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleExport = () => {
    if (employees.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ["Employee ID,Name,Email,Gender,Department,Base Salary,Status"];
    const rows = employees.map(emp => 
      `"${emp.employeeId || emp.empId || emp._id || ''}","${emp.name || ''}","${emp.email || ''}","${emp.gender || 'Male'}","${emp.department || ''}","${emp.baseSalary || 0}","${emp.status || 'Active'}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split("\n").filter(row => row.trim() !== "");
      if (rows.length <= 1) {
        alert("CSV file is empty or only contains headers");
        return;
      }
      setFeedback({ 
        type: "success", 
        message: `Import simulated: Found ${rows.length - 1} employees in CSV.` 
      });
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = emp.name?.toLowerCase() || "";
    const dept = emp.department?.toLowerCase() || "";
    const empId = (emp.employeeId || emp.empId || emp._id || "").toString().toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      name.includes(search) ||
      dept.includes(search) ||
      empId.includes(search)
    );
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditEmployee(null);
    setView("detail");
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditEmployee(employee);
    setView("edit");
  };

  const handleBackToList = () => {
    setSelectedEmployee(null);
    setEditEmployee(null);
    setView("list");
  };

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".csv" onChange={handleFileImport} />

        <header className="d-flex justify-content-between align-items-center mb-4">
          <div className={`d-flex align-items-center gap-2 ${isDark ? 'text-light-emphasis' : 'text-muted'}`} style={{ fontSize: "0.875rem" }}>
            <Users size={16} />
            <span>
              Workforce / {view === "list" ? "Employees" : view === "detail" ? "Details" : "Manage"}
            </span>
          </div>
        </header>

        {view === "list" ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <h1 className={`h3 fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>Employee Management</h1>

              <div className="d-flex gap-2">
                <InputGroup style={{ width: "250px" }} className="shadow-sm">
                  <InputGroup.Text className={isDark ? 'bg-secondary border-secondary' : 'bg-white border-end-0'}>
                    <Search size={15} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search name, ID or dept..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isDark ? 'bg-secondary text-white border-secondary' : 'border-start-0 ps-0'}
                    style={{ fontSize: "0.875rem" }}
                  />
                </InputGroup>

                <Button variant={isDark ? "outline-light" : "white"} onClick={handleImportClick} className="border rounded-3 shadow-sm px-3 py-2 d-flex align-items-center gap-2">
                  <Upload size={14} /> Import
                </Button>

                <Button variant={isDark ? "outline-light" : "white"} onClick={handleExport} className="border rounded-3 shadow-sm px-3 py-2 d-flex align-items-center gap-2">
                  <Download size={14} /> Export
                </Button>

                <Button variant={isDark ? "outline-light" : "white"} onClick={fetchEmployees} className="border rounded-3 shadow-sm px-3 py-2">
                  <RefreshCw size={14} />
                </Button>

                <Button onClick={() => { setFeedback(null); setView("add"); }} className="rounded-3 shadow-sm px-3 py-2 d-flex align-items-center gap-2 text-white border-0" style={{ backgroundColor: "#00A86B" }}>
                  <UserPlus size={16} /> Add Employee
                </Button>
              </div>
            </div>

            {feedback && (
              <Alert variant={feedback.type === "success" ? "success" : "danger"} dismissible onClose={() => setFeedback(null)} className="mb-3">
                {feedback.message}
              </Alert>
            )}

            <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-secondary' : 'bg-white'}`}>
              {loading ? (
                <div className="p-4 text-muted text-center">Loading employees...</div>
              ) : (
                <Table responsive hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
                  <thead className={isDark ? 'table-dark' : 'table-light'}>
                    <tr style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                      {/* Counting (#) ko hatakar ID ko first column banaya */}
                      <th className="px-4 py-3 text-muted fw-bold">ID</th>
                      <th className="py-3 text-muted fw-bold">IMAGE</th>
                      <th className="py-3 text-muted fw-bold">NAME</th>
                      <th className="py-3 text-muted fw-bold">GENDER</th>
                      <th className="py-3 text-muted fw-bold">DEPARTMENT</th>
                      <th className="py-3 text-muted fw-bold">SALARY</th>
                      <th className="py-3 text-muted fw-bold">STATUS</th>
                      <th className="px-4 py-3 text-muted fw-bold text-end">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "0.85rem" }}>
                    {filteredEmployees.map((emp, index) => {
                      const employeeId = emp._id || emp.id;
                      const imageUrl = getImageUrl(emp.image);
                      // Dynamic Backend ID (employeeId, empId ya short Mongo ID)
                      const displayId = emp.employeeId || emp.empId || (emp._id ? `EMP-${emp._id.slice(-5).toUpperCase()}` : `EMP-${index + 1}`);
                      // Dynamic Gender handling
                      const displayGender = emp.gender || "Male";

                      return (
                        <tr key={employeeId || index}>
                          {/* First Column me Backend ID */}
                          <td className="px-4">
                            <Badge bg="light" text="primary" className="border fw-semibold">
                              {displayId}
                            </Badge>
                          </td>
                          <td>
                            {imageUrl ? (
                              <img src={imageUrl} alt="" className="rounded-circle border" style={{ width: "35px", height: "35px", objectFit: "cover" }} />
                            ) : (
                              <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{ width: "35px", height: "35px" }}><User size={18} className="text-muted" /></div>
                            )}
                          </td>
                          <td>
                            <div className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>{emp.name || "Unnamed"}</div>
                            <div className="text-muted small">{emp.email}</div>
                          </td>
                          <td className="text-capitalize">{displayGender}</td>
                          <td>{emp.department}</td>
                          <td className="fw-bold">₹{emp.baseSalary}</td>
                          <td>
                            <Badge pill style={{ backgroundColor: emp.status === "Active" ? "#E6F7F0" : "#FDE8E8", color: emp.status === "Active" ? "#00A86B" : "#DC2626", padding: "5px 12px" }}>
                              {emp.status || "Active"}
                            </Badge>
                          </td>
                          <td className="px-4 text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <Button variant="link" className="p-1 text-primary" onClick={() => handleViewEmployee(emp)}><Eye size={18} /></Button>
                              <Button variant="link" className="p-1 text-warning" onClick={() => handleEditEmployee(emp)}><Pencil size={18} /></Button>
                              <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(employeeId)}><Trash2 size={18} /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card>
          </>
        ) : view === "detail" ? (
          <EmployeeDetail employee={selectedEmployee} onBack={handleBackToList} />
        ) : view === "edit" ? (
          <AddEmployeeForm
            employee={editEmployee}
            onBack={handleBackToList}
            onSaveSuccess={() => { setFeedback({ type: "success", message: "Updated!" }); setView("list"); fetchEmployees(); }}
          />
        ) : (
          <AddEmployeeForm onBack={() => setView("list")} onSaveSuccess={() => { setFeedback({ type: "success", message: "Saved!" }); setView("list"); fetchEmployees(); }} />
        )}
      </Container>

      <style>{`
        .page-layout {
          min-height: 100vh;
          transition: all 0.3s ease;
        }
        @media (min-width: 992px) {
          .page-layout {
            margin-left: 280px; 
            width: calc(100% - 280px); 
          }
        }
        @media (max-width: 991px) {
          .page-layout { margin-left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default Employee;