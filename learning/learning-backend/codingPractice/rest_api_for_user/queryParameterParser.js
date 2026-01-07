/*
        6️⃣ Query Parameter Parser
            Task 6: parseQuery()

            Input

            "?page=2&limit=10&sort=desc"


            Output

            {
            page: 2,
            limit: 10,
            sort: "desc"
            }


            📌 Concepts:

            request parsing

            API design
*/

/*
const parseQuery = (query) => {
    const result = {};
    const parsingArea = query.split("?")[1].split("&").map((q)=>{
        const newQ = q.split("=");
        const key = newQ[0];
        const val = newQ[1];
        result[key] = val;
    });
    console.log("parsing area: ",result);
}

const query = "?page=2&limit=10&sort=desc";
parseQuery(query);

*/

// production ready code

const parseQuery = (query) => {
    const result = {};
    if(!query || query === "?") return result;
    
    const params = query.replace("?", "").split("&");
    for(const param of params){
        if(!param) continue;
        let [key, value] = param.split("=");
        value = decodeURIComponent(value);
        if(!isNaN(value)){
            value = Number(value);
        }
        result[key] = value;
    }
    return result;
}

const query = "?page=2&limit=10&sort=desc";
const res = parseQuery(query);
console.log("res: ", res);