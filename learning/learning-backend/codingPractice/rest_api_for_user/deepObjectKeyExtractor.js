/*
        5️⃣ Deep Object Key Extractor
                Task 5: extractKeys()

                Input

                {
                user: {
                    id: 1,
                    profile: {
                    name: "Ajeem",
                    skills: ["JS", "Node"]
                    }
                }
                }


                Output

                ["user.id", "user.profile.name", "user.profile.skills"]


                📌 Concepts:

                recursion

                nested data (very backend heavy)
*/

const Input = {
                user: {
                    id: 1,
                    profile: {
                    name: "Ajeem",
                    skills: ["JS", "Node"]
                    }
                }
            }

// const extractKeys = (input) => {
//     let storeExtractedKeys = [];
//     let keysIterator = [];
//     extractKeysRecurs(input, storeExtractedKeys, keysIterator);
//     return storeExtractedKeys;
// }
// const extractKeysRecurs = (input, storeExtractedKeys, keysIterator) => {
//     if(input.constructor.name != "Object"){
//         const res = keysIterator.join(".");
//         // console.log("res: ", res);
//         storeExtractedKeys.push(res);
//         return;
//     }

//     // if((typeof input) !== "object"){ 
//     //     // console.log("input: ", input);
//     //     // console.log("type: ", typeof input);
//     //     return;
//     // }
//     // const type  = typeof input;
//     // console.log("type: ", type);
//     for(const i in input){
//         // console.log(i);
//         keysIterator.push(i);
//         // console.log(i instanceof Object);
//         extractKeysRecurs(input[i], storeExtractedKeys, keysIterator);
//         keysIterator.pop();
//     }
// }
// const res = extractKeys(Input);
// console.log(res);

// production ready code 

const keysIterator = (obj) => {
    const result = [];

    const dfs = (value, path) => {
        if((value === null) || (typeof value !== 'object') || (Array.isArray(value))){
            result.push(path.join("."));
            return;
        }

        for (const key in value){
            dfs(value[key], [...path, key]);
        }
    }
    dfs(obj, []);
    return result;
}

const res = keysIterator(Input);
console.log("res: ", res);