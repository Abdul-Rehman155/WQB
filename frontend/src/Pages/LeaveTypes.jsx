import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Table, Badge, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaCircle, FaPlus } from 'react-icons/fa';
import { useTheme } from "../context/ThemeContext";

const LeaveTypesPage = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [categories, setCategories] = useState([]); // Admin se Employee Categories store karne ke liye
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '', // Employee Category ke liye
        maxDays: '',
        color: '#3B82F6',
        isPaid: true,
        status: 'Active'
    });

    // Admin Panel se Employee Categories fetch karna
    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/categories');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (err) {
            console.error("Error fetching employee categories:", err);
        }
    };

    const fetchLeaveTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/leave-types?search=${searchTerm}&status=${statusFilter}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                setLeaveTypes(data.filter((type) => type.status === 'Active'));
                setError(null);
            } else {
                setLeaveTypes([]);
                setError("Failed to fetch properly");
            }
        } catch (err) {
            setError("Server connection failed");
            setLeaveTypes([]);
        } finally {
            setLoading(false);
        }
    };

    // Component load hote hi categories aur leave types fetch honge
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeaveTypes();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:5000/api/leave-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const savedType = await res.json();

                setLeaveTypes((prev) => [savedType, ...prev.filter((item) => item.status === 'Active')]);
                setFormData({
                    name: '',
                    description: '',
                    category: '',
                    maxDays: '',
                    color: '#3B82F6',
                    isPaid: true,
                    status: 'Active'
                });

                fetchLeaveTypes();
            }
        } catch (err) {
            alert("Error adding leave type");
        }
    };

    return (
        <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
            <Container fluid className="py-4">
                <div className="mb-4">
                    <h3 className={`fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>Leave Types</h3>
                    <p className="text-muted small">Manage leave types and their configurations.</p>
                </div>

                <Row className="g-4">
                    <Col lg={5}>
                        <Card className={`border-0 shadow-sm p-2 ${isDark ? 'bg-secondary text-white' : 'bg-white'}`} style={{ borderRadius: '16px' }}>
                            <Card.Body>
                                <h5 className="fw-bold mb-1">Add New Leave Type</h5>
                                <p className="text-muted small mb-4">Create a new configuration for leave policies</p>

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Leave Type Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            className={isDark ? "bg-dark text-white border-secondary" : ""}
                                            placeholder="e.g., Casual Leave, Sick Leave"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    {/* Admin se fetch ki hui Employee Category Select Dropdown */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Employee Category</Form.Label>
                                        <Form.Select
                                            className={isDark ? "bg-dark text-white border-secondary" : ""}
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">All Categories (General)</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id || cat.id || cat.name} value={cat.name}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            className={isDark ? "bg-dark text-white border-secondary" : ""}
                                            placeholder="Brief description..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold">Max Days / Year <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    className={isDark ? "bg-dark text-white border-secondary" : ""}
                                                    value={formData.maxDays}
                                                    onChange={(e) => setFormData({ ...formData, maxDays: e.target.value })}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label className="small fw-bold">Color <span className="text-danger">*</span></Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="color"
                                                    value={formData.color}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    style={{ width: '45px', padding: '2px', height: '38px' }}
                                                />
                                                <Form.Control 
                                                    value={formData.color} 
                                                    readOnly 
                                                    className={isDark ? "bg-dark text-white border-secondary" : ""}
                                                    style={{ fontSize: '0.85rem' }} 
                                                />
                                            </InputGroup>
                                        </Col>
                                    </Row>

                                    <div className={`border rounded p-3 mb-3 d-flex justify-content-between align-items-center ${isDark ? 'bg-dark border-secondary' : 'bg-light'}`}>
                                        <div>
                                            <div className="fw-bold small">Paid Leave</div>
                                            <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Salary is provided during this leave</div>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            checked={formData.isPaid}
                                            onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                                        />
                                    </div>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="small fw-bold">Status <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            className={isDark ? "bg-dark text-white border-secondary" : ""}
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        className="w-100 border-0 py-2 d-flex align-items-center justify-content-center"
                                        style={{ backgroundColor: '#10b981', borderRadius: '10px' }}
                                    >
                                        <FaPlus className="me-2" /> Add Leave Type
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={7}>
                        <Card className={`border-0 shadow-sm ${isDark ? 'bg-secondary text-white' : 'bg-white'}`} style={{ borderRadius: '16px' }}>
                            <Card.Body className="p-4">
                                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                                    <h5 className="fw-bold m-0">Existing Types</h5>
                                    <div className="d-flex gap-2">
                                        <InputGroup size="sm" style={{ width: '180px' }}>
                                            <InputGroup.Text className={isDark ? 'bg-dark border-secondary' : 'bg-white border-end-0'}><FaSearch className="text-muted" /></InputGroup.Text>
                                            <Form.Control
                                                className={isDark ? "bg-dark text-white border-secondary" : "border-start-0"}
                                                placeholder="Search name..."
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>

                                        <Form.Select 
                                            size="sm" 
                                            style={{ width: '110px' }} 
                                            className={isDark ? "bg-dark text-white border-secondary" : ""}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </Form.Select>
                                    </div>
                                </div>

                                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                                <Table responsive hover className={`mb-0 ${isDark ? 'table-dark' : ''}`}>
                                    <thead className={isDark ? "table-dark" : "bg-light"}>
                                        <tr style={{ fontSize: '0.75rem', color: isDark ? '#a0aec0' : '#64748b' }}>
                                            <th>NAME</th>
                                            <th>CATEGORY</th>
                                            <th>LIMIT</th>
                                            <th>PAY TYPE</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-4"><Spinner animation="border" variant="success" size="sm" /></td></tr>
                                        ) : Array.isArray(leaveTypes) && leaveTypes.length > 0 ? (
                                            leaveTypes.map((type) => (
                                                <tr key={type._id} style={{ fontSize: '0.85rem' }}>
                                                    <td className="fw-semibold">
                                                        <FaCircle className="me-2" style={{ color: type.color, fontSize: '8px' }} />
                                                        {type.name}
                                                    </td>
                                                    <td>
                                                        <Badge bg="info" className="text-dark" style={{ fontSize: '0.72rem', fontWeight: '500' }}>
                                                            {type.category || 'All Categories'}
                                                        </Badge>
                                                    </td>
                                                    <td>{type.maxDays} Days</td>
                                                    <td>{type.isPaid ? 'Paid' : 'Unpaid'}</td>
                                                    <td>
                                                        <Badge bg={type.status === 'Active' ? 'success' : 'danger'} pill style={{ fontSize: '0.7rem', fontWeight: '500' }}>
                                                            {type.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="text-center py-4 text-muted small">No leave types found.</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
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
};

export default LeaveTypesPage;