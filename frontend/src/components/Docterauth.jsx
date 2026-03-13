import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";
const SPECIALTIES = ["General Physician","Cardiologist","Pediatrician","Gynecologist","Orthopedic","Dermatologist"];
const LANGUAGES   = ["Hindi","Punjabi","English","Gujarati","Bengali","Tamil","Telugu","Marathi"];

export default function DoctorAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [isVisible, setIsVisible] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", password:"", specialty:"", experience:"", fee:"", licenseNumber:"", languages:["Hindi"] });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  useEffect(() => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 50);
  }, [mode]);

  const toggleLang = (lang) =>
    setForm(f => ({ ...f, languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang] }));

  const validate = () => {
    const e = {};
    if (mode === "signup") {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.specialty)   e.specialty = "Select a specialty";
      if (!form.experience.trim()) e.experience = "Experience is required";
      if (!form.fee || Number(form.fee) < 1) e.fee = "Enter a valid fee";
    }
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Valid 10-digit number required";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      const endpoint = mode === "signup" ? "/doctor/signup" : "/doctor/login";
      const body = mode === "signup"
        ? { name: form.name, phone: form.phone, password: form.password, specialty: form.specialty, experience: form.experience, fee: Number(form.fee), languages: form.languages, licenseNumber: form.licenseNumber }
        : { phone: form.phone, password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      localStorage.setItem("doctor", JSON.stringify(data.doctor));
      navigate("/doctor");
    } catch (err) {
      setApiError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const inp = (hasErr) =>
    `w-full bg-slate-700 border rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 transition-all ${hasErr ? "border-red-500 focus:ring-red-500/20" : "border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl hover:bg-blue-500 transition-colors">🏥</button>
          <div>
            <h1 className="font-bold text-lg">RuralCare</h1>
            <p className="text-slate-400 text-xs">Doctor Portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md transform transition-all duration-700 ease-out" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👨‍⚕️</div>
            <h2 className="text-2xl font-bold">{mode === "login" ? "Doctor Login" : "Register as Doctor"}</h2>
            <p className="text-slate-400 text-sm mt-1">{mode === "login" ? "Access your dashboard" : "Join RuralCare telemedicine"}</p>
          </div>

          {/* Tab */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setApiError(""); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">

            {mode === "signup" && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Dr. Priya Sharma" className={inp(errors.name)} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Mobile Number</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit number" className={inp(errors.phone)} />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 6 characters" className={inp(errors.password)} />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Specialty</label>
                  <select value={form.specialty} onChange={e => set("specialty", e.target.value)} className={inp(errors.specialty)}>
                    <option value="">Select Specialty</option>
                    {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {errors.specialty && <p className="text-red-400 text-xs mt-1">{errors.specialty}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Experience</label>
                    <input value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="e.g. 10 years" className={inp(errors.experience)} />
                    {errors.experience && <p className="text-red-400 text-xs mt-1">{errors.experience}</p>}
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Fee (₹)</label>
                    <input type="number" value={form.fee} onChange={e => set("fee", e.target.value)} placeholder="e.g. 300" className={inp(errors.fee)} />
                    {errors.fee && <p className="text-red-400 text-xs mt-1">{errors.fee}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">License Number <span className="text-slate-500">(optional)</span></label>
                  <input value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} placeholder="Medical license number" className={inp(false)} />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button key={lang} type="button" onClick={() => toggleLang(lang)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.languages.includes(lang) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-600 text-slate-400 hover:border-slate-400"}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {apiError && <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm">⚠️ {apiError}</div>}

            <button onClick={handleSubmit} disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${loading ? "bg-blue-800 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] shadow-lg shadow-blue-900/40 hover:shadow-xl"} text-white`}>
              {loading
                ? <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{mode === "login" ? "Logging in..." : "Registering..."}</>
                : mode === "login" ? "Login →" : "Register →"}
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-4">
            {mode === "login" ? "New doctor? " : "Already registered? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setApiError(""); setErrors({}); }}
              className="text-blue-400 hover:text-blue-300 font-medium">
              {mode === "login" ? "Register" : "Login"}
            </button>
          </p>

          {mode === "login" && (
            <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 text-center">
              🧪 Demo: use any seeded doctor phone + password <span className="text-blue-400 font-mono">doctor123</span><br/>
              e.g. <span className="font-mono">9000000001</span> (Dr. Priya Sharma)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}