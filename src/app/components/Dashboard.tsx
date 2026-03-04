import { useApp } from '../data/AppContext';
import { roleLabels, categories, getCategoryForCompetency, getCompetency } from '../data/competencies';
import type { AssessmentEntry, MonthlyTask } from '../data/store';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import {
  monthNames,
  getGoalsDeadline,
  getReflectionDeadline,
  getLastDayOfMonth,
  isReflectionOpen,
  canSetGoalsForMonth,
  getPrevMonth,
  formatDeadline,
} from '../data/planning-logic';

export function Dashboard() {
  const { state, getActivePlan, getMonthlyPlan, getMonthlyReflection, getNow } = useApp();
  const now = getNow();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const activePlan = getActivePlan();

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

  const prevReflectionNeeded = !!prevMonthlyPlan && !prevReflection;
  const prevReflectionOpen = isReflectionOpen(prev.month, prev.year, now);
  const canSetGoals = canSetGoalsForMonth(!!prevMonthlyPlan, !!prevReflection);
  const goalsDeadline = getGoalsDeadline(currentMonth, currentYear);

  type ActionItem = {
    id: string;
    title: string;
    subtitle: string;
    to: string;
    priority?: 'high' | 'normal';
  };

  const actionItems: ActionItem[] = [];

  if (!activePlan) {
    if (state.assessments.length === 0) {
      actionItems.push({
        id: 'assessment',
        title: 'Doe een assessment',
        subtitle: 'Hoge prioriteit',
        to: '/assessment',
        priority: 'high',
      });
    }
    actionItems.push({
      id: 'dev-plan',
      title: 'Maak een ontwikkelplan',
      subtitle: 'Hoge prioriteit',
      to: '/development-plan',
      priority: 'high',
    });
  } else {
    if (prevReflectionNeeded && prevReflectionOpen) {
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
        subtitle: `Deadline ${formatDeadline(getReflectionDeadline(currentMonth, currentYear))}`,
        to: `/reflection/${currentMonth}/${currentYear}`,
        priority: 'high',
      });
    }
  }

  const lastTwoAssessments = [...state.assessments].reverse().slice(0, 2);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welkom! Je huidige rol is {roleLabels[state.role]}.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground">Je acties</h2>
            <p className="text-muted-foreground text-[0.85rem]">
              {actionItems.length} open {actionItems.length === 1 ? 'actie' : 'acties'}
            </p>
          </div>
          <Link
            to="/"
            className="text-[0.8rem] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Naar Home <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-200/60 flex items-center justify-center">
                ✓
              </div>
              <div>
                <div className="text-foreground text-[0.95rem] font-medium">Your Tasks</div>
                <div className="text-muted-foreground text-[0.8rem]">{actionItems.length} total tasks</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {actionItems.length === 0 ? (
            <div className="px-6 py-6 text-muted-foreground text-[0.85rem]">
              Geen open acties op dit moment.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {actionItems.map(item => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 rounded-full border border-border" />
                    <div>
                      <div className="text-foreground text-[0.95rem]">{item.title}</div>
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
      </section>

      {activePlan && currentMonthlyPlan && (
        <section className="space-y-4">
          <h2 className="text-foreground">Deze maand</h2>
          <ExecutingCard
            month={currentMonth}
            year={currentYear}
            tasks={currentMonthlyPlan.tasks || []}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground">Laatste assessments</h2>
          <Link
            to="/assessment"
            className="text-[0.8rem] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Bekijk alle assessments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {lastTwoAssessments.length > 0 ? (
          <div className="space-y-3">
            {lastTwoAssessments.map(assessment => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-[0.85rem]">
              Je hebt nog geen assessments gedaan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ExecutingCard({
  month,
  year,
  tasks,
}: {
  month: number;
  year: number;
  tasks: MonthlyTask[];
}) {
  const lastDay = getLastDayOfMonth(month, year);
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-foreground text-[1.1rem] mb-2">{monthNames[month]}</h3>
      <p className="text-muted-foreground text-[0.875rem] mb-5">
        Je hebt tot {lastDay.getDate()} {monthNames[month].toLowerCase()} om je plan uit te voeren.
      </p>
      <div className="space-y-5">
        {tasks.length === 0 && (
          <p className="text-[0.85rem] text-muted-foreground">Nog geen taken toegevoegd.</p>
        )}
        {tasks.map(task => {
          const comp = task.competencyId ? getCompetency(task.competencyId) : null;
          const cat = task.competencyId ? getCategoryForCompetency(task.competencyId) : null;
          return (
            <div key={task.id} className="flex items-start gap-3">
              <div
                className={`mt-1 h-4 w-4 rounded border ${
                  task.status === 'done' ? 'bg-foreground border-foreground' : 'border-border'
                }`}
              />
              <div className="flex-1">
                <div className={`text-[0.9rem] ${task.status === 'done' ? 'line-through opacity-60' : 'text-foreground'}`}>
                  {task.title}
                </div>
                {comp && cat && (
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {comp.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssessmentCard({ assessment }: { assessment: AssessmentEntry }) {
  const date = new Date(assessment.date);
  const formattedDate = date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const categoryAverages = categories.map(cat => {
    const scores = cat.competencies
      .map(compId => assessment.scores[compId])
      .filter((s): s is number => s !== undefined);
    const avg = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1).replace('.', ',')
      : '–';
    return { name: cat.name, color: cat.color, avg };
  });

  return (
    <div className="bg-card border border-border rounded-xl px-6 py-5">
      <p className="text-muted-foreground text-[0.8rem] mb-3">Gedaan door mij</p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        {categoryAverages.map(cat => (
          <div key={cat.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-foreground text-[0.85rem]">
              {cat.name}: {cat.avg}
            </span>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-[0.8rem] mt-3">{formattedDate}</p>
    </div>
  );
}

export default Dashboard;
