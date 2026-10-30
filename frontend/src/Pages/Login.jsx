import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  InputGroup,
  ListGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const BASE_URL = "http://localhost:5000";

const capitalizeFirstLetter = (value) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const getRequestError = async (response, fallbackMessage) => {
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Keep the status-based message when the server does not return JSON.
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const retrySeconds = Number(retryAfter);
    const retryMessage = Number.isFinite(retrySeconds)
      ? ` Please try again in ${Math.max(1, Math.ceil(retrySeconds / 60))} minute(s).`
      : " Please try again later.";
    return new Error(`${data.message || "Too many requests."}${retryMessage}`);
  }

  return new Error(data.message || fallbackMessage);
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [resetCode, setResetCode] = useState("");
  
  // States for dynamic quick access dropdown selection
  const [emailList, setEmailList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "accountant",
  });

  const injectCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        .auth-body { 
            font-family: 'Inter', sans-serif; 
            background-color: #f9fafb; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            padding: 20px;
        }
        .main-wrapper { position: relative; width: 100%; max-width: 460px; }
        
        .corner-tl { position: absolute; top: -10px; left: -10px; width: 45px; height: 45px; border-top: 4px solid #10b981; border-left: 4px solid #10b981; border-radius: 8px 0 0 0; z-index: 0; }
        .corner-br { position: absolute; bottom: -10px; right: -10px; width: 45px; height: 45px; border-bottom: 4px solid #10b981; border-right: 4px solid #10b981; border-radius: 0 0 8px 0; z-index: 0; }
        
        .auth-card { background: #fff; border-radius: 24px; border: 1px solid #eef2f6; padding: 35px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); position: relative; z-index: 1; }
        
        .brand-green-text { color: #10b981 !important; font-weight: 600; text-decoration: none; }
        .btn-green { background-color: #10b981 !important; border: none !important; border-radius: 12px !important; padding: 14px !important; font-weight: 700 !important; color: white !important; transition: 0.3s; }
        .btn-green:hover { background-color: #0d9668 !important; transform: translateY(-1px); }
        .btn-green:disabled { background-color: #6ee7b7 !important; }

        .form-label { font-weight: 600; color: #0f172a; margin-bottom: 8px; font-size: 0.95rem; }
        
        .form-control { border-radius: 12px !important; padding: 12px 16px !important; border: 1px solid #d1d5db !important; font-size: 0.95rem; transition: all 0.2s; }
        .form-control:focus { border-color: #10b981 !important; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important; z-index: 3; }

        .password-group .form-control { border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; border-right: none !important; }
        .password-toggle-btn { 
            border: 1px solid #d1d5db !important; 
            border-left: none !important; 
            background: #fff !important; 
            color: #64748b !important; 
            border-radius: 0 12px 12px 0 !important; 
            display: flex;
            align-items: center;
        }
        .password-toggle-btn:hover { color: #10b981 !important; background: #f8fafc !important; }

        .title-underline { position: relative; display: inline-block; }
        .title-underline::after { content: ""; position: absolute; bottom: -5px; left: 0; width: 100%; height: 3px; background-color: #10b981; border-radius: 2px; }

        .diamond-divider { position: relative; margin: 35px 0; border-top: 1px solid #e5e7eb; }
        .diamond { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); width: 12px; height: 12px; background-color: #10b981; }

        .email-select-container { max-height: 160px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
    `;

  // Auth routes are mounted under /api/auth on the backend.
  const smartFetch = async (path, options = {}) => {
    return fetch(
      `${BASE_URL}${path.startsWith("/api") ? path : `/api/auth${path}`}`,
      options
    );
  };

// Frontend Handler inside AuthPage.jsx Component
const handleQuickAccess = async (roleName) => {
  setMessage({ type: "", text: "" });
  setLoading(true);
  setSelectedRole(roleName);
  setEmailList([]);
  setShowDropdown(false);

  try {
    const response = await fetch(
      `http://localhost:5000/api/auth/get-email-by-role/${encodeURIComponent(roleName)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `${roleName} ka email nahi mila.`);
    }

    if (Array.isArray(data) && data.length > 0) {
      setEmailList(data);
      setShowDropdown(true);

      // Auto fill pehla record (jaise: new1admin@gmail.com)
      setFormData((prev) => ({
        ...prev,
        email: data[0].email,
        password: "",
      }));

      setMode("login");
      setMessage({
        type: "success",
        text: `Role '${roleName}' ke total ${data.length} user(s) mile. Dropdown se select karein.`,
      });
    }
  } catch (error) {
    setMessage({
      type: "danger",
      text: error.message,
    });
  } finally {
    setLoading(false);
  }
};

  const handleSelectUserEmail = (selectedEmail) => {
    setFormData((prev) => ({
      ...prev,
      email: selectedEmail,
    }));
    setShowDropdown(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      return setMessage({
        type: "danger",
        text: "Kripya reset code generator ke liye pehle email darj karein.",
      });
    }
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await smartFetch("/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!response.ok) {
        throw await getRequestError(response, "Forgot password request failed");
      }
      const data = await response.json();

      setMessage({
        type: "success",
        text: data.message,
      });
      setMode("reset");
    } catch (error) {
      setMessage({ type: "danger", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode || !formData.password || !formData.confirmPassword) {
      return setMessage({
        type: "danger",
        text: "Email, reset code, new password and confirmation are required.",
      });
    }
    if (formData.password !== formData.confirmPassword) {
      return setMessage({ type: "danger", text: "Passwords don't match!" });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await smartFetch("/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          resetCode,
          newPassword: formData.password,
        }),
      });
      if (!response.ok) {
        throw await getRequestError(response, "Password reset failed");
      }

      setMessage({
        type: "success",
        text: "Password updated successfully. You can now sign in.",
      });
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setResetCode("");
      setMode("login");
    } catch (error) {
      setMessage({ type: "danger", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value =
      e.target.name === "name"
        ? capitalizeFirstLetter(e.target.value)
        : e.target.value;
    if (e.target.name === "email" && mode === "login") {
      setSelectedRole("");
      setShowDropdown(false);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (mode === "signup" && formData.password !== formData.confirmPassword) {
      return setMessage({ type: "danger", text: "Passwords don't match!" });
    }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const response = await smartFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requestedRole:
            mode === "login" && selectedRole ? selectedRole : undefined,
        }),
      });
      if (!response.ok) {
        throw await getRequestError(response, "Something went wrong");
      }
      const data = await response.json();
      if (mode === "login") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        const role = data.user?.role?.toLowerCase();
        if (role === "admin" || role === "super admin") {
          navigate("/admin");
        } else if (role === "salary clerk" || role === "payroll") {
          navigate("/payroll");
        } else {
          navigate("/dashboard");
        }
      } else {
        setMessage({
          type: "success",
          text: "Account created! Please login now.",
        });
        setMode("login");
      }
    } catch (error) {
      setMessage({ type: "danger", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <style>{injectCSS}</style>
      <div className="main-wrapper">
        <div className="corner-tl"></div>
        <div className="corner-br"></div>
        <div className="auth-card">
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: "#0f172a" }}>
              {mode === "login"
                ? "Log in to "
                : mode === "signup"
                ? "Create "
                : mode === "forgot"
                ? "Forgot "
                : "Reset "}
              <span className="title-underline">your</span> account
            </h2>
            <p className="text-muted mt-3 small">
              {mode === "login"
                ? "Enter your credentials to access your account"
                : mode === "signup"
                ? "Enter your details below to get started"
                : mode === "forgot"
                ? "Enter your email to receive a password reset code"
                : "Enter the code from your email and choose a new password"}
            </p>
          </div>

          {message.text && (
            <Alert variant={message.type} className="py-2 small">
              {message.text}
            </Alert>
          )}

          <Form
            onSubmit={
              mode === "forgot"
                ? handleForgotPassword
                : mode === "reset"
                ? handleResetPassword
                : handleSubmit
            }
          >
            {mode === "signup" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Full name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly={mode === "reset"}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Select Role <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="accountant">Accountant</option>
                    <option value="salary clerk">Salary Clerk</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Email address <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                name="email"
                type="email"
                value={formData.email}
                placeholder="Enter your email"
                onChange={handleChange}
                required
              />

              {/* Dynamic Email Selection UI for Multiple Role Users */}
              {showDropdown && emailList.length > 0 && (
                <div className="mt-2 bg-light p-2 rounded border">
                  <small className="fw-bold text-muted d-block mb-1">
                    Select user from list:
                  </small>
                  <ListGroup className="email-select-container">
                    {emailList.map((user) => (
                      <ListGroup.Item
                        key={user._id}
                        action
                        active={formData.email === user.email}
                        onClick={() => handleSelectUserEmail(user.email)}
                        className="py-1 px-2 small text-start"
                      >
                        <div>
                          <strong>{user.name || "User"}</strong>
                        </div>
                        <div className="text-muted small">{user.email}</div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </Form.Group>

            {mode === "reset" && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Reset code <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={resetCode}
                  placeholder="Enter the 6-digit code"
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </Form.Group>
            )}

            {(mode === "login" || mode === "signup" || mode === "reset") && (
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between">
                <Form.Label>
                  Password <span className="text-danger">*</span>
                </Form.Label>
                {mode === "login" && (
                  <a
                    href="#"
                    className="brand-green-text small"
                    onClick={(e) => {
                      e.preventDefault();
                      setMessage({ type: "", text: "" });
                      setMode("forgot");
                    }}
                  >
                    Forgot password?
                  </a>
                )}
              </div>

              <InputGroup className="password-group">
                <Form.Control
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </Button>
              </InputGroup>
            </Form.Group>
            )}

            {(mode === "signup" || mode === "reset") && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Confirm password <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

            {(mode === "login" || mode === "signup") && <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                label={
                  mode === "login" ? (
                    "Remember me"
                  ) : (
                    <>
                      I agree to the{" "}
                      <span className="brand-green-text">
                        Terms and Conditions
                      </span>
                    </>
                  )
                }
                className="text-muted small"
              />
            </Form.Group>}

            <Button
              type="submit"
              className="btn-green w-100 shadow-sm mb-3"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : mode === "signup"
                ? "Create Account"
                : mode === "forgot"
                ? "Send reset code"
                : "Update password"}
            </Button>

            <div className="text-center mt-3">
              <span className="text-muted small">
                {mode === "login"
                  ? "Don't have an account? "
                  : mode === "signup"
                  ? "Already have an account? "
                  : "Remembered your password? "}
              </span>
              <Button
                variant="link"
                className="brand-green-text p-0 small text-decoration-none"
                onClick={() => {
                  setMessage({ type: "", text: "" });
                  setShowDropdown(false);
                  setSelectedRole("");
                  setMode(mode === "login" ? "signup" : "login");
                }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </Button>
            </div>

            {mode === "login" && (
              <>
                <div className="diamond-divider">
                  <div className="diamond"></div>
                </div>
                <div className="text-center">
                  <h6 className="fw-bold mb-2" style={{ color: "#0f172a" }}>
                    Select your role first
                  </h6>
                  <p className="text-muted small mb-3">
                    {selectedRole
                      ? `Selected role: ${selectedRole}`
                      : "Choose a role to load its user accounts."}
                  </p>
                  <Row className="g-2">
  {[
    { label: "Accountant", role: "accountant" },
    { label: "Salary Clerk", role: "salary clerk" },
    { label: "HR", role: "hr" },
    { label: "Admin", role: "admin" },
  ].map((item) => (
    <Col xs={6} key={item.label}>
      <Button
        type="button"
        className="btn-green w-100 py-2"
        style={{ fontSize: "0.8rem" }}
        onClick={() => handleQuickAccess(item.role)}
        disabled={loading}
      >
        Login as {item.label}
      </Button>
    </Col>
  ))}
</Row>  
                </div>
              </>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;