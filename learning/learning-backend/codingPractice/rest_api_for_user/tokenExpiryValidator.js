/*
    4️⃣ Token Expiry Validator

        Task 4: isTokenValid()

        Input

        tokenIssuedAt = 1700000000
        expiresIn = 3600
        currentTime = 1700003500


        Output

        true


        📌 Concepts:

        auth logic

        time calculation


*/

const tokenIssuedAt = 1700000000;
const expiresIn = 3600;

const isTokenValid = (currentTime) => {
    const expiryTime = tokenIssuedAt+expiresIn;
    return currentTime < expiryTime;
}

const currentTime = 1700003500;
const res = isTokenValid(currentTime);
console.log(res);

