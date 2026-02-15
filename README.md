# Suqafuran - Pan-African Classifieds Marketplace

A high-performance, premium classifieds platform built for the African market.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, SQLModel, PostgreSQL, Redis
- **Auth**: OAuth2 (Google, GitHub), JWT
- **Infrastructure**: Docker, Docker Compose

## Backend API Reference

### Authentication & Users
| Method | Endpoint | Body / Params | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/login/access-token` | `{email, password}` | Login and get JWT tokens |
| POST | `/api/v1/users/signup` | `{name, email, phone, password}` | Create user & send verification |
| GET | `/api/v1/users/me` | - | Get current authenticated user |
| PATCH | `/api/v1/users/me` | `{name, avatar, ...}` | Update current user profile |
| GET | `/api/v1/users/public/{user_id}` | - | Get public profile of any user |
| POST | `/api/v1/users/verify-email` | `{token/code}` | Verify email/phone |
| POST | `/api/v1/users/forgot-password` | `{email}` | Initiate password reset |
| POST | `/api/v1/users/reset-password` | `{token, new_password}` | Reset password |

### Categories & Attributes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/v1/listings/categories` | List all main categories + subcategories (tree) |
| GET | `/api/v1/categories/{slug}/attributes` | Get dynamic fields (e.g. year, mileage for cars) |

### Listings / Ads (Core)
| Method | Endpoint | Query / Body | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/listings/` | `?search,category,location,price_min,price_max,sort,page,limit` | Search / browse listings |
| POST | `/api/v1/listings/` | `{title, description, price, category_id, location, photos[], attributes{}}` | Create new listing |
| GET | `/api/v1/listings/{id}` | - | Single ad detail |
| PATCH | `/api/v1/listings/{id}` | Partial update | Edit listing (owner/admin) |
| DELETE | `/api/v1/listings/{id}` | - | Delete listing |
| GET | `/api/v1/listings/me` | - | Current user's listings |

### Messages & Chat
| Method | Endpoint | Body | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/messages/conversations` | - | List my chat threads |
| GET | `/api/v1/messages/{other_user_id}` | - | Get full conversation thread |
| POST | `/api/v1/messages/` | `{to_user_id, listing_id, text}` | Send a new message |

### Favorites & Trust
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/v1/favorites/` | List favorited listings |
| POST | `/api/v1/favorites/{listing_id}` | Add to favorites |
| POST | `/api/v1/verifications/apply` | Submit ID / phone verification docs |
| GET | `/api/v1/verifications/me` | Check my verification status |

### Wallet & Boosts
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/v1/wallet/balance` | Get current wallet balance |
| POST | `/api/v1/wallet/deposit` | Initiate top-up (M-Pesa, card, etc.) |
| GET | `/api/v1/boosts/prices` | List available boost options & prices |
| POST | `/api/v1/boosts/apply` | Apply boost (VIP, Top, etc.) to listing |

## Implementation Recommendations

Following "Jiji-style" best practices for a premium classifieds experience:

1.  **JWT Security**: Use short-lived access tokens and long-lived refresh tokens.
2.  **Standardized Responses**: Consistent JSON shape for all data and metadata (paginated meta).
3.  **Media Handling**: Store photos in S3/Object Storage; return public URLs.
4.  **Dynamic Filtering**: Support `?page=`, `?limit=`, `?sort=`, and nested filters.
5.  **Location Services**: Use a continent-wide database of countries/cities.
6.  **Real-time Features**: Use WebSockets (Socket.io) for instant chat updates.

## Quick Start with Docker

The backend is fully containerized with Docker and Docker Compose. This includes the FastAPI server, PostgreSQL (Database), and Redis (Cache).

1. **Build and Start Services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Run Migrations (inside container):**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

3. **Access APIs:**
   - API Docs: `http://localhost:8888/docs`
   - Health Check: `http://localhost:8888/`

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
