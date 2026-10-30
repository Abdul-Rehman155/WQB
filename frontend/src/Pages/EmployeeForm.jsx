import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Image, Alert, ProgressBar } from 'react-bootstrap';
import { 
  ArrowLeft, ArrowRight, Save, Upload, User, Briefcase, 
  CreditCard, ShieldAlert, FileText, Check, FileCheck 
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const STEPS = [
  { id: 1, title: 'Basic Info', sub: 'Personal Details', icon: User },
  { id: 2, title: 'Employment', sub: 'Job & Posting', icon: Briefcase },
  { id: 3, title: 'Banking', sub: 'Address & Account', icon: CreditCard },
  { id: 4, title: 'Emergency', sub: 'Guardian & Contact', icon: ShieldAlert },
  { id: 5, title: 'Documents', sub: 'KYC & Marksheet', icon: FileText },
];

function AddEmployeeForm({ employee, onBack, onSaveSuccess }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [currentStep, setCurrentStep] = useState(1);

  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    employeeType: '',
    baseSalary: '', 
    gender: 'Male',      
    officeType: "",
    circle: "", 
    joiningDate: '',
    status: 'Active',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    aadharNumber: '',
    panNumber: '',
    marksheetType: '' 
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null); 
  
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [marksheetFile, setMarksheetFile] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [officeTypes, setOfficeTypes] = useState([]);
  const [circles, setCircles] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, deptRes, typeRes, officeRes, circleRes] = await Promise.all([
          axios.get('http://localhost:5000/api/categories'),
          axios.get('http://localhost:5000/api/departments'),
          axios.get('http://localhost:5000/api/employee-types'),
          axios.get('http://localhost:5000/api/office-types'),
          axios.get('http://localhost:5000/api/circle-types')
        ]);
        setCategories(catRes.data || []);
        setDepartments(deptRes.data || []);
        setEmployeeTypes(typeRes.data || []);
        setOfficeTypes(officeRes.data || []);
        setCircles(circleRes.data || []);
      } catch (err) { console.error(err); }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        ...initialFormState,
        ...employee,
        gender: employee.gender || 'Male',
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : ''
      });
      if (employee.image) setPreviewUrl(`http://localhost:5000/${employee.image}`);
    }
  }, [employee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errorMsg) setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;

    if (name === 'image') {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else if (name === 'aadhaarFile') {
      setAadhaarFile(file);
    } else if (name === 'panFile') {
      setPanFile(file);
    } else if (name === 'marksheetFile') {
      setMarksheetFile(file);
    }
    if (errorMsg) setErrorMsg('');
  };

  const validateStep = (stepNumber) => {
    setErrorMsg('');
    if (stepNumber === 1) {
      if (!formData.name.trim()) return "Full Name is required.";
      if (!formData.email.trim()) return "Email Address is required.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return "Please enter a valid email address.";
      if (!formData.phone.trim()) return "Phone number is required.";
      if (formData.phone.trim().length < 10) return "Phone number must be at least 10 digits.";
      if (!employee && !imageFile && !previewUrl) return "Profile photo is required.";
    }

    if (stepNumber === 2) {
      if (!formData.baseSalary) return "Basic Salary is required.";
      if (!formData.jobTitle) return "Please select Employee Category.";
      if (!formData.department) return "Please select Designation.";
      if (!formData.employeeType) return "Please select Employee Type.";
      if (!formData.officeType) return "Please select Office Type.";
      if (!formData.circle) return "Please select Circle/District.";
      if (!formData.joiningDate) return "Joining Date is required.";
    }

    if (stepNumber === 3) {
      if (!formData.address.trim()) return "Full Address is required.";
      if (!formData.bankName.trim()) return "Bank Name is required.";
      if (!formData.accountNumber.trim()) return "Account Number is required.";
      if (!formData.ifscCode.trim()) return "IFSC Code is required.";
    }

    if (stepNumber === 4) {
      if (!formData.emergencyContactName.trim()) return "Emergency Contact Person Name is required.";
      if (!formData.emergencyContactPhone.trim()) return "Emergency Contact Phone is required.";
    }

    if (stepNumber === 5) {
      if (!formData.aadharNumber.trim()) return "Aadhar Number is required.";
      if (!formData.panNumber.trim()) return "PAN Number is required.";
      if (!formData.marksheetType) return "Please select Marksheet Level.";
      if (!employee) {
        if (!aadhaarFile) return "Please upload Aadhaar Card file.";
        if (!panFile) return "Please upload PAN Card file.";
        if (!marksheetFile) return "Please upload Marksheet file.";
      }
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setErrorMsg(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMsg('');
    setCurrentStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep(5);
    if (error) {
      setErrorMsg(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    if (imageFile) data.append('image', imageFile);
    if (aadhaarFile) data.append('aadhaarFile', aadhaarFile);
    if (panFile) data.append('panFile', panFile);
    if (marksheetFile) data.append('marksheetFile', marksheetFile);

    try {
      const empId = employee?._id || employee?.id;
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (empId) {
        await axios.put(`http://localhost:5000/api/employee/${empId}`, data, config);
      } else {
        await axios.post(`http://localhost:5000/api/employee`, data, config);
      }
      onSaveSuccess();
    } catch (error) {
      console.error("Error saving employee:", error);
      setErrorMsg(error.response?.data?.error || error.response?.data?.message || "All fields are required.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = isDark ? "bg-dark text-white border-secondary shadow-none" : "shadow-none";

  return (
    <div className="w-100">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Button variant={isDark ? "outline-light" : "light"} onClick={onBack} className="mb-2 btn-sm rounded-3 me-2 border">
            <ArrowLeft size={16} /> Back to List
          </Button>
          <h1 className={`h3 fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>
            {employee ? 'Edit Employee Profile' : 'Create Employee Profile'}
          </h1>
        </div>
        <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill fw-semibold">
          Step {currentStep} of 5: {STEPS[currentStep - 1].title}
        </span>
      </div>

      {/* Stepper Progress Bar */}
      <Card className={`border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 ${isDark ? 'bg-secondary text-white' : 'bg-white'}`}>
        <div className="position-relative mb-2">
          <ProgressBar 
            now={((currentStep - 1) / (STEPS.length - 1)) * 100} 
            variant="success" 
            style={{ height: '4px', position: 'absolute', top: '24px', left: '5%', width: '90%', zIndex: 1 }} 
          />
          <Row className="position-relative text-center g-2" style={{ zIndex: 2 }}>
            {STEPS.map((step) => {
              const IconComponent = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              let circleBg = isDark ? '#2D3748' : '#F1F5F9';
              let circleColor = '#94A3B8';
              let borderColor = isDark ? '#4A5568' : '#CBD5E1';

              if (isCompleted) {
                circleBg = '#00A86B';
                circleColor = '#ffffff';
                borderColor = '#00A86B';
              } else if (isActive) {
                circleBg = '#ffffff';
                circleColor = '#00A86B';
                borderColor = '#00A86B';
              }

              return (
                <Col key={step.id}>
                  <div 
                    className="d-flex flex-column align-items-center"
                    style={{ cursor: step.id < currentStep ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                  >
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-2"
                      style={{
                        width: '46px',
                        height: '46px',
                        backgroundColor: circleBg,
                        color: circleColor,
                        border: `2px solid ${borderColor}`,
                        boxShadow: isActive ? '0 0 0 4px rgba(0, 168, 107, 0.2)' : 'none',
                        transition: 'all 0.25s ease-in-out'
                      }}
                    >
                      {isCompleted ? <Check size={20} strokeWidth={3} /> : <IconComponent size={20} />}
                    </div>
                    <span className={`small fw-bold d-none d-md-block ${isActive ? 'text-success' : isCompleted ? (isDark ? 'text-white' : 'text-dark') : 'text-muted'}`}>
                      {step.title}
                    </span>
                    <span className="text-muted d-none d-lg-block" style={{ fontSize: '0.75rem' }}>
                      {step.sub}
                    </span>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </Card>

      {errorMsg && (
        <Alert variant="danger" className="shadow-sm mb-4 border-0 d-flex align-items-center gap-2">
          <strong>Validation Error:</strong> {errorMsg}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
        {/* STEP 1 */}
        {currentStep === 1 && (
          <Card className={`border-0 shadow-sm rounded-4 p-4 mb-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
            <h5 className="fw-bold mb-4" style={{ color: '#00A86B' }}>👤 Step 1: Basic Information</h5>
            <Row className="align-items-center">
              <Col md={3} className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  {previewUrl ? (
                    <Image src={previewUrl} roundedCircle className="border shadow-sm" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                  ) : (
                    <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center mx-auto" style={{ width: '120px', height: '120px' }}>
                      <User size={50} className="text-muted" />
                    </div>
                  )}
                  <Form.Label htmlFor="image-upload" className="position-absolute bottom-0 end-0 bg-success text-white p-2 rounded-circle shadow-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                  </Form.Label>
                  <Form.Control id="image-upload" name="image" type="file" accept="image/*" className="d-none" onChange={handleFileChange} />
                </div>
                <div className="small text-muted mt-2 fw-semibold">Profile Photo *</div>
                {imageFile && <small className="text-success d-block text-truncate mt-1">{imageFile.name}</small>}
              </Col>
              
              <Col md={9}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small">Full Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="name" placeholder="Enter employee full name" value={formData.name} onChange={handleInputChange} className={inputClass} />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small">Gender <span className="text-danger">*</span></Form.Label>
                      <Form.Select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClass}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small">Email Address <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="email" name="email" placeholder="official@company.com" value={formData.email} onChange={handleInputChange} className={inputClass} />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-secondary small">Phone Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="phone" placeholder="10-digit mobile number" value={formData.phone} onChange={handleInputChange} className={inputClass} />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <Card className={`border-0 shadow-sm rounded-4 p-4 mb-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
            <h5 className="fw-bold mb-3" style={{ color: '#00A86B' }}>💼 Step 2: Employment & Posting Details</h5>
            <Row>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Basic Salary (₹) <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" name="baseSalary" placeholder="e.g. 35000" value={formData.baseSalary} onChange={handleInputChange} className={inputClass} />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Employee Category <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select Category</option>
                    {categories.map((cat, i) => <option key={i} value={cat.name}>{cat.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Designation <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="department" value={formData.department} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select Designation</option>
                    {departments.map((dept, i) => <option key={i} value={dept.name}>{dept.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Employee Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="employeeType" value={formData.employeeType} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select Type</option>
                    {employeeTypes.map((type, i) => <option key={i} value={type.name}>{type.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Office Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="officeType" value={formData.officeType} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select Office</option>
                    {officeTypes.map((type, i) => <option key={i} value={type.name}>{type.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Circle / District <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="circle" value={formData.circle} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select District</option>
                    {circles.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Joining Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className={inputClass} />
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <Card className={`border-0 shadow-sm rounded-4 p-4 mb-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
            <h5 className="fw-bold mb-3" style={{ color: '#00A86B' }}>🏦 Step 3: Address & Banking Information</h5>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Full Residential Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={2} name="address" placeholder="House no, Street, Landmark, City, State, PIN" value={formData.address} onChange={handleInputChange} className={inputClass} />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Bank Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="bankName" placeholder="e.g. State Bank of India" value={formData.bankName} onChange={handleInputChange} className={inputClass} />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Account Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="accountNumber" placeholder="Enter bank account number" value={formData.accountNumber} onChange={handleInputChange} className={inputClass} />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">IFSC Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} placeholder="e.g. SBIN0001234" className={inputClass} />
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <Card className={`border-0 shadow-sm rounded-4 p-4 mb-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
            <h5 className="fw-bold mb-3" style={{ color: '#00A86B' }}>🆘 Step 4: Emergency Contacts</h5>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Emergency Contact Person Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} placeholder="Parent / Spouse / Sibling Name" className={inputClass} />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Emergency Contact Phone Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} placeholder="10-digit contact number" className={inputClass} />
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <Card className={`border-0 shadow-sm rounded-4 p-4 mb-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
            <h5 className="fw-bold mb-3" style={{ color: '#00A86B' }}>📄 Step 5: Statutory Documents & KYC</h5>
            <Row>
              <Col md={6} className="mb-4">
                <Form.Group className="p-3 border rounded-3 bg-light bg-opacity-25">
                  <Form.Label className="fw-semibold text-secondary small">Aadhaar Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="aadharNumber" placeholder="12-digit Aadhaar number" value={formData.aadharNumber} onChange={handleInputChange} className={`mb-2 ${inputClass}`} />
                  <Form.Control type="file" name="aadhaarFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className={inputClass} />
                  {aadhaarFile && <div className="text-success small mt-1"><FileCheck size={14}/> {aadhaarFile.name}</div>}
                </Form.Group>
              </Col>
              <Col md={6} className="mb-4">
                <Form.Group className="p-3 border rounded-3 bg-light bg-opacity-25">
                  <Form.Label className="fw-semibold text-secondary small">PAN Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="panNumber" placeholder="10-digit PAN (e.g. ABCDE1234F)" value={formData.panNumber} onChange={handleInputChange} className={`mb-2 ${inputClass}`} />
                  <Form.Control type="file" name="panFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className={inputClass} />
                  {panFile && <div className="text-success small mt-1"><FileCheck size={14}/> {panFile.name}</div>}
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Highest Marksheet Level <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="marksheetType" value={formData.marksheetType} onChange={handleInputChange} className={inputClass}>
                    <option value="">-- Select Qualification Level --</option>
                    <option value="10th">10th</option>
                    <option value="12th">12th</option>
                    <option value="Graduation">Graduation</option>
                    <option value="PG">Post Graduation (PG)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary small">Upload Marksheet Document <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="file" name="marksheetFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" disabled={!formData.marksheetType} className={inputClass} />
                  {marksheetFile && <div className="text-success small mt-1"><FileCheck size={14}/> {marksheetFile.name}</div>}
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {/* Stepper Controls */}
        <Card className={`border-0 shadow-sm rounded-4 p-3 mb-5 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant={isDark ? "outline-light" : "outline-secondary"} 
                  onClick={handlePrevious} 
                  className="px-4 py-2 rounded-3 d-flex align-items-center gap-2"
                >
                  <ArrowLeft size={16} /> Previous Step
                </Button>
              )}
            </div>
            
            <div className="d-flex gap-2">
              <Button variant={isDark ? "outline-light" : "light"} onClick={onBack} className="px-4 py-2 rounded-3 border">
                Cancel
              </Button>

              {currentStep < 5 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  className="px-4 py-2 rounded-3 text-white border-0 d-flex align-items-center gap-2" 
                  style={{ backgroundColor: '#00A86B' }}
                >
                  Next Step <ArrowRight size={16} />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-5 py-2 rounded-3 text-white border-0 d-flex align-items-center gap-2 shadow" 
                  style={{ backgroundColor: '#00A86B' }}
                >
                  {isSaving ? <Spinner size="sm" animation="border" /> : <Save size={16} />}
                  {isSaving ? "Saving..." : "Submit Profile"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </Form>
    </div>
  );
}

export default AddEmployeeForm;