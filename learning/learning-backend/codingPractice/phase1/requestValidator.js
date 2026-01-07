/*
🟢 TASK 1: REQUEST VALIDATOR ENGINE
🧠 Problem Statement

You are building a backend service.
Before processing any request, you must validate the incoming payload.

Your task is to write a generic request validator engine.

📥 Input
1️⃣ Payload (request body)
{
  name: "Ajeem",
  email: "ajeem@gmail.com",
  age: 21
}

2️⃣ Validation Schema
{
  name: {
    required: true,
    type: "string",
    minLength: 3
  },
  email: {
    required: true,
    type: "string",
    pattern: "email"
  },
  age: {
    required: false,
    type: "number",
    min: 18
  }
}

🎯 Expected Output
✅ If validation passes:
{
  valid: true,
  errors: []
}

❌ If validation fails:
{
  valid: false,
  errors: [
    { field: "email", message: "Invalid email format" },
    { field: "age", message: "Age must be at least 18" }
  ]
}

🧠 What Your Validator MUST Handle
✔ Required field check

Missing required field → error

✔ Type check

string / number / boolean

✔ Length check (strings)

minLength / maxLength

✔ Numeric range

min / max

✔ Pattern check

email format (basic regex is fine)

🚨 Important Rules (READ THIS)

Do NOT throw errors

Collect ALL errors and return them together

Do NOT stop on first error

Order of errors does NOT matter

Return structured errors, not strings

🧪 Edge Cases You MUST Think About

Missing optional field → OK

Extra fields in payload → ignore

null vs undefined

Empty string ""

Wrong type ("21" instead of 21)

🧠 Backend Hint (Very Important)

Think like this:

“For each field in schema, validate payload against rules.”

Not:

“For each key in payload…”

This is exactly how real validators work.

🧩 Function Signature (You MUST follow)
validateRequest(payload, schema)

⛔ What NOT To Do

❌ No libraries
❌ No DB
❌ No Express
❌ No try/catch spam

✅ What I Expect From You

Clean logic

Clear conditions

Good variable names

Comments for clarity

*/


// const schema = {
//   name: {
//     required: true,
//     type: "string",
//     minLength: 3
//   },
//   email: {
//     required: true,
//     type: "string",
//     pattern: "email"
//   },
//   age: {
//     required: false,
//     type: "number",
//     min: 18
//   }
// }

// const validatePayload = (payload) => {
//     const {name, email, age} = payload;
//     const errors = [];
//     if(!name || !email){
//         errors.push({
//             field: "payload",
//             errors: "name and email are required"
//         })
//         // errors.push("name and email are required");
//     }
//     // checking all fields type
//     if(typeof name !== schema.name.type){
//         errors.push({
//             field: "name",
//             erorr: `name should be in ${schema.name.type}`
//         })
//     }
//     if(typeof email !== schema.email.type){
//         errors.push({field: "email",error: `email should be in ${schema.email.type}`});
//     }
//     if(age && typeof age !== schema.age.type){
//         errors.push({field: "age", error: `age should be in ${schema.age.type}`})
//     }
//     if(name.length < schema.name.minLength){
//         errors.push({field:"name", error: `name should be minimum of size ${schema.name.minLength}`});
//     }
//     const isValid = /^\w+@\w+\.\w{2,}/.test(email);
//     if(!isValid){
//         errors.push({field: "email",error: "email should be valid"});
//     }
//     if(age < schema.age.min){
//         errors.push({field: "age", error: `age must be grater than ${schema.age.min}`});
//     }
//     let valid = true;
//     if(errors.length > 0) valid = false;
//     return {
//         valid,
//         errors
//     }
// };

// const payload = {
//   name: "Ajeem",
//   email: "ajeem@gmail.com",
//   age: 21
// }

// const res = validatePayload(payload);
// console.log(res);



const schema = {
  name: {
    required: true,
    type: "string",
    minLength: 3
  },
  email: {
    required: true,
    type: "string",
    pattern: "email"
  },
  age: {
    required: false,
    type: "number",
    min: 18
  }
}

const requestValidator = (payload, schema) => {
    const errors = [];
    for(const field in schema) {
      const rules = schema[field];
      const value = payload[field];

      if(rules.required && (value == undefined || value == null)){
        errors.push({
          field,
          error: `${field} is required`
        });
        continue;
      }

      if(value == undefined || value == null){
        continue;
      }

      if(typeof value !== rules.type){
        errors.push({
          field,
          error: `${field} must be type of ${rules.type}`
        });
        continue;
      }

      if(typeof value === 'string'){
        if(rules.minLength && value.length < rules.minLength){
          errors.push({
            field,
            error: `${field} length must be >= ${rules.minLength}`
          });
        }
        if(rules.maxLength && value.length > rules.maxLength){
          errors.push({
            field,
            error: `${field} length must be <= ${rules.maxLength}`
          });
        }

        const regex = /\w+@\w+\.\w{2,}/
        if(rules.pattern && !regex.test(value)){
          errors.push({
            field,
            error: `${field} must be email`
          });
          continue;
        }

      }
      if(typeof value === 'number'){
        if(rules.min !== undefined && value < rules.min){
          errors.push({
            field,
            error: `${field} must be >= ${rules.min}`
          });
        }

        if(rules.max !== undefined && value > rules.max){
          errors.push({
            field,
            error: `${field} must be <= ${rules.max}`
          });
        }
      }

      if(rules.pattern === 'email'){
         const emailRegex = /^\S+@\S+\.\S+$/;
         const onlyGmail = /^\S+@gmail\.\com$/
        if(!emailRegex.test(value)){
          errors.push({
            field,
            error: `${field} must be email`
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
}

const payload = {
  name: "Ajeem",
  email: "ajeem@gmail.com",
  age: 21
}
const res = requestValidator(payload, schema);
console.log(res);