import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import FileUploadWithPreview from "../components/FileUploadWithPreview";
import Button from "../components/Button";
import { playersAPI, helperAPI } from "../services/api";
import { supabase } from "../config/supabase";
import { showSuccess, showError } from "../utils/toast";
import toast from "react-hot-toast";

const PlayerRegistrationEnhanced = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [helper, setHelper] = useState([]);

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
    playerIdProof: null,
  });

  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({
    playerPhoto: null,
    paymentProof: null,
    playerIdProof: null,
  });

  const locations = [
    { value: "Udumalpet", label: "Udumalpet" },
    { value: "Palani", label: "Palani" },
    { value: "Pollachi", label: "Pollachi" },
  ];

  const roles = [
    { value: "allrounder", label: "All-rounder" },
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

  useEffect(() => {
    loadHelper();
  }, []);
  const loadHelper = async () => {
    try {
      setLoading(true);
      const data = await helperAPI.getAll();
      setHelper(data);

      console.log("helper");
      console.log(helper);

      // console.log("helper");
      // console.log(helper);
    } catch (error) {
      console.error("Helper load failed:", error);

      toast.error("Failed to load helper");
    } finally {
      setLoading(false);
    }
  };

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
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "File size must be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "Only image files are allowed",
        }));
        return;
      }

      setFiles((prev) => ({ ...prev, [fieldName]: file }));

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

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Player name is required";
      if (!formData.location) newErrors.location = "Location is required";
      if (!formData.phone_number)
        newErrors.phone_number = "Enter your correct phone number";
    }

    if (step === 2) {
      if (!formData.jersey_size)
        newErrors.jersey_size = "Jersey size is required";
      if (!formData.jersey_number) {
        newErrors.jersey_number = "Jersey number is required";
      } else if (
        isNaN(formData.jersey_number) ||
        formData.jersey_number < 1 ||
        formData.jersey_number > 99
      ) {
        newErrors.jersey_number = "Jersey number must be between 1 and 99";
      }
    }

    if (step === 3) {
      if (!formData.role) newErrors.role = "Player role is required";
    }

    if (step === 4) {
      if (!files.playerPhoto)
        newErrors.playerPhoto = "Player photo is required";
      if (!files.paymentProof)
        newErrors.paymentProof = "Payment proof is required";
      if (!files.playerIdProof)
        newErrors.playerIdProof = "Payment ID proof is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const uploadFile = async (file, bucket, folder = "") => {
    // Normalize folder path (ensure trailing slash if provided)
    const normalizedFolder = folder ? folder : "";

    const fileExt = file.name.split(".").pop();
    const filePath = `${normalizedFolder}${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      throw new Error("Photo upload failed. Please retry.");
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    const toastId = toast.loading("Submitting...");
    e.preventDefault();

    if (!validateStep(4)) {
      showError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const playerPhotoPath = await uploadFile(
        files.playerPhoto,
        "player-photos",
        "player_photos/"
      );

      // Upload payment proof
      const paymentProofPath = await uploadFile(
        files.paymentProof,
        "player-photos",
        "payments/"
      );

      const IdProofPath = await uploadFile(
        files.playerIdProof,
        "player-photos",
        "player_id_proof/"
      );

      const playerData = {
        name: formData.name.trim(),
        phone_number: formData.phone_number,
        player_location: formData.location,
        pleyer_jersey_size: formData.jersey_size.toLocaleUpperCase(),
        pleyer_jersey_number: formData.jersey_number,
        role: formData.role,
        player_photo: playerPhotoPath,
        player_id_proof_photo: IdProofPath,
        player_payment_proof_photo: paymentProofPath,
        base_price: helper[0].base_price,
      };

      await playersAPI.create(playerData);

      toast.success("Registration successfull!");
      toast.dismiss(toastId);
      clearForm();

      // Navigate to players page after a short delay
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Registration error:", error);
      // showError(error.message || "Registration failed. Please try again.");
      if (
        error?.code === "23505" &&
        error?.message?.includes("players_phone_number_key")
      ) {
        toast.error(
          "Phone number already exists. Please use a different number."
        );
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      toast.dismiss(toastId);
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: "",
      location: "",
      jersey_size: "",
      jersey_number: "",
      phone_number: "",
      role: "",
    });
    setFiles({ playerPhoto: null, paymentProof: null, playerIdProof: null });
    setPreviews({
      playerPhoto: null,
      paymentProof: null,
      playerIdProof: null,
    });

    setErrors("");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Personal Information
            </h2>
            <Input
              label="Player Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              error={errors.name}
            />
            <Input
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="+91 XXXXXXXXXX"
              required
              error={errors.phone_number}
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
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Jersey Details
            </h2>
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
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
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
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Documents
            </h2>
            <FileUploadWithPreview
              label="Player Photo"
              onChange={(e) => handleFileChange(e, "playerPhoto")}
              preview={previews.playerPhoto}
              required
              error={errors.playerPhoto}
            />
            <FileUploadWithPreview
              label="Payment Proof"
              onChange={(e) => handleFileChange(e, "paymentProof")}
              preview={previews.paymentProof}
              required
              error={errors.paymentProof}
            />
            <FileUploadWithPreview
              label="ID Proof"
              onChange={(e) => handleFileChange(e, "playerIdProof")}
              preview={previews.playerIdProof}
              required
              error={errors.playerIdProof}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Player Registration
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Personal</span>
            <span>Jersey</span>
            <span>Role</span>
            <span>Documents</span>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="flex gap-3 mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="flex-1"
                >
                  Previous
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Registering..." : "Submit Registration"}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PlayerRegistrationEnhanced;
