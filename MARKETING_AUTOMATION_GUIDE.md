# Suqafuran Marketing Automation System

A comprehensive growth engine that turns emails and messages into engagement channels.

## What's Implemented

### 1. **Models** (`backend/app/models/marketing.py`)
- `EmailEventType`: 16 triggered email types
- `UserBrowsingHistory`: Track what users view
- `SavedSearch`: Store user searches for alerts
- `ListingPerformance`: Track views, saves, chats
- `EmailCampaign`: Log sent emails for analytics
- `EmailPreference`: User opt-in preferences
- `UserLifecycleStage`: Track user stage for targeting

### 2. **Service** (`backend/app/services/marketing_service.py`)
- `send_event_email()`: Send templated emails
- `track_listing_view()`: Log browsing behavior
- `send_weekly_digest()`: Curated marketplace digest
- 15 email templates with personalization

### 3. **API** (`backend/app/api/api_v1/endpoints/marketing.py`)
- `GET /marketing/email-preferences`: View settings
- `PUT /marketing/email-preferences`: Update settings
- `POST /marketing/saved-search`: Save a search
- `GET /marketing/saved-searches`: List saved searches
- `DELETE /marketing/saved-search/{id}`: Remove saved search
- `GET /marketing/user-lifecycle`: Check user stage

## How to Trigger Emails

### When User Signs Up
```python
# In auth/registration endpoint
from app.services.marketing_service import marketing_service

await marketing_service.send_event_email(
    session=session,
    user_id=new_user.id,
    event_type=EmailEventType.SIGNUP,
    context={
        "first_name": new_user.first_name,
        "complete_profile_link": "https://suqafuran.com/profile",
        "create_shop_link": "https://suqafuran.com/shop/create",
        "post_listing_link": "https://suqafuran.com/listing/create",
        "download_app_link": "https://suqafuran.com/download"
    }
)
```

### When Listing is Approved
```python
# In listings/approval endpoint
await marketing_service.send_event_email(
    session=session,
    user_id=listing.seller_id,
    event_type=EmailEventType.LISTING_APPROVED,
    context={
        "first_name": seller.first_name,
        "listing_title": listing.title,
        "listing_link": f"https://suqafuran.com/listing/{listing.id}",
        "whatsapp_share_link": f"https://wa.me/?text=Check this: https://suqafuran.com/listing/{listing.id}",
        "facebook_share_link": f"https://facebook.com/sharer/sharer.php?u=https://suqafuran.com/listing/{listing.id}"
    },
    related_listing_id=listing.id
)
```

### When Price Drops
```python
# In listings/update endpoint
old_price = listing.price
listing.price = new_price
session.commit()

# Notify users who saved this
await marketing_service.trigger_price_drop_notifications(
    session=session,
    listing_id=listing.id,
    new_price=new_price,
    old_price=old_price
)
```

### Track Browsing
```python
# In listings/view endpoint
await marketing_service.track_listing_view(
    session=session,
    user_id=current_user.id,
    listing_id=listing_id,
    time_spent_seconds=time_spent
)
```

## Scheduled Tasks (Using Celery)

```python
# celery_tasks.py
from celery import shared_task
from app.services.marketing_service import marketing_service

@shared_task
def send_abandoned_listing_emails():
    """Send emails to sellers with unfinished listings."""
    # Find listings created >2 hours ago but not published
    # Send ABANDONED_LISTING email
    pass

@shared_task
def send_inactive_seller_emails():
    """Re-engage sellers inactive for 14 days."""
    # Find sellers with no login for 14 days
    # Send INACTIVE_SELLER email
    pass

@shared_task
def send_weekly_digest():
    """Send weekly marketplace digest to all users."""
    # For each user in UserLifecycleStage
    # Send WEEKLY_DIGEST email
    pass

@shared_task
def check_saved_searches():
    """Send alerts when new listings match saved searches."""
    # For each SavedSearch
    # Find new listings matching criteria
    # Send SAVED_SEARCH_MATCH email
    pass

@shared_task
def send_birthday_emails():
    """Send birthday emails."""
    # Find users with birthday today
    # Send BIRTHDAY email
    pass
```

## Frontend Integration

### Email Preference Center
```typescript
// new-frontend/src/app/settings/notifications/page.tsx
import api from '@/services/api';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    api.get('/marketing/email-preferences').then(res => 
      setPreferences(res.data)
    );
  }, []);

  const updatePreference = async (key: string, value: boolean) => {
    await api.put('/marketing/email-preferences', {
      ...preferences,
      [key]: value
    });
  };

  return (
    <div>
      <h2>Email Notifications</h2>
      
      <label>
        <input 
          type="checkbox" 
          checked={preferences?.new_messages}
          onChange={(e) => updatePreference('new_messages', e.target.checked)}
        />
        Email me when I receive messages
      </label>
      
      <label>
        <input 
          type="checkbox" 
          checked={preferences?.price_drops}
          onChange={(e) => updatePreference('price_drops', e.target.checked)}
        />
        Alert me about price drops on saved items
      </label>
      
      <label>
        <input 
          type="checkbox" 
          checked={preferences?.marketplace_digest}
          onChange={(e) => updatePreference('marketplace_digest', e.target.checked)}
        />
        Send me weekly marketplace digest
      </label>
    </div>
  );
}
```

### Save Search
```typescript
// When user clicks "Save Search"
const saveSearch = async (query: string, categoryId?: number) => {
  await api.post('/marketing/saved-search', {
    search_query: query,
    category_id: categoryId,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
  });
  toast.success('Search saved! You\'ll get email alerts for new listings.');
};
```

## Analytics Dashboard

Track email effectiveness:
- Open rate by email type
- Click-through rate
- Conversion rate (email → listing view → contact)
- Subscriber retention
- Most effective send times
- Segmentation performance

## Best Practices

1. **Timing**: Send at optimal times based on user timezone
2. **Frequency**: Weekly digest, not daily bombardment
3. **Personalization**: Use browsing history, saved searches
4. **Value**: Every email should either inform or help user buy/sell
5. **Testing**: A/B test subject lines and templates
6. **Compliance**: GDPR/CCPA unsubscribe links on all emails

## Next Steps

1. Add Celery tasks for scheduled emails
2. Implement email analytics (open/click tracking)
3. Create A/B testing framework
4. Build admin dashboard to view campaigns
5. Add SMS integration (Twilio) for high-value events
6. Implement push notifications for mobile app

