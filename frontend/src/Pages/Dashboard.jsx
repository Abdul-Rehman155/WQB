import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, InputGroup, Form, Modal, Table, Stack, Container } from 'react-bootstrap';
import { 
  LayoutDashboard, Users, Building2, Clock, CalendarDays, 
  Briefcase, RefreshCw, Download, Upload, Search, FileSpreadsheet, X 
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import axios from 'axios';
import { getDashboardStats } from '../Service/api'; 
import { useTheme } from '../context/ThemeContext';
import SalaryComponents from '../Payroll_D/SalaryComponent';

const API_BASE = "http://localhost:5000/api";

const getLocalDateString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export default function Dashboard() {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModule, setActiveModule] = useState('overview');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (storedUser.role || 'user').toLowerCase();
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [openInExcel, setOpenInExcel] = useState(false);
  const [excelData, setExcelData] = useState([]); 
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (location.pathname === '/payroll/components') {
      setActiveModule('salary-components');
    } else if (location.pathname === '/' || location.pathname === '/dashboard') {
      setActiveModule('overview');
    }
  }, [location]);

  // --- REAL BACKEND DATA FETCHING LOGIC ---
  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Service API se initial stats lene ki koshish karein
      let initialData = {};
      try {
        initialData = await getDashboardStats() || {};
      } catch (e) {
        console.warn("getDashboardStats fallback:", e);
      }

      // 2. Real Backend APIs ko call karein (parallel requests)
      const [
        empRes, 
        branchRes, 
        attRes, 
        leaveRes, 
        jobRes
      ] = await Promise.allSettled([
        axios.get(`${API_BASE}/employees`).catch(() => axios.get(`${API_BASE}/employee`)),
        axios.get(`${API_BASE}/branches`).catch(() => axios.get(`${API_BASE}/office`)).catch(() => axios.get(`${API_BASE}/admin/office`)),
        axios.get(`${API_BASE}/attendance?date=${getLocalDateString()}`).catch(() => axios.get(`${API_BASE}/attendance/today`)),
        axios.get(`${API_BASE}/leaves`).catch(() => axios.get(`${API_BASE}/leave`)),
        axios.get(`${API_BASE}/jobs`).catch(() => axios.get(`${API_BASE}/admin/jobs`))
      ]);

      // --- Total Employees Calculation ---
      let empCount = 0;
      if (empRes.status === "fulfilled" && empRes.value?.data) {
        const data = empRes.value.data;
        empCount = Array.isArray(data) ? data.length : (data.count || data.total || 0);
      } else if (initialData?.totalEmployees?.value) {
        empCount = initialData.totalEmployees.value;
      }

      // --- Branches Calculation ---
      let branchCount = 0;
      if (branchRes.status === "fulfilled" && branchRes.value?.data) {
        const data = branchRes.value.data;
        branchCount = Array.isArray(data) ? data.length : (data.count || data.total || 0);
      } else if (initialData?.branches?.value) {
        branchCount = initialData.branches.value;
      }

      // --- Attendance Rate & Today's Present Calculation ---
      let presentCount = 0;
      let attendanceRate = 0;
      if (attRes.status === "fulfilled" && attRes.value?.data) {
        const data = attRes.value.data;
        const records = Array.isArray(data) ? data : (data.attendance || data.records || []);
        const presentEmployeeIds = new Set(
          records
            .filter(r => ["present", "late"].includes((r.status || "").toLowerCase()))
            .map(r => String(r.employeeId || r.employeeName))
        );
        presentCount = presentEmployeeIds.size;
        attendanceRate = empCount > 0
          ? Math.min(100, Math.round((presentCount / empCount) * 100))
          : 0;
      } else if (initialData?.attendanceRate?.value) {
        attendanceRate = initialData.attendanceRate.value;
      }

      // --- Pending Leaves Calculation ---
      let pendingLeavesCount = 0;
      if (leaveRes.status === "fulfilled" && leaveRes.value?.data) {
        const data = leaveRes.value.data;
        const records = Array.isArray(data) ? data : (data.leaves || []);
        pendingLeavesCount = records.filter(l => (l.status || "").toLowerCase() === "pending").length;
      } else if (initialData?.pendingLeaves?.value) {
        pendingLeavesCount = initialData.pendingLeaves.value;
      }

      // --- Active Jobs Calculation ---
      let activeJobsCount = 0;
      if (jobRes.status === "fulfilled" && jobRes.value?.data) {
        const data = jobRes.value.data;
        const records = Array.isArray(data) ? data : (data.jobs || []);
        activeJobsCount = records.filter(j => (j.status || "").toLowerCase() === "active").length || records.length;
      } else if (initialData?.activeJobs?.value) {
        activeJobsCount = initialData.activeJobs.value;
      }

      // Final real state set karein
      setStats({
        branches: {
          value: String(branchCount),
          subtext: `${branchCount} Active Locations`
        },
        attendanceRate: {
          value: typeof attendanceRate === 'number' ? `${attendanceRate}%` : `${attendanceRate}`,
          subtext: `${presentCount} Present Today`
        },
        pendingLeaves: {
          value: String(pendingLeavesCount),
          subtext: "Requires Approval"
        },
        activeJobs: {
          value: String(activeJobsCount),
          subtext: "Active Openings"
        },
        totalEmployees: {
          value: String(empCount),
          subtext: "Total Registered"
        }
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'salary-components':
        return <div className={`${isDark ? 'bg-secondary' : 'bg-white'} rounded-4 shadow-sm p-3`}><SalaryComponents /></div>;
      default:
        // Total Candidates hatakar Total Employees ko wahan set kiya gaya hai
        const dashboardCards = [
          { title: "Branches", val: stats?.branches, icon: Building2, color: '#00A86B', bg: '#E6F7F0' },
          { title: "Attendance Rate", val: stats?.attendanceRate, icon: Clock, color: '#722ED1', bg: '#F9F0FF' },
          { title: "Pending Leaves", val: stats?.pendingLeaves, icon: CalendarDays, color: '#FAAD14', bg: '#FFFBE6' },
          { title: "Active Jobs", val: stats?.activeJobs, icon: Briefcase, color: '#D46B08', bg: '#FFF7E6' },
          { title: "Total Employees", val: stats?.totalEmployees, icon: Users, color: '#1890FF', bg: '#E6F4FF' },
        ];

        const filteredCards = dashboardCards.filter(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <Row className="g-4">
            {filteredCards.map((item, idx) => (
              <Col key={idx} xs={12} sm={6} md={4}>
                <Card className={`border-0 shadow-sm p-3 rounded-4 h-100 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
                  <Card.Body className="d-flex justify-content-between align-items-start p-2">
                    <div>
                      <Card.Title className="text-muted mb-1 small fw-bold">{item.title}</Card.Title>
                      <h2 className="fw-bold m-0">{item.val?.value || '0'}</h2>
                      <p className="fw-semibold m-0 mt-2 small" style={{ color: item.color }}>{item.val?.subtext || ''}</p>
                    </div>
                    <div className="p-3 rounded-circle d-flex" style={{ backgroundColor: item.bg, color: item.color }}>
                      <item.icon size={22} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        );
    }
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      if (openInExcel) { setExcelData(data); } else { alert("Imported!"); }
    };
    reader.readAsBinaryString(selectedFile);
    setShowImportModal(false);
  };

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="p-4">
        <header className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2 text-muted small">
                  <LayoutDashboard size={16} />
                  <span>Dashboard / {activeModule === 'salary-components' ? 'Salary Components' : 'Overview'}</span>
              </div>
              <InputGroup className={`ms-3 border rounded-3 overflow-hidden shadow-sm ${isDark ? 'bg-secondary border-secondary' : 'bg-white'}`} style={{ width: '300px' }}>
                  <InputGroup.Text className="bg-transparent border-0"><Search size={16} className="text-muted"/></InputGroup.Text>
                  <Form.Control 
                      placeholder="Search metrics..." 
                      className={`border-0 shadow-none bg-transparent ${isDark ? 'text-white' : ''}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </InputGroup>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button variant={isDark ? 'outline-light' : 'outline-secondary'} onClick={() => alert("Exporting...")}><Download size={16} /> Export</Button>
            <Button variant="success" onClick={() => setShowImportModal(true)}><Upload size={16} /> Import</Button>
          </div>
        </header>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 fw-bold m-0">{role === 'admin' ? 'HRM Analytics' : 'User Dashboard'}</h1>
          <Button variant={isDark ? "outline-light" : "white"} onClick={fetchStats} className="border rounded-3 shadow-sm px-3 py-2 d-flex align-items-center gap-2 bg-white text-dark">
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} /> Refresh
          </Button>
        </div>

        {excelData.length > 0 && (
          <Card className="border-0 shadow-lg rounded-4 mb-5 overflow-hidden">
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center p-3">
              <div className="fw-bold d-flex align-items-center gap-2"><FileSpreadsheet size={20}/> Excel Data Preview</div>
              <Button variant="link" className="text-white p-0" onClick={() => setExcelData([])}><X size={20}/></Button>
            </Card.Header>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <Table responsive striped hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
                <thead><tr>{Object.keys(excelData[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead>
                <tbody>{excelData.map((row, index) => (<tr key={index}>{Object.values(row).map((val, i) => <td key={i}>{val}</td>)}</tr>))}</tbody>
              </Table>
            </div>
            <Card.Footer className="bg-white text-end p-3"><Button variant="success" onClick={() => setExcelData([])}>Save to Database</Button></Card.Footer>
          </Card>
        )}

        {loading && !stats ? (
          <div className="text-center p-5"><Spinner animation="border" variant="success" /></div>
        ) : (
          <div>{renderModuleContent()}</div>
        )}

        <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
          <Modal.Header closeButton><Modal.Title className="fw-bold"><FileSpreadsheet className="text-success" /> Import Data</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleImportSubmit}>
              <Form.Group className="mb-4"><Form.Control type="file" onChange={handleFileChange} required /></Form.Group>
              <Form.Check type="switch" label="Open in Dashboard Excel View?" checked={openInExcel} onChange={(e) => setOpenInExcel(e.target.checked)} className="mb-4" />
              <Stack direction="horizontal" gap={2}><Button variant="light" onClick={() => setShowImportModal(false)} className="w-100">Cancel</Button><Button variant="success" type="submit" className="w-100">Import</Button></Stack>
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
          .page-layout {
            margin-left: 0;
            width: 100%;
          }
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}