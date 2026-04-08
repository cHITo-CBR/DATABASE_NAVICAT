import { getSalesmanMobileData } from "@/app/actions/mobile-dashboard";
import { 
  Plus, 
  ClipboardCheck, 
  HelpCircle, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Calendar,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function OverviewPage() {
  const data = await getSalesmanMobileData();
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      
      {/* Top Banner Section */}
      <section className="px-6 pt-6 pb-2">
        <div className="bg-[#0D5E2D] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-green-900/40">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" strokeDasharray="10 10" />
            </svg>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[3px] text-green-200/60 mb-1">Good Morning</span>
              <h1 className="text-3xl font-black tracking-tight leading-none uppercase drop-shadow-sm">
                {data.user.full_name.split(' ')[0]}<br/>
                <span className="text-green-200">{data.user.full_name.split(' ').slice(1).join(' ')}</span>
              </h1>
              <div className="flex items-center gap-2 mt-4 text-green-100/70">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wide leading-none">{dateFormatted}</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl border-4 border-green-400/30 overflow-hidden shadow-xl bg-green-800">
                <img src={data.user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-2xl bg-white flex items-center justify-center text-green-900 shadow-lg">
                <Zap className="h-4 w-4 fill-green-600 border-none text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Daily Sales Target Card Inside Banner */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-inner">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-green-50">Daily Sales Target</span>
              </div>
              <span className="text-sm font-black text-green-50">{data.targets.daily_sales_percentage}%</span>
            </div>
            <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#51CF9D] h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${data.targets.daily_sales_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Stats Summary */}
      <section className="px-6 py-6 border-none">
        <div className="grid grid-cols-3 gap-5">
          <StatMiniCard 
            icon={MapPin} 
            value={data.stats.total_buyers} 
            label="Total Stores" 
            color="bg-[#3B8BEB]" 
          />
          <StatMiniCard 
            icon={ClipboardCheck} 
            value={data.stats.draft_callsheets} 
            label="Draft Callsheets" 
            color="bg-[#FD9F2A]" 
          />
          <StatMiniCard 
            icon={ShoppingBag} 
            value={data.stats.bookings} 
            label="Bookings" 
            color="bg-[#00B686]" 
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-6 py-4">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-[#FD9F2A] fill-[#FD9F2A]" />
          <h2 className="text-lg font-black uppercase tracking-widest text-[#15273F]">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <ActionButton label="New Visit" icon={Plus} color="bg-[#0D5E2D]" />
          <ActionButton label="Callsheet" icon={ClipboardCheck} color="bg-orange-500" />
          <ActionButton label="Request" icon={HelpCircle} color="bg-blue-500" />
          <ActionButton label="Booking" icon={ShoppingBag} color="bg-purple-500" />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-6 py-6 pb-24">
        <div className="bg-white rounded-[40px] p-8 shadow-md border border-gray-100 min-h-[300px]">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUpIcon className="h-6 w-6 text-[#15273F]" />
            <h2 className="text-lg font-black uppercase tracking-widest text-[#15273F]">Recent Activity</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-40">
             <div className="h-14 w-14 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-xl italic">
                {data.user.full_name[0]}
             </div>
             <p className="text-sm font-bold text-gray-500 italic">No recent activity recorded</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatMiniCard({ icon: Icon, value, label, color }: any) {
  return (
    <div className="bg-white rounded-[32px] p-6 flex flex-col items-center gap-4 shadow-xl shadow-gray-200/50 border border-gray-100/50 h-full">
      <div className={cn("h-12 w-12 rounded-[18px] flex items-center justify-center text-white shadow-lg", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col items-center gap-0">
        <span className="text-4xl font-black text-[#15273F] leading-none">{value}</span>
        <span className="text-[10px] uppercase font-black tracking-widest text-[#A0AEC0] text-center mt-3 leading-tight leading-[12px] h-[24px] overflow-hidden">
          {label.split(' ').map((w: string, i: number) => <span key={i} className="block">{w}</span>)}
        </span>
      </div>
    </div>
  );
}

function ActionButton({ label, icon: Icon, color }: any) {
  return (
    <button className={cn("group relative overflow-hidden rounded-[28px] p-5 flex flex-col items-center gap-3 transition-all active:scale-95 shadow-lg", color)}>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute -bottom-6 -right-6 h-16 w-16 bg-white/20 rounded-full blur-xl"></div>
      
      <div className="h-10 w-10 flex items-center justify-center text-white">
        <Icon className="h-8 w-8" />
      </div>
      <span className="text-xs font-black uppercase tracking-[2px] text-white text-center leading-none">
        {label.split(' ').map((w: string, i: number) => <span key={i} className="block">{w}</span>)}
      </span>
    </button>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
