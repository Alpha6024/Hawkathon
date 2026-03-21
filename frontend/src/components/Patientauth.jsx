import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://ruralcare-o2er.onrender.com/api";

export default function PatientAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [isVisible, setIsVisible] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "", age: "", village: "", bloodGroup: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  useEffect(() => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 50);
  }, [mode]);

  const validate = () => {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Name is required";
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Valid 10-digit number required";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      const endpoint = mode === "signup" ? "/patient/signup" : "/patient/login";
      const body = mode === "signup"
        ? { name: form.name, phone: form.phone, password: form.password, age: Number(form.age) || undefined, village: form.village, bloodGroup: form.bloodGroup }
        : { phone: form.phone, password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      localStorage.setItem("patient", JSON.stringify(data.patient));
      navigate("/consult");
    } catch (err) {
      setApiError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const inp = (hasErr) =>
    `w-full bg-slate-700 border rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 transition-all ${hasErr ? "border-red-500 focus:ring-red-500/20" : "border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl hover:bg-emerald-500 transition-colors">🏥</button>
          <div>
            <h1 className="font-bold text-lg">RuralCare</h1>
            <p className="text-slate-400 text-xs">Patient Portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md transform transition-all duration-700 ease-out" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🧑‍⚕️</div>
            <h2 className="text-2xl font-bold">{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p className="text-slate-400 text-sm mt-1">{mode === "login" ? "Login to book appointments" : "Sign up to get started"}</p>
          </div>

          {/* Tab */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setApiError(""); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">

            {mode === "signup" && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Gurpreet Singh" className={inp(errors.name)} />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Age <span className="text-slate-500">(optional)</span></label>
                    <input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 35" className={inp(false)} />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Blood Group</label>
                    <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} className={inp(false)}>
                      <option value="">Select</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Village / Town <span className="text-slate-500">(optional)</span></label>
                  <input value={form.village} onChange={e => set("village", e.target.value)} placeholder="e.g. Nabha, Patiala" className={inp(false)} />
                </div>
              </>
            )}

            {apiError && <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm">⚠️ {apiError}</div>}

            <button onClick={handleSubmit} disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${loading ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] shadow-lg shadow-emerald-900/40 hover:shadow-xl"} text-white`}>
              {loading
                ? <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{mode === "login" ? "Logging in..." : "Creating..."}</>
                : mode === "login" ? "Login →" : "Create Account →"}
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-4">
            {mode === "login" ? "New patient? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setApiError(""); setErrors({}); }}
              className="text-emerald-400 hover:text-emerald-300 font-medium">
              {mode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}