# Phase 2.3: Seller Features Integration

**Status**: Ready for Implementation  
**Scope**: Seller Registration → Dashboard → Earnings

---

## Components to Update

### 1. Seller Registration Page

**File**: `src/app/(app)/seller/register/page.tsx`

**Current**: Uses `sellerService.registerSeller()`  
**Update to**: Use `sellersAPI.register()`

#### Implementation

```typescript
import { sellersAPI } from '@/lib/api';

const handleRegister = async () => {
  try {
    const result = await sellersAPI.register({
      shop_name: formData.shop_name,
      owner_name: formData.owner_name,
      email: formData.email,
      phone: formData.phone,
      mpesa_number: formData.mpesa_number,
      shop_address: formData.shop_address,
      category: formData.category,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });

    if (result.id) {
      alert('Seller account created successfully!');
      router.push('/seller/dashboard');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || 'Registration failed';
    alert(errorMsg);
  }
};
```

**Form Data**:
- ✅ Shop name
- ✅ Owner name
- ✅ Email (must be unique)
- ✅ Phone number
- ✅ M-Pesa number
- ✅ Shop address
- ✅ Category (groceries, restaurants, etc.)
- ✅ Location (latitude/longitude)

---

### 2. Seller Dashboard

**File**: `src/app/(app)/seller/dashboard/page.tsx`

**Current**: Shows placeholder data  
**Update to**: Fetch from API

#### Implementation

```typescript
import { sellersAPI } from '@/lib/api';

// On component mount
useEffect(() => {
  fetchSellerData();
}, []);

const fetchSellerData = async () => {
  try {
    const [profile, orders, earnings] = await Promise.all([
      sellersAPI.getProfile(),
      sellersAPI.getOrders({ limit: 20 }),
      sellersAPI.getEarnings('monthly')
    ]);

    setProfile(profile);
    setOrders(orders);
    setEarnings(earnings);
  } catch (error) {
    console.error('Failed to fetch seller data:', error);
    // Redirect to login if 401
  }
};
```

**Display Data**:

#### Profile Section
```
Shop Name: {{ profile.shop_name }}
Category: {{ profile.category }}
Verification Status: {{ profile.verification_status }}
M-Pesa Status: {{ profile.mpesa_verified ? 'Verified' : 'Not Verified' }}
```

#### Stats Cards
```
Total Orders: {{ orders.length }}
Pending Orders: {{ orders.filter(o => o.status === 'pending').length }}
Total Earnings: KSh {{ earnings.total_earnings }}
Net Earnings: KSh {{ earnings.net_earnings }}
```

#### Recent Orders
```
Order ID | Customer | Items | Amount | Status
---------|----------|-------|--------|-------
order_1  | John     | 3     | 1,100  | confirmed
order_2  | Jane     | 2     | 850    | preparing
```

#### Update Order Status

```typescript
const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const updated = await sellersAPI.updateOrderStatus(orderId, newStatus);
    // Update local state
    setOrders(orders.map(o => o.id === orderId ? updated : o));
  } catch (error) {
    alert('Failed to update order');
  }
};
```

---

### 3. M-Pesa Verification

**File**: `src/app/(app)/seller/register/page.tsx` (Step 3)

#### Implementation

```typescript
const handleVerifyMPesa = async () => {
  try {
    const result = await sellersAPI.verifyMPesa(formData.mpesa_number);
    
    if (result.verified) {
      alert('M-Pesa number verified!');
      // Complete registration
      setStep(4); // or navigate to dashboard
    } else {
      alert('Verification failed. Please check the number.');
    }
  } catch (error) {
    alert('M-Pesa verification error: ' + error.message);
  }
};
```

---

### 4. Earnings & Withdrawals

**File**: `src/app/(app)/seller/earnings/page.tsx` (NEW)

#### Implementation

```typescript
import { sellersAPI } from '@/lib/api';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const data = await sellersAPI.getEarnings('monthly');
      setEarnings(data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  };

  const handleWithdrawal = async (amount: number) => {
    setWithdrawing(true);
    try {
      const result = await sellersAPI.requestWithdrawal(amount);
      alert('Withdrawal request submitted!');
      // Refresh earnings
      fetchEarnings();
    } catch (error) {
      alert('Withdrawal failed: ' + error.message);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <h1>Earnings</h1>
      <div className="stats">
        <div>Total: KSh {earnings?.total_earnings}</div>
        <div>Fees: KSh {earnings?.platform_fees}</div>
        <div>Net: KSh {earnings?.net_earnings}</div>
      </div>
      
      <button onClick={() => handleWithdrawal(earnings?.net_earnings)}>
        Withdraw All
      </button>
      
      <table>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Order</th>
        </tr>
        {earnings?.transactions.map(t => (
          <tr key={t.order_id}>
            <td>{t.date}</td>
            <td>KSh {t.amount}</td>
            <td>{t.order_id}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

## API Endpoints Used

### Registration
```
POST /sellers/register
Response: { id, shop_name, email, verification_status }
```

### Profile
```
GET /sellers/me
Response: { id, shop_name, email, mpesa_verified, ... }
```

### Orders
```
GET /sellers/me/orders?status=pending
Response: [{ id, status, customer_name, items, total_amount }]

PATCH /sellers/me/orders/{id}
Body: { status: 'preparing' | 'ready' | 'completed' }
```

### Earnings
```
GET /sellers/me/earnings?period=monthly
Response: { 
  total_earnings, 
  platform_fees, 
  net_earnings,
  transactions: [{ date, amount, order_id }]
}
```

### Withdrawals
```
POST /sellers/me/withdrawals
Body: { amount: 45000 }
Response: { id, amount, status: 'pending' }
```

---

## Error Handling

### Authentication Required
```
Error: 401 Unauthorized
Action: Redirect to login
```

### Email Already Used
```
Error: Email already registered as seller
Action: Show error, let user change email
```

### M-Pesa Verification Failed
```
Error: M-Pesa verification failed
Action: Show error, let user retry with different number
```

### Withdrawal Amount Too High
```
Error: Insufficient earnings
Action: Show available balance, let user choose amount
```

---

## Testing Checklist

- [ ] Can register as seller (3-step form)
- [ ] Form validates all required fields
- [ ] Geolocation works
- [ ] M-Pesa verification endpoint called
- [ ] Seller dashboard loads seller data
- [ ] Stats display correctly
- [ ] Orders list shows seller orders
- [ ] Can update order status
- [ ] Can view earnings
- [ ] Can request withdrawal
- [ ] No console errors
- [ ] Token sent with all requests

---

## Status

- [x] API Client has seller functions
- [x] Registration page structure exists
- [x] Dashboard page structure exists
- [ ] Need to update imports in pages
- [ ] Need to add API calls to components
- [ ] Need to add error handling
- [ ] Need to add loading states

---

## Quick Implementation Checklist

**Seller Registration Page**:
- [ ] Import `sellersAPI`
- [ ] Replace `sellerService.registerSeller()` with `sellersAPI.register()`
- [ ] Update error handling

**Seller Dashboard**:
- [ ] Import `sellersAPI`
- [ ] Add `useEffect` to fetch data on mount
- [ ] Replace placeholder data with API data
- [ ] Add error handling for 401 (redirect to login)

**M-Pesa Verification**:
- [ ] Import `sellersAPI`
- [ ] Call `sellersAPI.verifyMPesa()` on verify button
- [ ] Handle success/failure responses

**Earnings Page**:
- [ ] Create new page
- [ ] Import `sellersAPI`
- [ ] Fetch earnings on mount
- [ ] Display transactions table
- [ ] Implement withdrawal button

---

## Related Files

- `src/lib/api.ts` - API endpoints
- `src/app/(app)/seller/register/page.tsx`
- `src/app/(app)/seller/dashboard/page.tsx`
- `.env.local` - API configuration

