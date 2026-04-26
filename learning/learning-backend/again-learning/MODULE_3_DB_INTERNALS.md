# Module 3: Deep Dive into Database Internals & Data Integrity

In this module, we are deconstructing how **MongoDB** handles your data under the hood and why security at the database layer is different from the application layer.

---

## 1. Fundamental Mechanics: BSON and the WiredTiger Engine

MongoDB doesn't store plain JSON. It stores **BSON** (Binary JSON).

### Why BSON?
-   **Scan-ability:** BSON includes the length of fields at the start of the record. To find the next field, the engine "jumps" ahead rather than parsing every character like a string parser would.
-   **Data Types:** BSON supports `Date`, `Long`, and `Binary` (used for images/PDFs), which JSON does not.
-   **Storage Engine (WiredTiger):** This is the default engine in MongoDB. It uses **Document-Level Concurrency**, allowing multiple users to write to different documents in the same collection simultaneously without locking.

### The ObjectId Math:
Every document in your `users` or `masterprofiles` collection has an `_id`. 
$$_id = 4\text{ bytes (Timestamp)} + 5\text{ bytes (Random Value)} + 3\text{ bytes (Counter)}$$
This ensures that IDs are globally unique and monotonically increasing, allowing for naturally ordered inserts.

---

## 2. API & Function Deep-Dive: Indexing and Sanitization

### Indexing (`index: true`)
In [MasterProfile.js](../../backend/resume-generator/src/models/MasterProfile.js), you use `index: true` on `userId`.
-   **Under the hood:** MongoDB creates a **B-Tree** data structure for this field.
-   **Performance:** 
    -   Without index ($O(n)$): MongoDB performs a "Collection Scan" (reading every document).
    -   With index ($O(\log n)$): MongoDB traverses the B-Tree to find the pointer to the document.
-   **Why it matters:** On a collection of 1,000,000 resumes, a scan might take $500ms$, while an index lookup takes $< 1ms$.

### The `mongoSanitize` Middleware
In [security.js](../../backend/auth-service/src/middlewares/security.js), you recursively delete keys starting with `$`.
-   **Why?** In NoSQL, a malicious user could send `{"email": {"$ne": null}, "password": {"$ne": null}}`. 
-   **The Exploit:** If you pass this directly to `findOne()`, MongoDB interprets `$ne` as "Not Equal." Since every user has a non-null email/password, the query returns the *first* user in the database (usually the Admin), logging the attacker in.

---

## 3. Tool Internals: Mongoose Middleware (Hooks)

Mongoose is an **ODM** (Object Document Mapper). It adds a layer of "magic" over the raw MongoDB driver.

### The `save()` lifecycle:
1.  **Validation:** Mongoose checks your Schema types (e.g., `enum: ['pro', 'free']`).
2.  **Pre-save Hooks:** You could use `this.isModified('password')` to hash a password only when it changes.
3.  **BSON Conversion:** Mongoose turns the JS Object into a BSON buffer.
4.  **Network Call:** The buffer is sent over a TCP socket to the MongoDB Server.

---

## 4. Edge Case Analysis: "The Data Disasters"

1.  **Index Overload:** If you index *every* field in your `MasterProfile`, your **Write Performance** will plummet. For every `save()`, MongoDB has to update 10 different B-Trees.
2.  **Buffer Overflows in NoSQL:** While MongoDB is schema-less, large documents (max 16MB) can cause high memory usage. If a user tries to store a 100MB LaTeX string in their profile, Mongoose and MongoDB will struggle to serialize the BSON.
3.  **Atomic Integrity:** In your `ats-service`, if you update a user's `usage.aiGenerations` but then the AI generation fails, the user is charged "usage" for a failed request. MongoDB doesn't "Roll Back" unless you use **Multi-Document Transactions**.

---

## 5. Hands-on Drill: "The Atomic Upsert"

In your `ResumeService`, you likely have logic to update the `MasterProfile`. 

**Task:** 
1.  Verify if you are using `find()` then `save()`.
2.  Refactor that logic to use `findOneAndUpdate()` with the `{ upsert: true, new: true, runValidators: true }` options.
3.  **Explain:** Why is `findOneAndUpdate` more "Atomic" than `find + save` in a system where two Gateway instances might try to update the same profile at once?

---

## 6. The Interrogator’s List (Interview Prep)

1.  Explain the difference between a **Normal Index** and a **Compound Index**.
2.  What is a **TTL Index**, and why would you use it for the `renders/` directory references?
3.  How does MongoDB handle **Structural Schema Changes** compared to a SQL database?
4.  Explain the concept of **"Write Concern"** (`w: 1` vs `w: "majority"`). 
5.  Why does `mongoSanitize` only check for `$` and `.`?
6.  Describe the $O(1)$ lookup benefits of a **Hash Index** vs. the range-query benefits of a **B-Tree Index**.
7.  What is **Internal Fragmentation** in WiredTiger storage?
8.  How would you simulate a "Join" in MongoDB (Explain `$lookup` vs. `populate`)?
9.  Explain the impact of `runValidators: true` on an `update` operation.
10. What is a **Covered Query**, and why is it the "Holy Grail" of DB performance?

---

**Next Step:** Once you have completed the drill and reviewed the BSON math, say **"Proceed"** to move to **Module 4: The Micro-Engineers (AI & PDF Services)**.
