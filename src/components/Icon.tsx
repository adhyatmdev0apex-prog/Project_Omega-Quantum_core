import { type LucideProps, Terminal, Network, Waves, Radar, Smartphone, Swords, Cpu, Container, Code2, Cloud, Library, FlaskConical, Crosshair, Download, Trophy, StickyNote, Search, Settings, Info, LayoutDashboard, BookOpen, Lock, CheckCircle2, Circle, Play, ChevronRight, ChevronDown, Menu, X, HardDrive, Activity, Wifi, Zap, Gauge, ArrowRight, FileText, Target, Award, Bell, User, Shield, Sparkles, RotateCcw, Type, Eye, EyeOff, Save, Plus, Filter, Star, Clock, Signal, Server, Database, Globe, Layers, Bookmark, Archive, Image, Volume2, Palette } from 'lucide-react';

// ===========================================================
// Icon registry — maps string names from the data registry to
// lucide-react components. Add new icons here as the platform grows.
// ===========================================================

const REGISTRY: Record<string, React.ComponentType<LucideProps>> = {
  Terminal, Network, Waves, Radar, Smartphone, Swords, Cpu, Container, Code2, Cloud,
  Library, FlaskConical, Crosshair, Download, Trophy, StickyNote, Search, Settings, Info,
  LayoutDashboard, BookOpen, Lock, CheckCircle2, Circle, Play, ChevronRight, ChevronDown,
  Menu, X, HardDrive, Activity, Wifi, Zap, Gauge, ArrowRight, FileText, Target, Award,
  Bell, User, Shield, Sparkles, RotateCcw, Type, Eye, EyeOff, Save, Plus, Filter, Star,
  Clock, Signal, Server, Database, Globe, Layers, Bookmark, Archive, Image, Volume2, Palette,
};

export type IconName = keyof typeof REGISTRY;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = REGISTRY[name] ?? Circle;
  return <Cmp {...props} />;
}
