import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { ShieldCheck, Briefcase, UserCircle, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoleDashboard() {
  const navigate = useNavigate();
  
  // User data nikalna localStorage se
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Role ko handle karna (agar role nahi milta toh 'user' default rakha hai)
  const role = (user.role || 'accountant').toLowerCase();

  const handleLogout = () => {
    localStorage.clear(); // Saara data clear karein
    window.location.href = '/login'; // Login page par redirect
  };

  // Roles ke basis par cards define karna
  const cards = [
    // 1. Admin Card
    (role === 'admin' || role === 'superadmin') && {
      title: 'Admin Panel',
      text: 'Access employee management, attendance logs, and system settings.',
      icon: ShieldCheck,
      path: '/admin',
      button: 'Open Admin Panel',
      color: '#10b981'
    },
    // 2. Payroll Card
    (role === 'salary clerk' || role === 'hr' || role === 'admin') && {
      title: 'Payroll Management',
      text: 'Process salaries, manage payslips, and tax components.',
      icon: Briefcase,
      path: '/payroll',
      button: 'Manage Payroll',
      color: '#6366f1'
    },
    // 3. Employee/General Dashboard Card
    (role === 'accountant' || role === 'hr' || role === 'admin') && {
      title: 'Employee Dashboard',
      text: 'View your personal profile, attendance, and download payslips.',
      icon: LayoutDashboard,
      path: '/dashboard',
      button: 'My Workspace',
      color: '#f59e0b'
    }
  ].filter(Boolean);

  return (
    <div className="p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* Top Header with User Info & Logout */}
      <div className="d-flex justify-content-between align-items-center mb-5 bg-white p-3 rounded-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary p-2 rounded-circle text-white">
            <UserCircle size={30} />
          </div>
          <div>
            <h4 className="fw-bold m-0">Welcome, {user.name || 'User'}</h4>
            <Badge bg="info" className="text-capitalize">{role}</Badge>
          </div>
        </div>
        <Button variant="outline-danger" onClick={handleLogout} className="d-flex align-items-center gap-2 rounded-3">
          <LogOut size={18} /> Logout
        </Button>
      </div>

      <div className="text-center mb-5">
        <h2 className="fw-bold">Select Workspace</h2>
        <p className="text-muted">Choose a module to continue based on your permissions.</p>
      </div>

      <Row className="g-4 justify-content-center">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Col lg={4} md={6} key={index}>
              <Card className="h-100 border-0 shadow-sm rounded-4 transition-all hover-shadow" style={{ overflow: 'hidden' }}>
                <div style={{ height: '6px', backgroundColor: card.color }}></div>
                <Card.Body className="p-4">
                  <div 
                    className="rounded-4 d-inline-flex align-items-center justify-content-center mb-4" 
                    style={{ width: 60, height: 60, backgroundColor: `${card.color}15`, color: card.color }}
                  >
                    <Icon size={30} />
                  </div>
                  <h4 className="fw-bold mb-3">{card.title}</h4>
                  <p className="text-muted mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {card.text}
                  </p>
                  <Button 
                    style={{ backgroundColor: card.color, border: 'none' }}
                    className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
                    onClick={() => navigate(card.path)}
                  >
                    {card.button} <ArrowRight size={18} />
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Role missing warning (Debug tool) */}
      {cards.length === 0 && (
        <div className="text-center mt-5 p-5 bg-white rounded-4 shadow-sm">
          <h4 className="text-danger">No Role Assigned!</h4>
          <p>Please contact admin to assign a role to your account: <b>{user.email}</b></p>
          <Button variant="secondary" onClick={handleLogout}>Back to Login</Button>
        </div>
      )}
    </div>
  );
}