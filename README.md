# NestJS Authentication System (OTP + JWT + Refresh Tokens + Session Management)

# Overview

This project is a **secure authentication system** built with **NestJS** and **MySQL**, featuring:  

- **Passwordless login** via **OTP (One-Time Password)**  
- **JWT-based authentication** with **Access Token** and **Refresh Token**  
- **Session management** with **Refresh Token rotation** (stored in **sessions table**)  
- **Role-Based Access Control (RBAC)**  
- **Rate limiting** to prevent brute-force attacks  
- **Advanced security measures**: OTP hashing, strict validation, proper error handling  
- **Modular, clean architecture**  
- Designed using **reverse engineering** to analyze requirements and model database & authentication flows  

---

# Tech Stack

- Backend: NestJS  
- Database: MySQL  
- ORM: TypeORM  
- Authentication: OTP, JWT, Refresh Tokens  
- Security: Guards, Rate-limiting, Validation Pipes, Interceptors, Exception Filters  
- Environment Management: dotenv  

---

# Project Structure

```text
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   └── strategies/
├── otp/
│   ├── otp.module.ts
│   ├── otp.service.ts
│   └── entities/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── entities/
├── roles/
│   ├── roles.module.ts
│   ├── roles.service.ts
│   ├── roles.guard.ts
│   └── entities/
├── sessions/
│   ├── sessions.module.ts
│   ├── sessions.service.ts
│   └── entities/          # SessionEntity: userId, refreshTokenHash, ip, userAgent, expiresAt
└── database/
    ├── database.module.ts
    ├── database.config.service.ts
    └── migrations/
```
---

# Environment Variables (.env)

```dotenv
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=auth_sysDB

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# OTP
OTP_EXPIRY=120
OTP_LENGTH=6

# Rate Limit
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW=60000

# App
APP_PORT=3000
NODE_ENV=development
```

#Installation
```bash
# Clone repository
git clone <repo-url>
cd authentication-system

# Install dependencies
npm install

# Start MySQL (Docker example)
docker run --name auth-mysql -e MYSQL_ROOT_PASSWORD= -p 3306:3306 -d mysql:8

# Run the application
npm run start:dev
```

# Authentication Flow
Request OTP

Endpoint: POST /auth/request-otp

User sends their phone number.

System generates a secure OTP.

Verify OTP

Endpoint: POST /auth/verify-otp

OTP is validated.

If successful:

Issues Access Token + Refresh Token.

If user does not exist → creates a new user automatically.

Creates a session record in sessions table:

userId

refreshTokenHash

ip

userAgent

expiresAt

Refresh Token

Endpoint: POST /auth/refresh

User obtains a new Access Token using Refresh Token.

Implements Session Rotation → invalidates old refresh tokens in sessions table.

Logout

Endpoint: POST /auth/logout

Invalidates all refresh tokens for the user.

Ends the session.

Database & Migrations

users → user information (phoneNumber, profile, etc.)

otp_codes → OTP records, expiration, IP, usage status

refresh_tokens → hashed refresh tokens, IP, user-agent

roles → roles for RBAC

sessions → active sessions with:

userId

ip

userAgent

refreshTokenHash

expiresAt

# 💡 Note: Database design is informed by reverse engineering to model OTP flows, session handling, and token rotation properly.

Security Features

OTPs are hashed using bcrypt.

Rate limiting prevents brute-force attacks.

Short-lived JWT access tokens with refresh token rotation.

Session table ensures active sessions can be tracked and revoked.

Role-Based Access Control (RBAC) using Guards.

Centralized error handling with Exception Filters.

Input validation with Pipes.

Contributing

Fork the repository

# Create a new branch
```bash
git checkout -b feature/xyz
```

Make your changes

Submit a Pull Request
