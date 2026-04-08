import { Bell } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
}

export function DashboardHeader({ title, subtitle, showAvatar = true }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex w-full flex-col bg-white/80 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <Bell className="h-6 w-6" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"></span>
          </button>
          
          {showAvatar && (
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-green-100 bg-green-50">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="User Avatar"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
