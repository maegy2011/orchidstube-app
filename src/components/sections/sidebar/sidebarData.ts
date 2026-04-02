import {
  Home,
  PlaySquare,
  StickyNote,
  Heart,
  History,
  Settings,
  HelpCircle,
  MessageSquarePlus,
  Headphones,
  Clock,
  Zap,
  LayoutGrid,
  Compass,
  FolderOpen,
  GraduationCap,
  Code2,
  FlaskConical,
  BookOpen,
  Music2,
  Gamepad2,
  Trophy,
  Film,
  MoreHorizontal,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════
export const DESKTOP_BREAKPOINT = 1024;
export const FULL_WIDTH = 240;
export const MINI_WIDTH = 72;
export const HEADER_HEIGHT = 64;
export const BAR_HEIGHT_MOBILE = 40;
export const BAR_HEIGHT_DESKTOP = 36;
export const COLLAPSE_STORAGE_KEY = "orchids_sidebar_sections";

// ═══════════════════════════════════════════════════════
// Navigation Types
// ═══════════════════════════════════════════════════════
export interface NavItem {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  isCategoryLink?: boolean;
  categoryKey?: string;
}

export interface NavSection {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  items: NavItem[];
  showInCollapsed?: boolean;
  defaultCollapsed?: boolean;
}

// ═══════════════════════════════════════════════════════
// Navigation Sections
// ═══════════════════════════════════════════════════════
export const NAV_SECTIONS: NavSection[] = [
  {
    key: "browse",
    labelKey: "browse",
    icon: LayoutGrid,
    showInCollapsed: true,
    items: [
      { id: "home", icon: Home, labelKey: "home", href: "/" },
      { id: "shorts", icon: Zap, labelKey: "shorts", href: "/shorts", badge: "HOT", badgeColor: "bg-red-600" },
      { id: "subscriptions", icon: PlaySquare, labelKey: "subscriptions", href: "/subscriptions" },
    ],
  },
  {
    key: "explore",
    labelKey: "explore",
    icon: Compass,
    showInCollapsed: false,
    defaultCollapsed: false,
    items: [
      { id: "explore-education", icon: GraduationCap, labelKey: "education", href: "/?cat=education", isCategoryLink: true, categoryKey: "education" },
      { id: "explore-programming", icon: Code2, labelKey: "programming", href: "/?cat=programming", isCategoryLink: true, categoryKey: "programming" },
      { id: "explore-science", icon: FlaskConical, labelKey: "science", href: "/?cat=science", isCategoryLink: true, categoryKey: "science" },
      { id: "explore-quran", icon: BookOpen, labelKey: "quran", href: "/?cat=quran", isCategoryLink: true, categoryKey: "quran" },
      { id: "explore-music", icon: Music2, labelKey: "music", href: "/?cat=music", isCategoryLink: true, categoryKey: "music" },
      { id: "explore-gaming", icon: Gamepad2, labelKey: "gaming", href: "/?cat=gaming", isCategoryLink: true, categoryKey: "gaming" },
      { id: "explore-sports", icon: Trophy, labelKey: "sports", href: "/?cat=sports", isCategoryLink: true, categoryKey: "sports" },
      { id: "explore-documentary", icon: Film, labelKey: "documentary", href: "/?cat=documentary", isCategoryLink: true, categoryKey: "documentary" },
    ],
  },
  {
    key: "library",
    labelKey: "library",
    icon: FolderOpen,
    showInCollapsed: true,
    items: [
      { id: "history", icon: History, labelKey: "history", href: "/history" },
      { id: "favorites", icon: Heart, labelKey: "favorites", href: "/favorites" },
      { id: "watch-later", icon: Clock, labelKey: "watchLater", href: "/watch-later" },
      { id: "notes", icon: StickyNote, labelKey: "notes", href: "/notes" },
    ],
  },
  {
    key: "support",
    labelKey: "more",
    icon: MoreHorizontal,
    showInCollapsed: false,
    items: [
      { id: "help", icon: HelpCircle, labelKey: "help", href: "/help" },
      { id: "feedback", icon: MessageSquarePlus, labelKey: "feedback", href: "/feedback" },
      { id: "support", icon: Headphones, labelKey: "support", href: "/support" },
      { id: "settings", icon: Settings, labelKey: "settings", href: "/settings" },
    ],
  },
];
