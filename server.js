const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const dataDirectory = process.env.DATA_DIR || __dirname;
const dataFile = path.join(dataDirectory, "posts.json");

fs.mkdirSync(dataDirectory, { recursive: true });

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

function readPosts() {
    try {
        const data = fs.readFileSync(dataFile, "utf8");
        const posts = JSON.parse(data);
        return Array.isArray(posts) ? posts : [];
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }
}

function savePosts(posts) {
    fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2), "utf8");
}

app.get("/api/posts", (req, res) => {
    try {
        res.json(readPosts());
    } catch (error) {
        console.error("Could not read posts:", error);
        res.status(500).json({ message: "Could not read posts." });
    }
});

app.post("/api/posts", (req, res) => {
    const { title, author, content } = req.body || {};

    if (
        typeof title !== "string" ||
        typeof author !== "string" ||
        typeof content !== "string" ||
        !title.trim() ||
        !author.trim() ||
        !content.trim() ||
        title.trim().length > 100 ||
        author.trim().length > 60 ||
        content.trim().length > 5000
    ) {
        return res.status(400).json({
            message: "Enter a valid title, author, and story."
        });
    }

    try {
        const posts = readPosts();

        const post = {
            id: crypto.randomUUID(),
            title: title.trim(),
            author: author.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("en-IN")
        };

        posts.unshift(post);
        savePosts(posts);

        res.status(201).json(post);
    } catch (error) {
        console.error("Could not publish story:", error);
        res.status(500).json({ message: "Could not publish story." });
    }
});

app.delete("/api/posts/:id", (req, res) => {
    try {
        const posts = readPosts();
        const updatedPosts = posts.filter(post => post.id !== req.params.id);

        if (updatedPosts.length === posts.length) {
            return res.status(404).json({ message: "Story not found." });
        }

        savePosts(updatedPosts);
        res.json({ message: "Story deleted." });
    } catch (error) {
        console.error("Could not delete story:", error);
        res.status(500).json({ message: "Could not delete story." });
    }
});

app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }

    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`InkSpace is running at port ${PORT}`);
});
