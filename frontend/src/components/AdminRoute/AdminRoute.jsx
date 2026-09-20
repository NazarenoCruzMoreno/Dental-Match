import { Navigate } from "react-router-dom";
import { isSessionValid, getUser } from "../../services/api";

// Igual que PrivateRoute (App.jsx) pero además exige role === "admin".
// No pasa por RequireProfile: un admin no tiene perfil de estudiante/paciente
// que completar, así que /admin es su propia puerta de entrada.
export default function AdminRoute({ children }) {
  if (!isSessionValid()) return <Navigate to="/login" replace />;
  if (getUser()?.role !== "admin") return <Navigate to="/home" replace />;
  return children;
}
