// DriveImageUpload.js

/**
 * Uploads a file to Google Drive
 * @param {File} file - The file to upload
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<Object>} - Upload response data
 */
export const DriveImageUploader = async (file, accessToken) => {
  if (!file || !accessToken) {
    throw new Error("File and access token are required");
  }

  const fileMetadata = {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
  };

  // Create form data for multipart upload
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(fileMetadata)], { type: "application/json" })
  );
  form.append("file", file);

  try {
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        console.log("Token expired, clearing from storage");
        localStorage.removeItem("google_access_token");
        throw new Error("Session expired. Please try again.");
      }

      throw new Error(
        data.error?.message || `Upload failed with status ${response.status}`
      );
    }

    console.log("✅ UPLOAD SUCCESS:", data);

    // Return useful file information
    return {
      success: true,
      fileId: data.id,
      fileName: data.name,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      directLink: `https://drive.google.com/uc?export=view&id=${data.id}`,
      rawResponse: data,
    };
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
};

/**
 * Generates a shareable link for the uploaded file
 * @param {string} fileId - Google Drive file ID
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<string>} - Shareable link
 */
export const makeFilePublic = async (fileId, accessToken) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to make file public");
    }

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error("Failed to make file public:", error);
    throw error;
  }
};

/**
 * Helper function to sign out from Google
 */
export const signOutFromGoogle = () => {
  const token = localStorage.getItem("google_access_token");

  if (token && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(token, () => {
      console.log("Access token revoked");
    });
  }

  localStorage.removeItem("google_access_token");
  console.log("Signed out from Google");
};

/**
 * Checks if the current token is valid
 * @param {string} token - The access token to check
 * @returns {Promise<boolean>} - True if token is valid
 */
export const isTokenValid = async (token) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );
    return response.ok;
  } catch {
    return false;
  }
};
