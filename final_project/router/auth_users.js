const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Function to check if a username exists in the database
const isValid = (username) => {
    return users.some(user => user.username === username);
}

// Function to authenticate a user by username and password
const authenticatedUser = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    return user !== undefined; // returns true if user exists, false otherwise
}

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        const token = jwt.sign({ username }, "your-secret-key", { expiresIn: '1h' });
        req.session.token = token; // Store token in session
        return res.status(200).json({ message: "Login successful", token });
    } else {
        return res.status(401).json({ message: "Invalid username or password" });
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.body;
    const token = req.session.token;

    // Check if token exists
    if (!token) {
        return res.status(403).json({ message: "Unauthorized access" });
    }

    // Verify token and extract user information
    jwt.verify(token, "your-secret-key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid Token" });
        }
        
        const username = decoded.username;
        const book = books[isbn];

        if (book) {
            // Add or update the review by the logged-in user
            book.reviews[username] = review;
            return res.status(200).json({ message: "Review added/modified", book });
        } else {
            return res.status(404).json({ message: "Book not found" });
        }
    });
});
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];
    const username = req.user.username; 

    if (book && book.reviews[username]) {
        delete book.reviews[username]; 
        return res.status(200).json({ message: "Review deleted" });
    } else {
        return res.status(404).json({ message: "Review not found or book does not exist" });
    }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
