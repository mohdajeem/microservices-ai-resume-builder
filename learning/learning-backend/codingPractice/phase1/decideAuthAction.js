/*

🟢 TASK 3: TOKEN REFRESH ENGINE
🧠 Problem Statement

Your backend uses two tokens:

Access Token → short-lived (used on every request)

Refresh Token → long-lived (used to get a new access token)

Your task is to decide:

❓ Should the backend issue a NEW access token or reject the request?

📥 Inputs
1️⃣ Token metadata
accessTokenIssuedAt = 1700000000
accessTokenTTL      = 300        // 5 minutes

refreshTokenIssuedAt = 1699990000
refreshTokenTTL      = 86400      // 1 day

currentTime          = 1700000400

🧠 Rules (VERY IMPORTANT)
✅ Rule 1: Access token still valid

If:

currentTime < accessTokenIssuedAt + accessTokenTTL


→ Access token is valid
→ No refresh needed

🔄 Rule 2: Access token expired BUT refresh token valid

If:

currentTime ≥ accessTokenIssuedAt + accessTokenTTL
AND
currentTime < refreshTokenIssuedAt + refreshTokenTTL


→ Issue NEW access token

❌ Rule 3: Both tokens expired

If:

currentTime ≥ refreshTokenIssuedAt + refreshTokenTTL


→ Reject request
→ User must login again

🎯 Expected Output

Your function should return ONE of these strings:

"ACCESS_VALID"
"REFRESH_ACCESS_TOKEN"
"RELOGIN_REQUIRED"

🧪 Edge Cases You MUST Think About

Missing token times

Clock boundary conditions

Exactly equal expiry times

Negative or zero TTL

Refresh token reused too late

🧩 Function Signature (You MUST follow)
decideAuthAction({
  accessTokenIssuedAt,
  accessTokenTTL,
  refreshTokenIssuedAt,
  refreshTokenTTL,
  currentTime
})

🚨 Important Rules

❌ No JWT libraries

❌ No DB

❌ No try/catch spam

✅ Pure conditional logic

✅ Clear readable conditions

🧠 Backend Hint (CRITICAL)

Think in this order:

1️⃣ Is access token valid?
2️⃣ If not → is refresh token valid?
3️⃣ If not → reject

Never reverse this order.

🧠 Why This Task Is GOLD

This logic is used in:

Auth middleware

Mobile apps

Refresh token endpoints

Secure APIs

Zero-trust systems

*/



const decideAuthAction = ({
    accessTokenIssuedAt, accessTokenTTL, refreshTokenIssuedAt,
    refreshTokenTTL, currentTime}) => {
        
        if(accessTokenIssuedAt + accessTokenTTL > currentTime){
            return "ACCESS_VALID";
        }
        
        if(refreshTokenIssuedAt + refreshTokenTTL > currentTime){
            return "REFRESH_ACCESS_TOKEN";
        }
        return "RELOGIN_REQUIRED";
}

const accessTokenIssuedAt = 1700000000
const accessTokenTTL      = 300        // 5 minutes

const refreshTokenIssuedAt = 1699990000
const refreshTokenTTL      = 86400      // 1 day

const currentTime          = 1700000400


const res = decideAuthAction({accessTokenIssuedAt, accessTokenTTL, refreshTokenIssuedAt, refreshTokenTTL, currentTime});
console.log(res);