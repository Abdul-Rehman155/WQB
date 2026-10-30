import React, { useState, useEffect } from "react";
import { Row, Col, Card, Form, Button, Table, InputGroup, Badge, Stack, Container } from "react-bootstrap";
import { Search, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5000/api/salary-components";

const SalaryComponents = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [components, setComponents] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Earning",
    calculationType: "Fixed",
    value: "",
    status: "Active"
  });

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCalc, setFilterCalc] = useState("All");

  const fetchComponents = async () => {
    try {
      const res = await axios.get(API_URL);
      setComponents(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => { fetchComponents(); }, []);

  // --- SEARCH & FILTER LOGIC ---
  const handleSearch = () => {
    const filtered = components.filter(item => {
      const matchesSearch = (item.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "All" || item.type === filterType;
      const matchesCalc = filterCalc === "All" || item.calculationType === filterCalc;
      return matchesSearch && matchesType && matchesCalc;
    });
    setFilteredData(filtered);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

 // edit component 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        try {
          // Pehle PUT request bhejega
          await axios.put(`${API_URL}/${editId}`, formData);
        } catch (putErr) {
          if (putErr.response && putErr.response.status === 404) {
            // Agar backend me PATCH route bana ho toh PATCH try karega
            await axios.patch(`${API_URL}/${editId}`, formData);
          } else {
            throw putErr;
          }
        }
        alert("Component Updated!");
      } else {
        await axios.post(API_URL, formData);
        alert("Component Added!");
      }
      resetForm();
      fetchComponents();
    } catch (err) {
      console.error("Update Error:", err.response || err);
      alert(err.response?.data?.message || "Error saving data. Please check backend route.");
    }
  };

  const handleEditClick = (comp) => {
    setIsEditing(true);
    setEditId(comp._id);
    setFormData({
      name: comp.name,
      description: comp.description || "",
      type: comp.type,
      calculationType: comp.calculationType,
      value: comp.value,
      status: comp.status || "Active"
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: "",
      description: "",
      type: "Earning",
      calculationType: "Fixed",
      value: "",
      status: "Active"
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this component?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchComponents();
      } catch (err) { alert("Delete failed"); }
    }
  };

  // Custom class for input styling
  const inputClass = isDark
    ? "bg-dark text-white border-secondary"
    : "bg-white text-dark";

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        <h4 className={`fw-bold mb-4 ${isDark ? 'text-white' : 'text-dark'}`}>
          Salary Components Management
        </h4>

        <Row>
          {/* LEFT: Add/Edit Form matching exact screenshot */}
          <Col lg={4} className="mb-4">
            <Card
              className={`component-form-card rounded-4 p-4 sticky-top ${
                isDark ? 'bg-secondary text-white' : 'bg-white'
              }`}
              style={{ top: "90px", zIndex: 10 }}
            >
              {/* Header with Title & Subtitle */}
              <div className="pb-3 mb-3 border-bottom d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: isDark ? "#fff" : "#111827" }}>
                    {isEditing ? "Edit Component" : "Add New Component"}
                  </h5>
                  <p className="text-muted small mb-0">
                    {isEditing
                      ? "Update the details of this salary component"
                      : "Fill in the details to create a new salary component"}
                  </p>
                </div>
                {isEditing && (
                  <Button variant="link" size="sm" onClick={resetForm} className="text-muted p-0">
                    <X size={18} />
                  </Button>
                )}
              </div>

              <Form onSubmit={handleSubmit}>
                {/* 1. Component Name */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-custom">
                    Component Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Basic Salary, HRA, Tax"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={`form-control-custom ${inputClass}`}
                  />
                </Form.Group>

                {/* 2. Description */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-custom">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Brief description of the component"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`form-control-custom ${inputClass}`}
                  />
                </Form.Group>

                {/* 3. Type */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-custom">
                    Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`form-control-custom ${inputClass}`}
                  >
                    <option value="Earning">Earning</option>
                    <option value="Deduction">Deduction</option>
                  </Form.Select>
                </Form.Group>

                {/* 4. Calculation Type */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-custom">
                    Calculation Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.calculationType}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                    className={`form-control-custom ${inputClass}`}
                  >
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage</option>
                  </Form.Select>
                </Form.Group>

                {/* 5. Fixed Amount / Percentage Value */}
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-custom">
                    {formData.calculationType === "Percentage" ? "Percentage (%)" : "Fixed Amount"}{" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    className={`form-control-custom ${inputClass}`}
                  />
                </Form.Group>

                {/* 6. Status */}
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-custom">
                    Status <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`form-control-custom ${inputClass}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>

                {/* Divider Line & Button */}
                <div className="pt-3 border-top">
                  <Stack direction="horizontal" gap={2}>
                    <Button
                      type="submit"
                      className="w-100 border-0 fw-semibold py-2 submit-btn-green"
                    >
                      {isEditing ? "Save Changes" : "Add Component"}
                    </Button>
                    {isEditing && (
                      <Button
                        variant={isDark ? "outline-light" : "outline-secondary"}
                        onClick={resetForm}
                        className="w-100 fw-semibold py-2"
                        style={{ borderRadius: "8px" }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </div>
              </Form>
            </Card>
          </Col>

          {/* RIGHT: List & Search */}
          <Col lg={8}>
            <Card className={`border-0 shadow-sm rounded-4 p-3 mb-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
              <Row className="g-2">
                <Col md={6}>
                  <InputGroup className={`rounded-3 overflow-hidden ${isDark ? 'bg-dark border-secondary' : 'bg-light'}`}>
                    <Form.Control 
                      placeholder="Search name..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className={`border-0 ${isDark ? 'bg-dark text-white' : 'bg-light'}`} 
                    />
                    <Button onClick={handleSearch} style={{ backgroundColor: "#0fb676", border: "none" }}><Search size={18}/></Button>
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterType} onChange={(e)=>setFilterType(e.target.value)} className={`small ${inputClass}`}>
                    <option value="All">All Types</option>
                    <option value="Earning">Earning</option>
                    <option value="Deduction">Deduction</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterCalc} onChange={(e)=>setFilterCalc(e.target.value)} className={`small ${inputClass}`}>
                    <option value="All">All Calculations</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Percentage">Percentage</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card>

            <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-secondary' : 'bg-white'}`}>
              <Table responsive hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
                <thead className={isDark ? 'table-dark' : 'bg-light'}>
                  <tr className="small text-muted">
                    <th className="ps-4">Component</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((comp) => (
                    <tr key={comp._id}>
                      <td className="ps-4 py-3">
                        <div className="fw-bold">{comp.name}</div>
                        {comp.description && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: "250px" }}>
                            {comp.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={comp.type === "Earning" ? "success" : "danger"} pill>{comp.type}</Badge>
                      </td>
                      <td>
                        <div className="fw-bold">
                          {comp.calculationType === "Fixed" ? `₹${comp.value}` : `${comp.value}%`}
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg="none"
                          className={
                            comp.status === "Inactive"
                              ? "text-danger border border-danger px-3"
                              : "text-success border border-success px-3"
                          }
                        >
                          {comp.status || "Active"}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <Button variant="link" onClick={() => handleEditClick(comp)} className="text-primary p-1"><Pencil size={18}/></Button>
                        <Button variant="link" onClick={() => handleDelete(comp._id)} className="text-danger p-1"><Trash2 size={18}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Screenshot matching CSS styles */}
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

        /* Screenshot Specific Styling */
        .component-form-card {
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .form-label-custom {
          font-size: 0.88rem;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .form-control-custom {
          border-radius: 8px !important;
          border: 1px solid #d1d5db !important;
          padding: 9px 13px !important;
          font-size: 0.92rem !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-control-custom:focus {
          border-color: #0fb676 !important;
          box-shadow: 0 0 0 3px rgba(15, 182, 118, 0.15) !important;
          outline: none !important;
        }
        .submit-btn-green {
          background-color: #0fb676 !important;
          border-radius: 8px !important;
          font-size: 0.95rem;
          transition: background-color 0.2s;
        }
        .submit-btn-green:hover {
          background-color: #0d9d66 !important;
        }
      `}</style>
    </div>
  );
};

export default SalaryComponents;