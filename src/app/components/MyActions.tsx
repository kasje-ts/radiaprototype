import { Link, useNavigate } from 'react-router';
import { ArrowRight, ClipboardCheck, Target, CalendarDays } from 'lucide-react';
import { useApp } from '../data/AppContext';
import { MonthlyGoalsCard } from './MonthlyGoalsCard';
import { WelcomeHeader } from './WelcomeHeader';
import {
  monthNames,
  isReflectionOpen,
  getReflectionDeadline,
  formatDeadline,
  getPrevMonth,
  getGoalsDeadline,
  canSetGoalsForMonth,
} from '../data/planning-logic';

function ActionsCard({
  title,
  countLabel,
  items,
  emptyLabel,
}: {
  title: string;
  countLabel: string;
  items: { id: string; title: string; subtitle: string; to: string; priority?: 'high' | 'normal'; done?: boolean }[];
  emptyLabel: string;
}) {
  return (
    <div className="bg-card border border-border rounded-[16px] overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-200/60 flex items-center justify-center">
            ✓
          </div>
          <div>
            <div className="text-foreground text-[0.95rem] font-medium">{title}</div>
            <div className="text-muted-foreground text-[0.8rem]">{countLabel}</div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-6 text-muted-foreground text-[0.85rem]">
          {emptyLabel}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map(item => (
            <Link
              key={item.id}
              to={item.to}
              className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-6 w-6 rounded-full border flex items-center justify-center text-[12px] ${
                    item.done ? 'bg-foreground border-foreground text-primary-foreground' : 'border-border text-transparent'
                  }`}
                >
                  ✓
                </div>
                <div>
                  <div className={`text-[0.95rem] ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.title}
                  </div>
                  <div className={`text-[0.8rem] ${item.priority === 'high' ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function OnboardingRow({
  icon: Icon,
  title,
  subtitle,
  to,
  actionLabel,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  to: string;
  actionLabel: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <div className="text-foreground text-[0.95rem]">{title}</div>
          <div className="text-muted-foreground text-[0.85rem]">{subtitle}</div>
        </div>
      </div>
      {done ? (
        <button
          disabled
          className="px-4 py-2 rounded-full border border-border text-[0.85rem] text-muted-foreground cursor-not-allowed"
        >
          Done
        </button>
      ) : (
        <Link
          to={to}
          className="px-4 py-2 rounded-full bg-foreground text-primary-foreground text-[0.85rem] hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function MyActions() {
  const {
    state,
    getActivePlan,
    getMonthlyPlan,
    getMonthlyReflection,
    getNow,
    updateMonthlyPlan,
  } = useApp();
  const navigate = useNavigate();
  const now = getNow();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const activePlan = getActivePlan();
  const latestAssessment = state.assessments[state.assessments.length - 1];
  const totalActionsCompleted = state.monthlyPlans.reduce((sum, plan) => (
    sum + plan.tasks.filter(t => t.status === 'done').length
  ), 0);
  const reflectionStreak = (() => {
    const sorted = [...state.monthlyReflections].sort((a, b) =>
      a.year === b.year ? b.month - a.month : b.year - a.year
    );
    let streak = 0;
    let lastYear: number | null = null;
    let lastMonth: number | null = null;
    sorted.forEach(ref => {
      if (lastYear === null) {
        streak = 1;
        lastYear = ref.year;
        lastMonth = ref.month;
        return;
      }
      const expectedPrev = lastMonth === 0
        ? { year: (lastYear ?? 0) - 1, month: 11 }
        : { year: lastYear ?? 0, month: (lastMonth ?? 0) - 1 };
      if (ref.year === expectedPrev.year && ref.month === expectedPrev.month) {
        streak += 1;
        lastYear = ref.year;
        lastMonth = ref.month;
      }
    });
    return streak;
  })();
  const insights = {
    actionsCompleted: totalActionsCompleted,
    reflectionStreak,
    assessmentsCompleted: state.assessments.length,
  };

  const currentMonthlyPlan = activePlan
    ? getMonthlyPlan(activePlan.id, currentMonth, currentYear)
    : undefined;
  const currentReflection = currentMonthlyPlan
    ? getMonthlyReflection(currentMonthlyPlan.id)
    : undefined;

  const prev = getPrevMonth(currentMonth, currentYear);
  const prevMonthlyPlan = activePlan
    ? getMonthlyPlan(activePlan.id, prev.month, prev.year)
    : undefined;
  const prevReflection = prevMonthlyPlan
    ? getMonthlyReflection(prevMonthlyPlan.id)
    : undefined;

  const hasAssessment = state.assessments.length > 0;
  const hasPlan = !!activePlan && !!activePlan.assessmentId;
  const hasMonthPlan = !!currentMonthlyPlan;
  const onboardingComplete = hasAssessment && hasPlan && hasMonthPlan;

  const reflectionDeadline = getReflectionDeadline(currentMonth, currentYear);
  const goalsDeadline = getGoalsDeadline(currentMonth, currentYear);
  const canSetGoals = canSetGoalsForMonth(!!prevMonthlyPlan, !!prevReflection);

  const toggleTaskStatus = (taskId: string) => {
    if (!currentMonthlyPlan) return;
    const updated = currentMonthlyPlan.tasks.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? 'open' : 'done' } : t
    );
    updateMonthlyPlan(currentMonthlyPlan.id, updated);
  };

  type ActionItem = {
    id: string;
    title: string;
    subtitle: string;
    to: string;
    priority?: 'high' | 'normal';
    done?: boolean;
  };

  const onboardingItems: ActionItem[] = [];
  const actionItems: ActionItem[] = [];

  onboardingItems.push({
    id: 'assessment',
    title: 'Doe een assessment',
    subtitle: hasAssessment && latestAssessment
      ? `Laatste assessment: ${new Date(latestAssessment.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : 'Hoge prioriteit',
    to: '/assessment',
    priority: 'high',
    done: hasAssessment,
  });

  onboardingItems.push({
    id: 'dev-plan',
    title: 'Maak een ontwikkelplan',
    subtitle: hasPlan ? 'Gereed' : 'Hoge prioriteit',
    to: '/development-plan',
    priority: 'high',
    done: hasPlan,
  });

  onboardingItems.push({
    id: 'set-goals',
    title: `Stel maandplan op voor ${monthNames[currentMonth]}`,
    subtitle: hasMonthPlan ? 'Gereed' : `Deadline ${formatDeadline(goalsDeadline)}`,
    to: `/month/${currentMonth}/${currentYear}`,
    priority: 'high',
    done: hasMonthPlan,
  });

  if (onboardingComplete) {
    if (prevMonthlyPlan && !prevReflection && isReflectionOpen(prev.month, prev.year, now)) {
      actionItems.push({
        id: 'prev-reflection',
        title: `Schrijf reflectie voor ${monthNames[prev.month]}`,
        subtitle: 'Hoge prioriteit',
        to: `/reflection/${prev.month}/${prev.year}`,
        priority: 'high',
      });
    }

    if (!currentMonthlyPlan && canSetGoals) {
      actionItems.push({
        id: 'set-goals',
        title: `Stel maandplan op voor ${monthNames[currentMonth]}`,
        subtitle: `Deadline ${formatDeadline(goalsDeadline)}`,
        to: `/month/${currentMonth}/${currentYear}`,
        priority: 'high',
      });
    }

    const currentReflectionOpen = currentMonthlyPlan && !currentReflection && isReflectionOpen(currentMonth, currentYear, now);
    if (currentReflectionOpen) {
      actionItems.push({
        id: 'current-reflection',
        title: `Schrijf reflectie voor ${monthNames[currentMonth]}`,
        subtitle: `Deadline ${formatDeadline(reflectionDeadline)}`,
        to: `/reflection/${currentMonth}/${currentYear}`,
        priority: 'high',
      });
    }
  }

  return (
    <div className="space-y-10">
      <WelcomeHeader name="Kas" insights={insights} />

      {!onboardingComplete && (
        <section className="space-y-4">
          <div>
            <h2 className="text-foreground text-[1rem]">Opstarten</h2>
            <p className="text-muted-foreground text-[0.85rem]">
              Voltooi deze stappen om te starten.
            </p>
          </div>
          <div className="bg-card border border-border rounded-[16px] px-6 divide-y divide-border">
            <OnboardingRow
              icon={ClipboardCheck}
              title="Doe een assessment"
              subtitle={
                hasAssessment && latestAssessment
                  ? `Laatste assessment: ${new Date(latestAssessment.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Breng je huidige niveau in kaart.'
              }
              to="/assessment"
              actionLabel="Start"
              done={hasAssessment}
            />
            <OnboardingRow
              icon={Target}
              title="Maak een ontwikkelplan"
              subtitle={hasPlan ? 'Gekoppeld aan je assessment.' : 'Kies 1–2 focuscompetenties.'}
              to="/development-plan"
              actionLabel={hasAssessment ? 'Start' : 'Start'}
              done={hasPlan}
            />
            <OnboardingRow
              icon={CalendarDays}
              title={`Maak je maandplan voor ${monthNames[currentMonth].toLowerCase()}`}
              subtitle={hasMonthPlan ? 'Je eerste maandplan is klaar.' : `Deadline ${formatDeadline(goalsDeadline)}`}
              to={`/month/${currentMonth}/${currentYear}`}
              actionLabel="Start"
              done={hasMonthPlan}
            />
          </div>
        </section>
      )}

      {onboardingComplete && (
        <section className="space-y-4">
          <div>
            <h2 className="text-foreground text-[1rem]">Je acties</h2>
            <p className="text-muted-foreground text-[0.85rem]">
              {actionItems.length} open {actionItems.length === 1 ? 'actie' : 'acties'}
            </p>
          </div>
          <ActionsCard
            title="Your Tasks"
            countLabel={`${actionItems.length} total tasks`}
            items={actionItems}
            emptyLabel="Geen open acties op dit moment."
          />
        </section>
      )}

      {hasMonthPlan && (
        <section className="space-y-3">
          <h2 className="text-foreground text-[1rem]">Deze maand</h2>
          {activePlan && currentMonthlyPlan && (
            <MonthlyGoalsCard
              month={currentMonth}
              year={currentYear}
              goals={activePlan.goals}
              monthlyPlan={currentMonthlyPlan}
              onEdit={() => navigate(`/month/${currentMonth}/${currentYear}`)}
              onToggleTask={toggleTaskStatus}
            />
          )}
        </section>
      )}
    </div>
  );
}

export default MyActions;
