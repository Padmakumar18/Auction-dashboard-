import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import FileUploadWithPreview from "../components/FileUploadWithPreview";
import UploadInput from "../components/UploadInput";
import Button from "../components/Button";
import { playersAPI, helperAPI } from "../services/api";
import { supabase } from "../config/supabase";
import { showSuccess, showError } from "../utils/toast";
import toast from "react-hot-toast";

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    { value: "allrounder", label: "All-Rounder" },
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
      // Validate file size (max 5MB)
      if (file.size > 2 * 1024 * 1024) {
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

    if (!formData.phone_number || formData.phone_number.length != 10) {
      newErrors.phone_number = "Enter valid phone number";
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
    if (!files.playerIdProof) {
      newErrors.playerIdProof = "Payment id proof is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const uploadFile = async (file, bucket, folder = "") => {
  //   console.log("file");
  //   console.log(file);

  //   const filePath = `${bucket}/${Date.now()}_${file.name.split(".").pop()}`;

  //   // const fileExt = file.name.split(".").pop();
  //   // const fileName = `${folder}${Date.now()}_${Math.random()
  //   //   .toString(36)
  //   //   .substring(7)}.${fileExt}`;

  //   const { data, error } = await supabase.storage
  //     .from(bucket)
  //     .upload(filePath, file);

  //   console.log("data");
  //   console.log(data);

  //   if (error) {
  //     throw new Error("Photo upload failed. Please retry.");
  //   }

  //   const { data: publicUrlData } = supabase.storage
  //     .from(bucket)
  //     .getPublicUrl(filePath);

  //   if (error) throw error;
  //   return publicUrlData.publicUrl;
  // };

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
    e.preventDefault();

    if (!validateForm()) {
      showError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Submitting...");
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
      // clearForm();

      // Navigate to players page after a short delay
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Player Registration
          </h1>
          <p className="text-black-600 ">
            If you are facing any issues while submitting , please contact this
            number{" "}
            <span className="text-red-600 font-bold">+91 9944035088</span>
          </p>
          <hr />
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
            </div>

            {/* Jersey Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Jersey Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Jersey Size"
                  name="jersey_size"
                  value={formData.jersey_size.toLocaleUpperCase()}
                  onChange={handleInputChange}
                  placeholder="Select jersey size"
                  required
                  error={errors.jersey_size}
                />

                <Input
                  label="Jersey Number"
                  name="jersey_number"
                  type="text"
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
                  <FileUploadWithPreview
                    label="Player Photo"
                    onChange={(e) => handleFileChange(e, "playerPhoto")}
                    preview={previews.playerPhoto}
                    required
                    error={errors.playerPhoto}
                  />
                </div>
                <div>
                  {/* <UploadInput
                    label="ID Proof"
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
                  )} */}
                  <FileUploadWithPreview
                    label="ID Proof"
                    onChange={(e) => handleFileChange(e, "playerIdProof")}
                    preview={previews.playerIdProof}
                    required
                    error={errors.playerIdProof}
                  />
                </div>
                <div>
                  {/* <UploadInput
                    label="ID Proof"
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
                  )} */}
                  <FileUploadWithPreview
                    label="Payment Proof"
                    onChange={(e) => handleFileChange(e, "paymentProof")}
                    preview={previews.paymentProof}
                    required
                    error={errors.paymentProof}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                // variant="secondary"
                size="lg"
                disabled={loading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                onClick={() => clearForm()}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                // variant="primary"
                size="lg"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
              >
                {loading ? "Registering..." : "Register Player"}
              </Button>
              {/* <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/player-registration")}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button> */}
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
                <li>
                  • If you have any doubts , contact this number +91 9944035088
                </li>
                <li>• All fields marked with * are mandatory</li>
                <li>• Image files should be less than 2MB</li>
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
