import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Badge, Form, Nav, ProgressBar, Spinner } from 'react-bootstrap';
import { ShieldCheck, Users, CalendarCheck, FileClock, Check, X, RefreshCw, Plus, Briefcase, Building2, UserCog, MapPin, LogOut, LogIn, Search } from 'lucide-react';
import { getEmployees, getAttendance } from '../Service/api';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = "http://localhost:5000";
const SIDEBAR_WIDTH = "280px";

export default function AdminPanel() {
  const navigate = useNavigate();

  // Sidebar links se aane wala active tab (?tab=attendance, ?tab=leaves etc.)
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Dynamic state definitions
  const [newOfficeType, setNewOfficeType] = useState("");
  const [officeTypes, setOfficeTypes] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [departments, setDepartments] = useState([]);
  const [newEmployeeType, setNewEmployeeType] = useState("");
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [newCircleType, setNewCircleType] = useState("");
  const [circleTypes, setCircleTypes] = useState([]);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      alert("Logged out successfully!");
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  // --- Fetch API Handlers ---
  const fetchOfficeTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/office-types`);
      setOfficeTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching office types:", err);
    }
  };

  const handleAddOfficeType = async () => {
    if (!newOfficeType.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/office-types`, { name: newOfficeType });
      setNewOfficeType("");
      fetchOfficeTypes();
      alert("Office Type added successfully!");
    } catch (err) {
      console.error("Error adding office type:", err);
    }
  };

  const handleDeleteOfficeType = async (id) => {
    if (window.confirm("Delete this Office Type?")) {
      try {
        await axios.delete(`${API_BASE}/api/office-types/${id}`);
        fetchOfficeTypes();
      } catch (e) {
        console.error("Error deleting office type:", e);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/categories`, { name: newCategory });
      setNewCategory("");
      fetchCategories();
      alert("Employee Category added successfully!");
    } catch (e) {
      console.error("Error adding category:", e);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`${API_BASE}/api/categories/${id}`);
        fetchCategories();
      } catch (e) {
        console.error("Error deleting category:", e);
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/departments`);
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching departments:", e);
    }
  };

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/departments`, { name: newDept });
      setNewDept("");
      fetchDepartments();
      alert("Designation added successfully!");
    } catch (e) {
      console.error("Error adding department:", e);
    }
  };

  const handleDeleteDept = async (id) => {
    if (window.confirm("Delete this Designation?")) {
      try {
        await axios.delete(`${API_BASE}/api/departments/${id}`);
        fetchDepartments();
      } catch (e) {
        console.error("Error deleting department:", e);
      }
    }
  };

  const fetchEmployeeTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employee-types`);
      setEmployeeTypes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching employee types:", e);
    }
  };

  const handleAddEmployeeType = async () => {
    if (!newEmployeeType.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/employee-types`, { name: newEmployeeType });
      setNewEmployeeType("");
      fetchEmployeeTypes();
      alert("Employee Type added successfully!");
    } catch (e) {
      console.error("Error adding employee type:", e);
    }
  };

  const handleDeleteEmployeeType = async (id) => {
    if (window.confirm("Delete this employee type?")) {
      try {
        await axios.delete(`${API_BASE}/api/employee-types/${id}`);
        fetchEmployeeTypes();
      } catch (e) {
        console.error("Error deleting employee type:", e);
      }
    }
  };

  const fetchCircleTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/circle-types`);
      setCircleTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching circle types:", err);
    }
  };

  const handleAddCircleType = async () => {
    if (!newCircleType.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/circle-types`, { name: newCircleType });
      setNewCircleType("");
      fetchCircleTypes();
      alert("Circle Type added successfully!");
    } catch (err) {
      console.error("Error adding circle type:", err);
    }
  };

  const handleDeleteCircleType = async (id) => {
    if (window.confirm("Delete this Circle Type?")) {
      try {
        await axios.delete(`${API_BASE}/api/circle-types/${id}`);
        fetchCircleTypes();
      } catch (e) {
        console.error("Error deleting circle type:", e);
      }
    }
  };

  // --- Dynamic Leaves Fetch Function ---
  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setLeaveRequests(
        (Array.isArray(res.data) ? res.data : []).filter((event) => event.category === 'Leave')
      );
    } catch (e) {
      console.error('Error fetching leaves:', e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const records = await getAttendance(attendanceDate);
      setAttendanceRecords(Array.isArray(records) ? records : []);
    } catch (e) {
      console.error('Error fetching attendance:', e);
      setAttendanceRecords([]);
    }
  };

  useEffect(() => {
    fetchAdminContext();
    fetchCategories();
    fetchDepartments();
    fetchEmployeeTypes();
    fetchOfficeTypes();
    fetchCircleTypes();
    
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'leaves') fetchLeaves();
  }, [activeTab, attendanceDate]);

  const fetchAdminContext = async () => {
    setLoading(true);
    try {
      const employeeData = await getEmployees();
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      await fetchLeaves();
    } catch (e) {
      console.error('Admin fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // --- Dynamic Status Update Handler ---
  const handleLeaveStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/api/events/${id}`, 
        { status }, 
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      alert(`Leave request ${status} successfully!`);
      fetchLeaves();
    } catch (e) {
      console.error('Error updating leave status:', e);
      alert('Failed to update leave status');
    }
  };

  return (
    <div className="main-container" style={{ color: '#2D3748', padding: '20px', marginLeft: SIDEBAR_WIDTH }}>
      <header className="d-flex justify-content-between align-items-center mb-4 bg-dark text-white p-4 rounded-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-success p-2 rounded-3 text-white"><ShieldCheck size={28} /></div>
          <div>
            <h2 className="h4 fw-bold m-0 text-white">HWB Control Panel</h2>
            <small className="text-success fw-medium">Centralized Super-Admin Administration Mode</small>
          </div>
        </div>
        
        {/* <div className="d-flex gap-2">
          <Button variant="outline-light" size="sm" onClick={fetchAdminContext} className="rounded-3 d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Refresh Logs
          </Button>
          <Button 
            variant={isLoggedIn ? "danger" : "success"} 
            size="sm" 
            onClick={handleAuthAction} 
            className="rounded-3 d-flex align-items-center gap-2"
          >
            {isLoggedIn ? <><LogOut size={14} /> Logout</> : <><LogIn size={14} /> Login</>}
          </Button>
        </div> */}
      </header>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {loading && (
            <div className="d-flex align-items-center justify-content-center py-5 text-muted">
              <Spinner animation="border" size="sm" className="me-2" /> Loading admin data...
            </div>
          )}
          <Row className="mb-4">
            <Col md={2} className="mb-3">
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex justify-content-between"><small className="text-muted fw-bold">Workforce</small><Users size={16} className="text-primary" /></div>
                <h2 className="fw-bold mt-2">{employees.length}</h2>
                <ProgressBar now={Math.min(100, employees.length * 10)} variant="primary" style={{ height: '4px' }} />
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex justify-content-between"><small className="text-muted fw-bold">Leaves</small><FileClock size={16} className="text-warning" /></div>
                <h2 className="fw-bold mt-2 text-warning">{leaveRequests.length}</h2>
                <ProgressBar now={Math.min(100, leaveRequests.length * 20)} variant="warning" style={{ height: '4px' }} />
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex justify-content-between"><small className="text-muted fw-bold">Category</small><Briefcase size={16} className="text-info" /></div>
                <h2 className="fw-bold mt-2 text-info">{categories.length}</h2>
                <ProgressBar now={100} variant="info" style={{ height: '4px' }} />
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex justify-content-between"><small className="text-muted fw-bold">Designation</small><Building2 size={16} className="text-success" /></div>
                <h2 className="fw-bold mt-2 text-success">{departments.length}</h2>
                <ProgressBar now={100} variant="success" style={{ height: '4px' }} />
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex justify-content-between"><small className="text-muted fw-bold">Emp_Types</small><UserCog size={16} className="text-danger" /></div>
                <h2 className="fw-bold mt-2 text-danger">{employeeTypes.length}</h2>
                <ProgressBar now={100} variant="danger" style={{ height: '4px' }} />
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex justify-content-between"><small className="text-muted fw-bold">Office_Types</small><MapPin size={16} style={{ color: '#6366F1' }} /></div>
                <h2 className="fw-bold mt-2" style={{ color: '#6366F1' }}>{officeTypes.length}</h2>
                <ProgressBar now={100} style={{ height: '4px', backgroundColor: '#E0E7FF' }} />
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-1">Employee Directory</h5>
                <small className="text-muted">Complete workforce overview</small>
              </div>
              <Badge bg="light" text="dark" className="border">
                {employees.length} Employees
              </Badge>
            </div>
            <Table responsive hover className="m-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>EMPLOYEE ID</th>
                  <th>NAME / EMAIL</th>
                  <th>DEPARTMENT</th>
                  <th>DESIGNATION</th>
                  <th>BRANCH / OFFICE</th>
                  <th>EMPLOYEE TYPE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e._id || e.name}>
                    <td className="fw-semibold text-nowrap">
                      {e.employeeId || e.empId || (e._id ? `EMP-${e._id.slice(-5).toUpperCase()}` : 'N/A')}
                    </td>
                    <td>
                      <div className="fw-bold text-nowrap">{e.name || 'Unnamed'}</div>
                      <div className="text-muted small">{e.email || 'No email'}</div>
                    </td>
                    <td>{e.department || 'Operations'}</td>
                    <td>{e.jobTitle || 'Not assigned'}</td>
                    <td>{e.officeType || e.headOffice || e.circle || e.cuty || 'Not assigned'}</td>
                    <td>{e.employeeType || 'Not assigned'}</td>
                    <td>
                      <Badge bg={e.status === 'Active' ? 'success' : 'secondary'} pill>
                        {e.status || 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 d-flex align-items-center gap-2"><CalendarCheck className="text-success" /> Master Attendance Registry</h5>
            <Form.Control
              type="date"
              className="w-auto rounded-3"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
            />
          </div>
          <Table responsive hover className="m-0 align-middle">
            <thead className="table-light">
              <tr><th>EMPLOYEE</th><th>EMPLOYEE ID</th><th>STATUS</th><th>BRANCH</th><th>DEPARTMENT</th><th>CHECK IN</th><th>CHECK OUT</th></tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id || employee.name}>
                  {(() => {
                    const record = attendanceRecords.find(
                      (item) => String(item.employeeId) === String(employee._id)
                    );
                    const status = record?.status || 'Not Marked';
                    const branch = employee.officeType || employee.headOffice || employee.circle || employee.cuty || 'N/A';
                    return (
                      <>
                  <td className="fw-bold">{employee.name}</td>
                  <td>{employee.employeeId || `EMP-${String(employee._id || '').slice(-5).toUpperCase()}`}</td>
                  <td><Badge bg={status === 'Present' ? 'success' : status === 'Late' ? 'warning' : status === 'Absent' ? 'danger' : 'secondary'}>{status}</Badge></td>
                  <td>{branch}</td>
                  <td>{employee.department || 'Operations'}</td>
                  <td>{record?.checkIn || '--:--'}</td>
                  <td>{record?.checkOut || '--:--'}</td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Dynamic Leaves Tab */}
      {activeTab === 'leaves' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white overflow-hidden">
          <div className="p-4 bg-light border-bottom d-flex justify-content-between align-items-center">
            <h5 className="fw-bold m-0">Leave Authorization Escalations</h5>
            <Button size="sm" variant="outline-secondary" onClick={fetchLeaves}><RefreshCw size={14} /> Refresh</Button>
          </div>
          {leaveRequests.length === 0 ? (
            <div className="p-5 text-center text-muted">Inbox Clean! No pending leave inquiries found.</div>
          ) : (
            <Table responsive hover className="m-0 align-middle">
              <thead>
                <tr className="table-light">
                  <th>EMPLOYEE</th>
                  <th>EMPLOYEE ID</th>
                  <th>BRANCH</th>
                  <th>LEAVE TYPE</th>
                  <th>DATES / DAYS</th>
                  <th>REASON</th>
                  <th>STATUS</th>
                  <th className="text-end px-4">DECISION ACTION</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(req => {
                  const linkedEmployee = employees.find(
                    (employee) => String(employee._id) === String(req.employeeId)
                  );
                  const employeeCode = req.employeeCode || linkedEmployee?.employeeId;
                  const branch = req.branch || linkedEmployee?.officeType || linkedEmployee?.headOffice || linkedEmployee?.circle || linkedEmployee?.cuty;
                  return (
                  <tr key={req._id || req.id}>
                    <td className="fw-bold">
                      {req.employeeName || req.employeeId?.name || req.name || 'Employee'}
                    </td>
                    <td>{employeeCode || 'N/A'}</td>
                    <td>{branch || 'N/A'}</td>
                    <td>
                      <Badge bg="secondary">
                        {req.leaveType || req.type || 'Casual Leave'}
                      </Badge>
                    </td>
                    <td className="fw-bold">
                      {req.days ? `${req.days} Day(s)` : `${req.startDate ? req.startDate.slice(0,10) : ''} - ${req.endDate ? req.endDate.slice(0,10) : ''}`}
                    </td>
                    <td className="text-muted small">{req.reason || req.description || 'N/A'}</td>
                    <td>
                      <Badge bg={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}>
                        {req.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="text-end px-4">
                      {req.status === 'Pending' ? (
                        <>
                          <Button size="sm" variant="success" className="me-2 rounded-3" onClick={() => handleLeaveStatus(req._id || req.id, 'Approved')}>
                            <Check size={14} /> Grant
                          </Button>
                          <Button size="sm" variant="outline-danger" className="rounded-3" onClick={() => handleLeaveStatus(req._id || req.id, 'Rejected')}>
                            <X size={14} /> Deny
                          </Button>
                        </>
                      ) : (
                        <small className="text-muted">Completed</small>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Category Management Tab */}
      {activeTab === 'jobs' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><Briefcase className="text-info" /> Manage Employee_Category</h5>
          <Form className="mb-4">
            <Row className="g-2">
              <Col md={9}>
                <Form.Control type="text" placeholder="Enter Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded-3 border-secondary-subtle" />
              </Col>
              <Col md={3}><Button onClick={handleAddCategory} className="w-100 rounded-3 btn-dark gap-2 d-flex align-items-center justify-content-center"><Plus size={18} /> Add Category</Button></Col>
            </Row>
          </Form>
          <Table responsive hover className="m-0 border rounded-3 overflow-hidden align-middle">
            <thead className="table-light"><tr><th width="10%">#</th><th width="70%">CATEGORY NAME</th><th width="20%" className="text-end">MANAGEMENT</th></tr></thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat._id || i}><td>{i + 1}</td><td className="fw-semibold">{cat.name}</td><td className="text-end"><Button variant="link" className="text-danger p-0" onClick={() => handleDeleteCategory(cat._id)}><X size={20} /></Button></td></tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Designation Management Tab */}
      {activeTab === 'depts' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><Building2 className="text-success" /> Manage Designation</h5>
          <Form className="mb-4">
            <Row className="g-2">
              <Col md={9}>
                <Form.Control type="text" placeholder="Enter Designation" value={newDept} onChange={(e) => setNewDept(e.target.value)} className="rounded-3 border-secondary-subtle" />
              </Col>
              <Col md={3}><Button onClick={handleAddDept} className="w-100 rounded-3 btn-dark gap-2 d-flex align-items-center justify-content-center"><Plus size={18} /> Add Designation</Button></Col>
            </Row>
          </Form>
          <Table responsive hover className="m-0 border rounded-3 overflow-hidden align-middle">
            <thead className="table-light"><tr><th width="10%">#</th><th width="70%">DESIGNATION NAME</th><th width="20%" className="text-end">MANAGEMENT</th></tr></thead>
            <tbody>
              {departments.map((dept, i) => (
                <tr key={dept._id || i}><td>{i + 1}</td><td className="fw-semibold">{dept.name}</td><td className="text-end"><Button variant="link" className="text-danger p-0" onClick={() => handleDeleteDept(dept._id)}><X size={20} /></Button></td></tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Employee Type Management Tab */}
      {activeTab === 'types' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><UserCog className="text-danger" /> Manage Employee_Type</h5>
          <Form className="mb-4">
            <Row className="g-2">
              <Col md={9}>
                <Form.Control
                  type="text"
                  placeholder="Enter Employee Type"
                  value={newEmployeeType}
                  onChange={(e) => setNewEmployeeType(e.target.value)}
                  className="rounded-3 border-secondary-subtle"
                />
              </Col>
              <Col md={3}>
                <Button onClick={handleAddEmployeeType} className="w-100 rounded-3 btn-dark d-flex align-items-center justify-content-center gap-2">
                  <Plus size={18} /> Add Type
                </Button>
              </Col>
            </Row>
          </Form>
          <Table responsive hover className="m-0 border rounded-3 overflow-hidden align-middle">
            <thead className="table-light text-secondary">
              <tr><th width="10%">#</th><th width="70%">TYPE NAME</th><th width="20%" className="text-end">MANAGEMENT</th></tr>
            </thead>
            <tbody>
              {employeeTypes.map((type, index) => (
                <tr key={type._id || index}><td>{index + 1}</td><td className="fw-semibold">{type.name}</td><td className="text-end"><Button variant="link" className="text-danger p-0" onClick={() => handleDeleteEmployeeType(type._id)}><X size={20} /></Button></td></tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Office Type Management Tab */}
      {activeTab === 'office' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><MapPin size={22} style={{ color: '#6366F1' }} /> Manage Office_Type</h5>
          <Form className="mb-4">
            <Row className="g-2">
              <Col md={9}>
                <Form.Control
                  type="text"
                  placeholder="Enter Office Type (e.g. Head Office, Branch)"
                  value={newOfficeType}
                  onChange={(e) => setNewOfficeType(e.target.value)}
                  className="rounded-3 border-secondary-subtle"
                />
              </Col>
              <Col md={3}>
                <Button onClick={handleAddOfficeType} className="w-100 rounded-3 btn-dark d-flex align-items-center justify-content-center gap-2">
                  <Plus size={18} /> Add Office
                </Button>
              </Col>
            </Row>
          </Form>
          <Table responsive hover className="m-0 border rounded-3 overflow-hidden align-middle">
            <thead className="table-light text-secondary">
              <tr><th width="10%">#</th><th width="70%">OFFICE TYPE NAME</th><th width="20%" className="text-end">MANAGEMENT</th></tr>
            </thead>
            <tbody>
              {officeTypes.length > 0 ? officeTypes.map((type, index) => (
                <tr key={type._id || index}><td>{index + 1}</td><td className="fw-semibold">{type.name}</td><td className="text-end"><Button variant="link" className="text-danger p-0" onClick={() => handleDeleteOfficeType(type._id)}><X size={20} /></Button></td></tr>
              )) : (
                <tr><td colSpan="3" className="text-center py-5 text-muted small">No office types configured yet.</td></tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Circle Management Tab */}
      {activeTab === 'circles' && (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 className="fw-bold mb-4">Manage Districts (Circles)</h5>
          <div className="d-flex gap-2 mb-3">
            <Form.Control
              placeholder="Enter District Name (e.g. Fatehabad)"
              value={newCircleType}
              onChange={(e) => setNewCircleType(e.target.value)}
            />
            <Button onClick={handleAddCircleType} variant="dark">Add</Button>
          </div>
          <Table hover>
            <tbody>
              {circleTypes.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className="text-end">
                    <Button variant="link" className="text-danger" onClick={() => handleDeleteCircleType(c._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <style>{`
        .hover-bg-dark-light:hover { background-color: rgba(255,255,255,0.05); color: white !important; }
        .main-container { transition: all 0.3s ease; }
        @media (max-width: 991px) {
          .main-container { margin-left: 0 !important; }
        }
        .cursor-pointer { cursor: pointer; }
        .card { transition: transform 0.2s; }
        .card:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}