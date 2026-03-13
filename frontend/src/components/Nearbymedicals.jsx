import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NearbyMedicals() {
  const navigate = useNavigate();
  const [status, setStatus]   = useState("idle");
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getLocation = () => {
    setStatus("loading");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("Your browser does not support location access.");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        console.log("Got location:", lat, lon); // debug
        setLocation({ lat, lon });
        setStatus("success");
      },
      (err) => {
        if (err.code === 1) setErrorMsg("Location access denied. Please allow location in your browser settings.");
        else if (err.code === 2) setErrorMsg("Location unavailable. Please check your GPS.");
        else setErrorMsg("Could not get your location. Please try again.");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Correct Google Maps URL — uses ll= for lat/lon anchor + near for search
  const mapsUrl = (query) => {
    const { lat, lon } = location;
    return `https://www.google.com/maps/search/?api=1&query=${query}&center=${lat},${lon}`;
  };

  const shareLocation = () => {
    const url = `https://maps.google.com/?q=${location.lat},${location.lon}`;
    if (navigator.share) {
      navigator.share({ title: "My Location", url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Location link copied!");
    }
  };

  const CATEGORIES = [
    {
      label: "Medical Stores",
      icon: "💊",
      query: "medical+store+near+me",
      desc: "Pharmacy & chemist shops",
      color: "border-emerald-700 hover:border-emerald-500",
    },
    {
      label: "Hospitals",
      icon: "🏥",
      query: "hospital+near+me",
      desc: "Government & private hospitals",
      color: "border-blue-700 hover:border-blue-500",
    },
    {
      label: "Clinics & Doctors",
      icon: "🩺",
      query: "doctor+clinic+near+me",
      desc: "Local clinics & practitioners",
      color: "border-purple-700 hover:border-purple-500",
    },
    {
      label: "Diagnostic Labs",
      icon: "🔬",
      query: "pathology+lab+diagnostic+near+me",
      desc: "Blood tests & diagnostics",
      color: "border-orange-700 hover:border-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-lg transition-colors">←</button>
              <div>
                <h1 className="text-white font-bold text-lg">Nearby Medical Stores</h1>
                <p className="text-slate-400 text-xs">Pharmacies · Hospitals · Clinics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* ── IDLE ── */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-16 text-center transform transition-all duration-700 ease-out" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
            <div className="text-7xl mb-6">💊</div>
            <h2 className="text-2xl font-bold text-white mb-3">Find Nearby Medical Stores</h2>
            <p className="text-slate-400 text-sm mb-2 max-w-xs">
              Allow location access to find the nearest pharmacies, hospitals and clinics.
            </p>
            <p className="text-slate-500 text-xs mb-10">Opens in Google Maps · No data stored</p>
            <button onClick={getLocation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg shadow-emerald-900/40 transition-all duration-300 hover:scale-105 flex items-center gap-3">
              📍 Use My Location
            </button>
            <p className="text-slate-600 text-xs mt-6">Allow location permission when prompted</p>
          </div>
        )}

        {/* ── LOADING ── */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mb-6"></div>
            <p className="text-white font-semibold text-lg">Getting your location...</p>
            <p className="text-slate-400 text-sm mt-2">Please allow location access if prompted</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-6">📍</div>
            <h2 className="text-xl font-bold text-white mb-3">Location Error</h2>
            <p className="text-red-400 text-sm mb-8 max-w-xs">{errorMsg}</p>
            <button onClick={getLocation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all">
              Try Again
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && location && (
          <div className="animate-fadeIn">

            {/* Location confirmed bar */}
            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">Location Detected</p>
                  <p className="text-slate-400 text-xs font-mono">{location.lat.toFixed(5)}, {location.lon.toFixed(5)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={shareLocation}
                  className="text-xs border border-slate-700 text-slate-400 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
                  Share
                </button>
                <button onClick={getLocation}
                  className="text-xs border border-slate-700 text-slate-400 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
                  🔄
                </button>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-4">Select what you're looking for — opens in Google Maps at your location:</p>

            {/* Category Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {CATEGORIES.map((cat, idx) => (
                <button key={idx}
                  onClick={() => window.open(mapsUrl(cat.query), "_blank")}
                  className={`bg-slate-800 border-2 ${cat.color} rounded-2xl p-5 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl group`}>
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-1">{cat.label}</h3>
                  <p className="text-slate-500 text-xs group-hover:text-slate-300 transition-colors">{cat.desc}</p>
                  <p className="text-emerald-400 text-xs mt-2 group-hover:translate-x-1 transition-transform inline-block">Open Maps →</p>
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-4">
              <h3 className="text-white font-semibold text-sm mb-4">⚡ Quick Search</h3>
              <div className="space-y-2">
                {[
                  { icon: "🌙", label: "Open Right Now",        query: "pharmacy+open+now+near+me" },
                  { icon: "💉", label: "Vaccination Center",    query: "vaccination+center+near+me" },
                  { icon: "🩸", label: "Blood Bank",            query: "blood+bank+near+me"         },
                  { icon: "🚑", label: "Nearest Emergency",     query: "emergency+hospital+near+me" },
                ].map(({ icon, label, query }) => (
                  <button key={label}
                    onClick={() => window.open(mapsUrl(query), "_blank")}
                    className="w-full flex items-center gap-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.02] text-left">
                    <span className="text-xl">{icon}</span>
                    <span className="text-white text-sm font-medium">{label}</span>
                    <span className="ml-auto text-slate-500 text-sm">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Numbers */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-white font-semibold text-sm mb-4">🆘 Emergency Numbers (India)</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Ambulance",    number: "108", color: "text-red-400",     bg: "bg-red-900/20 border-red-900/40"     },
                  { label: "Police",       number: "100", color: "text-blue-400",    bg: "bg-blue-900/20 border-blue-900/40"   },
                  { label: "Health Line",  number: "104", color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-900/40" },
                ].map(({ label, number, color, bg }) => (
                  <a key={label} href={`tel:${number}`}
                    className={`${bg} border rounded-xl p-3 text-center transition-all duration-300 hover:scale-110`}>
                    <p className={`text-2xl font-bold ${color}`}>{number}</p>
                    <p className="text-slate-400 text-xs mt-1">{label}</p>
                  </a>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}