// ================= IMPORTS =================

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const User = require("./usermodel.js");
const Download = require("./downloadmodel.js");
const File = require("./filemodel.js");

const app = express();

// ================= UPLOAD DIR =================
// FIX: Ensure upload directory exists before multer tries to use it
const UPLOAD_DIR = path.join(__dirname, "upload");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ================= MIDDLEWARE =================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ================= DATABASE =================

mongoose.connect("mongodb://127.0.0.1:27017/coursehub")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


// ================= SESSIONS =================

app.use(session({
    secret: process.env.SESSION_SECRET || "secretkey", // FIX: support env var
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: "mongodb://127.0.0.1:27017/coursehub"
    })
}));


// ================= MULTER =================

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function(req, file, cb) {
        // Save file using lecture title + original extension
        const ext = path.extname(file.originalname);
        const title = (req.body.title || "untitled").replace(/[^a-zA-Z0-9._\-\s]/g, "_").trim();
        const safeName = title + ext;
        cb(null, safeName);
    }
});

// FIX: add file size limit (10MB)
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});


// ================= AUTH MIDDLEWARE =================
// FIX: reusable auth check instead of repeating inline
function requireAuth(req, res, next) {
    if (!req.session.user) {
        if (req.accepts("html")) return res.redirect("/login.html");
        return res.status(401).json({ error: "Login required" });
    }
    next();
}


// ================= REGISTER =================

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // FIX: basic validation
        if (!username || !email || !password) {
            return res.status(400).send("All fields are required");
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) return res.status(400).send("Username or email already taken");

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.redirect("/login.html");
    } catch(err) {
        console.log(err);
        res.status(500).send("Registration error");
    }
});


// ================= LOGIN =================

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // FIX: consistent error message (don't reveal whether user exists)
        const user = await User.findOne({ username });
        if (!user) return res.status(401).send("Invalid username or password");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).send("Invalid username or password");

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        res.redirect("/dashboard");
    } catch(err) {
        console.log(err);
        res.status(500).send("Login error");
    }
});


// ================= DASHBOARD =================

app.get("/dashboard", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/myprofile.html"));
});


// ================= USER INFO =================

app.get("/user", requireAuth, (req, res) => {
    res.json({
        username: req.session.user.username,
        email: req.session.user.email
    });
});


// ================= UPLOAD =================

app.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
        const fileDoc = new File({
            title:      req.body.title,
            subject:    req.body.subject,
            filename:   req.file.filename,
            uploadedBy: req.session.user.id
        });
        await fileDoc.save();
        res.send("File uploaded successfully");
    } catch(err) {
        console.log(err);
        res.status(500).send("Upload error");
    }
});


// ================= SEARCH =================

app.get("/search-files", async (req, res) => {
    const query = (req.query.q || "").trim();
    const type  = req.query.type || "title"; // "title" or "subject"

    try {
        const filter = query
            ? { [type]: { $regex: query, $options: "i" } }
            : {};

        const files = await File.find(filter).sort({ createdAt: -1 });
        res.json(files); // returns full objects: { title, subject, filename, ... }
    } catch(err) {
        console.log(err);
        res.status(500).send("Search error");
    }
});


// ================= DOWNLOAD =================

app.get("/download/:filename", requireAuth, async (req, res) => {
    // FIX: sanitize filename to prevent path traversal attacks
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, filename); // FIX: use absolute path

    // FIX: check file exists before attempting download
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found");
    }

    try {
        const download = new Download({
            userId: req.session.user.id,
            filename: filename
        });
        await download.save();

        res.download(filePath);
    } catch(err) {
        console.log(err);
        res.status(500).send("Download error");
    }
});


// ================= MY FILES =================

app.get("/my-files", requireAuth, async (req, res) => {
    try {
        const downloads = await Download.find({ userId: req.session.user.id })
            .sort({ date: -1 }); // matches downloadmodel's date field

        // Enrich with metadata from File collection
        const enriched = await Promise.all(downloads.map(async d => {
            const meta = await File.findOne({ filename: d.filename });
            return {
                filename: d.filename,
                title:    meta?.title   || d.filename,
                subject:  meta?.subject || "—"
            };
        }));

        res.json(enriched);
    } catch(err) {
        console.log(err);
        res.status(500).send("Error fetching files");
    }
});


// ================= LOGOUT =================

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});


// ================= STATIC FILES =================

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/files", express.static(UPLOAD_DIR)); // FIX: use absolute path


// ================= START SERVER =================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});