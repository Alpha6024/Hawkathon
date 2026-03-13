const mongoose = require("mongoose");

const Userschema = new mongoose.Schema({});
const usermodel = mongoose.model("user", Userschema);

const PatientSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    phone:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },
    age:        { type: Number },
    village:    { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
  },
  { timestamps: true }
);
const Patientmodel = mongoose.model("Patient", PatientSchema);

const DoctorSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true, trim: true },
    phone:              { type: String, required: true, unique: true },
    password:           { type: String, required: true },
    specialty:          { type: String, required: true },
    experience:         { type: String, required: true },
    languages:          [{ type: String }],
    available:          { type: Boolean, default: true },
    avatar:             { type: String, default: "" },
    color:              { type: String, default: "#10b981" },
    rating:             { type: Number, default: 4.5 },
    totalConsultations: { type: Number, default: 0 },
    fee:                { type: Number, required: true },
    nextSlot:           { type: String, default: "" },
    licenseNumber:      { type: String, default: "" },
  },
  { timestamps: true }
);
const Doctormodel = mongoose.model("Doctor", DoctorSchema);

const AppointmentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      default: () => "HWK" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
    patientId:      { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    patientName:    { type: String, required: true, trim: true },
    patientAge:     { type: Number, required: true },
    patientPhone:   { type: String, required: true },
    patientVillage: { type: String, required: true },
    symptoms:       { type: String, default: "" },
    doctor:         { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date:           { type: String, required: true },
    timeSlot:       { type: String, required: true },
    callType:       { type: String, enum: ["video", "audio"], default: "video" },
    status:         { type: String, enum: ["confirmed", "completed", "cancelled"], default: "confirmed" },
    callLink:       { type: String, default: "" },
    callStarted:    { type: Boolean, default: false },
    callStartedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);
AppointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, { unique: true });
const Appointmentmodel = mongoose.model("Appointment", AppointmentSchema);

const HealthRecordSchema = new mongoose.Schema(
  {
    patientPhone:   { type: String, required: true },
    patientName:    { type: String, required: true },
    patientAge:     { type: Number },
    patientVillage: { type: String },
    appointment:    { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    bookingId:      { type: String },
    doctor:         { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    date:           { type: String },
    symptoms:       { type: String, default: "" },
    diagnosis:      { type: String, default: "" },
    prescription:   { type: String, default: "" },
    notes:          { type: String, default: "" },
    followUpDate:   { type: String, default: "" },
  },
  { timestamps: true }
);
const HealthRecordModel = mongoose.model("HealthRecord", HealthRecordSchema);

module.exports = { usermodel, Patientmodel, Doctormodel, Appointmentmodel, HealthRecordModel };