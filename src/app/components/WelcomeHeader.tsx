import React from 'react';

type Insights = {
  actionsCompleted?: number;
  reflectionStreak?: number;
  assessmentsCompleted?: number;
};

export function WelcomeHeader({
  name,
  insights,
  isLoading = false,
}: {
  name?: string | null;
  insights?: Insights | null;
  isLoading?: boolean;
}) {
  const timeOfDayGreeting = getTimeOfDayGreeting();
  const firstName = name?.trim()?.split(' ')[0];
  const greeting = firstName ? `${timeOfDayGreeting}, ${firstName}` : `${timeOfDayGreeting}!`;

  if (isLoading || !insights) {
    return (
      <header style={{ padding: '24px 0', borderBottom: '1px solid #e6e6e6' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{greeting}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ height: 14, width: 240, background: '#e6e6e6', borderRadius: 6 }} />
            <div style={{ height: 14, width: 180, background: '#e6e6e6', borderRadius: 6 }} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header style={{ padding: '24px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 8, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a8a8a' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).replace(',', ' •')}
        </div>

        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600 }}>{greeting}</h1>
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto', fontSize: 16, lineHeight: 1.95, color: '#8a8a8a' }}>
          Deze maand heb je <DataBadge value={insights.actionsCompleted ?? 0} label="Voltooide acties" icon="actions" /> afgerond,
          een reflectie‑streak van <DataBadge value={insights.reflectionStreak ?? 0} label="maanden op rij" icon="streak" /> opgebouwd
          en <DataBadge value={insights.assessmentsCompleted ?? 0} label="assessments voltooid" icon="assessments" /> gedaan.
        </div>
      </div>
    </header>
  );
}

type BadgeIcon = 'actions' | 'streak' | 'assessments';

function DataBadge({ value, label, icon }: { value: number; label: string; icon: BadgeIcon }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '1px 8px',
      margin: '0 4px',
      borderRadius: 6,
      background: '#e0e0e0',
      color: '#444',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.08em',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', color: '#6f6f6f' }} aria-hidden="true">
        {renderBadgeIcon(icon)}
      </span>
      {value} {label}
    </span>
  );
}

function renderBadgeIcon(icon: BadgeIcon) {
  const common = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (icon === 'actions') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    );
  }

  if (icon === 'streak') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
        <line x1="4" y1="11" x2="20" y2="11" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4V2h6v2" />
      <polyline points="9 13 11 15 15 11" />
    </svg>
  );
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
