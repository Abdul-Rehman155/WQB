import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Table, Button, Form, Badge, Spinner, InputGroup, Container } from 'react-bootstrap';
import { Calendar, CheckCircle, XCircle, Clock, Users, Save, RefreshCw, Download, Upload, Search } from 'lucide-react';
import { getEmployees, getAttendanceByDate, markAttendance } from '../Service/api';
import { useTheme } from "../context/ThemeContext";

function Attendence() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [attendanceSheet, setAttendanceSheet] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const fileInputRef = useRef(null);

  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const empData = await getEmployees();
      const attendanceData = await getAttendanceByDate(selectedDate);
      
      const initialSheet = {};
      empData.forEach(emp => {
        const existing = Array.isArray(attendanceData)
          ? attendanceData.find((record) => String(record.employeeId) === String(emp._id))
          : null;

        if (existing) {
          initialSheet[emp._id] = {
            status: existing.status,
            checkIn: existing.checkIn || '--:--',
            checkOut: existing.checkOut || '--:--'
          };
        } else {
          initialSheet[emp._id] = {
            status: 'Present',
            checkIn: '09:30 AM',
            checkOut: '06:30 PM'
          };
        }
      });
      
      setEmployees(empData);
      setAttendanceSheet(initialSheet);
      calculateStats(initialSheet);
    } catch (error) {
      console.error("Error loading sheet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const calculateStats = (sheet) => {
    let p = 0, a = 0, l = 0;
    Object.values(sheet).forEach(rec => {
      if (rec.status === 'Present') p++;
      if (rec.status === 'Absent') a++;
      if (rec.status === 'Late') l++;
    });
    setStats({ present: p, absent: a, late: l });
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleExport = () => {
    if (employees.length === 0) return;
    const headers = ["Date,Employee Name,Employee ID,Status,Check In,Check Out"];
    const rows = employees.map(emp => {
      const rec = attendanceSheet[emp._id] || {};
      return `"${selectedDate}","${emp.name}","${emp._id}","${rec.status}","${rec.checkIn}","${rec.checkOut}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split("\n").slice(1); 
      const updatedSheet = { ...attendanceSheet };
      rows.forEach(row => {
        const columns = row.split(",");
        if (columns.length >= 4) {
          const empId = columns[2].replace(/"/g, "").trim();
          const status = columns[3].replace(/"/g, "").trim();
          const checkIn = columns[4]?.replace(/"/g, "").trim() || '09:30 AM';
          const checkOut = columns[5]?.replace(/"/g, "").trim() || '06:30 PM';
          if (updatedSheet[empId]) {
            updatedSheet[empId] = { status, checkIn, checkOut };
          }
        }
      });
      setAttendanceSheet(updatedSheet);
      calculateStats(updatedSheet);
      alert("CSV Data Imported to Sheet. Click 'Save Sheet' to finalize.");
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handleStatusChange = (empId, newStatus) => {
    const updatedSheet = {
      ...attendanceSheet,
      [empId]: {
        ...attendanceSheet[empId],
        status: newStatus,
        checkIn: newStatus === 'Absent' ? '--:--' : '09:30 AM',
        checkOut: newStatus === 'Absent' ? '--:--' : '06:30 PM'
      }
    };
    setAttendanceSheet(updatedSheet);
    calculateStats(updatedSheet);
  };

  const handleTimeChange = (empId, field, value) => {
    setAttendanceSheet({
      ...attendanceSheet,
      [empId]: { ...attendanceSheet[empId], [field]: value }
    });
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const saveOperations = Object.entries(attendanceSheet).map(([empId, record]) => {
        const employee = employees.find((item) => String(item._id) === String(empId));
        return markAttendance({
          employeeId: empId,
          employeeName: employee?.name || 'Unknown',
          date: selectedDate,
          status: record.status,
          checkIn: record.checkIn,
          checkOut: record.checkOut
        });
      });
      await Promise.all(saveOperations);
      alert(`🎉 Attendance for ${selectedDate} saved successfully!`);
      loadAttendanceData();
    } catch (error) {
      console.error('Attendance save failed:', error);
      alert('Attendance save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileImport} />
        
        <header className="d-flex justify-content-between align-items-center mb-4">
          <div className={`d-flex align-items-center gap-2 ${isDark ? 'text-light-emphasis' : 'text-muted'}`} style={{ fontSize: '0.875rem' }}>
            <Calendar size={16} />
            <span>Workforce / Daily Attendance Tracker</span>
          </div>
        </header>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className={`h3 fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>Attendance Management</h1>
            <p className="text-muted small m-0">Mark and manage daily workforce logs</p>
          </div>
          
          <div className="d-flex align-items-center flex-wrap gap-2">
            <InputGroup style={{ width: '220px' }} className="shadow-sm">
              <InputGroup.Text className={`${isDark ? 'bg-secondary border-secondary' : 'bg-white border-end-0'}`}>
                <Search size={15} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={`${isDark ? 'bg-secondary text-white border-secondary' : 'border-start-0 ps-0 rounded-end-3'}`}
                style={{ fontSize: '0.875rem' }}
              />
            </InputGroup>

            <Form.Control 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`shadow-sm rounded-3 ${isDark ? 'bg-secondary text-white border-secondary' : 'border-secondary-subtle'}`}
              style={{ width: '170px' }}
            />
            
            <Button variant={isDark ? "outline-light" : "white"} onClick={handleImportClick} className="border rounded-3 shadow-sm px-3 py-2 d-flex align-items-center gap-2">
              <Upload size={14} /> <span className="d-none d-md-inline">Import</span>
            </Button>

            <Button variant={isDark ? "outline-light" : "white"} onClick={handleExport} className="border rounded-3 shadow-sm px-3 py-2 d-flex align-items-center gap-2">
              <Download size={14} /> <span className="d-none d-md-inline">Export</span>
            </Button>

            <Button variant={isDark ? "outline-light" : "white"} onClick={loadAttendanceData} className="border rounded-3 shadow-sm px-3">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </Button>

            <Button 
              onClick={saveAttendance} 
              disabled={saving}
              className="rounded-3 shadow-sm px-4 d-flex align-items-center gap-2 text-white border-0" 
              style={{ backgroundColor: '#00A86B' }}
            >
              {saving ? <Spinner size="sm" /> : <><Save size={16} /> Save Sheet</>}
            </Button>
          </div>
        </div>

        <Row className="mb-4">
          {[
            { label: 'Total Strength', val: employees.length, icon: Users, color: 'primary' },
            { label: 'Present Today', val: stats.present, icon: CheckCircle, color: 'success' },
            { label: 'Absent Personnel', val: stats.absent, icon: XCircle, color: 'danger' },
            { label: 'Late Arrivals', val: stats.late, icon: Clock, color: 'warning' }
          ].map((item, idx) => (
            <Col key={idx} md={3} sm={6} className="mb-3">
              <Card className={`border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center gap-3 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
                <div className={`p-3 bg-${item.color}-subtle rounded-3 text-${item.color}`}><item.icon size={24} /></div>
                <div>
                  <h3 className="fw-bold m-0">{item.val}</h3>
                  <small className="text-muted">{item.label}</small>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          {loading ? (
            <div className="p-4 text-center text-muted">Loading attendance roster...</div>
          ) : (
            <Table responsive hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'table-dark' : 'table-light'}>
                <tr>
                  <th className="px-4 py-3 text-muted small fw-bold">EMPLOYEE</th>
                  <th className="py-3 text-muted small fw-bold">ROLE / JOB</th>
                  <th className="py-3 text-muted small fw-bold text-center">ATTENDANCE STATUS</th>
                  <th className="py-3 text-muted small fw-bold">CHECK IN</th>
                  <th className="py-3 text-muted small fw-bold">CHECK OUT</th>
                  <th className="px-4 py-3 text-muted small fw-bold text-end">INDICATOR</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No employees found.</td></tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const currentRecord = attendanceSheet[emp._id] || { status: 'Present', checkIn: '--:--', checkOut: '--:--' };
                    return (
                      <tr key={emp._id}>
                        <td className="px-4">
                          <div className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>{emp.name}</div>
                          <div className="text-muted small">{emp.department || "General"}</div>
                        </td>
                        <td className="text-secondary small fw-semibold">{emp.jobTitle}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            {['Present', 'Absent', 'Late'].map((st) => (
                              <Button
                                key={st} size="sm"
                                variant={currentRecord.status === st ? (st === 'Present' ? 'success' : st === 'Absent' ? 'danger' : 'warning') : (isDark ? 'outline-light' : 'light')}
                                onClick={() => handleStatusChange(emp._id, st)}
                                className="px-3 py-1 rounded-3 fw-medium transition-all"
                                style={{ fontSize: '0.8rem' }}
                              >
                                {st}
                              </Button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <Form.Control 
                            type="text" size="sm" disabled={currentRecord.status === 'Absent'}
                            value={currentRecord.checkIn}
                            onChange={(e) => handleTimeChange(emp._id, 'checkIn', e.target.value)}
                            className={`text-center border-0 rounded-3 font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'}`}
                            style={{ width: '90px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td>
                          <Form.Control 
                            type="text" size="sm" disabled={currentRecord.status === 'Absent'}
                            value={currentRecord.checkOut}
                            onChange={(e) => handleTimeChange(emp._id, 'checkOut', e.target.value)}
                            className={`text-center border-0 rounded-3 font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'}`}
                            style={{ width: '90px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td className="px-4 text-end">
                          <Badge bg={currentRecord.status === 'Present' ? 'success' : currentRecord.status === 'Absent' ? 'danger' : 'warning'} className="rounded-2 px-2 py-1">
                            {currentRecord.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </Card>
      </Container>

      <style>{`
        .page-layout {
          min-height: 100vh;
          transition: all 0.3s ease;
        }
        @media (min-width: 992px) {
          .page-layout {
            margin-left: 280px; /* Sidebar width matched */
            width: calc(100% - 280px); 
          }
        }
        @media (max-width: 991px) {
          .page-layout {
            margin-left: 0;
            width: 100%;
          }
        }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Attendence;