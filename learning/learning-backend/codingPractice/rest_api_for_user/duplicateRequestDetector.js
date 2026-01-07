/*
7️⃣ Duplicate Request Detector (Idempotency)
🧠 What the Question Wants

You are given:

requests = ["abc123", "xyz456"]
newRequest = "abc123"


This means:

Your backend has already processed some requests

Each request has a unique ID (usually from client or gateway)

A new request comes in

Your job:

❓ Has this request already been processed before?

If yes → reject or ignore it
If no → process it and record it
*/

/*

in this we will learn about the set in js

# JavaScript Set - Complete Guide

## What is a Set?
A **Set** is a collection of **unique values** (no duplicates). It's similar to an array but automatically removes duplicates.

## Creating a Set

```javascript
// Empty set
const set = new Set();

// From array
const set1 = new Set([1, 2, 3, 4, 4, 5]);  // {1, 2, 3, 4, 5} (duplicate 4 removed)

// From string
const set2 = new Set("hello");  // {'h', 'e', 'l', 'o'}

// From any iterable
const set3 = new Set([..."hello"]);  // {'h', 'e', 'l', 'o'}
```

## Set Methods

### Add & Delete
```javascript
const set = new Set();

// Add values
set.add(1);
set.add(2);
set.add(2);  // Ignored (duplicate)
console.log(set);  // Set {1, 2}

// Chain adds
set.add(3).add(4).add(5);  // {1, 2, 3, 4, 5}

// Delete
set.delete(2);  // returns true (deleted)
set.delete(99); // returns false (not found)

// Clear all
set.clear();
console.log(set);  // Set {}
```

### Check Existence
```javascript
const set = new Set([1, 2, 3]);

set.has(2);    // true
set.has(99);   // false
```

### Size
```javascript
const set = new Set([1, 2, 3, 4]);
set.size;      // 4 (not .length)
```

## Iteration

```javascript
const set = new Set(['a', 'b', 'c']);

// forEach
set.forEach((value) => console.log(value));

// for...of
for (const item of set) {
  console.log(item);
}

// Get values
set.values();  // SetIterator {'a', 'b', 'c'}

// Get keys (same as values for Set)
set.keys();    // SetIterator {'a', 'b', 'c'}

// Get entries [value, value]
set.entries(); // SetIterator {['a','a'], ['b','b'], ['c','c']}
```

## Convert Set ↔ Array

```javascript
// Array → Set (remove duplicates)
const arr = [1, 2, 2, 3, 3, 4];
const set = new Set(arr);  // {1, 2, 3, 4}

// Set → Array
const uniqueArr = [...set];           // [1, 2, 3, 4]
const uniqueArr2 = Array.from(set);   // [1, 2, 3, 4]
```

## Common Use Cases

### Remove Duplicates from Array
```javascript
const arr = [1, 2, 2, 3, 4, 4, 5];
const unique = [...new Set(arr)];
console.log(unique);  // [1, 2, 3, 4, 5]
```

### Unique Characters in String
```javascript
const str = "hello world";
const uniqueChars = [...new Set(str)].join('');
console.log(uniqueChars);  // "helo wrd"
```

### Set Operations

**Union** (all unique items from both)
```javascript
const a = new Set([1, 2, 3]);
const b = new Set([3, 4, 5]);
const union = new Set([...a, ...b]);
console.log(union);  // {1, 2, 3, 4, 5}
```

**Intersection** (common items)
```javascript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);
const intersection = new Set([...a].filter(x => b.has(x)));
console.log(intersection);  // {3, 4}
```

**Difference** (in A but not in B)
```javascript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);
const difference = new Set([...a].filter(x => !b.has(x)));
console.log(difference);  // {1, 2}
```

**Symmetric Difference** (in either, but not both)
```javascript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);
const symDiff = new Set([
  ...[...a].filter(x => !b.has(x)),
  ...[...b].filter(x => !a.has(x))
]);
console.log(symDiff);  // {1, 2, 5, 6}
```

## Set with Objects

```javascript
const set = new Set();

const obj1 = { id: 1 };
const obj2 = { id: 2 };
const obj3 = { id: 1 };  // Same content but different reference

set.add(obj1);
set.add(obj2);
set.add(obj3);  // Will be added (different object reference)

console.log(set.size);  // 3 (all added)

set.has(obj1);  // true
set.has({ id: 1 });  // false (different reference)
```

## Set vs Array

| Feature | Set | Array |
|---------|-----|-------|
| Duplicates | Auto-removed | Allowed |
| Order | Insertion order | Index order |
| Check existence | `set.has(val)` O(1) | `arr.includes(val)` O(n) |
| Size | `set.size` | `arr.length` |
| Add | `set.add(val)` | `arr.push(val)` |
| Remove | `set.delete(val)` | `arr.splice()` |
| Iteration | `for...of`, `forEach` | Same + index access |

## WeakSet (Advanced)

```javascript
// Only holds objects, not primitives
const weakSet = new WeakSet();

let obj = { name: 'John' };
weakSet.add(obj);
weakSet.has(obj);  // true

obj = null;  // Object is garbage collected from WeakSet
```

**Differences:**
- Only stores objects
- No size property
- Not iterable
- Allows garbage collection

## Quick Reference

```javascript
// Create
const set = new Set([1, 2, 3]);

// Add
set.add(4);

// Delete
set.delete(2);

// Check
set.has(3);      // true

// Size
set.size;        // 3

// Clear all
set.clear();

// Iterate
for (const val of set) { }
set.forEach(val => { });

// Convert
[...set]         // to array
Array.from(set)  // to array
```

## Performance
- **Add/Delete/Has:** O(1) average
- **Better than Array** for uniqueness checks and lookups
- Use Set when you need fast lookups and guaranteed uniqueness

*/

const set = new Set(["abc123", "xyz456"]);
// console.log(set);

const Idempotency = (request) => {
    if(set.has(request)){
        return true;
    }
    set.add(request);
    console.log(set);
    return false;
}

const request = "abc1231";
const res = Idempotency(request);
console.log(res);