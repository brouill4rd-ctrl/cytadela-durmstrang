import React from 'react';
import {
  Skull,
  Sun,
  Wand2,
  Gem,
  FlaskConical,
  Leaf,
  PawPrint,
  ShieldCheck,
  Shield,
  Scroll,
  Compass,
  Eye,
  Binary,
  Feather,
  Wind,
  Swords,
  Flame,
  Brain,
  Ghost,
  BookOpen,
  Sparkles,
  Zap,
  Layers,
  MoonStar
} from 'lucide-react';

/**
 * Returns tailored icon and styling tokens for each Durmstrang subject / category
 */
export function getSubjectVisuals(subjectOrIdOrCategory) {
  const rawId = (typeof subjectOrIdOrCategory === 'string'
    ? subjectOrIdOrCategory
    : subjectOrIdOrCategory?.id || subjectOrIdOrCategory?.category || ''
  ).toLowerCase();

  const code = (typeof subjectOrIdOrCategory === 'object' ? subjectOrIdOrCategory?.code : '') || '';
  const category = (typeof subjectOrIdOrCategory === 'object' ? subjectOrIdOrCategory?.category : '') || '';

  // 1. Exact ID & Code Mappings
  if (rawId.includes('czarna-magia') || code.includes('DARK')) {
    return {
      Icon: Skull,
      color: '#d8b4fe',
      bg: 'rgba(168, 85, 247, 0.16)',
      border: 'rgba(168, 85, 247, 0.4)',
      shadow: '0 0 14px rgba(168, 85, 247, 0.25)'
    };
  }

  if (rawId.includes('biala-magia') || code.includes('WHITE')) {
    return {
      Icon: Sun,
      color: '#fef08a',
      bg: 'rgba(234, 179, 8, 0.16)',
      border: 'rgba(234, 179, 8, 0.4)',
      shadow: '0 0 14px rgba(234, 179, 8, 0.25)'
    };
  }

  if (rawId.includes('zaklecia') || code.includes('SPELL')) {
    return {
      Icon: Wand2,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.16)',
      border: 'rgba(56, 189, 248, 0.4)',
      shadow: '0 0 14px rgba(56, 189, 248, 0.25)'
    };
  }

  if (rawId.includes('transmutacja') || code.includes('TRANS')) {
    return {
      Icon: Gem,
      color: '#fcd34d',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.4)',
      shadow: '0 0 14px rgba(245, 158, 11, 0.25)'
    };
  }

  if (rawId.includes('eliksiry') || code.includes('POT')) {
    return {
      Icon: FlaskConical,
      color: '#2dd4bf',
      bg: 'rgba(45, 212, 191, 0.16)',
      border: 'rgba(45, 212, 191, 0.4)',
      shadow: '0 0 14px rgba(45, 212, 191, 0.25)'
    };
  }

  if (rawId.includes('zielarstwo') || code.includes('HERB')) {
    return {
      Icon: Leaf,
      color: '#4ade80',
      bg: 'rgba(34, 197, 94, 0.16)',
      border: 'rgba(34, 197, 94, 0.4)',
      shadow: '0 0 14px rgba(34, 197, 94, 0.25)'
    };
  }

  if (rawId.includes('magizoologia') || code.includes('BEAST')) {
    return {
      Icon: PawPrint,
      color: '#fb923c',
      bg: 'rgba(249, 115, 22, 0.16)',
      border: 'rgba(249, 115, 22, 0.4)',
      shadow: '0 0 14px rgba(249, 115, 22, 0.25)'
    };
  }

  if (rawId.includes('obrona') || code.includes('DEF')) {
    return {
      Icon: ShieldCheck,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.16)',
      border: 'rgba(239, 68, 68, 0.4)',
      shadow: '0 0 14px rgba(239, 68, 68, 0.25)'
    };
  }

  if (rawId.includes('historia') || code.includes('HIST')) {
    return {
      Icon: Scroll,
      color: '#fde047',
      bg: 'rgba(234, 179, 8, 0.15)',
      border: 'rgba(234, 179, 8, 0.38)',
      shadow: '0 0 14px rgba(234, 179, 8, 0.2)'
    };
  }

  if (rawId.includes('astronomia') || code.includes('ASTRO')) {
    return {
      Icon: Compass,
      color: '#818cf8',
      bg: 'rgba(99, 102, 241, 0.16)',
      border: 'rgba(99, 102, 241, 0.4)',
      shadow: '0 0 14px rgba(99, 102, 241, 0.25)'
    };
  }

  if (rawId.includes('wrozbiarstwo') || code.includes('DIV')) {
    return {
      Icon: Eye,
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.16)',
      border: 'rgba(168, 85, 247, 0.4)',
      shadow: '0 0 14px rgba(168, 85, 247, 0.25)'
    };
  }

  if (rawId.includes('numerologia') || code.includes('NUM')) {
    return {
      Icon: Binary,
      color: '#67e8f9',
      bg: 'rgba(6, 182, 212, 0.16)',
      border: 'rgba(6, 182, 212, 0.4)',
      shadow: '0 0 14px rgba(6, 182, 212, 0.25)'
    };
  }

  if (rawId.includes('runy') || code.includes('RUNE')) {
    return {
      Icon: Feather,
      color: '#fcd34d',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.4)',
      shadow: '0 0 14px rgba(245, 158, 11, 0.25)'
    };
  }

  if (rawId.includes('latanie') || code.includes('FLY')) {
    return {
      Icon: Wind,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.16)',
      border: 'rgba(56, 189, 248, 0.4)',
      shadow: '0 0 14px rgba(56, 189, 248, 0.25)'
    };
  }

  if (rawId.includes('klatwy') || code.includes('DUEL')) {
    return {
      Icon: Swords,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.16)',
      border: 'rgba(239, 68, 68, 0.4)',
      shadow: '0 0 14px rgba(239, 68, 68, 0.25)'
    };
  }

  if (rawId.includes('smok') || code.includes('DRAG')) {
    return {
      Icon: Flame,
      color: '#fb923c',
      bg: 'rgba(249, 115, 22, 0.16)',
      border: 'rgba(249, 115, 22, 0.4)',
      shadow: '0 0 14px rgba(249, 115, 22, 0.25)'
    };
  }

  if (rawId.includes('rytual') || code.includes('RITU')) {
    return {
      Icon: Flame,
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.16)',
      border: 'rgba(168, 85, 247, 0.4)',
      shadow: '0 0 14px rgba(168, 85, 247, 0.25)'
    };
  }

  if (rawId.includes('psycholog') || code.includes('PSY')) {
    return {
      Icon: Brain,
      color: '#d8b4fe',
      bg: 'rgba(192, 132, 252, 0.16)',
      border: 'rgba(192, 132, 252, 0.4)',
      shadow: '0 0 14px rgba(192, 132, 252, 0.25)'
    };
  }

  if (rawId.includes('trucizn') || code.includes('TOX')) {
    return {
      Icon: Skull,
      color: '#4ade80',
      bg: 'rgba(34, 197, 94, 0.16)',
      border: 'rgba(34, 197, 94, 0.4)',
      shadow: '0 0 14px rgba(34, 197, 94, 0.25)'
    };
  }

  if (rawId.includes('mity') || code.includes('MYTH')) {
    return {
      Icon: BookOpen,
      color: '#fde047',
      bg: 'rgba(234, 179, 8, 0.16)',
      border: 'rgba(234, 179, 8, 0.4)',
      shadow: '0 0 14px rgba(234, 179, 8, 0.25)'
    };
  }

  if (rawId.includes('stworzenia') || rawId.includes('noc') || code.includes('NIGHT')) {
    return {
      Icon: Ghost,
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.16)',
      border: 'rgba(148, 163, 184, 0.4)',
      shadow: '0 0 14px rgba(148, 163, 184, 0.25)'
    };
  }

  // 2. Fallbacks by Category Name
  if (category.includes('Zakazan')) {
    return { Icon: Skull, color: '#d8b4fe', bg: 'rgba(168, 85, 247, 0.16)', border: 'rgba(168, 85, 247, 0.4)', shadow: '0 0 14px rgba(168, 85, 247, 0.25)' };
  }
  if (category.includes('Praktycz')) {
    return { Icon: Wand2, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.4)', shadow: '0 0 14px rgba(56, 189, 248, 0.25)' };
  }
  if (category.includes('Alchem') || category.includes('Eliksir')) {
    return { Icon: FlaskConical, color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.16)', border: 'rgba(45, 212, 191, 0.4)', shadow: '0 0 14px rgba(45, 212, 191, 0.25)' };
  }
  if (category.includes('Przyrod')) {
    return { Icon: Leaf, color: '#4ade80', bg: 'rgba(34, 197, 94, 0.16)', border: 'rgba(34, 197, 94, 0.4)', shadow: '0 0 14px rgba(34, 197, 94, 0.25)' };
  }
  if (category.includes('Obron') || category.includes('Bojow')) {
    return { Icon: ShieldCheck, color: '#f87171', bg: 'rgba(239, 68, 68, 0.16)', border: 'rgba(239, 68, 68, 0.4)', shadow: '0 0 14px rgba(239, 68, 68, 0.25)' };
  }
  if (category.includes('Kosmolog') || category.includes('Astron')) {
    return { Icon: MoonStar, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.16)', border: 'rgba(99, 102, 241, 0.4)', shadow: '0 0 14px rgba(99, 102, 241, 0.25)' };
  }
  if (category.includes('Tajemn')) {
    return { Icon: Eye, color: '#c084fc', bg: 'rgba(168, 85, 247, 0.16)', border: 'rgba(168, 85, 247, 0.4)', shadow: '0 0 14px rgba(168, 85, 247, 0.25)' };
  }
  if (category.includes('Ścisł')) {
    return { Icon: Binary, color: '#67e8f9', bg: 'rgba(6, 182, 212, 0.16)', border: 'rgba(6, 182, 212, 0.4)', shadow: '0 0 14px rgba(6, 182, 212, 0.25)' };
  }
  if (category.includes('Materii')) {
    return { Icon: Gem, color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.4)', shadow: '0 0 14px rgba(245, 158, 11, 0.25)' };
  }

  // Default
  return {
    Icon: BookOpen,
    color: '#ffe8aa',
    bg: 'rgba(197, 159, 78, 0.16)',
    border: 'rgba(197, 159, 78, 0.4)',
    shadow: '0 0 14px rgba(197, 159, 78, 0.25)'
  };
}

export const SubjectIcon = ({ subject, size = 24, containerSize = 52, showContainer = true, style = {} }) => {
  const visuals = getSubjectVisuals(subject);
  const IconComponent = visuals.Icon;

  if (!showContainer) {
    return <IconComponent size={size} color={visuals.color} style={style} />;
  }

  return (
    <div
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: visuals.bg,
        border: `1px solid ${visuals.border}`,
        boxShadow: visuals.shadow,
        color: visuals.color,
        flexShrink: 0,
        ...style
      }}
    >
      <IconComponent size={size} color={visuals.color} />
    </div>
  );
};
