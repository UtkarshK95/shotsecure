const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  drive:       { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true },
  date:        { type: Date,   required: true },
  vaccineName: { type: String, required: true },
});

const studentSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    class:      { type: String, required: true, trim: true },
    studentId:  { type: String, required: true, unique: true, trim: true },
    vaccinations: [vaccinationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
