import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";
const TODAY = new Date().toISOString().split("T")[0];

const SPECIALTIES = ["All","General Physician","Cardiologist","Pediatrician","Gynecologist","Orthopedic","Dermatologist"];

function StepBar({ step }) {
  const steps = ["Choose Doctor", "Pick Slot", "Your Details", "Confirm"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${i < step ? "bg-emerald-500 border-emerald-500 text-white" : i === step ? "bg-white border-emerald-500 text-emerald-600" : "bg-slate-800 border-slate-600 text-slate-500"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium whitespace-nowrap ${i === step ? "text-emerald-400" : "text-slate-500"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-16 h-0.5 mb-5 mx-1 transition-all duration-500 ${i < step ? "bg-emerald-500" : "bg-slate-700"}`} />}
        </div>
      ))}
    </div>
  );
}

function DoctorCard({ doctor, selected, onSelect }) {
  return (
    <div onClick={() => onSelect(doctor)} className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 hover:scale-[1.02] ${selected ? "border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-900/30" : "border-slate-700 bg-slate-800/60 hover:border-slate-500"}`}>
      {selected && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0" style={{ backgroundColor: doctor.color + "33", border: `2px solid ${doctor.color}` }}>
          <span style={{ color: doctor.color }}>{doctor.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base">{doctor.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doctor.available ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
              {doctor.available ? "● Online" : "○ Busy"}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{doctor.specialty} · {doctor.experience}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-yellow-400 text-sm">★ {doctor.rating}</span>
            <span className="text-slate-500 text-xs">{doctor.totalConsultations?.toLocaleString()} consults</span>
            <span className="text-slate-500 text-xs">Next: {doctor.nextSlot}</span>
          </div>
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex gap-1 flex-wrap">
              {doctor.languages?.map((l) => <span key={l} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{l}</span>)}
            </div>
            <span className="text-emerald-400 font-semibold text-sm">₹{doctor.fee}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorConsultation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [callType, setCallType] = useState("video");
  const [filterSpec, setFilterSpec] = useState("All");
  const [filterAvail, setFilterAvail] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", phone: "", village: "", symptoms: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setFetchingDoctors(true);
        const params = new URLSearchParams();
        if (filterSpec !== "All") params.append("specialty", filterSpec);
        if (filterAvail) params.append("available", "true");
        const res = await fetch(`${API}/doctors?${params}`);
        const data = await res.json();
        if (data.success) setDoctors(data.doctors);
      } catch {
        setApiError("Could not load doctors. Please check your connection.");
      } finally {
        setFetchingDoctors(false);
      }
    };
    fetchDoctors();
  }, [filterSpec, filterAvail]);

  useEffect(() => {
    if (!selectedDoctor) return;
    const fetchSlots = async () => {
      try {
        setFetchingSlots(true);
        const res = await fetch(`${API}/doctors/${selectedDoctor._id}/slots?date=${TODAY}`);
        const data = await res.json();
        if (data.success) setSlots(data.slots);
      } catch {
        setApiError("Could not load time slots.");
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctor]);

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.age || form.age < 1 || form.age > 120) e.age = "Valid age required";
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Valid 10-digit mobile number required";
    if (!form.village.trim()) e.village = "Village/Town is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId:       selectedDoctor._id,
          patientName:    form.name,
          patientAge:     Number(form.age),
          patientPhone:   form.phone,
          patientVillage: form.village,
          symptoms:       form.symptoms,
          date:           TODAY,
          timeSlot:       selectedSlot,
          callType,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      navigate(`/call/${data.appointment.bookingId}`);
    } catch (err) {
      setApiError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl hover:bg-emerald-500 transition-colors">🏥</button>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">RuralCare</h1>
              <p className="text-slate-400 text-xs">Nabha Civil Hospital · Telemedicine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-emerald-900/40 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {doctors.filter((d) => d.available).length} Doctors Online
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepBar step={step} />

        {apiError && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm mb-6 flex items-center justify-between">
            ⚠️ {apiError}
            <button onClick={() => setApiError("")} className="text-red-400 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* STEP 0: Choose Doctor */}
        {step === 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Find a Doctor</h2>
              <p className="text-slate-400 text-sm">Consult from home — no travel needed</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {SPECIALTIES.map((s) => (
                <button key={s} onClick={() => setFilterSpec(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterSpec === s ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>{s}</button>
              ))}
              <button onClick={() => setFilterAvail(!filterAvail)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ml-auto ${filterAvail ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                {filterAvail ? "● " : ""}Available Now
              </button>
            </div>
            {fetchingDoctors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[1,2,3,4].map((i) => <div key={i} className="h-36 rounded-2xl bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {doctors.map((d) => <DoctorCard key={d._id} doctor={d} selected={selectedDoctor?._id === d._id} onSelect={setSelectedDoctor} />)}
              </div>
            )}
            {selectedDoctor && (
              <div className="bg-slate-800/60 rounded-2xl p-5 mb-6 border border-slate-700">
                <p className="text-slate-300 font-medium mb-3 text-sm">Select Call Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {["video", "audio"].map((type) => (
                    <button key={type} onClick={() => setCallType(type)} className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${callType === type ? "border-emerald-500 bg-emerald-950/40 text-emerald-400" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                      {type === "video" ? "📹 Video Call" : "📞 Audio Call"}
                      {type === "audio" && <span className="block text-xs text-slate-500 mt-0.5">Works on 2G</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button disabled={!selectedDoctor} onClick={() => setStep(1)} className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${selectedDoctor ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}>
              {selectedDoctor ? `Continue with ${selectedDoctor.name} →` : "Select a Doctor to Continue"}
            </button>
          </div>
        )}

        {/* STEP 1: Pick Slot */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">← Back</button>
            <h2 className="text-2xl font-bold text-white mb-1">Pick a Time Slot</h2>
            <p className="text-slate-400 text-sm mb-6">Today · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            <div className="bg-slate-800 rounded-xl p-4 mb-6 flex items-center gap-4 border border-slate-700">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0" style={{ backgroundColor: selectedDoctor?.color + "33", color: selectedDoctor?.color }}>
                {selectedDoctor?.avatar}
              </div>
              <div>
                <p className="text-white font-semibold">{selectedDoctor?.name}</p>
                <p className="text-slate-400 text-sm">{selectedDoctor?.specialty} · {callType === "video" ? "📹 Video" : "📞 Audio"} · ₹{selectedDoctor?.fee}</p>
              </div>
            </div>
            {fetchingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
                {[...Array(15)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
                {slots.map(({ time, available }) => (
                  <button key={time} disabled={!available} onClick={() => setSelectedSlot(time)}
                    className={`py-2.5 px-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedSlot === time ? "border-emerald-500 bg-emerald-950/50 text-emerald-400" : !available ? "border-slate-800 bg-slate-800/30 text-slate-700 cursor-not-allowed line-through" : "border-slate-700 text-slate-300 hover:border-emerald-600 hover:text-white"}`}>
                    {time}
                    {!available && <span className="block text-xs">Full</span>}
                  </button>
                ))}
              </div>
            )}
            <button disabled={!selectedSlot} onClick={() => setStep(2)} className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${selectedSlot ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}>
              {selectedSlot ? `Book for ${selectedSlot} →` : "Select a Time Slot"}
            </button>
          </div>
        )}

        {/* STEP 2: Patient Details */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">← Back</button>
            <h2 className="text-2xl font-bold text-white mb-1">Your Details</h2>
            <p className="text-slate-400 text-sm mb-6">We need this to connect you with the doctor</p>
            <div className="space-y-4">
              {[
                { key: "name",    label: "Full Name",      placeholder: "e.g. Gurpreet Singh", type: "text"   },
                { key: "age",     label: "Age",            placeholder: "e.g. 35",             type: "number" },
                { key: "phone",   label: "Mobile Number",  placeholder: "10-digit number",     type: "tel"    },
                { key: "village", label: "Village / Town", placeholder: "e.g. Nabha, Patiala", type: "text"   },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:ring-2 transition-all ${errors[key] ? "border-red-500 focus:ring-red-500/30" : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"}`} />
                  {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Symptoms <span className="text-slate-500">(optional)</span></label>
                <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} placeholder="Briefly describe your health concern..." rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none" />
              </div>
            </div>
            <button onClick={() => { if (validateForm()) setStep(3); }} className="w-full py-4 rounded-2xl font-bold text-base mt-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all">
              Review Booking →
            </button>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">← Back</button>
            <h2 className="text-2xl font-bold text-white mb-1">Confirm Booking</h2>
            <p className="text-slate-400 text-sm mb-6">Review your appointment details</p>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6">
              <div className="p-5 border-b border-slate-700 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0" style={{ backgroundColor: selectedDoctor?.color + "33", color: selectedDoctor?.color }}>
                  {selectedDoctor?.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{selectedDoctor?.name}</p>
                  <p className="text-slate-400 text-sm">{selectedDoctor?.specialty}</p>
                  <p className="text-emerald-400 text-sm font-medium mt-0.5">★ {selectedDoctor?.rating} · {selectedDoctor?.experience}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  ["📅 Date",     "Today, " + new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
                  ["⏰ Time",     selectedSlot],
                  [callType === "video" ? "📹 Call Type" : "📞 Call Type", callType === "video" ? "Video Call" : "Audio Call (works on 2G)"],
                  ["👤 Patient",  form.name + ", Age " + form.age],
                  ["📱 Mobile",   form.phone],
                  ["🏘️ Location", form.village],
                  form.symptoms ? ["🩺 Symptoms", form.symptoms] : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-slate-500 text-sm w-36 shrink-0">{label}</span>
                    <span className="text-white text-sm">{value}</span>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-slate-700 flex justify-between items-center bg-slate-900/50">
                <span className="text-slate-400">Consultation Fee</span>
                <span className="text-emerald-400 text-xl font-bold">₹{selectedDoctor?.fee}</span>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 text-sm text-blue-300 mb-6">
              💡 After confirming, you'll be taken directly to the video call room.
            </div>
            <button onClick={handleBook} disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 ${loading ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40"} text-white`}>
              {loading ? (
                <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Booking...</>
              ) : "✓ Confirm & Go to Call Room"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}