# API Integration Guide - Registration Form

## Overview

The registration form integrates with Supabase for:

1. File storage (player photos & payment proofs)
2. Database operations (player records)

## Storage Integration

### Buckets Used

**players-photos**

- Stores player profile images
- Public read access
- Path: `registrations/{timestamp}_{random}.{ext}`

**payment-proofs**

- Stores payment verification images
- Public read access
- Path: `registrations/{timestamp}_{random}.{ext}`

### Upload Function

```javascript
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
```

**Features:**

- Unique filename generation
- Timestamp-based naming
- Random string for collision prevention
- Folder organization

## Database Integration

### Player Creation

```javascript
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
```

### Table Schema

```sql
players (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(50),
  jersey_size VARCHAR(10),
  jersey_number INTEGER UNIQUE,
  role VARCHAR(50) NOT NULL,
  player_photo TEXT,
  payment_proof TEXT,
  base_price INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Error Handling

### File Upload Errors

```javascript
try {
  const photoPath = await uploadFile(file, bucket, folder);
} catch (error) {
  // Handle storage errors
  showError("Failed to upload file");
}
```

**Common Errors:**

- Storage bucket not found
- Insufficient permissions
- File size too large
- Network timeout

### Database Errors

```javascript
try {
  await playersAPI.create(playerData);
} catch (error) {
  // Handle database errors
  if (error.code === "23505") {
    showError("Jersey number already taken");
  } else {
    showError("Registration failed");
  }
}
```

**Common Errors:**

- Unique constraint violation (jersey number)
- Required field missing
- Invalid data type
- Connection timeout

## Validation Flow

### Client-Side Validation

```javascript
const validateForm = () => {
  const newErrors = {};

  // Name validation
  if (!formData.name.trim()) {
    newErrors.name = "Player name is required";
  }

  // Jersey number validation
  if (!formData.jersey_number) {
    newErrors.jersey_number = "Jersey number is required";
  } else if (
    isNaN(formData.jersey_number) ||
    formData.jersey_number < 1 ||
    formData.jersey_number > 99
  ) {
    newErrors.jersey_number = "Must be between 1 and 99";
  }

  // File validation
  if (!files.playerPhoto) {
    newErrors.playerPhoto = "Player photo is required";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### File Validation

```javascript
const handleFileChange = (e, fieldName) => {
  const file = e.target.files[0];

  // Size validation
  if (file.size > 5 * 1024 * 1024) {
    setErrors({
      [fieldName]: "File size must be less than 5MB",
    });
    return;
  }

  // Type validation
  if (!file.type.startsWith("image/")) {
    setErrors({
      [fieldName]: "Only image files are allowed",
    });
    return;
  }

  // Process file
  setFiles({ [fieldName]: file });
};
```

## Submission Flow

### Complete Process

1. **Validate Form**

   ```javascript
   if (!validateForm()) {
     showError("Please fill in all required fields");
     return;
   }
   ```

2. **Upload Player Photo**

   ```javascript
   const playerPhotoPath = await uploadFile(
     files.playerPhoto,
     "players-photos",
     "registrations/"
   );
   ```

3. **Upload Payment Proof**

   ```javascript
   const paymentProofPath = await uploadFile(
     files.paymentProof,
     "payment-proofs",
     "registrations/"
   );
   ```

4. **Create Player Record**

   ```javascript
   await playersAPI.create({
     ...formData,
     player_photo: playerPhotoPath,
     payment_proof: paymentProofPath,
   });
   ```

5. **Show Success & Redirect**
   ```javascript
   showSuccess("Registration successful!");
   setTimeout(() => navigate("/players"), 1500);
   ```

## API Methods Used

### From `services/api.js`

**playersAPI.create()**

```javascript
create: async (player) => {
  player.role = player.role.toLowerCase();

  const { data, error } = await supabase
    .from("players")
    .insert([{ ...player, status: "available" }])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

## Storage Policies

### Required Policies

```sql
-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'players-photos');

-- Authenticated upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'players-photos');

-- Authenticated update
CREATE POLICY "Authenticated update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'players-photos');

-- Authenticated delete
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'players-photos');
```

## Performance Optimization

### File Upload

- Compress images before upload (future enhancement)
- Show upload progress (future enhancement)
- Parallel uploads for multiple files

### Database

- Use single insert operation
- Batch validation
- Optimistic UI updates

## Security Considerations

### File Upload Security

- Validate file type on client
- Validate file size on client
- Server-side validation (Supabase)
- Unique filenames prevent overwrites

### Data Security

- Sanitize user input
- Use parameterized queries (Supabase handles)
- Validate data types
- Enforce constraints

## Testing API Integration

### Test File Upload

```javascript
// Test small file
const smallFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
await uploadFile(smallFile, "players-photos", "test/");

// Test large file (should fail)
const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "large.jpg");
// Should trigger validation error
```

### Test Player Creation

```javascript
// Test valid data
const validPlayer = {
  name: "Test Player",
  location: "Udumalpet",
  jersey_size: "M",
  jersey_number: 10,
  role: "batsman",
  player_photo: "path/to/photo.jpg",
  payment_proof: "path/to/proof.jpg",
  base_price: 100,
};
await playersAPI.create(validPlayer);

// Test duplicate jersey number (should fail)
await playersAPI.create({ ...validPlayer, name: "Another Player" });
```

## Troubleshooting

### Storage Issues

- Verify bucket exists
- Check bucket policies
- Confirm file permissions
- Review Supabase logs

### Database Issues

- Check table schema
- Verify column types
- Review constraints
- Check RLS policies

### Network Issues

- Implement retry logic
- Add timeout handling
- Show loading states
- Provide error feedback
