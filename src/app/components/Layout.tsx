import { NavLink, Outlet, useLocation } from 'react-router';
import { ClipboardCheck, Users, Target, Settings, Home } from 'lucide-react';
import { useApp } from '../data/AppContext';
import { useOpenActionCount } from '../hooks/useOpenActionCount';
import { OnboardingWidget } from './OnboardingWidget';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  matchPrefix?: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/development-plan', icon: Target, label: 'Ontwikkelplan' },
  { to: '/roles', icon: Users, label: 'Rollen & Verwachtingen' },
  { to: '/assessment', icon: ClipboardCheck, label: 'Assessments' },
  { to: '/prototype', icon: Settings, label: 'Prototype' },
];

export function Layout() {
  const { state, getNow, getActivePlan, getMonthlyPlan } = useApp();
  const location = useLocation();
  const isFaked = !!state.fakeDate;
  const now = getNow();
  const openActionCount = useOpenActionCount();
  const activePlan = getActivePlan();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthlyPlan = activePlan
    ? getMonthlyPlan(activePlan.id, currentMonth, currentYear)
    : undefined;
  const hasAssessment = state.assessments.length > 0;
  const hasPlan = !!activePlan && !!activePlan.assessmentId;
  const hasMonthPlan = !!currentMonthlyPlan;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[320px] bg-card flex flex-col shrink-0">
        <div className="px-6 pt-12 pb-0">
          <div className="flex items-center gap-2 px-4">
            <div className="w-8 h-8 bg-black rounded-[4px] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="7.25" stroke="white" strokeWidth="1.5" />
                <path d="M8 8L24 24" stroke="white" strokeLinecap="square" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="font-[var(--font-heading)] text-[32px] leading-[40px] font-medium text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Radia</span>
          </div>
        </div>

        <nav className="flex-1 px-6 pt-12 space-y-2">
          {navItems.map(item => {
            const isActive = item.matchPrefix
              ? location.pathname.startsWith(item.matchPrefix)
              : item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                className={
                  `flex items-center gap-2 px-4 py-3 rounded-[10px] transition-colors text-[16px] leading-[24px] font-medium ${
                    isActive
                      ? 'bg-foreground text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent'
                  }`
                }
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <item.icon className="w-6 h-6" />
                <span className="flex-1">{item.label}</span>
                {item.to === '/' && openActionCount > 0 && (
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-1 rounded-full bg-badge-yellow text-black text-[14px] leading-[20px] font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                    {openActionCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {isFaked && (
          <div className="px-6 pb-2">
            {null}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1120px] px-12 py-12">
          <Outlet />
        </div>
      </main>

      <OnboardingWidget
        tasks={[
          { id: 'take-assessment', title: 'Doe een assessment', route: '/assessment' },
          { id: 'create-development-plan', title: 'Maak een ontwikkelplan', route: '/development-plan' },
          { id: 'create-monthly-plan', title: 'Maak je maandplan', route: `/month/${currentMonth}/${currentYear}` },
        ]}
        completion={{
          'take-assessment': hasAssessment,
          'create-development-plan': hasPlan,
          'create-monthly-plan': hasMonthPlan,
        }}
      />
    </div>
  );
}
