# Beautiful Design Integration Guide

Complete guide for using the new RENTRA-inspired listing pages with professional UI/UX.

## 🎨 New Pages Overview

### 1. **ListingFormPage** - Multi-Step Listing Creation/Edit
Professional 4-step form for creating and editing listings.

**Route Setup:**
```tsx
// In your router/App.tsx
import ListingFormPage from '@/pages/ListingFormPage';
import ListingDetailPage from '@/pages/ListingDetailPage';

const routes = [
  { path: '/listings/create', element: <ListingFormPage /> },
  { path: '/listings/:listingId/edit', element: <ListingFormPage /> },
  { path: '/listings/:listingId', element: <ListingDetailPage /> },
];
```

**Features:**
- ✅ **Step 1: Detail Properties**
  - Address/Location input
  - Category selector
  - Condition dropdown
  - English title (required)
  - Price input (required)
  - Description field
  - Negotiable toggle

- ✅ **Step 2: Properties Media**
  - Drag-and-drop image upload
  - Up to 10 images
  - Image preview grid
  - Remove individual images
  - Upload progress indication

- ✅ **Step 3: Edit Template**
  - Dynamic attributes form loads here
  - Category-specific fields
  - Fully integrated with attribute system

- ✅ **Step 4: Submit Review**
  - Final review of all details
  - Image thumbnails
  - Summary of information
  - Publish/Update button

**Usage:**
```tsx
// Create new listing
<Link to="/listings/create">Create Listing</Link>

// Edit existing listing
<Link to={`/listings/${listingId}/edit`}>Edit</Link>
```

---

### 2. **ListingDetailPage** - Professional Listing View
Beautiful detail page for viewing listings.

**Features:**
- ✅ **Image Gallery**
  - Full-size main image display
  - Thumbnail selector
  - Image counter
  - Responsive layout

- ✅ **Listing Details Sidebar**
  - Large, prominent price display
  - Negotiable badge
  - Title and location
  - Condition badge
  - Seller verification status

- ✅ **Description Section**
  - Full markdown-supported description
  - Clean typography

- ✅ **Attributes Grid**
  - Display all saved attributes
  - Organized in 2-4 column grid
  - Blue accent borders
  - Clean typography

- ✅ **Safety Tips**
  - Important user protection information
  - Yellow warning style
  - Always visible

**Usage:**
```tsx
<Link to={`/listings/${listing.id}`}>View Listing</Link>
```

---

### 3. **StepIndicator** - Visual Progress Indicator
Reusable component showing multi-step form progress.

**Props:**
```typescript
interface StepIndicatorProps {
  steps: Array<{
    key: string;
    number: string;
    title: string;
  }>;
  currentStep: string;
}
```

**Usage:**
```tsx
<StepIndicator
  steps={[
    { key: 'details', number: '01', title: 'Detail Properties' },
    { key: 'media', number: '02', title: 'Properties Media' },
    { key: 'template', number: '03', title: 'Edit Template' },
    { key: 'submit', number: '04', title: 'Submit Listing' },
  ]}
  currentStep={currentStep}
/>
```

---

## 🎯 Integration Steps

### Step 1: Update Your Router

```tsx
// src/App.tsx or router.tsx
import CreateListingPage from '@/pages/ListingFormPage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import ListingSearchPage from '@/pages/ListingSearch'; // From before

const router = [
  {
    path: '/listings/create',
    element: <ListingFormPage />
  },
  {
    path: '/listings/:listingId',
    element: <ListingDetailPage />
  },
  {
    path: '/listings/:listingId/edit',
    element: <ListingFormPage />
  },
  {
    path: '/browse',
    element: <ListingSearchPage />
  },
  // ... other routes
];
```

### Step 2: Update Navigation

```tsx
// In your Header/Nav component
<nav className="flex gap-4">
  <Link to="/browse" className="text-gray-700 hover:text-gray-900">
    Browse Listings
  </Link>
  <Link to="/listings/create" className="bg-blue-600 text-white px-4 py-2 rounded">
    Create Listing
  </Link>
</nav>
```

### Step 3: Update Search Results

```tsx
// In ListingSearch component or search results page
{results.map((listing) => (
  <Link
    key={listing.id}
    to={`/listings/${listing.id}`}
    className="bg-white rounded-lg shadow hover:shadow-lg transition"
  >
    <img src={listing.images[0]} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3>{listing.title}</h3>
      <p className="text-2xl font-bold text-blue-600">
        ${listing.price.toLocaleString()}
      </p>
    </div>
  </Link>
))}
```

---

## 🧪 Testing the Full Flow

### Create New Listing
```
1. Click "Create Listing" button
2. Fill Step 1 (Detail Properties):
   - Address: "123 Main St, New York, NY"
   - Category: "Property"
   - Condition: "Good"
   - Title: "Modern 2BR Apartment"
   - Price: "2500"
   - Description: "Beautiful apartment with great views"
3. Click "Next →"
4. Upload images in Step 2
5. Add attributes in Step 3
6. Review in Step 4
7. Click "Publish Listing"
8. ✅ Should redirect to listing detail page
```

### View & Edit Listing
```
1. From listing detail page, click "Edit"
2. Form loads with pre-filled data
3. Modify any fields
4. Change images, attributes
5. Click "Update Listing"
6. ✅ Should show success message
```

---

## 🎨 Design Features

### Color Scheme
- **Primary**: Blue (#2563EB)
- **Dark**: Gray-900 (#111827)
- **Light**: Gray-50 (#F9FAFB)
- **Accent**: Yellow (safety tips)

### Typography
- **Headings**: Bold, gray-900
- **Body**: Regular, gray-700
- **Labels**: Semibold, gray-900
- **Secondary**: Regular, gray-600

### Components
- **Cards**: White background, shadow, rounded corners
- **Buttons**: Full-width in forms, consistent padding
- **Inputs**: Consistent border and focus styles
- **Badges**: Color-coded (blue for primary, yellow for warnings)

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Full-width buttons
- Stacked form fields
- Thumbnail gallery below main image

### Tablet (768px - 1024px)
- 2 column grid for details
- Side-by-side images and info

### Desktop (> 1024px)
- 3 column layout (images, details, sidebar)
- Full step indicator visible
- Multi-column attribute grid

---

## ⚙️ Customization

### Change Primary Color
Find and replace `#2563EB` (blue) with your brand color:
```tsx
// Before
className="bg-blue-600 hover:bg-blue-700"

// After
className="bg-purple-600 hover:bg-purple-700"
```

### Add Custom Fields
In `ListingFormPage.tsx`, add to form state:
```tsx
const [formData, setFormData] = useState<FormState>({
  // ... existing fields
  squareFeet: '',
  yearBuilt: '',
  hoaFees: '',
});
```

### Customize Steps
Modify the `steps` array in `ListingFormPage.tsx`:
```tsx
const steps = [
  { key: 'details', number: '01', title: 'Basic Info' },
  { key: 'media', number: '02', title: 'Photos' },
  { key: 'features', number: '03', title: 'Features' },  // New
  { key: 'submit', number: '04', title: 'Review' },
];
```

---

## 🔧 API Integration

### Create Listing
```typescript
POST /api/v1/listings
{
  title_en: "string",
  description_en: "string",
  price: number,
  location: "string",
  condition: "string",
  category_id: number,
  subcategory_id?: number,
  images: ["url1", "url2"],
  attributes: { "brand": "value" },
  is_negotiable: boolean
}
```

### Update Listing
```typescript
PUT /api/v1/listings/{id}
// Same payload as create
```

### Get Listing
```typescript
GET /api/v1/listings/{id}
// Returns full listing with all details
```

### Get Listing Attributes
```typescript
GET /api/v1/listings/{id}/attributes
// Returns array of attributes with values
```

---

## 🚀 Performance Tips

### 1. Image Optimization
```tsx
<img
  src={img}
  alt="listing"
  loading="lazy"
  className="w-full h-full object-cover"
/>
```

### 2. Memoize Components
```tsx
const MemoizedStepIndicator = React.memo(StepIndicator);
```

### 3. Cache Images
```tsx
const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
```

### 4. Debounce Search
```tsx
const debouncedSearch = useCallback(
  debounce((query: string) => handleSearch(query), 300),
  []
);
```

---

## 🐛 Common Issues

### Images not uploading
- Check CORS headers on upload endpoint
- Verify file size limits (MAX_FILE_SIZE)
- Check browser console for errors

### Form not submitting
- Verify all required fields are filled
- Check network tab for API errors
- Ensure category_id is selected

### Attributes not showing
- Verify attributes are assigned to category
- Check database for category_attribute records
- Ensure attribute API is returning data

### Edit not loading data
- Confirm listing exists with that ID
- Check if user has permission to edit
- Verify listing data in response

---

## ✨ Success Checklist

- [ ] Routes added to router
- [ ] Navigation links updated
- [ ] Create listing page working
- [ ] Edit listing page working
- [ ] Detail page displaying correctly
- [ ] Images uploading successfully
- [ ] Attributes showing in template step
- [ ] Form validation working
- [ ] Success messages displaying
- [ ] Mobile layout responsive

---

## 📚 Component Structure

```
pages/
├── ListingFormPage.tsx
│   └── Uses StepIndicator, ListingAttributeForm
├── ListingDetailPage.tsx
│   └── Uses image gallery, attributes display
└── BrowseListingsPage.tsx
    └── Uses ListingSearch

components/
├── StepIndicator.tsx
├── ListingAttributeForm.tsx
├── ListingSearch.tsx
└── SearchFilter.tsx
```

---

You're all set with a beautiful, professional listing system! 🎉
