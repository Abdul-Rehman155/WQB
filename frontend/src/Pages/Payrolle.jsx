import React, { useState, useEffect, useRef } from 'react'; 
import { Table, Button, Badge, Card, Form, InputGroup, Offcanvas, Spinner, Image, Container } from 'react-bootstrap';
import { Search, Eye, Download, User, LogOut } from 'lucide-react'; 
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "../context/ThemeContext";

function Payroll() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMonth, setActiveMonth] = useState('Jul');
  const [activeYear, setActiveYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  
  const slipRef = useRef(null); 
  const navigate = useNavigate(); 
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); 
    navigate('/login');
  };

  const handleDownloadPDF = async () => {
    const element = slipRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true, 
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${selectedSlip.employeeName}_${activeMonth}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF");
    }
  };

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const monthYear = `${activeMonth} ${activeYear}`;
      const response = await axios.get(`http://localhost:5000/api/payroll/${encodeURIComponent(monthYear)}`);
      setPayslips(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [activeMonth, activeYear]);

  const filteredSlips = payslips.filter((slip) => {
    const name = (slip.employeeName || '').toLowerCase();
    const empId = (slip.employeeId?._id || '').toString().toLowerCase();
    const dept = (slip.employeeId?.department || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || empId.includes(search) || dept.includes(search);
  });

  const handleView = (slip) => {
    setSelectedSlip(slip);
    setShowDetail(true);
  };

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        {/* Header with Logout */}
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <h2 className={`fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>Payslips</h2>
          <Button variant="danger" onClick={handleLogout} className="d-flex align-items-center gap-2 shadow-sm rounded-3">
              <LogOut size={18} /> Logout
          </Button>
        </div>

        {/* Month Selector */}
        <Card className={`border-0 shadow-sm rounded-4 mb-4 p-2 overflow-auto ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          <div className="d-flex justify-content-between min-vw-50">
            {months.map((m) => (
              <Button
                key={m}
                onClick={() => setActiveMonth(m)}
                variant={activeMonth === m ? "success" : "white"}
                className={`px-4 py-2 border-0 rounded-3 d-flex flex-column align-items-center ${activeMonth === m ? '' : (isDark ? 'text-light-emphasis' : 'text-muted')}`}
                style={activeMonth === m ? { backgroundColor: '#00A86B', minWidth: '85px' } : { minWidth: '85px', backgroundColor: 'transparent' }}
              >
                <span className="fw-bold" style={{ fontSize: '15px' }}>{m}</span>
                <span style={{ fontSize: '10px' }}>{activeMonth === m ? activeYear : ''}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Control Bar */}
        <Card className={`border-0 shadow-sm rounded-4 mb-4 p-3 ${isDark ? 'bg-secondary border-secondary' : 'bg-white'}`}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <InputGroup style={{ width: '320px' }} className={`shadow-sm border rounded-3 overflow-hidden ${isDark ? 'border-secondary' : ''}`}>
              <InputGroup.Text className={`${isDark ? 'bg-dark border-0 text-muted' : 'bg-white border-0 text-muted'}`}><Search size={18} /></InputGroup.Text>
              <Form.Control
                placeholder="Search name, ID or department..."
                className={`border-0 shadow-none ${isDark ? 'bg-dark text-white' : ''}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
        </Card>

        {/* Table */}
        <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          {loading ? (
            <div className="p-5 text-center"><Spinner variant="success" /></div>
          ) : (
            <Table responsive hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'table-dark' : 'table-light'}>
                <tr style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                  <th className="px-4 py-3">#</th>
                  <th>Employee Details</th>
                  <th>Pay Date</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlips.map((slip, idx) => {
                  const imageUrl = slip.employeeId?.image ? `http://localhost:5000/${slip.employeeId.image}` : null;
                  return (
                    <tr key={slip._id} style={{ fontSize: '14px' }}>
                      <td className="px-4 text-secondary">{idx + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div style={{ width: '40px', height: '40px' }} className="rounded-circle overflow-hidden border">
                            {imageUrl ? <img src={imageUrl} alt="emp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="bg-light w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-dark">{(slip.employeeName || 'E').charAt(0)}</div>}
                          </div>
                          <div>
                            <div className="fw-bold">{slip.employeeName}</div>
                            <small className="text-muted">{slip.employeeId?.department}</small>
                          </div>
                        </div>
                      </td>
                      <td>{slip.payDate}</td>
                      <td className="fw-bold">₹{Number(slip.netSalary).toLocaleString()}</td>
                      <td><Badge bg="success-subtle" className="text-success">{slip.status}</Badge></td>
                      <td className="text-end px-4">
                        <Button variant="link" className="text-success p-0" onClick={() => handleView(slip)}><Eye size={20} /></Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Side Details Offcanvas */}
        <Offcanvas show={showDetail} onHide={() => setShowDetail(false)} placement="end" style={{ width: '480px' }} className={isDark ? 'bg-dark text-white' : ''}>
          <Offcanvas.Header closeButton className={`border-bottom ${isDark ? 'bg-secondary' : 'bg-light'}`}>
            <Offcanvas.Title className="fw-bold">Payslip Breakdown</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column h-100">
            {selectedSlip && (
              <>
                <div ref={slipRef} className={`p-4 border mb-4 rounded-3 shadow-sm ${isDark ? 'bg-secondary border-secondary' : 'bg-white'}`}>
                  <div className="text-center mb-4 border-bottom pb-3">
                    <h4 className={`fw-bold mb-1 ${isDark ? 'text-white' : 'text-dark'}`}>HWB INFOTECH PVT LTD</h4>
                    <small className="text-muted text-uppercase fw-bold" style={{ letterSpacing: '2px' }}>Salary Slip - {activeMonth} {activeYear}</small>
                  </div>

                  <div className="text-center mb-4">
                    {selectedSlip.employeeId?.image ? (
                      <Image src={`http://localhost:5000/${selectedSlip.employeeId.image}`} roundedCircle className="border mb-3 shadow-sm" style={{ width: '85px', height: '85px', objectFit: 'cover' }} />
                    ) : (
                      <div className="bg-light rounded-circle d-inline-flex p-3 mb-3 border"><User size={40} className="text-success" /></div>
                    )}
                    <h5 className={`fw-bold mb-0 ${isDark ? 'text-white' : ''}`}>{selectedSlip.employeeName}</h5>
                    <div className="text-success small fw-bold">{selectedSlip.employeeId?.jobTitle}</div>
                    <small className="text-muted">Emp ID: {selectedSlip.employeeId?._id?.slice(-8)}</small>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-success border-bottom pb-2">EARNINGS</h6>
                    <div className="d-flex justify-content-between small mb-2"><span>Basic Salary</span><span className="fw-bold">₹{Number(selectedSlip.baseSalary).toLocaleString()}</span></div>
                    <div className="d-flex justify-content-between small mb-2"><span>Allowances</span><span className="fw-bold text-success">+ ₹{((selectedSlip.allowances?.hra || 0) + (selectedSlip.allowances?.travel || 0)).toLocaleString()}</span></div>
                    
                    <h6 className="fw-bold text-danger border-bottom pb-2 mt-4">DEDUCTIONS</h6>
                    <div className="d-flex justify-content-between small mb-2"><span>Leaves ({selectedSlip.absentDays} Days)</span><span className="fw-bold text-danger">- ₹{Number(selectedSlip.deductions?.leaveDeduction).toLocaleString()}</span></div>
                    <div className="d-flex justify-content-between small mb-2"><span>Tax & PF</span><span className="fw-bold text-danger">- ₹{(Number(selectedSlip.deductions?.tax) + Number(selectedSlip.deductions?.pf)).toLocaleString()}</span></div>
                  </div>

                  <div className="bg-dark text-white p-3 rounded-3 text-center shadow-sm">
                    <small className="text-white-50 text-uppercase fw-bold">Net Monthly Pay</small>
                    <h3 className="fw-bold mb-0">₹{Number(selectedSlip.netSalary).toLocaleString()}</h3>
                  </div>
                </div>

                <div className="mt-auto">
                  <Button 
                    variant="success" 
                    onClick={handleDownloadPDF} 
                    className="w-100 py-3 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow fw-bold border-0" 
                    style={{ backgroundColor: '#00A86B' }}
                  >
                    <Download size={20} /> Download Official Payslip
                  </Button>
                </div>
              </>
            )}
          </Offcanvas.Body>
        </Offcanvas>
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
      `}</style>
    </div>
  );
}

export default Payroll;