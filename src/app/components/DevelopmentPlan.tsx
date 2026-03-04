import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/AppContext';
import {
  categories,
  competencies,
  expectations,
  getCompetency,
  getCategoryForCompetency,
  roleLabels,
} from '../data/competencies';
import type { CompetencyId, Role } from '../data/competencies';
import type { DevelopmentGoal, MonthlyTask } from '../data/store';
import {
  Target, CheckCircle2, Edit3,
  ArrowRight, BarChart3, Calendar, ClipboardList, MessageSquare,
  ChevronLeft, ChevronRight, Info,
} from 'lucide-react';
import { Link } from 'react-router';
import {
  monthNames, isReflectionOpen, canSetGoalsForMonth, getPrevMonth,
} from '../data/planning-logic';

type MonthStatus =
  | 'goals-done-reflection-done'
  | 'goals-done-reflection-open'
  | 'goals-done-reflection-pending'
  | 'goals-done-no-reflection-yet'
  | 'no-goals-can-set'
  | 'no-goals-blocked'
  | 'no-goals-past'
  | 'future';

type Step = 'focus' | 'goals';

function getNextRole(role: Role): Role {
  if (role === 'junior') return 'medior';
  if (role === 'medior') return 'senior';
  return 'senior';
}

function getExpectationSnippets(role: Role, compId: CompetencyId, count = 2): string[] {
  const text = expectations[role][compId] || '';
  const parts = text
    .split('.')
    .map(s => s.trim())
    .filter(Boolean);
  return parts.slice(0, count).map(p => (p.endsWith('.') ? p : `${p}.`));
}

function getGoalSuggestions(compId: CompetencyId): string[] {
  switch (compId) {
    case 'product_delivery':
      return [
        'Versterk de voorspelbaarheid van delivery door een stabiel ritme en duidelijke kwaliteitscriteria.',
        'Verhoog de waarde‑realisatie per release door betere prioritering en duidelijke scope‑keuzes.',
        'Verbeter de samenwerking met engineering zodat delivery sneller en consistenter verloopt.',
        'Bouw een feedback‑loop die zorgt dat learnings structureel in delivery terechtkomen.',
      ];
    case 'analytisch_vermogen':
      return [
        'Maak datagedreven besluitvorming structureel door duidelijke KPI’s en meetafspraken.',
        'Verhoog de kwaliteit van analyses zodat inzichten direct tot betere productkeuzes leiden.',
        'Bouw een consistent meet‑framework dat teams helpt om impact te bewijzen.',
        'Ontwikkel analytische routine: van vraag → data → inzicht → actie.',
      ];
    case 'procesbeheer':
      return [
        'Maak kernprocessen helder en schaalbaar zodat het team efficiënt kan leveren.',
        'Verminder frictie in samenwerking door processen te stroomlijnen en te borgen.',
        'Breng structuur in intake, prioritering en besluitvorming voor consistente uitvoering.',
        'Bouw een continue verbetercyclus in het teamproces.',
      ];
    case 'klantempathie':
      return [
        'Maak klantinzichten structureel leidend in productkeuzes en prioriteiten.',
        'Versterk begrip van eindgebruikers door consistent onderzoek en synthese.',
        'Ontwikkel een gedeeld klantbeeld dat richting geeft aan roadmap en keuzes.',
        'Zorg dat klantfeedback sneller en tastbaarder in oplossingen terechtkomt.',
      ];
    case 'marktonderzoek':
      return [
        'Maak marktinzichten structureel onderdeel van productstrategie en positionering.',
        'Bouw een scherp beeld van concurrenten en differentiatie‑kansen.',
        'Ontwikkel een ritme om trends en klantbehoeften vroeg te signaleren.',
        'Vertaal marktdata naar concrete strategische keuzes en prioriteiten.',
      ];
    case 'ownership_executie':
      return [
        'Versterk end‑to‑end eigenaarschap zodat initiatieven voorspelbaar en kwalitatief opleveren.',
        'Verhoog de executiekracht door duidelijke keuzes, scope en risico‑beheersing.',
        'Creëer een werkwijze waarin afspraken consequent worden nagekomen.',
        'Zorg dat delivery consistent bijdraagt aan business‑outcomes.',
      ];
    case 'strategisch_denken':
      return [
        'Verbind productkeuzes expliciet aan organisatiedoelen en lange‑termijn impact.',
        'Ontwikkel een strategische richting die keuzes en prioriteiten versnelt.',
        'Maak strategische trade‑offs zichtbaar en goed onderbouwd.',
        'Bouw een kader om kansen en risico’s structureel te wegen.',
      ];
    case 'bedrijfsstrategie':
      return [
        'Vertaal bedrijfsdoelen naar productstrategie en meetbare outcomes.',
        'Zorg dat productbeslissingen aantoonbaar bijdragen aan de bedrijfsstrategie.',
        'Versterk de koppeling tussen marktontwikkelingen en strategische keuzes.',
        'Bouw strategisch inzicht dat helpt om grotere bets te valideren.',
      ];
    case 'roadmapping':
      return [
        'Ontwikkel een roadmap die focus en alignment over teams heen creëert.',
        'Zorg dat roadmap‑keuzes consistent worden onderbouwd met impact en haalbaarheid.',
        'Bouw transparantie en vertrouwen door duidelijke planning en communicatie.',
        'Maak de roadmap adaptief zonder richting te verliezen.',
      ];
    case 'communicatie':
      return [
        'Versterk stakeholder‑vertrouwen door heldere, consistente communicatie.',
        'Zorg dat belangrijke besluiten en context altijd gedeeld en begrepen worden.',
        'Ontwikkel een communicatie‑ritme dat verwachtingen structureel afstemt.',
        'Maak productverhalen overtuigend en richtinggevend.',
      ];
    case 'stakeholdermanagement':
      return [
        'Bouw duurzame relaties met stakeholders en creëer alignment op prioriteiten.',
        'Maak belangen transparant en manage verwachtingen proactief.',
        'Zorg dat conflicten sneller worden opgelost door duidelijke afspraken.',
        'Versterk invloed op besluitvorming door data en context.',
      ];
    case 'leiderschap':
      return [
        'Ontwikkel leiderschap dat richting geeft en eigenaarschap stimuleert.',
        'Creëer een teamcultuur waarin feedback en groei vanzelfsprekend zijn.',
        'Versterk teamautonomie door heldere kaders en vertrouwen.',
        'Zorg dat teamgedrag consistent bijdraagt aan productdoelen.',
      ];
    default:
      return [];
  }
}

export function DevelopmentPlan() {
  const {
    state, addDevelopmentPlan, updateDevelopmentPlan, updateMonthlyPlan,
    getActivePlan, getLatestAssessment, getMonthlyPlan, getMonthlyReflection,
    getNow,
  } = useApp();
  const now = getNow();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const activePlan = getActivePlan();
  const latestAssessment = getLatestAssessment();

  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState<Step>('focus');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(
    activePlan?.assessmentId || latestAssessment?.id || ''
  );
  const [showAssessmentPicker, setShowAssessmentPicker] = useState(false);
  const [selectedCompetencies, setSelectedCompetencies] = useState<CompetencyId[]>(
    activePlan?.goals.map(g => g.competencyId) || []
  );
  const [goals, setGoals] = useState<Record<string, string>>(
    activePlan?.goals.reduce((acc, g) => ({ ...acc, [g.competencyId]: g.goal }), {} as Record<string, string>) || {}
  );
  const [saved, setSaved] = useState(false);
  const [sidebarGoalId, setSidebarGoalId] = useState<CompetencyId | null>(null);
  const [expandedExpectation, setExpandedExpectation] = useState<CompetencyId | null>(null);
  const suggestionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedAssessmentId && latestAssessment) {
      setSelectedAssessmentId(latestAssessment.id);
    }
  }, [latestAssessment, selectedAssessmentId]);

  const toggleCompetency = (compId: CompetencyId) => {
    setSelectedCompetencies(prev => {
      if (prev.includes(compId)) return prev.filter(id => id !== compId);
      if (prev.length >= 2) return prev;
      return [...prev, compId];
    });
  };

  const startEditing = () => {
    setIsEditing(true);
    setStep('focus');
  };

  const handleSave = () => {
    if (selectedCompetencies.length === 0) return;
    if (!selectedAssessmentId) return;
    const devGoals: DevelopmentGoal[] = selectedCompetencies.map(compId => ({
      competencyId: compId,
      goal: goals[compId] || '',
    }));
    if (activePlan) {
      updateDevelopmentPlan(activePlan.id, devGoals, selectedAssessmentId);
    } else {
      const validFrom = new Date().toISOString();
      addDevelopmentPlan(currentYear, devGoals, selectedAssessmentId, validFrom);
    }
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const selectedAssessment = state.assessments.find(a => a.id === selectedAssessmentId) || latestAssessment;
  const nextRole = getNextRole(state.role);
  const nextRoleLabel = roleLabels[nextRole];

  const recommended = selectedAssessment
    ? competencies
        .map(comp => ({
          id: comp.id,
          score: selectedAssessment.scores[comp.id] ?? 0,
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
    : [];

  const applyRecommended = () => {
    const ids = recommended.map(r => r.id).slice(0, 2);
    setSelectedCompetencies(ids);
  };

  const applySuggestion = (compId: CompetencyId, text: string) => {
    setGoals(prev => ({
      ...prev,
      [compId]: prev[compId]?.trim() ? `${prev[compId].trim()}\n${text}` : text,
    }));
  };

  const scrollSuggestions = (compId: CompetencyId, direction: 'left' | 'right') => {
    const el = suggestionRefs.current[compId];
    if (!el) return;
    const amount = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const toggleTaskStatus = (taskId: string) => {
    if (!activePlan) return;
    const currentMonthlyPlan = getMonthlyPlan(activePlan.id, currentMonth, currentYear);
    if (!currentMonthlyPlan) return;
    const updated = currentMonthlyPlan.tasks.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? 'open' : 'done' } : t
    );
    updateMonthlyPlan(currentMonthlyPlan.id, updated);
  };

  function getMonthData() {
    if (!activePlan) return [];

    return Array.from({ length: 12 }, (_, m) => {
      const mp = getMonthlyPlan(activePlan.id, m, currentYear);
      const refl = mp ? getMonthlyReflection(mp.id) : undefined;
      const hasPlan = !!mp;
      const hasReflection = !!refl;
      const isFuture = m > currentMonth;

      let status: MonthStatus;
      if (isFuture) {
        status = 'future';
      } else if (hasPlan && hasReflection) {
        status = 'goals-done-reflection-done';
      } else if (hasPlan && !hasReflection) {
        const reflOpen = isReflectionOpen(m, currentYear, now);
        if (reflOpen) {
          status = 'goals-done-reflection-open';
        } else if (m < currentMonth) {
          status = 'goals-done-reflection-pending';
        } else {
          status = 'goals-done-no-reflection-yet';
        }
      } else {
        if (m < currentMonth) {
          status = 'no-goals-past';
        } else {
          const prev = getPrevMonth(m, currentYear);
          const prevMp = getMonthlyPlan(activePlan.id, prev.month, prev.year);
          const prevRefl = prevMp ? getMonthlyReflection(prevMp.id) : undefined;
          const canSet = canSetGoalsForMonth(!!prevMp, !!prevRefl);
          status = canSet ? 'no-goals-can-set' : 'no-goals-blocked';
        }
      }

      return {
        month: m, year: currentYear, hasPlan, hasReflection, status, isFuture,
      };
    });
  }

  // View mode
  if (activePlan && !isEditing) {
    const monthData = getMonthData();
    const pastMonths = monthData.filter(m => !m.isFuture);
    const totalPast = pastMonths.length;
    const monthsWithGoals = pastMonths.filter(m => m.hasPlan).length;
    const monthsWithReflection = pastMonths.filter(m => m.hasReflection).length;
    const planAssessment = state.assessments.find(a => a.id === activePlan.assessmentId);

    return (
      <>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-foreground">Ontwikkelplan {currentYear}</h1>
            <p className="text-muted-foreground">
              Je focuscompetentie(s) en voortgang dit jaar.
            </p>
            {planAssessment && (
              <p className="text-muted-foreground text-[0.85rem]">
                Assessment: {new Date(planAssessment.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={startEditing}
            className="flex items-center gap-2 px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Bewerken
          </button>
        </div>

        {saved && (
          <div className="bg-emerald-50 rounded-[14px] p-4 flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Plan opgeslagen!
          </div>
        )}

        {/* Progress stats row */}
        <section className="space-y-3">
          <h2 className="text-foreground text-[1rem]">Overzicht</h2>
          <div className="grid grid-cols-3 gap-4 w-full">
            {(() => {
              const monthData = getMonthData();
              const streak = (() => {
                let count = 0;
                for (let m = currentMonth; m >= 0; m--) {
                  if (monthData[m]?.hasReflection) count += 1;
                  else break;
                }
                return count;
              })();

              const sentimentCounts = { veel: 0, redelijk: 0, weinig: 0, geen: 0 } as Record<string, number>;
              let totalSentiment = 0;
              for (let m = 0; m < 12; m++) {
                const mp = getMonthlyPlan(activePlan.id, m, currentYear);
                const refl = mp ? getMonthlyReflection(mp.id) : undefined;
                if (!refl) continue;
                refl.reflections.forEach(r => {
                  sentimentCounts[r.progressFeeling] += 1;
                  totalSentiment += 1;
                });
              }

              const segments = [
                { key: 'veel', color: '#22c55e', value: sentimentCounts.veel },
                { key: 'redelijk', color: '#f59e0b', value: sentimentCounts.redelijk },
                { key: 'weinig', color: '#ef4444', value: sentimentCounts.weinig + sentimentCounts.geen },
              ].filter(s => s.value > 0);
              let offset = 0;
              const gradient = totalSentiment === 0
                ? 'conic-gradient(#e5e7eb 0% 100%)'
                : `conic-gradient(${segments.map(s => {
                    const pct = (s.value / totalSentiment) * 100;
                    const start = offset;
                    const end = offset + pct;
                    offset = end;
                    return `${s.color} ${start}% ${end}%`;
                  }).join(', ')})`;

              let totalTasks = 0;
              let doneTasks = 0;
              for (let m = 0; m < 12; m++) {
                const mp = getMonthlyPlan(activePlan.id, m, currentYear);
                if (!mp) continue;
                totalTasks += mp.tasks.length;
                doneTasks += mp.tasks.filter(t => t.status === 'done').length;
              }

              return (
                <>
                  <div className="bg-card rounded-[14px] p-5 w-full flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground text-[0.95rem]">
                      {streak}
                    </div>
                    <div>
                      <div className="text-foreground text-[0.95rem]">Reflectie streak</div>
                      <div className="text-muted-foreground text-[0.8rem]">maanden op rij</div>
                    </div>
                  </div>

                  <div className="bg-card rounded-[14px] p-5 w-full flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full" style={{ background: gradient }}>
                      <div className="h-full w-full rounded-full bg-background/70 scale-[0.62]" />
                    </div>
                    <div>
                      <div className="text-foreground text-[0.95rem]">Gemiddelde sentiment</div>
                      <div className="text-muted-foreground text-[0.8rem]">
                        {totalSentiment === 0 ? 'Nog geen reflecties' : `${totalSentiment} reflecties`}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-[14px] p-5 w-full flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground text-[0.95rem]">
                      {doneTasks}
                    </div>
                    <div>
                      <div className="text-foreground text-[0.95rem]">Acties voltooid</div>
                      <div className="text-muted-foreground text-[0.8rem]">
                        {doneTasks} van {totalTasks}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        {/* Development goals card */}
        <section>
          <div className="bg-card rounded-[18px] p-8">
            <h3 className="text-foreground mb-6 flex items-center gap-2">
              <Target className="w-5 h-5" /> Mijn jaardoelen
            </h3>
            <div className="space-y-4">
              {activePlan.goals.map(goal => {
                const comp = getCompetency(goal.competencyId);
                const cat = getCategoryForCompetency(goal.competencyId);
                const currentMonthlyPlan = getMonthlyPlan(activePlan.id, currentMonth, currentYear);
                const currentTasks = currentMonthlyPlan
                  ? currentMonthlyPlan.tasks.filter(t => t.competencyId === goal.competencyId)
                  : [];
                const openCount = currentTasks.filter(t => t.status === 'open').length;
                const statusLabel = currentTasks.length === 0
                  ? 'Nog geen acties'
                  : openCount === 0
                    ? 'Afgerond'
                    : 'In progress';
                const statusClasses = currentTasks.length === 0
                  ? 'bg-muted text-muted-foreground'
                  : openCount === 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700';

                return (
                  <div
                    key={goal.competencyId}
                    className="border border-border rounded-[14px] p-6"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSidebarGoalId(goal.competencyId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSidebarGoalId(goal.competencyId);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
                          <span className="inline-flex items-center gap-2 bg-muted/60 text-muted-foreground px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {comp.name}
                          </span>
                          <span className="text-muted-foreground">{cat.name}</span>
                        </div>
                        {goal.goal ? (
                          <p className="text-foreground text-[1.1rem] leading-relaxed font-medium">
                            {goal.goal}
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic">
                            Geen doel beschreven
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[0.8rem] px-3 py-1 rounded-full ${statusClasses}`}>
                          {statusLabel}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="mt-4">
                      {currentTasks.length === 0 ? (
                        <span className="inline-flex text-[0.8rem] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          Nog geen acties aangemaakt
                        </span>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {currentTasks.map(task => {
                            const isDone = task.status === 'done';
                            return (
                              <div key={task.id} className="flex items-center gap-3 py-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskStatus(task.id);
                                  }}
                                  className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                                    isDone ? 'bg-foreground border-foreground text-primary-foreground' : 'border-border text-transparent'
                                  }`}
                                  aria-label={isDone ? 'Markeer actie als open' : 'Markeer actie als voltooid'}
                                >
                                  ✓
                                </button>
                                <span className={`text-foreground ${isDone ? 'line-through opacity-60' : ''}`}>
                                  {task.title}
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
        </section>

        {/* Year overview */}
        <section>
          <div className="bg-card rounded-[18px] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Progress over time
              </h3>
              <span className="text-muted-foreground text-[0.85rem]">Laatste 12 maanden</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[0.85rem] text-muted-foreground mb-6">
              {activePlan.goals.map(goal => {
                const comp = getCompetency(goal.competencyId);
                const cat = getCategoryForCompetency(goal.competencyId);
                return (
                  <div key={goal.competencyId} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: cat.color }} />
                    <span>{comp.name}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>Veel</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span>Redelijk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span>Weinig/Geen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-muted-foreground/40" />
                  <span>Geen data</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {monthData.map(mh => {
                const isCurrent = mh.month === currentMonth;
                const monthLabel = `${monthNames[mh.month].substring(0, 3)} '${String(mh.year).slice(-2)}`;
                const monthPlan = getMonthlyPlan(activePlan.id, mh.month, mh.year);
                const monthReflection = monthPlan ? getMonthlyReflection(monthPlan.id) : undefined;

                const getFeeling = (compId: CompetencyId) => {
                  if (!monthReflection) return null;
                  const entry = monthReflection.reflections.find(r => r.competencyId === compId);
                  return entry?.progressFeeling ?? null;
                };

                const getColorClass = (feeling: string | null) => {
                  if (!feeling) return 'border-muted-foreground/30 text-muted-foreground/40';
                  if (feeling === 'veel') return 'bg-emerald-500 border-emerald-500';
                  if (feeling === 'redelijk') return 'bg-amber-400 border-amber-400';
                  return 'bg-red-400 border-red-400';
                };

                return (
                  <Link
                    key={mh.month}
                    to={`/month/${mh.month}/${mh.year}`}
                    className={`rounded-[14px] border border-border p-4 transition-colors ${
                      isCurrent ? 'ring-2 ring-foreground/10' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[0.85rem] ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {monthLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {activePlan.goals.map(goal => {
                        const comp = getCompetency(goal.competencyId);
                        const cat = getCategoryForCompetency(goal.competencyId);
                        const feeling = getFeeling(goal.competencyId);
                        const colorClass = getColorClass(feeling);
                        return (
                          <div key={goal.competencyId} className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <span className="h-2 w-0.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span
                                className={`h-6 w-6 rounded-full border ${colorClass}`}
                                title={`${comp.name}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
        {sidebarGoalId && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setSidebarGoalId(null)}
            />
            <aside className="absolute right-0 top-0 h-full w-[360px] bg-card border-l border-border p-6 overflow-auto">
              {(() => {
                const goal = activePlan.goals.find(g => g.competencyId === sidebarGoalId)!;
                const comp = getCompetency(goal.competencyId);
                const cat = getCategoryForCompetency(goal.competencyId);
                const pastTasksByMonth = Array.from({ length: 12 }, (_, m) => {
                  if (m >= currentMonth) return null;
                  const mp = getMonthlyPlan(activePlan.id, m, currentYear);
                  if (!mp) return null;
                  const tasks = mp.tasks.filter(t =>
                    t.competencyId === goal.competencyId && t.status === 'done'
                  );
                  if (tasks.length === 0) return null;
                  return { month: m, tasks };
                }).filter(Boolean) as { month: number; tasks: MonthlyTask[] }[];

                return (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[0.85rem] text-muted-foreground">Goal</div>
                        <div className="text-foreground text-[1rem] font-medium mt-1">
                          {goal.goal || comp.name}
                        </div>
                        <div className="flex items-center gap-2 text-[0.8rem] text-muted-foreground mt-2">
                          <span className="inline-flex items-center gap-2 bg-muted/60 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {comp.name}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSidebarGoalId(null)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="text-muted-foreground text-[0.85rem]">
                        Afgeronde acties (vorige maanden)
                      </div>
                      {pastTasksByMonth.length === 0 ? (
                        <div className="text-muted-foreground text-[0.85rem]">
                          Nog geen afgeronde acties uit eerdere maanden.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pastTasksByMonth.map(({ month, tasks }) => (
                            <div key={month} className="bg-muted/40 rounded-[12px] p-3">
                              <div className="text-foreground text-[0.85rem] mb-2">
                                {monthNames[month]}
                              </div>
                              <div className="space-y-2">
                                {tasks.map(t => (
                                  <div key={t.id} className="text-[0.85rem] text-muted-foreground">
                                    {t.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </aside>
          </div>
        )}
      </>
    );
  }

  // Empty state - no plan yet
  if (!activePlan && !isEditing) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-foreground">Ontwikkelplan</h1>
          <p className="text-muted-foreground">
            Kies je focuscompetentie(s) voor dit jaar en werk er maandelijks aan.
          </p>
        </div>

        <div className="bg-card rounded-[14px] p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-foreground mb-2">Nog geen ontwikkelplan</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Je hebt nog geen ontwikkelplan voor {currentYear}. Maak een plan aan en kies 1 of 2 competenties waar je dit jaar op wilt focussen. Je kunt per jaar één ontwikkelplan hebben.
          </p>
          <button
            onClick={startEditing}
            className="px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Target className="w-4 h-4" /> Maak ontwikkelplan
          </button>
        </div>
      </div>
    );
  }

  // Edit / Create mode
  const canContinue = selectedCompetencies.length > 0 && !!selectedAssessmentId;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-foreground">
          {activePlan ? `Ontwikkelplan ${currentYear} bewerken` : `Ontwikkelplan ${currentYear} maken`}
        </h1>
        <p className="text-muted-foreground">
          {step === 'focus'
            ? 'Stap 1: kies je focuscompetenties.'
            : 'Stap 2: beschrijf je jaardoelen per competentie.'}
        </p>
      </div>

      {step === 'focus' && (
        <div className="space-y-6">
          <div className="bg-card rounded-[14px] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-[0.95rem]">Assessment</h3>
              {state.assessments.length > 1 && (
                <button
                  onClick={() => setShowAssessmentPicker(v => !v)}
                  className="text-muted-foreground text-[0.85rem] hover:text-foreground transition-colors"
                >
                  {showAssessmentPicker ? 'Sluiten' : 'Wijzig'}
                </button>
              )}
            </div>

            {state.assessments.length === 0 ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-[0.85rem]">
                  Geen assessment gevonden. Doe eerst een assessment.
                </p>
                <Link
                  to="/assessment"
                  className="inline-flex items-center gap-2 px-[18px] py-[10px] bg-foreground text-primary-foreground rounded-[8px] text-[0.85rem] hover:opacity-90 transition-opacity"
                >
                  Start assessment
                </Link>
              </div>
            ) : (
              <>
                {selectedAssessment ? (
                  <p className="text-muted-foreground text-[0.85rem]">
                    Geselecteerd: {new Date(selectedAssessment.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-[0.85rem]">
                    Kies een assessment om door te gaan.
                  </p>
                )}

                {showAssessmentPicker && (
                  <div className="space-y-2 pt-2">
                    {[...state.assessments].reverse().map(assessment => {
                      const dateLabel = new Date(assessment.date).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      });
                      const isSelected = assessment.id === selectedAssessmentId;
                      return (
                        <button
                          key={assessment.id}
                          onClick={() => {
                            setSelectedAssessmentId(assessment.id);
                            setShowAssessmentPicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] border text-[0.85rem] ${
                            isSelected
                              ? 'border-foreground bg-accent text-foreground'
                              : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                          }`}
                        >
                          <span>{dateLabel}</span>
                          {isSelected && <span className="text-foreground">Geselecteerd</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedAssessment && (
            <div className="bg-card rounded-[14px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-foreground text-[0.95rem]">Aanbevolen focus</div>
                  <div className="text-muted-foreground text-[0.85rem]">Op basis van je assessment en het volgende niveau ({nextRoleLabel}).</div>
                </div>
                {recommended.length > 0 && (
                  <button
                    onClick={applyRecommended}
                    className="text-[0.85rem] text-foreground hover:opacity-70 transition-opacity"
                  >
                    Selecteer aanbevolen
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {recommended.length === 0 && (
                  <p className="text-muted-foreground text-[0.85rem]">Geen aanbevelingen beschikbaar.</p>
                )}
                {recommended.map(rec => {
                  const comp = getCompetency(rec.id);
                  const cat = getCategoryForCompetency(rec.id);
                  const isSelected = selectedCompetencies.includes(rec.id);
                  const snippets = getExpectationSnippets(nextRole, rec.id, 1);
                  return (
                    <div key={rec.id} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center text-[12px] ${
                            isSelected
                              ? 'bg-foreground border-foreground text-primary-foreground'
                              : 'border-border text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <div>
                          <div className="text-foreground text-[0.95rem] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {comp.name}
                            <span className="text-muted-foreground text-[0.8rem]">{rec.score}/5</span>
                          </div>
                          {snippets[0] && (
                            <div className="text-muted-foreground text-[0.8rem] mt-1">
                              {snippets[0]}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCompetency(rec.id)}
                        className="text-[0.85rem] text-foreground hover:opacity-70 transition-opacity"
                      >
                        {isSelected ? 'Geselecteerd' : 'Selecteer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-card rounded-[14px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">{selectedCompetencies.length} / 2 geselecteerd</span>
              {selectedCompetencies.length === 0 && (
                <span className="text-muted-foreground text-[0.85rem]">Kies minimaal 1</span>
              )}
            </div>

            {categories.map(cat => (
              <div key={cat.id} className="border border-border rounded-[10px]">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-foreground text-[0.9rem]">{cat.name}</span>
                </div>
                <div className="divide-y divide-border">
                  {cat.competencies.map(compId => {
                    const comp = getCompetency(compId);
                    const isSelected = selectedCompetencies.includes(compId);
                    const isDisabled = selectedCompetencies.length >= 2 && !isSelected;
                    const assessmentScore = selectedAssessment?.scores[compId];
                    return (
                      <button
                        key={compId}
                        onClick={() => !isDisabled && toggleCompetency(compId)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left ${
                          isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-foreground border-foreground text-primary-foreground' : 'border-border text-transparent'
                          }`}>
                            ✓
                          </div>
                          <span className="text-foreground text-[0.9rem]">{comp.name}</span>
                        </div>
                        {assessmentScore && (
                          <span className="text-muted-foreground text-[0.8rem]">{assessmentScore}/5</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 sticky bottom-4 bg-card rounded-[14px] p-6">
            {activePlan && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
              >
                Annuleren
              </button>
            )}
            <button
              onClick={() => setStep('goals')}
              disabled={!canContinue}
              className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
                canContinue
                  ? 'bg-foreground text-primary-foreground hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Volgende
            </button>
          </div>
        </div>
      )}

      {step === 'goals' && (
        <div className="space-y-6">
          {selectedCompetencies.length === 0 && (
            <p className="text-muted-foreground">Geen competenties gekozen.</p>
          )}

          {selectedCompetencies.map(compId => {
            const comp = getCompetency(compId);
            const cat = getCategoryForCompetency(compId);
            const suggestions = getGoalSuggestions(compId);
            return (
              <div key={compId} className="bg-card rounded-[14px] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <h3 className="text-foreground">{comp.name}</h3>
                  <span className="text-[0.75rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {nextRoleLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedExpectation(prev => (prev === compId ? null : compId))
                    }
                    className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                    aria-label="Bekijk verwachtingen"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>

                {expandedExpectation === compId && (
                  <div className="mt-3 rounded-[10px] border border-border bg-accent p-4 text-[0.85rem] text-muted-foreground">
                    <div className="text-foreground mb-1">Verwachting voor {nextRoleLabel}</div>
                    <div>{expectations[nextRole][compId]}</div>
                  </div>
                )}

                <div>
                  <label className="text-muted-foreground text-[0.85rem] block mb-2">
                    Jaarlijks doel
                  </label>
                  <p className="text-muted-foreground text-[0.8rem] mb-3">
                    Formuleer een langetermijndoel dat richting geeft.
                  </p>
                  <textarea
                    value={goals[compId] || ''}
                    onChange={e => setGoals(prev => ({ ...prev, [compId]: e.target.value }))}
                    placeholder="Beschrijf je doel in één of twee zinnen..."
                    className="w-full px-4 py-3 rounded-[10px] border border-border bg-accent text-foreground resize-none h-24 placeholder:text-muted-foreground/60"
                  />
                </div>

                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground text-[0.85rem]">Suggesties</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => scrollSuggestions(compId, 'left')}
                          className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                          aria-label="Scroll suggestions left"
                        >
                          <ChevronLeft className="h-4 w-4 mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollSuggestions(compId, 'right')}
                          className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                          aria-label="Scroll suggestions right"
                        >
                          <ChevronRight className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                    <div
                      ref={el => { suggestionRefs.current[compId] = el; }}
                      className="flex items-stretch gap-3 overflow-x-auto pb-1"
                    >
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => applySuggestion(compId, s)}
                          className="min-w-[260px] max-w-[320px] self-stretch px-3 py-3 rounded-[12px] border border-border text-[0.85rem] leading-snug text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground text-left whitespace-normal"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3 sticky bottom-4 bg-card rounded-[14px] p-6">
            <button
              onClick={() => setStep('focus')}
              className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
            >
              Terug
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedAssessmentId || selectedCompetencies.length === 0}
              className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
                selectedAssessmentId && selectedCompetencies.length > 0
                  ? 'bg-foreground text-primary-foreground hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {activePlan ? 'Plan bijwerken' : 'Plan opslaan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
