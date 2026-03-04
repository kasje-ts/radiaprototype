import { useState, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, AlertCircle, Clock, Lock, CalendarDays, Save, Trash2, Plus, Repeat, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../data/AppContext';
import { getCompetency, getCategoryForCompetency } from '../data/competencies';
import type { CompetencyId } from '../data/competencies';
import type { MonthlyTask } from '../data/store';
import { generateId } from '../data/store';
import { MonthlyGoalsCard } from './MonthlyGoalsCard';
import {
  monthNames, formatDeadline, daysUntil,
  getReflectionDeadline, getGoalsDeadline, getLastDayOfMonth,
  isReflectionOpen, isReflectionOverdue,
  canSetGoalsForMonth,
  getPrevMonth, getNextMonth,
} from '../data/planning-logic';

export function MonthDetail() {
  const { month: monthParam, year: yearParam } = useParams();
  const navigate = useNavigate();
  const {
    getActivePlan, getMonthlyPlan, getMonthlyReflection,
    addMonthlyPlan, updateMonthlyPlan, getNow,
  } = useApp();

  const activePlan = getActivePlan();
  const now = getNow();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const month = parseInt(monthParam ?? '0', 10);
  const year = parseInt(yearParam ?? String(currentYear), 10);

  const monthlyPlan = activePlan ? getMonthlyPlan(activePlan.id, month, year) : undefined;
  const hasPlan = !!monthlyPlan;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [tasksDraft, setTasksDraft] = useState<MonthlyTask[]>([]);
  const [draftInputs, setDraftInputs] = useState<Record<CompetencyId, { title: string; recurring: boolean }>>({});
  const suggestionRefs = useRef<Record<CompetencyId, HTMLDivElement | null>>({});

  const startEditing = () => {
    if (!activePlan || !monthlyPlan) return;
    setTasksDraft(monthlyPlan.tasks || []);
    setIsEditing(true);
  };

  const buildCarryoverTasks = () => {
    if (!activePlan) return [];
    const prev = getPrevMonth(month, year);
    const prevPlan = getMonthlyPlan(activePlan.id, prev.month, prev.year);
    if (!prevPlan) return [];
    return prevPlan.tasks
      .filter(t => t.status === 'open' || t.type === 'recurring')
      .map(t => ({
        ...t,
        id: generateId(),
        status: 'open' as const,
        carriedFromTaskId: t.id,
        createdAt: new Date().toISOString(),
      }));
  };

  const startNew = () => {
    if (!activePlan) return;
    setTasksDraft(buildCarryoverTasks());
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!activePlan) return;
    const tasks = tasksDraft
      .filter(t => t.title.trim().length > 0)
      .map(t => ({ ...t, title: t.title.trim() }));
    if (monthlyPlan) {
      updateMonthlyPlan(monthlyPlan.id, tasks);
    } else {
      addMonthlyPlan(activePlan.id, month, year, tasks);
    }
    setIsEditing(false);
  };

  const hasAnyTasks = tasksDraft.some(t => t.title.trim().length > 0);

  const updateDraftTask = (id: string, patch: Partial<MonthlyTask>) => {
    setTasksDraft(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeDraftTask = (id: string) => {
    setTasksDraft(prev => prev.filter(t => t.id !== id));
  };

  const setDraftInput = (compId: CompetencyId, patch: Partial<{ title: string; recurring: boolean }>) => {
    setDraftInputs(prev => ({
      ...prev,
      [compId]: { title: '', recurring: false, ...(prev[compId] || {}), ...patch },
    }));
  };

  const addTaskForCompetency = (compId: CompetencyId, title: string, recurring: boolean) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: MonthlyTask = {
      id: generateId(),
      title: trimmed,
      type: recurring ? 'recurring' : 'one-time',
      status: 'open',
      competencyId: compId,
      createdAt: new Date().toISOString(),
    };
    setTasksDraft(prev => [...prev, task]);
    setDraftInput(compId, { title: '', recurring: false });
  };

  const addSuggestedTask = (compId: CompetencyId, text: string) => {
    addTaskForCompetency(compId, text, false);
  };

  const scrollSuggestions = (compId: CompetencyId, direction: 'left' | 'right') => {
    const el = suggestionRefs.current[compId];
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const toggleTaskStatus = (taskId: string) => {
    if (!monthlyPlan) return;
    const updated = monthlyPlan.tasks.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? 'open' : 'done' } : t
    );
    updateMonthlyPlan(monthlyPlan.id, updated);
  };

  const getSuggestionsForCompetency = (compId: CompetencyId): string[] => {
    switch (compId) {
      case 'product_delivery':
        return [
          'Voer 2 klantinterviews uit en vertaal naar backlog-items.',
          'Test 1 hypothese met een klein experiment.',
          'Definieer heldere acceptatiecriteria voor een feature.',
          'Plan een korte demo met stakeholders.',
          'Werk 1 risico uit met mitigatie.',
        ];
      case 'analytisch_vermogen':
        return [
          'Analyseer 1 KPI-trend en deel je conclusie.',
          'Maak een korte dashboard-samenvatting.',
          'Definieer 2 metrics die gedrag beter meten.',
          'Valideer 1 aanname met data.',
          'Formuleer 1 datavraag voor de komende sprint.',
        ];
      case 'procesbeheer':
        return [
          'Documenteer één proces en verbeter 1 knelpunt.',
          'Plan een retro en voer 1 verbeteractie uit.',
          'Breng een duidelijke intake-flow aan.',
          'Maak werkafspraken over prioritering.',
          'Introduceer een wekelijkse review.',
        ];
      case 'klantempathie':
        return [
          'Plan 2 klantgesprekken en vat inzichten samen.',
          'Maak een empathy map voor een kernpersona.',
          'Loop een gebruikersflow mee en noteer fricties.',
          'Syntheseer 3 belangrijkste klantpijnpunten.',
          'Vertaal feedback naar 2 product-kansen.',
        ];
      case 'marktonderzoek':
        return [
          'Vergelijk 2 concurrenten en noteer kansen.',
          'Voer een korte survey uit en deel resultaten.',
          'Schrijf een korte market scan (1 pagina).',
          'Analyseer een opkomende trend en impact.',
          'Maak een overzicht van alternatieven.',
        ];
      case 'ownership_executie':
        return [
          'Lever 1 feature van begin tot eind op.',
          'Definieer 3 duidelijke acceptance criteria.',
          'Maak een mini-plan met mijlpalen.',
          'Plan 2 afstemmomenten met engineering.',
          'Borg kwaliteit met een korte checklist.',
        ];
      case 'strategisch_denken':
        return [
          'Formuleer 3 strategische hypotheses en bespreek ze.',
          'Koppel 1 roadmap-item aan organisatiedoel.',
          'Maak een impact-map voor 1 initiatief.',
          'Definieer 2 trade-offs met impact.',
          'Schets een scenario voor komend kwartaal.',
        ];
      case 'bedrijfsstrategie':
        return [
          'Maak een korte SWOT voor je product.',
          'Analyseer 1 markttrend en impact.',
          'Vertaal 1 bedrijfsdoel naar initiatieven.',
          'Maak een 1-pager met strategische keuzes.',
          'Benoem 2 risico’s voor groei.',
        ];
      case 'roadmapping':
        return [
          'Werk de roadmap bij met 2 prioriteiten.',
          'Maak een kwartaalplanning met afhankelijkheden.',
          'Valideer roadmap-keuzes met 2 stakeholders.',
          'Deprioriteer 1 item en leg waarom vast.',
          'Maak een overzicht van afhankelijkheden.',
        ];
      case 'communicatie':
        return [
          'Stuur een maandelijkse update naar stakeholders.',
          'Bereid en geef een korte demo.',
          'Maak een 1-pager met beslissingen en context.',
          'Vat voortgang samen in 5 bullets.',
          'Plan een update met het leadership team.',
        ];
      case 'stakeholdermanagement':
        return [
          'Map 5 belangrijkste stakeholders en hun belangen.',
          'Plan 1 check-in met een kritieke stakeholder.',
          'Stem verwachtingen af voor 1 roadmap-item.',
          'Documenteer 1 conflict en de oplossing.',
          'Maak een overzicht van invloed/impact.',
        ];
      case 'leiderschap':
        return [
          'Coach een collega bij één taak.',
          'Neem eigenaarschap over een teamproces.',
          'Organiseer een korte team-retro.',
          'Vraag actief feedback van 2 teamleden.',
          'Maak een afspraak over teamnormen.',
        ];
      default:
        return [];
    }
  };

  if (!activePlan) {
    return (
      <div className="space-y-6">
        <h1 className="text-foreground">Maandoverzicht</h1>
        <p className="text-muted-foreground">Maak eerst een ontwikkelplan aan.</p>
        <button
          onClick={() => navigate('/development-plan')}
          className="px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px]"
        >
          Ontwikkelplan maken
        </button>
      </div>
    );
  }

  // Helpers
  function getMonthData(m: number, y: number) {
    const plan = getMonthlyPlan(activePlan!.id, m, y);
    const reflection = plan ? getMonthlyReflection(plan.id) : undefined;
    return { plan, hasPlan: !!plan, reflection, hasReflection: !!reflection };
  }

  const { hasReflection } = getMonthData(month, year);
  const prev = getPrevMonth(month, year);
  const next = getNextMonth(month, year);
  const prevData = getMonthData(prev.month, prev.year);

  const isCurrent = month === currentMonth && year === currentYear;
  const isPast = year < currentYear || (year === currentYear && month < currentMonth);
  const isUpcoming = year > currentYear || (year === currentYear && month > currentMonth);
  const nmFromNow = getNextMonth(currentMonth, currentYear);
  const isNextMonth = month === nmFromNow.month && year === nmFromNow.year;
  const isFutureLocked = isUpcoming && !isNextMonth;

  // Reflection logic
  const reflectionAvailable = isReflectionOpen(month, year, now);
  const reflectionRequired = hasPlan;
  const reflectionDeadline = getReflectionDeadline(month, year);
  const reflectionDaysLeft = daysUntil(reflectionDeadline, now);
  const reflectionOverdue = isReflectionOverdue(month, year, now) && !hasReflection && reflectionRequired;
  const lastDay = getLastDayOfMonth(month, year);

  // Goals logic
  const goalsUnlocked = canSetGoalsForMonth(prevData.hasPlan, prevData.hasReflection);
  const goalsDeadline = getGoalsDeadline(month, year);
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/development-plan')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Terug naar ontwikkelplan
        </button>
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-foreground">{monthNames[month]} {year}</h1>
        </div>
      </div>

      {/* Future locked state */}
      {isFutureLocked && (
        <div className="bg-card rounded-[14px] p-8 text-center">
          <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-foreground mb-2">Deze maand is nog niet beschikbaar</h3>
          <p className="text-muted-foreground">
            {monthNames[month]} wordt beschikbaar wanneer de maand begint.
          </p>
        </div>
      )}

      {!isFutureLocked && (
        <>
          {renderAlertBanner()}
          {isEditing ? renderEditForm() : renderGoalsCard()}
          {renderReflectionCard()}
        </>
      )}
    </div>
  );

  function renderAlertBanner() {
    if (isUpcoming && !goalsUnlocked && prevData.hasPlan) {
      return (
        <div className="bg-card rounded-[14px] p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-badge-yellow shrink-0" />
          <p className="text-muted-foreground">
            Schrijf eerst je reflectie voor {monthNames[prev.month].toLowerCase()} voordat je doelen kunt stellen
          </p>
        </div>
      );
    }

    if ((isCurrent || isPast) && hasPlan && !hasReflection && reflectionAvailable) {
      return (
        <div className="bg-card rounded-[14px] p-6 flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 shrink-0 ${reflectionOverdue ? 'text-destructive' : 'text-badge-yellow'}`} />
          <p className="text-muted-foreground">
            {reflectionOverdue
              ? `De deadline voor je reflectie van ${monthNames[month].toLowerCase()} is verlopen`
              : `Je hebt nog tot ${formatDeadline(reflectionDeadline)} om je reflectie te doen`
            }
          </p>
        </div>
      );
    }

    return null;
  }

  function renderEditForm() {
    return (
      <div className="bg-card rounded-[14px] p-8 space-y-6">
        <h3 className="text-foreground">
          {hasPlan ? 'Plan bewerken' : 'Plan opstellen'} — {monthNames[month]} {year}
        </h3>
        <p className="text-muted-foreground">
          Voeg eenvoudige acties toe per competentie. Houd het kort en concreet.
        </p>

        {activePlan!.goals.map(goal => {
          const comp = getCompetency(goal.competencyId);
          const cat = getCategoryForCompetency(goal.competencyId);
          const compTasks = tasksDraft.filter(t => t.competencyId === goal.competencyId);
          const inputState = draftInputs[goal.competencyId] || { title: '', recurring: false };
          const suggestions = getSuggestionsForCompetency(goal.competencyId);
          return (
            <div key={goal.competencyId} className="border-t border-border pt-6 first:border-t-0 first:pt-0">
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
                  <p className="text-foreground text-[1.05rem] leading-relaxed font-medium">
                    {comp.name}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <div className="divide-y divide-border/50">
                {compTasks.map(task => {
                    const isDone = task.status === 'done';
                    return (
                    <div key={task.id} className="flex items-center gap-3 py-2 group">
                        <button
                          onClick={() => updateDraftTask(task.id, { status: isDone ? 'open' : 'done' })}
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            isDone ? 'bg-foreground border-foreground text-primary-foreground' : 'border-border text-transparent'
                          }`}
                        >
                          ✓
                        </button>
                        <input
                          value={task.title}
                          onChange={e => updateDraftTask(task.id, { title: e.target.value })}
                          className="flex-1 bg-transparent text-foreground text-[0.95rem] placeholder:text-muted-foreground focus:outline-none"
                          placeholder={`Wat ga je deze maand doen voor ${comp.name.toLowerCase()}?`}
                        />
                        <button
                          onClick={() => removeDraftTask(task.id)}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                          aria-label="Verwijder actie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateDraftTask(task.id, { type: task.type === 'recurring' ? 'one-time' : 'recurring' })}
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[0.75rem] border ${
                            task.type === 'recurring'
                              ? 'border-foreground text-foreground'
                              : 'border-border text-muted-foreground'
                          }`}
                          title={task.type === 'recurring' ? 'Terugkerend' : 'Eenmalig'}
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          Recurring
                        </button>
                    </div>
                  );
                })}

                  <div className="flex items-center gap-3 py-2">
                    <div className="h-5 w-5 rounded-full border border-border" />
                    <input
                      value={inputState.title}
                      onChange={e => setDraftInput(goal.competencyId, { title: e.target.value })}
                      className="flex-1 bg-transparent text-foreground text-[0.95rem] placeholder:text-muted-foreground focus:outline-none"
                      placeholder={`Voeg een actie toe voor ${comp.name.toLowerCase()}...`}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTaskForCompetency(goal.competencyId, inputState.title, inputState.recurring);
                        }
                      }}
                    />
                    <button
                      onClick={() => setDraftInput(goal.competencyId, { recurring: !inputState.recurring })}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[0.75rem] border ${
                        inputState.recurring
                          ? 'border-foreground text-foreground'
                          : 'border-border text-muted-foreground'
                      }`}
                      title={inputState.recurring ? 'Terugkerend' : 'Eenmalig'}
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      Recurring
                    </button>
                  </div>
                  <button
                    onClick={() => addTaskForCompetency(goal.competencyId, inputState.title, inputState.recurring)}
                    className={`mt-2 flex items-center gap-2 py-1 text-[0.8rem] font-normal text-muted-foreground hover:text-foreground ${
                      inputState.title.trim().length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={inputState.title.trim().length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    Voeg een actie toe
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className="pt-3">
                    <div className="bg-muted/40 rounded-[5px] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-muted-foreground text-[0.8rem]">Suggesties</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => scrollSuggestions(goal.competencyId, 'left')}
                            className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                            aria-label="Vorige suggestie"
                          >
                            <ChevronLeft className="w-4 h-4 mx-auto" />
                          </button>
                          <button
                            onClick={() => scrollSuggestions(goal.competencyId, 'right')}
                            className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                            aria-label="Volgende suggestie"
                          >
                            <ChevronRight className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                      <div
                        ref={el => { suggestionRefs.current[goal.competencyId] = el; }}
                        className="flex gap-2 overflow-x-auto pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => addSuggestedTask(goal.competencyId, s)}
                            className="shrink-0 px-3 py-2 rounded-[8px] border border-border/60 bg-white/80 text-[0.85rem] text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 text-left whitespace-normal max-w-[260px]"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!hasAnyTasks}
            className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
              hasAnyTasks
                ? 'bg-foreground text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {hasPlan ? 'Plan bijwerken' : 'Plan opslaan'}
          </button>
        </div>
      </div>
    );
  }

  function renderGoalsCard() {
    const blocked = !goalsUnlocked && !hasPlan;

    if (blocked) {
      return (
        <div className="bg-card rounded-[14px] p-8 opacity-60">
          <h3 className="text-foreground mb-4">
            Plan voor {monthNames[month]} {year}
          </h3>
          <p className="text-muted-foreground">
            Doe eerst de reflectie van {monthNames[prev.month].toLowerCase()} voordat je een nieuw plan kunt maken.
          </p>
        </div>
      );
    }

    if (!hasPlan) {
      return (
        <div className="bg-card rounded-[14px] p-8">
          <h3 className="text-foreground mb-4">
            Plan voor {monthNames[month]} {year}
          </h3>
          <p className="text-muted-foreground mb-6">
            Voeg een paar taken toe voor deze maand. Stel je plan op voor uiterlijk {formatDeadline(goalsDeadline)}.
          </p>
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity"
          >
            Plan opstellen
          </button>
        </div>
      );
    }

    return (
      <MonthlyGoalsCard
        month={month}
        year={year}
        goals={activePlan!.goals}
        monthlyPlan={monthlyPlan!}
        onEdit={startEditing}
        onToggleTask={toggleTaskStatus}
      />
    );
  }

  function renderReflectionCard() {
    const blocked = !reflectionAvailable && !hasReflection;
    const isUpcomingReflection = isUpcoming;

    let statusLabel = '';
    let statusClasses = '';
    if (hasReflection) {
      statusLabel = 'Ingevuld';
      statusClasses = 'bg-emerald-100 text-emerald-700';
    } else if (reflectionOverdue) {
      statusLabel = 'Te laat';
      statusClasses = 'bg-red-100 text-red-700';
    } else if (reflectionAvailable && reflectionRequired) {
      statusLabel = 'Open';
      statusClasses = 'bg-badge-yellow/20 text-foreground';
    } else if (blocked || isUpcomingReflection) {
      statusLabel = 'Vergrendeld';
      statusClasses = 'bg-muted text-muted-foreground';
    }

    return (
      <div className="bg-card rounded-[14px] p-8">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-foreground">Maandreflectie</h3>
          {statusLabel && (
            <span className={`text-[12px] px-3 py-1 rounded-full ${statusClasses}`}>
              {statusLabel}
            </span>
          )}
        </div>

        <p className="text-muted-foreground mb-4">
          {hasReflection
            ? 'Je reflectie voor deze maand is ingevuld.'
            : blocked || isUpcomingReflection
              ? `De reflectie wordt beschikbaar vanaf ${lastDay.getDate()} ${monthNames[month].toLowerCase()}.`
              : 'Blik terug op de afgelopen maand. Wat ging goed? Wat leerde je? Wat doe je anders?'
          }
        </p>

        {!hasReflection && reflectionAvailable && !reflectionOverdue && (
          <p className="text-muted-foreground text-[14px] mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Deadline: {formatDeadline(reflectionDeadline)}
            {reflectionDaysLeft > 0 && ` · nog ${reflectionDaysLeft} ${reflectionDaysLeft === 1 ? 'dag' : 'dagen'}`}
          </p>
        )}

        {(reflectionAvailable || hasReflection) && (
          <button
            onClick={() => navigate(`/reflection/${month}/${year}`)}
            className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-opacity ${
              hasReflection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'bg-foreground text-primary-foreground hover:opacity-90'
            }`}
          >
            {hasReflection ? 'Bekijk reflectie' : 'Schrijf reflectie'}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
}
