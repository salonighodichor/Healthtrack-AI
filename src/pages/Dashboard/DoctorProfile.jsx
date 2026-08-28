import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorProfile.css";

function DoctorProfile() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [doctor, setDoctor] = useState({
    doctorId: "",
    name: "",
    email: "",
    phone: "",
    medicalRegistrationNo: "",
    specialization: "",
    experience: "",
    qualification: "",
    hospital: "",
    address: ""
  });

  const [editDoctor, setEditDoctor] = useState(doctor);

  // ================= LOAD DOCTOR PROFILE =================

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch (error) {
      console.error(error);
      setMessage("Invalid login data.");
      setLoading(false);
      return;
    }

    if (user.role !== "doctor") {
      setMessage("Only doctors can access this profile.");
      setLoading(false);
      return;
    }

    fetch(`http://127.0.0.1:5000/api/doctor/profile/${user.id}`)
      .then((response) => response.json())

      .then((data) => {
        if (data.message) {
          setMessage(data.message);
        } else {

          const profileData = {
            doctorId: `DR${String(data.id).padStart(5, "0")}`,
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            medicalRegistrationNo:
              data.medicalRegistrationNo || "",
            specialization:
              data.specialization || "",
            experience:
              data.experience || "",
            qualification:
              data.qualification || "",
            hospital:
              data.hospitalClinic || "",
            address:
              data.address || ""
          };

          setDoctor(profileData);
          setEditDoctor(profileData);

          // Latest profile localStorage me bhi save
          const updatedUser = {
            ...user,
            ...data
          };

          localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );
        }

        setLoading(false);
      })

      .catch((error) => {
        console.error(error);
        setMessage(
          "Backend se profile load nahi ho payi."
        );
        setLoading(false);
      });

  }, []);


  // ================= INPUT CHANGE =================

  const handleChange = (e) => {
    setEditDoctor({
      ...editDoctor,
      [e.target.name]: e.target.value
    });
  };


  // ================= EDIT PROFILE =================

  const handleEdit = () => {
    setEditDoctor(doctor);
    setIsEditing(true);
    setMessage("");
  };


  // ================= SAVE PROFILE =================

  const handleSave = async () => {

    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setMessage("Please login first.");
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch (error) {
      console.error(error);
      setMessage("Invalid login data.");
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:5000/api/doctor/profile/${user.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            name: editDoctor.name,

            email: editDoctor.email,

            phone: editDoctor.phone,

            medicalRegistrationNo:
              editDoctor.medicalRegistrationNo,

            specialization:
              editDoctor.specialization,

            qualification:
              editDoctor.qualification,

            hospitalClinic:
              editDoctor.hospital,

            experience:
              editDoctor.experience,

            address:
              editDoctor.address
          })
        }
      );

      const data = await response.json();


      // ================= SUCCESS =================

      if (response.ok) {

        // Profile page ka data update
        setDoctor(editDoctor);


        // IMPORTANT:
        // Dashboard ke liye localStorage update

        const updatedUser = {
          ...user,

          name: editDoctor.name,

          email: editDoctor.email,

          phone: editDoctor.phone,

          medicalRegistrationNo:
            editDoctor.medicalRegistrationNo,

          specialization:
            editDoctor.specialization,

          experience:
            editDoctor.experience,

          qualification:
            editDoctor.qualification,

          hospitalClinic:
            editDoctor.hospital,

          address:
            editDoctor.address
        };


        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );


        setIsEditing(false);

        setMessage(
          "Profile updated successfully!"
        );

      } else {

        setMessage(
          data.message ||
          "Profile update failed."
        );
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Backend se connect nahi ho paya."
      );
    }
  };


  // ================= CANCEL =================

  const handleCancel = () => {
    setEditDoctor(doctor);
    setIsEditing(false);
    setMessage("");
  };


  // ================= BACK TO DASHBOARD =================

  const handleBack = () => {
    navigate("/doctor");
  };


  // ================= LOADING =================

  if (loading) {
    return (
      <div className="doctor-profile-container">
        <p>Loading doctor profile...</p>
      </div>
    );
  }


  // ================= UI =================

  return (
    <div className="doctor-profile-container">

      {/* ================= HEADER ================= */}

      <div className="doctor-profile-header">

        <h1>
          Doctor Profile
        </h1>

        <h2>
          {doctor.name || "Doctor"}
        </h2>

        <p>
          {doctor.specialization ||
            "Specialization not added"}
        </p>

      </div>


      {/* ================= MESSAGE ================= */}

      {message && (
        <p className="profile-message">
          {message}
        </p>
      )}


      {/* ================= PERSONAL INFORMATION ================= */}

      <div className="profile-card">

        <h3>
          Personal Information
        </h3>

        <div className="profile-details">

          {/* Doctor ID */}

          <div>

            <span>
              Doctor ID
            </span>

            <p>
              {doctor.doctorId}
            </p>

          </div>


          {/* Name */}

          <div>

            <span>
              Name
            </span>

            {isEditing ? (

              <input
                type="text"
                name="name"
                value={editDoctor.name}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.name || "Not added"}
              </p>

            )}

          </div>


          {/* Email */}

          <div>

            <span>
              Email
            </span>

            {isEditing ? (

              <input
                type="email"
                name="email"
                value={editDoctor.email}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.email || "Not added"}
              </p>

            )}

          </div>


          {/* Phone */}

          <div>

            <span>
              Phone
            </span>

            {isEditing ? (

              <input
                type="text"
                name="phone"
                value={editDoctor.phone}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.phone || "Not added"}
              </p>

            )}

          </div>


          {/* Medical Registration */}

          <div>

            <span>
              Medical Registration No.
            </span>

            {isEditing ? (

              <input
                type="text"
                name="medicalRegistrationNo"
                value={
                  editDoctor.medicalRegistrationNo
                }
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.medicalRegistrationNo ||
                  "Not added"}
              </p>

            )}

          </div>

        </div>

      </div>


      {/* ================= PROFESSIONAL INFORMATION ================= */}

      <div className="profile-card">

        <h3>
          Professional Information
        </h3>

        <div className="profile-details">

          {/* Specialization */}

          <div>

            <span>
              Specialization
            </span>

            {isEditing ? (

              <input
                type="text"
                name="specialization"
                value={editDoctor.specialization}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.specialization ||
                  "Not added"}
              </p>

            )}

          </div>


          {/* Experience */}

          <div>

            <span>
              Experience
            </span>

            {isEditing ? (

              <input
                type="text"
                name="experience"
                value={editDoctor.experience}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.experience ||
                  "Not added"}
              </p>

            )}

          </div>


          {/* Qualification */}

          <div>

            <span>
              Qualification
            </span>

            {isEditing ? (

              <input
                type="text"
                name="qualification"
                value={editDoctor.qualification}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.qualification ||
                  "Not added"}
              </p>

            )}

          </div>


          {/* Hospital */}

          <div>

            <span>
              Hospital
            </span>

            {isEditing ? (

              <input
                type="text"
                name="hospital"
                value={editDoctor.hospital}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.hospital ||
                  "Not added"}
              </p>

            )}

          </div>


          {/* Address */}

          <div>

            <span>
              Address
            </span>

            {isEditing ? (

              <input
                type="text"
                name="address"
                value={editDoctor.address}
                onChange={handleChange}
              />

            ) : (

              <p>
                {doctor.address ||
                  "Not added"}
              </p>

            )}

          </div>

        </div>

      </div>


      {/* ================= STATISTICS ================= */}

      <div className="profile-card">

        <h3>
          Statistics
        </h3>

        <div className="profile-statistics">

          <div className="stat-box">

            <h4>
              0
            </h4>

            <p>
              Patients
            </p>

          </div>


          <div className="stat-box">

            <h4>
              0%
            </h4>

            <p>
              Recovery Rate
            </p>

          </div>


          <div className="stat-box">

            <h4>
              0 ⭐
            </h4>

            <p>
              Rating
            </p>

          </div>

        </div>

      </div>


      {/* ================= BUTTONS ================= */}

      <div className="profile-actions">

        {!isEditing ? (

          <button
            className="edit-btn"
            onClick={handleEdit}
          >
            Edit Profile
          </button>

        ) : (

          <>

            <button
              className="save-btn"
              onClick={handleSave}
            >
              Save Changes
            </button>

            <button
              className="cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>

          </>

        )}

      </div>


      {/* ================= BACK BUTTON ================= */}

      <button
        className="back-btn"
        onClick={handleBack}
      >
        Back to Dashboard
      </button>

    </div>
  );
}

export default DoctorProfile;