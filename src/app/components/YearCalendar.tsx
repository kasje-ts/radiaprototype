import { useApp } from '../data/AppContext';
import { useNavigate } from 'react-router';
import { CheckCircle2, Lock, CalendarDays, MessageSquare } from 'lucide-react';

const monthNames = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

export function YearCalendar() {
  const { getActivePlan, getMonthlyPlan, getMonthlyReflection, getNow } = useApp();
  const navigate = useNavigate();

  const activePlan = getActivePlan();
  const now = getNow();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (!activePlan) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-foreground">Jaarplanning</h1>
          <p className="text-muted-foreground">
            Maak eerst een ontwikkelplan aan om je jaarplanning te bekijken.
          </p>
        </div>
        <div className="bg-card rounded-[14px] p-12 text-center">
          <button
            onClick={() => navigate('/development-plan')}
            className="px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity"
          >
            Ontwikkelplan maken
          </button>
        </div>
      </div>
    );
  }

  const planYear = activePlan.year;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-muted-foreground text-[14px]">Kalenderoverzicht</p>
          <h1 className="text-foreground">Jaarplanning {planYear}</h1>
          <p className="text-muted-foreground">
            Klik op een maand om het te openen en in te vullen.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-100" />
            <span className="text-muted-foreground text-[14px]">Plan + Reflectie</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-blue-100" />
            <span className="text-muted-foreground text-[14px]">Plan klaar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-accent" />
            <span className="text-muted-foreground text-[14px]">Open</span>
          </div>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 12 }, (_, i) => i).map(month => {
          const monthlyPlan = getMonthlyPlan(activePlan.id, month, planYear);
          const reflection = monthlyPlan ? getMonthlyReflection(monthlyPlan.id) : undefined;

          const hasPlan = !!monthlyPlan;
          const hasReflection = !!reflection;
          const isCurrent = month === currentMonth && planYear === currentYear;
          const isPast = planYear < currentYear || (planYear === currentYear && month < currentMonth);
          const isUpcoming = planYear > currentYear || (planYear === currentYear && month > currentMonth);
          const nextMonth = currentMonth + 1;
          const isFutureLocked = isUpcoming && !(planYear === currentYear && month === nextMonth);
          const isNextMonth = planYear === currentYear && month === nextMonth;

          let cardClass = 'bg-card rounded-[14px] p-6 transition-all ';
          if (isCurrent) {
            cardClass += 'ring-2 ring-foreground/10';
          } else if (hasPlan && hasReflection) {
            cardClass += 'bg-emerald-50/30';
          } else if (hasPlan) {
            cardClass += 'bg-blue-50/20';
          } else if (isFutureLocked) {
            cardClass += 'opacity-50';
          }

          const deadlineDay = 7;

          return (
            <div
              key={month}
              className={cardClass + (!isFutureLocked ? ' cursor-pointer hover:shadow-md' : '')}
              onClick={() => !isFutureLocked && navigate(`/month/${month}/${planYear}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-foreground">{monthNames[month]}</h4>
                  <span className="text-muted-foreground text-[14px]">{planYear}</span>
                </div>
                {isCurrent && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-foreground text-primary-foreground">
                    Nu
                  </span>
                )}
              </div>

              {isFutureLocked && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="text-[14px]">Beschikbaar wanneer de maand begint</span>
                  </div>
                  <p className="text-muted-foreground text-[14px]">
                    Plan deadline: {deadlineDay} {monthNames[month].toLowerCase()} {planYear}
                  </p>
                </div>
              )}

              {!isFutureLocked && (
                <div className="space-y-2">
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-[14px] ${
                      hasPlan
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-accent text-muted-foreground'
                    }`}
                  >
                    <span>Maandplan</span>
                    {hasPlan ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Klaar
                      </span>
                    ) : (
                      <span>Open</span>
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-[14px] ${
                      hasReflection
                        ? 'bg-emerald-50 text-emerald-800'
                        : (isCurrent || isPast) && hasPlan && !hasReflection
                          ? 'bg-badge-yellow/20 text-foreground'
                          : 'bg-accent text-muted-foreground'
                    }`}
                  >
                    <span>Reflectie</span>
                    {hasReflection ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Klaar
                      </span>
                    ) : (isCurrent || isPast) && hasPlan ? (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Open
                      </span>
                    ) : (
                      <span>Open</span>
                    )}
                  </div>

                  {isNextMonth && !hasPlan && (
                    <p className="text-muted-foreground text-[14px] mt-1">
                      Plan deadline: {deadlineDay} {monthNames[month].toLowerCase()} {planYear}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
