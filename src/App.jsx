import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home/Home";
import Login from "./pages/loginpages/login";
import CreateAccount from "./pages/loginpages/CreateAccount";
import Forgotpage from "./pages/loginpages/Forgotpage";

import PatientRegister from "./pages/loginpages/PatientRegister";
import DoctorRegister from "./pages/loginpages/DoctorRegister";
import CaretakerRegister from "./pages/loginpages/CaretakerRegister";

import Patient from "./pages/Dashboard/Patient";
import Doctor from "./pages/Dashboard/Doctor";
import Caretaker from "./pages/Dashboard/Caretaker";
import PatientDetails from "./pages/Dashboard/PatientDetails";
import SettingsPage from "./pages/Dashboard/SettingsPage";
import NotificationsPage from "./pages/Dashboard/NotificationsPage";
import SecurityPage from "./pages/Dashboard/SecurityPage";
import HealthPreferencesPage from "./pages/Dashboard/HealthPreferencesPage";
import AIPreferencesPage from "./pages/Dashboard/AIPreferencesPage";
import ConnectedDevicesPage from "./pages/Dashboard/ConnectedDevicesPage";
import LanguagePage from "./pages/Dashboard/LanguagePage";
import HelpSupportPage from "./pages/Dashboard/HelpSupportPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Create Account */}
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Password Recovery */}
        <Route path="/forgot-password" element={<Forgotpage />} />

        {/* Registration Pages */}
        <Route
          path="/patient-register"
          element={<PatientRegister />}
        />

        <Route
          path="/doctor-register"
          element={<DoctorRegister />}
        />

        <Route
          path="/caretaker-register"
          element={<CaretakerRegister />}
        />

        {/* Dashboards */}
        <Route path="/patient" element={<Patient />} />
        <Route
         path="/patient/details/:patientId"
         element={<PatientDetails />}
         />
        <Route path="/patient/settings" element={<SettingsPage />} />
        <Route path="/patient/notifications" element={<NotificationsPage />} />
        <Route path="/patient/security" element={<SecurityPage />} />
        <Route
        path="/patient/health-preferences"
        element={<HealthPreferencesPage />}
        />
        <Route
        path="/patient/ai-preferences"
        element={<AIPreferencesPage />}
        />
        <Route
        path="/patient/devices"
        element={<ConnectedDevicesPage />}
        />
        <Route
        path="/patient/language"
        element={<LanguagePage />}
        />
        <Route
        path="/patient/help"
        element={<HelpSupportPage />}
        />

        <Route path="/doctor" element={<Doctor />} />
        <Route path="/caretaker" element={<Caretaker />} />
        
        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;