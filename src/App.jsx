import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreateAccount from "./pages/loginpages/CreateAccount";
import Login from "./pages/loginpages/Login";
import Forgotpage from "./pages/loginpages/Forgotpage";

import PatientRegister from "./pages/loginpages/PatientRegister";
import DoctorRegister from "./pages/loginpages/DoctorRegister";
import CaretakerRegister from "./pages/loginpages/CaretakerRegister";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Create Account Page */}
        <Route
          path="/"
          element={<CreateAccount />}
        />

        {/* Login Page */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Forgot Password Page */}
        <Route
          path="/forgot-password"
          element={<Forgotpage />}
        />

        {/* Patient Registration */}
        <Route
          path="/patient-register"
          element={<PatientRegister />}
        />

        {/* Doctor Registration */}
        <Route
          path="/doctor-register"
          element={<DoctorRegister />}
        />

        {/* Caretaker Registration */}
        <Route
          path="/caretaker-register"
          element={<CaretakerRegister />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;