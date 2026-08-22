
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import CreateAccount from "./pages/loginpages/CreateAccount";
import Login from "./pages/loginpages/Login";
import Forgotpage from "./pages/loginpages/Forgotpage";
import Patient from "./pages/Dashboard/Patient";
import Doctor from "./pages/Dashboard/Doctor";
import Caretaker from "./pages/Dashboard/Caretaker";
import PatientRegister from "./pages/loginpages/PatientRegister";
import DoctorRegister from "./pages/loginpages/DoctorRegister";
import CaretakerRegister from "./pages/loginpages/CaretakerRegister";




function App() {
  return (
    <BrowserRouter>

      <Routes>
        {/* Homepage */}
        <Route
         path="/"
          element={<Home />} />

        {/* Create Account Page */}
        <Route
          path="/create-account"
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
<Route
  path="/patient"
  element={<Patient />}
/>
<Route
  path="/doctor"
  element={<Doctor />}
/>
<Route
  path="/caretaker"
  element={<Caretaker />}
/>
      </Routes>

    </BrowserRouter>
  );
}

export default App;