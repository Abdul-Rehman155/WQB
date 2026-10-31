import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Container, Table } from "react-bootstrap";
import { CalendarDays, Eye, X } from "lucide-react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function MyPayslips() {
  const [slips, setSlips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const email = storedUser.email?.trim().toLowerCase();
  const role = (storedUser.role || "").trim().toLowerCase();
  const canViewPayroll = ["admin", "hr", "salary clerk", "payroll", "company"].includes(role);
  const monthYear = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
  const employeeId = (slip) => {
    const employee = slip?.employeeId;
    return employee?.employeeId || employee?.empId || (employee?._id ? `EMP-${employee._id.slice(-6).toUpperCase()}` : "—");
  };

  useEffect(() => {
    if (!email && !canViewPayroll) {
      setLoading(false);
      return;
    }

    const request = canViewPayroll
      ? axios.get(`${API}/payroll/${encodeURIComponent(monthYear)}`)
      : axios.get(`${API}/payroll/me/${encodeURIComponent(email)}`);

    request
      .then((response) => {
        setSlips(Array.isArray(response.data) ? response.data : []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load payslips."))
      .finally(() => setLoading(false));
  }, [canViewPayroll, email, monthYear]);

  return (
    <Container fluid className="payroll-page-layout px-3 px-md-4 py-4">
      <h2 className="fw-bold mb-4">My Payslips</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && !slips.length && (
        <Alert variant="info">
          {canViewPayroll
            ? `No payslips have been generated for ${monthYear}.`
            : "No payslips have been generated for your employee profile yet."}
        </Alert>
      )}
      {!loading && !error && slips.length > 0 && canViewPayroll && (
        <Alert variant="success">Payroll details for {monthYear}</Alert>
      )}
      <Card className="border-0 shadow-sm">
        <Table responsive hover className="mb-0 align-middle">
          <thead>
            <tr>
              {canViewPayroll && <th>Employee</th>}
              <th>Period</th>
              <th>Pay date</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((slip) => (
              <tr key={slip._id}>
                {canViewPayroll && <td>{slip.employeeName || slip.employeeId?.name || "—"}</td>}
                <td>{slip.month}</td>
                <td>{slip.payDate || "—"}</td>
                <td>₹{Number(slip.grossSalary || slip.baseSalary).toLocaleString()}</td>
                <td>₹{Number(slip.totalDeductions || 0).toLocaleString()}</td>
                <td className="fw-bold">₹{Number(slip.netSalary).toLocaleString()}</td>
                <td><Badge bg="success">{slip.status}</Badge></td>
                <td>
                  <Button
                    variant="link"
                    className="text-secondary p-1"
                    aria-label={`View payslip for ${slip.employeeName || slip.employeeId?.name || "employee"}`}
                    onClick={() => setSelected(slip)}
                  >
                    <Eye size={21} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {selected && (
        <>
          <div className="payslip-backdrop" onClick={() => setSelected(null)} />
          <aside className="payslip-drawer" aria-label="Payslip details">
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
              <div>
                <h4 className="mb-1">Pay Stub</h4>
                <div className="text-muted">{selected.month}</div>
              </div>
              <Button variant="light" className="p-2" aria-label="Close payslip details" onClick={() => setSelected(null)}>
                <X size={20} />
              </Button>
            </div>

            <div className="bg-light rounded-3 p-3 mb-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">{selected.employeeName || selected.employeeId?.name || "Employee"}</h5>
                <div className="text-muted">{employeeId(selected)}</div>
              </div>
              <div className="text-end">
                <small className="text-muted d-block">Pay Date</small>
                <strong><CalendarDays size={15} className="me-1" />{selected.payDate || "—"}</strong>
              </div>
            </div>

            <h6 className="fw-bold mb-2">Attendance</h6>
            <div className="payslip-section mb-4">
              <Line label="Working Days" value={Number(selected.presentDays || 0) + Number(selected.absentDays || 0)} />
              <Line label="Present Days" value={selected.presentDays || 0} valueClass="text-success" />
              <Line label="Absent Days" value={selected.absentDays || 0} valueClass="text-danger" />
            </div>

            <h6 className="fw-bold text-success mb-2">Earnings</h6>
            <div className="payslip-section mb-4">
              <Line label="Basic salary" amount={selected.baseSalary} positive />
              {(selected.earnings || []).map((line, index) => (
                <Line key={`e-${index}`} label={line.name} amount={line.amount} positive />
              ))}
              <Line label="Gross salary" amount={selected.grossSalary} positive strong />
            </div>

            <h6 className="fw-bold text-danger mb-2">Deductions</h6>
            <div className="payslip-section mb-4">
              {(selected.deductionLines || []).map((line, index) => (
                <Line key={`d-${index}`} label={line.name} amount={line.amount} />
              ))}
              <Line label="Total deductions" amount={selected.totalDeductions} strong />
            </div>

            <div className="bg-dark text-white rounded-3 p-3 d-flex justify-content-between align-items-center">
              <strong>Net salary</strong>
              <strong>₹{Number(selected.netSalary || 0).toLocaleString()}</strong>
            </div>
            <div className="text-center mt-3">
              <Badge bg={selected.status === "Paid" ? "success" : "primary"}>{selected.status}</Badge>
            </div>
          </aside>
        </>
      )}
      <style>{`
        .payroll-page-layout { min-height: 100vh; }
        @media (min-width: 992px) {
          .payroll-page-layout { margin-left: 280px; width: calc(100% - 280px); }
        }
        @media (max-width: 991px) {
          .payroll-page-layout { margin-left: 0; width: 100%; }
        }
        .payslip-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          z-index: 1190;
        }
        .payslip-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: min(460px, 100vw);
          height: 100vh;
          overflow-y: auto;
          background: var(--bs-body-bg, #fff);
          padding: 24px;
          box-shadow: -8px 0 24px rgba(15, 23, 42, 0.18);
          z-index: 1200;
        }
        .payslip-section {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }
        .payslip-section > div {
          padding: 9px 12px;
          border-bottom: 1px solid #edf0f2;
        }
        .payslip-section > div:last-child { border-bottom: 0; }
      `}</style>
    </Container>
  );
}

function Line({ label, amount, value, positive, strong, valueClass = "" }) {
  const displayValue = value !== undefined
    ? value
    : `${positive ? "+" : "-"} ₹${Number(amount || 0).toLocaleString()}`;
  return (
    <div className={`d-flex justify-content-between small ${strong ? "fw-bold" : ""}`}>
      <span>{label}</span>
      <span className={valueClass || (positive ? "text-success" : "text-danger")}>{displayValue}</span>
    </div>
  );
}
