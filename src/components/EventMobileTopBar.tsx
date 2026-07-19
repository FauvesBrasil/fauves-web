import * as React from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventMobileTopBarProps {
  title: string;
  onMenuOpen: () => void;
  onBack?: () => void;
  backRoute?: string;
}

const EventMobileTopBar: React.FC<EventMobileTopBarProps> = ({ 
  title, 
  onMenuOpen, 
  onBack,
  backRoute 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backRoute) {
      navigate(backRoute);
    }
  };

  return (
    <div className="hidden max-sm:block fixed top-[60px] left-0 z-20 w-full h-[50px] border-b border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#0b0b0b]">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {(onBack || backRoute) && (
            <button 
              onClick={handleBack}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1F1F1F] rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#091747] dark:text-white" />
            </button>
          )}
          
          <h1 className="text-base font-semibold text-[#091747] dark:text-white truncate">
            {title}
          </h1>
        </div>
        
        <button 
          onClick={onMenuOpen}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1F1F1F] rounded-lg transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-[#091747] dark:text-white" />
        </button>
      </div>
    </div>
  );
};

export default EventMobileTopBar;
