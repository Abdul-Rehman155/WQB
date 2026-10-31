import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Table, Button, Nav, Card, Form, Badge, InputGroup, Spinner, Image, Modal, ListGroup
} from 'react-bootstrap';
import { ShieldCheck, RefreshCcw, Check, X, User } from 'lucide-react';
import axios from 'axios';

const displayComponentName = (name) => String(name || '').replace(/^demo\s+/i, '');

const Payroll_D = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
  const [activeYear, setActiveYear] = useState(String(new Date().getFullYear()));
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewEmployeeId, setPreviewEmployeeId] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = ['2025', '2026', '2027'];

  const generatePayroll = async () => {
    try {
      const month = String(months.indexOf(activeMonth) + 1).padStart(2, '0');
      await axios.post('http://localhost:5000/api/payroll/generate', {
        month,
        year: activeYear,
      });
      alert(`${activeMonth} ${activeYear} payroll generated successfully.`);
      await loadPayrollData();
    } catch (error) {
      alert(error.response?.data?.message || 'Payroll generation failed.');
    }
  };

  const openPreview = async (employeeId) => {
    setPreviewLoading(true);
    setPreviewEmployeeId(employeeId);
    try {
      const month = String(months.indexOf(activeMonth) + 1).padStart(2, '0');
      const response = await axios.get(
        `http://localhost:5000/api/payroll/preview/${employeeId}/${month}/${activeYear}`
      );
      setPreview(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Payslip preview failed.');
      setPreviewEmployeeId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmPreviewAndGenerate = async () => {
    if (!previewEmployeeId) return;
    try {
      const month = String(months.indexOf(activeMonth) + 1).padStart(2, '0');
      await axios.post('http://localhost:5000/api/payroll/generate', {
        month,
        year: activeYear,
        employeeId: previewEmployeeId,
      });
      alert(`${preview?.employeeName || 'Employee'} payslip generated successfully.`);
      setPreview(null);
      setPreviewEmployeeId(null);
      await loadPayrollData();
    } catch (error) {
      alert(error.response?.data?.message || 'Payroll generation failed.');
    }
  };

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const monthIndex = months.indexOf(activeMonth) + 1;
      const yearMonth = `${activeYear}-${String(monthIndex).padStart(2, '0')}`;

      // API calls to fetch everything
      const [employeeRes, payrollRes, attendanceRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employee'),
        axios.get(`http://localhost:5000/api/payroll/${encodeURIComponent(`${activeMonth} ${activeYear}`)}`),
        axios.get(`http://localhost:5000/api/attendance/month/${yearMonth}`)
      ]);

      const employeeList = Array.isArray(employeeRes.data) ? employeeRes.data : [];
      const payrollList = Array.isArray(payrollRes.data) ? payrollRes.data : [];
      const attendanceList = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      
      const payrollMap = new Map(payrollList.map(s => [String(s.employeeId?._id || s.employeeId), s]));
      const attendanceMap = new Map();
      
      attendanceList.forEach((r) => {
        const key = String(r.employeeId?._id || r.employeeId || '');
        if (key) {
          if (!attendanceMap.has(key)) attendanceMap.set(key, []);
          attendanceMap.get(key).push(r);
        }
      });

      const rows = employeeList
        .filter((emp) => emp.status !== 'Inactive')
        .map((emp) => {
          const slip = payrollMap.get(String(emp._id));
          const attendance = attendanceMap.get(String(emp._id)) || [];
          
          const absentCount = attendance.filter(r => r.status === 'Absent').length || Number(slip?.absentDays || 0);
          const presentCount = attendance.filter(r => ['Present', 'Late'].includes(r.status)).length || Number(slip?.presentDays || 0);
          const allowances = Number(slip?.earnings?.reduce((sum, line) => sum + Number(line.amount || 0), 0) || 0);

          return {
            id: emp._id,
            name: emp.name,
            image: emp.image, // DB se real image path
            dbBaseSalary: Number(emp.baseSalary || 0),
            presentDays: presentCount,
            absentDays: absentCount,
            allowances,
            netSalary: Number(slip?.netSalary || 0),
            totalDeductions: Number(slip?.totalDeductions || 0),
            payrollId: slip?._id || null,
            status: slip?.status || 'Generated'
          };
        });

      setEmployees(rows);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayrollData(); }, [activeMonth, activeYear]);

  // GRANT Action: Salary DB mein save hogi aur Status "Paid" hoga
  const handlePayrollAction = async (empId, payrollId, action) => {
    try {
      if (!payrollId) {
        alert('Generate this month payroll before approving salary.');
        return;
      }

      await axios.patch(`http://localhost:5000/api/payroll/status/${payrollId}`, {
        status: action === 'grant' ? 'Paid' : 'Generated'
      });

      alert('Salary Approved & Records Updated!');
      loadPayrollData();
    } catch (error) {
      console.error('Action Error:', error);
      alert('Failed to process payroll');
    }
  };

  return (
    <Container fluid className="payroll-page-layout p-0 bg-light min-vh-100">
      {/* HEADER SECTION */}
      <div className="bg-dark text-white p-4 shadow-sm mx-3 mt-3 rounded-top" style={{ backgroundColor: '#1f2937 !important' }}>
        <Row className="align-items-center">
          <Col xs="auto">
            <div className="bg-success p-2 rounded-3 text-white d-flex align-items-center">
              <ShieldCheck size={30} />
            </div>
          </Col>
          <Col>
            <h2 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>HWB Control Room</h2>
            <small className="text-success fw-bold">Analytics & Real-time Salary Management</small>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Form.Select size="sm" value={activeMonth} onChange={(e) => setActiveMonth(e.target.value)} style={{ width: '100px' }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </Form.Select>
            <Form.Select size="sm" value={activeYear} onChange={(e) => setActiveYear(e.target.value)} style={{ width: '90px' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Form.Select>
            <Button variant="success" size="sm" onClick={generatePayroll}>Generate All Payroll</Button>
            <Button variant="outline-light" size="sm" onClick={loadPayrollData}><RefreshCcw size={16} /> Sync</Button>
          </Col>
        </Row>
      </div>

      <div className="bg-white mx-3 shadow-sm border-bottom py-2">
        <Nav variant="pills" activeKey="payroll" className="px-3">
          <Nav.Item><Nav.Link eventKey="payroll" className="bg-success text-white fw-bold px-4">Live Payroll Dashboard</Nav.Link></Nav.Item>
        </Nav>
      </div>

      <Card className="mx-3 mt-4 border-0 shadow-sm rounded-bottom">
        <Card.Body className="p-4">
          <h5 className="fw-bold text-dark mb-4 text-uppercase" style={{ fontSize: '14px' }}>Monthly Disbursement Authorization</h5>

          {loading ? <div className="text-center py-5"><Spinner animation="border" variant="success" /></div> : (
            <Table responsive hover className="align-middle">
              <thead className="bg-light text-secondary text-uppercase" style={{ fontSize: '11px' }}>
                <tr>
                  <th className="px-3 py-3">Employee Details</th>
                  <th style={{ width: '180px' }}>Base Salary (Edit)</th>
                  <th className="text-center">Attendence (P/A)</th>
                  <th className="text-primary text-center">Allowances (+)</th>
                  <th className="text-danger text-center">Deductions (-)</th>
                  <th className="text-success text-center">Final Net Payable</th>
                  <th className="text-end px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const totalDeduction = emp.totalDeductions;
                  const netSalary = emp.netSalary;
                  
                  // Real Image URL
                  const imageUrl = emp.image ? `http://localhost:5000/${emp.image.replace(/\\/g, '/')}` : null;

                  return (
                    <tr key={emp.id} className="border-bottom border-light">
                      <td className="py-4 px-3">
                        <div className="d-flex align-items-center gap-3">
                          {/* Profile Photo Display */}
                          <div style={{ width: '45px', height: '45px', overflow: 'hidden' }} className="rounded-circle border">
                            {imageUrl ? (
                              <Image src={imageUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                                <User size={20} className="text-muted" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>{emp.name}</div>
                            <small className="text-muted font-monospace">ID: {emp.id.slice(-6)}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <InputGroup size="sm">
                          <InputGroup.Text className="bg-light fw-bold text-muted">₹</InputGroup.Text>
                          <Form.Control
                            type="number"
                            value={emp.dbBaseSalary}
                            readOnly
                            className="fw-bold border-success"
                            style={{ fontSize: '14px' }}
                          />
                        </InputGroup>
                      </td>

                      <td className="text-center">
                        <Badge bg="success" className="me-1 px-2 py-1 shadow-sm">{emp.presentDays}P</Badge>
                        <Badge bg="danger" className="px-2 py-1 shadow-sm">{emp.absentDays}A</Badge>
                      </td>

                      <td className="fw-bold text-primary text-center">+₹{emp.allowances}</td>

                      <td className="text-center">
                        <span className="fw-bold text-danger">-₹{totalDeduction}</span>
                        <div style={{ fontSize: '9px' }} className="text-muted text-uppercase fw-bold">Leaves/Absent</div>
                      </td>

                      <td className="text-center">
                        <div className="bg-success bg-opacity-10 text-success px-2 py-2 rounded-3 border border-success border-opacity-25 shadow-sm">
                          <span className="fw-black fs-5">₹{netSalary.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-2">
                          <Button 
                            variant="outline-primary"
                            size="sm"
                            className="rounded-3"
                            onClick={() => openPreview(emp.id)}
                          >
                            Preview
                          </Button>
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="fw-bold px-3 py-2 rounded-3 shadow-sm border-0" 
                            style={{ backgroundColor: '#00A86B' }}
                            onClick={() => handlePayrollAction(emp.id, emp.payrollId, 'grant')}
                            disabled={emp.status === 'Paid'}
                          >
                            <Check size={16} className="me-1" /> {emp.status === 'Paid' ? 'Authorized' : 'Grant'}
                          </Button>
                          <Button variant="outline-danger" size="sm" className="rounded-3"><X size={16} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
        <Card.Footer className="text-center py-3 text-muted border-0 bg-white" style={{ fontSize: '10px', letterSpacing: '2px' }}>
          HWB ENCRYPTED PAYROLL INTERFACE • AUTHORIZED ACCESS ONLY
        </Card.Footer>
      </Card>
      <Modal show={Boolean(preview || previewLoading)} onHide={() => { setPreview(null); setPreviewEmployeeId(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Payslip Preview — {activeMonth} {activeYear}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewLoading ? <div className="text-center py-4"><Spinner animation="border" variant="success" /></div> : preview && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">{preview.employeeName}</h5>
                  <small className="text-muted">Review all values before final generation</small>
                </div>
                <Badge bg="secondary">{preview.month}</Badge>
              </div>
              <Row className="g-3 mb-4">
                <Col md={3}><Card body className="text-center"><small className="text-muted">Basic</small><div className="fw-bold">₹{Number(preview.baseSalary).toLocaleString()}</div></Card></Col>
                <Col md={3}><Card body className="text-center"><small className="text-muted">Present / Absent</small><div className="fw-bold">{preview.presentDays} / {preview.absentDays}</div></Card></Col>
                <Col md={3}><Card body className="text-center"><small className="text-muted">Gross</small><div className="fw-bold text-success">₹{Number(preview.grossSalary).toLocaleString()}</div></Card></Col>
                <Col md={3}><Card body className="text-center"><small className="text-muted">Net Pay</small><div className="fw-bold text-primary">₹{Number(preview.netSalary).toLocaleString()}</div></Card></Col>
              </Row>
              <Row>
                <Col md={6}>
                  <h6 className="text-success fw-bold">EARNINGS</h6>
                  <ListGroup className="mb-3">
                    <ListGroup.Item className="d-flex justify-content-between"><span>Basic salary</span><strong>₹{Number(preview.baseSalary).toLocaleString()}</strong></ListGroup.Item>
                    {(preview.earnings || []).map((line, index) => <ListGroup.Item key={`earning-${index}`} className="d-flex justify-content-between"><span>{displayComponentName(line.name)}</span><strong className="text-success">+ ₹{Number(line.amount).toLocaleString()}</strong></ListGroup.Item>)}
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h6 className="text-danger fw-bold">DEDUCTIONS</h6>
                  <ListGroup>
                    {(preview.deductionLines || []).map((line, index) => <ListGroup.Item key={`deduction-${index}`} className="d-flex justify-content-between"><span>{displayComponentName(line.name)}</span><strong className="text-danger">- ₹{Number(line.amount).toLocaleString()}</strong></ListGroup.Item>)}
                  </ListGroup>
                </Col>
              </Row>
              <AlertPreviewNote preview={preview} />
            </>
          )}
        </Modal.Body>
        {preview && <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => { setPreview(null); setPreviewEmployeeId(null); }}>Cancel</Button>
          <Button variant="success" onClick={confirmPreviewAndGenerate}>Confirm & Generate Payslip</Button>
        </Modal.Footer>}
      </Modal>
      <style>{`
        .payroll-page-layout {
          min-height: 100vh;
        }
        @media (min-width: 992px) {
          .payroll-page-layout {
            margin-left: 280px;
            width: calc(100% - 280px);
          }
        }
        @media (max-width: 991px) {
          .payroll-page-layout {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </Container>
  );
};

const AlertPreviewNote = ({ preview }) => (
  <div className="mt-3 p-3 rounded bg-light small">
    <strong>Review:</strong> Loan repayment ₹{Number(preview.loanRepayment || 0).toLocaleString()} and arrears ₹{Number(preview.arrears || 0).toLocaleString()} are included only when their records are active/approved.
    <div className="text-muted mt-1">Holiday entries are not included because the current attendance model does not store Holiday status.</div>
  </div>
);

export default Payroll_D;