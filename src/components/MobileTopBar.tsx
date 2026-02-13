import * as React from "react";
import { Menu, Bell } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import logoSquare from "@/assets/logo-square-fauves-blue.svg";

interface MobileTopBarProps {
  onMenuOpen: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ onMenuOpen }) => {
  return (
    <div className="hidden max-sm:block fixed top-0 left-0 z-30 w-full h-[60px] border-b border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#0b0b0b]">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-1">
          <button 
            onClick={onMenuOpen}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1F1F1F] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-[#091747] dark:text-white" />
          </button>
          
          <img 
            src={logoSquare} 
            alt="Fauves" 
            className="h-[64px] w-[64px]"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#1F1F1F] rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-[#091747] dark:text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default MobileTopBar;
