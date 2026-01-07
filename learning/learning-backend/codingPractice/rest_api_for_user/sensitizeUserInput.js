/*
1️⃣ Request Data Sanitization
Task 1: sanitizeUserInput()

Input

{
  name: "  Mohd   Ajeem ",
  email: " AJEEM@GMAIL.COM ",
  phone: " +91-987 654 3210 "
}


Output

{
  name: "Mohd Ajeem",
  email: "ajeem@gmail.com",
  phone: "919876543210"
}


📌 Concepts:

string cleanup

regex

backend validation logic

*/

const sensitizeUserInput = (data) => {
    const {name, email, phone} = data;
    const sensitizeName = name.split(" ").filter(n => n != "").join(" ");

    const sensitizeEmail = email.trim().toLowerCase();
    const sensitizePhone = phone.trim().split("").filter(n => !isNaN(parseInt(n))).join("");
    const byUsingRegex = phone.trim().split("").filter(n => /^\d+$/.test(n)).join("");
    console.log(byUsingRegex);
    const sensitizeData = {
        sensitizeName,
        sensitizeEmail,
        sensitizePhone
    }
    return sensitizeData;
}

const input = {
    name: "  Mohd   Ajeem ",
  email: " AJEEM@GMAIL.COM ",
  phone: " +91-987 654 3210 "
}

const sensitizeData = sensitizeUserInput(input);
console.log("senstitize data: ", sensitizeData);