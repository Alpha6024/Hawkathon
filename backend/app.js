const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Doctormodel, Appointmentmodel, HealthRecordModel } = require("./db/model");

const app = express();
app.use(cors());
app.use(express.json());

// ════════════════════════════════════════════════════════════
//  AI SYMPTOM CHECKER — Claude → GPT → Gemini → Grok
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

// Helper: strip markdown code fences and parse JSON safely
function parseAIResponse(text) {
  const clean = text.replace(/```json|```/gi, "").trim();
  return JSON.parse(clean);
}

// Try Claude (Anthropic) — claude-3-5-haiku is fast + cheap
async function tryClaudeAI(symptoms, age) {
  const res = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: SYMPTOM_PROMPT(symptoms, age) }],
    },
    {
      headers: {
        "x-api-key": process.env.ClaudeAPI,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      timeout: 15000,
    }
  );
  return parseAIResponse(res.data.content[0].text);
}

// Try OpenAI GPT
async function tryGPT(symptoms, age) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: SYMPTOM_PROMPT(symptoms, age) }],
      max_tokens: 1024,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OpenaiAPI}`,
        "content-type": "application/json",
      },
      timeout: 15000,
    }
  );
  return parseAIResponse(res.data.choices[0].message.content);
}

// Try Gemini
async function tryGemini(symptoms, age) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GeminiAPI}`,
    {
      contents: [{ parts: [{ text: SYMPTOM_PROMPT(symptoms, age) }] }],
      generationConfig: { responseMimeType: "application/json" },
    },
    {
      headers: { "content-type": "application/json" },
      timeout: 15000,
    }
  );
  return parseAIResponse(res.data.candidates[0].content.parts[0].text);
}

// Try Grok (xAI)
async function tryGrok(symptoms, age) {
  const res = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model: "grok-3-fast",
      messages: [{ role: "user", content: SYMPTOM_PROMPT(symptoms, age) }],
      max_tokens: 1024,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GrokAPI}`,
        "content-type": "application/json",
      },
      timeout: 15000,
    }
  );
  return parseAIResponse(res.data.choices[0].message.content);
}

// POST /api/symptom-check
app.post("/api/symptom-check", async (req, res) => {
  const { symptoms, age } = req.body;
  if (!symptoms || symptoms.trim().length < 3) {
    return res.status(400).json({ success: false, message: "Please describe your symptoms." });
  }

  const providers = [
    { name: "Claude",  fn: () => tryClaudeAI(symptoms, age || 30) },
    { name: "GPT",     fn: () => tryGPT(symptoms, age || 30) },
    { name: "Gemini",  fn: () => tryGemini(symptoms, age || 30) },
    { name: "Grok",    fn: () => tryGrok(symptoms, age || 30) },
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
//  HEALTH RECORDS ROUTES
// ════════════════════════════════════════════════════════════

app.get("/api/health-records/:phone", async (req, res) => {
  try {
    const records = await HealthRecordModel
      .find({ patientPhone: req.params.phone })
      .populate("doctor", "name specialty avatar color")
      .sort({ createdAt: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/health-records", async (req, res) => {
  try {
    const record = await HealthRecordModel.create(req.body);
    await record.populate("doctor", "name specialty avatar color");
    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/health-records/:id", async (req, res) => {
  try {
    const { diagnosis, prescription, notes, followUpDate } = req.body;
    const record = await HealthRecordModel.findByIdAndUpdate(
      req.params.id,
      { diagnosis, prescription, notes, followUpDate },
      { new: true }
    ).populate("doctor", "name specialty avatar color");
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctormodel.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/doctors/:id/slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "date is required" });
    const ALL_SLOTS = [
      "9:00 AM","9:30 AM","10:00 AM","10:30 AM",
      "11:00 AM","11:30 AM","12:00 PM","12:30 PM",
      "2:00 PM","2:30 PM","3:00 PM","3:30 PM",
      "4:00 PM","4:30 PM","5:00 PM",
    ];
    const booked = await Appointmentmodel.find({
      doctor: req.params.id, date, status: { $ne: "cancelled" },
    }).select("timeSlot");
    const bookedSlots = booked.map((a) => a.timeSlot);
    const slots = ALL_SLOTS.map((slot) => ({ time: slot, available: !bookedSlots.includes(slot) }));
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  DOCTOR DASHBOARD ROUTES
// ════════════════════════════════════════════════════════════

app.get("/api/doctor-dashboard/:doctorId/appointments", async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctor: req.params.doctorId, status: { $ne: "cancelled" } };
    if (date) filter.date = date;
    const appointments = await Appointmentmodel.find(filter).sort({ timeSlot: 1 });
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/doctor-dashboard/:bookingId/complete", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { status: "completed" },
      { new: true }
    ).populate("doctor", "name specialty");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    // Auto-create health record
    const existing = await HealthRecordModel.findOne({ bookingId: req.params.bookingId });
    if (!existing) {
      await HealthRecordModel.create({
        patientPhone:   appointment.patientPhone,
        patientName:    appointment.patientName,
        patientAge:     appointment.patientAge,
        patientVillage: appointment.patientVillage,
        appointment:    appointment._id,
        bookingId:      appointment.bookingId,
        doctor:         appointment.doctor._id,
        date:           appointment.date,
        symptoms:       appointment.symptoms,
      });
    }
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  APPOINTMENT ROUTES
// ════════════════════════════════════════════════════════════

app.post("/api/appointments", async (req, res) => {
  try {
    const { doctorId, patientName, patientAge, patientPhone, patientVillage, symptoms, date, timeSlot, callType } = req.body;
    if (!doctorId || !patientName || !patientAge || !patientPhone || !patientVillage || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }
    const doctor = await Doctormodel.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    const existing = await Appointmentmodel.findOne({ doctor: doctorId, date, timeSlot, status: { $ne: "cancelled" } });
    if (existing) return res.status(409).json({ success: false, message: "This slot is already booked. Please choose another." });
    const appointment = await Appointmentmodel.create({
      doctor: doctorId, patientName, patientAge, patientPhone, patientVillage,
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
    const appointments = await Appointmentmodel
      .find({ patientPhone: req.params.phone })
      .populate("doctor", "name specialty avatar color")
      .sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/appointments/:bookingId", async (req, res) => {
  try {
    const appointment = await Appointmentmodel
      .findOne({ bookingId: req.params.bookingId })
      .populate("doctor", "name specialty fee avatar color rating");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/appointments/:bookingId/cancel", async (req, res) => {
  try {
    const appointment = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { status: "cancelled" },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, message: "Appointment cancelled", appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  VIDEO CALL ROUTES
// ════════════════════════════════════════════════════════════

app.post("/api/appointments/:bookingId/create-room", async (req, res) => {
  try {
    const { callLink } = req.body;
    const appointment = await Appointmentmodel.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { callLink },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, callLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/appointments/:bookingId/room", async (req, res) => {
  try {
    const appointment = await Appointmentmodel
      .findOne({ bookingId: req.params.bookingId })
      .populate("doctor", "name specialty avatar color fee");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({
      success: true,
      callLink: appointment.callLink || null,
      callStarted: appointment.callStarted,
      appointment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  SEED ROUTE
// ════════════════════════════════════════════════════════════
app.post("/api/seed", async (req, res) => {
  try {
    await Doctormodel.deleteMany({});
    const doctors = await Doctormodel.insertMany([
      { name: "Dr. Priya Sharma",  specialty: "General Physician", experience: "12 years", languages: ["Hindi","Punjabi","English"], available: true,  avatar: "PS", color: "#10b981", rating: 4.9, totalConsultations: 1240, fee: 200, nextSlot: "10:00 AM" },
      { name: "Dr. Rajveer Singh", specialty: "Cardiologist",      experience: "18 years", languages: ["Hindi","Punjabi"],           available: true,  avatar: "RS", color: "#3b82f6", rating: 4.8, totalConsultations: 2180, fee: 400, nextSlot: "11:30 AM" },
      { name: "Dr. Meena Patel",   specialty: "Pediatrician",      experience: "9 years",  languages: ["Hindi","English","Gujarati"],available: false, avatar: "MP", color: "#f59e0b", rating: 4.7, totalConsultations: 870,  fee: 300, nextSlot: "2:00 PM"  },
      { name: "Dr. Amandeep Kaur", specialty: "Gynecologist",      experience: "14 years", languages: ["Punjabi","Hindi"],           available: true,  avatar: "AK", color: "#ec4899", rating: 4.9, totalConsultations: 1560, fee: 350, nextSlot: "12:00 PM" },
      { name: "Dr. Suresh Kumar",  specialty: "Orthopedic",        experience: "20 years", languages: ["Hindi","English"],           available: true,  avatar: "SK", color: "#8b5cf6", rating: 4.6, totalConsultations: 3200, fee: 450, nextSlot: "3:30 PM"  },
      { name: "Dr. Neha Gupta",    specialty: "Dermatologist",     experience: "7 years",  languages: ["Hindi","English"],           available: false, avatar: "NG", color: "#f97316", rating: 4.8, totalConsultations: 640,  fee: 300, nextSlot: "4:00 PM"  },
    ]);
    res.json({ success: true, message: `${doctors.length} doctors seeded!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = app;