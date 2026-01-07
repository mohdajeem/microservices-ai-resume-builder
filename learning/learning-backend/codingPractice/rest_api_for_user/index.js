
const req = {
    body: {
        name: "Ajeem",
        email: "ajeem@gmail.com",
        password: "ajeem@123"
    },
    headers: {
        "authorization": "bearer Ajeem"
    }
};

const data = [
    {
        name: "test 1",
        email: "test1@gmail.com",
        password: "test1@123"
    },
    {
        name: "test 2",
        email: "test2@gmail.com",
        password: "test2@321"
    }
]

const createUser = (req, res) => {
    const {name, email, password} = req.body;
    try{
        if(!name || !email || !password) {
            // return res.status(400).json({message: "All fields are required"});
            return "All fields are required";
        }
        // const user = data.filter((e) => e.email == email);
        const user = data.find((e)=> e.email == email);
        if(user){
            console.log("user exist: ", user);
            // return res.status(400).json({message: "user already exists"});
            return "user already exists";
        }
        const newUser = {
            name,
            email,
            password
        };
        data.push(newUser);
        const newData = data.map(({password, ...user}) => user);
        console.log("data: ", data);
        // return res.json({
        //     status: "success",
        //     message: "user created successfully",
        //     data: data
        // })
        return newData;
    } catch(error){
        console.log("error: ", error);
        // res.status(500).json({message: error.message});
    }
}

// i will write a middleware who checks the token that i will pass, and then forward or return the request
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    const token = authHeader.split(" ")[1];
    if(token != "Ajeem"){
        return "Invalid Token";
    }
    // next();
    console.log("going Next using next() function");
}


let res = authMiddleware(req)
if(res != "Invalid Token"){
    res = createUser(req);
}
console.log("res: ", res);
