import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SelectionPage   from "./pages/SelectionPage/SelectionPage";
import RegisterPage    from "./pages/RegisterPage/RegisterPage";
import LoginPage       from "./pages/LoginPage/LoginPage";
import HomePage        from "./pages/HomePage/HomePage";
import ProfilePage     from "./pages/ProfilePage/ProfilePage";
import EditProfilePage from "./pages/ProfilePage/EditProfilePage";
import { isSessionValid } from "./services/api";

// Requiere sesión activa — si no, redirige al login
function PrivateRoute({ children }) {
  return isSessionValid() ? children : <Navigate to="/login" replace />;
}

// Rutas públicas — si ya tiene sesión, redirige al home
function PublicRoute({ children }) {
  return isSessionValid() ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/"        element={<PublicRoute><SelectionPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Privadas */}
        <Route path="/home"         element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
