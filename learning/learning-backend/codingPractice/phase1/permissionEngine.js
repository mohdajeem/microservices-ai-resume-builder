/*
🟢 TASK 2: PERMISSION ENGINE
🧠 Problem Statement

You are building a backend system where users have roles, and roles control what actions are allowed.

Your task is to build a permission engine that answers one question:

❓ Is this user allowed to perform this action?

📥 Input
1️⃣ Role of the user
role = "editor"

2️⃣ Action the user wants to perform
action = "delete"

3️⃣ Permission Matrix (Role → Allowed Actions)
{
  admin:  ["create", "read", "update", "delete"],
  editor: ["create", "read", "update"],
  viewer: ["read"]
}

🎯 Expected Output
false


Because:

editor is NOT allowed to delete

🧠 What Your Permission Engine MUST Handle
✔ Role-based access

Each role has a defined set of actions

✔ Default-deny security

If role does not exist → deny

If action not listed → deny

✔ Clean boolean output

true → allow

false → deny

🚨 Important Rules (READ THIS)

❌ Do NOT throw errors

❌ Do NOT return strings

✅ Return boolean only

✅ Unknown role = deny

✅ Unknown action = deny

👉 Backend rule:

If unsure, DENY.
(Security principle)

🧪 Edge Cases You MUST Think About

Role is undefined

Action is undefined

Role exists but has empty permission list

Action casing (Delete vs delete)

Extra permissions accidentally passed

🧠 Backend Hint (VERY IMPORTANT)

Think like this:

“Does this role have this action in its allowed list?”

Not:

“If role equals admin then allow…”

Avoid hardcoding roles.

🧩 Function Signature (You MUST follow)
hasPermission(role, action, permissions)

⛔ What NOT To Do

❌ No if-else chains for roles
❌ No switch-case per role
❌ No libraries
❌ No database

✅ What I Expect From You

Clean logic

Defensive checks

Case handling (optional but good)

Short & readable code

*/

const permissions = {
  admin:  new Set(["create", "read", "update", "delete"]),
  editor: new Set(["create", "read", "update"]),
  viewer: new Set(["read"])
};

const hasPermission = (role, action, permissions) => {
    // console.log(permissions[role]);
    // permission[role] = may be undefined
    if(!role || !action){
        return false;
    }
    role = role.toLowerCase();
    action = action.toLowerCase();
    if(permissions[role] === undefined){
        return false;
    }
    if(permissions[role].has(action)) return true;
    // for(const act of permissions[role]){
    //     // console.log(act);
    //     if(act === action){
    //         return true;
    //     }
    // }
    return false;
}

const role = "EdiTor";
const action = "read";

const checkPermission = hasPermission(role, action, permissions);
console.log(checkPermission);