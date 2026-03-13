import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-lg">🏥</div>
              <p className="text-white font-bold text-base">RuralCare</p>
            </div>
            <p className="text-slate-400 text-xs">Nabha Civil Hospital · Telemedicine Platform</p>
            <p className="text-slate-500 text-xs mt-1">Healthcare for 173 villages</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Quick Links</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <button onClick={() => navigate("/")} className="hover:text-emerald-400 transition-colors">Home</button>
                <button onClick={() => navigate("/consult")} className="hover:text-emerald-400 transition-colors">Consult</button>
                <button onClick={() => navigate("/symptoms")} className="hover:text-emerald-400 transition-colors">AI Check</button>
                <button onClick={() => navigate("/records")} className="hover:text-emerald-400 transition-colors">Records</button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Resources</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <button onClick={() => navigate("/medical-stores")} className="hover:text-emerald-400 transition-colors">Pharmacy</button>
                <button onClick={() => navigate("/blockchain")} className="hover:text-emerald-400 transition-colors">Blockchain</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-600 text-xs mt-6 pt-4 border-t border-slate-800">
          <p>© 2026 RuralCare. Empowering rural healthcare through technology.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-700">Made with ❤️ form helloworld</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
