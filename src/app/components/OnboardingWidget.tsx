import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export type OnboardingTaskId =
  | 'take-assessment'
  | 'create-development-plan'
  | 'create-monthly-plan';

export interface TaskDefinition {
  id: OnboardingTaskId;
  title: string;
  route: string;
}

export interface OnboardingWidgetProps {
  tasks: TaskDefinition[];
  completion: Record<OnboardingTaskId, boolean>;
  hiddenRoutePrefixes?: string[];
  storageKey?: string;
  onAllComplete?: () => void;
}

const DEFAULT_STORAGE_KEY = 'onboarding_widget_collapsed';

export function OnboardingWidget({
  tasks,
  completion,
  hiddenRoutePrefixes = [],
  storageKey = DEFAULT_STORAGE_KEY,
  onAllComplete,
}: OnboardingWidgetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapseInitialized, setCollapseInitialized] = useState(false);

  const shouldHideForRoute = hiddenRoutePrefixes.some(prefix =>
    location.pathname.startsWith(prefix)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
    setCollapseInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (!collapseInitialized || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, isCollapsed ? 'true' : 'false');
  }, [isCollapsed, collapseInitialized, storageKey]);

  const taskStates = useMemo(() => {
    let allPreviousComplete = true;
    return tasks.map(task => {
      const completed = !!completion[task.id];
      const locked = !completed && !allPreviousComplete;
      const active = !completed && !locked;
      if (!completed) {
        allPreviousComplete = false;
      }
      return { ...task, completed, locked, active };
    });
  }, [tasks, completion]);

  const totalTasks = taskStates.length;
  const completedTasks = taskStates.filter(task => task.completed).length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const allTasksComplete = totalTasks > 0 && completedTasks === totalTasks;

  useEffect(() => {
    if (!allTasksComplete) return;
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(storageKey);
    onAllComplete?.();
  }, [allTasksComplete, onAllComplete, storageKey]);

  if (shouldHideForRoute) return null;
  if (allTasksComplete) return null;

  const handleTaskClick = (task: (typeof taskStates)[number]) => {
    if (task.locked) return;
    navigate(task.route);
    if (task.active) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(280px,calc(100vw-2rem))] sm:bottom-6 sm:right-6">
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex w-full items-center justify-between rounded-full border border-border bg-card px-4 py-2 text-left text-foreground shadow-sm transition hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Getting started
            </span>
            <div className="h-1.5 w-16 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          style={{ transformOrigin: 'bottom right' }}
        >
          <div className="space-y-3 px-4 pt-4 pb-2">
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>Getting started</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {completedTasks}/{totalTasks}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                  aria-label="Collapse onboarding tasks"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {taskStates.map(task => (
                <span
                  key={task.id}
                  className={clsx(
                    'h-1 w-full rounded-full bg-muted',
                    task.completed && 'bg-foreground'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="mt-1 rounded-t-2xl border-t border-border bg-card px-4 py-3">
            <ul className="space-y-2">
              {taskStates.map(task => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => handleTaskClick(task)}
                    disabled={task.locked}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed',
                      task.completed
                        ? 'border-border bg-muted text-muted-foreground'
                        : 'border-border bg-background text-foreground hover:bg-accent',
                      task.locked && 'text-muted-foreground/50'
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-foreground" />
                      ) : (
                        <Circle
                          className={clsx(
                            'h-5 w-5 text-muted-foreground',
                            task.locked && 'text-muted-foreground/40'
                          )}
                        />
                      )}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      {task.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
