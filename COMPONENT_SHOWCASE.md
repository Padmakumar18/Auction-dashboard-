# Component Showcase - Registration Form

## Components Used

### 1. Card Component

```jsx
<Card>{/* Form content */}</Card>
```

**Purpose:** Main container with shadow and padding
**Styling:** White background, rounded corners, shadow

### 2. Input Component

```jsx
<Input
  label="Player Name"
  name="name"
  value={formData.name}
  onChange={handleInputChange}
  placeholder="Enter your full name"
  required
  error={errors.name}
/>
```

**Features:**

- Label with required indicator
- Error state styling
- Focus ring
- Placeholder text

### 3. Select Component

```jsx
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
```

**Features:**

- Dropdown with options
- Placeholder text
- Error state
- Required indicator

### 4. UploadInput Component (Standard)

```jsx
<UploadInput
  label="Player Photo"
  onChange={(e) => handleFileChange(e, "playerPhoto")}
  required
  error={errors.playerPhoto}
  accept="image/*"
/>
```

**Features:**

- File input styling
- Accept attribute
- Error handling

### 5. FileUploadWithPreview Component (Enhanced)

```jsx
<FileUploadWithPreview
  label="Player Photo"
  onChange={(e) => handleFileChange(e, "playerPhoto")}
  preview={previews.playerPhoto}
  required
  error={errors.playerPhoto}
/>
```

**Features:**

- Drag-and-drop zone
- Image preview
- Hover effects
- Visual feedback
- File size indicator

### 6. Button Component

```jsx
<Button type="submit" variant="primary" size="lg" disabled={loading}>
  {loading ? "Registering..." : "Register Player"}
</Button>
```

**Variants:**

- `primary` - Blue background
- `secondary` - Green background
- `danger` - Red background
- `outline` - White with border

**Sizes:**

- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

## Layout Structure

### Standard Form Layout

```
┌─────────────────────────────────┐
│         Page Header             │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │   Personal Information    │  │
│  │  [Name]      [Location]   │  │
│  ├───────────────────────────┤  │
│  │     Jersey Details        │  │
│  │  [Size]      [Number]     │  │
│  ├───────────────────────────┤  │
│  │      Playing Role         │  │
│  │        [Role]             │  │
│  ├───────────────────────────┤  │
│  │    Upload Documents       │  │
│  │  [Photo]     [Payment]    │  │
│  ├───────────────────────────┤  │
│  │  [Submit]    [Cancel]     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │   Registration Info       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Enhanced Form Layout

```
┌─────────────────────────────────┐
│         Page Header             │
│       Step 1 of 4               │
├─────────────────────────────────┤
│    [Progress Bar: ████░░░░]    │
│   Personal Jersey Role Docs    │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │    Current Step Content   │  │
│  │                           │  │
│  │      [Form Fields]        │  │
│  │                           │  │
│  ├───────────────────────────┤  │
│  │  [Previous]    [Next]     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Responsive Behavior

### Mobile (< 640px)

- Single column layout
- Full-width inputs
- Stacked buttons
- Larger touch targets

### Tablet (640px - 1024px)

- Two-column grid for inputs
- Side-by-side file uploads
- Optimized spacing

### Desktop (> 1024px)

- Max-width container (1024px)
- Centered layout
- Optimal line length
- Enhanced hover states

## Color Palette

```css
Primary Blue:   #2563eb
Success Green:  #10b981
Error Red:      #ef4444
Gray Text:      #374151
Light Gray:     #f3f4f6
Border Gray:    #d1d5db
```

## Accessibility Features

- Keyboard navigation support
- Focus indicators
- Required field markers
- Error announcements
- Label associations
- Touch-friendly targets (44px min)
