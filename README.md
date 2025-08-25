# NestJS Authentication System (OTP + JWT + Refresh Tokens + Session Management)

## Overview

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

## Tech Stack

- **Backend:** NestJS  
- **Database:** MySQL  
- **ORM:** TypeORM  
- **Authentication:** OTP, JWT, Refresh Tokens  
- **Security:** Guards, Rate-limiting, Validation Pipes, Interceptors, Exception Filters  
- **Environment Management:** dotenv  

---

## Project Structure

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
