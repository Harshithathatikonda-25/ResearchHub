# ResearchHub Backend Connection Guide

## Overview

This is a complete PHP/MySQL backend for the ResearchHub research paper management system. The backend is organized into modular, secure files that handle database connections, CRUD operations, and API endpoints.

---

## File Structure

```
wp projects/
├── db.php              # Database connection (centralized)
├── api.php             # API endpoints (secure with prepared statements)
├── api-examples.js     # Frontend integration examples
├── setup_db.php        # Database initialization script
├── app.js              # Frontend helper functions
└── [HTML pages]        # index.html, papers.html, upload.html, etc.
```

---

## 1. Database Connection (db.php)

**Purpose:** Centralized database connection file using MySQLi with error handling.

**Configuration:**
```php
$db_host = "localhost";      // MySQL Host
$db_user = "root";           // MySQL Username
$db_password = "";           // MySQL Password (empty for XAMPP)
$db_name = "research_db";    // Database Name
$db_port = 3307;             // MySQL Port
```

**Features:**
- ✅ Graceful error handling
- ✅ UTF-8 charset support
- ✅ CORS headers for frontend requests
- ✅ Helper functions: `dbError()` and `dbSuccess()`
- ✅ Preflight OPTIONS request handling

**How to use:**
```php
require_once 'db.php';  // Include in api.php or other files
// $conn is now available globally
```

---

## 2. API Endpoints (api.php)

**Purpose:** RESTful API for all CRUD operations on research papers.

### Endpoints Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api.php?action=list&user={username}` | Fetch all papers for user |
| POST | `/api.php` | Create new paper or update existing |
| DELETE | `/api.php` | Delete a paper |

---

### GET - Fetch Papers

**Request:**
```bash
curl "http://localhost:8000/api.php?action=list&user=admin"
```

**JavaScript:**
```javascript
const response = await fetch('api.php?action=list&user=admin');
const papers = await response.json();
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Attention is All You Need",
    "author": "Ashish Vaswani",
    "year": 2017,
    "domain": "AI / Deep Learning",
    "timeToRead": "45 mins",
    "difficulty": "Advanced",
    "shortSummary": "Introduces transformer architecture",
    "detailedSummary": "Full description...",
    "keyPoints": ["Attention", "Parallelizable"],
    "progress": 75,
    "isFavorite": true,
    "status": "In Progress",
    "timestamp_ms": 1713302400000,
    "userOwner": "admin",
    "pdfPath": null
  }
]
```

---

### POST - Create Paper (Insert)

**Request:**
```javascript
const payload = {
  userOwner: 'admin',
  title: 'Deep Learning Fundamentals',
  author: 'Ian Goodfellow',
  year: 2016,
  domain: 'AI / Deep Learning',
  timeToRead: '60 mins',
  difficulty: 'Intermediate',
  shortSummary: 'Overview of deep learning',
  detailedSummary: 'Comprehensive guide...',
  keyPoints: ['Neural Networks', 'Backpropagation'],
  status: 'Not Started',
  progress: 0
};

const response = await fetch('api.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await response.json();
// result.data.id = newly created paper ID
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Paper uploaded successfully",
  "data": {
    "id": 2
  }
}
```

---

### POST - Update Paper Status/Progress

**Request:**
```javascript
const payload = {
  action: 'update',
  id: 1,
  status: 'In Progress',
  progress: 50,
  isFavorite: true
};

const response = await fetch('api.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await response.json();
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Paper updated successfully"
}
```

---

### DELETE - Delete Paper

**Request:**
```javascript
const response = await fetch('api.php', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ id: 1, user: 'admin' })
});

const result = await response.json();
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Paper deleted successfully"
}
```

---

## 3. Security Features

### ✅ Prepared Statements
All user inputs use parameterized queries to prevent SQL injection:

```php
// SECURE (Prepared Statement)
$stmt = $conn->prepare("SELECT * FROM papers WHERE userOwner = ?");
$stmt->bind_param("s", $user);
$stmt->execute();

// NOT SECURE (String concatenation)
$sql = "SELECT * FROM papers WHERE userOwner = '$user'";  // ❌ SQL Injection risk
```

### ✅ Input Validation
- Required fields are checked before insertion
- Data types are validated (integers, strings, etc.)
- Error messages are user-friendly

### ✅ Authorization Checks
Before deleting a paper, verify ownership:

```php
// Verify user owns the paper before deletion
$check_stmt = $conn->prepare("SELECT id FROM papers WHERE id = ? AND userOwner = ?");
$check_stmt->bind_param("is", $id, $user);
```

---

## 4. Setup Instructions

### Step 1: Ensure MySQL is Running
- **XAMPP:** Start MySQL from XAMPP Control Panel
- **Port:** Verify MySQL is running on port `3307`
- **Check in MySQL Workbench:**
  - Host: `localhost` or `127.0.0.1`
  - Port: `3307`
  - User: `root`
  - Password: (empty)

### Step 2: Start PHP Server
From your project folder:
```bash
php -S localhost:8000
```

Or use XAMPP/WAMP:
- Put project in `htdocs` (XAMPP) or `www` (WAMP)
- Access: `http://localhost/<project-folder>`

### Step 3: Initialize Database
Open in browser:
```
http://localhost:8000/setup_db.php
```

Expected output:
```
✅ Database 'research_db' initialized successfully.
✅ Table 'papers' structured successfully.
```

### Step 4: Test Connection
Open in browser:
```
http://localhost:8000/api.php?action=list&user=admin
```

You should see:
```
[]     // Empty array initially (no papers yet)
```

---

## 5. Database Schema

The `papers` table structure:

```sql
CREATE TABLE IF NOT EXISTS papers (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    year INT(4) NOT NULL,
    domain VARCHAR(100) DEFAULT NULL,
    timeToRead VARCHAR(50) DEFAULT NULL,
    difficulty VARCHAR(50) DEFAULT NULL,
    shortSummary VARCHAR(200) DEFAULT NULL,
    detailedSummary TEXT DEFAULT NULL,
    keyPoints TEXT DEFAULT NULL,          -- Stored as JSON
    progress INT(3) DEFAULT 0,
    isFavorite BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Not Started',
    timestamp_ms BIGINT(20) DEFAULT 0,
    userOwner VARCHAR(50) DEFAULT 'admin',
    pdfPath TEXT DEFAULT NULL,
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

---

## 6. Frontend Integration Examples

### Example 1: Fetch and Display Papers
```javascript
// Load papers when page opens
async function loadPapers() {
    const papers = await fetch('api.php?action=list&user=admin').then(r => r.json());
    
    papers.forEach(paper => {
        console.log(`${paper.title} by ${paper.author}`);
    });
}

loadPapers();
```

### Example 2: Upload Form Handler
```javascript
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const payload = {
        userOwner: 'admin',
        title: formData.get('title'),
        author: formData.get('author'),
        year: parseInt(formData.get('year')),
        ... // other fields
    };
    
    const response = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
        alert('Paper uploaded!');
    } else {
        alert(`Error: ${result.message}`);
    }
});
```

### Example 3: Update Status
```javascript
function markAsComplete(paperId) {
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update',
            id: paperId,
            status: 'Completed',
            progress: 100,
            isFavorite: true
        })
    }).then(r => r.json()).then(console.log);
}

markAsComplete(1);
```

---

## 7. Troubleshooting

### Issue: "Database Connection Failed"
**Solution:**
- Check MySQL is running on port 3307
- Verify credentials in `db.php`
- Test connection in MySQL Workbench

### Issue: "api.php shows raw PHP code in browser"
**Solution:**
- The server is not running PHP, only serving static files
- Start PHP server with: `php -S localhost:8000`
- Or use XAMPP/WAMP

### Issue: "Prepared Statement Error"
**Solution:**
- Check data types match `bind_param` signature:
  - `s` = string
  - `i` = integer
  - `d` = double
  - `b` = blob

### Issue: "CORS errors in browser console"
**Solution:**
- CORS headers are already included in `db.php`
- If still having issues, check that frontend URL matches origin

---

## 8. Next Steps

### Add These Features:
- [ ] User authentication (login system)
- [ ] Paper search functionality
- [ ] PDF file upload storage
- [ ] Pagination for large paper lists
- [ ] Export papers to CSV

### Security Improvements:
- [ ] Hash passwords for user login
- [ ] Add rate limiting to API
- [ ] Use HTTPS in production
- [ ] Add input sanitization
- [ ] Implement JWT tokens for auth

### Performance:
- [ ] Add database indexes
- [ ] Implement caching (Redis)
- [ ] Add pagination support
- [ ] Optimize queries

---

## 9. File Reference

### db.php
- **Contains:** Database connection, error handling, CORS headers
- **Used by:** `api.php`, `setup_db.php`
- **Exports:** `$conn` (MySQLi connection object)

### api.php
- **Contains:** All API endpoints with prepared statements
- **Methods:** GET (fetch), POST (create/update), DELETE
- **Security:** Prepared statements, input validation, ownership checks

### api-examples.js
- **Contains:** JavaScript examples for API usage
- **Functions:** `fetchAllPapers()`, `uploadPaper()`, `updatePaperStatus()`, `deletePaper()`

### setup_db.php
- **Purpose:** One-time database initialization
- **Creates:** `research_db` database and `papers` table
- **Run once:** `http://localhost:8000/setup_db.php`

---

## Support

For issues or questions:
1. Check the "Troubleshooting" section above
2. Verify all files are in the correct directory
3. Check browser console (F12) for JavaScript errors
4. Check PHP error logs

Happy researching! 📚
