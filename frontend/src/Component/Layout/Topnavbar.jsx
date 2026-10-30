import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Navbar, Nav, Container, Badge, Offcanvas } from 'react-bootstrap';
import { Moon, Sun, LayoutGrid, LogIn, LogOut, ShieldCheck, Briefcase, User, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function Topnavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  
  let user = {};
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    user = {};
  }

  const rawRole = (user.role || 'accountant').toLowerCase();
  const role = rawRole === 'payroll' || rawRole === 'company' ? 'salary clerk' : rawRole === 'user' || rawRole === 'employee' ? 'accountant' : rawRole;
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const pageTitle = {
    '/': role === 'salary clerk' ? 'Payroll Workspace' : role === 'admin' ? 'Admin Workspace' : 'User Workspace',
    '/dashboard': 'Role Dashboard',
    '/employees': 'Employees',
    '/calendar': 'Calendar',
    '/attendance': 'Attendance',
    '/attendence': 'Attendance',
    '/leave': 'Leaves',
    '/admin': 'Admin Panel',
    '/payroll': 'Payroll',
    '/payroll-deshboard': 'Payroll Dashboard',
    '/payroll/components': 'Salary Components',
  }[location.pathname] || 'Workspace';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const path = role === 'salary clerk' ? '/payroll' : role === 'admin' ? '/admin' : '/login';
    navigate(path, { replace: true });
  };

  const roleBadge = role === 'salary clerk' 
    ? { label: 'Salary Clerk', icon: Briefcase, color: 'warning' } 
    : role === 'hr'
      ? { label: 'HR', icon: User, color: 'info' }
    : role === 'admin' 
      ? { label: 'Admin', icon: ShieldCheck, color: 'danger' } 
      : { label: 'Accountant', icon: User, color: 'success' };
  
  const RoleIcon = roleBadge.icon;
  const menuItems = role === 'admin'
    ? [
      ['/admin', 'Admin Panel'],
      ['/employees', 'Employees'],
      ['/calendar', 'Calendar'],
      ['/attendance', 'Attendance'],
    ]
    : [
      ['/dashboard', 'Dashboard'],
      ['/employees', 'Employees'],
      ['/calendar', 'Calendar'],
      ['/attendance', 'Attendance'],
      ['/leave', 'Leaves'],
      ...(role === 'salary clerk' || role === 'hr' ? [['/payroll', 'Payroll']] : []),
    ];

  return (
    <>
      <Navbar 
        expand="lg" 
        sticky="top"
        className={`main-top-navbar border-bottom px-2 px-md-4 py-2 ${theme === 'dark' ? 'bg-dark navbar-dark' : 'bg-white'}`}
        style={{ minHeight: '68px', zIndex: 1050 }}
      >
        <Container fluid>
          {/* LEFT SIDE: Title & Branding */}
          <div className="d-flex flex-column">
            <span className={`small text-uppercase fw-semibold d-none d-sm-block ${theme === 'dark' ? 'text-light' : 'text-muted'}`} style={{ fontSize: '10px' }}>
              HWB HR Suite
            </span>
            <Navbar.Brand className={`mb-0 fw-bold fs-5 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
              {pageTitle}
            </Navbar.Brand>
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <Button
            type="button"
            aria-label="Open navigation menu"
            className="d-lg-none border-0 shadow-none bg-transparent p-2"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu size={24} className={theme === 'dark' ? 'text-white' : 'text-dark'} />
          </Button>

          {/* COLLAPSIBLE CONTENT */}
          <Navbar.Collapse id="top-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-2 pt-3 pt-lg-0">
              
              {/* ROLE BADGE */}
              <Badge 
                pill 
                bg={`${roleBadge.color}-subtle`} 
                className={`text-${roleBadge.color} px-3 py-2 d-flex align-items-center gap-2 border border-${roleBadge.color}`}
                style={{ fontWeight: '600' }}
              >
                <RoleIcon size={14} /> 
                <span className="d-lg-inline">{roleBadge.label} Workspace</span>
              </Badge>

              {/* ROLE BOARD BUTTON */}
              {/* <Button 
                variant="outline-primary" 
                size="sm" 
                className="d-flex align-items-center gap-2 rounded-3 px-3" 
                onClick={() => navigate('/dashboard')}
              >
                <LayoutGrid size={16} /> 
                <span className="d-inline d-lg-none d-xl-inline">Role Board</span>
              </Button> */}

              {/* THEME TOGGLE */}
              <Button 
                variant={theme === 'dark' ? 'outline-light' : 'outline-secondary'} 
                size="sm" 
                className="d-flex align-items-center gap-2 rounded-3 px-3" 
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span className="d-inline d-lg-none d-xl-inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </Button>

              {/* LOGIN / LOGOUT */}
              {isAuthenticated ? (
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="d-flex align-items-center gap-2 rounded-3 px-3" 
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> 
                  <span className="d-inline d-lg-none d-xl-inline">Logout</span>
                </Button>
              ) : (
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  className="d-flex align-items-center gap-2 rounded-3 px-3" 
                  onClick={() => navigate('/login')}
                >
                  <LogIn size={16} /> 
                  <span className="d-inline d-lg-none d-xl-inline">Login</span>
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Offcanvas
        show={showMobileMenu}
        onHide={() => setShowMobileMenu(false)}
        placement="start"
        className={theme === 'dark' ? 'bg-dark text-light' : ''}
      >
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : undefined}>
          <Offcanvas.Title className="fw-bold">
            HWB<span className="text-success">.</span>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column gap-2">
            {menuItems.map(([path, label]) => (
              <Nav.Link
                key={path}
                href={path}
                onClick={() => setShowMobileMenu(false)}
                className={`rounded-3 px-3 py-2 ${location.pathname === path ? 'bg-success text-white' : theme === 'dark' ? 'text-light' : 'text-dark'}`}
              >
                {label}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      <style>{`
        /* Desktop Screens (992px se upar) */
     @media (min-width: 992px) {
  .main-top-navbar {
    margin-left: 280px; /* Sidebar ki width */
    width: calc(100% - 280px) !important;
  }
}

        /* Mobile Screens par Navbar full width honi chahiye */
        @media (max-width: 991px) {
          .main-top-navbar {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default Topnavbar;