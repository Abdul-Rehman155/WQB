import React, { useEffect, useMemo, useState } from "react";
import {
  Badge, Button, Card, Col, Container, Form, InputGroup, Modal, Row, Table,
} from "react-bootstrap";
import {
  ArrowUpDown, CalendarDays, Eye, FileText, Filter, LockKeyhole, Pencil,
  Plus, Search, Tag, Trash2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5000/api";
const emptyForm = {
  policyName: "", description: "", leaveType: "", carryForwardLimit: 0,
  minDaysPerApplication: 1, maxDaysPerApplication: 1, requiresApproval: true, status: "Active",
};

const LeavePolicies = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [policies, setPolicies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policyResponse, typeResponse] = await Promise.all([
        fetch(`${API_URL}/leave-policies`),
        fetch(`${API_URL}/leave-types`),
      ]);
      if (!policyResponse.ok || !typeResponse.ok) throw new Error("Unable to load leave policy data");
      const [policyData, typeData] = await Promise.all([policyResponse.json(), typeResponse.json()]);
      setPolicies(Array.isArray(policyData) ? policyData : []);
      setLeaveTypes(Array.isArray(typeData) ? typeData.filter((type) => type.status === "Active") : []);
      setError("");
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const visiblePolicies = useMemo(() => policies.filter((policy) => {
    const matchesSearch = policy.policyName.toLowerCase().includes(search.toLowerCase());
    const matchesType = leaveTypeFilter === "All" || policy.leaveType === leaveTypeFilter;
    const matchesStatus = statusFilter === "All" || policy.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [policies, search, leaveTypeFilter, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, leaveType: leaveTypes[0]?.name || "" });
    setShowForm(true);
  };

  const openEdit = (policy) => {
    setEditingId(policy._id);
    setFormData({
      policyName: policy.policyName || "",
      description: policy.description || "",
      leaveType: policy.leaveType || "",
      carryForwardLimit: policy.carryForwardLimit ?? 0,
      minDaysPerApplication: policy.minDaysPerApplication ?? 1,
      maxDaysPerApplication: policy.maxDaysPerApplication ?? 1,
      requiresApproval: policy.requiresApproval !== false,
      status: policy.status || "Active",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Number(formData.maxDaysPerApplication) < Number(formData.minDaysPerApplication)) {
      setError("Maximum days per application cannot be less than minimum days.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/leave-policies${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          annualAccrual: Number(leaveTypes.find((type) => type.name === formData.leaveType)?.maxDays || 0),
          carryForwardLimit: Number(formData.carryForwardLimit),
          minDaysPerApplication: Number(formData.minDaysPerApplication),
          maxDaysPerApplication: Number(formData.maxDaysPerApplication),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save leave policy");
      setShowForm(false);
      setError("");
      fetchData();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const updatePolicy = async (policy, changes) => {
    try {
      const response = await fetch(`${API_URL}/leave-policies/${policy._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...changes }),
      });
      if (!response.ok) throw new Error("Unable to update leave policy");
      fetchData();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const deletePolicy = async (policy) => {
    if (!window.confirm(`Delete ${policy.policyName}?`)) return;
    try {
      const response = await fetch(`${API_URL}/leave-policies/${policy._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete leave policy");
      fetchData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const pill = (value, variant) => <Badge bg="transparent" className={`border border-${variant} text-${variant} fw-normal px-2 py-1`}>{value}</Badge>;

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 className="fw-bold mb-1">Leave Policies</h2>
            <p className="text-muted mb-0">Manage leave policies for your organization.</p>
          </div>
          <Button className="border-0 d-flex align-items-center gap-2 px-3" style={{ backgroundColor: "#10b981" }} onClick={openAdd}>
            <Plus size={18} /> Add Leave Policy
          </Button>
        </div>

        <Card className={`border-0 shadow-sm rounded-3 mb-3 ${isDark ? "bg-secondary" : "bg-white"}`}>
          <Card.Body className="p-3 pb-0">
            <Row className="g-2 mb-3">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text className="bg-transparent"><Search size={16} /></InputGroup.Text>
                  <Form.Control placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select value={leaveTypeFilter} onChange={(event) => setLeaveTypeFilter(event.target.value)}>
                  <option value="All">All Leave Types</option>
                  {leaveTypes.map((type) => <option key={type._id} value={type.name}>{type.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={5} className="d-flex justify-content-md-end">
                <Button variant={isDark ? "outline-light" : "outline-secondary"} className="d-flex align-items-center gap-2" onClick={() => setStatusFilter(statusFilter === "All" ? "Active" : "All")}>
                  <Filter size={16} /> Filters {statusFilter === "Active" && "(Active)"}
                </Button>
              </Col>
            </Row>
            <div className="d-flex gap-4 border-top pt-2">
              {["All", "Active", "Inactive"].map((status) => (
                <Button key={status} variant="link" className={`text-decoration-none px-2 rounded-0 ${statusFilter === status ? "text-success border-bottom border-success border-2" : "text-muted"}`} onClick={() => setStatusFilter(status)}>
                  {status === "All" ? "▦" : status === "Active" ? "⊙" : "⊗"} {status} <Badge pill bg={status === "Active" ? "success" : "light"} text={status === "Active" ? "white" : "dark"}>{status === "All" ? policies.length : policies.filter((policy) => policy.status === status).length}</Badge>
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        <Card className={`border-0 shadow-sm rounded-3 overflow-hidden ${isDark ? "bg-secondary" : "bg-white"}`}>
          <Table responsive hover className={`mb-0 align-middle ${isDark ? "table-dark" : ""}`}>
            <thead><tr className="text-muted small"><th>#</th><th>Policy Name <ArrowUpDown size={13} /></th><th>Leave Type</th><th>Carry Forward</th><th>Approval</th><th>Status</th><th>Created At</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="text-center py-5 text-muted">Loading policies...</td></tr> : visiblePolicies.length === 0 ? <tr><td colSpan="8" className="text-center py-5 text-muted">No leave policies found.</td></tr> : visiblePolicies.map((policy, index) => (
                <tr key={policy._id}>
                  <td>{index + 1}</td>
                  <td className="fw-semibold">{policy.policyName}</td>
                  <td><span className="d-inline-block rounded-circle me-2" style={{ width: 10, height: 10, backgroundColor: leaveTypes.find((type) => type.name === policy.leaveType)?.color || "#10b981" }} />{policy.leaveType}</td>
                  <td>{policy.carryForwardLimit} days</td>
                  <td>{pill(policy.requiresApproval ? "Required" : "Not Required", policy.requiresApproval ? "warning" : "success")}</td>
                  <td>{pill(policy.status, policy.status === "Active" ? "success" : "secondary")}</td>
                  <td><CalendarDays size={15} className="text-muted me-2" />{new Date(policy.createdAt).toISOString().slice(0, 10)}</td>
                  <td><div className="d-flex gap-3"><Eye size={17} className="text-muted" role="button" onClick={() => setSelectedPolicy(policy)} /><Pencil size={17} className="text-muted" role="button" onClick={() => openEdit(policy)} /><LockKeyhole size={17} className="text-muted" role="button" onClick={() => updatePolicy(policy, { status: policy.status === "Active" ? "Inactive" : "Active" })} /><Trash2 size={17} className="text-muted" role="button" onClick={() => deletePolicy(policy)} /></div></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </Container>

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Modal.Header closeButton><Modal.Title>{editingId ? "Edit Leave Policy" : "Add New Leave Policy"}</Modal.Title></Modal.Header>
        <Modal.Body><Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3"><Form.Label>Policy Name <span className="text-danger">*</span></Form.Label><Form.Control required placeholder="e.g. Annual Leave Policy" value={formData.policyName} onChange={(event) => setFormData({ ...formData, policyName: event.target.value })} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} placeholder="e.g. Standard annual leave policy for all employees..." value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Leave Type <span className="text-danger">*</span></Form.Label><Form.Select required value={formData.leaveType} onChange={(event) => setFormData({ ...formData, leaveType: event.target.value })}><option value="">Select Leave Type</option>{leaveTypes.map((type) => <option key={type._id} value={type.name}>{type.name}</option>)}</Form.Select></Form.Group>
          <Row><Col md={4}><Form.Group className="mb-3"><Form.Label>Carry Forward Limit (Days) *</Form.Label><Form.Control required min="0" type="number" value={formData.carryForwardLimit} onChange={(event) => setFormData({ ...formData, carryForwardLimit: event.target.value })} /></Form.Group></Col><Col md={4}><Form.Group className="mb-3"><Form.Label>Min Days *</Form.Label><Form.Control required min="0.5" step="0.5" type="number" value={formData.minDaysPerApplication} onChange={(event) => setFormData({ ...formData, minDaysPerApplication: event.target.value })} /></Form.Group></Col><Col md={4}><Form.Group className="mb-3"><Form.Label>Max Days *</Form.Label><Form.Control required min="0.5" step="0.5" type="number" value={formData.maxDaysPerApplication} onChange={(event) => setFormData({ ...formData, maxDaysPerApplication: event.target.value })} /></Form.Group></Col></Row>
          <Form.Check className="mb-3" type="checkbox" label="Requires Approval" checked={formData.requiresApproval} onChange={(event) => setFormData({ ...formData, requiresApproval: event.target.checked })} />
          <Form.Group className="mb-4"><Form.Label>Status *</Form.Label><Form.Select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}><option>Active</option><option>Inactive</option></Form.Select></Form.Group>
          <div className="d-flex justify-content-end gap-2 border-top pt-3"><Button variant="light" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" className="border-0" style={{ backgroundColor: "#10b981" }}>Save</Button></div>
        </Form></Modal.Body>
      </Modal>

      <Modal show={Boolean(selectedPolicy)} onHide={() => setSelectedPolicy(null)} centered>
        <Modal.Header closeButton><Modal.Title className="d-flex align-items-center gap-2"><FileText className="text-success" /> Leave Policy Details</Modal.Title></Modal.Header>
        <Modal.Body>{selectedPolicy && <Row className="g-4">
          <Col xs={6}><Info label="Policy Name" value={selectedPolicy.policyName} icon={<FileText size={16} />} /></Col>
          <Col xs={6}><Info label="Leave Type" value={selectedPolicy.leaveType} icon={<Tag size={16} />} /></Col>
          <Col xs={6}><Info label="Accrual" value={`${selectedPolicy.annualAccrual ?? 0} days/year`} icon={<ArrowUpDown size={16} />} /></Col>
          <Col xs={6}><Info label="Carry Forward Limit" value={`${selectedPolicy.carryForwardLimit} days`} icon={<ArrowUpDown size={16} />} /></Col>
          <Col xs={6}><Info label="Min Days Per Application" value={`${selectedPolicy.minDaysPerApplication} days`} icon={<Tag size={16} />} /></Col>
          <Col xs={6}><Info label="Max Days Per Application" value={`${selectedPolicy.maxDaysPerApplication} days`} icon={<Tag size={16} />} /></Col>
          <Col xs={6}><Info label="Approval" value={selectedPolicy.requiresApproval ? "Required" : "Not Required"} icon={<FileText size={16} />} /></Col>
          <Col xs={6}><Info label="Status" value={selectedPolicy.status} icon={<LockKeyhole size={16} />} /></Col>
          <Col xs={12}><Info label="Description" value={selectedPolicy.description || "No description provided."} icon={<FileText size={16} />} /></Col>
        </Row>}</Modal.Body>
      </Modal>
      <style>{`.page-layout{min-height:100vh}@media (min-width:992px){.page-layout{margin-left:280px;width:calc(100% - 280px)}}`}</style>
    </div>
  );
};

const Info = ({ label, value, icon }) => <div><div className="text-muted small d-flex align-items-center gap-2 mb-1">{icon}{label}</div><div className="fw-semibold">{value}</div></div>;

export default LeavePolicies;
