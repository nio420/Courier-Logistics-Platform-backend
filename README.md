# 🚚 Courier & Logistics Platform API

> **Production-oriented Courier & Logistics Management Backend** built with **Node.js, Express, TypeScript, PostgreSQL, Prisma, Redis, Stripe, Passport.js, JWT, Zod, and Docker-ready architecture.**

A scalable RESTful API designed to manage the complete lifecycle of courier shipments — from customer registration and address management to shipment creation, payment, courier assignment, real-time tracking, delivery confirmation, proof of delivery, courier earnings, and customer reviews.

---

## 📌 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Project Goals](#-project-goals)
- [🚀 Key Features](#-key-features)
- [👥 User Roles](#-user-roles)
- [📦 Shipment Lifecycle](#-shipment-lifecycle)
- [💳 Payment Flow](#-payment-flow)
- [⭐ Review & Rating System](#-review--rating-system)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [🛡️ Security](#️-security)
- [🏗️ System Architecture](#️-system-architecture)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Architecture](#️-database-architecture)
- [📊 Database Models](#-database-models)
- [🌐 API Structure](#-api-structure)
- [📮 API Modules](#-api-modules)
- [💰 Dynamic Delivery Fee](#-dynamic-delivery-fee)
- [📍 Shipment Tracking](#-shipment-tracking)
- [🚴 Courier Management](#-courier-management)
- [📧 Email Notifications](#-email-notifications)
- [📄 Invoice System](#-invoice-system)
- [⚡ Performance](#-performance)
- [🧪 Validation & Error Handling](#-validation--error-handling)
- [⚙️ Environment Variables](#️-environment-variables)
- [💻 Installation & Setup](#-installation--setup)
- [▶️ Running the Project](#️-running-the-project)
- [🧪 Testing](#-testing)
- [📚 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [📈 Future Improvements](#-future-improvements)
- [🤝 Contribution](#-contribution)
- [📄 License](#-license)

---

# ✨ Overview

The **Courier & Logistics Platform** is a complete backend solution for modern parcel delivery operations.

The system connects:

**Customers → Shipments → Payments → Hubs → Couriers → Tracking → Delivery → Reviews**

It provides secure APIs for customers, couriers, and administrators while maintaining strict role-based access control and business rules.

The platform is designed around a **modular architecture**, making it easier to maintain, test, extend, and eventually connect with a modern web or mobile frontend.

### Core business flow

```text
Customer
   │
   ├── Register / Login
   │
   ├── Manage Addresses
   │
   ├── Create Shipment
   │
   ├── Make Payment
   │
   ▼
Shipment Confirmed
   │
   ├── Admin Assigns Courier
   │
   ▼
Courier
   │
   ├── Accept Assignment
   ├── Pick Up Shipment
   ├── Update Shipment Status
   ├── Transport Shipment
   └── Complete Delivery
   │
   ▼
Delivered
   │
   ├── Proof of Delivery
   ├── Courier Earnings Updated
   └── Customer Leaves Review
```

---

# 🎯 Project Goals

The platform was designed with the following objectives:

- 🏢 Provide a complete logistics management backend
- 👤 Support multiple user roles
- 🔐 Implement secure authentication and authorization
- 📦 Manage shipments throughout their complete lifecycle
- 💳 Integrate real online payments
- 🚴 Manage courier assignments and availability
- 📍 Maintain shipment tracking history
- 🏢 Support hub-based logistics operations
- ⭐ Provide courier reviews and ratings
- 📧 Automate important email notifications
- 📄 Generate professional invoices
- 🛡️ Protect APIs against common security threats
- ⚡ Maintain scalable and maintainable backend architecture

---

# 🚀 Key Features

## 👤 User Management

- Customer registration
- Courier registration
- Admin management
- Email/password authentication
- Google OAuth authentication
- Email verification
- Password reset
- Profile management
- Profile bio and phone number
- Account status management
- Courier approval workflow

---

## 🔐 Authentication

- JWT-based authentication
- Access token
- Refresh token
- HTTP-only cookies
- Google OAuth 2.0
- Passport.js integration
- Role-based authorization
- Protected routes
- Authentication rate limiting

---

## 📦 Shipment Management

Customers can:

- Create shipments
- Select sender and receiver addresses
- Select origin and destination hubs
- Choose service type
- Choose package type
- Provide package weight
- Add shipment items
- View shipment history
- Track shipments
- Cancel eligible shipments

Administrators can:

- View shipments
- Manage shipment status
- Assign couriers

Couriers can:

- View assigned shipments
- Accept assignments
- Reject assignments
- Complete deliveries
- Update delivery status

---

## 🏢 Hub Management

The platform supports logistics hubs with:

- Hub creation
- Hub updates
- Hub activation/deactivation
- Unique hub codes
- City and district information
- Geographic coordinates
- Origin hub
- Destination hub
- Current hub tracking

Instead of physically deleting hubs, the system uses **soft deactivation**.

```text
ACTIVE
  │
  ▼
INACTIVE
```

This preserves historical shipment information.

---

## 🚴 Courier Management

Courier functionality includes:

- Courier registration
- Admin approval
- Courier availability
- Vehicle information
- License information
- Employee ID
- Assignment management
- Assignment acceptance
- Assignment rejection
- Delivery completion
- Delivery statistics
- Earnings tracking
- Courier rating

Courier availability states:

```text
AVAILABLE
BUSY
OFFLINE
SUSPENDED
```

---

## 💳 Payment System

The platform integrates **Stripe Checkout** for real payment processing.

Payment lifecycle:

```text
Shipment Created
       │
       ▼
PAYMENT_PENDING
       │
       ▼
Stripe Checkout
       │
       ▼
Stripe Webhook
       │
       ▼
Signature Verification
       │
       ▼
Payment PAID
       │
       ▼
Shipment CONFIRMED
       │
       ▼
Invoice Generated
       │
       ▼
Invoice Emailed
```

The system does **not** use fake payment confirmation.

---

## ⭐ Review & Rating System

Customers can review couriers after successful delivery.

Rules:

- Only the shipment owner can review
- Shipment must be `DELIVERED`
- Shipment must have an assigned courier
- One review per shipment
- Rating must be between **1 and 5**
- Optional review comment
- Courier rating is recalculated after review

Example:

```text
Courier
   │
   ├── Review 1 → ⭐⭐⭐⭐⭐
   ├── Review 2 → ⭐⭐⭐⭐
   └── Review 3 → ⭐⭐⭐⭐⭐
                 │
                 ▼
          Average Rating
```

---

# 👥 User Roles

The platform contains three primary roles.

| Role            | Responsibility                                           |
| --------------- | -------------------------------------------------------- |
| 👤 **CUSTOMER** | Create shipments, payments, tracking, reviews            |
| 🚴 **COURIER**  | Accept assignments, deliver shipments, update delivery   |
| 👑 **ADMIN**    | Manage couriers, shipments, hubs and platform operations |

---

## 👤 Customer

Customers can:

- Register
- Login
- Verify email
- Manage profile
- Manage addresses
- Create shipments
- View shipments
- Track shipments
- Cancel eligible shipments
- Make payments
- View payment history
- Review couriers

---

## 🚴 Courier

Couriers can:

- Register
- Wait for admin approval
- Login after approval
- Manage availability
- View dashboard
- View assignments
- Accept assignments
- Reject assignments
- Complete deliveries
- Update delivery status
- View earnings and delivery statistics

---

## 👑 Admin

Administrators can:

- Manage platform operations
- View users
- Approve couriers
- Reject couriers
- Manage hubs
- Assign couriers
- Manage shipment statuses
- Monitor logistics operations

---

# 📦 Shipment Lifecycle

The platform uses a structured shipment state machine.

```text
CREATED
   │
   ▼
PAYMENT_PENDING
   │
   ▼
CONFIRMED
   │
   ▼
PICKUP_SCHEDULED
   │
   ▼
COURIER_ASSIGNED
   │
   ▼
PICKED_UP
   │
   ▼
AT_ORIGIN_HUB
   │
   ▼
IN_TRANSIT
   │
   ▼
AT_DESTINATION_HUB
   │
   ▼
OUT_FOR_DELIVERY
   │
   ├──────────────► DELIVERY_FAILED
   │                       │
   │                       ▼
   │                RETURN_TO_SENDER
   │                       │
   │                       ▼
   │                   RETURNED
   │
   ▼
DELIVERED
```

Alternative terminal state:

```text
CANCELLED
```

Once a shipment reaches a terminal state such as `DELIVERED` or `CANCELLED`, inappropriate state changes are prevented by business logic.

---

# 💳 Payment Flow

### 1️⃣ Shipment creation

The customer creates a shipment.

```text
Shipment Status → PAYMENT_PENDING
Payment Status  → PENDING
```

### 2️⃣ Checkout creation

Customer requests a Stripe Checkout session.

```http
POST /api/v1/payment/create
```

### 3️⃣ Stripe Checkout

Customer completes payment through Stripe.

### 4️⃣ Webhook

Stripe sends:

```text
checkout.session.completed
```

### 5️⃣ Signature verification

The backend verifies the Stripe webhook signature.

### 6️⃣ Payment confirmation

The system updates:

```text
Payment → PAID
Shipment Payment Status → PAID
Shipment Status → CONFIRMED
```

### 7️⃣ Invoice

A professional PDF invoice is generated and emailed to the customer.

---

# ⭐ Review & Rating System

Review creation follows this business rule:

```text
Customer
   │
   ▼
Own Shipment?
   │
   ├── No → Reject
   │
   ▼
Shipment DELIVERED?
   │
   ├── No → Reject
   │
   ▼
Courier Assigned?
   │
   ├── No → Reject
   │
   ▼
Already Reviewed?
   │
   ├── Yes → Reject
   │
   ▼
Create Review
   │
   ▼
Recalculate Courier Rating
```

---

# 🔐 Authentication & Authorization

## Authentication Methods

### Email & Password

```text
Register
   ↓
Password Hash
   ↓
Email Verification
   ↓
Login
   ↓
Access Token + Refresh Token
```

### Google OAuth

```text
Client
  ↓
Google
  ↓
Google Callback
  ↓
Find/Create User
  ↓
JWT Tokens
  ↓
HTTP-only Cookies
```

---

## Role-Based Authorization

Protected endpoints use role-based middleware.

Example:

```text
auth(Role.ADMIN)
```

or:

```text
auth(
  Role.CUSTOMER,
  Role.COURIER,
  Role.ADMIN
)
```

This prevents users from accessing APIs outside their responsibilities.

---

# 🛡️ Security

Security was treated as a first-class concern.

### Implemented security measures

- 🔒 Password hashing
- 🍪 HTTP-only authentication cookies
- 🔑 JWT authentication
- 🛡️ Role-based authorization
- 🚦 API rate limiting
- 🚦 Authentication rate limiting
- 🪖 Helmet security headers
- 🌐 Restricted CORS
- 🔐 Environment-based secrets
- ✅ Server-side Zod validation
- 💳 Stripe webhook signature verification
- 🚫 Admin registration disabled
- 🚫 Unauthorized shipment access prevented
- 🚫 Unauthorized courier assignment prevented
- 🚫 Invalid shipment state transitions prevented

---

## 🚦 Rate Limiting

General API rate limiting:

```text
100 requests / 15 minutes
```

Authentication endpoints use stricter protection:

```text
10 requests / 15 minutes
```

Protected authentication endpoints include:

- Register
- Login
- Email verification
- Forgot password
- Reset password

---

## 🪖 Helmet

Helmet is used to add security-related HTTP headers and reduce exposure to common web vulnerabilities.

---

## 🌐 CORS

The API supports credential-based requests from the configured frontend origin.

```text
Frontend
    │
    │ credentials
    ▼
Backend API
```

---

# 🏗️ System Architecture

The backend follows a modular, layered architecture.

```text
                    ┌─────────────────────┐
                    │      Client         │
                    │ Web / Mobile App    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Routes        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Middleware       │
                    │ Auth / Validation   │
                    │ Rate Limit / etc.   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Controller       │
                    │ Request / Response  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Service        │
                    │ Business Logic      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Prisma        │
                    │       ORM           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    PostgreSQL       │
                    └─────────────────────┘
```

External integrations:

```text
Backend
 ├── PostgreSQL
 ├── Redis
 ├── Stripe
 ├── Google OAuth
 ├── SMTP / Mail Service
 └── PDF Generation
```

---

# 📁 Project Structure

```text
src/
│
├── config/
│
├── lib/
│   ├── google.strategy.ts
│   └── ...
│
├── middleware/
│   ├── checkAuth.ts
│   ├── globalErrorHandler.ts
│   ├── notFound.ts
│   ├── rateLimiter.ts
│   └── validateRequest.ts
│
├── module/
│   │
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.validation.ts
│   │   └── auth.interface.ts
│   │
│   ├── user/
│   ├── hub/
│   ├── courier/
│   ├── shipment/
│   ├── tracking/
│   ├── payment/
│   ├── review/
│   └── admin/
│
├── shared/
│   └── ...
│
├── app.ts
└── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 🗄️ Database Architecture

The system uses:

- **PostgreSQL**
- **Prisma ORM**
- UUID primary keys
- Foreign-key relationships
- Unique constraints
- Database indexes
- Cascading relationships where appropriate
- Transactions for critical multi-record operations

---

# 📊 Database Models

The platform contains **10 core models**.

```text
User
 │
 ├── Courier
 ├── Address
 ├── Shipment
 ├── Payment
 ├── Review
 ├── ShipmentTracking
 └── CourierAssignment

Hub
 │
 └── Shipment

Shipment
 │
 ├── ShipmentItem
 ├── ShipmentTracking
 ├── CourierAssignment
 ├── Payment
 └── Review
```

---

## 👤 User

Stores authentication and account information.

Important fields:

```text
id
name
email
phone
bio
password
googleId
authProvider
emailVerified
role
status
courierApprovalStatus
profileImage
createdAt
updatedAt
```

---

## 🚴 Courier

Stores courier-specific operational information.

```text
userId
employeeId
vehicleType
vehicleNumber
licenseNumber
availabilityStatus
currentLat
currentLng
totalDeliveries
totalEarnings
rating
```

---

## 📍 Address

Stores customer addresses.

```text
userId
label
contactName
phone
addressLine
city
district
postalCode
latitude
longitude
isDefault
```

---

## 🏢 Hub

Represents a logistics hub.

```text
name
code
address
city
district
latitude
longitude
status
```

---

## 📦 Shipment

The central business entity.

```text
trackingNumber
customerId
courierId
senderAddressId
receiverAddressId
originHubId
destinationHubId
currentHubId
serviceType
packageType
weight
deliveryFee
paymentStatus
status
pickupDate
estimatedDeliveryDate
deliveredAt
failureReason
proofOfDelivery
```

---

## 📦 ShipmentItem

Stores individual items inside a shipment.

```text
shipmentId
name
description
quantity
weight
declaredValue
```

---

## 📍 ShipmentTracking

Maintains the shipment's complete status history.

```text
shipmentId
status
hubId
courierId
updatedBy
location
note
metadata
createdAt
```

---

## 🔄 CourierAssignment

Maintains courier assignment history.

```text
shipmentId
courierId
assignedBy
status
assignedAt
acceptedAt
rejectedAt
completedAt
rejectionReason
```

The system intentionally allows multiple assignment records for the same shipment/courier combination so reassignment history can be preserved.

---

## 💳 Payment

Stores payment transactions.

```text
shipmentId
customerId
amount
currency
gateway
transactionId
gatewayPaymentId
status
gatewayResponse
paidAt
```

---

## ⭐ Review

Stores customer feedback about couriers.

```text
shipmentId
customerId
courierId
rating
comment
```

Each shipment can have only **one review**.

---

# 🌐 API Structure

Base API:

```text
/api/v1
```

### Main modules

```text
/api/v1/auth
/api/v1/user
/api/v1/hubs
/api/v1/couriers
/api/v1/shipments
/api/v1/tracking
/api/v1/admin
/api/v1/payment
/api/v1/reviews
```

---

# 📮 API Modules

## 🔐 Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

GET /api/v1/auth/google
GET /api/v1/auth/google/callback
```

---

## 👤 User

```http
GET   /api/v1/user/dashboard
GET   /api/v1/user/me
PATCH /api/v1/user/me
```

---

## 🏢 Hubs

Hub CRUD and management endpoints are provided under:

```http
/api/v1/hubs
```

---

## 🚴 Couriers

Courier management and delivery operations:

```http
GET   /api/v1/couriers
GET   /api/v1/couriers/:id
PATCH /api/v1/couriers/availability

GET   /api/v1/couriers/dashboard

PATCH /api/v1/couriers/assignments/:id/accept
PATCH /api/v1/couriers/assignments/:id/reject
PATCH /api/v1/couriers/assignments/:id/complete
```

Admin courier approval:

```http
GET   /api/v1/couriers/pending
PATCH /api/v1/couriers/:userId/approve
PATCH /api/v1/couriers/:userId/reject
```

---

## 📦 Shipments

```http
POST  /api/v1/shipments
GET   /api/v1/shipments
GET   /api/v1/shipments/my-shipments
GET   /api/v1/shipments/:id

PATCH /api/v1/shipments/cancel/:id
PATCH /api/v1/shipments/status/:id
PATCH /api/v1/shipments/assign-courier/:id
```

---

## 📍 Tracking

```http
GET /api/v1/tracking/:trackingNumber
GET /api/v1/tracking/:id/history
```

---

## 💳 Payments

```http
POST /api/v1/payment/create
GET  /api/v1/payment
GET  /api/v1/payment/:id
```

Stripe webhook:

```http
POST /api/v1/payments/webhook
```

> ⚠️ The Stripe webhook uses a raw request body for signature verification and is intentionally registered before `express.json()`.

---

## ⭐ Reviews

```http
POST /api/v1/reviews
GET  /api/v1/reviews/courier/:courierId
```

---

# 💰 Dynamic Delivery Fee

Customers do **not** directly provide the delivery fee.

The backend calculates the fee according to:

### STANDARD

```text
Base Fee       = 60 BDT
Included Weight = 1 KG
Extra KG       = 20 BDT
Included Distance = 5 KM
Extra KM       = 10 BDT
```

### EXPRESS

```text
Base Fee       = 100 BDT
Included Weight = 1 KG
Extra KG       = 30 BDT
Included Distance = 5 KM
Extra KM       = 15 BDT
```

Conceptually:

```text
Delivery Fee
    │
    ├── Service Type
    ├── Package Weight
    └── Delivery Distance
             │
             ▼
       Backend Calculation
             │
             ▼
        Final Delivery Fee
```

This prevents customers from manipulating the delivery price.

---

# 📍 Shipment Tracking

Every important shipment status change creates a tracking record.

Example:

```text
CREATED
   ↓
PAYMENT_PENDING
   ↓
CONFIRMED
   ↓
COURIER_ASSIGNED
   ↓
PICKED_UP
   ↓
IN_TRANSIT
   ↓
AT_DESTINATION_HUB
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

The system stores:

- Status
- Hub
- Courier
- Location
- Note
- Metadata
- Updated by
- Timestamp

This creates a historical audit trail rather than simply overwriting the shipment's current status.

---

# 🚴 Courier Management

Courier workflow:

```text
Courier Registration
        │
        ▼
PENDING APPROVAL
        │
        ├────────► REJECTED
        │
        ▼
APPROVED
        │
        ▼
AVAILABLE
        │
        ▼
Courier Assigned
        │
        ▼
BUSY
        │
        ▼
Delivery Completed
        │
        ▼
AVAILABLE
```

When delivery is completed:

```text
Assignment → COMPLETED
Shipment   → DELIVERED
Courier    → AVAILABLE

Courier.totalDeliveries += 1
Courier.totalEarnings   += deliveryFee
```

A proof-of-delivery record is also stored.

---

# 📧 Email Notifications

The backend supports email communication for important business events.

Examples include:

- 📩 Email verification
- 🔑 Password reset
- 🚴 Courier approval/rejection
- 💳 Payment confirmation
- 📄 Invoice delivery
- 📦 Important shipment events

The system uses templated email rendering for professional communication.

---

# 📄 Invoice System

After successful Stripe payment:

```text
Stripe Webhook
      ↓
Payment Confirmed
      ↓
Invoice Generated
      ↓
PDF Buffer Created
      ↓
Email Sent
```

The invoice contains relevant payment and shipment information and is generated dynamically.

---

# ⚡ Performance

Performance considerations include:

### Database indexing

Indexes are used for frequently queried fields such as:

```text
User.role
User.status

Shipment.customerId
Shipment.courierId
Shipment.status
Shipment.paymentStatus
Shipment.createdAt

ShipmentTracking.shipmentId
ShipmentTracking.createdAt

Payment.shipmentId
Payment.customerId
Payment.status
```

### Pagination

List endpoints support:

```text
page
limit
sortBy
sortOrder
searchTerm
```

Example:

```http
GET /api/v1/shipments?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Transactions

Critical multi-step operations use Prisma transactions to maintain data consistency.

Examples:

- Shipment status transitions
- Courier assignment
- Delivery completion
- Payment confirmation

---

# 🧪 Validation & Error Handling

The API uses **Zod** for server-side validation.

Validation occurs before business logic is executed.

```text
Request
   │
   ▼
Zod Validation
   │
   ├── Invalid → Structured Error
   │
   ▼
Controller
   │
   ▼
Service
```

---

## ✅ Success Response

The API follows a consistent structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

---

## ❌ Error Response

Errors follow:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

This provides predictable responses for frontend and mobile clients.

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

Example:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

JWT_ACCESS_EXPIRES_IN="..."
JWT_REFRESH_EXPIRES_IN="..."

FRONTEND_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="..."

REDIS_URL="..."

STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

SMTP_HOST="..."
SMTP_PORT="..."
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="..."
```

> 🔐 **Never commit real credentials, API keys, database passwords, Stripe secrets, Google credentials, or SMTP passwords to Git.**

---

# 💻 Installation & Setup

## 1️⃣ Clone the repository

```bash
git clone <repository-url>
```

## 2️⃣ Enter the project

```bash
cd <project-folder>
```

## 3️⃣ Install dependencies

```bash
npm install
```

## 4️⃣ Configure environment variables

Create:

```text
.env
```

and configure all required values.

## 5️⃣ Generate Prisma Client

```bash
npx prisma generate
```

## 6️⃣ Run migrations

```bash
npx prisma migrate dev
```

## 7️⃣ Seed initial data

```bash
npx prisma db seed
```

## 8️⃣ Start development server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

---

# ▶️ Running the Project

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Production server

```bash
npm start
```

---

# 💳 Stripe Local Webhook Testing

Install Stripe CLI and authenticate:

```bash
stripe login
```

Then forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

The CLI provides a webhook signing secret.

Add that secret to:

```env
STRIPE_WEBHOOK_SECRET="..."
```

> ⚠️ Never expose the webhook signing secret publicly.

---

# 🧪 Testing

The API can be tested using **Postman**.

Recommended testing order:

```text
1. Register
2. Verify Email
3. Login
4. Create Address
5. Create Shipment
6. Create Payment
7. Complete Stripe Checkout
8. Confirm Webhook
9. Assign Courier
10. Accept Assignment
11. Update Shipment
12. Complete Delivery
13. Verify Tracking
14. Create Review
15. Verify Courier Rating
```

---

# 📚 API Documentation

Complete API documentation will be maintained using **Postman / Swagger/OpenAPI**.

Documentation should cover:

- Authentication
- Request parameters
- Request bodies
- Response examples
- Error responses
- Authorization requirements
- Role permissions
- Payment endpoints
- Webhook behavior

---

# 🚀 Deployment

The application is designed to be deployed as a production REST API.

Recommended production architecture:

```text
                   ┌───────────────┐
                   │    Frontend   │
                   └───────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   HTTPS API  │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        PostgreSQL       Redis        Stripe
```

Production deployment checklist:

- [ ] Production PostgreSQL
- [ ] Production Redis
- [ ] HTTPS
- [ ] Environment variables configured
- [ ] Stripe production keys
- [ ] Stripe production webhook
- [ ] Google OAuth production callback
- [ ] CORS production origin
- [ ] Secure cookies
- [ ] Database migrations
- [ ] API health check
- [ ] Logging
- [ ] Monitoring
- [ ] Error tracking

---

# 📈 Future Improvements

The architecture allows additional features to be introduced without major restructuring.

Potential future improvements:

- 🔔 WebSocket-based real-time tracking
- 📱 Mobile application
- 🗺️ Google Maps integration
- 📍 Live courier GPS tracking
- 🧭 Route optimization
- 📊 Advanced admin analytics
- 💰 Automated courier payouts
- 🧾 Advanced invoice management
- 🔔 Push notifications
- 📦 Bulk shipment creation
- 🏢 Multi-branch logistics management
- 📈 Advanced reporting
- 🧠 Delivery time prediction
- 🤖 Automated route optimization
- ☁️ Cloud file storage
- 📊 Monitoring and observability

---

# 🔄 Complete Business Workflow

The entire platform can be summarized as:

```text
                    CUSTOMER
                       │
                       ▼
                 Registration
                       │
                       ▼
                    Login
                       │
                       ▼
               Manage Addresses
                       │
                       ▼
               Create Shipment
                       │
                       ▼
              Calculate Delivery Fee
                       │
                       ▼
                 Stripe Payment
                       │
                       ▼
                 Webhook Confirm
                       │
                       ▼
               Shipment CONFIRMED
                       │
                       ▼
                ADMIN ASSIGNS
                   COURIER
                       │
                       ▼
              COURIER ACCEPTS
                       │
                       ▼
                  PICKUP
                       │
                       ▼
                ORIGIN HUB
                       │
                       ▼
                 IN TRANSIT
                       │
                       ▼
             DESTINATION HUB
                       │
                       ▼
              OUT FOR DELIVERY
                       │
                       ▼
                  DELIVERED
                       │
              ┌────────┴────────┐
              ▼                 ▼
       Proof of Delivery    Courier Earnings
              │
              ▼
          Customer Review
              │
              ▼
        Courier Rating Updated
```

---

# 🧩 Technology Stack

## Backend

| Technology             | Purpose              |
| ---------------------- | -------------------- |
| **Node.js**            | Runtime              |
| **Express.js**         | REST API framework   |
| **TypeScript**         | Type safety          |
| **Prisma**             | ORM                  |
| **PostgreSQL**         | Relational database  |
| **Redis**              | OTP / temporary data |
| **JWT**                | Authentication       |
| **Passport.js**        | Google OAuth         |
| **Zod**                | Validation           |
| **Stripe**             | Online payment       |
| **Helmet**             | HTTP security        |
| **express-rate-limit** | Rate limiting        |
| **CORS**               | Cross-origin access  |
| **PDFKit**             | Invoice generation   |
| **EJS**                | Email templates      |

---

# 🏆 Engineering Principles

The project follows several backend engineering principles:

### 🧱 Modular Architecture

Each business domain is isolated into its own module.

### 🎯 Separation of Concerns

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Database
```

Controllers remain thin while business rules live inside services.

### 🔐 Security First

Authentication, authorization, validation, rate limiting, secure cookies, and secret management are treated as core requirements.

### 🗃️ Data Integrity

Critical operations use database constraints and transactions.

### 📈 Scalability

Pagination, indexing, modular architecture, and service separation allow the application to grow.

### 🧪 Validation

Input is validated on the server rather than trusting client-side data.

### 📡 API Consistency

All endpoints follow predictable success and error structures.

---

# 👨‍💻 Development Standards

The project follows:

- TypeScript-first development
- RESTful API conventions
- Modular folder structure
- Service-oriented business logic
- Prisma ORM
- Zod validation
- Centralized error handling
- Consistent API responses
- Secure authentication
- Database transactions for critical operations
- Meaningful Git commits
- API documentation
- Production-oriented configuration

---

# 🤝 Contribution

Contributions are welcome.

### Development workflow

```text
Create Branch
     ↓
Implement Feature
     ↓
Validate Input
     ↓
Test API
     ↓
Fix Issues
     ↓
Commit Changes
     ↓
Push Branch
     ↓
Pull Request
     ↓
Code Review
     ↓
Merge
```

Recommended commit format:

```text
feat: add courier assignment workflow
fix: prevent duplicate shipment payments
refactor: simplify shipment service
docs: update API documentation
security: add authentication rate limiter
```

---

# 📄 License

This project is developed for educational and portfolio purposes.

If a specific open-source license is required for distribution, add the appropriate license file to the repository.

---

# 👨‍💻 Author

**Naimul Islam Omit**

Full-Stack / MERN Developer

### 🔗 Portfolio

https://naimul-islam.vercel.app/

### 💻 GitHub

https://github.com/nio420

---

# ⭐ Project Status

```text
┌───────────────────────────────────────────┐
│                                           │
│     🚚 COURIER LOGISTICS PLATFORM         │
│                                           │
│     Backend Development     ✅ Complete   │
│     Authentication          ✅ Complete   │
│     Shipment System         ✅ Complete   │
│     Courier System          ✅ Complete   │
│     Tracking                ✅ Complete   │
│     Stripe Payment          ✅ Complete   │
│     Review System           ✅ Complete   │
│     Security                ✅ Complete   │
│     API Documentation       ✅ Complete   │
│     Deployment              ✅ Complete   │
│                                           │
│                                            │
└─────────────────────────────────────────── ┘
```

---

## 🚀 Final Architecture Summary

```text
                         ┌───────────────────┐
                         │      CLIENT       │
                         │ Web / Mobile App  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    EXPRESS API    │
                         └─────────┬─────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
          Authentication      Validation         Rate Limit
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    Controllers    │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     Services      │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      Prisma       │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    PostgreSQL     │
                         └───────────────────┘

       ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
       │    Redis     │   │    Stripe    │   │ Google OAuth │
       └──────────────┘   └──────────────┘   └──────────────┘

       ┌──────────────┐   ┌──────────────┐
       │ Email / SMTP │   │ PDF Invoice  │
       └──────────────┘   └──────────────┘
```

### Built for

**Security 🔐 · Reliability 🛡️ · Scalability 📈 · Maintainability 🧱 · Real-world Logistics 🚚**
