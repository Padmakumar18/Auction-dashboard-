import toast from "react-hot-toast";

// Success toast
export const showSuccess = (message) => {
  toast.success(message);
};

// Error toast
export const showError = (message) => {
  toast.error(message);
};

// Loading toast
export const showLoading = (message) => {
  return toast.loading(message);
};

// Update existing toast
export const updateToast = (toastId, type, message) => {
  if (type === "success") {
    toast.success(message, { id: toastId });
  } else if (type === "error") {
    toast.error(message, { id: toastId });
  }
};

// Dismiss toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Promise toast (for async operations)
export const showPromise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || "Loading...",
    success: messages.success || "Success!",
    error: messages.error || "Error occurred",
  });
};
