# Shop Detail Page - Glovo-Style Redesign Roadmap

## Current State
- Complex 1883-line component with mixed concerns
- Multiple modals and filter sidebars
- Product grid layout needs refinement

## Glovo Layout Elements to Implement

### 1. Shop Header Section (Top Priority)
```
┌─────────────────────────────────────┐
│ [Banner Image]                      │
│                                     │
│ Shop Name  [Verified Badge]         │
│                                     │
│ 👍 95%  •  ⏱️ 100-120'  •  🚗 Free  │
│                                     │
│ [Price Match] [-76% Promotions]    │
└─────────────────────────────────────┘
```

**To implement:**
- Display rating, delivery time, delivery cost horizontally
- Use icons (👍 ⏱️ 🚗) for visual hierarchy
- Show promotion badges below

### 2. Tab Navigation
```
Promotions  |  Top sellers  |  New Arrivals
─────────────────────────────────────
```

**To implement:**
- Replace category sidebar with horizontal tabs
- Auto-scroll to active tab
- Show/Hide content based on selected tab

### 3. Product Card Redesign
```
┌──────────────┐
│  [-29%]      │
│   Product    │
│    Image     │
│     [+]      │
└──────────────┘
Product Name
KSh497.00
KSh700.00 (strikethrough)
```

**To implement:**
- Discount badge top-right
- Add to cart button on hover/click
- Show current and original price
- Product name and details below

### 4. Section Layout
- "Promotions" with "Show all" button
- Horizontal scrolling product carousel
- "Top sellers" section below
- "New Arrivals" section with show all

### 5. Mobile-First Improvements
- Collapsible category sidebar (optional)
- Sticky header with shop info
- Full-width product cards on mobile
- Smooth tab switching

## Implementation Priority

1. **Phase 1 (High)**: Shop header with stats display
2. **Phase 2 (High)**: Tab-based category navigation
3. **Phase 3 (Medium)**: Product card improvements
4. **Phase 4 (Medium)**: Section layout refinement
5. **Phase 5 (Low)**: Mobile optimizations

## Notes

- Keep existing filtering logic but hide behind filter button
- Maintain current contact/review modals
- Preserve cart functionality
- Test on mobile (width < 640px)
