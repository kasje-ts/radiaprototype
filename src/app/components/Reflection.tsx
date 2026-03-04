import { useState, useEffect } from 'react';
import { useApp } from '../data/AppContext';
import { getCompetency, getCategoryForCompetency } from '../data/competencies';
import type { CompetencyId } from '../data/competencies';
import type { ReflectionNoteEntry } from '../data/store';
import { CheckCircle2, AlertCircle, ArrowLeft, Save, Repeat, Image as ImageIcon, FileText, Link as LinkIcon } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';

const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

const progressOptions = [
  { value: 'veel' as const, label: 'Veel progressie', color: '#22c55e', bg: '#f0fdf4' },
  { value: 'redelijk' as const, label: 'Redelijke progressie', color: '#eab308', bg: '#fefce8' },
  { value: 'weinig' as const, label: 'Weinig progressie', color: '#f97316', bg: '#fff7ed' },
  { value: 'geen' as const, label: 'Geen progressie', color: '#ef4444', bg: '#fef2f2' },
];

interface ReflectionDraft {
  competencyId: CompetencyId;
  progressFeeling: 'veel' | 'redelijk' | 'weinig' | 'geen' | '';
  noteText: string;
  attachments: { id: string; type: 'image' | 'file' | 'link'; label: string }[];
}

export function Reflection() {
  const { month: monthParam, year: yearParam } = useParams();
  const navigate = useNavigate();
  const {
    getActivePlan,
    getMonthlyPlan,
    getMonthlyReflection,
    addMonthlyReflection,
    updateMonthlyPlan,
    getNow,
  } = useApp();

  const now = getNow();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const viewMonth = monthParam !== undefined ? parseInt(monthParam, 10) : currentMonth;
  const viewYear = yearParam !== undefined ? parseInt(yearParam, 10) : currentYear;

  const activePlan = getActivePlan();
  const monthlyPlan = activePlan ? getMonthlyPlan(activePlan.id, viewMonth, viewYear) : undefined;
  const existingReflection = monthlyPlan ? getMonthlyReflection(monthlyPlan.id) : undefined;
  const nextMonth = viewMonth === 11
    ? { month: 0, year: viewYear + 1 }
    : { month: viewMonth + 1, year: viewYear };
  const isPrevOfNow = nextMonth.month === currentMonth && nextMonth.year === currentYear;
  const currentMonthlyPlan = activePlan
    ? getMonthlyPlan(activePlan.id, currentMonth, currentYear)
    : undefined;
  const shouldPromptNextPlan = isPrevOfNow && !currentMonthlyPlan;

  const [drafts, setDrafts] = useState<ReflectionDraft[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activePlan && monthlyPlan && !existingReflection && drafts.length === 0) {
      const newDrafts: ReflectionDraft[] = activePlan.goals.map(g => ({
        competencyId: g.competencyId,
        progressFeeling: '',
        noteText: '',
        attachments: [],
      }));
      setDrafts(newDrafts);
    }
  }, [activePlan, monthlyPlan, existingReflection]);

  const updateDraft = (index: number, field: keyof ReflectionDraft, value: string) => {
    setDrafts(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const canSave = drafts.every(d => d.progressFeeling !== '');

  const addAttachment = (index: number, type: 'image' | 'file' | 'link') => {
    const label = type === 'image'
      ? 'screenshot.png'
      : type === 'file'
        ? 'document.pdf'
        : 'link';
    setDrafts(prev => prev.map((d, i) => {
      if (i !== index) return d;
      const count = d.attachments.filter(a => a.type === type).length + 1;
      const nextLabel = type === 'link' ? `link ${count}` : label;
      return {
        ...d,
        attachments: [
          ...d.attachments,
          { id: `${type}-${count}-${Date.now()}`, type, label: nextLabel },
        ],
      };
    }));
  };

  const handleSave = () => {
    if (!canSave || !monthlyPlan || !activePlan) return;

    addMonthlyReflection({
      monthlyPlanId: monthlyPlan.id,
      developmentPlanId: activePlan.id,
      month: viewMonth,
      year: viewYear,
      reflections: drafts.map(d => ({
        competencyId: d.competencyId,
        progressFeeling: d.progressFeeling as 'veel' | 'redelijk' | 'weinig' | 'geen',
        notes: d.noteText.trim()
          ? [{
              id: Math.random().toString(36).slice(2),
              type: 'text',
              content: d.noteText.trim(),
              createdAt: new Date().toISOString(),
            }]
          : [],
        whatDone: '',
        whatLearned: '',
        whatMissed: '',
      })),
    });
    setSaved(true);
    setDrafts([]);
  };

  const goBack = () => navigate(`/month/${viewMonth}/${viewYear}`);

  const toggleTaskStatus = (taskId: string) => {
    if (!monthlyPlan) return;
    const updated = monthlyPlan.tasks.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? 'open' : 'done' } : t
    );
    updateMonthlyPlan(monthlyPlan.id, updated);
  };


  if (!activePlan) {
    return (
      <div className="space-y-6">
        <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /> Terug naar maandoverzicht
        </button>
        <h1 className="text-foreground">Reflectie</h1>
        <div className="bg-card rounded-[14px] p-12 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-foreground mb-2">Geen ontwikkelplan actief</h3>
          <p className="text-muted-foreground">Maak eerst een ontwikkelplan aan.</p>
        </div>
      </div>
    );
  }

  if (!monthlyPlan) {
    return (
      <div className="space-y-6">
        <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /> Terug naar {monthNames[viewMonth]} {viewYear}
        </button>
        <div className="bg-card rounded-[14px] p-12 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-foreground mb-2">Geen maandplan voor {monthNames[viewMonth]}</h3>
          <p className="text-muted-foreground">
            Je hebt nog geen maandplan voor {monthNames[viewMonth]} {viewYear}. Maak eerst een maandplan aan.
          </p>
        </div>
      </div>
    );
  }

  const renderTaskList = (compId: CompetencyId) => {
    const tasksForComp = monthlyPlan.tasks.filter(t => t.competencyId === compId);
    if (tasksForComp.length === 0) {
      return (
        <span className="inline-flex text-[0.8rem] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          Geen acties gekoppeld.
        </span>
      );
    }
    return (
      <div className="divide-y divide-border/50">
        {tasksForComp.map(task => {
          const isDone = task.status === 'done';
          return (
            <div key={task.id} className="flex items-center gap-3 py-2">
              <button
                onClick={() => toggleTaskStatus(task.id)}
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
    );
  };

  // View existing reflection (read-only)
  if (existingReflection && drafts.length === 0) {
    return (
      <div className="space-y-6">
        <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /> Terug naar {monthNames[viewMonth]} {viewYear}
        </button>

        <div className="space-y-4">
          <h1 className="text-foreground">Reflectie — {monthNames[viewMonth]} {viewYear}</h1>
          <p className="text-muted-foreground">Jouw reflectie op de voortgang van deze maand.</p>
        </div>

        {saved && (
          <div className="bg-emerald-50 rounded-[14px] p-4 flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Reflectie opgeslagen!
          </div>
        )}

        {existingReflection.reflections.map(ref => {
          const comp = getCompetency(ref.competencyId);
          const cat = getCategoryForCompetency(ref.competencyId);
          const goal = activePlan.goals.find(g => g.competencyId === ref.competencyId);
          const progress = progressOptions.find(p => p.value === ref.progressFeeling);
          const legacyNotes = [
            ref.whatDone?.trim(),
            ref.whatLearned?.trim(),
            ref.whatMissed?.trim(),
          ].filter(Boolean) as string[];
          const entries: ReflectionNoteEntry[] = ref.notes && ref.notes.length > 0
            ? ref.notes
            : legacyNotes.map((note, idx) => ({
                id: `${ref.competencyId}-legacy-${idx}`,
                type: 'text',
                content: note,
                createdAt: ref.createdAt,
              }));

          return (
            <div key={ref.competencyId} className="bg-card rounded-[14px] p-8">
              <div className="space-y-3 mb-6">
                <p className="text-foreground text-[1.05rem] leading-relaxed font-medium">
                  {goal?.goal || comp.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
                  <span className="inline-flex items-center gap-2 bg-muted/60 text-muted-foreground px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {comp.name}
                  </span>
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
              </div>

              {progress && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[14px]"
                  style={{ backgroundColor: progress.bg, color: progress.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: progress.color }} />
                  {progress.label}
                </div>
              )}

              <div className="mb-6 bg-accent rounded-[12px] p-4">
                <p className="text-muted-foreground text-[14px] mb-3">Acties voor deze competentie</p>
                {renderTaskList(ref.competencyId)}
              </div>

              <div className="space-y-3">
                <div className="text-muted-foreground text-[14px]">Notities</div>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-[14px]">
                    Geen notities toegevoegd.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {entries.map(entry => (
                      <div
                        key={`${ref.competencyId}-entry-${entry.id}`}
                        className="rounded-[10px] border border-border bg-accent px-4 py-3 text-[0.9rem] text-foreground"
                      >
                        {entry.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {shouldPromptNextPlan && (
          <div className="bg-card rounded-[14px] p-6 flex items-center justify-between">
            <div>
              <div className="text-foreground text-[0.95rem]">Maak het plan voor deze maand</div>
              <div className="text-muted-foreground text-[0.85rem]">
                Zet je acties klaar voor {monthNames[currentMonth]} {currentYear}.
              </div>
            </div>
            <button
              onClick={() => navigate(`/month/${currentMonth}/${currentYear}`)}
              className="px-[18px] py-[10px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity"
            >
              Maandplan maken
            </button>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
      <div className="space-y-6">
      <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" /> Terug naar {monthNames[viewMonth]} {viewYear}
      </button>

      <div className="space-y-4">
        <h1 className="text-foreground">Reflectie — {monthNames[viewMonth]} {viewYear}</h1>
        <p className="text-muted-foreground">
          Reflecteer per ontwikkeldoel op wat je hebt gedaan, geleerd en gemist.
        </p>
      </div>

      {drafts.map((draft, index) => {
        const comp = getCompetency(draft.competencyId);
        const cat = getCategoryForCompetency(draft.competencyId);
        const goal = activePlan.goals.find(g => g.competencyId === draft.competencyId);
        return (
          <div key={draft.competencyId} className="bg-card rounded-[14px] p-8">
            <div className="space-y-3 mb-6">
              <p className="text-foreground text-[1.05rem] leading-relaxed font-medium">
                {goal?.goal || comp.name}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
                <span className="inline-flex items-center gap-2 bg-muted/60 text-muted-foreground px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {comp.name}
                </span>
                <span className="text-muted-foreground">{cat.name}</span>
              </div>
            </div>

            <div className="mb-6 bg-accent rounded-[12px] p-4">
              <p className="text-muted-foreground text-[14px] mb-3">Acties voor deze competentie</p>
              {renderTaskList(draft.competencyId)}
            </div>

            {/* Progress feeling */}
            <div className="mb-6">
              <label className="text-muted-foreground text-[14px] block mb-3">
                Hoeveel progressie heb je gemaakt? *
              </label>
              <div className="flex flex-wrap gap-2">
                {progressOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateDraft(index, 'progressFeeling', opt.value)}
                    className={`px-4 py-3 rounded-[10px] border text-[14px] transition-all ${
                      draft.progressFeeling === opt.value
                        ? 'border-transparent text-white'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                    style={
                      draft.progressFeeling === opt.value
                        ? { backgroundColor: opt.color }
                        : {}
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-muted-foreground text-[14px] block">
                Notities
              </label>
              <div className="relative rounded-[10px] border border-border bg-accent">
                <textarea
                  value={draft.noteText}
                  onChange={e => updateDraft(index, 'noteText', e.target.value)}
                  placeholder="Schrijf je gedachten, inzichten of observaties..."
                  className="w-full px-4 py-3 pr-20 bg-transparent text-foreground resize-none h-28 placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addAttachment(index, 'image')}
                    className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 flex items-center justify-center"
                    aria-label="Afbeelding toevoegen"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addAttachment(index, 'file')}
                    className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 flex items-center justify-center"
                    aria-label="Document toevoegen"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addAttachment(index, 'link')}
                    className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 flex items-center justify-center"
                    aria-label="Link toevoegen"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="border-t border-border/70 px-3 py-2 bg-background/60">
                  <div className="flex flex-wrap items-center gap-2 text-[0.8rem] text-muted-foreground">
                    {draft.attachments.length === 0 ? (
                      <span className="text-muted-foreground">
                        Voeg attachments toe
                      </span>
                    ) : (
                      draft.attachments.map(att => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1"
                        >
                          {att.type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {att.type === 'file' && <FileText className="w-3 h-3" />}
                          {att.type === 'link' && <LinkIcon className="w-3 h-3" />}
                          {att.label}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Save */}
      <div className="flex items-center gap-3 sticky bottom-4 bg-card rounded-[14px] p-6">
        <button
          onClick={goBack}
          className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
            canSave
              ? 'bg-foreground text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          Reflectie opslaan
        </button>
      </div>

      {saved && shouldPromptNextPlan && (
        <div className="bg-card rounded-[14px] p-6 flex items-center justify-between">
          <div>
            <div className="text-foreground text-[0.95rem]">Maak het plan voor deze maand</div>
            <div className="text-muted-foreground text-[0.85rem]">
              Zet je acties klaar voor {monthNames[currentMonth]} {currentYear}.
            </div>
          </div>
          <button
            onClick={() => navigate(`/month/${currentMonth}/${currentYear}`)}
            className="px-[18px] py-[10px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity"
          >
            Maandplan maken
          </button>
        </div>
      )}
    </div>
  );
}
