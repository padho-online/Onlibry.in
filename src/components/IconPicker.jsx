// src/components/IconPicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Search, 
  X,
  Home,
  FileText,
  Folder,
  FolderOpen,
  FileQuestion,
  HelpCircle,
  BookOpen,
  Bookmark,
  Star,
  Heart,
  ShoppingCart,
  CreditCard,
  User,
  Users,
  LogIn,
  LogOut,
  Settings,
  Download,
  Upload,
  Share2,
  Lock,
  Unlock,
  Bell,
  BellRing,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Link,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Award,
  Trophy,
  Target,
  Flag,
  Send,
  Inbox,
  Copy,
  Printer,
  Cloud,
  Database,
  Server,
  Code,
  Terminal,
  GraduationCap,
  Library,
  Megaphone,
  Sun,
  RefreshCw,
  LayoutGrid,
  BellOff,
  Image,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Phone,
  MessageCircle,
  Video,
  Music,
  Camera
} from 'lucide-react';

// Available Lucide React Icons for Quick Access Buttons
export const AVAILABLE_ICONS = [
  { name: 'Home', component: Home },
  { name: 'FileText', component: FileText },
  { name: 'Folder', component: Folder },
  { name: 'FolderOpen', component: FolderOpen },
  { name: 'FileQuestion', component: FileQuestion },
  { name: 'HelpCircle', component: HelpCircle },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Bookmark', component: Bookmark },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'CreditCard', component: CreditCard },
  { name: 'User', component: User },
  { name: 'Users', component: Users },
  { name: 'LogIn', component: LogIn },
  { name: 'LogOut', component: LogOut },
  { name: 'Settings', component: Settings },
  { name: 'Search', component: Search },
  { name: 'Download', component: Download },
  { name: 'Upload', component: Upload },
  { name: 'Share2', component: Share2 },
  { name: 'Lock', component: Lock },
  { name: 'Unlock', component: Unlock },
  { name: 'Bell', component: Bell },
  { name: 'BellRing', component: BellRing },
  { name: 'Mail', component: Mail },
  { name: 'Calendar', component: Calendar },
  { name: 'Clock', component: Clock },
  { name: 'MapPin', component: MapPin },
  { name: 'Globe', component: Globe },
  { name: 'Link', component: Link },
  { name: 'ExternalLink', component: ExternalLink },
  { name: 'Edit', component: Edit },
  { name: 'Trash2', component: Trash2 },
  { name: 'Plus', component: Plus },
  { name: 'Minus', component: Minus },
  { name: 'Check', component: Check },
  { name: 'X', component: X },
  { name: 'AlertCircle', component: AlertCircle },
  { name: 'AlertTriangle', component: AlertTriangle },
  { name: 'Info', component: Info },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'XCircle', component: XCircle },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'TrendingDown', component: TrendingDown },
  { name: 'Zap', component: Zap },
  { name: 'Shield', component: Shield },
  { name: 'Award', component: Award },
  { name: 'Trophy', component: Trophy },
  { name: 'Target', component: Target },
  { name: 'Flag', component: Flag },
  { name: 'Send', component: Send },
  { name: 'Inbox', component: Inbox },
  { name: 'Copy', component: Copy },
  { name: 'Printer', component: Printer },
  { name: 'Cloud', component: Cloud },
  { name: 'Database', component: Database },
  { name: 'Server', component: Server },
  { name: 'Code', component: Code },
  { name: 'Terminal', component: Terminal },
  { name: 'Eye', component: Eye },
  { name: 'EyeOff', component: EyeOff },
  { name: 'Menu', component: Menu },
  { name: 'MoreHorizontal', component: MoreHorizontal },
  { name: 'MoreVertical', component: MoreVertical },
  { name: 'Phone', component: Phone },
  { name: 'MessageCircle', component: MessageCircle },
  { name: 'Video', component: Video },
  { name: 'Music', component: Music },
  { name: 'Camera', component: Camera }
];

// Category specific icons
export const CATEGORY_ICONS = [
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'Library', component: Library },
  { name: 'Shield', component: Shield },
  { name: 'Bell', component: Bell },
  { name: 'Megaphone', component: Megaphone },
  { name: 'Calendar', component: Calendar },
  { name: 'Award', component: Award },
  { name: 'Sun', component: Sun },
  { name: 'RefreshCw', component: RefreshCw },
  { name: 'AlertTriangle', component: AlertTriangle },
  { name: 'Info', component: Info },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'AlertCircle', component: AlertCircle },
  { name: 'BookOpen', component: BookOpen },
  { name: 'FileText', component: FileText },
  { name: 'Flag', component: Flag }
];

// Get icon component by name
export const getIconComponent = (iconName, fallbackIcon = Folder) => {
  if (!iconName) return fallbackIcon;
  
  const iconMap = {
    Home, FileText, Folder, FolderOpen, FileQuestion, HelpCircle,
    BookOpen, Bookmark, Star, Heart, ShoppingCart, CreditCard,
    User, Users, LogIn, LogOut, Settings, Search,
    Download, Upload, Share2, Lock, Unlock, Bell, BellRing,
    Mail, Calendar, Clock, MapPin, Globe, Link, ExternalLink, Edit,
    Trash2, Plus, Minus, Check, X, AlertCircle, AlertTriangle,
    Info, CheckCircle, XCircle, TrendingUp, TrendingDown, Zap,
    Shield, Award, Trophy, Target, Flag, Send, Inbox, Copy,
    Printer, Cloud, Database, Server, Code, Terminal, GraduationCap,
    Library, Megaphone, Sun, RefreshCw, LayoutGrid, BellOff,
    Image, ChevronLeft, ChevronRight, Eye, EyeOff, Menu,
    MoreHorizontal, MoreVertical, Phone, MessageCircle, Video, Music, Camera
  };
  
  const IconComponent = iconMap[iconName];
  return IconComponent || fallbackIcon;
};

function IconPicker({ 
  value, 
  onChange, 
  label = "Select Icon",
  placeholder = "Choose an icon",
  iconSize = 20,
  iconColor = "text-green-600",
  pickerWidth = "w-96",
  pickerColumns = 6,
  iconsList = AVAILABLE_ICONS,
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  // Filter icons based on search term
  const filteredIcons = iconsList.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectIcon = (iconName) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchTerm("");
  };

  const SelectedIcon = getIconComponent(value, Folder);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between hover:bg-gray-50 transition ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
        }`}
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon size={iconSize} className={iconColor} />
          <span className="text-gray-600 text-sm">{value || placeholder}</span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Icon Picker Dropdown */}
      {isOpen && !disabled && (
        <div 
          ref={pickerRef}
          className={`absolute z-50 mt-1 ${pickerWidth} bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden`}
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Icons Grid */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No icons found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : (
              <div className={`grid grid-cols-${pickerColumns} gap-2`}>
                {filteredIcons.map((icon) => {
                  const IconComponent = icon.component;
                  const isSelected = value === icon.name;
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => handleSelectIcon(icon.name)}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition flex flex-col items-center gap-1 ${
                        isSelected ? 'bg-green-50 border border-green-300' : ''
                      }`}
                      title={icon.name}
                    >
                      <IconComponent size={24} className={isSelected ? 'text-green-600' : 'text-gray-600'} />
                      <span className="text-[10px] text-gray-500 truncate w-full text-center">{icon.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer with count */}
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {filteredIcons.length} icons available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IconPicker;