import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SelectionPage from "./pages/SelectionPage/SelectionPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import HomePage from "./pages/HomePage/HomePage";
import { isSessionValid } from "./services/api";

// Si tiene sesión vigente (mismo día), entra directo. Si no, va al login.
function PrivateRoute({ children }) {
  return isSessionValid() ? children : <Navigate to="/login" replace />;
}

// Si ya tiene sesión activa, redirige al home en vez de mostrar login/register.
function PublicRoute({ children }) {
  return isSessionValid() ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><SelectionPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
