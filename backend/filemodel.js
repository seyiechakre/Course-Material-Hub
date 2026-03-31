const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    title:        { type: String, required: true },
    subject:      { type: String, required: true },
    filename:     { type: String, required: true }, // actual file on disk
    uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true }); // adds createdAt + updatedAt automatically

module.exports = mongoose.model("File", fileSchema);