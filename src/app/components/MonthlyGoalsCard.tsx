import { Edit3, Repeat } from 'lucide-react';
import { getCompetency, getCategoryForCompetency } from '../data/competencies';
import type { DevelopmentGoal, MonthlyPlan } from '../data/store';
import { monthNames } from '../data/planning-logic';

type MonthlyGoalsCardProps = {
  month: number;
  year: number;
  goals: DevelopmentGoal[];
  monthlyPlan: MonthlyPlan;
  onEdit?: () => void;
  onToggleTask?: (taskId: string) => void;
};

export function MonthlyGoalsCard({
  month,
  year,
  goals,
  monthlyPlan,
  onEdit,
  onToggleTask,
}: MonthlyGoalsCardProps) {
  return (
    <div className="bg-card rounded-[14px] p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-foreground">
          Plan voor {monthNames[month]} {year}
        </h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Bewerken
          </button>
        )}
      </div>

      <div className="space-y-4">
        {goals.map(goal => {
          const comp = getCompetency(goal.competencyId);
          const cat = getCategoryForCompetency(goal.competencyId);
          const tasksForGoal = monthlyPlan.tasks.filter(t => t.competencyId === goal.competencyId);
          return (
            <div key={goal.competencyId} className="border border-border rounded-[14px] p-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
                  <span className="inline-flex items-center gap-2 bg-muted/60 text-muted-foreground px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {comp.name}
                  </span>
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                {goal.goal ? (
                  <p className="text-foreground text-[1.05rem] leading-relaxed font-medium">
                    {goal.goal}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Geen doel beschreven</p>
                )}
              </div>

              <div className="mt-4">
                {tasksForGoal.length === 0 ? (
                  <span className="inline-flex text-[0.8rem] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    Nog geen acties voor deze maand
                  </span>
                ) : (
                  <div className="divide-y divide-border/50">
                    {tasksForGoal.map(task => {
                      const isDone = task.status === 'done';
                      const taskToggle = (
                        <button
                          onClick={() => onToggleTask?.(task.id)}
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            isDone ? 'bg-foreground border-foreground text-primary-foreground' : 'border-border text-transparent'
                          }`}
                          disabled={!onToggleTask}
                        >
                          ✓
                        </button>
                      );
                      return (
                        <div key={task.id} className="flex items-center gap-3 py-2">
                          {onToggleTask ? (
                            taskToggle
                          ) : (
                            <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                              isDone ? 'bg-foreground border-foreground text-primary-foreground' : 'border-border text-transparent'
                            }`}>
                              ✓
                            </span>
                          )}
                          <span className={`text-foreground ${isDone ? 'line-through opacity-60' : ''}`}>
                            {task.title}
                          </span>
                          <span className={`ml-auto inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[0.75rem] border ${
                            task.type === 'recurring'
                              ? 'border-foreground text-foreground'
                              : 'border-border text-muted-foreground'
                          }`}>
                            <Repeat className="w-3.5 h-3.5" />
                            Recurring
                          </span>
                        </div>
                      );
                    })}
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
