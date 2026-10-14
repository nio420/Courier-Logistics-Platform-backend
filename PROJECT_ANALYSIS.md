# Courier Logistics Platform - Backend Analysis

## Project Overview
A comprehensive courier logistics platform built with **Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis**, and **Stripe** for payments. Features role-based access control (Customer, Courier, Admin), real-time tracking, email notifications, and a complete shipment lifecycle management system.

---

## Technology Stack
| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Cache | Redis |
| Authentication | JWT (Access + Refresh tokens), Google OAuth 2.0 |
| Payments | Stripe |
| Email | Nodemailer (Gmail) |
| File Upload | Multer + Cloudinary |
| Validation | Zod |
| Rate Limiting | express-rate-limit |
| Security | Helmet, CORS, bcrypt |
| PDF Generation | PDFKit |

---

## Database Schema (Prisma Models)

### Core Enums
```prisma
Role: CUSTOMER | COURIER | ADMIN
AuthProvider: CREDENTIALS | GOOGLE
UserStatus: ACTIVE | SUSPENDED | BLOCKED
CourierAvailability: AVAILABLE | BUSY | OFFLINE | SUSPENDED
HubStatus: ACTIVE | INACTIVE
ServiceType: STANDARD | EXPRESS
PackageType: DOCUMENT | PARCEL | FRAGILE | ELECTRONICS | OTHER
ShipmentStatus: CREATED | PAYMENT_PENDING | CONFIRMED | PICKUP_SCHEDULED | 
                COURIER_ASSIGNED | PICKED_UP | AT_ORIGIN_HUB | IN_TRANSIT | 
                AT_DESTINATION_HUB | OUT_FOR_DELIVERY | DELIVERY_FAILED | 
                RETURN_TO_SENDER | RETURNED | DELIVERED | CANCELLED
PaymentStatus: PENDING | PROCESSING | PAID | FAILED | CANCELLED | REFUNDED
PaymentGateway: STRIPE | BKASH | SSLCOMMERZ
AssignmentStatus: PENDING | ACCEPTED | REJECTED | COMPLETED | CANCELLED
CourierApprovalStatus: PENDING | APPROVED | REJECTED
```

### Models
1. **User** - Core user with roles, authentication, profile
2. **Address** - User addresses (sender/receiver for shipments)
3. **Hub** - Logistics hubs with location coordinates
4. **Courier** - Courier profile linked to User
5. **Shipment** - Core shipment entity with tracking, fees, status
6. **ShipmentItem** - Items within a shipment
7. **ShipmentTracking** - Status history with location, notes
8. **Payment** - Payment records linked to shipments
9. **Review** - Customer reviews for couriers
10. **CourierAssignment** - Assignment workflow between admin/courier/shipment

---

## API Endpoints Summary

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new user (customer/courier) |
| POST | `/verify-email` | Public | Verify email with OTP |
| POST | `/resend-otp` | Public | Resend verification OTP |
| POST | `/login` | Public | User login |
| GET | `/me` | Auth (All roles) | Get current user profile |
| POST | `/forgot-password` | Public | Request password reset OTP |
| POST | `/reset-password` | Public | Reset password with OTP |
| GET | `/google` | Public | Initiate Google OAuth |
| GET | `/google/callback` | Public | Google OAuth callback |

### User (`/api/v1/user`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/profile-image` | All roles | Upload/update profile image |
| GET | `/dashboard` | Customer | Get customer dashboard stats |
| GET | `/me` | All roles | Get current user profile |
| PATCH | `/me-update` | All roles | Update profile (name, phone, bio) |

### Hub (`/api/v1/hubs`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create new hub |
| GET | `/` | Admin | List all hubs (paginated, filterable) |
| GET | `/active-hubs` | Customer | Get active hubs for selection |
| GET | `/:id` | Admin | Get single hub |
| PATCH | `/:id` | Admin | Update hub |
| DELETE | `/:id` | Admin | Deactivate hub (soft delete) |

### Courier (`/api/v1/couriers`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/availability` | Courier | Update availability status |
| GET | `/dashboard` | Courier | Get courier dashboard stats |
| PATCH | `/assignments/:id/accept` | Courier | Accept assignment |
| PATCH | `/assignments/:id/reject` | Courier | Reject assignment |
| PATCH | `/assignments/:id/complete` | Courier | Complete assignment (delivery) |

### Shipment (`/api/v1/shipments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Customer | Create new shipment |
| GET | `/` | Admin | List all shipments (paginated, filterable) |
| GET | `/my-shipments` | Customer | List customer's shipments |
| GET | `/:id` | Admin/Customer/Courier | Get shipment by ID |
| GET | `/tracking/:trackingNumber` | Admin/Customer/Courier | Get shipment by tracking number |
| PATCH | `/cancel/:id` | Customer | Cancel shipment (early stages only) |
| PATCH | `/status/:id` | Admin/Courier | Update shipment status |
| PATCH | `/assign-courier/:id` | Admin | Assign courier to shipment |

### Tracking (`/api/v1/tracking`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:trackingNumber` | All roles | Get shipment by tracking number |
| GET | `/tracking-history/:id` | All roles | Get tracking history |

### Payment (`/api/v1/payment`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create` | Customer | Create Stripe payment session |
| GET | `/` | Customer | List customer payments |
| GET | `/:id` | Customer | Get single payment |
| POST | `/webhook` | Stripe | Stripe webhook (raw body) |

### Review (`/api/v1/reviews`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Customer | Create review for delivered shipment |
| GET | `/courier/:courierId` | All roles | Get courier reviews |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List all users (paginated, filterable) |
| GET | `/users/:id` | Admin | Get user by ID |
| PATCH | `/users/:id/status` | Admin | Update user status (ACTIVE/SUSPENDED/BLOCKED) |
| GET | `/courier-pending` | Admin | Get pending courier applications |
| GET | `/couriers` | Admin | List all couriers (paginated, filterable) |
| GET | `/courier/:id` | Admin | Get courier by ID |
| PATCH | `/approve/:userId` | Admin | Approve courier |
| PATCH | `/reject/:userId` | Admin | Reject courier |

---

## Detailed Flow Logic

### 1. User Registration Flow
```
POST /auth/register
    ↓
Validate input (Zod)
    ↓
Check if email exists
    ↓
Hash password (bcrypt)
    ↓
Generate 6-digit OTP
    ↓
Store OTP in Redis (5 min TTL)
    ↓
Store registration data in Redis (5 min TTL)
    ↓
Send verification email (EJS template)
    ↓
Return success
```

### 2. Email Verification Flow
```
POST /auth/verify-email
    ↓
Validate OTP
    ↓
Check Redis for OTP & registration data
    ↓
Verify OTP matches
    ↓
Create user in DB
    ↓
If courier role: Create Courier profile (PENDING approval)
    ↓
Delete Redis keys
    ↓
Send welcome email
    ↓
Generate JWT tokens (access + refresh)
    ↓
Set HTTP-only cookies
    ↓
Return tokens + user
```

### 3. Login Flow
```
POST /auth/login
    ↓
Validate credentials
    ↓
Find user by email
    ↓
Check: blocked/suspended/email verified
    ↓
If courier: Check approval status
    ↓
Verify password (bcrypt)
    ↓
Generate JWT tokens
    ↓
Set HTTP-only cookies
    ↓
Return access token
```

### 4. Shipment Creation Flow
```
POST /shipments (Customer)
    ↓
Validate input (addresses, hubs, items, etc.)
    ↓
Verify origin ≠ destination hub, both ACTIVE
    ↓
Calculate distance (Haversine formula)
    ↓
Calculate delivery fee (weight + distance + service type)
    ↓
Generate tracking number (CR-{timestamp}-{random})
    ↓
Transaction:
    ├── Create sender address
    ├── Create receiver address
    ├── Create shipment (status: PAYMENT_PENDING)
    ├── Create shipment items
    └── Create initial tracking record
    ↓
Return shipment + distance + fee
```

### 5. Payment Flow
```
POST /payment/create (Customer)
    ↓
Verify shipment exists & belongs to customer
    ↓
Check payment status not PAID
    ↓
Create Stripe Checkout Session
    ↓
Return payment URL + session ID

Stripe Webhook (checkout.session.completed)
    ↓
Verify signature
    ↓
Extract metadata (shipmentId, customerId)
    ↓
Transaction:
    ├── Create Payment record (status: PAID)
    ├── Update Shipment (paymentStatus: PAID, status: CONFIRMED)
    ├── Generate PDF invoice
    └── Send payment success email with invoice
```

### 6. Courier Assignment Flow (Admin)
```
PATCH /shipments/assign-courier/:id (Admin)
    ↓
Verify shipment status: CONFIRMED or PICKUP_SCHEDULED
    ↓
Verify courier: ACTIVE, APPROVED, AVAILABLE
    ↓
Transaction:
    ├── Update shipment (courierId, status: COURIER_ASSIGNED)
    ├── Create CourierAssignment (status: PENDING)
    ├── Update courier availability: BUSY
    └── Create tracking record
    ↓
Return assignment details
```

### 7. Courier Assignment Acceptance Flow
```
PATCH /couriers/assignments/:id/accept (Courier)
    ↓
Verify assignment exists & belongs to courier
    ↓
Verify status: PENDING
    ↓
Transaction:
    ├── Update assignment (status: ACCEPTED, acceptedAt)
    ├── Update shipment (status: COURIER_ASSIGNED)
    └── Create tracking record
    ↓
Return updated assignment
```

### 8. Courier Assignment Rejection Flow
```
PATCH /couriers/assignments/:id/reject (Courier)
    ↓
Verify assignment & ownership
    ↓
Verify status: PENDING
    ↓
Transaction:
    ├── Update assignment (status: REJECTED, rejectedAt, reason)
    ├── Update shipment (courierId: null, status: PICKUP_SCHEDULED)
    ├── Update courier availability: AVAILABLE
    └── Create tracking record
    ↓
Return updated assignment
```

### 9. Assignment Completion (Delivery) Flow
```
PATCH /couriers/assignments/:id/complete (Courier)
    ↓
Verify assignment & ownership
    ↓
Verify status: ACCEPTED
    ↓
Transaction:
    ├── Update assignment (status: COMPLETED, completedAt)
    ├── Update shipment (status: DELIVERED, deliveredAt, proofOfDelivery)
    ├── Update courier (totalDeliveries++, totalEarnings+=fee, availability: AVAILABLE)
    └── Create tracking record
    ↓
Return updated assignment
```

### 10. Shipment Status Update Flow
```
PATCH /shipments/status/:id (Admin/Courier)
    ↓
Verify ownership/permission
    ↓
Validate new status
    ↓
Transaction:
    ├── Update shipment status
    ├── If DELIVERED: set deliveredAt
    └── Create tracking record
    ↓
Return updated shipment
```

### 11. Review Flow
```
POST /reviews (Customer)
    ↓
Verify shipment: DELIVERED, has courier, owned by customer
    ↓
Check no existing review
    ↓
Create review
    ↓
Recalculate courier average rating
    ↓
Update courier rating
    ↓
Return review
```

### 12. Courier Approval Flow (Admin)
```
PATCH /admin/approve/:userId (Admin)
    ↓
Verify courier exists, role=COURIER, status=PENDING
    ↓
Transaction:
    ├── Update user (courierApprovalStatus: APPROVED)
    ├── Update courier (employeeId: EMP-{timestamp}, availability: AVAILABLE)
    ↓
Return updated user + courier

PATCH /admin/reject/:userId (Admin)
    ↓
Verify courier exists, status=PENDING
    ↓
Update user (courierApprovalStatus: REJECTED)
    ↓
Return updated user + rejection reason
```

---

## Key Business Logic

### Delivery Fee Calculation
```typescript
// Standard: Base 60 + (weight-1)*20 + max(distance-5,0)*10
// Express:  Base 100 + (weight-1)*30 + max(distance-5,0)*15

calculateDeliveryFee(weight, serviceType, distance)
```

### Distance Calculation
Haversine formula for great-circle distance between two lat/lng points (in kilometers).

### Tracking Number Generation
`CR-{Date.now()}-{3 random hex bytes}` → e.g., `CR-1728934567890-A1B2C3`

### OTP Management
- 6-digit numeric OTP
- Stored in Redis with 5-minute TTL
- Separate keys for registration, password reset, etc.

### JWT Token Strategy
- **Access Token**: Short-lived (configurable, default 24h)
- **Refresh Token**: Long-lived (configurable, default 7d)
- Stored in HTTP-only cookies with `secure: true` in production
- Role-based access control via middleware

### Rate Limiting
- **API Global**: 100 requests / 15 minutes
- **Auth Endpoints**: 10 requests / 15 minutes

---

## Middleware Pipeline

1. **Helmet** - Security headers
2. **CORS** - Configured for frontend URL with credentials
3. **Stripe Webhook** - Raw body parser (before json())
4. **express.json()** - JSON body parser
5. **express.urlencoded()** - Form data parser
6. **cookieParser()** - Cookie parsing
7. **passport.initialize()** - OAuth initialization
8. **Rate Limiter** - Applied to `/api` routes
9. **Route Handlers** - Business logic
10. **Global Error Handler** - Centralized error handling
11. **Not Found** - 404 handler

---

## Error Handling

### AppError Class
Custom error class with `statusCode`, `message`, and optional `error`/`stack`.

### Global Error Handler
Handles:
- Prisma validation errors (P2002, P2003, P2025)
- Prisma connection errors (P1000, P1001)
- Custom AppError instances
- Generic Errors
- Returns structured JSON with dev/prod modes

---

## Background Jobs / Cron
- **Seed Admin**: Creates default admin on startup
- **Seed Demo Courier**: Creates demo courier on startup
- **Delete Expired Pending Couriers**: Admin service method to cleanup pending couriers older than 7 days

---

## Email Templates (EJS)
1. `email-verification.ejs` - OTP for registration
2. `welcome-email.ejs` - Welcome after verification
3. `resend-otp.ejs` - Resent OTP
4. `forgot-password.ejs` - Password reset OTP
5. `reset-password-success.ejs` - Password changed confirmation
6. `payment-success-email.ejs` - Payment confirmation with PDF invoice attachment

---

## Security Considerations
- ✅ Password hashing with bcrypt (configurable rounds)
- ✅ JWT in HTTP-only cookies (not localStorage)
- ✅ Role-based access control on all routes
- ✅ Rate limiting on auth and API endpoints
- ✅ Helmet for security headers
- ✅ Input validation with Zod
- ✅ Prisma parameterized queries (SQL injection prevention)
- ✅ Stripe webhook signature verification
- ✅ Redis for OTP storage (not in DB)
- ✅ Soft deletes for hubs (status change)
- ⚠️ Cookie `secure: false` in development (should be `true` in prod)
- ⚠️ No CSRF protection (relies on same-site cookies)

---

## Data Relationships Summary

```
User (1) ←→ (1) Courier
User (1) ←→ (N) Address
User (1) ←→ (N) Shipment (as customer)
User (1) ←→ (N) Shipment (as courier)
User (1) ←→ (N) Payment
User (1) ←→ (N) Review (as customer)
User (1) ←→ (N) Review (as courier)
User (1) ←→ (N) ShipmentTracking (as updater)
User (1) ←→ (N) ShipmentTracking (as courier)
User (1) ←→ (N) CourierAssignment (as courier)
User (1) ←→ (N) CourierAssignment (as assigner/admin)

Hub (1) ←→ (N) Shipment (origin)
Hub (1) ←→ (N) Shipment (destination)
Hub (1) ←→ (N) Shipment (current)
Hub (1) ←→ (N) ShipmentTracking

Shipment (1) ←→ (N) ShipmentItem
Shipment (1) ←→ (N) ShipmentTracking
Shipment (1) ←→ (N) CourierAssignment
Shipment (1) ←→ (N) Payment
Shipment (1) ←→ (1) Review
Shipment (N) ←→ (1) Address (sender)
Shipment (N) ←→ (1) Address (receiver)

CourierAssignment (N) ←→ (1) Shipment
CourierAssignment (N) ←→ (1) User (courier)
CourierAssignment (N) ←→ (1) User (assigner)

Review (N) ←→ (1) Shipment
Review (N) ←→ (1) User (customer)
Review (N) ←→ (1) User (courier)
```

---

## Shipment Status Flow Diagram

```
CREATED
    ↓ (payment initiated)
PAYMENT_PENDING
    ↓ (payment success webhook)
CONFIRMED
    ↓ (admin schedules pickup)
PICKUP_SCHEDULED
    ↓ (admin assigns courier)
COURIER_ASSIGNED
    ↓ (courier accepts)
    ↓ (courier picks up)
PICKED_UP
    ↓ (arrives at origin hub)
AT_ORIGIN_HUB
    ↓ (in transit)
IN_TRANSIT
    ↓ (arrives at destination hub)
AT_DESTINATION_HUB
    ↓ (out for delivery)
OUT_FOR_DELIVERY
    ↓ (delivered)
DELIVERED ──────────────────→ (review possible)
    ↑
    └── DELIVERY_FAILED
            ↓
        RETURN_TO_SENDER
            ↓
        RETURNED

CANCELLED (from: CREATED, PAYMENT_PENDING, CONFIRMED, PICKUP_SCHEDULED)
```

---

## Configuration (Environment Variables)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=...
COURIER_NAME=Demo Courier
COURIER_EMAIL=courier@example.com
COURIER_PASSWORD=...
REDIS_USER=...
REDIS_PASSWORD=...
REDIS_HOST=...
REDIS_PORT=6379
SMTP_USER=...
EMAIL_SENDER=...
SMTP_PASSWORD=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Entry point, DB connections, seeding
├── config/
│   └── index.ts           # Environment config
├── lib/
│   ├── prisma.ts          # Prisma client with pg adapter
│   ├── redis.ts           # Redis client
│   ├── nodemailer.ts      # Email transporter
│   ├── stripe.ts          # Stripe client
│   ├── cloudinary.ts      # Cloudinary config
│   ├── multer.ts          # File upload config
│   └── google.strategy.ts # Passport Google OAuth
├── middleware/
│   ├── checkAuth.ts       # JWT auth + role check
│   ├── validateRequest.ts # Zod validation middleware
│   ├── rateLimiter.ts     # Express rate limiting
│   ├── globalErrorHandler.ts
│   └── notFound.ts        # 404 handler
├── utils/
│   ├── CatchAsync.ts      # Async wrapper
│   ├── AppError.ts        # Custom error class
│   ├── SendResponse.ts    # Standardized response
│   ├── Jwt.ts             # JWT utilities
│   ├── Seed.ts            # Database seeding
│   ├── payment.handler.ts # Stripe webhook handler
│   ├── shipment.utility.ts# Fee/distance/tracking utils
│   └── tracking.ts        # (empty)
├── module/
│   ├── auth/              # Authentication module
│   ├── user/              # User profile/dashboard
│   ├── hub/               # Hub management
│   ├── courier/           # Courier operations
│   ├── shipment/          # Shipment management
│   ├── tracking/          # Public tracking
│   ├── payment/           # Payment processing
│   ├── review/            # Reviews
│   └── admin/             # Admin operations
├── templates/             # EJS email templates
└── interface/             # Shared TypeScript interfaces
```

---

## Missing / Incomplete Features

1. **Tracking module routes not fully registered** - `getShipmentTrackingHistory` controller exists but route `/tracking-history/:id` is in tracking routes but the shipment controller also has this method
2. **No WebSocket/Socket.io** for real-time tracking updates
3. **No automated shipment status progression** (e.g., auto-transition after time)
4. **No notification system** (push/SMS/email for status changes)
5. **No courier location tracking** (currentLat/Lng fields exist but no update endpoint)
6. **No shipment search by date range**
7. **No analytics/dashboard for admin** (revenue, volume, etc.)
8. **No multi-language support**
9. **No audit logging** for critical operations
10. **Tracking utility file is empty**

---

## Potential Improvements

1. **Add Swagger/OpenAPI documentation**
2. **Implement refresh token rotation & blacklisting**
3. **Add request validation for query params (not just body)**
4. **Implement pagination cursor-based for better performance**
5. **Add database indexes for common query patterns** (already partially done)
6. **Add integration tests**
7. **Implement circuit breaker for external services (Stripe, Email)**
8. **Add health check endpoint**
9. **Implement graceful shutdown handling**
10. **Add request logging/monitoring (e.g., Morgan, Prometheus)**

---

## Deployment Considerations

1. **Database**: Uses Prisma with Pg adapter (connection pooling via pg.Pool)
2. **Redis**: Required for OTP storage and rate limiting
3. **Environment**: All secrets in .env file
4. **File Storage**: Cloudinary for images
5. **Email**: Gmail SMTP (consider SendGrid/Mailgun for production)
6. **Payments**: Stripe (test mode by default)
7. **HTTPS**: Required for secure cookies and OAuth callbacks
8. **Process Manager**: PM2 or similar for production
9. **Load Balancer**: Sticky sessions not needed (stateless JWT)
10. **Migrations**: `prisma migrate deploy` in CI/CD

---

*Analysis completed on: 2026-10-10*
*Total modules analyzed: 10 (auth, user, hub, courier, shipment, tracking, payment, review, admin, lib/utils)*
*Total API endpoints: ~40+*