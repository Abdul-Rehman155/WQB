import React from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { 
  ArrowLeft, User, Briefcase, Home, Landmark, FileText, Download, 
  Eye, GraduationCap, Mail, Phone, MapPin, Calendar, DollarSign, 
  ShieldCheck, Printer, Building2, CreditCard
} from 'lucide-react';
import { getImageUrl } from '../Service/api';
import { useTheme } from '../context/ThemeContext';

function EmployeeDetail({ employee, onBack }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!employee) {
    return (
      <div className="p-5 text-center text-muted">
        <h5>No employee selected.</h5>
        <Button variant="outline-success" onClick={onBack} className="mt-2">Back to List</Button>
      </div>
    );
  }

  // File link generator
  const getFileLink = (path) => {
    if (!path) return null;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  };

  const imageUrl = getImageUrl(employee.image);
  const displayId = employee.employeeId || employee.empId || (employee._id ? `EMP-${employee._id.slice(-5).toUpperCase()}` : 'EMP-001');

  // Joining date formatting
  const formattedJoiningDate = employee.joiningDate 
    ? new Date(employee.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  // Calculate work tenure
  const calculateTenure = (dateStr) => {
    if (!dateStr) return 'N/A';
    const start = new Date(dateStr);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths <= 0) return 'Joined recently';
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0) return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const tenureText = calculateTenure(employee.joiningDate);
  const annualSalary = employee.baseSalary ? (Number(employee.baseSalary) * 12).toLocaleString('en-IN') : 'N/A';

  return (
    <div className="w-100">
      {/* Top Action Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Button 
            variant={isDark ? "outline-light" : "light"} 
            onClick={onBack} 
            className="rounded-3 shadow-sm btn-sm border d-flex align-items-center gap-2 px-3 py-2"
          >
            <ArrowLeft size={16} /> Back to List
          </Button>
          <div>
            <h3 className={`h4 fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>Employee Profile</h3>
            <span className="text-muted small">Workforce / Employees / {employee.name}</span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button 
            variant={isDark ? "outline-light" : "outline-secondary"} 
            size="sm" 
            onClick={() => window.print()}
            className="rounded-3 d-flex align-items-center gap-2 px-3"
          >
            <Printer size={15} /> Print Profile
          </Button>
          <Badge 
            pill 
            className="d-flex align-items-center px-3 py-2" 
            style={{ 
              backgroundColor: employee.status === 'Active' ? '#E6F7F0' : '#FDE8E8', 
              color: employee.status === 'Active' ? '#00A86B' : '#DC2626',
              fontSize: '0.85rem'
            }}
          >
            ● {employee.status || 'Active'}
          </Badge>
        </div>
      </div>

      {/* --- HERO HEADER PROFILE BANNER --- */}
      <Card className={`border-0 shadow-sm rounded-4 p-4 mb-4 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
        <Row className="align-items-center g-4">
          <Col md="auto" className="text-center">
            <div 
              className="rounded-circle overflow-hidden mx-auto shadow-sm position-relative" 
              style={{ width: '110px', height: '110px', border: '3px solid #00A86B' }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                  <User size={55} className="text-muted" />
                </div>
              )}
            </div>
          </Col>

          <Col md>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h2 className="h4 fw-bold m-0">{employee.name}</h2>
              <Badge bg="light" text="primary" className="border fw-semibold px-2 py-1">
                {displayId}
              </Badge>
              <Badge bg="info" className="text-white px-2 py-1">{employee.gender || 'Male'}</Badge>
            </div>
            
            <p className="text-muted mb-2 fw-medium">
              {employee.department ? `${employee.department} • ` : ''}{employee.jobTitle || 'Team Member'}
            </p>

            <div className="d-flex flex-wrap gap-3 text-secondary small">
              {employee.email && (
                <a href={`mailto:${employee.email}`} className="text-decoration-none text-muted d-flex align-items-center gap-1">
                  <Mail size={14} className="text-success" /> {employee.email}
                </a>
              )}
              {employee.phone && (
                <a href={`tel:${employee.phone}`} className="text-decoration-none text-muted d-flex align-items-center gap-1">
                  <Phone size={14} className="text-success" /> {employee.phone}
                </a>
              )}
              {employee.circle && (
                <span className="d-flex align-items-center gap-1 text-muted">
                  <MapPin size={14} className="text-success" /> {employee.circle}
                </span>
              )}
            </div>
          </Col>

          {/* Quick Stats Pill on Right */}
          <Col lg={4} className="border-start-lg ps-lg-4">
            <div className="row g-2">
              <div className="col-6">
                <div className={`p-2 rounded-3 ${isDark ? 'bg-dark' : 'bg-light'}`}>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>MONTHLY SALARY</small>
                  <span className="fw-bold text-success fs-6">₹{employee.baseSalary?.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
              <div className="col-6">
                <div className={`p-2 rounded-3 ${isDark ? 'bg-dark' : 'bg-light'}`}>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>ANNUAL CTC</small>
                  <span className="fw-bold fs-6">₹{annualSalary}</span>
                </div>
              </div>
              <div className="col-6">
                <div className={`p-2 rounded-3 ${isDark ? 'bg-dark' : 'bg-light'}`}>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>EMPLOYMENT TYPE</small>
                  <span className="fw-semibold small">{employee.employeeType || 'Full Time'}</span>
                </div>
              </div>
              <div className="col-6">
                <div className={`p-2 rounded-3 ${isDark ? 'bg-dark' : 'bg-light'}`}>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>TENURE</small>
                  <span className="fw-semibold small">{tenureText}</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* --- DETAILED INFORMATION GRID --- */}
      <Row className="g-4">
        {/* SECTION 1: Employment & Posting Details */}
        <Col md={6}>
          <Card className={`border-0 shadow-sm rounded-4 p-4 h-100 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
            <h5 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
              <Briefcase size={18} /> Employment Details
            </h5>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Designation / Department</span>
                <span className="fw-semibold">{employee.department || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Employee Category</span>
                <span className="fw-semibold">{employee.jobTitle || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Employee Type</span>
                <span className="fw-semibold">{employee.employeeType || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Office Type</span>
                <span className="fw-semibold">{employee.officeType || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Circle / District</span>
                <span className="fw-semibold">{employee.circle || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Date of Joining</span>
                <span className="fw-semibold text-success">{formattedJoiningDate}</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* SECTION 2: Banking & Payroll Information */}
        <Col md={6}>
          <Card className={`border-0 shadow-sm rounded-4 p-4 h-100 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
            <h5 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
              <Landmark size={18} /> Banking & Settlement
            </h5>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Bank Name</span>
                <span className="fw-semibold">{employee.bankName || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Account Number</span>
                <span className="fw-semibold font-monospace text-primary">{employee.accountNumber || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">IFSC Code</span>
                <span className="fw-semibold font-monospace">{employee.ifscCode || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Basic Monthly Pay</span>
                <span className="fw-bold text-success">₹{employee.baseSalary?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Annual Compensation</span>
                <span className="fw-bold">₹{annualSalary}</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* SECTION 3: Contact & Emergency Information */}
        <Col md={6}>
          <Card className={`border-0 shadow-sm rounded-4 p-4 h-100 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
            <h5 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
              <Home size={18} /> Residential & Emergency Contact
            </h5>
            <div className="mb-3">
              <span className="text-muted small d-block mb-1">Permanent Residential Address</span>
              <p className="fw-semibold mb-0 p-2 rounded-3 bg-light bg-opacity-25 border">
                {employee.address || 'Address details not provided.'}
              </p>
            </div>
            
            <hr className="my-3 opacity-25" />

            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <span className="text-muted small d-block">Emergency Contact Person</span>
                <span className="fw-bold">{employee.emergencyContactName || 'N/A'}</span>
              </div>
              <div className="col-12 col-sm-6 text-sm-end">
                <span className="text-muted small d-block">Emergency Phone</span>
                {employee.emergencyContactPhone ? (
                  <a href={`tel:${employee.emergencyContactPhone}`} className="fw-bold text-danger text-decoration-none">
                    {employee.emergencyContactPhone}
                  </a>
                ) : (
                  <span className="fw-semibold text-muted">N/A</span>
                )}
              </div>
            </div>
          </Card>
        </Col>

        {/* SECTION 4: Statutory KYC Documents & Education */}
        <Col md={6}>
          <Card className={`border-0 shadow-sm rounded-4 p-4 h-100 ${isDark ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
            <h5 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
              <ShieldCheck size={18} /> Statutory KYC & Documents
            </h5>

            <div className="d-flex flex-column gap-3">
              {/* Aadhaar Card */}
              <div className={`p-3 border rounded-3 d-flex justify-content-between align-items-center ${isDark ? 'bg-dark' : 'bg-light'}`}>
                <div>
                  <small className="text-muted d-block">Aadhaar Card Number</small>
                  <span className="fw-bold font-monospace">{employee.aadharNumber || 'N/A'}</span>
                </div>
                {employee.aadhaarFile ? (
                  <Button 
                    size="sm" 
                    variant="outline-success" 
                    className="rounded-3 px-3 d-flex align-items-center gap-1"
                    onClick={() => window.open(getFileLink(employee.aadhaarFile), '_blank')}
                  >
                    <Eye size={14} /> View
                  </Button>
                ) : (
                  <Badge bg="secondary">No File</Badge>
                )}
              </div>

              {/* PAN Card */}
              <div className={`p-3 border rounded-3 d-flex justify-content-between align-items-center ${isDark ? 'bg-dark' : 'bg-light'}`}>
                <div>
                  <small className="text-muted d-block">PAN Card Number</small>
                  <span className="fw-bold font-monospace text-uppercase">{employee.panNumber || 'N/A'}</span>
                </div>
                {employee.panFile ? (
                  <Button 
                    size="sm" 
                    variant="outline-success" 
                    className="rounded-3 px-3 d-flex align-items-center gap-1"
                    onClick={() => window.open(getFileLink(employee.panFile), '_blank')}
                  >
                    <Eye size={14} /> View
                  </Button>
                ) : (
                  <Badge bg="secondary">No File</Badge>
                )}
              </div>

              {/* Educational Marksheet */}
              <div className={`p-3 border rounded-3 d-flex justify-content-between align-items-center ${isDark ? 'bg-dark' : 'bg-light'}`}>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <small className="text-muted d-block">Qualification Marksheet</small>
                    <span className="fw-bold">{employee.marksheetType ? `${employee.marksheetType} Marksheet` : 'N/A'}</span>
                  </div>
                </div>
                {employee.marksheetFile ? (
                  <Button 
                    size="sm" 
                    variant="success" 
                    className="rounded-3 px-3 d-flex align-items-center gap-1 text-white border-0"
                    style={{ backgroundColor: '#00A86B' }}
                    onClick={() => window.open(getFileLink(employee.marksheetFile), '_blank')}
                  >
                    <Download size={14} /> Download
                  </Button>
                ) : (
                  <Badge bg="secondary">No File</Badge>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default EmployeeDetail;