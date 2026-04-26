# Module 4: The Micro-Engineers (AI & PDF Services)

In this module, we explore the "heavy lifters" of your architecture: The **AI-Service** (LLM communication) and the **LaTeX-Compiler** (System-level PDF generation).

---

## 1. Fundamental Mechanics: LLM Tokenization and System Calls

These services deal with external APIs and OS-level binaries, moving away from simple CRUD logic.

### AI Tokenization Logic:
When you send a prompt to Gemini or OpenAI, you aren't charged by "word," but by **Token**.
-   **What is a Token?** A token is a numerical representation of a character sequence. Common words like "the" are 1 token; complex words like "tokenization" might be 2-3.
-   **Math of Prediction:** LLMs calculate the probability distribution of the *next* token:
    $$P(w_n | w_1, ..., w_{n-1})$$
    The model doesn't "know" facts; it predicts the most likely next piece of text based on the vector space.

### System Calls & IPC (Inter-Process Communication):
Your `latex-compiler` uses `child_process.exec()` to run `tectonic`.
1.  **Forking:** Node.js creates a new process (the child).
2.  **Execution:** The OS replaces the child process's memory with the `tectonic` binary.
3.  **Piping:** `stdout` and `stderr` from the child are piped back into the Node.js event loop.
4.  **Completion:** The child process exits, and Node.js receives an "exit code" (0 for success).

---

## 2. API & Function Deep-Dive: `fs.mkdtempSync` and `crypto`

In [compileLatex.js](../../backend/latex-compiler/src/compileLatex.js):

### `fs.mkdtempSync(path.join(os.tmpdir(), "latex-"))`
-   **Under the hood:** This creates a unique directory in the operating system's temporary storage (e.g., `/tmp/latex-XXXXX`).
-   **Why?** If two users generate a resume at the *exact same millisecond*, using a static `temp/` folder would cause them to overwrite each other's `.tex` files.
-   **Security:** Using `os.tmpdir()` keeps these files out of the main application directory, reducing the risk of accidentally serving raw source files.

### `crypto.createHash('sha256')`
-   **The Hash Function:** SHA-256 is a "One-Way" function. It takes any input (your resume LaTeX) and produces a 64-character hex string.
-   **Cache Logic:** You use this hash as the filename. If a user clicks "Download" twice without changing their data, the hash remains identical, allowing you to bypass the expensive $O(\text{Heavy})$ LaTeX compilation and serve the file from the `renders/` cache in $O(1)$.

---

## 3. Tool Internals: Tectonic & PDF Assembly

**Tectonic** is a modernized LaTeX engine built in Rust.
-   **Why it's faster:** It doesn't require a full TeX Live installation (Grams vs. Gigabytes).
-   **Download-on-demand:** If a package like `fontawesome5` is missing, Tectonic fetches it via HTTP automatically, caches it, and continues.
-   **Linear Compilation:** Unlike traditional `pdflatex` which often requires 2-3 passes to resolve references (Page 1 of X), Tectonic attempts to optimize this workflow.

---

## 4. Edge Case Analysis: "The Resource Exhaustion"

1.  **The "Zip Bomb" of LaTeX:** A malicious user could inject a LaTeX command like `\include{/etc/passwd}` or an infinite loop `\def\x{\x}\x`. 
    -   *Result:* The `tectonic` process will hang, max out the CPU at 100%, and potentially crash the entire microservice.
2.  **Async/Sync Blocking:** You use `fs.mkdtempSync` (Synchronous). 
    -   *Impact:* While `fs.mkdtempSync` is running, the Node.js Event Loop is **completely frozen**. It cannot handle other requests. 
    -   *Fix:* Use the `fs.promises.mkdtemp` (Asynchronous) version to keep the service responsive.
3.  **Disk Space Bloat:** Every time the cache "misses," a new PDF is saved to `renders/`. Without a "cleanup" task (Cron Job), your server will eventually run out of disk space (ENOSPC).

---

## 5. Hands-on Drill: "The Async Refactor"

In [compileLatex.js](../../backend/latex-compiler/src/compileLatex.js), you are currently using several **Sync** methods (`fs.existsSync`, `fs.mkdirSync`, `fs.mkdtempSync`, `fs.writeFileSync`).

**Task:**
1.  Convert the `compileLatexToPdf` function to use strictly **Asynchronous** `fs.promises` (or `fs/promises` in modern Node).
2.  **Why?** Observe the difference in service responsiveness by simulating 10 concurrent requests using a tool like `ab` (Apache Benchmark) or a simple script.

---

## 6. The Interrogator’s List (Interview Prep)

1.  Explain why we use `child_process.exec` vs. `child_process.spawn`. Which is safer for large outputs?
2.  What is **Prompt Injection**, and how do you prevent it in the `ai-service`?
3.  What are **Embeddings** in the context of LLMs, and how do they differ from simple text prompts?
4.  How would you implement a "Timeout" for your LaTeX compilation so a single request doesn't hang the CPU forever?
5.  Explain the difference between **Deterministic** and **Non-Deterministic** AI responses (The `temperature` parameter).
6.  How does `os.tmpdir()` behave differently on Linux vs. Windows?
7.  What is a **Zombie Process**, and how can it happen in your `latex-compiler`?
8.  Why is `SHA-256` better for file hashing than `MD5`?
9.  Describe a strategy to limit the **Max Character Count** for LaTeX input to prevent resource attacks.
10. How would you "Stream" a PDF back to the user instead of reading the whole buffer into memory at once?

---

**Next Step:** Once you have completed the async refactor and reviewed the resource isolation mechanics, say **"Proceed"** to move to **Module 5: Frontend Architecture (React & Vite)**.
