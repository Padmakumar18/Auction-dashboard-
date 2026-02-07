import { useState } from "react";

const FileUploadWithPreview = ({
  label,
  onChange,
  required = false,
  error,
  preview,
  accept = "image/*",
  maxSize = 2,
  className = "",
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : error
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
              <label className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                <span className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium shadow-lg">
                  Change Image
                </span>
                <input
                  type="file"
                  accept={accept}
                  onChange={onChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center cursor-pointer py-6">
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-blue-600">
                Click to upload
              </span>{" "}
              or drag and drop
            </span>
            <span className="text-xs text-gray-500">
              PNG, JPG, GIF up to {maxSize}MB
            </span>
            <input
              type="file"
              accept={accept}
              onChange={onChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FileUploadWithPreview;
