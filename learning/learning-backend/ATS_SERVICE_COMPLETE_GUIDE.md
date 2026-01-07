# ATS Service: Complete Technical Guide
## A Comprehensive Course on Resume Processing Microservice Architecture

**Instructor's Note:** This document provides an in-depth academic exploration of the ATS (Applicant Tracking System) service implementation. Each concept is explained with theoretical foundations, practical implementations, and real-world applications.

---

## **Module 1: File Upload Handling with Multer**

### **1.1 Multer: Middleware for Multipart/Form-Data**

#### **Theoretical Foundation**

**Multer** is a Node.js middleware specifically designed for handling `multipart/form-data`, which is the encoding type used when uploading files through HTML forms. Understanding its internal workings requires knowledge of HTTP protocols, stream processing, and middleware architecture.

#### **The Problem Multer Solves**

When a client uploads a file, the HTTP request contains the file in a format called **multipart/form-data**. This format is complex:

```
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="resume"; filename="resume.pdf"
Content-Type: application/pdf

[Binary PDF data here...]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

Parsing this manually would be extremely complex. Multer handles:
1. **Boundary detection** - Identifying where each field starts and ends
2. **Stream processing** - Handling files chunk by chunk (not loading entire file in memory at once)
3. **Metadata extraction** - Getting filename, mimetype, field name
4. **Storage management** - Where and how to store the file

#### **Multer Architecture in Your Implementation**

```javascript
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});
```

Let's dissect each component:

##### **A. Storage Engines**

Multer provides two primary storage engines:

**1. Disk Storage (DiskStorage)**
```javascript
// Stores files on disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Save to uploads/ directory
  },
  filename: function (req, file, cb) {
    // Custom filename: user123-1703000000-resume.pdf
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`)
  }
});

const upload = multer({ storage: storage });
```

**When to use:** When you need to:
- Persist files long-term
- Serve files later (download endpoints)
- Process large files that don't fit in memory

**Drawbacks:**
- Disk I/O is slower than memory
- Need to clean up files manually
- File path management complexity

**2. Memory Storage (MemoryStorage)** ✅ **Your Choice**
```javascript
const upload = multer({ 
  storage: multer.memoryStorage()
});
```

**How it works:**
- Stores entire file in **RAM** as a **Buffer**
- Accessible via `req.file.buffer`
- Temporary - disappears after request completes

**When to use:**
- Processing files immediately (PDF parsing, image resizing)
- No need to persist original file
- Files are reasonably sized (< 10MB typically)

**Your use case:** Perfect for PDF resume parsing
- Upload PDF → Extract text immediately → Discard original
- No disk cleanup needed
- Fast access via Buffer

##### **B. File Size Limits**

```javascript
limits: { fileSize: 5 * 1024 * 1024 }  // 5MB in bytes
```

**Security & Resource Management:**

This prevents:
1. **Denial of Service (DoS) attacks**
   - Attacker uploads 10GB file → Server runs out of memory
   - With limit: Request rejected immediately

2. **Cost control**
   - Large files consume bandwidth and processing time
   - 5MB is reasonable for a resume PDF (typical: 100KB-1MB)

**Calculation breakdown:**
```
1 MB = 1024 KB = 1024 * 1024 bytes = 1,048,576 bytes
5 MB = 5 * 1,048,576 = 5,242,880 bytes
```

**What happens when exceeded:**
```javascript
// Client uploads 6MB file
// Multer automatically rejects with error:
{
  error: "File too large",
  code: "LIMIT_FILE_SIZE",
  limit: 5242880,
  received: 6291456
}
```

#### **C. Multer as Middleware**

**Express Middleware Chain:**

```javascript
router.post('/analyze', upload.single('resume'), analyzeResume);
//                      ↑                        ↑
//                   Middleware 1             Middleware 2
//                   (Multer)                 (Your handler)
```

**Execution Flow:**

```
1. Client sends POST request with file
   ↓
2. Express receives request
   ↓
3. upload.single('resume') executes (Multer middleware)
   - Checks if request contains 'resume' field
   - Validates file size
   - Streams file data into Buffer
   - Attaches to req.file object
   ↓
4. If successful, calls next() → analyzeResume executes
   ↓
5. analyzeResume accesses req.file.buffer
```

**Multer populates req.file object:**
```javascript
req.file = {
  fieldname: 'resume',           // Form field name
  originalname: 'my-resume.pdf', // Original filename
  encoding: '7bit',              // File encoding
  mimetype: 'application/pdf',   // MIME type
  buffer: <Buffer 25 50 44 46...>, // File data (when using memoryStorage)
  size: 245632                   // File size in bytes
}
```

#### **D. upload.single() vs upload.array() vs upload.fields()**

**1. upload.single('fieldname')**
```javascript
// Accepts ONE file from field named 'resume'
upload.single('resume')

// Access: req.file (singular)
```

**2. upload.array('fieldname', maxCount)**
```javascript
// Accepts MULTIPLE files from same field
upload.array('documents', 10)  // Max 10 files

// Access: req.files (array)
req.files = [
  { fieldname: 'documents', buffer: <Buffer...> },
  { fieldname: 'documents', buffer: <Buffer...> }
]
```

**3. upload.fields([...])**
```javascript
// Accepts files from DIFFERENT fields
upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'certificates', maxCount: 5 }
])

// Access: req.files (object with field names as keys)
req.files = {
  resume: [{ buffer: <Buffer...> }],
  coverLetter: [{ buffer: <Buffer...> }],
  certificates: [{ buffer: <Buffer...> }, { buffer: <Buffer...> }]
}
```

#### **E. Error Handling with Multer**

```javascript
router.post('/upload', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  // Process file...
});

// Global error handler for Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: "File too large. Max 5MB allowed." 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: "Unexpected field name. Use 'resume'." 
      });
    }
  }
  next(err);
});
```

**Common Multer Errors:**
- `LIMIT_FILE_SIZE` - File exceeds size limit
- `LIMIT_FILE_COUNT` - Too many files
- `LIMIT_UNEXPECTED_FILE` - Wrong field name
- `LIMIT_FIELD_KEY` - Field name too long
- `LIMIT_FIELD_VALUE` - Field value too long

---

## **Module 2: PDF Text Extraction Architecture**

### **1.2 PDF Processing with Worker Threads**

#### **The Challenge: PDF Parsing is CPU-Intensive**

PDF files are complex:
- Text is stored in **streams** with **encoding** and **compression**
- **Fonts** must be parsed and mapped
- **Layout** requires geometric calculations
- **Embedded objects** (images, forms) need handling

Parsing a 10-page PDF can take **500ms-2 seconds** of CPU time.

**Problem with Single-Threaded Node.js:**
```javascript
// BAD: Blocks event loop
router.post('/parse', upload.single('resume'), async (req, res) => {
  const text = await heavyPdfParsing(req.file.buffer); // Blocks for 2 seconds!
  // During these 2 seconds, NO other requests can be processed
  res.json({ text });
});
```

**Impact:**
- Request 1: Upload PDF → Processing (2 seconds)
- Request 2: Simple API call → **WAITS 2 seconds** (blocked by Request 1)
- Request 3: Another PDF → **WAITS 4 seconds** (queued behind 1 & 2)

**Solution: Worker Threads**

Move CPU-intensive work to a **separate thread**, keeping the main event loop free.

---

### **1.2.1 Understanding `req.file.buffer`**

#### **What is a Buffer?**

A **Buffer** is a fixed-size chunk of memory (outside V8 JavaScript heap) used to store **binary data**.

**Why Buffers exist:**

JavaScript strings are designed for **text** (UTF-16 encoded). They're inefficient for binary data like:
- Images (JPEG, PNG)
- Videos (MP4)
- PDFs
- Audio files

**Example: Text vs Binary**

```javascript
// String: "Hello" (5 characters, but ~10 bytes in UTF-16)
const str = "Hello";
console.log(str.length); // 5

// Buffer: Raw bytes
const buf = Buffer.from("Hello", 'utf-8');
console.log(buf); // <Buffer 48 65 6c 6c 6f>
console.log(buf.length); // 5 (bytes)
console.log(buf[0]); // 72 (ASCII code for 'H')
```

#### **`req.file.buffer` Deep Dive**

When Multer uses `memoryStorage()`, the uploaded file is stored as a Buffer:

```javascript
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('resume'), (req, res) => {
  console.log(req.file.buffer);
  // <Buffer 25 50 44 46 2d 31 2e 37 0a 25 ... 245632 more bytes>
  
  console.log(req.file.buffer.length); // 245632 (bytes)
  
  // First 4 bytes of PDF: %PDF (magic number)
  console.log(req.file.buffer.slice(0, 4).toString());
  // "%PDF"
});
```

**PDF File Structure:**
```
Byte 0-3:   25 50 44 46  (%PDF - magic number)
Byte 4-7:   2d 31 2e 37  (-1.7 - version)
Byte 8:     0a           (newline)
...
[Compressed PDF content]
...
Last bytes: %%EOF        (end marker)
```

**Why Buffer, not String?**

```javascript
// ❌ WRONG: Convert PDF to string
const text = req.file.buffer.toString('utf-8');
// Result: Garbled text (binary data interpreted as UTF-8)
// "�PNG%PDF-1.7 ��ߎ� ... �������"

// ✅ CORRECT: Pass Buffer to PDF parser
const pdf = await parsePDF(req.file.buffer);
// PDF parser interprets binary data correctly
```

**Buffer Operations:**

```javascript
// Create Buffers
Buffer.from('Hello');           // From string
Buffer.from([72, 101, 108]);    // From array of bytes
Buffer.alloc(10);               // Allocate 10 zero-filled bytes

// Read data
buf[0];                  // Get byte at index 0
buf.slice(0, 4);        // Get bytes 0-3
buf.toString('utf-8');  // Convert to string

// Write data
buf[0] = 65;            // Set byte at index 0 to 65 ('A')
buf.write('Hello', 0);  // Write string starting at index 0

// Convert to other formats
Array.from(buf);        // Convert to regular array
new Uint8Array(buf);    // Convert to TypedArray (for pdfjsLib)
```

---

### **1.2.2 Worker Client Architecture**

#### **File: `workerClient.js` - The Orchestrator**

**Purpose:** Creates and manages worker threads for PDF processing.

**Complete Code Analysis:**

```javascript
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parsePdfInWorker(buffer) {
  return new Promise((resolve, reject) => {
    
    // 1. Construct absolute path to worker script
    const workerPath = path.join(__dirname, "./pdf.worker.js");
    
    // 2. Create Worker instance
    const worker = new Worker(workerPath, {
      workerData: buffer // Pass PDF buffer to worker
    });

    // 3. Listen for successful result
    worker.on("message", (result) => {
      if (result.success) {
        resolve({
          text: result.text,
          links: result.links
        });
      } else {
        reject(new Error(result.error));
      }
    });

    // 4. Handle worker errors
    worker.on("error", (err) => {
      reject(err);
    });

    // 5. Handle unexpected worker termination
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
```

**Line-by-Line Explanation:**

##### **Path Resolution (ESM Compatibility)**

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

**Why this is needed:**

In CommonJS modules, `__dirname` and `__filename` are automatically available:
```javascript
// CommonJS (old way)
const path = require('path');
console.log(__dirname); // Automatically available
```

In ES Modules (using `import`), they're **NOT** available:
```javascript
// ESM (new way)
import path from 'path';
console.log(__dirname); // ReferenceError: __dirname is not defined
```

**Solution:**
```javascript
import { fileURLToPath } from "url";

// import.meta.url gives file:///C:/Users/.../workerClient.js
const __filename = fileURLToPath(import.meta.url);
// Result: C:\Users\...\workerClient.js

const __dirname = path.dirname(__filename);
// Result: C:\Users\...\scoring
```

**Why we need absolute paths:**
```javascript
// ❌ Relative path might fail in different working directories
const worker = new Worker("./pdf.worker.js");

// ✅ Absolute path always works
const workerPath = path.join(__dirname, "./pdf.worker.js");
// Result: C:\Users\...\scoring\pdf.worker.js
```

##### **Creating the Worker**

```javascript
const worker = new Worker(workerPath, {
  workerData: buffer
});
```

**What happens here:**

1. **New Thread Created**
   - Node.js spawns a new operating system thread
   - This thread has its own V8 isolate (separate JavaScript environment)
   - Memory is isolated (thread-safe)

2. **Script Execution**
   - Worker thread loads and executes `pdf.worker.js`
   - Runs in parallel with main thread

3. **Data Transfer**
   - `buffer` is passed to worker via `workerData`
   - **Transfer mechanism:**
     - Small data (< 1MB): **Copied** (duplicated in worker's memory)
     - Large data: Can use **transferList** for zero-copy transfer

**Memory Visualization:**
```
Main Thread                    Worker Thread
├── Event Loop                 ├── Separate Event Loop
├── req.file.buffer (5MB)      ├── workerData (copy of buffer, 5MB)
├── Express app                ├── pdf.worker.js code
└── Other requests             └── pdfjsLib processing
```

##### **Communication Pattern**

**Worker threads communicate via message passing:**

```
Main Thread                           Worker Thread
    |                                      |
    | new Worker(path, { workerData })     |
    |------------------------------------->|
    |                                      | processPdf()
    |                                      | (parse PDF...)
    |                                      |
    |       parentPort.postMessage(result) |
    |<-------------------------------------|
    | worker.on("message", callback)       |
    |                                      |
```

---

### **1.2.3 Worker Threads in Node.js**

#### **Why Worker Threads?**

**Node.js is Single-Threaded**

```javascript
// Single Event Loop handles ALL operations
while (eventLoop.hasEvents()) {
  const event = eventLoop.next();
  event.execute(); // Blocks loop until complete
}
```

**Problems with CPU-Intensive Tasks:**

```javascript
// 🔴 BAD: CPU-intensive operation blocks everything
function calculatePrimes(max) {
  const primes = [];
  for (let i = 2; i < max; i++) {
    let isPrime = true;
    for (let j = 2; j < i; j++) {
      if (i % j === 0) isPrime = false;
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}

app.get('/primes', (req, res) => {
  const result = calculatePrimes(1000000); // Takes 5 seconds
  res.json(result);
});

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello' }); // Waits 5 seconds!
});
```

**Timeline:**
```
0s: GET /primes arrives
0s-5s: Calculating primes (event loop blocked)
2s: GET /hello arrives (queued, waiting)
5s: /primes responds
5s: /hello finally executes
```

#### **Solutions Comparison**

| Solution | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Child Processes** | Separate memory, robust | Heavy (new process), slow startup | External programs, sandboxing |
| **Cluster Mode** | Multiple Node instances | No shared memory, complex IPC | Horizontal scaling |
| **Worker Threads** | Shared memory, lightweight | Shared memory complexity | CPU-intensive tasks |
| **Async I/O** | Non-blocking, efficient | Only for I/O, not CPU | Network, file operations |

#### **Worker Threads Deep Dive**

**Creating a Worker:**

```javascript
import { Worker } from 'worker_threads';

const worker = new Worker('./heavy-task.js', {
  workerData: { input: 'data' },    // Initial data
  env: process.env,                  // Environment variables (optional)
  transferList: []                   // ArrayBuffers to transfer (optional)
});
```

**Advantages:**

1. **Lightweight**
   - Share memory with main process (can share ArrayBuffers)
   - Faster startup than child processes (~5ms vs ~50ms)

2. **Communication**
   - Message passing via `postMessage()`
   - Can transfer ArrayBuffers without copying (zero-copy transfer)

3. **Parallelism**
   - True parallel execution on multi-core CPUs
   - Each worker on separate CPU core

**Example: PDF Processing Speedup**

```javascript
// Sequential: Parse 10 PDFs
for (const pdf of pdfs) {
  await parsePdf(pdf); // 1 second each
}
// Total: 10 seconds

// Parallel: Parse 10 PDFs with 4 workers
const workers = pdfs.map(pdf => 
  new Worker('parser.js', { workerData: pdf })
);
await Promise.all(workers.map(w => waitForResult(w)));
// Total: ~2.5 seconds (4 workers × 1 sec each, distributed)
```

**When to Use Workers:**

✅ **Good use cases:**
- PDF parsing
- Image processing
- Video encoding
- Cryptographic operations
- Data compression
- Large dataset processing

❌ **Bad use cases:**
- Network requests (use async/await instead)
- File I/O (already non-blocking)
- Simple calculations (< 50ms)

---

## **Practice Problems**

### **Problem Set 1: Multer**

**Problem 1.1:** Configure Multer to accept up to 5 PDF files, save them to disk with unique filenames.

**Problem 1.2:** Add validation to reject non-PDF files (check mimetype).

**Problem 1.3:** Implement custom error handling for file size exceeded errors.

### **Problem Set 2: Buffers**

**Problem 2.1:** Write a function to check if a buffer contains a valid PDF (starts with `%PDF`).

**Problem 2.2:** Extract the PDF version from a buffer (e.g., "1.7" from `%PDF-1.7`).

**Problem 2.3:** Convert a buffer to a hexadecimal string representation.

### **Problem Set 3: Worker Threads**

**Problem 3.1:** Create a worker that calculates Fibonacci numbers up to n.

**Problem 3.2:** Modify the worker to handle errors and send error messages back.

**Problem 3.3:** Implement a worker pool that reuses 4 workers for multiple tasks.

---

## **Summary of Module 1 & 2**

**Key Concepts Covered:**
1. ✅ Multer middleware architecture and storage engines
2. ✅ File upload handling with multipart/form-data
3. ✅ Buffer data structure for binary files
4. ✅ Worker client pattern for async processing
5. ✅ Worker threads for CPU-intensive operations

**Next Topics (Coming in Part 2):**
- Worker event listeners (.on methods)
- pdf.worker.js implementation
- global.DOMMatrix polyfill
- pdfjsLib operations
- Text cleaning and manipulation

---

**End of Part 1 (5 Topics)**

**Student Assessment:**
Before proceeding to Part 2, ensure you understand:
- [ ] Why memoryStorage is used instead of diskStorage
- [ ] What req.file.buffer contains and why
- [ ] How worker threads communicate with main thread
- [ ] When to use worker threads vs async/await
- [ ] How Multer middleware fits into Express request lifecycle

**Ready for Part 2?** Let me know when you'd like to continue with the next 5 topics.

---

# Part 2: Worker Events, pdf.worker.js, DOMMatrix, pdfjsLib, Text Cleaning

## **Module 3: Worker Events and Robust Orchestration**

### **1.2.4 Worker `.on()` Methods — Deep Dive**

In Node.js, `Worker` is an `EventEmitter`. Understanding its event lifecycle is critical for reliability and resource hygiene.

**Primary Events:**
- **`'online'`**: Emitted once the worker thread starts executing the script. Use it to log readiness or start a timer.
- **`'message'`**: Emitted when the worker calls `parentPort.postMessage(payload)`. This carries normal results.
- **`'messageerror'`**: Emitted when a message cannot be deserialized. Indicates structured clone failures or incompatible data.
- **`'error'`**: Emitted if the worker throws an unhandled exception. Treat as a failure path and clean up.
- **`'exit'`**: Emitted when the worker stops. Non-zero `code` implies abnormal termination.

**Applied to your `workerClient.js`:**

```javascript
const worker = new Worker(workerPath, { workerData: buffer });

worker.on('online', () => {
  // Worker is initialized; useful for metrics
});

worker.on('message', (result) => {
  if (result.success) {
    resolve({ text: result.text, links: result.links });
  } else {
    reject(new Error(result.error));
  }
});

worker.on('messageerror', (err) => {
  // Payload could not be cloned or parsed
  reject(err);
});

worker.on('error', (err) => {
  // Unhandled exception inside worker
  reject(err);
});

worker.on('exit', (code) => {
  if (code !== 0) {
    reject(new Error(`Worker stopped with exit code ${code}`));
  }
});
```

**Reliability Patterns:**
- **Timeouts**: Wrap the promise with a timeout to avoid hanging on stalled workers.
- **Cancellation**: Track workers and terminate via `worker.terminate()` on upstream cancellations.
- **Backpressure**: Use a worker pool (e.g., limit to N concurrent workers) to avoid CPU oversubscription.
- **Structured Results**: Always return `{ success, data, error }` shape to simplify handling.

---

## **Module 4: `pdf.worker.js` — Purpose and Significance**

### **1.2.5 Why a Dedicated Worker Script?**

Your file at [backend/ats-service/src/scoring/pdf.worker.js](backend/ats-service/src/scoring/pdf.worker.js) isolates PDF parsing concerns. This design has multiple advantages:

- **Isolation of Heavy Dependencies**: `pdfjs-dist` loads font parsers, CMAPs, and geometry logic. Keeping it out of the main thread minimizes startup overhead and memory pressure in the web route handlers.
- **Event Loop Protection**: CPU-bound parsing runs off the main event loop, preserving low-latency handling of other HTTP requests.
- **Clear Contracts**: The worker exposes a single entry (`workerData` in, `postMessage` out) with a well-defined payload: `{ success, text, links }`.
- **Targeted Polyfills**: Node lacks browser APIs; the worker defines `global.DOMMatrix` without polluting the entire app.
- **Security & Stability**: Exceptions in parsing logic do not crash the main server; they are contained and surfaced as `'error'` or failed messages.

### **Core Responsibilities Implemented**
- Receive `Buffer` via `workerData`, convert to `Uint8Array` (required by `pdfjsLib`).
- Create `loadingTask = pdfjsLib.getDocument({ data })` and await `loadingTask.promise`.
- Iterate pages: `pdf.getPage(i)` ➜ `page.getTextContent()` ➜ concatenate `item.str`.
- Extract annotations: `page.getAnnotations()` ➜ collect `Link` subtype with `annotation.url`.
- Clean text via `cleanText()` and return `{ text, links }`.

---

## **Module 5: `global.DOMMatrix` Polyfill**

### **1.2.6 What is `DOMMatrix` and Why Polyfill?**

`DOMMatrix` is a Web API representing 2D/3D transformation matrices used for layout and rendering (translate, scale, rotate, skew). In browser builds, `pdf.js` may rely on matrix math for mapping glyph positions to page coordinates.

**Node.js Gap:** Node does not implement browser DOM APIs. When `pdfjsLib` expects `global.DOMMatrix`, we provide a minimal stand‑in:

```javascript
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.is2D = true; // Signals that 2D operations are acceptable
  }
};
```

**Why this suffices here:** For text extraction, `pdf.js` primarily reads text items (`TextContent.items`) and annotations; complex 3D transforms are not exercised. A lightweight `is2D` flag prevents runtime checks from failing.

**Advanced Polyfill Options:**
- Use `@jsquash/dommatrix` or `dommatrix` libraries for full matrix operations if you later need layout rendering.
- Pair with `canvas` and `pdfjs-dist` renderer to rasterize pages server‑side (heavier, only if you need images).

---

## **Module 6: `pdfjsLib` — Complete Overview**

### **1.2.7 Teaching `pdfjsLib` (pdfjs-dist)**

`pdfjsLib` from `pdfjs-dist` is Mozilla's PDF parser/renderer. In Node, you typically use the legacy build: `pdfjs-dist/legacy/build/pdf.js`.

**Key Entry Points:**
- **`pdfjsLib.getDocument(src)`**: Creates a `PDFDocumentLoadingTask`. `src` can be `{ data: Uint8Array }`, a URL, or a typed stream.
- **`loadingTask.promise`**: Resolves to `PDFDocumentProxy`.
- **`PDFDocumentProxy`**: Main document handle with:
  - `numPages`: number of pages
  - `getPage(pageNumber)`: returns `PDFPageProxy`
  - `getMetadata()`, `getOutline()`, `getAttachments()` (optional, may require extra config)
- **`PDFPageProxy`**:
  - `getTextContent()` ➜ returns `TextContent` with `items: [{ str, dir, transform, ... }]`
  - `getAnnotations()` ➜ returns annotation objects (links, form fields, etc.)
  - `getViewport({ scale })` ➜ for rendering use cases

**Common Options to `getDocument`:**
- `data`: `Uint8Array` of PDF bytes (what you use)
- `disableFontFace`: `true` to avoid loading font face via CSS (good for Node)
- `cMapUrl` and `cMapPacked`: For certain font encodings (if you see missing glyphs)
- `standardFontDataUrl`: Needed for rendering text to canvas in Node

**Example Flow (Your Implementation):**

```javascript
const data = new Uint8Array(buffer);
const loadingTask = pdfjsLib.getDocument({ data, disableFontFace: true });
const pdf = await loadingTask.promise;

let fullText = '';
const extractedLinks = [];

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const pageText = content.items.map((item) => item.str).join(' ');
  fullText += pageText + ' ';

  const annotations = await page.getAnnotations();
  annotations.forEach((a) => {
    if (a.subtype === 'Link' && a.url) {
      extractedLinks.push({ page: i, url: a.url });
    }
  });
}
```

**Performance Tips:**
- Prefer `Uint8Array` input to avoid copies.
- Avoid rendering; text extraction is faster and sufficient for ATS.
- Cache CMAPs if using complex fonts.
- Parallelize across workers for multi‑page large PDFs only if necessary; per‑page `getPage` is already efficient.

**Error Classes to Expect:**
- `InvalidPDFException`: Corrupted or non‑PDF input
- `MissingPDFException`: Source not found when using URL
- `UnexpectedResponseException`: Network/HTTP issues (URL mode)

---

## **Module 7: Text Cleaning Techniques**

### **1.2.8 How to Clean Text (with Practice)**

Clean text improves downstream NLP, keyword matching, and AI prompts. Goals: normalize whitespace, remove artifacts, preserve semantic tokens (emails, URLs, numbers).

**Your Current Cleaner (from worker):**

```javascript
const cleanText = (text) => {
  return text
    .replace(/\n+/g, ' ')       // collapse newlines
    .replace(/\s+/g, ' ')       // collapse whitespace
    .replace(/[•●▪►]/g, '')     // remove bullet chars
    .trim();
};
```

**Extended Cleaning Strategies:**
- **Normalize Dashes and Quotes**: Replace curly quotes and em/en dashes with ASCII equivalents.
- **Remove Duplicated Headers/Footers**: Heuristics per page (optional).
- **Preserve Key Tokens**: Emails, URLs, dates; avoid stripping `:` from time or `/` from URLs.
- **Code Fence Removal**: If resumes include Markdown, strip code fences.

```javascript
function cleanResumeText(text) {
  return text
    .replace(/```[a-zA-Z]*|```/g, '')     // remove code fences
    .replace(/[“”]/g, '"')               // normalize quotes
    .replace(/[’]/g, "'")               // normalize apostrophe
    .replace(/[–—]/g, '-')               // normalize dashes
    .replace(/\s+/g, ' ')                // collapse whitespace
    .trim();
}
```

**Preserving Entities:**

```javascript
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL = /(https?:\/\/|www\.)[\w.-]+(?:\/[\w._-]+)*/g;

function extractEntities(text) {
  return {
    emails: text.match(EMAIL) || [],
    urls: text.match(URL) || [],
  };
}
```

**Practice Exercises:**
1. Write a cleaner that removes page numbers like `Page 3 of 10` but keeps dates like `2024-05`.
2. Strip bullet symbols while preserving hyphenated words (e.g., `state-of-the-art`).
3. Normalize `C++` and `C#` tokens without losing `+` and `#`.
4. Remove multiple spaces after punctuation while preserving ellipses (`...`).
5. Implement a function that returns both `cleanText` and a list of `cleaningOperations` applied for auditability.

---

## **Checkpoint: Part 2 Mastery**

Confirm you can:
- Implement robust worker event handling with `'online'`, `'message'`, `'messageerror'`, `'error'`, `'exit'`.
- Explain why `pdf.worker.js` is isolated and what it returns.
- Describe `DOMMatrix` and justify the minimal polyfill used here.
- Use `pdfjsLib` to iterate pages, extract text and links, and tune options.
- Write practical text cleaners and extract entities safely.

---

**Next Topics (Part 3, upcoming):**
- 1.2.9 `Uint8Array(buffer)` — typed arrays and why they matter
- 1.2.10 Full operations on `pdfjsLib` (metadata, outline, attachments)
- 1.2.11 Deep dive into `pdf.getPage(i)`, `page.getTextContent()`, `page.getAnnotations()` and more
- 1.2.12 `parentPort.postMessage({})` and worker ↔ client messaging patterns
- 1.2.13 Functions to structure Gemini communication

---

# Part 3: Typed Arrays, Advanced pdfjsLib, Worker Messaging, Gemini Helpers

## **Module 8: `Uint8Array(buffer)` — Typed Arrays in Practice**

### **1.2.9 What does `new Uint8Array(buffer)` mean and why use it?**

**Conceptual Model:**
- **`Buffer` (Node.js)**: A Node-specific binary container backed by an `ArrayBuffer`. Optimized for I/O (sockets, files).
- **`ArrayBuffer`**: Raw, fixed-length memory block.
- **Typed Arrays** (e.g., `Uint8Array`): Views over an `ArrayBuffer` providing typed access to elements.

**Why `pdfjsLib` expects `Uint8Array`:** Many browser-side libraries—including `pdf.js`—standardize on typed arrays to accept raw bytes. Converting the Node `Buffer` to a `Uint8Array` provides a compatible, byte-addressable view.

```javascript
// In the worker: convert a Node Buffer into a typed array
const buffer = workerData;            // Node Buffer
const data = new Uint8Array(buffer);  // Typed view for pdfjsLib
```

**Memory Behavior:**
- `Buffer` and `Uint8Array` can share the same underlying memory in modern Node; however, construction may involve validation overhead.
- For large payloads across threads, prefer **transfer lists** to avoid copies:

```javascript
// Main thread (advanced): transfer ArrayBuffer to worker without copying
const ab = req.file.buffer.buffer; // Buffer's underlying ArrayBuffer
const worker = new Worker(workerPath, { workerData: ab, transferList: [ab] });

// Worker: recreate typed view
const data = new Uint8Array(workerData);
```

**When to use typed arrays vs Buffer:**
- Use **`Buffer`** for Node I/O APIs.
- Use **`Uint8Array`** when interoperating with libraries expecting Web-compatible byte arrays.

---

## **Module 9: Advanced Operations in `pdfjsLib`**

### **1.2.10 Catalog of Useful Operations**

Beyond text and annotations, `pdfjsLib` exposes metadata, table of contents (outline), attachments, and destinations.

**Document-Level (`PDFDocumentProxy`)**
- `numPages`: total page count.
- `getMetadata()`: returns `{ info, metadata }` with PDF Info dictionary.
- `getOutline()`: returns hierarchical bookmarks (may be `null`).
- `getAttachments()`: returns embedded files (object keyed by filename).
- `getPageLabels()`: per-page labels (roman numerals, custom labels).
- `getDestination(name)`: resolve named destinations used by bookmarks.

**Example:**

```javascript
const pdf = await pdfjsLib.getDocument({ data }).promise;
const { info, metadata } = await pdf.getMetadata();
const outline = await pdf.getOutline();
const attachments = await pdf.getAttachments();
const labels = await pdf.getPageLabels();

// Shape examples
// info: { Title, Author, Creator, Producer, CreationDate, ModDate }
// metadata: XMP packet (if present), often contains Dublin Core fields
// outline: [{ title, dest, items: [...] }, ...]
// attachments: { 'file.csv': { content: Uint8Array, filename: 'file.csv' } }
```

**Page-Level (`PDFPageProxy`)**
- `getTextContent(params?)`: text items; `params` can include `normalizeWhitespace`.
- `getAnnotations(params?)`: annotations; link, widget (form), etc.
- `getViewport({ scale })`: geometric viewport for rendering.
- `render({ canvasContext, viewport })`: rasterize page (browser/Node+canvas).

**Options to tune extraction:**
- `disableFontFace: true` in `getDocument` for Node environments.
- `cMapUrl`, `cMapPacked` when encountering CID fonts.
- `standardFontDataUrl` for rendering text server-side.

---

## **Module 10: Deep Dive — `getPage`, `getTextContent`, `getAnnotations`**

### **1.2.11 Semantics and Structures**

**`pdf.getPage(i)`**
- Returns a `PDFPageProxy` representing page `i` (1-based index).
- Internally loads page dictionaries and content streams lazily.

**`page.getTextContent()`** returns:
```javascript
{
  items: [
    { str: 'Hello', dir: 'ltr', transform: [a,b,c,d,e,f], fontName: 'F1' },
    // ... many items per page
  ],
  styles: { F1: { ascent, descent, vertical, ... } }
}
```
- `items[].str`: the actual text chunk.
- `transform`: 6-number matrix mapping glyph coordinates to page space.
- `dir`: text direction; useful for RTL languages.

**`page.getAnnotations()`** returns annotation objects:
```javascript
[
  { subtype: 'Link', url: 'https://example.com', rect: [x1,y1,x2,y2], ... },
  { subtype: 'Widget', fieldName: 'Email', ... }
]
```
- Filter by `subtype === 'Link'` and presence of `url` for hyperlinks.

**Performance Practices:**
- Concatenate `item.str` rather than per-character operations.
- Avoid rendering unless necessary; text extraction is faster and lighter.
- Keep a single worker per PDF to balance CPU and memory overhead.

---

## **Module 11: Worker ↔ Client Messaging Protocol**

### **1.2.12 `parentPort.postMessage({})` Explained**

**Mechanism:** Worker threads communicate via message passing using a structured clone algorithm. In the worker, `parentPort.postMessage(payload)` sends to the main thread. In the main thread, `worker.on('message', handler)` receives it.

**Worker (see** [backend/ats-service/src/scoring/pdf.worker.js](backend/ats-service/src/scoring/pdf.worker.js) **):**
```javascript
parentPort.postMessage({
  success: true,
  text: cleanText(fullText),
  links: extractedLinks
});
```

**Main Thread (see** [backend/ats-service/src/scoring/workerClient.js](backend/ats-service/src/scoring/workerClient.js) **):**
```javascript
worker.on('message', (result) => {
  if (result.success) {
    resolve({ text: result.text, links: result.links });
  } else {
    reject(new Error(result.error));
  }
});
```

**Design a Robust Message Schema:**
```javascript
// Always include success flag
{ success: boolean, data?: {...}, error?: string, meta?: {...} }

// Example with meta
parentPort.postMessage({
  success: true,
  data: { text, links },
  meta: { pagesProcessed: pdf.numPages, ms: duration }
});
```

**Advanced:**
- Use `transferList` to send `ArrayBuffer` without copying.
- Handle `'messageerror'` when payload cannot be cloned.
- Apply timeouts to avoid indefinitely awaiting a worker.

---

## **Module 12: Gemini Communication Helpers**

### **1.2.13 Functions and Structure for Reliable AI Calls**

In [backend/ats-service/src/controllers/parserController.js](backend/ats-service/src/controllers/parserController.js), Gemini is invoked via `GoogleGenerativeAI` and `generateContent(prompt)`. For reliability and consistency, design a thin client with:

**Goals:**
- Enforce JSON-only outputs (no code fences).
- Attach contextual links found during parsing.
- Provide retry and error normalization.

**Suggested Helper API:**
```javascript
// aiClient.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export function createGemini(modelName, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  return model;
}

export async function generateJson(model, prompt, { maxAttempts = 2 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Remove accidental code fences
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) throw normalizeAiError(err);
    }
  }
}

function normalizeAiError(err) {
  return new Error(`AI parsing failed: ${err?.message || err}`);
}
```

**Prompting Guidelines:**
- Provide strict output schema and explicitly forbid Markdown.
- Include hidden hyperlink context to improve `link` field population.
- Normalize dates, enforce arrays for skills.

**Usage in Controller:**
```javascript
// Inside parseResume
const model = createGemini('gemini-2.0-flash', process.env.GEMINI_API_KEY);
const json = await generateJson(model, prompt);
res.json(json);
```

**Error Handling:**
- Wrap AI call in `try/catch` and return 502/500 appropriately.
- Log sanitized prompts (without PII) for debugging when permissible.

---

## **Checkpoint: Part 3 Mastery**

You should be able to:
- Explain why `Uint8Array` is used with `pdfjsLib` and how to transfer buffers efficiently.
- Retrieve document metadata, outline, attachments, and page labels from `pdfjsLib`.
- Articulate structures returned by `getTextContent()` and `getAnnotations()` and their use.
- Describe `parentPort.postMessage` mechanics and design reliable schemas.
- Implement Gemini helpers that enforce JSON-only outputs and robust retries.

---

# Part 4: Regex Cleaning, Basic ATS Scoring, Full `parserController.js`

## **Module 13: Regex Code-Fence Removal and Trimming**

### **1.2.14 Explain `text = text.replace(/```json|```/g, "").trim();`**

**Purpose:** When LLMs return JSON, they often wrap it in Markdown code fences like:
```
```json
{ "key": "value" }
```
```
This line removes the fences and leading/trailing whitespace before `JSON.parse()`.

**Breakdown:**
- **`/```json|```/g`**: A regular expression with alternation.
  - Matches either the literal substring `"```json"` or the literal substring `"```"`.
  - The `g` (global) flag ensures all occurrences are replaced, not just the first.
- **`.replace(..., "")`**: Replace both patterns with an empty string (delete them).
- **`.trim()`**: Remove leading/trailing whitespace (including newlines) so the remaining content is clean JSON.

**Examples:**
```
Input: "```json\n{\n  \"a\": 1\n}\n```\n"
After replace: "\n{\n  \"a\": 1\n}\n\n"
After trim: "{\n  \"a\": 1\n}"
```

**Edge Cases and Improvements:**
- If a fence is labeled with different languages (e.g., ```js), your regex won’t catch it. A more general pattern:
  - `/```[a-zA-Z]*|```/g` to remove any language tag.
  - Or stricter multi-line anchors: `/^```[a-zA-Z]*\s*$|^```\s*$/gm` to only remove standalone fence lines.
- If fences appear inside strings (rare in valid JSON), removing them may break content. However, LLM outputs typically place fences on separate lines.
- Always wrap `JSON.parse` in `try/catch` to report a helpful error.

**Practice:**
1. Write a function that removes any fenced block, regardless of language tag.
2. Preserve code fences if they’re inside string values (challenge: detect JSON string contexts).
3. Add a validator that confirms the result starts with `{` or `[` before parsing.

---

## **Module 14: Basic ATS Scoring Function Explained**

### **1.3 Deep Dive: `calculateBasicScore(resumeText, jobDescription)`**

From your ATS microservice, the function computes a simple keyword match score.

**Code (for reference):**

```js
export function calculateBasicScore(resumeText, jobDescription) {
  const jdKeywords =
    jobDescription
      .toLowerCase()
      .match(/\b[a-zA-Z]{3,}\b/g)
      ?.filter((w) => !["the", "and", "for", "with"].includes(w)) || [];

  const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/));
  const uniqueJD = new Set(jdKeywords);

  let matchCount = 0;
  uniqueJD.forEach((word) => {
    if (resumeWords.has(word)) matchCount++;
  });

  const score = Math.round((matchCount / uniqueJD.size) * 100);

  return {
    ats_score: isNaN(score) ? 0 : score,
    summary: "Basic keyword analysis (AI Unavailable).",
    strengths: ["Basic keyword matching performed"],
    improvements: ["AI analysis failed. Please retry."],
  };
}
```

**Step-by-Step Explanation:**
- **Normalize JD**: `toLowerCase()` ensures case-insensitive matching.
- **Extract JD tokens**: `.match(/\b[a-zA-Z]{3,}\b/g)` finds alphabetic words of length ≥ 3, excluding 1–2 letter noise.
- **Stopword filter**: Removes common function words that add no ATS value.
- **Normalize Resume**: Lowercase and split by non-word characters: `/\W+/` → produces tokens.
- **Sets**: `Set` removes duplicates for both JD and resume vocabularies.
- **Intersection count**: Iterate JD tokens; if present in resume set, increment.
- **Score**: Percentage of JD tokens found in resume: `matchCount / uniqueJD.size * 100`, rounded.
- **Safeguard**: If JD had no valid tokens (size 0), `score` becomes `NaN`; code returns 0.

**Complexity:**
- Tokenization: O(n + m) (resumeText length n, JD length m)
- Set creation: O(n + m)
- Intersection: O(m)
- Overall: O(n + m), suitable for large texts.

**Limitations and Improvements:**
- No stemming/lemmatization: `develop` ≠ `developer`. Improve via Porter stemmer or `natural` library.
- No synonyms/skills grouping: `JS` vs `JavaScript`. Add normalization maps.
- No weighting: Critical skills should weigh more than soft skills.
- No phrase matching: `machine learning` as a unit. Implement n-grams.
- No recency: Recent experience should weigh higher. Add section-aware scoring.

**Practice:**
1. Add a `weights` map for skills (e.g., `React: 2.0`, `JavaScript: 1.0`).
2. Implement stemming and compare before/after scores.
3. Support phrase matching using bigrams/trigrams.
4. Add a `missingKeywords` array to guide improvements.

---

## **Module 15: `parserController.js` — End-to-End Teaching**

### **1.4 File Overview**

See [backend/ats-service/src/controllers/parserController.js](backend/ats-service/src/controllers/parserController.js).

**Imports and Setup:**
- `parsePdfInWorker` from the scoring module: offloads PDF parsing.
- `GoogleGenerativeAI` client configured with `process.env.GEMINI_API_KEY`.
- Model selection: `gemini-2.0-flash` prioritizes speed/cost; `-pro` for deeper reasoning.

**Controller Flow: `parseResume`**
1. **Validate input**: Ensure either `req.file` (PDF) or `req.body.text` is provided. If neither, respond `400`.
2. **Raw text acquisition**:
   - If `req.file` exists: `parsePdfInWorker(req.file.buffer)` returns `{ text, links }`.
   - Else: use `req.body.text`.
3. **Link context**: If links found in annotations, embed them in the prompt as a dedicated section to improve link extraction in projects/certifications.
4. **Prompt construction**: A strict schema with clear rules:
   - Normalize dates ("Jan 2024").
   - Remove bullet characters.
   - Infer missing fields conservatively.
   - Enforce array types for `skills`.
5. **Model call**: `model.generateContent(prompt)` → `result.response.text()` returns raw text which may include code fences.
6. **Fence removal**: `text = text.replace(/```json|```/g, '').trim();` cleans formatting for `JSON.parse`.
7. **Parsing and response**: `JSON.parse(text)` → respond with `{ success: true, data }`.
8. **Error handling**: Catch and log errors; respond `500` with error details.

**Contracts:**
- **Worker → Controller**: `{ success: true, text, links }` or `{ success: false, error }` via `message`.
- **Controller → Client**: `{ success: true, data }` or HTTP error JSON with `{ error, details }`.

**Reliability Enhancements (Recommended):**
- **Input Limits**: Already enforced by Multer (5MB). Add mimetype checks (`application/pdf`).
- **AI Robustness**:
  - Wrap parse in `try/catch` and validate JSON root (`{` or `[`).
  - Retry `generateContent` once on transient failures.
  - Cap prompt size; truncate excessively long resumes with a note.
- **Security**:
  - Sanitize links and avoid auto-following.
  - Guard against prompt injection by keeping schema strict and using `Return ONLY raw JSON` directive.

**Practice:**
1. Modify the controller to accept text-only resumes and skip the worker path.
2. Add a `POST /parse/debug` route that returns the raw prompt and cleaned AI text for inspection.
3. Implement a middleware that rejects non-PDF uploads by MIME type.

---

## **Final Checkpoint: Part 4 Mastery**

You can now:
- Explain and improve regex-based fence removal safely.
- Analyze and extend the basic ATS scoring function.
- Walk through `parserController.js` from input validation to AI parsing and response.


