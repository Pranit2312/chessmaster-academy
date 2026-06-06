# API Documentation

## Chess Learning Ecosystem API Reference

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.chess-ecosystem.com/api`

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123!",
  "role": "student"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "token": "jwt_token"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user_id",
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

---

## Course Endpoints

### Create Course (Coach Only)
```
POST /courses
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Chess Openings Basics",
  "description": "Learn fundamental chess opening principles",
  "shortDescription": "Learn chess openings",
  "category": "Openings",
  "difficulty": "Beginner",
  "pricing": {
    "price": 999,
    "discountPercentage": 10,
    "effectivePrice": 899
  },
  "thumbnail": "url_to_image"
}

Response:
{
  "success": true,
  "data": {
    "id": "course_id",
    "title": "Chess Openings Basics",
    "slug": "chess-openings-basics",
    ...
  }
}
```

### Get All Courses
```
GET /courses?category=Openings&difficulty=Beginner&page=1&limit=12

Response:
{
  "success": true,
  "data": [
    {
      "id": "course_id",
      "title": "Chess Openings Basics",
      "instructor": {...},
      "pricing": {...},
      ...
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 12
  }
}
```

### Get Course Details
```
GET /courses/:id

Response:
{
  "success": true,
  "data": {
    "id": "course_id",
    "title": "Chess Openings Basics",
    "description": "...",
    "instructor": {...},
    "chapters": [...],
    "reviews": [...],
    ...
  }
}
```

---

## Enrollment Endpoints

### Enroll in Course
```
POST /enrollments
Authorization: Bearer {token}
Content-Type: application/json

{
  "courseId": "course_id",
  "paymentMethod": "razorpay"
}

Response:
{
  "success": true,
  "data": {
    "enrollmentId": "enrollment_id",
    "courseId": "course_id",
    "status": "active",
    "enrolledAt": "2026-01-15T10:00:00Z"
  }
}
```

### Get My Enrollments
```
GET /enrollments?status=active

Response:
{
  "success": true,
  "data": [
    {
      "id": "enrollment_id",
      "course": {...},
      "status": "active",
      "progress": 45,
      "enrolledAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## Payment Endpoints

### Initialize Razorpay Payment
```
POST /payments/razorpay/init
Authorization: Bearer {token}
Content-Type: application/json

{
  "courseId": "course_id",
  "amount": 999
}

Response:
{
  "success": true,
  "data": {
    "orderId": "razorpay_order_id",
    "amount": 99900,
    "currency": "INR"
  }
}
```

### Verify Razorpay Payment
```
POST /payments/razorpay/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "razorpayOrderId": "order_id",
  "razorpayPaymentId": "payment_id",
  "razorpaySignature": "signature"
}

Response:
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "status": "completed"
  }
}
```

---

## Booking Endpoints

### Create Session Booking
```
POST /bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "coachId": "coach_id",
  "slotId": "slot_id",
  "duration": 60
}

Response:
{
  "success": true,
  "data": {
    "bookingId": "booking_id",
    "status": "confirmed",
    "scheduledAt": "2026-02-01T14:00:00Z"
  }
}
```

### Get My Bookings
```
GET /bookings?status=confirmed

Response:
{
  "success": true,
  "data": [
    {
      "id": "booking_id",
      "coach": {...},
      "scheduledAt": "2026-02-01T14:00:00Z",
      "duration": 60,
      "status": "confirmed"
    }
  ]
}
```

---

## Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `500 Internal Server Error` - Server error

---

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer {jwt_token}
```

Tokens expire in 15 minutes. Use refresh tokens to get new access tokens:

```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response:
{
  "success": true,
  "data": {
    "token": "new_jwt_token"
  }
}
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Headers returned:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time in seconds

---

## Pagination

List endpoints support pagination:
- `?page=1` - Page number (default: 1)
- `?limit=12` - Items per page (default: 12, max: 100)

Response includes:
```json
{
  "data": [...],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 12,
    "pages": 42
  }
}
```

---

## Testing

Use Postman or cURL to test endpoints:

```bash
# Get all courses
curl -X GET http://localhost:5000/api/courses

# Create course (requires auth)
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Course Title",
    "description": "Course description",
    ...
  }'
```

---

**Last Updated:** June 2026
**API Version:** 1.0.0
