import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { db } from "../db";

const API = "http://localhost:5000/api";

export default function HealthRecords() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [phone, setPhone] = useState("");
  const [records, setRecords] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => { window.removeEventListener('online', handleStatus); window.removeEventListener('offline', handleStatus); };
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const stored = localStorage.getItem("patient");
    if (stored) {
      const p = JSON.parse(stored);
      setPatient(p);
      if (p.phone) setPhone(p.phone);
    }
  }, []);

  const handleSearch = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) { setError("Please enter a valid 10-digit mobile number."); return; }
    setLoading(true); setError(""); setSearched(true);
    try {
      const localRecords = await db.healthRecords.where("phone").equals(phone).toArray();
      if (localRecords.length > 0) setRecords(localRecords);

      const res = await fetch(`${API}/health-records/${phone}`);
      const data = await res.json();
      if (data.success) {
        const normalized = data.records.map(r => ({ ...r, phone }));
        setRecords(normalized);
        await db.healthRecords.bulkPut(normalized);
      } else if (localRecords.length === 0) throw new Error(data.message);
    } catch (err) {
      const cached = await db.healthRecords.where("phone").equals(phone).toArray();
      if (cached.length > 0) { setRecords(cached); }
      else { setError(isOnline ? (err.message || "Could not fetch records.") : "Offline: No cached records found for this number."); }
    } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem("patient"); navigate("/patient-auth"); };

  const downloadPDF = (rec) => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont(undefined, 'bold');
    doc.text('Medical Prescription', 105, 18, { align: 'center' });
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text('RuralCare Telemedicine Platform', 105, 28, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text('Patient Information', 14, 50);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10);
    doc.text(`Name: ${rec.patientName}`, 14, 58);
    doc.text(`Age: ${rec.patientAge} years`, 14, 64);
    doc.text(`Village: ${rec.patientVillage}`, 14, 70);
    doc.text(`Phone: ${rec.patientPhone}`, 14, 76);
    doc.text(`Date: ${rec.date}`, 14, 82);
    doc.text(`Booking ID: ${rec.bookingId}`, 14, 88);

    doc.setFont(undefined, 'bold'); doc.setFontSize(12);
    doc.text('Doctor Information', 120, 50);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10);
    doc.text(`Dr. ${rec.doctor?.name || 'N/A'}`, 120, 58);
    doc.text(`${rec.doctor?.specialty || 'N/A'}`, 120, 64);

    let yPos = 100;
    const addSection = (title, text) => {
      if (!text) return;
      doc.setFont(undefined, 'bold'); doc.setFontSize(12);
      doc.text(title, 14, yPos);
      doc.setFont(undefined, 'normal'); doc.setFontSize(10);
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 14, yPos + 6);
      yPos += 6 + (lines.length * 5) + 8;
    };
    addSection('Symptoms', rec.symptoms);
    addSection('Diagnosis', rec.diagnosis);
    addSection('Prescription', rec.prescription);
    addSection("Doctor's Notes", rec.notes);
    if (rec.followUpDate) addSection('Follow-up Date', rec.followUpDate);

    doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated prescription from RuralCare Telemedicine Platform', 105, 280, { align: 'center' });
    doc.save(`Prescription_${rec.bookingId}_${rec.patientName}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">←</button>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm sm:text-lg">Health Records</h1>
              <p className="text-slate-400 text-xs hidden sm:block">Your Medical History · RuralCare</p>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-xs text-slate-400 hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {patient && (
              <div className="hidden md:flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                <span className="text-emerald-400">👤</span><span>{patient.name}</span>
              </div>
            )}
            <button onClick={() => navigate("/consult")} className="hidden sm:flex text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold">
              New Appointment
            </button>
            {patient && (
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 text-xs border border-slate-700 hover:border-red-700 px-2.5 py-1.5 rounded-lg transition-all">
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Search */}
        <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-700 mb-5 transition-all duration-700"
          style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          <h2 className="text-white font-bold text-lg sm:text-xl mb-1">View Your Records</h2>
          <p className="text-slate-400 text-sm mb-4">Enter your registered mobile number</p>
          <div className="flex gap-2">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="10-digit mobile number"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm" />
            <button onClick={handleSearch} disabled={loading}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${loading ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"} text-white shrink-0`}>
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : "Search"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">⚠️ {error}</p>}
        </div>

        {/* Results */}
        {searched && (
          <>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-white font-semibold">No records found</p>
                <p className="text-slate-400 text-sm mt-1 mb-5">No completed appointments for this number</p>
                <button onClick={() => navigate("/consult")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all">
                  Book First Appointment →
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-sm mb-3">
                  {records.length} record{records.length !== 1 ? "s" : ""} found for <span className="text-white font-medium">{phone}</span>
                </p>
                <div className="space-y-3">
                  {records.map((rec) => (
                    <div key={rec._id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden transition-all duration-300 hover:border-slate-600">
                      {/* Record Header */}
                      <div className="p-4 cursor-pointer hover:bg-slate-700/30 transition-all"
                        onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {rec.doctor && (
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                                style={{ backgroundColor: rec.doctor.color + "33", border: `2px solid ${rec.doctor.color}`, color: rec.doctor.color }}>
                                {rec.doctor.avatar}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{rec.doctor?.name || "Doctor"}</p>
                              <p className="text-slate-400 text-xs">{rec.doctor?.specialty}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-slate-400 text-xs">{rec.date}</p>
                            <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">{rec.bookingId}</p>
                          </div>
                        </div>

                        {rec.symptoms && (
                          <p className="text-slate-500 text-xs mt-2 bg-slate-700/40 rounded-lg px-2.5 py-1.5">🩺 {rec.symptoms}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex gap-1.5 flex-wrap">
                            {rec.diagnosis && <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">✓ Diagnosis</span>}
                            {rec.prescription && <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">💊 Rx</span>}
                          </div>
                          <span className="text-slate-500 text-xs">{expanded === rec._id ? "▲ Hide" : "▼ Details"}</span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expanded === rec._id && (
                        <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-900/40">
                          {rec.diagnosis ? (
                            <div>
                              <p className="text-slate-400 text-xs font-medium mb-1">🔍 DIAGNOSIS</p>
                              <p className="text-white text-sm bg-slate-700/50 rounded-xl p-3">{rec.diagnosis}</p>
                            </div>
                          ) : (
                            <p className="text-slate-600 text-sm italic">No diagnosis added yet</p>
                          )}

                          {rec.prescription && (
                            <div>
                              <p className="text-slate-400 text-xs font-medium mb-1">💊 PRESCRIPTION</p>
                              <p className="text-white text-sm bg-slate-700/50 rounded-xl p-3 whitespace-pre-line">{rec.prescription}</p>
                            </div>
                          )}

                          {rec.notes && (
                            <div>
                              <p className="text-slate-400 text-xs font-medium mb-1">📝 DOCTOR'S NOTES</p>
                              <p className="text-white text-sm bg-slate-700/50 rounded-xl p-3">{rec.notes}</p>
                            </div>
                          )}

                          {rec.followUpDate && (
                            <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3 flex items-center gap-2">
                              <span className="text-yellow-400">📅</span>
                              <p className="text-yellow-300 text-sm">Follow-up: <strong>{rec.followUpDate}</strong></p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-700/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <p className="text-slate-600 text-xs">Patient: {rec.patientName}, Age {rec.patientAge} · {rec.patientVillage}</p>
                              <button onClick={() => downloadPDF(rec)}
                                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
