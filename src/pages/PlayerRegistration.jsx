import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import UploadInput from "../components/UploadInput";
import Button from "../components/Button";
import { playersAPI } from "../services/api";
import { supabase } from "../config/supabase";
import { showSuccess, showError } from "../utils/toast";
import toast from "react-hot-toast";

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    jersey_size: "",
    jersey_number: "",
    phone_number: "",
    role: "",
  });

  const [files, setFiles] = useState({
    playerPhoto: null,
    paymentProof: null,
  });

  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({
    playerPhoto: null,
    paymentProof: null,
  });

  const locations = [
    { value: "Udumalpet", label: "Udumalpet" },
    { value: "Palani", label: "Palani" },
    { value: "Pollachi", label: "Pollachi" },
  ];

  const roles = [
    { value: "all-rounder", label: "All-rounder" },
    { value: "batsman", label: "Batsman" },
    { value: "bowler", label: "Bowler" },
  ];

  const jerseySizes = [
    { value: "XS", label: "XS" },
    { value: "S", label: "S" },
    { value: "M", label: "M" },
    { value: "L", label: "L" },
    { value: "XL", label: "XL" },
    { value: "XXL", label: "XXL" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "File size must be less than 5MB",
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "Only image files are allowed",
        }));
        return;
      }

      setFiles((prev) => ({ ...prev, [fieldName]: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);

      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Player name is required";
    }

    if (!formData.location) {
      newErrors.location = "Location is required";
    }

    if (!formData.jersey_size) {
      newErrors.jersey_size = "Jersey size is required";
    }

    if (!formData.jersey_number) {
      newErrors.jersey_number = "Jersey number is required";
    } else if (
      isNaN(formData.jersey_number) ||
      formData.jersey_number < 1 ||
      formData.jersey_number > 99
    ) {
      newErrors.jersey_number = "Jersey number must be between 1 and 99";
    }

    if (!formData.role) {
      newErrors.role = "Player role is required";
    }

    if (!files.playerPhoto) {
      newErrors.playerPhoto = "Player photo is required";
    }

    if (!files.paymentProof) {
      newErrors.paymentProof = "Payment proof is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file, bucket, folder = "") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Upload player photo
      const playerPhotoPath = await uploadFile(
        files.playerPhoto,
        "players-photos",
        "registrations/"
      );

      // Upload payment proof
      const paymentProofPath = await uploadFile(
        files.paymentProof,
        "payment-proofs",
        "registrations/"
      );

      // Create player record
      const playerData = {
        name: formData.name.trim(),
        location: formData.location,
        jersey_size: formData.jersey_size,
        jersey_number: parseInt(formData.jersey_number),
        role: formData.role,
        player_photo: playerPhotoPath,
        payment_proof: paymentProofPath,
        base_price: 100,
      };

      await playersAPI.create(playerData);

      showSuccess("Registration successful!");

      // Reset form
      setFormData({
        name: "",
        location: "",
        jersey_size: "",
        jersey_number: "",
        role: "",
      });
      setFiles({ playerPhoto: null, paymentProof: null });
      setPreviews({ playerPhoto: null, paymentProof: null });

      // Navigate to players page after a short delay
    } catch (error) {
      console.error("Registration error:", error);
      showError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Player Registration
          </h1>
          <p className="text-gray-600">
            Fill in your details to register for the tournament
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Player Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  error={errors.name}
                />

                <Select
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  options={locations}
                  placeholder="Select your location"
                  required
                  error={errors.location}
                />
              </div>
            </div>

            {/* Jersey Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Jersey Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Jersey Size"
                  name="jersey_size"
                  value={formData.jersey_size}
                  onChange={handleInputChange}
                  options={jerseySizes}
                  placeholder="Select jersey size"
                  required
                  error={errors.jersey_size}
                />

                <Input
                  label="Jersey Number"
                  name="jersey_number"
                  type="number"
                  value={formData.jersey_number}
                  onChange={handleInputChange}
                  placeholder="Enter jersey number (1-99)"
                  required
                  min="1"
                  max="99"
                  error={errors.jersey_number}
                />
              </div>
            </div>

            {/* Player Role Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Playing Role
              </h2>
              <Select
                label="Player Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={roles}
                placeholder="Select your playing role"
                required
                error={errors.role}
              />
            </div>

            {/* File Uploads Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Upload Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <UploadInput
                    label="Player Photo"
                    onChange={(e) => handleFileChange(e, "playerPhoto")}
                    required
                    error={errors.playerPhoto}
                    accept="image/*"
                  />
                  {previews.playerPhoto && (
                    <div className="mt-2">
                      <img
                        src={previews.playerPhoto}
                        alt="Player preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <UploadInput
                    label="Payment Proof"
                    onChange={(e) => handleFileChange(e, "paymentProof")}
                    required
                    error={errors.paymentProof}
                    accept="image/*"
                  />
                  {previews.paymentProof && (
                    <div className="mt-2">
                      <img
                        src={previews.paymentProof}
                        alt="Payment proof preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Registering..." : "Register Player"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/players")}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Registration Guidelines
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All fields marked with * are mandatory</li>
                <li>• Image files should be less than 5MB</li>
                {/* <li>• Jersey numbers must be unique (1-99)</li> */}
                <li>• Payment proof must be clearly visible</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlayerRegistration;
