import { createElement } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Brain,
  CalendarCheck,
  Clock,
  Compass,
  Crown,
  Flame,
  Footprints,
  GraduationCap,
  Hourglass,
  Medal,
  Rocket,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/* Los íconos del back son strings libres (ver achievement.seed.ts en
   pf-back): un nombre nuevo que este mapa no conozca cae en el ícono
   genérico (Medal), nunca rompe. Lo comparten el resumen del dashboard y la
   pantalla de logros. */
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  flame: Flame,
  fire: Flame,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  award: Award,
  star: Star,
  "book-open": BookOpen,
  rocket: Rocket,
  compass: Compass,
  "calendar-check": CalendarCheck,
  "badge-check": BadgeCheck,
  brain: Brain,
  clock: Clock,
  hourglass: Hourglass,
  medal: Medal,
  crown: Crown,
};

export function achievementIcon(name: string): LucideIcon {
  return ACHIEVEMENT_ICONS[name] ?? Medal;
}

/** El ícono ya renderizado: evita declarar `const Icon = achievementIcon(...)`
    adentro de un componente (react-hooks/static-components). */
export function renderAchievementIcon(name: string, className: string) {
  return createElement(achievementIcon(name), { className, "aria-hidden": true });
}
