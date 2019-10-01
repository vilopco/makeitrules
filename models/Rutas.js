const mongoose = require("mongoose");

const RutaSchema = new mongoose.Schema({
  userAgent: { type: String },
  path: { type: String },
  date: { type: Date, default:Date.now() }
});

module.exports = mongoose.model("Rutas", RutaSchema);