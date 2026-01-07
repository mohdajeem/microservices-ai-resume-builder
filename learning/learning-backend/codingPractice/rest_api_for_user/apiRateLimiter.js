/*
        3️⃣ API Rate Limiter (Logic Only)
        Task 3: isRequestAllowed()

        Rules

        Max 5 requests per user

        Time window = 60 seconds

        Input

        timestamps = [10, 20, 30, 40, 50]
        currentTime = 65

        Output
        true
        📌 Concepts:
        sliding window
        backend performance protection

*/

const timestamps = [10, 20, 30, 40, 50];
const maxAllowedRequest = 5;
const maxWindow = 60

// current time = 65
// time period is 60 sec
// if  currentTime - arr[i] >= 60 => remove arr[i], goes to the end then if arr.size < max, then add and return true else return false;
const isRequestAllowed = (currentTime) => {
    while(timestamps.length > 0 && currentTime - timestamps[0] >= maxWindow){
        timestamps.shift();
    }
    if(timestamps.length < maxAllowedRequest){
        timestamps.push(currentTime);
        return true;
    }
    return false;
}

const currentTime = 70;
const resp = isRequestAllowed(currentTime);
console.log("res: ", resp);