import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Form, InputGroup, Collapse, Stack, Dropdown, Modal, Button } from "react-bootstrap";
import { 
  LayoutDashboard, Calendar, Search, Users, CalendarDays, 
  ChevronDown, ChevronRight, Circle, LogOut, LogIn, 
  ShieldCheck, Briefcase, UserCircle, DollarSign, Settings,
  Clock, BarChart3, Palette, HelpCircle, UserRound, KeyRound
} from "lucide-react";
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toggleTheme } = useTheme();
  
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [openDropdown, setOpenDropdown] = useState(""); 
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const rawRole = (parsedUser.role || 'accountant').toLowerCase();
        const role = rawRole === 'user' || rawRole === 'employee'
          ? 'accountant'
          : rawRole === 'payroll' || rawRole === 'company'
            ? 'salary clerk'
            : rawRole;
        setUserRole(role);
        setUserName(parsedUser.name || 'User');
        setUserEmail(parsedUser.email || '');
        
        if (location.pathname.startsWith("/leave")) setOpenDropdown("leave");
        if (location.pathname.startsWith("/payroll")) setOpenDropdown("payroll");
      }
    } catch (error) {
      setUserRole('user');
    }
  }, [location.pathname]);

  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? "" : name);
  };

  const searchableItems = userRole === 'admin'
    ? [
      { label: 'Admin Panel', to: '/admin' },
      { label: 'Employees', to: '/employees' },
      { label: 'Calendar', to: '/calendar' },
      { label: 'Attendance', to: '/attendance' },
      { label: 'Employee Category', to: '/admin?tab=jobs' },
      { label: 'Designation', to: '/admin?tab=depts' },
      { label: 'Employee Type', to: '/admin?tab=types' },
      { label: 'Office Type', to: '/admin?tab=office' },
      { label: 'Districts', to: '/admin?tab=circles' },
    ]
    : [
      { label: 'Dashboard', to: '/' },
      { label: 'Calendar', to: '/calendar' },
      { label: 'Employees', to: '/employees' },
      { label: 'Attendance', to: '/attendance' },
      { label: 'Leave Applications', to: '/leave' },
      { label: 'Leave Balances', to: '/leave/balances' },
      { label: 'Leave Types', to: '/leave/types' },
      { label: 'Leave Policies', to: '/leave/policies' },
      { label: 'My Payslips', to: '/payroll/payslips' },
      { label: 'Salary Components', to: '/payroll/components' },
      { label: 'Allowances and Deductions', to: '/payroll/allowances-deductions' },
      { label: 'Loans and Advances', to: '/payroll/loans-advances' },
      { label: 'Arrear', to: '/payroll/arrear' },
      ...(userRole === 'salary clerk' || userRole === 'hr'
        ? [
          { label: 'Payroll Panel', to: '/payroll' },
          { label: 'Analytics', to: '/analytics' },
        ]
        : []),
    ];

  const searchResults = searchTerm.trim()
    ? searchableItems.filter(({ label }) =>
      label.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    : [];

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && searchResults.length === 1) {
      event.preventDefault();
      navigate(searchResults[0].to);
      setSearchTerm("");
    }
  };

  const NavItem = ({ to, icon: Icon, label, active, isDropdown = false, isOpen = false, onClick }) => {
    const [hover, setHover] = useState(false);
    const activeColor = "#00A86B";
    
    const baseStyle = {
      textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: "10px", transition: "all 0.2s ease", fontSize: "0.9rem",
      fontWeight: active ? "600" : "500", border: "none", width: "100%", cursor: "pointer",
      backgroundColor: active ? (isDark ? "#2D3748" : "#E6F7F0") : (hover ? (isDark ? "#2D3748" : "#F8F9FA") : "transparent"),
      color: active || hover ? (isDark ? "#F7FAFC" : activeColor) : (isDark ? "#CBD5E0" : "#4A5568"),
      marginBottom: "4px"
    };

    const content = (
      <>
        <div className="d-flex align-items-center gap-3">
          {Icon && <Icon size={19} color={active || hover ? activeColor : (isDark ? "#A0AEC0" : "#718096")} />}
          <span>{label}</span>
        </div>
        {isDropdown && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </>
    );

    return isDropdown ? (
      <button style={baseStyle} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{content}</button>
    ) : (
      <Link to={to} style={baseStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{content}</Link>
    );
  };

  const SubMenuItem = ({ to, label, active }) => {
    const isActive = active !== undefined ? active : location.pathname === to;
    return (
      <Link to={to} style={{ 
        textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", 
        padding: "8px 12px", fontSize: "0.85rem", borderRadius: "8px",
        color: isActive ? "#00A86B" : (isDark ? "#CBD5E0" : "#4A5568"), 
        fontWeight: isActive ? "600" : "400",
        backgroundColor: isActive ? (isDark ? "rgba(0,168,107,0.1)" : "rgba(0,168,107,0.05)") : "transparent"
      }}>
        <Circle size={6} fill={isActive ? "#00A86B" : "transparent"} stroke={isActive ? "#00A86B" : (isDark ? "#4A5568" : "#CBD5E0")} /> 
        {label}
      </Link>
    );
  };

  if (!userRole) return null;

  return (
    <aside className={`border-end d-none d-lg-flex flex-column ${isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light'}`} 
           style={{ 
             width: "280px", 
             boxSizing: "border-box",
             height: "100vh", 
             position: "fixed", 
             left: 0, 
             top: 0, 
             overflowY: "auto", 
             padding: "1.5rem 1rem", 
             zIndex: 1100 
           }}>
      
      <div className="flex-grow-1">
        <Stack direction="horizontal" gap={2} className="mb-4 px-2" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          <div style={{ width: "32px", height: "32px", backgroundColor: "#00A86B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontWeight: "bold" }}>H</div>
          <span style={{ fontSize: "1.3rem", fontWeight: "800", color: isDark ? "#F7FAFC" : "#1A202C" }}>HWB<span style={{ color: "#00A86B" }}>.</span></span>
        </Stack>

        <div className="position-relative mb-4">
          <InputGroup className={`shadow-sm border-0 ${isDark ? 'bg-secondary' : 'bg-light'}`} style={{ borderRadius: "10px" }}>
            <InputGroup.Text className="bg-transparent border-0 ps-3 text-muted"><Search size={16} /></InputGroup.Text>
            <Form.Control
              aria-label="Search navigation"
              placeholder="Quick search..."
              className="bg-transparent border-0 shadow-none text-muted"
              style={{ fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </InputGroup>
          {searchTerm.trim() && (
            <div
              className={`position-absolute start-0 end-0 mt-2 p-2 rounded-3 shadow-lg border ${isDark ? 'bg-dark border-secondary' : 'bg-white'}`}
              style={{ zIndex: 1200 }}
            >
              {searchResults.length > 0 ? searchResults.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSearchTerm("")}
                  className={`d-flex align-items-center gap-2 rounded-2 px-2 py-2 small text-decoration-none ${isDark ? 'text-light' : 'text-dark'}`}
                >
                  <Search size={14} className="text-success" />
                  {item.label}
                </Link>
              )) : (
                <div className="small text-muted px-2 py-2">No matching page found.</div>
              )}
            </div>
          )}
        </div>

        <Stack gap={4}>
          {userRole === 'admin' ? (
            <div>
              <h6 className="sidebar-heading">Administration</h6>
              <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" active={location.pathname.startsWith("/admin")} />
              
              <div style={{ marginLeft: "22px", borderLeft: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`, paddingLeft: "10px", marginTop: "4px" }}>
                <Stack gap={1}>
                  <SubMenuItem to="/admin?tab=overview" label="Overview" active={location.pathname === "/admin" && (!currentTab || currentTab === "overview")} />
                  <SubMenuItem to="/admin?tab=attendance" label="Attendance" active={location.pathname === "/admin" && currentTab === "attendance"} />
                  <SubMenuItem to="/admin?tab=leaves" label="Leaves" active={location.pathname === "/admin" && currentTab === "leaves"} />
                  <SubMenuItem to="/admin?tab=jobs" label="Employee_Category" active={location.pathname === "/admin" && currentTab === "jobs"} />
                  <SubMenuItem to="/admin?tab=depts" label="Designation" active={location.pathname === "/admin" && currentTab === "depts"} />
                  <SubMenuItem to="/admin?tab=types" label="Employee_Type" active={location.pathname === "/admin" && currentTab === "types"} />
                  <SubMenuItem to="/admin?tab=office" label="Office_Type" active={location.pathname === "/admin" && currentTab === "office"} />
                  <SubMenuItem to="/admin?tab=circles" label="Districts" active={location.pathname === "/admin" && currentTab === "circles"} />
                </Stack>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h6 className="sidebar-heading">Overview</h6>
                <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === "/" || location.pathname === "/dashboard"} />
                <NavItem to="/calendar" icon={Calendar} label="Calendar" active={location.pathname === "/calendar"} />
              </div>

              {userRole !== 'admin' && (
                <div>
                  <h6 className="sidebar-heading">Workforce</h6>
                  <Stack gap={1}>
                    <NavItem to="/employees" icon={Users} label="Employees" active={location.pathname === "/employees"} />
                    <NavItem to="/attendance" icon={Clock} label="Attendance" active={location.pathname === "/attendance"} />
                    <div className="w-100">
                      <NavItem label="Leave Management" icon={CalendarDays} isDropdown isOpen={openDropdown === "leave"} onClick={() => toggleDropdown("leave")} active={location.pathname.startsWith("/leave")} />
                      <Collapse in={openDropdown === "leave"}>
                        <div style={{ marginLeft: "22px", borderLeft: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`, paddingLeft: "10px", marginTop: "4px" }}>
                          <Stack gap={1}>
                            <SubMenuItem to="/leave" label="Applications" />
                            <SubMenuItem to="/leave/balances" label="Leave Balances" />
                            <SubMenuItem to="/leave/types" label="Leave Types" />
                            <SubMenuItem to="/leave/policies" label="Policies" />
                          </Stack>
                        </div>
                      </Collapse>
                    </div>
                    <div className="w-100">
                      <NavItem label="Payroll" icon={DollarSign} isDropdown isOpen={openDropdown === "payroll"} onClick={() => toggleDropdown("payroll")} active={location.pathname.startsWith("/payroll")} />
                      <Collapse in={openDropdown === "payroll"}>
                        <div style={{ marginLeft: "22px", borderLeft: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`, paddingLeft: "10px", marginTop: "4px" }}>
                          <Stack gap={1}>
                            <SubMenuItem to="/payroll/payslips" label="My Payslips" />
                            <SubMenuItem to="/payroll/components" label="Salary Components" />
                            <SubMenuItem to="/payroll/allowances-deductions" label="Allowances and Deduction" />
                            <SubMenuItem to="/payroll/loans-advances" label="Loan and Advances" />
                            <SubMenuItem to="/payroll/arrear" label="Arrear" />
                          </Stack>
                        </div>
                      </Collapse>
                    </div>
                  </Stack>
                </div>
              )}

              {(userRole === 'salary clerk' || userRole === 'hr') && (
                <div>
                  <h6 className="sidebar-heading">Payroll Expert</h6>
                  <Stack gap={1}>
                    <NavItem to="/payroll" icon={Briefcase} label="Payroll Panel" active={location.pathname === "/payroll"} />
                    <NavItem to="/analytics" icon={BarChart3} label="Analytics" active={location.pathname === "/analytics" || location.pathname === "/payroll-deshboard"} />
                  </Stack>
                </div>
              )}
            </>
          )}
        </Stack>
      </div>

      <div className="mt-auto pt-3 border-top" style={{ borderColor: isDark ? '#4A5568' : '#EDF2F7' }}>
        <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3" style={{ background: isDark ? '#2D3748' : '#F8F9FB' }}>
          <UserCircle size={32} color={isDark ? "#A0AEC0" : "#718096"} />
          <div className="overflow-hidden">
            <div className="fw-bold small text-truncate" style={{ color: isDark ? '#fff' : '#1A202C' }}>{userName}</div>
            <div className="text-success" style={{ fontSize: '10px', fontWeight: '700' }}>● {userRole.toUpperCase()}</div>
          </div>
        </div>
        <Dropdown drop="up" className="w-100">
          <Dropdown.Toggle as="div" style={{ cursor: 'pointer' }}>
            <NavItem icon={Settings} label="Account Settings" isDropdown={false} />
          </Dropdown.Toggle>
          <Dropdown.Menu className={`w-100 shadow-lg border-0 p-2 ${isDark ? 'bg-dark border-secondary' : 'bg-white'}`} style={{ borderRadius: '12px', marginBottom: '8px' }}>
            {isAuthenticated ? (
              <>
                <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-3" onClick={() => setShowProfile(true)}>
                  <UserRound size={16} /> My Profile
                </Dropdown.Item>
                <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-3" onClick={toggleTheme}>
                  <Palette size={16} /> {isDark ? 'Light Mode' : 'Dark Mode'}
                </Dropdown.Item>
                <Dropdown.Item
                  as="a"
                  href="mailto:support@hwb.com?subject=HWB%20Support"
                  className="d-flex align-items-center gap-2 py-2 rounded-3"
                >
                  <HelpCircle size={16} /> Help & Support
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-danger fw-bold d-flex align-items-center gap-2 py-2 rounded-3" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item className="text-primary fw-bold d-flex align-items-center gap-2 py-2 rounded-3" onClick={() => navigate('/login')}>
                <LogIn size={16} /> Sign In
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
        <Modal.Header closeButton className={isDark ? 'bg-dark text-light border-secondary' : ''}>
          <Modal.Title className="d-flex align-items-center gap-2">
            <UserCircle size={24} className="text-success" /> My Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDark ? 'bg-dark text-light' : ''}>
          <div className="text-center mb-4">
            <div className="rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 64, height: 64 }}>
              <UserCircle size={36} />
            </div>
            <h5 className="mb-1">{userName}</h5>
            <span className="badge text-bg-success">{userRole.toUpperCase()}</span>
          </div>
          <div className="rounded-3 border p-3">
            <div className="small text-muted mb-1">Email address</div>
            <div className="fw-semibold text-break">{userEmail || 'Not available'}</div>
          </div>
          <div className="rounded-3 border p-3 mt-3">
            <div className="d-flex align-items-center gap-2">
              <KeyRound size={16} className="text-success" />
              <div>
                <div className="fw-semibold">Password security</div>
                <div className="small text-muted">Use Forgot password on the login screen to reset it securely.</div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className={isDark ? 'bg-dark border-secondary' : ''}>
          <Button variant="success" onClick={() => setShowProfile(false)}>Done</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .sidebar-heading { font-size: 0.65rem; text-transform: uppercase; color: #A0AEC0; font-weight: 700; letter-spacing: 1px; margin-left: 12px; margin-bottom: 12px; }
        aside::-webkit-scrollbar { width: 4px; }
        aside::-webkit-scrollbar-thumb { background: ${isDark ? '#4A5568' : '#CBD5E0'}; border-radius: 10px; }
      `}</style>
    </aside>
  );
}