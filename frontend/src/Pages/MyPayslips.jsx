import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Container, Table } from "react-bootstrap";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function MyPayslips() {
  const [slips, setSlips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const email = JSON.parse(localStorage.getItem("user") || "{}").email;

  useEffect(() => {
    if (!email) return;
    axios.get(`${API}/payroll/me/${encodeURIComponent(email)}`)
      .then((response) => setSlips(Array.isArray(response.data) ? response.data : []))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load payslips."));
  }, [email]);

  return (
    <Container fluid className="payroll-page-layout px-3 px-md-4 py-4">
      <h2 className="fw-bold mb-4">My Payslips</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {!error && !slips.length && <Alert variant="info">No payslips have been generated for your employee profile yet.</Alert>}
      <Card className="border-0 shadow-sm">
        <Table responsive hover className="mb-0 align-middle">
          <thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th /></tr></thead>
          <tbody>
            {slips.map((slip) => (
              <tr key={slip._id}>
                <td>{slip.month}</td>
                <td>₹{Number(slip.grossSalary || slip.baseSalary).toLocaleString()}</td>
                <td>₹{Number(slip.totalDeductions || 0).toLocaleString()}</td>
                <td className="fw-bold">₹{Number(slip.netSalary).toLocaleString()}</td>
                <td><Badge bg="success">{slip.status}</Badge></td>
                <td><Button size="sm" variant="outline-success" onClick={() => setSelected(slip)}>View details</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {selected && (
        <Card className="border-0 shadow-sm mt-4">
          <Card.Body>
            <div className="d-flex justify-content-between"><h4>{selected.month} — {selected.employeeName}</h4><Button size="sm" variant="light" onClick={() => setSelected(null)}>Close</Button></div>
            <p className="text-muted">Final net pay: ₹{Number(selected.netSalary).toLocaleString()}</p>
            <h6 className="text-success border-bottom pb-2">Earnings</h6>
            <Line label="Basic salary" amount={selected.baseSalary} />
            {(selected.earnings || []).map((line, index) => <Line key={`e-${index}`} label={line.name} amount={line.amount} positive />)}
            <h6 className="text-danger border-bottom pb-2 mt-4">Deductions</h6>
            {(selected.deductionLines || []).map((line, index) => <Line key={`d-${index}`} label={line.name} amount={line.amount} />)}
            <div className="bg-dark text-white rounded p-3 mt-4 d-flex justify-content-between"><strong>Net salary</strong><strong>₹{Number(selected.netSalary).toLocaleString()}</strong></div>
          </Card.Body>
        </Card>
      )}
      <style>{`
        .payroll-page-layout { min-height: 100vh; }
        @media (min-width: 992px) {
          .payroll-page-layout { margin-left: 280px; width: calc(100% - 280px); }
        }
        @media (max-width: 991px) {
          .payroll-page-layout { margin-left: 0; width: 100%; }
        }
      `}</style>
    </Container>
  );
}

function Line({ label, amount, positive }) {
  return <div className="d-flex justify-content-between small mb-2"><span>{label}</span><span className={positive ? "text-success" : "text-danger"}>{positive ? "+" : "-"} ₹{Number(amount || 0).toLocaleString()}</span></div>;
}
