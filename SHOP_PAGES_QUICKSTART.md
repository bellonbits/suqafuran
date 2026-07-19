# Shop Pages Implementation - Quick Start Guide

## What Was Built

A complete shop browsing experience for the Suqafuran marketplace with:
- Browse and search marketplace shops
- Filter by seller rating/trust level
- Sort by rating, reviews, distance, or name
- Featured shops section
- Scroll position memory when navigating
- Mobile-responsive design
- Error handling and loading states

## How to Access

### 1. **Browse All Shops**
Navigate to `/shops` or add link:
```tsx
<Link to="/shops">Browse Shops</Link>
```

### 2. **Individual Shop/Seller Pages**
The shops page links to individual seller profiles:
- Clicking a shop card → `/seller/{seller_id}`
- Shows seller's listings and information

### 3. **Business Storefronts** (Optional)
For storefront businesses (from Business Dashboard):
- Route: `/shop/{slug}`
- Shows: Products, Reviews, About, Contact info
- Already enhanced with reviews tab and scroll memory

## Key Features

### Search
- Type to search shop names
- Debounced for performance
- URL params saved (bookmarkable)

### Filtering
- Filter by trust level/category
- Desktop sidebar (always visible)
- Mobile drawer (tap "Filters" button)

### Sorting
- Highest Rated (default)
- Most Reviews
- Nearest (if location available)
- A to Z

### View Modes
- **Grid**: Multi-column responsive layout
- **List**: Compact horizontal view

### Featured Section
- Shows verified shops with 4.5+ rating
- Only visible without search queries
- Top 6 shops displayed

### Scroll Memory
- Scroll position saved on navigation
- Restored when returning via back button
- Works across page refreshes
- Uses sessionStorage (cleared on browser close)

## Code Usage Examples

### Navigate to Shops Page
```tsx
import { Link } from 'react-router-dom';

export function Navigation() {
  return <Link to="/shops" className="...">Browse Shops</Link>;
}
```

### Using Scroll Position Hook
```tsx
import { useScrollPosition } from '../hooks/useScrollPosition';

function MyPage() {
  // Save/restore scroll automatically
  useScrollPosition('my-page-key', []);
  
  return <div>...</div>;
}
```

### Using Scroll Context
```tsx
import { useScrollContext } from '../contexts/ScrollContext';

function MyComponent() {
  const { savePosition, getPosition } = useScrollContext();
  
  return (
    <>
      <button onClick={() => savePosition('key', 0, 100)}>
        Save Position
      </button>
    </>
  );
}
```

### Using Star Rating Component
```tsx
import { StarRating } from '../components/StarRating';

function ShopCard() {
  return (
    <div>
      <StarRating 
        rating={4.5} 
        count={128} 
        size="md"
      />
    </div>
  );
}
```

## File Structure

```
src/
├── hooks/
│   └── useScrollPosition.ts          # Scroll position memory hook
├── contexts/
│   └── ScrollContext.tsx              # Scroll context provider
├── pages/
│   ├── ShopsPage.tsx                 # NEW - Shop browsing page
│   └── ShopProfile.tsx               # ENHANCED - Reviews + scroll
├── components/
│   └── StarRating.tsx                # NEW - Star rating component
└── App.tsx                           # UPDATED - Route added

Routes Added:
- GET /shops                          # Browse shops
- GET /shops?search=...               # Search shops
- GET /shops?sort=...                 # Different sort options
- GET /shops?category=...             # Filter by category
```

## API Endpoints Called

### Shops Page
```
GET /sellers/?search={query}&limit=50
GET /businesses/nearby?lat={lat}&lng={lng}&limit=6
```

### Shop Detail
```
GET /businesses/public/{slug}
```

## Browser Requirements

- Modern browser with ES6+ support
- sessionStorage API enabled
- JavaScript enabled
- Cookies enabled (for auth)

## Troubleshooting

### Shops not loading?
1. Check network tab for API errors
2. Verify seller data endpoint is working
3. Check browser console for error details

### Scroll position not restoring?
1. Ensure sessionStorage is enabled
2. Check if page was opened in new tab (won't restore)
3. Verify you're using back button (not direct link)

### Search not working?
1. Wait 300ms for debounce
2. Check if seller data contains search field
3. Verify search query in URL params

### Featured shops not showing?
1. Requires geolocation permission
2. Needs verified sellers with 4.5+ rating
3. Only shows with no active search

## Customization

### Change Primary Color
Edit the styles in components to use different color (default: #0ea5e9 sky blue)

### Adjust Debounce Time
In ShopsPage.tsx, line ~130:
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300); // Change this value (ms)
```

### Modify Sort Options
In ShopsPage.tsx, line ~24:
```tsx
const SORT_OPTIONS = [
  { id: 'rating-desc', label: 'Highest Rated', icon: Star },
  // Add/remove options here
];
```

### Change Skeleton Count
In ShopsPage.tsx, line ~161:
```tsx
{[...Array(6)].map((_, i) => (
  // Change 6 to show more/less skeleton cards
))}
```

## Performance Notes

- Search debounced at 300ms (prevent excessive API calls)
- Queries cached for 5 minutes (React Query default)
- Memoized filtering/sorting (prevent unnecessary re-renders)
- Lazy-loaded page (only loaded when accessed)
- sessionStorage for scroll (no server round-trip)

## Mobile Considerations

- Filter drawer collapses on mobile
- Grid responsive: 2 columns on mobile, 3 on desktop
- List view works on all screen sizes
- Touch-friendly button sizes (min 44x44px)
- Sticky header for easier navigation

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG standards
- Star ratings use text fallback

## Next Steps

1. **Test the feature**:
   - Go to `/shops`
   - Search, filter, sort
   - Click a shop to view seller profile
   - Use back button to verify scroll restoration

2. **Add navigation link**:
   - Add link in header/navigation to `/shops`
   - Update any shop-related navigation

3. **Monitor performance**:
   - Check network tab for API calls
   - Monitor for memory leaks
   - Track user engagement

4. **Gather feedback**:
   - User testing on mobile/desktop
   - A/B test sort options
   - Measure conversion to seller profiles

## Support & Issues

For issues or enhancements:
1. Check SHOP_PAGES_IMPLEMENTATION.md for detailed docs
2. Review console errors in browser DevTools
3. Verify API endpoints are working
4. Check network requests in Network tab

## Deployment

No additional environment variables needed.
Existing API endpoints are used:
- `/sellers/`
- `/businesses/nearby`
- `/businesses/public/{slug}`

Just deploy the updated code to staging/production.
