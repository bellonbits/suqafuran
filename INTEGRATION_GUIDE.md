# Attribute System Integration Guide

Complete guide for integrating the dynamic attribute system into your Suqafuran marketplace.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Components Overview](#components-overview)
3. [Integration Steps](#integration-steps)
4. [Testing Guide](#testing-guide)
5. [Troubleshooting](#troubleshooting)

---

## Overview

The attribute system enables:
- ✅ **Dynamic Forms** - Forms adapt based on selected category
- ✅ **Advanced Filtering** - Filter by any product attribute
- ✅ **Full-Text Search** - Search across attributes + product data
- ✅ **Multilingual** - Support for English and Somali

**Architecture:**
- Backend: FastAPI with SQLModel ORM
- Frontend: React with TypeScript
- Database: PostgreSQL (DigitalOcean)
- Components: 2 reusable React components + 2 example pages

---

## Components Overview

### 1. ListingAttributeForm

**Purpose:** Dynamically renders form fields based on category/subcategory selection.

**Props:**
```typescript
interface ListingAttributeFormProps {
  categoryId?: number;              // Category ID
  subcategoryId?: number;           // Subcategory ID (optional)
  onAttributesChange: (attributes: Record<string, string | string[]>) => void;
  initialValues?: Record<string, string | string[]>;
}
```

**Supported Field Types:**
- `text` - Single line text input
- `number` - Numeric input with min/max
- `date` - Date picker
- `textarea` - Multi-line text
- `select` - Dropdown single select
- `multiselect` - Checkbox multi-select
- `checkbox` - Boolean toggle

**Example Usage:**
```tsx
import ListingAttributeForm from '@/components/ListingAttributeForm';

<ListingAttributeForm
  categoryId={12}  // Phones
  subcategoryId={undefined}
  onAttributesChange={(attrs) => setAttributes(attrs)}
/>
```

---

### 2. ListingSearch

**Purpose:** Provides search and filtering UI with sidebar filters.

**Props:**
```typescript
interface ListingSearchProps {
  categoryId?: number;
  subcategoryId?: number;
  onResultsChange?: (results: SearchResult[]) => void;
}
```

**Features:**
- Full-text search across titles & descriptions
- Price range filtering (min/max)
- Dynamic attribute filters loaded per category
- Result grid display with images & prices
- Click to navigate to listing detail

**Example Usage:**
```tsx
import ListingSearch from '@/components/ListingSearch';

<ListingSearch
  categoryId={12}
  onResultsChange={(results) => setSearchResults(results)}
/>
```

---

## Integration Steps

### Step 1: Add Routes to Your Router

```tsx
// src/App.tsx or your main router file
import CreateListingPage from '@/pages/CreateListingPage';
import BrowseListingsPage from '@/pages/BrowseListingsPage';

const router = [
  {
    path: '/listings/create',
    element: <CreateListingPage />
  },
  {
    path: '/browse',
    element: <BrowseListingsPage />
  },
  // ... other routes
];
```

### Step 2: Update Navigation Links

```tsx
// Header/Navigation component
<nav>
  <a href="/browse">Browse Listings</a>
  <a href="/listings/create">Create Listing</a>
</nav>
```

### Step 3: Customize Create Listing Page

The `CreateListingPage.tsx` includes all necessary components but you may want to:

**Add more fields:**
```tsx
<div>
  <label>SKU (optional)</label>
  <input
    type="text"
    name="sku"
    value={formData.sku}
    onChange={handleInputChange}
  />
</div>
```

**Customize validation:**
```tsx
const validateForm = () => {
  if (!formData.title_en.trim()) {
    setError('Title cannot be empty');
    return false;
  }
  if (formData.price <= 0) {
    setError('Price must be greater than 0');
    return false;
  }
  return true;
};
```

**Add file upload progress:**
```tsx
const [uploadProgress, setUploadProgress] = useState(0);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... in axios call
  const response = await axios.post('/api/v1/listings/upload', formDataImg, {
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(progress);
    }
  });
};
```

### Step 4: Customize Browse/Search Page

The `BrowseListingsPage.tsx` can be enhanced with:

**Save search filters:**
```tsx
useEffect(() => {
  const params = new URLSearchParams();
  if (selectedCategory) params.append('category_id', selectedCategory.toString());
  window.history.replaceState({}, '', `?${params.toString()}`);
}, [selectedCategory]);
```

**Recent searches:**
```tsx
const [recentSearches, setRecentSearches] = useState<string[]>([]);

const saveSearch = (query: string) => {
  setRecentSearches((prev) => [query, ...prev.slice(0, 4)]);
  localStorage.setItem('recentSearches', JSON.stringify([query, ...prev.slice(0, 4)]));
};
```

---

## Testing Guide

### End-to-End Test Flow

#### 1. **Create Test Listing (Category 12 - Phones)**

```
1. Navigate to /listings/create
2. Select Category: "Phones"
3. Fill in:
   - Title: "iPhone 14 Pro Max"
   - Description: "Like new condition, minimal scratches"
   - Price: 800
   - Location: "New York, NY"
4. Upload 2-3 test images
5. Fill Attributes:
   - Brand: "Apple"
   - Model: "iPhone 14 Pro Max"
   - Condition: "Like New"
   - Storage: "256GB"
   - RAM: "6GB"
   - Color: "Silver"
   - Network: "5G"
   - Warranty: "Yes"
6. Click "Create Listing"
7. ✅ Should redirect to listing detail page
```

#### 2. **Search & Filter Test**

```
1. Navigate to /browse
2. Click "Phones" category button
3. Verify filters appear in sidebar:
   - Brand (text)
   - Model (text)
   - Condition (select)
   - Storage (select)
   - RAM (select)
   - Color (text)
   - Network (select)
   - Warranty (select)
4. Select filters:
   - Condition: "Like New"
   - Storage: "256GB"
5. Click "Search"
6. ✅ Should show your test listing
7. Click on listing → should navigate to detail page
```

#### 3. **API Endpoint Tests**

**Test attribute filters endpoint:**
```bash
curl -X GET "http://localhost:8000/api/v1/attribute-filters/12" | jq .

# Expected response:
# {
#   "category_id": 12,
#   "filters": [
#     {
#       "id": 1,
#       "name": "Brand",
#       "slug": "brand",
#       "field_type": "text",
#       "required": true,
#       "options": []
#     },
#     ...
#   ]
# }
```

**Test search endpoint:**
```bash
curl -X GET "http://localhost:8000/api/v1/listings/search?q=iphone&category_id=12&min_price=500&max_price=1000" | jq .

# Test with attribute filters:
curl -X GET "http://localhost:8000/api/v1/listings/search?category_id=12&attributes={\"condition\":[\"like-new\"],\"storage\":[\"256gb\"]}" | jq .
```

**Test listing attributes:**
```bash
# After creating a listing, replace LISTING_ID
curl -X GET "http://localhost:8000/api/v1/listings/LISTING_ID/attributes" | jq .
```

---

## Troubleshooting

### Issue: "Category not found" error

**Solution:**
```tsx
// Check if category is being passed correctly
console.log('Selected Category ID:', categoryId);
console.log('Parsed as integer:', parseInt(categoryId.toString()));

// Ensure category ID is a number, not string
const numericId = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
```

### Issue: Attributes not loading in form

**Solution:**
1. Check browser console for errors
2. Verify category ID is set before rendering form
3. Check API endpoint returns data:
```bash
curl -X GET "http://localhost:8000/api/v1/category-attributes/category/12" | jq .
```

### Issue: Search returns "Method Not Allowed"

**Solution:**
```bash
# Restart backend to pick up new routes
docker restart suqafuran-backend
docker exec suqafuran-backend curl -X GET "http://localhost:8000/api/v1/attribute-filters/12"
```

### Issue: Duplicate attribute options in dropdown

**Solution:**
The seeding script may have created duplicates if run multiple times. To clean up:

```sql
-- Remove duplicate options
DELETE FROM attribute_option
WHERE id NOT IN (
  SELECT MIN(id) FROM attribute_option
  GROUP BY attribute_id, value
);
```

### Issue: Form fields not updating when category changes

**Solution:**
```tsx
// Ensure useEffect has correct dependency
useEffect(() => {
  fetchAttributes(categoryId, subcategoryId);
}, [categoryId, subcategoryId]); // Include both in dependencies

// Clear values when category changes
useEffect(() => {
  if (categoryId) {
    setAttributes({}); // Reset attributes
  }
}, [categoryId]);
```

---

## Performance Optimization

### 1. Cache Category Data

```tsx
// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('categories');
    if (cached) {
      setCategories(JSON.parse(cached));
      setLoading(false);
      return;
    }

    axios.get('/api/v1/listings/categories')
      .then((res) => {
        setCategories(res.data);
        localStorage.setItem('categories', JSON.stringify(res.data));
      })
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
};
```

### 2. Debounce Search

```tsx
import { useCallback, useState } from 'react';

export const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Usage
const debouncedSearch = useDebounce((query) => {
  handleSearch(query);
}, 300);
```

### 3. Lazy Load Images

```tsx
<img
  src={listing.images[0]}
  alt={listing.title}
  loading="lazy"
  className="w-full h-48 object-cover"
/>
```

---

## Next Steps

1. ✅ **Test the complete flow** using the guide above
2. ✅ **Customize UI/UX** to match your design system
3. ✅ **Add analytics** to track searches and listings created
4. ✅ **Mobile optimization** - test on iOS/Android
5. ✅ **Performance monitoring** - track query times in production

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API logs: `docker logs suqafuran-backend`
3. Check database: Use the provided psql commands
4. Browser console for frontend errors: `F12` → Console tab
