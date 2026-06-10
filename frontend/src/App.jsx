import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import UserMenu   from "./components/UserMenu/UserMenu";
import HomeButton from "./components/HomeButton/HomeButton";
import BottomNav  from "./components/BottomNav/BottomNav";
import { isSessionValid, profileService } from "./services/api";

// ── Lazy load de todas las páginas ──────────────────────────────────────────
// Cada página se descarga solo cuando el usuario navega a ella.
const SelectionPage    = lazy(() => import("./pages/SelectionPage/SelectionPage"));
const RegisterPage     = lazy(() => import("./pages/RegisterPage/RegisterPage"));
const LoginPage        = lazy(() => import("./pages/LoginPage/LoginPage"));
const HomePage         = lazy(() => import("./pages/HomePage/HomePage"));
const ProfilePage      = lazy(() => import("./pages/ProfilePage/ProfilePage"));
const EditProfilePage  = lazy(() => import("./pages/ProfilePage/EditProfilePage"));
const CasosPage        = lazy(() => import("./pages/CasosPage/CasosPage"));
const CreateCasoPage   = lazy(() => import("./pages/CasosPage/CreateCasoPage"));
const MarketplacePage  = lazy(() => import("./pages/CasosPage/MarketplacePage"));
const MatchPage        = lazy(() => import("./pages/MatchPage/MatchPage"));
const AsignacionesPage = lazy(() => import("./pages/AsignacionesPage/AsignacionesPage"));
const TurnosPage       = lazy(() => import("./pages/TurnosPage/TurnosPage"));
const ChatsListPage    = lazy(() => import("./pages/ChatPage/ChatsListPage"));
const ChatPage         = lazy(() => import("./pages/ChatPage/ChatPage"));

// ── Fallback de carga durante navegación ────────────────────────────────────
const PageFallback = () => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 60%,#fff7ed 100%)",
  }}>
    <div style={{
      width: "44px", height: "44px",
      border: "4px solid #bfdbfe", borderTop: "4px solid #2563eb",
      borderRadius: "50%", animation: "spin .8s linear infinite",
    }} />
  </div>
);

// ── Guards ──────────────────────────────────────────────────────────────────
function PublicRoute({ children }) {
  return isSessionValid() ? <Navigate to="/home" replace /> : children;
}

function PrivateRoute({ children }) {
  return isSessionValid() ? children : <Navigate to="/login" replace />;
}

function RequireProfile({ children }) {
  const [status, setStatus] = useState("checking");
  useEffect(() => {
    if (!isSessionValid()) return setStatus("no-session");
    profileService.get()
      .then(({ perfilCompleto }) => setStatus(perfilCompleto ? "ok" : "incomplete"))
      .catch(() => setStatus("ok"));
  }, []);
  if (status === "checking")   return null;
  if (status === "no-session") return <Navigate to="/login" replace />;
  if (status === "incomplete") return <Navigate to="/profile/edit" replace />;
  return children;
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <HomeButton />
          <UserMenu />
          <BottomNav />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Públicas */}
              <Route path="/"         element={<PublicRoute><SelectionPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />

              {/* Privadas — solo sesión */}
              <Route path="/profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
              <Route path="/casos"        element={<PrivateRoute><CasosPage /></PrivateRoute>} />
              <Route path="/casos/nuevo"  element={<PrivateRoute><CreateCasoPage /></PrivateRoute>} />
              <Route path="/marketplace"  element={<PrivateRoute><MarketplacePage /></PrivateRoute>} />
              <Route path="/match"        element={<PrivateRoute><MatchPage /></PrivateRoute>} />
              <Route path="/asignaciones" element={<PrivateRoute><AsignacionesPage /></PrivateRoute>} />
              <Route path="/turnos"       element={<PrivateRoute><TurnosPage /></PrivateRoute>} />
              <Route path="/chats"        element={<PrivateRoute><ChatsListPage /></PrivateRoute>} />
              <Route path="/chat/:casoId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

              {/* Privada — sesión + perfil completo */}
              <Route path="/home" element={<RequireProfile><HomePage /></RequireProfile>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
