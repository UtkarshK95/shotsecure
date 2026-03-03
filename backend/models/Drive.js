const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema(
  {
    date:        { type: Date,   required: true },
    vaccineName: { type: String, required: true, trim: true },
    location:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Drive', driveSchema);
