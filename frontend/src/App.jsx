import { BrowserRouter, Routes, Route } from "react-router-dom";
import SelectionPage from "./pages/SelectionPage/SelectionPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectionPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
