import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SelectionPage   from "./pages/SelectionPage/SelectionPage";
import RegisterPage    from "./pages/RegisterPage/RegisterPage";
import LoginPage       from "./pages/LoginPage/LoginPage";
import HomePage        from "./pages/HomePage/HomePage";
import ProfilePage     from "./pages/ProfilePage/ProfilePage";
import EditProfilePage from "./pages/ProfilePage/EditProfilePage";
import { isSessionValid, profileService } from "./services/api";

// Rutas públicas — si ya tiene sesión redirige al home
function PublicRoute({ children }) {
  return isSessionValid() ? <Navigate to="/home" replace /> : children;
}

// Requiere sesión activa
function PrivateRoute({ children }) {
  return isSessionValid() ? children : <Navigate to="/login" replace />;
}

// Requiere sesión + perfil completo
function RequireProfile({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ok | incomplete

  useEffect(() => {
    if (!isSessionValid()) return setStatus("no-session");
    profileService.get()
      .then(({ perfilCompleto }) => setStatus(perfilCompleto ? "ok" : "incomplete"))
      .catch(() => setStatus("ok")); // si falla la API no bloqueamos
  }, []);

  if (status === "checking") return null; // evita parpadeo
  if (status === "no-session")  return <Navigate to="/login" replace />;
  if (status === "incomplete")  return <Navigate to="/profile/edit" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/"         element={<PublicRoute><SelectionPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Privadas — solo sesión */}
        <Route path="/profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />

        {/* Privada — sesión + perfil completo */}
        <Route path="/home" element={<RequireProfile><HomePage /></RequireProfile>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
