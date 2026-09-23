import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home/Home";
import Login from "./pages/loginpages/login";
import Emergency from "./pages/home/Emergency";
import CreateAccount from "./pages/loginpages/CreateAccount";
import Forgotpage from "./pages/loginpages/Forgotpage";

import PatientRegister from "./pages/loginpages/PatientRegister";
import DoctorRegister from "./pages/loginpages/DoctorRegister";
import CaretakerRegister from "./pages/loginpages/CaretakerRegister";

// Patient Dashboard
import Patient from "./pages/Dashboard/Patient";
import PatientDetails from "./pages/Dashboard/PatientDetails";
import SettingsPage from "./pages/Dashboard/SettingsPage";
import NotificationsPage from "./pages/Dashboard/NotificationsPage";
import SecurityPage from "./pages/Dashboard/SecurityPage";
import HealthPreferencesPage from "./pages/Dashboard/HealthPreferencesPage";
import AIPreferencesPage from "./pages/Dashboard/AIPreferencesPage";
import ConnectedDevicesPage from "./pages/Dashboard/ConnectedDevicesPage";
import LanguagePage from "./pages/Dashboard/LanguagePage";
import HelpSupportPage from "./pages/Dashboard/HelpSupportPage";

// Doctor Dashboard
import Doctor from "./pages/Dashboard/Doctor";
import DoctorProfile from "./pages/Dashboard/DoctorProfile";
import DoctorSettings from "./pages/Dashboard/DoctorSettings/DoctorSettings";
import DoctorNotifications from "./pages/Dashboard/DoctorSettings/Notifications";
import ChangePassword from "./pages/Dashboard/DoctorSettings/ChangePassword";
import DoctorLanguage from "./pages/Dashboard/DoctorSettings/Language";
import Availability from "./pages/Dashboard/DoctorSettings/Availability";
import Help from "./pages/Dashboard/DoctorSettings/Help";

// Caretaker Dashboard
import Caretaker from "./pages/Dashboard/Caretaker";


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

        {/* Emergency */}
        <Route
          path="/Emergency"
          element={<Emergency />}
        />

        {/* ================= PATIENT ================= */}

        <Route
          path="/patient"
          element={<Patient />}
        />

        <Route
          path="/patient/details/:patientId"
          element={<PatientDetails />}
        />

        <Route
          path="/patient/settings"
          element={<SettingsPage />}
        />

        <Route
          path="/patient/notifications"
          element={<NotificationsPage />}
        />

        <Route
          path="/patient/security"
          element={<SecurityPage />}
        />

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

        {/* ================= DOCTOR ================= */}

        <Route
          path="/doctor"
          element={<Doctor />}
        />

        <Route
          path="/doctor-profile"
          element={<DoctorProfile />}
        />

        <Route
          path="/doctor/settings"
          element={<DoctorSettings />}
        />

        <Route
          path="/doctor/settings/notifications"
          element={<DoctorNotifications />}
        />

        <Route
          path="/doctor/settings/change-password"
          element={<ChangePassword />}
        />

        <Route
          path="/doctor/settings/language"
          element={<DoctorLanguage />}
        />

        <Route
          path="/doctor/settings/availability"
          element={<Availability />}
        />

        <Route
          path="/doctor/settings/help"
          element={<Help />}
        />

        {/* ================= CARETAKER ================= */}

        <Route
          path="/caretaker"
          element={<Caretaker />}
        />

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;