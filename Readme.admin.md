# Backend Admin API Documentation

This document provides an overview of all backend APIs available for admin users, including endpoints, descriptions, request/response schemas, and authentication requirements.

---

## **Authentication**

Most admin APIs require a valid JWT token with the `role: "admin"` in the Authorization header or cookies.

---

## **Admin APIs**

### **1. Admin Login**
- **Endpoint**: `POST /admin/login`
- **Description**: Authenticates an admin and returns access and refresh tokens.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "adminpassword"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_jwt_token"
  }
  ```

---

### **2. Get All Users**
- **Endpoint**: `GET /admin/users`
- **Description**: Retrieves a list of all registered users.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  [
    {
      "id": "user_id",
      "mobileNumber": "1234567890",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
    // ...more users
  ]
  ```

---

### **3. Get User Details**
- **Endpoint**: `GET /admin/users/:userId`
- **Description**: Retrieves details of a specific user.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  {
    "id": "user_id",
    "mobileNumber": "1234567890",
    "role": "user",
    "bankAccounts": [
      {
        "bankName": "HDFC Bank",
        "accountNumber": "123456789012",
        "ifscCode": "HDFC0001234"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
  ```

---

### **4. Approve/Reject Deposit**
- **Endpoint**: `POST /admin/transactions/deposit/:transactionId/approve`
- **Description**: Approves a pending deposit transaction.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  {
    "message": "Deposit approved",
    "transactionId": "txn_id"
  }
  ```

- **Endpoint**: `POST /admin/transactions/deposit/:transactionId/reject`
- **Description**: Rejects a pending deposit transaction.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  {
    "message": "Deposit rejected",
    "transactionId": "txn_id"
  }
  ```

---

### **5. View All Transactions**
- **Endpoint**: `GET /admin/transactions`
- **Description**: Retrieves all transactions (deposits, withdrawals, etc.).
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  [
    {
      "id": "txn_id",
      "userId": "user_id",
      "type": "deposit",
      "amount": 1000,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
    // ...more transactions
  ]
  ```

---

### **6. Update User Role**
- **Endpoint**: `PATCH /admin/users/:userId/role`
- **Description**: Updates the role of a user (e.g., promote to admin).
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "role": "admin"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User role updated",
    "userId": "user_id",
    "newRole": "admin"
  }
  ```

---

### **7. Delete User**
- **Endpoint**: `DELETE /admin/users/:userId`
- **Description**: Deletes a user account.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  {
    "message": "User deleted",
    "userId": "user_id"
  }
  ```

---

## **Notes**
- All endpoints require admin authentication unless otherwise specified.
- Replace `:userId` and `:transactionId` with actual IDs.
- Error responses will include a `message` field describing the error.

---
