import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';

interface ProfileDropdownProps {
  onNavigateToProfile: () => void;
  onLogout: () => void;
}

export function ProfileDropdown({ onNavigateToProfile, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    console.log('Dropdown toggle clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const handleItemClick = (action: () => void, actionName: string) => {
    console.log(`${actionName} clicked`);
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 hover:bg-gray-100 border border-transparent hover:border-gray-300"
        onClick={handleToggle}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline">John Doe</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleItemClick(onNavigateToProfile, 'Profile')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            
            <button
              onClick={() => handleItemClick(() => {}, 'Settings')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            
            <hr className="my-1 border-gray-200" />
            
            <button
              onClick={() => handleItemClick(onLogout, 'Logout')}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}