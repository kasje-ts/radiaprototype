import { useState, useCallback } from 'react';
import type { Role, CompetencyId, AssessmentScore } from './competencies';
import { competencies } from './competencies';

export interface AssessmentEntry {
  id: string;
  date: string;
  source: 'self';
  scores: Partial<Record<CompetencyId, AssessmentScore>>;
}

export interface DevelopmentGoal {
  competencyId: CompetencyId;
  goal: string;
}

export interface DevelopmentPlan {
  id: string;
  year: number;
  assessmentId: string;
  validFrom: string;
  validTo: string;
  goals: DevelopmentGoal[];
  createdAt: string;
}

export interface MonthlyTask {
  id: string;
  title: string;
  type: 'recurring' | 'one-time';
  status: 'open' | 'done';
  competencyId?: CompetencyId;
  carriedFromTaskId?: string;
  createdAt: string;
}

export interface MonthlyPlan {
  id: string;
  developmentPlanId: string;
  month: number; // 0-11
  year: number;
  tasks: MonthlyTask[];
  createdAt: string;
}

export interface ReflectionNoteEntry {
  id: string;
  type: 'text' | 'link' | 'file';
  content: string;
  createdAt: string;
  meta?: {
    fileType?: string;
  };
}

export interface MonthlyReflection {
  id: string;
  monthlyPlanId: string;
  developmentPlanId: string;
  month: number;
  year: number;
  reflections: {
    competencyId: CompetencyId;
    progressFeeling: 'veel' | 'redelijk' | 'weinig' | 'geen';
    notes?: ReflectionNoteEntry[];
    whatDone: string;
    whatLearned: string;
    whatMissed: string;
  }[];
  createdAt: string;
}

export interface AppState {
  role: Role;
  assessments: AssessmentEntry[];
  developmentPlans: DevelopmentPlan[];
  monthlyPlans: MonthlyPlan[];
  monthlyReflections: MonthlyReflection[];
  demoProfile?: boolean;
  fakeDate?: string; // ISO string for prototype testing
}

const STORAGE_KEY = 'po-development-app';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function addOneYear(date: Date): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

function normalizeState(raw: AppState): AppState {
  const assessments = (raw.assessments || []).map(a => ({
    ...a,
    source: a.source ?? 'self',
  }));
  const latestAssessmentId = assessments.length
    ? assessments[assessments.length - 1].id
    : '';

  const developmentPlans = (raw.developmentPlans || []).map(p => {
    const validFrom = p.validFrom ?? p.createdAt ?? new Date(p.year, 0, 1).toISOString();
    const validTo = p.validTo ?? addOneYear(new Date(validFrom)).toISOString();
    const assessmentId = p.assessmentId ?? latestAssessmentId;
    return {
      ...p,
      assessmentId,
      validFrom,
      validTo,
    };
  });

  const monthlyPlans = (raw.monthlyPlans || []).map(mp => {
    let tasks = (mp as MonthlyPlan).tasks;
    if (!tasks) {
      const legacyPlans = (mp as { plans?: Partial<Record<CompetencyId, string>> }).plans;
      tasks = legacyPlans
        ? Object.entries(legacyPlans)
            .filter(([, text]) => text && String(text).trim().length > 0)
            .map(([compId, text]) => ({
              id: generateId(),
              title: String(text).trim(),
              type: 'one-time' as const,
              status: 'open' as const,
              competencyId: compId as CompetencyId,
              createdAt: mp.createdAt ?? new Date().toISOString(),
            }))
        : [];
    }
    return {
      ...mp,
      tasks,
    };
  });

  return {
    role: raw.role ?? 'junior',
    assessments,
    developmentPlans,
    monthlyPlans,
    monthlyReflections: raw.monthlyReflections || [],
    demoProfile: raw.demoProfile ?? false,
    fakeDate: raw.fakeDate,
  };
}

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeState(JSON.parse(stored));
  } catch { /* ignore */ }
  return {
    role: 'junior',
    assessments: [],
    developmentPlans: [],
    monthlyPlans: [],
    monthlyReflections: [],
    demoProfile: false,
  };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const setRole = useCallback((role: Role) => {
    update(s => ({ ...s, role }));
  }, [update]);

  const addAssessment = useCallback((scores: Partial<Record<CompetencyId, AssessmentScore>>) => {
    const entry: AssessmentEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      source: 'self',
      scores,
    };
    update(s => ({
      ...s,
      assessments: [...s.assessments, entry],
    }));
    return entry;
  }, [update]);

  const addDevelopmentPlan = useCallback((year: number, goals: DevelopmentGoal[], assessmentId: string, validFrom: string) => {
    const validTo = addOneYear(new Date(validFrom)).toISOString();
    update(s => ({
      ...s,
      developmentPlans: [...s.developmentPlans, {
        id: generateId(),
        year,
        assessmentId,
        validFrom,
        validTo,
        goals,
        createdAt: new Date().toISOString(),
      }],
    }));
  }, [update]);

  const updateDevelopmentPlan = useCallback((planId: string, goals: DevelopmentGoal[], assessmentId: string) => {
    update(s => ({
      ...s,
      developmentPlans: s.developmentPlans.map(p =>
        p.id === planId ? { ...p, goals, assessmentId } : p
      ),
    }));
  }, [update]);

  const addMonthlyPlan = useCallback((developmentPlanId: string, month: number, year: number, tasks: MonthlyTask[]) => {
    update(s => ({
      ...s,
      monthlyPlans: [...s.monthlyPlans, {
        id: generateId(),
        developmentPlanId,
        month,
        year,
        tasks,
        createdAt: new Date().toISOString(),
      }],
    }));
  }, [update]);

  const updateMonthlyPlan = useCallback((planId: string, tasks: MonthlyTask[]) => {
    update(s => ({
      ...s,
      monthlyPlans: s.monthlyPlans.map(p =>
        p.id === planId ? { ...p, tasks } : p
      ),
    }));
  }, [update]);

  const addMonthlyReflection = useCallback((reflection: Omit<MonthlyReflection, 'id' | 'createdAt'>) => {
    update(s => ({
      ...s,
      monthlyReflections: [...s.monthlyReflections, {
        ...reflection,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }],
    }));
  }, [update]);

  const getActivePlan = useCallback((): DevelopmentPlan | undefined => {
    const now = state.fakeDate ? new Date(state.fakeDate) : new Date();
    return state.developmentPlans.find(p =>
      new Date(p.validFrom) <= now && now < new Date(p.validTo)
    );
  }, [state.developmentPlans, state.fakeDate]);

  const getMonthlyPlan = useCallback((developmentPlanId: string, month: number, year: number): MonthlyPlan | undefined => {
    return state.monthlyPlans.find(p => p.developmentPlanId === developmentPlanId && p.month === month && p.year === year);
  }, [state.monthlyPlans]);

  const getMonthlyReflection = useCallback((monthlyPlanId: string): MonthlyReflection | undefined => {
    return state.monthlyReflections.find(r => r.monthlyPlanId === monthlyPlanId);
  }, [state.monthlyReflections]);

  const getLatestAssessment = useCallback((): AssessmentEntry | undefined => {
    return state.assessments[state.assessments.length - 1];
  }, [state.assessments]);

  // --- Prototype helpers ---
  const getNow = useCallback((): Date => {
    return state.fakeDate ? new Date(state.fakeDate) : new Date();
  }, [state.fakeDate]);

  const setFakeDate = useCallback((date: string | undefined) => {
    update(s => ({ ...s, fakeDate: date }));
  }, [update]);

  const deleteMonthlyPlan = useCallback((month: number, year: number) => {
    update(s => {
      const planToDelete = s.monthlyPlans.find(p => p.month === month && p.year === year);
      return {
        ...s,
        monthlyPlans: s.monthlyPlans.filter(p => !(p.month === month && p.year === year)),
        // Also delete associated reflection
        monthlyReflections: planToDelete
          ? s.monthlyReflections.filter(r => r.monthlyPlanId !== planToDelete.id)
          : s.monthlyReflections,
      };
    });
  }, [update]);

  const deleteMonthlyReflection = useCallback((month: number, year: number) => {
    update(s => ({
      ...s,
      monthlyReflections: s.monthlyReflections.filter(r => !(r.month === month && r.year === year)),
    }));
  }, [update]);

  const deleteAssessment = useCallback((id: string) => {
    update(s => ({
      ...s,
      assessments: s.assessments.filter(a => a.id !== id),
    }));
  }, [update]);

  const deleteDevelopmentPlan = useCallback((id: string) => {
    update(s => ({
      ...s,
      developmentPlans: s.developmentPlans.filter(p => p.id !== id),
      // Also delete associated monthly plans and reflections
      monthlyPlans: s.monthlyPlans.filter(p => p.developmentPlanId !== id),
      monthlyReflections: s.monthlyReflections.filter(r => r.developmentPlanId !== id),
    }));
  }, [update]);

  const resetAll = useCallback(() => {
    update(() => ({
      role: 'junior',
      assessments: [],
      developmentPlans: [],
      monthlyPlans: [],
      monthlyReflections: [],
      demoProfile: false,
    }));
  }, [update]);

  const loadDemoProfile = useCallback((preserveFakeDate?: string) => {
    const baseDate = preserveFakeDate ? new Date(preserveFakeDate) : new Date();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const makeScores = (seed: number): Partial<Record<CompetencyId, AssessmentScore>> => {
      const scores: Partial<Record<CompetencyId, AssessmentScore>> = {};
      competencies.forEach((comp, index) => {
        const value = ((seed + index) % 5) + 1;
        scores[comp.id] = value as AssessmentScore;
      });
      return scores;
    };

    const assessments: AssessmentEntry[] = [
      {
        id: generateId(),
        date: new Date(year, 0, 12).toISOString(),
        source: 'self',
        scores: makeScores(1),
      },
      {
        id: generateId(),
        date: new Date(year, 3, 18).toISOString(),
        source: 'self',
        scores: makeScores(2),
      },
      {
        id: generateId(),
        date: new Date(year, 6, 7).toISOString(),
        source: 'self',
        scores: makeScores(3),
      },
    ];

    const planId = generateId();
    const validFrom = new Date(year, 0, 1).toISOString();
    const validTo = addOneYear(new Date(validFrom)).toISOString();
    const developmentPlans: DevelopmentPlan[] = [
      {
        id: planId,
        year,
        assessmentId: assessments[2].id,
        validFrom,
        validTo,
        goals: [
          {
            competencyId: 'strategisch_denken',
            goal: 'Verbind productkeuzes aan organisatiedoelen en maak strategische trade-offs expliciet.',
          },
          {
            competencyId: 'analytisch_vermogen',
            goal: 'Maak datagedreven besluitvorming structureel met duidelijke KPI’s en meetafspraken.',
          },
        ],
        createdAt: new Date(year, 0, 5).toISOString(),
      },
    ];

    const buildTasks = (m: number) => {
      const isPast = m < month;
      const isRecent = m >= month - 1;
      return [
        {
          id: generateId(),
          title: 'Werk een strategische trade-off uit en deel de impactanalyse.',
          type: 'one-time' as const,
          status: isPast ? (isRecent ? 'open' : 'done') : 'open',
          competencyId: 'strategisch_denken' as CompetencyId,
          createdAt: new Date(year, m, 4).toISOString(),
        },
        {
          id: generateId(),
          title: 'Check KPI-dashboard en noteer 1 opvallend patroon.',
          type: 'recurring' as const,
          status: isPast ? 'done' : 'open',
          competencyId: 'analytisch_vermogen' as CompetencyId,
          createdAt: new Date(year, m, 6).toISOString(),
        },
        {
          id: generateId(),
          title: 'Valideer 1 aanname met data of feedback.',
          type: 'one-time' as const,
          status: isPast ? (isRecent ? 'open' : 'done') : 'open',
          competencyId: 'analytisch_vermogen' as CompetencyId,
          createdAt: new Date(year, m, 10).toISOString(),
        },
      ] as MonthlyTask[];
    };

    const monthsToSeed = Math.max(3, month + 1);
    const monthlyPlans: MonthlyPlan[] = Array.from({ length: monthsToSeed }, (_, m) => ({
      id: generateId(),
      developmentPlanId: planId,
      month: m,
      year,
      tasks: buildTasks(m),
      createdAt: new Date(year, m, 2).toISOString(),
    }));

    const feelings: MonthlyReflection['reflections'][number]['progressFeeling'][] = [
      'veel',
      'redelijk',
      'weinig',
      'redelijk',
      'veel',
      'weinig',
    ];

    const monthlyReflections: MonthlyReflection[] = monthlyPlans
      .filter(mp => mp.month < month)
      .map((mp, index) => ({
        id: generateId(),
        monthlyPlanId: mp.id,
        developmentPlanId: planId,
        month: mp.month,
        year: mp.year,
        reflections: [
          {
            competencyId: 'strategisch_denken',
            progressFeeling: feelings[index % feelings.length],
            notes: [
              {
                id: generateId(),
                type: 'text',
                content: 'Trade-off uitgewerkt en besproken met team.',
                createdAt: new Date(year, mp.month, 20).toISOString(),
              },
              {
                id: generateId(),
                type: 'link',
                content: 'https://example.com/strategy-review',
                createdAt: new Date(year, mp.month, 22).toISOString(),
              },
            ],
            whatDone: 'Strategische keuzes voorbereid en afgestemd.',
            whatLearned: 'Beter inzicht in trade-offs en impact.',
            whatMissed: 'Nog niet alle stakeholders gesproken.',
          },
          {
            competencyId: 'analytisch_vermogen',
            progressFeeling: feelings[(index + 2) % feelings.length],
            notes: [
              {
                id: generateId(),
                type: 'text',
                content: 'KPI-review afgerond, opvallende afwijking gevonden.',
                createdAt: new Date(year, mp.month, 21).toISOString(),
              },
            ],
            whatDone: 'KPI’s bijgehouden en trends gedeeld.',
            whatLearned: 'Welke metrics echt sturen op gedrag.',
            whatMissed: 'Diepere analyse van één segment.',
          },
        ],
        createdAt: new Date(year, mp.month, 26).toISOString(),
      }));

    update(() => ({
      role: 'medior',
      assessments,
      developmentPlans,
      monthlyPlans,
      monthlyReflections,
      demoProfile: true,
      fakeDate: preserveFakeDate,
    }));
  }, [update]);

  return {
    state,
    setRole,
    addAssessment,
    addDevelopmentPlan,
    updateDevelopmentPlan,
    addMonthlyPlan,
    updateMonthlyPlan,
    addMonthlyReflection,
    getActivePlan,
    getMonthlyPlan,
    getMonthlyReflection,
    getLatestAssessment,
    getNow,
    setFakeDate,
    deleteMonthlyPlan,
    deleteMonthlyReflection,
    deleteAssessment,
    deleteDevelopmentPlan,
    resetAll,
    loadDemoProfile,
  };
}

export { generateId };
