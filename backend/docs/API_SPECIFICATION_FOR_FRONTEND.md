# API SPECIFICATION FOR FRONTEND DEVELOPMENT

**IMPORTANT INSTRUCTIONS FOR AI GENERATING THE FRONTEND:**

1. **Gateway Base URL:** `http://localhost:8000`
2. **All requests MUST go through the gateway** (do NOT hit individual service ports directly)
3. **Authentication:** All protected routes require `Authorization: Bearer <token>` header
4. **Tech Stack:** React + Vite + Tailwind CSS v4 (latest)
5. **NO DUMMY DATA:** Every component must connect directly to these real API endpoints
6. **Progress Tracking:** After completing each major component/page, state "Completed X/Y components"

---

## AUTHENTICATION ROUTES (Auth Service via Gateway)

### 1. Register User
**Endpoint:** `POST /api/auth/register`  
**Auth Required:** NO  
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```
**Response (201):**
```json
{
  "message": "User registered successfully"
}
```
**Error (400):**
```json
{
  "error": "Email already exists"
}
```

---

### 2. Login
**Endpoint:** `POST /api/auth/login`  
**Auth Required:** NO  
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response (200):**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "name": "string",
    "email": "string"
  }
}
```
**Error (404):**
```json
{
  "error": "User not found"
}
```
**Error (400):**
```json
{
  "error": "Invalid credentials"
}
```

**Frontend Action:** Store the `token` in localStorage/sessionStorage and use it for all subsequent requests as `Authorization: Bearer <token>`

---

### 3. Change Password
**Endpoint:** `PUT /api/auth/password`  
**Auth Required:** YES (Bearer token)  
**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```
**Error (400):**
```json
{
  "error": "Incorrect current password"
}
```

---

### 4. Delete Account
**Endpoint:** `DELETE /api/auth/me`  
**Auth Required:** YES (Bearer token)  
**Request Body:** None  
**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**IMPORTANT:** Before calling this endpoint, the frontend MUST first call `DELETE /api/resume/wipe` to clean up user data.

---

## RESUME GENERATOR ROUTES (Resume Service via Gateway)

### 5. Create Profile + Base Resume
**Endpoint:** `POST /api/resume/create`  
**Auth Required:** YES (Bearer token)  
**Request Body:**
```json
{
  "userData": {
    "NAME": "string",
    "EMAIL": "string",
    "PHONE": "string",
    "LINKEDIN": "string (full URL)",
    "GITHUB": "string (full URL)",
    "LOCATION": "string",
    "PORTFOLIO": "string (full URL)",
    "EXPERIENCE": [
      {
        "COMPANY": "string",
        "ROLE": "string",
        "DURATION": "string (e.g. 'Jan 2022 - Present')",
        "LOCATION": "string",
        "POINTS": ["string", "string"]
      }
    ],
    "PROJECTS": [
      {
        "TITLE": "string",
        "LINK": "string (URL)",
        "TECH": "string (e.g. 'React, Node.js')",
        "DATE": "string (e.g. 'Jan 2024')",
        "POINTS": ["string", "string"]
      }
    ],
    "SKILLS": {
      "LANGUAGES": "string (comma-separated or array)",
      "FRAMEWORKS_LIBRARIES": "string",
      "TOOLS": "string",
      "DATABASES": "string",
      "CORE_CONCEPTS": "string",
      "SOFT_SKILLS": "string"
    },
    "EDUCATION": [
      {
        "INSTITUTE": "string",
        "DURATION": "string",
        "DETAILS": "string (e.g. 'B.Tech CSE - CGPA: 9.0')"
      }
    ],
    "CERTIFICATIONS": ["string", "string"],
    "ACHIEVEMENTS": ["string", "string"]
  }
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Profile and Base Resume Created",
  "masterId": "mongodb-id",
  "resumeId": "mongodb-id",
  "latexCode": "string (generated LaTeX)",
  "content": { /* normalized resume content */ }
}
```

**Frontend Use Case:** Initial profile creation page with a multi-step form. After success, navigate user to dashboard.

---

### 6. Get User's Resume List (Dashboard)
**Endpoint:** `GET /api/resume/list`  
**Auth Required:** YES (Bearer token)  
**Request Body:** None  
**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "resume-id",
      "versionName": "Base Resume",
      "jobDescription": "string or null",
      "atsScore": 85,
      "createdAt": "ISO-date",
      "updatedAt": "ISO-date"
    }
  ]
}
```

**Frontend Use Case:** Dashboard page showing all user resumes in a list/grid. Each card should display versionName, atsScore, and date. Click to edit.

---

### 7. Get Resume By ID (Load for Editing)
**Endpoint:** `GET /api/resume/detail/:id`  
**Auth Required:** YES (Bearer token)  
**URL Params:** `id` = resume MongoDB ID  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "resume-id",
    "userId": "user-id",
    "masterProfileId": "master-id",
    "versionName": "Base Resume",
    "jobDescription": "string or null",
    "content": {
      "personalInfo": { /* ... */ },
      "experience": [ /* ... */ ],
      "projects": [ /* ... */ ],
      "skills": { /* ... */ },
      "education": [ /* ... */ ],
      "certifications": [],
      "achievements": []
    },
    "latexCode": "string",
    "atsScore": 0,
    "atsAnalysis": {
      "suggestions": [],
      "missingKeywords": []
    },
    "createdAt": "ISO-date",
    "updatedAt": "ISO-date"
  }
}
```

**Frontend Use Case:** Resume editor page. Load this data and populate form fields. User can edit and save.

---

### 8. AI Audit Resume
**Endpoint:** `POST /api/resume/audit`  
**Auth Required:** YES (Bearer token)  
**Request Body:**
```json
{
  "resumeData": {
    "SUMMARY": "string (optional)",
    "EXPERIENCE": [ /* array from resume content */ ],
    "PROJECTS": [ /* array from resume content */ ]
  },
  "jobDescription": "string (the JD text)"
}
```
**Response (200):**
```json
{
  "success": true,
  "report": {
    "missingKeywords": ["React", "AWS"],
    "summary": {
      "original": "string",
      "suggestion": "string",
      "reason": "string"
    },
    "experience": [
      {
        "company": "string",
        "role": "string",
        "points": [
          {
            "original": "string",
            "suggestion": "string",
            "type": "Grammar | Impact | Keyword",
            "reason": "string"
          }
        ]
      }
    ],
    "projects": [
      {
        "title": "string",
        "points": [
          {
            "original": "string",
            "suggestion": "string",
            "type": "Grammar | Impact | Keyword",
            "reason": "string"
          }
        ]
      }
    ]
  }
}
```

**Frontend Use Case:** AI Audit page. User pastes JD, clicks "Analyze", display suggestions side-by-side with original text. User can accept/reject suggestions.

---

### 9. Update Resume Version (Save Edits)
**Endpoint:** `PUT /api/resume/update/:id`  
**Auth Required:** YES (Bearer token)  
**URL Params:** `id` = resume ID  
**Request Body:**
```json
{
  "updatedContent": {
    "personalInfo": { /* updated fields */ },
    "experience": [ /* updated array */ ],
    "projects": [ /* ... */ ],
    "skills": { /* ... */ },
    "education": [ /* ... */ ],
    "certifications": [],
    "achievements": []
  }
}
```
**Optional Body (for ATS updates only):**
```json
{
  "atsScore": 85,
  "atsAnalysis": {
    "suggestions": ["string"],
    "missingKeywords": ["string"]
  },
  "jobDescription": "string"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Resume updated",
  "latexCode": "string (regenerated LaTeX)",
  "content": { /* updated content */ },
  "atsScore": 85
}
```

**Frontend Use Case:** Save button in editor. Send updated content to this endpoint. Update local state with returned data.

---

### 10. Get Resume LaTeX (for PDF compile)
**Endpoint:** `GET /api/resume/latex/:id`  
**Auth Required:** YES (Bearer token)  
**URL Params:** `id` = resume ID  
**Response (200):**
```
Plain text LaTeX code (Content-Type: text/plain)
```

**Frontend Use Case:** Preview PDF button. Fetch LaTeX, then send it to the compiler endpoint.

---

### 11. Get Master Profile
**Endpoint:** `GET /api/resume/profile`  
**Auth Required:** YES (Bearer token)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "master-id",
    "userId": "user-id",
    "personalInfo": { /* ... */ },
    "experience": [ /* ... */ ],
    "projects": [ /* ... */ ],
    "skills": { /* ... */ },
    "education": [ /* ... */ ],
    "certifications": [],
    "achievements": []
  }
}
```

**Frontend Use Case:** Settings page to view/edit global master profile.

---

### 12. Update Master Profile
**Endpoint:** `PUT /api/resume/profile`  
**Auth Required:** YES (Bearer token)  
**Request Body:**
```json
{
  "userData": {
    /* Same structure as Create Profile userData */
  }
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated",
  "data": { /* updated master profile */ }
}
```

---

### 13. Delete Resume
**Endpoint:** `DELETE /api/resume/delete/:id`  
**Auth Required:** YES (Bearer token)  
**URL Params:** `id` = resume ID  
**Response (200):**
```json
{
  "success": true,
  "message": "Resume deleted"
}
```

**Frontend Use Case:** Delete button on dashboard. Confirm with user, then call this endpoint.

---

### 14. Wipe All User Data
**Endpoint:** `DELETE /api/resume/wipe`  
**Auth Required:** YES (Bearer token)  
**Response (200):**
```json
{
  "success": true,
  "message": "All user data deleted"
}
```

**Frontend Use Case:** Account deletion flow. Call this BEFORE calling `DELETE /api/auth/me`.

---

## ATS SERVICE ROUTES (ATS Scoring via Gateway)

### 15. Analyze Resume (Score vs JD)
**Endpoint:** `POST /api/ats/analyze`  
**Auth Required:** YES (Bearer token)  
**Request Type:** `multipart/form-data`  
**Form Data:**
- `resume`: File (PDF, max 5MB)
- `jd`: String (Job Description text)

**Response (200):**
```json
{
  "ats_score": 78,
  "summary": "Good fit for the role with strong backend experience.",
  "strengths": [
    "Strong Node.js and MongoDB experience",
    "Relevant project portfolio",
    "Good education background"
  ],
  "improvements": [
    "Add AWS certification",
    "Include Docker/Kubernetes keywords",
    "Mention CI/CD experience"
  ]
}
```

**Frontend Use Case:** ATS Scan page. User uploads PDF and pastes JD. Display score with strengths/improvements in a card layout.

---

### 16. Parse Resume (Extract Data from PDF)
**Endpoint:** `POST /api/ats/parse`  
**Auth Required:** YES (Bearer token)  
**Request Type:** `multipart/form-data`  
**Form Data:**
- `resume`: File (PDF, max 5MB)

**Alternative (Text Input):**
**Request Body:**
```json
{
  "text": "string (raw resume text)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "personalInfo": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "linkedin": "string",
      "github": "string",
      "location": "string",
      "portfolio": "string"
    },
    "experience": [
      {
        "company": "string",
        "role": "string",
        "duration": "string",
        "location": "string",
        "points": ["string"]
      }
    ],
    "projects": [
      {
        "title": "string",
        "tech": "string",
        "link": "string",
        "date": "string",
        "points": ["string"]
      }
    ],
    "education": [
      {
        "institute": "string",
        "duration": "string",
        "details": "string"
      }
    ],
    "skills": {
      "languages": ["string"],
      "frameworks": ["string"],
      "tools": ["string"],
      "databases": ["string"]
    },
    "certifications": ["string"],
    "achievements": ["string"]
  }
}
```

**Frontend Use Case:** "Import Resume" feature. User uploads PDF, system extracts data, pre-fills the profile creation form. User can review and edit before submitting.

---

## LATEX COMPILER ROUTES (PDF Generation via Gateway)

### 17. Compile LaTeX to PDF
**Endpoint:** `POST /api/compiler/compile`  
**Auth Required:** NO (but rate-limited)  
**Request Body:**
```json
{
  "tex": "string (full LaTeX document)",
  "outputName": "string (optional, defaults to 'resume')"
}
```
**Response (200):**
```
Binary PDF file (Content-Type: application/pdf)
```

**Frontend Use Case:** "Download PDF" button. Fetch LaTeX from `/api/resume/latex/:id`, send to this endpoint, receive PDF blob, trigger browser download.

**Example Frontend Code:**
```javascript
const response = await fetch('http://localhost:8000/api/compiler/compile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tex: latexCode, outputName: 'my-resume' })
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'resume.pdf';
a.click();
```

---

## FRONTEND COMPONENT REQUIREMENTS

### Pages to Build (Minimum 10 components/pages):

1. **Login Page** - POST /api/auth/login
2. **Register Page** - POST /api/auth/register
3. **Dashboard** - GET /api/resume/list
4. **Profile Creation Form (Multi-step)** - POST /api/resume/create
5. **Resume Editor** - GET /api/resume/detail/:id, PUT /api/resume/update/:id
6. **AI Audit Page** - POST /api/resume/audit
7. **ATS Score Page** - POST /api/ats/analyze
8. **Resume Parser/Import** - POST /api/ats/parse
9. **PDF Preview/Download** - GET /api/resume/latex/:id + POST /api/compiler/compile
10. **Settings Page** - GET /api/resume/profile, PUT /api/resume/profile, PUT /api/auth/password, DELETE /api/auth/me
11. **Master Profile Editor** - GET /api/resume/profile, PUT /api/resume/profile

### UI/UX Requirements:
- Use Tailwind CSS v4 for styling
- Modern, clean design
- Responsive (mobile-friendly)
- Loading states for all API calls
- Error handling with toast notifications
- Form validation
- Protected routes (redirect to login if no token)

### State Management Suggestions:
- Use React Context or Zustand for auth state (token, user info)
- Local state for forms
- React Query or SWR for API data fetching and caching

### Progress Tracking Format:
After completing each major section, output:
```
✅ Completed: Login & Register Pages (2/11 components)
✅ Completed: Dashboard (3/11 components)
✅ Completed: Profile Creation (4/11 components)
... etc
```

---

## IMPORTANT NOTES FOR FRONTEND DEVELOPER:

1. **Authentication Flow:**
   - Store JWT token in localStorage after login
   - Add token to all protected route requests: `Authorization: Bearer ${token}`
   - If 401 response, redirect to login
   - Implement logout (clear token from storage)

2. **File Upload (ATS routes):**
   - Use FormData for file uploads
   - Example:
   ```javascript
   const formData = new FormData();
   formData.append('resume', pdfFile);
   formData.append('jd', jobDescriptionText);
   
   fetch('http://localhost:8000/api/ats/analyze', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: formData
   });
   ```

3. **Error Handling:**
   - All routes can return 500 errors with `{ error: "message" }`
   - Protected routes return 401 if token is missing/invalid
   - Handle network errors gracefully

4. **Data Structure Flexibility:**
   - Backend accepts both uppercase (NAME, EMAIL) and lowercase (name, email) keys
   - Backend normalizes data internally
   - Frontend should use consistent casing (recommend lowercase for cleaner code)

5. **Environment Variables:**
   - Create `.env` file with: `VITE_API_BASE_URL=http://localhost:8000`
   - Use `import.meta.env.VITE_API_BASE_URL` in API calls

6. **Testing:**
   - Start backend services before testing frontend
   - Gateway must be running on port 8000
   - All other services (auth, resume, ats, compiler) must be running

---

## WORKFLOW EXAMPLE: Full User Journey

1. User registers → `POST /api/auth/register`
2. User logs in → `POST /api/auth/login` → Save token
3. User creates profile → `POST /api/resume/create`
4. User views dashboard → `GET /api/resume/list`
5. User edits resume → `GET /api/resume/detail/:id` → `PUT /api/resume/update/:id`
6. User runs ATS scan → `POST /api/ats/analyze`
7. User runs AI audit → `POST /api/resume/audit`
8. User implements suggestions → `PUT /api/resume/update/:id`
9. User downloads PDF → `GET /api/resume/latex/:id` → `POST /api/compiler/compile`
10. User changes password → `PUT /api/auth/password`
11. User deletes account → `DELETE /api/resume/wipe` → `DELETE /api/auth/me`

---

## START BUILDING NOW

Begin with authentication pages, then dashboard, then profile creation. Report progress after each major component.

**Remember:** NO DUMMY DATA. Every component connects to real APIs. Every form submits to these endpoints. Every list/detail view fetches from these endpoints.

Good luck! 🚀
