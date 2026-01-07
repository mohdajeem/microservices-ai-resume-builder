/*
        2️⃣ Role-Based Access Check
        Task 2: hasPermission()

        Input

        role = "editor"
        action = "delete"


        Permissions:

        {
        admin: ["create", "edit", "delete"],
        editor: ["create", "edit"],
        viewer: ["read"]
        }


        Output

        false


        📌 Concepts:

        authorization logic

        arrays & objects

        backend security thinking
*/

const permissions = {
    admin: ["create", "edit", "delete"],
    editor: ["create", "edit"],
    viewer: ["read"]
};

const hasPermission = (req) => {
    const {role, action} = req;
    // console.log("role: ", role);
    // console.log("action: ", action);
    const hasPermissionToUser = permissions[role].filter((a) => a === action).length > 0;
    // console.log("hasPerminssion: ", hasPermission);
    // console.log(permissions[role]);
    return hasPermissionToUser;
}

const req = {
    role: "viewer",
    action: "delete"
}
const res = hasPermission(req);
console.log("req: ", req);
console.log("has permission: ", res);