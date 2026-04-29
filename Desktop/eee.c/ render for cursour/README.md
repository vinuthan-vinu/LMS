# College Learning Management System (LMS)

## 1. Problem Statement
Colleges often run teaching workflows across disconnected tools: attendance in spreadsheets, assignments in chat groups, submissions in email, and announcements through informal channels. This creates missing records, inconsistent grading, weak access control, and poor visibility for students, lecturers, and administrators.

This project solves that problem with a role-based mobile-first Learning Management System built using Expo React Native, Express.js, MongoDB, and Render. The system centralizes authentication, course administration, assignment publishing, submission tracking, notifications, and file uploads in one API-driven platform with full CRUD support for each academic module.

## Core Features (Mandatory + Good to Have)
- **Authentication + RBAC**: Students, Lecturers/Instructors, Admin (JWT + protected routes)
- **Course management**: Create/update/delete courses (Lecturer/Admin), course details + cover image
- **Enrollment**: Students enroll/unenroll, view “My Courses”
- **Assignments**: Lecturer creates assignments, students view assignments by enrolled courses
- **Submissions + grading**: Students submit work (with files), lecturers grade with feedback
- **Materials/resources**: Upload & download PDFs/images/videos per course (same upload pipeline)
- **Announcements/notifications**: System/course notifications + unread/read tracking
- **Grades/progress tracking** (optional extension): gradebook-style summaries and progress indicators

## Quick Start
### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Required Configuration Before Running
- Put your MongoDB Atlas URI into `backend/.env`
- Set `JWT_SECRET` in `backend/.env`
- Replace `expo.extra.apiBaseUrl` in `mobile/app.json` with your live Render API URL

## 2. System Architecture
### Text Architecture Diagram
```text
+-----------------------+        HTTPS + JWT        +------------------------------+
|  React Native App     |  <--------------------->  |  Express.js REST API         |
|  Expo + Navigation    |                           |  Controllers + Middleware    |
|  Axios + AsyncStorage |                           |  Validation + Multer + RBAC  |
+-----------+-----------+                           +---------------+--------------+
            |                                                           |
            |                                                           |
            v                                                           v
  Secure token storage                                     MongoDB Atlas (Mongoose)
  Protected screens                                        Users / Courses / Assignments
  File picker uploads                                      Submissions / Notifications
            |                                                           |
            +----------------------- Render Deployment ------------------+
```

### Architecture Diagram (Detailed)
```text
                    +----------------------------+
                    |   Expo React Native App    |
                    |  (Android/iOS/Web preview) |
                    +--------------+-------------+
                                   |
                                   | REST (HTTPS/HTTP) + JWT (Bearer)
                                   v
                    +--------------+-------------+
                    |      Node.js / Express     |
                    |  Routes → Middleware → MVC |
                    |  Validation + RBAC + JWT   |
                    +-------+--------------+------+
                            |              |
                            |              | Static /uploads (or cloud later)
                            v              v
                 +----------+----+     +---+------------------+
                 | MongoDB Atlas |     | File Storage         |
                 | (Mongoose ODM)|     | Multer → uploads/    |
                 +---------------+     | (or S3/Cloudinary)   |
                                       +----------------------+
```

### Flow Explanation
1. The Expo mobile app sends REST requests with JWT tokens using Axios.
2. Express routes pass requests through validation, authentication, authorization, and error middleware.
3. Controllers coordinate business logic and persist data through Mongoose models.
4. Multer handles file upload requests and exposes uploaded assets through the backend.
5. MongoDB Atlas stores relational academic data through document references.
6. Render hosts the backend API, and the mobile app points to the live Render URL through `mobile/app.json`.

## Main Entities (Suggested 6‑Member Distribution)
This matches a typical “one entity per member” split for team development.

- **Member 1 — Course**
  - Course CRUD (Lecturer/Admin), cover image upload, course search/listing
  - Fields example: `courseCode`, `title`, `description`, `lecturerId`, `coverImage`, `credits`, `semester`
- **Member 2 — Enrollment**
  - Student enroll/unenroll, “My Courses”, access checks (only enrolled students see materials/assignments)
  - Fields example: `studentId`, `courseId`, `enrollmentDate`, `progress` (optional)
- **Member 3 — Assignment**
  - Lecturer creates assignments; students list assignments by course; due date & total marks
  - Fields example: `title`, `description`, `courseId`, `dueDate`, `totalMarks`, `attachment` (optional)
- **Member 4 — Submission**
  - Student submission + lecturer grading workflow; file upload + status tracking
  - Fields example: `studentId`, `assignmentId`, `submittedFileUrl`, `submittedAt`, `marks`, `feedback`, `status`
- **Member 5 — Material**
  - Upload/download course resources (PDF/images/videos); role restrictions (Lecturer/Admin upload)
  - Fields example: `title`, `courseId`, `fileUrl`, `fileType`, `uploadedBy`
- **Member 6 — Announcement / Gradebook**
  - Announcements + notifications OR gradebook/progress module (pick one based on time)
  - Fields example (Announcement): `title`, `content`, `courseId` (or global), `postedBy`, `createdAt`

## 3. Database Design
### Collections
#### `users`
- `name`: `String`, required
- `email`: `String`, required, unique
- `password`: `String`, required, bcrypt-hashed
- `role`: `student | lecturer | admin`
- `department`: `String`
- `phone`: `String`
- `avatar`: `String`
- `enrollmentNumber`: `String`
- `employeeId`: `String`
- `createdAt`, `updatedAt`

#### `courses`
- `title`: `String`, required
- `code`: `String`, required, unique
- `description`: `String`, required
- `department`: `String`, required
- `semester`: `Number`, required
- `credits`: `Number`, required
- `lecturer`: `ObjectId -> users`
- `students`: `[ObjectId -> users]`
- `coverImage`: `String`
- `isActive`: `Boolean`
- `createdBy`: `ObjectId -> users`
- `createdAt`, `updatedAt`

#### `assignments`
- `title`: `String`, required
- `description`: `String`, required
- `course`: `ObjectId -> courses`
- `dueDate`: `Date`, required
- `maxScore`: `Number`
- `status`: `draft | published | closed`
- `attachments`: `[String]`
- `createdBy`: `ObjectId -> users`
- `createdAt`, `updatedAt`

#### `submissions`
- `assignment`: `ObjectId -> assignments`
- `course`: `ObjectId -> courses`
- `student`: `ObjectId -> users`
- `content`: `String`, required
- `attachments`: `[String]`
- `status`: `submitted | resubmitted | graded`
- `grade`: `Number`
- `feedback`: `String`
- `submittedAt`: `Date`
- `gradedAt`: `Date`
- `gradedBy`: `ObjectId -> users`
- `createdAt`, `updatedAt`

#### `notifications`
- `title`: `String`, required
- `message`: `String`, required
- `type`: `info | assignment | submission | course | system`
- `targetRole`: `student | lecturer | admin | all`
- `course`: `ObjectId -> courses`
- `recipient`: `ObjectId -> users`
- `createdBy`: `ObjectId -> users`
- `isRead`: `Boolean`
- `readAt`: `Date`
- `readBy`: `[ObjectId -> users]`
- `link`: `String`
- `createdAt`, `updatedAt`

### Relationships
- One lecturer can teach many courses.
- One course can contain many students.
- One course can contain many assignments.
- One assignment can receive many submissions.
- One student can submit one submission per assignment.
- Notifications can target a role, one course, or one direct recipient.

## 4. API Design
Base URL: `https://your-render-service.onrender.com/api/v1`

| Method | Route | Description | Success | Common Errors |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | Register student/lecturer/admin | `201` | `400` duplicate/validation |
| `POST` | `/auth/login` | Login and receive JWT | `200` | `401` invalid credentials |
| `GET` | `/auth/me` | Fetch current user | `200` | `401` no token |
| `PATCH` | `/auth/profile` | Update own profile | `200` | `400`, `401` |
| `GET` | `/users?role=lecturer` | List users for admin/lecturer workflows | `200` | `401`, `403` |
| `GET` | `/courses` | List courses | `200` | `401` |
| `POST` | `/courses` | Create course | `201` | `400`, `401`, `403` |
| `GET` | `/courses/:id` | Get course detail | `200` | `404` |
| `PATCH` | `/courses/:id` | Update course | `200` | `400`, `403`, `404` |
| `DELETE` | `/courses/:id` | Delete course | `200` | `403`, `404` |
| `POST` | `/courses/:id/enroll` | Enroll or unenroll student | `200` | `401`, `403`, `404` |
| `GET` | `/assignments` | List assignments | `200` | `401` |
| `POST` | `/assignments` | Create assignment with attachments | `201` | `400`, `403`, `404` |
| `GET` | `/assignments/:id` | Get assignment detail | `200` | `404` |
| `PATCH` | `/assignments/:id` | Update assignment | `200` | `400`, `403`, `404` |
| `DELETE` | `/assignments/:id` | Delete assignment | `200` | `403`, `404` |
| `GET` | `/submissions` | List submissions by role scope | `200` | `401` |
| `POST` | `/submissions` | Student creates submission | `201` | `400`, `403`, `404` |
| `GET` | `/submissions/:id` | Get submission detail | `200` | `403`, `404` |
| `PATCH` | `/submissions/:id` | Student edits or lecturer grades | `200` | `400`, `403`, `404` |
| `DELETE` | `/submissions/:id` | Delete submission | `200` | `403`, `404` |
| `GET` | `/dashboard/summary` | Dashboard stats + upcoming items | `200` | `401` |
| `GET` | `/notifications` | List visible notifications | `200` | `401` |
| `POST` | `/notifications` | Create notification | `201` | `400`, `403` |
| `PATCH` | `/notifications/:id` | Edit notification or mark read | `200` | `400`, `403`, `404` |
| `DELETE` | `/notifications/:id` | Delete notification | `200` | `403`, `404` |
| `POST` | `/uploads` | Upload single file via Multer | `201` | `400`, `401` |
| `GET` | `/health` | Health check for Render | `200` | `500` |

### Example Request/Response
#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Anita Sharma",
  "email": "anita@college.edu",
  "password": "Secure123",
  "role": "student",
  "department": "Computer Science"
}
```

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "662f...",
      "name": "Anita Sharma",
      "email": "anita@college.edu",
      "role": "student"
    }
  }
}
```

## 5. Backend Implementation
### Backend Structure
```text
backend/
  package.json
  .env.example
  src/
    app.js
    server.js
    config/db.js
    controllers/
    middleware/
    models/
    routes/
    utils/
    validators/
  uploads/
```

### Backend Features Implemented
- JWT authentication with protected routes
- Password hashing using `bcryptjs`
- Role-based authorization middleware
- Mongoose data modeling with references
- Multer upload pipeline
- Centralized error handling
- Validation using `express-validator`
- Modular controllers and routes for team split

### Environment Example
See [backend/.env.example](/Users/vinuthanvinuthan/Desktop/RENDER/backend/.env.example).

### Backend Scripts
- `npm run dev`: local development with Nodemon
- `npm start`: production start command for Render
- `npm run verify`: basic syntax verification

## 6. Frontend Implementation
### Frontend Structure
```text
mobile/
  App.js
  app.json
  src/
    components/
    constants/
    context/
    navigation/
    screens/
    services/
    theme/
    utils/
```

### Screens
- Login/Register
- Dashboard
- Courses
- Assignments
- Submissions
- Profile

### UI/UX Direction
- Blue/indigo/white professional palette
- Soft gradient backgrounds
- Card-based layout
- Rounded corners and shadow elevation
- Protected tab navigation
- Loading states, error alerts, and form validation

### Frontend Notes
- No module uses hardcoded academic data.
- All lists and CRUD actions are API-driven through Axios services.
- JWT token persistence uses AsyncStorage.
- File upload flows use `expo-document-picker` and `multipart/form-data`.

## 7. Integration
1. Set the live backend URL in `mobile/app.json` under `expo.extra.apiBaseUrl`.
2. Login or register from the mobile app.
3. The app stores JWT in AsyncStorage.
4. Axios request interceptor injects `Authorization: Bearer <token>`.
5. Protected backend routes return user-specific data based on JWT and role.

## 8. Testing & Validation
### CRUD Validation Checklist
- Authentication: register, login, fetch profile, update profile
- Courses: create, list, read, update, delete, enroll/unenroll
- Assignments: create, list, read, update, delete
- Submissions: create, list, read, update, delete, grading
- Notifications: create, list, update/read, delete
- Uploads: single upload endpoint and multipart attachment upload

### Recommended Manual API Tests
Use Postman or Thunder Client:
1. Register one student, one lecturer, and one admin.
2. Login as lecturer and create a course.
3. Login as student and enroll in that course.
4. Login as lecturer and create an assignment.
5. Login as student and submit work with a file.
6. Login as lecturer and grade the submission.
7. Login as admin or lecturer and create notifications.

### Error Cases to Demonstrate
- Invalid JWT returns `401`
- Missing fields return `400`
- Accessing unauthorized role action returns `403`
- Missing record returns `404`
- Unhandled server issue returns `500`

## 9. Deployment
### MongoDB Atlas Setup
1. Create a cluster in MongoDB Atlas.
2. Create a database user.
3. Add your Render IP or allow all IPs for testing.
4. Copy the connection string into `MONGODB_URI`.

### Render Deployment
1. Push this repository to GitHub.
2. Create a new Web Service in Render.
3. Select the repo and set `Root Directory` to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `JWT_EXPIRES_IN=7d`
   - `API_BASE_URL=https://your-service.onrender.com`
   - `CLIENT_URL=exp://your-local-ip:8081`
7. Deploy and confirm `/api/v1/health` returns `200`.

### Mobile App Connection
1. Open `mobile/app.json`.
2. Replace `https://your-render-service.onrender.com/api/v1` with the deployed Render API.
3. Run Expo locally and confirm login/register hit the live backend.

### Live API Testing
Test these exact routes after deployment:
- `GET https://your-service.onrender.com/api/v1/health`
- `POST https://your-service.onrender.com/api/v1/auth/register`
- `POST https://your-service.onrender.com/api/v1/auth/login`

## 10. Team Responsibility Breakdown (6 Members)
### Member 1: Course Module
- Backend: course model/controller/routes, cover image upload
- Frontend: course list/detail, create/edit (role-based)
- Testing: course CRUD + permissions

### Member 2: Enrollment Module
- Backend: enroll/unenroll route + access checks for course-scoped data
- Frontend: “Enroll” action + “My Courses”
- Testing: student enrollment flows + authorization

### Member 3: Assignment Module
- Backend: assignment model/controller/routes (course-linked)
- Frontend: assignment list/detail, create/edit (lecturer/admin)
- Testing: due date/marks validation + role restrictions

### Member 4: Submission + Grading Module
- Backend: submission routes + grading/update logic, multipart uploads
- Frontend: submit work + lecturer grading UI (feedback/marks)
- Testing: student submit/edit + lecturer grade + file upload

### Member 5: Materials/Resources Module
- Backend: materials upload/download (can reuse uploads pipeline), course-scoped listing
- Frontend: materials list + download/open
- Testing: file types + access restrictions

### Member 6: Announcements / Notifications OR Gradebook
- Option A: announcements + notification UX + unread/read tracking
- Option B: gradebook/progress summaries (student view + lecturer/admin view)
- Testing: role visibility + course scoping

## 11. Viva Preparation
### Module 1: Authentication
- What to explain: JWT lifecycle, password hashing, protected routes, auth context
- Common questions: Why JWT? Why bcrypt? Where is the token stored?
- Key technical points: middleware-based protection, stateless auth, hashed passwords never stored in plain text

### Module 2: Course Management
- What to explain: lecturer ownership, student enrollment, course references
- Common questions: How do you prevent unauthorized edits? How is enrollment stored?
- Key technical points: RBAC, Mongoose references, full CRUD API

### Module 3: Assignment Management
- What to explain: linking assignments to courses, due dates, file attachments
- Common questions: How do students see only relevant assignments? How are files uploaded?
- Key technical points: filtered role-based query logic, Multer multipart handling

### Module 4: Submission Management
- What to explain: one submission per student per assignment, grading flow, resubmission
- Common questions: How is duplicate submission prevented? How does grading work?
- Key technical points: compound unique index, role-aware update logic, grade validation

### Module 5: Dashboard & Notifications
- What to explain: summary aggregation, unread notification logic, recent activity
- Common questions: How is the dashboard customized by role? How is notification read state tracked?
- Key technical points: role-scoped queries, notification `readBy` array, recent data aggregation

### Module 6: Uploads & Deployment
- What to explain: Multer configuration, static file serving, Render deployment flow
- Common questions: Where do files go? How is MongoDB connected? What env vars are needed?
- Key technical points: multipart handling, `render.yaml`, Atlas connection string, health check endpoint

## Important Submission Note
This repository is production-structured and deployment-ready. Actual live deployment still requires your own Render and MongoDB Atlas credentials, because those secrets and external accounts are not available inside this workspace.
