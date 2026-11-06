import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  Badge,
  Modal,
  Container,
} from "react-bootstrap";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
} from "lucide-react";
import { createEvent, getEvents, getEmployees } from "../Service/api";
import { useTheme } from "../context/ThemeContext";

function Leave() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 13)); 
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dbLeaveTypes, setDbLeaveTypes] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);

  const [formData, setFormData] = useState({
    type: "", 
    startDate: "",
    endDate: "",
    reason: "",
    employeeId: "", 
  });

  const leaveTypes = [
    { label: "Today", color: "#E2E8F0", bg: "#f1f5f9" },
    { label: "Annual Leave", color: "#10B981", bg: "#ecfdf5" },
    { label: "Sick Leave", color: "#EF4444", bg: "#fef2f2" },
    { label: "Emergency Leave", color: "#F59E0B", bg: "#fffbeb" },
    { label: "Compensatory Leave", color: "#06B6D4", bg: "#ecfeff" },
    { label: "Personal Leave", color: "#84CC16", bg: "#f7fee7" },
    { label: "Marriage Leave", color: "#F97316", bg: "#fff7ed" },
    { label: "Maternity Leave", color: "#EC4899", bg: "#fdf2f8" },
    { label: "Paternity Leave", color: "#3B82F6", bg: "#eff6ff" },
    { label: "Bereavement Leave", color: "#64748B", bg: "#f8fafc" },
    { label: "Study Leave", color: "#8B5CF6", bg: "#f5f3ff" },
  ];

  const fetchData = async () => {
    try {
      const leaveTypeRes = await fetch("http://localhost:5000/api/leave-types");
      const leaveTypeData = await leaveTypeRes.json();
      if (Array.isArray(leaveTypeData)) {
        const activeTypes = leaveTypeData.filter(t => t.status === "Active");
        setDbLeaveTypes(activeTypes);
        if(activeTypes.length > 0) setFormData(prev => ({...prev, type: activeTypes[0].name}));
      }

      const policyRes = await fetch("http://localhost:5000/api/leave-policies?status=Active");
      const policyData = await policyRes.json();
      if (Array.isArray(policyData)) setLeavePolicies(policyData);

      const [events] = await Promise.all([getEvents()]);
      const leaveEvents = (Array.isArray(events) ? events : []).filter(
        (e) => e.category === "Leave",
      );
      setLeaveRequests(leaveEvents);

      try {
        const empData = await getEmployees();
        if (Array.isArray(empData) && empData.length) {
          setEmployees(
            empData.map((e) => ({
              _id: e._id,
              name: e.name || "Unnamed",
              employeeId: e.employeeId || e.empId || "",
              officeType: e.officeType || "",
              headOffice: e.headOffice || "",
              circle: e.circle || "",
              cuty: e.cuty || "",
              role: e.jobTitle || e.department || "Employee",
              img: `https://i.pravatar.cc/150?u=${e._id}`,
            })),
          );
        } else {
          setEmployees([
            { _id: "1", name: "Dr. Rowland Murphy", role: "System Administrator", img: "https://i.pravatar.cc/150?u=1" },
            { _id: "2", name: "Antwon Schaefer", role: "Software Developer", img: "https://i.pravatar.cc/150?u=2" },
            { _id: "3", name: "Mr. Amos Hills", role: "HR Manager", img: "https://i.pravatar.cc/150?u=3" },
          ]);
        }
      } catch (err) {
        setEmployees([
          { _id: "1", name: "Dr. Rowland Murphy", role: "System Administrator", img: "https://i.pravatar.cc/150?u=1" },
          { _id: "2", name: "Antwon Schaefer", role: "Software Developer", img: "https://i.pravatar.cc/150?u=2" },
          { _id: "3", name: "Mr. Amos Hills", role: "HR Manager", img: "https://i.pravatar.cc/150?u=3" },
        ]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(currentDate);
      day.setDate(currentDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        alert("Please select a valid leave date range.");
        return;
      }
      const policy = leavePolicies.find((item) => item.leaveType === formData.type && item.status === "Active");
      if (policy && (diffDays < Number(policy.minDaysPerApplication) || diffDays > Number(policy.maxDaysPerApplication))) {
        alert(`This policy allows ${policy.minDaysPerApplication} to ${policy.maxDaysPerApplication} days per application.`);
        return;
      }
      const emp = employees.find((x) => String(x._id) === String(formData.employeeId));
      const employeeName = emp ? emp.name : "";
      const employeeCode = emp?.employeeId || emp?.empId || "";
      const branch = emp?.officeType || emp?.headOffice || emp?.circle || emp?.cuty || "";

      await createEvent({
        title: formData.type,
        description: formData.reason,
        startDate: formData.startDate,
        endDate: formData.endDate,
        allDay: true,
        category: "Leave",
        days: diffDays,
        employeeId: formData.employeeId,
        employeeName,
        employeeCode,
        branch,
      });

      alert("🎉 Leave Submitted Successfully!");
      setShowModal(false);
      fetchData(); 
    } catch (error) {
      alert("Failed to submit leave.");
    }
  };

  const getLeaveForDay = (empId, date) => {
    const dateStr = date.toLocaleDateString("en-CA");
    return leaveRequests.find((leave) => {
      try {
        const startLocal = new Date(leave.startDate).toLocaleDateString("en-CA");
        const endLocal = new Date(leave.endDate).toLocaleDateString("en-CA");
        return (
          String(leave.employeeId) === String(empId) &&
          dateStr >= startLocal &&
          dateStr <= endLocal
        );
      } catch (err) {
        return false;
      }
    });
  };

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className={`fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: "24px" }}>Leave Applications</h2>
          <div className="d-flex gap-2">
            <Button variant={isDark ? "outline-light" : "outline-secondary"} className="d-flex align-items-center gap-2 bg-white text-dark shadow-sm">
              <Download size={18} /> Export
            </Button>
            <Button style={{ backgroundColor: "#10B981", border: "none" }} className="d-flex align-items-center gap-2 shadow-sm px-4" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Add Application
            </Button>
          </div>
        </div>

        <Card className={`border-0 shadow-sm rounded-4 mb-4 p-3 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-4">
              <div className="d-flex gap-1">
                <Button variant={isDark ? "outline-light" : "light"} onClick={() => changeDate(-7)} className="rounded-3 border">
                  <ChevronLeft size={20} />
                </Button>
                <Button variant={isDark ? "outline-light" : "light"} onClick={() => changeDate(7)} className="rounded-3 border">
                  <ChevronRight size={20} />
                </Button>
              </div>
              <h4 className={`m-0 fw-bold ${isDark ? 'text-white' : ''}`}>
                {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
              </h4>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Form.Control
                type="search"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`shadow-sm py-2 ${isDark ? 'bg-dark text-white border-secondary' : 'border-light'}`}
                style={{ width: "220px" }}
              />
              <Form.Select style={{ width: "220px" }} className={`shadow-sm py-2 ${isDark ? 'bg-dark text-white border-secondary' : 'border-light'}`} value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                <option value="All">All Employees</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </Form.Select>
            </div>
          </div>
        </Card>

        <Card className={`border-0 shadow-sm rounded-4 mb-4 p-3 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          <div className="d-flex flex-wrap gap-4 align-items-center">
            <span className="fw-bold text-secondary text-uppercase small">Legend:</span>
            {leaveTypes.map((type, idx) => (
              <div key={idx} className="d-flex align-items-center gap-2">
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: type.color }}></div>
                <span style={{ fontSize: "13px", color: type.color, fontWeight: "600" }}>{type.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          <Table responsive bordered className={`m-0 text-center align-middle ${isDark ? 'table-dark' : 'border-light'}`}>
            <thead className={isDark ? 'table-dark' : ''}>
              <tr style={{ backgroundColor: isDark ? "#1a202c" : "#F8FAFC" }}>
                <th className={`text-start ps-4 py-4 ${isDark ? 'bg-dark text-light border-secondary' : 'bg-white'}`} style={{ width: "300px", color: "#64748B" }}>Employee</th>
                {weekDays.map((date, i) => (
                  <th key={i} className={`py-3 ${date.toDateString() === new Date().toDateString() ? "bg-success-subtle text-success" : (isDark ? "bg-dark border-secondary" : "bg-white")}`}>
                    <div style={{ fontSize: "18px", fontWeight: "800" }}>{date.getDate()}</div>
                    <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>{date.toLocaleString("default", { weekday: "short" })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees
                .filter((emp) => (filterEmployee === "All" || emp._id === filterEmployee) && emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((emp) => (
                  <tr key={emp._id}>
                    <td className={`text-start ps-4 py-3 ${isDark ? 'bg-dark text-white border-secondary' : 'bg-white border-light'}`}>
                      <div className="fw-bold" style={{ fontSize: "15px" }}>{emp.name}</div>
                      <div className="text-muted" style={{ fontSize: "13px" }}>{emp.role}</div>
                    </td>
                    {weekDays.map((date, i) => {
                      const leave = getLeaveForDay(emp._id, date);
                      const leaveTypeFromDB = dbLeaveTypes.find(t => t.name === leave?.title);
                      const typeColor = leaveTypeFromDB ? leaveTypeFromDB.color : "#10B981";

                      return (
                        <td key={i} className={`${isDark ? 'bg-dark border-secondary' : 'bg-white border-light'} p-1`} style={{ minWidth: "120px" }}>
                          {leave && (
                            <div onClick={() => { setSelectedLeave(leave); setShowDetailsModal(true); }} className="p-2 rounded-3 text-start" style={{ border: `1px solid ${typeColor}44`, backgroundColor: `${typeColor}11`, cursor: "pointer" }}>
                              <div style={{ color: typeColor, fontSize: "12px", fontWeight: "bold" }}>{leave.title}</div>
                              <div className="text-muted" style={{ fontSize: "10px" }}>{leaveTypeFromDB?.isPaid ? 'Paid' : 'Unpaid'} Leave</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </Table>
        </Card>

        {/* Modals */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Leave Details</Modal.Title></Modal.Header>
          <Modal.Body>
            {selectedLeave ? (
              <div>
                <p><strong>Employee:</strong> {selectedLeave.employeeName || "Unknown"}</p>
                <p><strong>Type:</strong> {selectedLeave.title}</p>
                <p><strong>From:</strong> {new Date(selectedLeave.startDate).toLocaleDateString("en-CA")}</p>
                <p><strong>To:</strong> {new Date(selectedLeave.endDate).toLocaleDateString("en-CA")}</p>
                <p><strong>Reason:</strong></p>
                <div className="text-muted small" style={{ whiteSpace: "pre-wrap" }}>{selectedLeave.description || "No reason provided."}</div>
              </div>
            ) : <div>No details available.</div>}
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button></Modal.Footer>
        </Modal>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="px-4 pt-4"><Modal.Title className="fw-bold">Apply New Leave</Modal.Title></Modal.Header>
          <Modal.Body className="px-4 pb-4">
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Select Employee</Form.Label>
                <Form.Select name="employeeId" required onChange={handleInputChange} className="py-2">
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Leave Type</Form.Label>
                <Form.Select name="type" value={formData.type} onChange={handleInputChange} className="py-2" required>
                  {dbLeaveTypes.length > 0 ? dbLeaveTypes.map((t) => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  )) : <option value="">Loading types...</option>}
                </Form.Select>
              </Form.Group>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted">Start Date</Form.Label><Form.Control type="date" name="startDate" required onChange={handleInputChange} className="py-2" /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted">End Date</Form.Label><Form.Control type="date" name="endDate" required onChange={handleInputChange} className="py-2" /></Form.Group></Col>
              </Row>
              <Form.Group className="mb-4"><Form.Label className="small fw-bold text-muted">Reason</Form.Label><Form.Control as="textarea" rows={3} name="reason" required onChange={handleInputChange} /></Form.Group>
              <Button type="submit" className="w-100 border-0 py-2 fw-bold" style={{ backgroundColor: "#10B981" }}>Confirm Application</Button>
            </Form>
          </Modal.Body>
        </Modal>
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

export default Leave;