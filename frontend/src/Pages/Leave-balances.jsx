import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  InputGroup,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  Search,
  RotateCcw,
  Filter,
  Info,
  User,
  AlertCircle,
} from "lucide-react";
import { getEmployees, getEvents, getImageUrl } from "../Service/api";
import { useTheme } from "../context/ThemeContext";

const LeaveBalances = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, typeRes, leaveRes] = await Promise.all([
        getEmployees(),
        fetch("http://localhost:5000/api/leave-types").then((res) =>
          res.json(),
        ),
        getEvents(),
      ]);

      if (Array.isArray(empRes) && Array.isArray(typeRes)) {
        const processedData = empRes.map((emp) => {
          const leavesCalculation = typeRes.map((type) => {
            const used = Array.isArray(leaveRes)
              ? leaveRes
                  .filter(
                    (event) =>
                      event.category === "Leave" &&
                      String(event.employeeId) === String(emp._id) &&
                      event.title === type.name &&
                      new Date(event.startDate).getFullYear().toString() ===
                        selectedYear,
                  )
                  .reduce((sum, item) => sum + (Number(item.days) || 0), 0)
              : 0;

            return {
              name: type.name,
              total: type.maxDays,
              used: used,
              available: type.maxDays - used,
              color: type.color || "#10b981",
            };
          });

          return {
            _id: emp._id,
            name: emp.name,
            empId: emp.employeeId || `EMP-${emp._id.slice(-4)}`,
            image: emp.profileImage || null,
            leaves: leavesCalculation,
          };
        });
        setBalances(processedData);
      }
    } catch (error) {
      console.error("Critical Error in Leave Balances:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const filteredData = balances.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.empId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}
    >
      <Container fluid className="px-3 px-md-4 py-4">
        {/* TOP HEADER */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
              Leave Balances
            </h2>
            <p className="text-muted small mb-0">
              Real-time leave tracking from database applications.
            </p>
          </div>
          <Button
            variant={isDark ? "outline-light" : "outline-primary"}
            className="rounded-3 shadow-sm d-flex align-items-center gap-2 px-3 py-2"
            onClick={fetchBalances}
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <RotateCcw size={18} />
            )}
            Refresh
          </Button>
        </div>

        {/* SEARCH & FILTERS */}
        <Card
          className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? "bg-secondary text-white" : "bg-white"}`}
        >
          <Card.Body className="p-3">
            <Row className="g-3 align-items-center">
              <Col xs={12} md={6} lg={7}>
                <InputGroup className="border rounded-3 overflow-hidden bg-light">
                  <InputGroup.Text className="bg-transparent border-0 ps-3">
                    <Search size={18} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by Employee name or ID..."
                    className="border-0 bg-transparent py-2 shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col xs={6} md={3} lg={3}>
                <Form.Select
                  className="rounded-3 border-light py-2 shadow-none"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2026">Year 2026</option>
                  <option value="2025">Year 2025</option>
                  <option value="2024">Year 2024</option>
                </Form.Select>
              </Col>
              <Col xs={6} md={3} lg={2}>
                <Button
                  variant="light"
                  className="w-100 border rounded-3 py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 bg-white"
                >
                  <Filter size={18} /> Filter
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* CONTENT GRID */}
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <Spinner animation="border" variant="success" className="mb-2" />
            <span className="text-muted">Fetching latest balances...</span>
          </div>
        ) : (
          <Row className="g-4">
            {filteredData.length > 0 ? (
              filteredData.map((emp) => (
                <Col key={emp._id} xs={12} md={6} xxl={4}>
                  <Card
                    className={`border-0 shadow-sm rounded-4 h-100 employee-card ${isDark ? "bg-secondary" : "bg-white"}`}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div
                          className="flex-shrink-0 rounded-4 border overflow-hidden shadow-sm"
                          style={{ width: "56px", height: "56px" }}
                        >
                          {emp.image ? (
                            <img
                              src={getImageUrl(emp.image)}
                              alt=""
                              className="w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted">
                              <User size={28} />
                            </div>
                          )}
                        </div>
                        <div className="text-truncate">
                          <h6
                            className="fw-bold m-0 mb-1 text-truncate"
                            style={{ fontSize: "1.05rem" }}
                          >
                            {emp.name}
                          </h6>
                          <Badge
                            bg="light"
                            className="text-dark border fw-semibold px-2 py-1"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {emp.empId}
                          </Badge>
                        </div>
                      </div>

                      <div className="leave-table-box custom-scrollbar">
                        <Table responsive hover className="mb-0">
                          <thead
                            className="sticky-top"
                            style={{ top: -1, zIndex: 5 }}
                          >
                            <tr className="small text-muted border-bottom">
                              <th
                                className={`border-0 fw-bold ps-0 py-2 ${isDark ? "bg-secondary text-light" : "bg-white text-dark"}`}
                              >
                                Leave Type
                              </th>
                              <th
                                className={`border-0 fw-bold text-center py-2 ${isDark ? "bg-secondary text-light" : "bg-white text-dark"}`}
                              >
                                Total
                              </th>
                              <th
                                className={`border-0 fw-bold text-center py-2 ${isDark ? "bg-secondary text-light" : "bg-white text-dark"}`}
                              >
                                Used
                              </th>
                              <th
                                className={`border-0 fw-bold text-end pe-4 py-2 text-success ${isDark ? "bg-secondary" : "bg-white"}`}
                              >
                                Avail.
                              </th>
                            </tr>
                          </thead>
                          <tbody className="small">
                            {emp.leaves.length > 0 ? (
                              emp.leaves.map((leave, idx) => (
                                <tr
                                  key={idx}
                                  className="border-bottom align-middle"
                                >
                                  <td className="ps-0 py-3 text-secondary fw-medium">
                                    <span
                                      style={{
                                        color: leave.color,
                                        marginRight: "8px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      ●
                                    </span>
                                    {leave.name}
                                  </td>
                                  <td className="text-center py-3">
                                    {leave.total}
                                  </td>
                                  <td className="text-center py-3 fw-bold text-danger">
                                    {leave.used}
                                  </td>
                                  <td className="text-end pe-0 py-3">
                                    <div className="d-flex align-items-center justify-content-end gap-3">
                                      <span
                                        className={`fw-bold ${leave.available <= 1 ? "text-danger" : "text-success"}`}
                                        style={{ fontSize: "14px" }}
                                      >
                                        {leave.available}
                                      </span>
                                      <OverlayTrigger
                                        overlay={
                                          <Tooltip>
                                            Policy: {leave.name}
                                          </Tooltip>
                                        }
                                      >
                                        <Info
                                          size={14}
                                          className="text-muted cursor-pointer"
                                        />
                                      </OverlayTrigger>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="text-center py-3 text-muted"
                                >
                                  No leave types configured
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <AlertCircle size={48} className="text-muted mb-3" />
                <h5 className="text-muted">
                  No matching employee records found
                </h5>
              </Col>
            )}
          </Row>
        )}
      </Container>

      <style>{`
        /* --- Sidebar Fix --- */
        .page-layout {
          min-height: 100vh;
          width: 100%;
          transition: padding 0.3s ease;
        }

        /* Jab screen 992px se badi ho, tab sidebar ke liye space chhodein */
       @media (min-width: 992px) {
  .page-layout {
    margin-left: 280px; /* Sidebar ki width */
    width: calc(100% - 280px);
    min-height: 100vh;
  }
}

        /* Agar aapka sidebar 260px wala bada sidebar hai, toh 80px ko 260px kar dein */

        .leave-table-box {
          max-height: 250px;
          overflow-y: auto;
          position: relative;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #00A86B; 
          border-radius: 10px; 
        }

        .employee-card { transition: transform 0.2s ease; }
        .employee-card:hover { transform: translateY(-3px); }
        .sticky-top { background-color: inherit !important; }
        .cursor-pointer { cursor: help; }

        ${isDark ? ".table thead th { background-color: #2d3748 !important; }" : ""}
      `}</style>
    </div>
  );
};

export default LeaveBalances;
