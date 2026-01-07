/*
8️⃣ Payload Size Checker
🧠 What the Question Wants

You are given a request payload:

payload = { data: "..." }


Your backend must check:

❓ Is this request body too large?

Rule:

Max payload = 1MB

🔐 Why This Exists (Security)

This protects against:

DDOS attacks

Memory exhaustion

Server crashes

Abuse via large payloads

🧠 Backend Thinking Flow

Calculate actual size of request

Compare with allowed limit

If size > limit → reject request

Else → process request

📌 Why Output Is true / false

true → safe to process

false → reject with 413 Payload Too Large

🌍 Real-World Usage

File upload APIs

Form submissions

JSON APIs

Webhooks
*/


// const MaxPayload = 1024*1024 // in bytes

// // for now only for text, strin

// const payloadChecker = (payload) => {
//     const stringyfy = JSON.stringify(payload);
//     console.log("Stringyfy: ", stringyfy);
//     const size = JSON.stringify(payload).length;
//     console.log(size);
//     if(size > MaxPayload){
//         return "403, file is too large";
//     }
//     return "Accecpted";
// }
// const p1 = {
//   data: "A".repeat(1_200_000)
// };
// const p2 = {
//   name: "Ajeem",
//   bio: "I am learning backend development...",
//   skills: ["JS", "Node", "MongoDB"]
// }

// const res = payloadChecker(p2);
// console.log("p2 with response: ", res);

// production ready code, both are similar

const MaxPayload = 1024*1024 // in bytes

const payloadChecker = (payload) => {
    const stringifyPayload = JSON.stringify(payload);

    const bytSize = Buffer.byteLength(stringifyPayload, "utf-8");

    return bytSize <= MaxPayload;
}


const p1 = {
  data: "A".repeat(1_200_000)
};
const p2 = {
  name: "Ajeem",
  bio: "I am learning backend development...",
  skills: ["JS", "Node", "MongoDB"]
}

const res = payloadChecker(p2);
console.log("p2 with response: ", res);

