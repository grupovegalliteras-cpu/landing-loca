import {
  AlarmClock, BellRing, Bug, Building2, CalendarClock, CalendarRange, Camera, ClipboardList, CreditCard, FileCheck2,
  FileSignature, FileText, Fingerprint, Globe, Hammer, HardHat, Kanban, Landmark, LayoutDashboard, LayoutPanelLeft,
  Leaf, LifeBuoy, Mail, Megaphone, MessageCircle, MessagesSquare, Package, Palmtree, PhoneIncoming, Plug, QrCode,
  Receipt, Repeat, Route, ScrollText, ShieldCheck, Sparkles, SprayCan, Star, SunMedium, Thermometer, Timer, TrendingUp,
  Truck, Users, Waves, Workflow, Wrench, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  AlarmClock, BellRing, Bug, Building2, CalendarClock, CalendarRange, Camera, ClipboardList, CreditCard, FileCheck2,
  FileSignature, FileText, Fingerprint, Globe, Hammer, HardHat, Kanban, Landmark, LayoutDashboard, LayoutPanelLeft,
  Leaf, LifeBuoy, Mail, Megaphone, MessageCircle, MessagesSquare, Package, Palmtree, PhoneIncoming, Plug, QrCode,
  Receipt, Repeat, Route, ScrollText, ShieldCheck, Sparkles, SprayCan, Star, SunMedium, Thermometer, Timer, TrendingUp,
  Truck, Users, Waves, Workflow, Wrench,
};

export function Icon({ name, className, strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
  const C = MAP[name] ?? Sparkles;
  return <C className={className} strokeWidth={strokeWidth} aria-hidden />;
}
