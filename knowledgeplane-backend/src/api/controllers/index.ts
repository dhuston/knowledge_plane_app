class IndexController {
    async getUsers(req, res) {
        // Logic to retrieve users from the database
        res.send("List of users");
    }

    async createUser(req, res) {
        // Logic to create a new user in the database
        res.send("User created");
    }
}

export default IndexController;