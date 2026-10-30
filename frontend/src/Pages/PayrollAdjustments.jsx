import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Container, Form, Table } from "react-bootstrap";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function PayrollAdjustments({ type }) {
  const isLoan = type === "LoanAdvance";
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const load = () => Promise.all([
    axios.get(`${API}/payroll-adjustments/${type}`),
    axios.get(`${API}/employee`),
  ]).then(([items, employeeResponse]) => { setRows(items.data); setEmployees(employeeResponse.data); }).catch(() => setMessage("Unable to load payroll data."));
  useEffect(() => { load(); }, [type]);
  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API}/payroll-adjustments/${type}`, {
        ...form,
        principal: Number(form.principal || 0),
        outstandingBalance: Number(form.outstandingBalance || form.principal || 0),
        installmentAmount: Number(form.installmentAmount || 0),
        amount: Number(form.amount || 0),
        status: isLoan ? "Active" : "Approved",
      });
      setForm({}); setMessage("Saved successfully."); load();
    } catch (error) { setMessage(error.response?.data?.message || "Unable to save."); }
  };
  return <Container fluid className="payroll-page-layout px-3 px-md-4 py-4">
    <h2 className="fw-bold mb-4">{isLoan ? "Loans and Advances" : "Arrears"}</h2>
    {message && <Alert variant="info">{message}</Alert>}
    <Card className="border-0 shadow-sm p-3 mb-4"><Form onSubmit={submit} className="row g-2">
      <div className="col-md-3"><Form.Select required value={form.employeeId || ""} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name}</option>)}</Form.Select></div>
      <div className="col-md-2"><Form.Control required placeholder="Title" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      {isLoan ? <><div className="col-md-2"><Form.Control required type="number" placeholder="Principal" value={form.principal || ""} onChange={(e) => setForm({ ...form, principal: e.target.value })} /></div><div className="col-md-2"><Form.Control required type="number" placeholder="Installment" value={form.installmentAmount || ""} onChange={(e) => setForm({ ...form, installmentAmount: e.target.value })} /></div></> : <><div className="col-md-2"><Form.Control required placeholder="Period" value={form.period || ""} onChange={(e) => setForm({ ...form, period: e.target.value })} /></div><div className="col-md-2"><Form.Control required type="number" placeholder="Amount" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></>}
      <div className="col-md-1"><Button type="submit" variant="success">Save</Button></div>
    </Form></Card>
    <Card className="border-0 shadow-sm"><Table responsive hover><thead><tr><th>Employee</th><th>Title</th><th>{isLoan ? "Outstanding" : "Amount"}</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id}><td>{row.employeeId?.name || "—"}</td><td>{row.title}</td><td>₹{Number(row.outstandingBalance ?? row.amount).toLocaleString()}</td><td>{row.status}</td></tr>)}</tbody></Table></Card>
    <style>{`
      .payroll-page-layout { min-height: 100vh; }
      @media (min-width: 992px) {
        .payroll-page-layout { margin-left: 280px; width: calc(100% - 280px); }
      }
      @media (max-width: 991px) {
        .payroll-page-layout { margin-left: 0; width: 100%; }
      }
    `}</style>
  </Container>;
}
