const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { Doctormodel, Patientmodel, Appointmentmodel, HealthRecordModel } = require("./db/model");
const { registerDoctorOnChain, getAllDoctorsFromChain, setAvailabilityOnChain } = require("./blockchain/blockchain");

const app = express();
app.use(cors());
app.use(express.json());

// ════════════════════════════════════════════════════════════
//  PATIENT AUTH
// ════════════════════════════════════════════════════════════

// POST /api/patient/signup
app.post("/api/patient/signup", async (req, res) => {
  try {
    const { name, phone, password, age, village, bloodGroup } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ success: false, message: "Name, phone and password are required." });
    if (!phone.match(/^[6-9]\d{9}$/))
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const existing = await Patientmodel.findOne({ phone });
    if (existing)
      return res.status(409).json({ success: false, message: "This phone number is already registered." });

    const hashed = bcrypt.hashSync(password, 10);
    const patient = await Patientmodel.create({ name, phone, password: hashed, age, village, bloodGroup });
    const safe = { _id: patient._id, name: patient.name, phone: patient.phone, age: patient.age, village: patient.village };
    res.status(201).json({ success: true, message: "Account created successfully!", patient: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/patient/login
app.post("/api/patient/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ success: false, message: "Phone and password required." });

    const patient = await Patientmodel.findOne({ phone });
    if (!patient)
      return res.status(401).json({ success: false, message: "No account found with this phone number." });

    const match = bcrypt.compareSync(password, patient.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Incorrect password." });

    const safe = { _id: patient._id, name: patient.name, phone: patient.phone, age: patient.age, village: patient.village };
    res.json({ success: true, message: "Login successful!", patient: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  DOCTOR AUTH
// ════════════════════════════════════════════════════════════

const COLORS = ["#10b981","#3b82f6","#f59e0b","#ec4899","#8b5cf6","#f97316","#06b6d4","#ef4444"];

// POST /api/doctor/signup
app.post("/api/doctor/signup", async (req, res) => {
  try {
    const { name, phone, password, specialty, experience, fee, languages, licenseNumber } = req.body;
    if (!name || !phone || !password || !specialty || !experience || !fee)
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    if (!phone.match(/^[6-9]\d{9}$/))
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
 
    const existing = await Doctormodel.findOne({ phone });
    if (existing)
      return res.status(409).json({ success: false, message: "This phone number is already registered." });
 
    const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const hashedPw = bcrypt.hashSync(password, 10);
 
    const doctor = await Doctormodel.create({
      name, phone, password: hashedPw, specialty, experience,
      fee: Number(fee),
      languages: languages || ["Hindi"],
      licenseNumber: licenseNumber || "",
      avatar: initials,
      color,
      available: true,
    });
 
    // ✅ Auto-store on blockchain
    try {
      const chainResult = await registerDoctorOnChain(doctor.name, doctor.specialty, doctor.experience, doctor.fee);
      console.log(`✅ Doctor "${doctor.name}" stored on blockchain. TxHash: ${chainResult.txHash}`);
    } catch (chainErr) {
      console.log(`⚠️ Blockchain store failed (non-critical): ${chainErr.message}`);
    }
 
    const safe = { _id: doctor._id, name: doctor.name, phone: doctor.phone, specialty: doctor.specialty, avatar: doctor.avatar, color: doctor.color };
    res.status(201).json({ success: true, message: "Doctor account created!", doctor: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// POST /api/doctor/login
app.post("/api/doctor/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ success: false, message: "Phone and password required." });

    const doctor = await Doctormodel.findOne({ phone });
    if (!doctor)
      return res.status(401).json({ success: false, message: "No doctor account found with this phone number." });

    const match = bcrypt.compareSync(password, doctor.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Incorrect password." });

    const safe = { _id: doctor._id, name: doctor.name, phone: doctor.phone, specialty: doctor.specialty, avatar: doctor.avatar, color: doctor.color, fee: doctor.fee, rating: doctor.rating };
    res.json({ success: true, message: "Login successful!", doctor: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  AI SYMPTOM CHECKER — Claude → GPT → Gemini → Groq
// ════════════════════════════════════════════════════════════

const SYMPTOM_PROMPT = (symptoms, age) =>
  `You are a medical AI assistant for a rural telemedicine app in India.
A patient (age: ${age}) reports these symptoms: "${symptoms}"

Respond ONLY in this exact JSON format (no markdown, no code blocks, no extra text):
{
  "possibleConditions": [
    { "name": "Condition Name", "probability": "High/Medium/Low", "description": "1 line description" }
  ],
  "severity": "Low",
  "severityReason": "One sentence why",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "suggestedSpecialty": "General Physician",
  "urgency": "Can wait 2-3 days",
  "disclaimer": "This is AI-generated information. Please consult a doctor for proper diagnosis."
}`;

function parseAIResponse(text) {
  const clean = text.replace(/```json|```/gi, "").trim();
  return JSON.parse(clean);
}

async function tryClaudeAI(symptoms, age) {
  const res = await axios.post(
    "https://api.anthropic.com/v1/messages",
    { model: "claude-haiku-4-5-20251001", max_tokens: 1024, messages: [{ role: "user", content: SYMPTOM_PROMPT(symptoms, age) }] },
    { headers: { "x-api-key": process.env.ClaudeAPI, "anthropic-version": "2023-06-01", "content-type": "application/json" }, timeout: 15000 }
  );
  return parseAIResponse(res.data.content[0].text);
}

async function tryGPT(symptoms, age) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model: "gpt-3.5-turbo", messages: [{ role: "user", content: SYMPTOM_PROMPT(symptoms, age) }], max_tokens: 1024 },
    { headers: { Authorization: `Bearer ${process.env.OpenaiAPI}`, "content-type": "application/json" }, timeout: 15000 }
  );
  return parseAIResponse(res.data.choices[0].message.content);
}

async function tryGemini(symptoms, age) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GeminiAPI}`,
    { contents: [{ parts: [{ text: SYMPTOM_PROMPT(symptoms, age) }] }], generationConfig: { responseMimeType: "application/json" } },
    { headers: { "content-type": "application/json" }, timeout: 15000 }
  );
  return parseAIResponse(res.data.candidates[0].content.parts[0].text);
}

async function tryGrok(symptoms, age) {
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: SYMPTOM_PROMPT(symptoms, age) }], max_tokens: 1024 },
    { headers: { Authorization: `Bearer ${process.env.GrokAPI}`, "content-type": "application/json" }, timeout: 15000 }
  );
  return parseAIResponse(res.data.choices[0].message.content);
}

app.post("/api/symptom-check", async (req, res) => {
  const { symptoms, age } = req.body;
  if (!symptoms || symptoms.trim().length < 3)
    return res.status(400).json({ success: false, message: "Please describe your symptoms." });

  const providers = [
    { name: "Claude", fn: () => tryClaudeAI(symptoms, age || 30) },
    { name: "GPT",    fn: () => tryGPT(symptoms, age || 30) },
    { name: "Gemini", fn: () => tryGemini(symptoms, age || 30) },
    { name: "Groq",   fn: () => tryGrok(symptoms, age || 30) },
  ];

  for (const provider of providers) {
    try {
      console.log(`🤖 Trying ${provider.name}...`);
      const result = await provider.fn();
      console.log(`✅ ${provider.name} succeeded`);
      return res.json({ success: true, result, provider: provider.name });
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      console.log(`❌ ${provider.name} failed:`, detail);
    }
  }
  res.status(500).json({ success: false, message: "All AI providers failed. Please try again." });
});

// ════════════════════════════════════════════════════════════
//  HEALTH RECORDS
// ════════════════════════════════════════════════════════════

app.get("/api/health-records/:phone", async (req, res) => {
  try {
    const records = await HealthRecordModel.find({ patientPhone: req.params.phone })
      .populate("doctor", "name specialty avatar color").sort({ createdAt: -1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post("/api/health-records", async (req, res) => {
  try {
    const record = await HealthRecordModel.create(req.body);
    await record.populate("doctor", "name specialty avatar color");
    res.status(201).json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/health-records/booking/:bookingId", async (req, res) => {
  try {
    const record = await HealthRecordModel.findOne({ bookingId: req.params.bookingId })
      .populate("doctor", "name specialty avatar color");
    res.json({ success: !!record, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch("/api/health-records/:id", async (req, res) => {
  try {
    const { diagnosis, prescription, notes, followUpDate } = req.body;
    const record = await HealthRecordModel.findByIdAndUpdate(
      req.params.id, { diagnosis, prescription, notes, followUpDate }, { new: true }
    ).populate("doctor", "name specialty avatar color");
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
//  DOCTOR ROUTES
// ════════════════════════════════════════════════════════════

app.get("/api/doctors", async (req, res) => {
  try {
    const filter = {};
    if (req.query.specialty && req.query.specialty !== "All") filter.specialty = req.query.specialty;
    if (req.query.available === "true") filter.available = true;
    const doctors = await Doctormodel.find(filter).sort({ available: -1, rating: -1 });
    res.json({ success: true, doctors });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctormodel.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, doctor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/doctors/:id/slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "date is required" });
    const ALL_SLOTS = [
      "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM",
      "2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM",
    ];
    const booked = await Appointmentmodel.find({ doctor: req.params.id, date, status: { $ne: "cancelled" } }).select("timeSlot");
    const bookedSlots = booked.map((a) => a.timeSlot);
    const slots = ALL_SLOTS.map((slot) => ({ time: slot, available: !bookedSlots.includes(slot) }));
    res.json({ success: true, slots });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
//  DOCTOR DASHBOARD
// ════════════════════════════════════════════════════════════

app.get("/api/doctor-dashboard/:doctorId/appointments", async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctor: req.params.doctorId, status: { $ne: "cancelled" } };
    if (date) filter.date = date;
    const appointments = await Appointmentmodel.find(filter).sort({ timeSlot: 1 });
    res.json({ success: true, appointments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post("/api/doctor-dashboard/:bookingId/start-call", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOne({ bookingId: req.params.bookingId });
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    const callLink = `https://meet.jit.si/ruralcare-${req.params.bookingId.toLowerCase()}`;
    const updated = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { callLink, callStarted: true, callStartedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, callLink, appointment: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch("/api/doctor-dashboard/:bookingId/complete", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId }, { status: "completed" }, { new: true }
    ).populate("doctor", "name specialty");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    const existing = await HealthRecordModel.findOne({ bookingId: req.params.bookingId });
    if (!existing) {
      await HealthRecordModel.create({
        patientPhone: appointment.patientPhone, patientName: appointment.patientName,
        patientAge: appointment.patientAge, patientVillage: appointment.patientVillage,
        appointment: appointment._id, bookingId: appointment.bookingId,
        doctor: appointment.doctor._id, date: appointment.date, symptoms: appointment.symptoms,
      });
    }
    res.json({ success: true, appointment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
//  APPOINTMENTS
// ════════════════════════════════════════════════════════════

app.post("/api/appointments", async (req, res) => {
  try {
    const { doctorId, patientName, patientAge, patientPhone, patientVillage, symptoms, date, timeSlot, callType, patientId } = req.body;
    if (!doctorId || !patientName || !patientAge || !patientPhone || !patientVillage || !date || !timeSlot)
      return res.status(400).json({ success: false, message: "All required fields must be provided" });

    const doctor = await Doctormodel.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const existing = await Appointmentmodel.findOne({ doctor: doctorId, date, timeSlot, status: { $ne: "cancelled" } });
    if (existing) return res.status(409).json({ success: false, message: "This slot is already booked. Please choose another." });

    const appointment = await Appointmentmodel.create({
      doctor: doctorId, patientId: patientId || null,
      patientName, patientAge, patientPhone, patientVillage,
      symptoms: symptoms || "", date, timeSlot, callType: callType || "video",
    });
    await Doctormodel.findByIdAndUpdate(doctorId, { $inc: { totalConsultations: 1 } });
    await appointment.populate("doctor", "name specialty fee color avatar");
    res.status(201).json({ success: true, appointment });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Slot just got booked. Please choose another." });
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/appointments/phone/:phone", async (req, res) => {
  try {
    const appointments = await Appointmentmodel.find({ patientPhone: req.params.phone })
      .populate("doctor", "name specialty avatar color").sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/appointments/:bookingId", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOne({ bookingId: req.params.bookingId })
      .populate("doctor", "name specialty fee avatar color rating");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, appointment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch("/api/appointments/:bookingId/cancel", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId }, { status: "cancelled" }, { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, message: "Appointment cancelled", appointment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
//  VIDEO CALL
// ════════════════════════════════════════════════════════════

app.post("/api/appointments/:bookingId/create-room", async (req, res) => {
  try {
    const { callLink } = req.body;
    const appointment = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId }, { callLink }, { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, callLink });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get("/api/appointments/:bookingId/room", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOne({ bookingId: req.params.bookingId })
      .populate("doctor", "name specialty avatar color fee");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, callLink: appointment.callLink || null, callStarted: appointment.callStarted, appointment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════
//  SEED (keep for demo — password: doctor123 for all)
// ════════════════════════════════════════════════════════════
app.post("/api/seed", async (req, res) => {
  try {
    await Doctormodel.deleteMany({});
    // Create via model so bcrypt pre-save hook runs
    const seedData = [
      { name: "Dr. Priya Sharma",  phone: "9000000001", password: "doctor123", specialty: "General Physician", experience: "12 years", languages: ["Hindi","Punjabi","English"], available: true,  avatar: "PS", color: "#10b981", rating: 4.9, totalConsultations: 1240, fee: 200, nextSlot: "10:00 AM" },
      { name: "Dr. Rajveer Singh", phone: "9000000002", password: "doctor123", specialty: "Cardiologist",      experience: "18 years", languages: ["Hindi","Punjabi"],           available: true,  avatar: "RS", color: "#3b82f6", rating: 4.8, totalConsultations: 2180, fee: 400, nextSlot: "11:30 AM" },
      { name: "Dr. Meena Patel",   phone: "9000000003", password: "doctor123", specialty: "Pediatrician",      experience: "9 years",  languages: ["Hindi","English","Gujarati"],available: false, avatar: "MP", color: "#f59e0b", rating: 4.7, totalConsultations: 870,  fee: 300, nextSlot: "2:00 PM"  },
      { name: "Dr. Amandeep Kaur", phone: "9000000004", password: "doctor123", specialty: "Gynecologist",      experience: "14 years", languages: ["Punjabi","Hindi"],           available: true,  avatar: "AK", color: "#ec4899", rating: 4.9, totalConsultations: 1560, fee: 350, nextSlot: "12:00 PM" },
      { name: "Dr. Suresh Kumar",  phone: "9000000005", password: "doctor123", specialty: "Orthopedic",        experience: "20 years", languages: ["Hindi","English"],           available: true,  avatar: "SK", color: "#8b5cf6", rating: 4.6, totalConsultations: 3200, fee: 450, nextSlot: "3:30 PM"  },
      { name: "Dr. Neha Gupta",    phone: "9000000006", password: "doctor123", specialty: "Dermatologist",     experience: "7 years",  languages: ["Hindi","English"],           available: false, avatar: "NG", color: "#f97316", rating: 4.8, totalConsultations: 640,  fee: 300, nextSlot: "4:00 PM"  },
    ];
    for (const d of seedData) await Doctormodel.create(d);
    res.json({ success: true, message: "6 doctors seeded! Login with phone + password: doctor123" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/blockchain/register-doctor
app.post("/api/blockchain/register-doctor", async (req, res) => {
  try {
    const { name, specialty, experience, fee } = req.body;
    if (!name || !specialty || !experience || !fee)
      return res.status(400).json({ success: false, message: "All fields required." });
    const result = await registerDoctorOnChain(name, specialty, experience, fee);
    res.json({ success: true, message: "Doctor registered on blockchain!", ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/doctors
app.get("/api/blockchain/doctors", async (req, res) => {
  try {
    const doctors = await getAllDoctorsFromChain();
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/blockchain/doctor/:id/availability
app.patch("/api/blockchain/doctor/:id/availability", async (req, res) => {
  try {
    const { available } = req.body;
    const result = await setAvailabilityOnChain(req.params.id, available);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/blockchain/sync-all", async (req, res) => {
  try {
    const doctors = await Doctormodel.find({});
    if (doctors.length === 0)
      return res.json({ success: true, message: "No doctors in DB to sync." });
 
    // Get how many are already on chain so we don't duplicate
    let alreadyOnChain = 0;
    try {
      const chainDoctors = await getAllDoctorsFromChain();
      alreadyOnChain = chainDoctors.length;
    } catch (_) {}
 
    const toSync = doctors.slice(alreadyOnChain); // only sync new ones
    let synced = 0;
 
    for (const doctor of toSync) {
      try {
        await registerDoctorOnChain(doctor.name, doctor.specialty, doctor.experience, doctor.fee);
        synced++;
        console.log(`✅ Synced "${doctor.name}" to blockchain`);
      } catch (err) {
        console.log(`⚠️ Failed to sync "${doctor.name}": ${err.message}`);
      }
    }
 
    res.json({ success: true, message: `Synced ${synced} new doctor(s) to blockchain. ${alreadyOnChain} already existed.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const autoSyncToBlockchain = async () => {
  try {
    console.log("🔗 Auto-syncing doctors to blockchain...");
    const doctors = await Doctormodel.find({});
    if (doctors.length === 0) return console.log("📭 No doctors in DB to sync.");
 
    let alreadyOnChain = 0;
    try {
      const chainDoctors = await getAllDoctorsFromChain();
      alreadyOnChain = chainDoctors.length;
    } catch (_) {}
 
    const toSync = doctors.slice(alreadyOnChain);
    if (toSync.length === 0) return console.log(`✅ All ${alreadyOnChain} doctors already on blockchain.`);
 
    for (const doctor of toSync) {
      try {
        await registerDoctorOnChain(doctor.name, doctor.specialty, doctor.experience, doctor.fee);
        console.log(`✅ Auto-synced "${doctor.name}" to blockchain`);
      } catch (err) {
        console.log(`⚠️ Could not sync "${doctor.name}": ${err.message}`);
      }
    }
    console.log(`🎉 Auto-sync complete. ${toSync.length} doctor(s) added to blockchain.`);
  } catch (err) {
    console.log("⚠️ Auto-sync failed (blockchain may not be running):", err.message);
  }
};
 
// Run auto-sync 3 seconds after backend starts (gives DB connection time to establish)
setTimeout(autoSyncToBlockchain, 3000);

module.exports = app;