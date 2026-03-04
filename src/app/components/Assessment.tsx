import { useState } from 'react';
import { useApp } from '../data/AppContext';
import {
  categories,
  competencies,
  expectations,
  scoreLabels,
  scoreColors,
  getCompetency,
  getCategoryForCompetency,
} from '../data/competencies';
import type { AssessmentScore, CompetencyId } from '../data/competencies';
import { roleLabels } from '../data/competencies';
import type { AssessmentEntry } from '../data/store';
import { ArrowLeft, ArrowRight, Plus, ClipboardCheck, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { GenericRadarChart } from './GenericRadarChart';

type View = 'list' | 'new' | 'detail' | 'results';

export function Assessment() {
  const { state, addAssessment } = useApp();
  const [view, setView] = useState<View>('list');
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentEntry | null>(null);
  const [scores, setScores] = useState<Partial<Record<CompetencyId, AssessmentScore>>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedCompetency, setExpandedCompetency] = useState<CompetencyId | null>(null);

  const totalSteps = competencies.length;
  const allFilled = competencies.every(c => scores[c.id] !== undefined);
  const sortedAssessments = [...state.assessments].reverse();
  const axisCompetencies = competencies.map(c => ({ key: c.id, name: c.name }));
  const categorySegments = categories.map(cat => ({
    color: cat.color,
    keys: cat.competencies,
    opacity: 0.08,
  }));
  const buildSelfSeries = (scoresToPlot: Partial<Record<CompetencyId, AssessmentScore>>, label = 'Zelf') => ([
    {
      label,
      color: '#6366F1',
      scores: scoresToPlot,
    },
  ]);

  const handleScore = (compId: CompetencyId, score: AssessmentScore) => {
    setScores(prev => ({ ...prev, [compId]: score }));
  };

  const handleSubmit = () => {
    if (!allFilled) return;
    const newAssessment = addAssessment(scores);
    setSelectedAssessment(newAssessment);
    setExpandedCompetency(null);
    setScores({});
    setCurrentStep(0);
    setView('results');
  };

  const openDetail = (assessment: AssessmentEntry) => {
    setSelectedAssessment(assessment);
    setExpandedCompetency(null);
    setView('detail');
  };

  const startNew = () => {
    setScores({});
    setCurrentStep(0);
    setView('new');
  };

  const goBack = () => {
    setView('list');
    setSelectedAssessment(null);
    setExpandedCompetency(null);
  };

  // ─── Results view ──────────────────────────────────────────────
  if (view === 'results' && selectedAssessment) {
    const date = new Date(selectedAssessment.date);
    const scoreEntries = Object.entries(selectedAssessment.scores) as [CompetencyId, AssessmentScore][];
    const avgScore = scoreEntries.length > 0
      ? (scoreEntries.reduce((sum, [, s]) => sum + s, 0) / scoreEntries.length).toFixed(1)
      : '-';
    const series = buildSelfSeries(selectedAssessment.scores);

    return (
      <div className="space-y-6">
        <div>
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" /> Terug naar overzicht
          </button>
          <div className="space-y-2">
            <h1 className="text-foreground">Assessment afgerond</h1>
            <p className="text-muted-foreground">
              Resultaten van {date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
              Gemiddelde score: <span className="text-foreground">{avgScore} / 5</span>
            </p>
          </div>
        </div>

        <div className="bg-card rounded-[14px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Radaroverzicht</h3>
            <span className="text-muted-foreground text-[0.875rem]">
              Gemiddeld: <span className="text-foreground">{avgScore}</span> / 5
            </span>
          </div>
          <GenericRadarChart competencies={axisCompetencies} series={series} segments={categorySegments} min={0} max={5} height={320} />
        </div>

        <div className="space-y-4">
          <h2 className="text-foreground">Scoreverdeling</h2>
          {categories.map(cat => {
            const catScores = cat.competencies
              .map(compId => selectedAssessment.scores[compId])
              .filter((s): s is AssessmentScore => s !== undefined);
            const catAvg = catScores.length > 0
              ? (catScores.reduce((a, b) => a + b, 0) / catScores.length).toFixed(1).replace('.', ',')
              : '-';

            return (
              <div key={cat.id} className="bg-card rounded-[14px] overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <h3 className="text-foreground">{cat.name}</h3>
                  </div>
                  <span className="text-muted-foreground text-[0.875rem]">
                    Gemiddeld: <span className="text-foreground text-[1.25rem]">{catAvg}</span> / 5
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {cat.competencies.map(compId => {
                    const comp = getCompetency(compId);
                    const score = selectedAssessment.scores[compId];

                    return (
                      <div key={compId} className="p-5 flex items-center justify-between">
                        <span className="text-foreground">{comp.name}</span>
                        {score ? (
                          <span
                            className="text-[14px] px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: scoreColors[score] + '18',
                              color: scoreColors[score],
                            }}
                          >
                            {scoreLabels[score]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[14px]">Niet beoordeeld</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Detail view ───────────────────────────────────────────────
  if (view === 'detail' && selectedAssessment) {
    const date = new Date(selectedAssessment.date);
    const scoreEntries = Object.entries(selectedAssessment.scores) as [CompetencyId, AssessmentScore][];
    const avgScore = scoreEntries.length > 0
      ? (scoreEntries.reduce((sum, [, s]) => sum + s, 0) / scoreEntries.length).toFixed(1)
      : '-';
    const series = buildSelfSeries(selectedAssessment.scores);

    return (
      <div className="space-y-6">
        <div>
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" /> Terug naar overzicht
          </button>
          <div className="space-y-4">
            <h1 className="text-foreground">
              Assessment van {date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-muted-foreground">
              Gemiddelde score: <span className="text-foreground">{avgScore} / 5</span>
            </p>
          </div>
        </div>

        <div className="bg-card rounded-[14px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Radaroverzicht</h3>
            <span className="text-muted-foreground text-[0.875rem]">
              Gemiddeld: <span className="text-foreground">{avgScore}</span> / 5
            </span>
          </div>
          <GenericRadarChart competencies={axisCompetencies} series={series} segments={categorySegments} min={0} max={5} height={320} />
        </div>

        {categories
          .map(cat => {
            const catScores = cat.competencies
              .map(compId => selectedAssessment.scores[compId])
              .filter((s): s is AssessmentScore => s !== undefined);
            const catAvgNum = catScores.length > 0
              ? catScores.reduce((a, b) => a + b, 0) / catScores.length
              : 0;
            const catAvg = catScores.length > 0
              ? catAvgNum.toFixed(1).replace('.', ',')
              : '-';
            return { cat, catAvg, catAvgNum };
          })
          .sort((a, b) => b.catAvgNum - a.catAvgNum)
          .map(({ cat, catAvg }) => {

          return (
          <div key={cat.id} className="bg-card rounded-[14px] overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <h3 className="text-foreground">{cat.name}</h3>
              </div>
              <span className="text-muted-foreground text-[0.875rem]">
                Gemiddeld: <span className="text-foreground text-[1.25rem]">{catAvg}</span> / 5
              </span>
            </div>
            <div className="divide-y divide-border">
              {cat.competencies.map(compId => {
                const comp = getCompetency(compId);
                const score = selectedAssessment.scores[compId];
                const isExpanded = expandedCompetency === compId;
                const expectation = expectations[state.role][compId];

                return (
                  <div key={compId} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{comp.name}</span>
                        <button
                          onClick={() => setExpandedCompetency(isExpanded ? null : compId)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                      {score ? (
                        <span
                          className="text-[14px] px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: scoreColors[score] + '18',
                            color: scoreColors[score],
                          }}
                        >
                          {scoreLabels[score]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[14px]">Niet beoordeeld</span>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 p-4 bg-accent rounded-[10px]">
                        <p className="text-muted-foreground leading-relaxed">
                          <span className="text-foreground">Verwachting ({roleLabels[state.role]}):</span>{' '}
                          {expectation}
                        </p>
                      </div>
                    )}

                    {score && (
                      <div className="flex gap-1.5 mt-4">
                        {([1, 2, 3, 4, 5] as AssessmentScore[]).map(s => (
                          <div
                            key={s}
                            className="h-2 flex-1 rounded-full transition-all"
                            style={{
                              backgroundColor: s <= score ? cat.color : 'var(--accent)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    );
  }

  // ─── New assessment: step-by-step wizard ────────────────────────
  if (view === 'new') {
    const currentCompetency = competencies[currentStep];
    const category = getCategoryForCompetency(currentCompetency.id);
    const expectation = expectations[state.role][currentCompetency.id];
    const currentScore = scores[currentCompetency.id];
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;
    const previewSeries = buildSelfSeries(scores, 'Zelf');

    const canGoPrev = currentStep > 0;
    const isLast = currentStep === totalSteps - 1;
    const hasAnswered = currentScore !== undefined;

    const handleNext = () => {
      if (!hasAnswered) return;
      if (isLast && allFilled) {
        handleSubmit();
      } else if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
      }
    };

    const handlePrev = () => {
      if (canGoPrev) {
        setCurrentStep(prev => prev - 1);
      }
    };

    const handleSelectScore = (score: AssessmentScore) => {
      handleScore(currentCompetency.id, score);
    };

    return (
      <div className="space-y-8">
        {/* Header with back button */}
        <div>
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" /> Stoppen
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <span className="text-muted-foreground text-[0.875rem]">
            Vraag {currentStep + 1} van {totalSteps}
          </span>
          <div className="w-full h-[6px] bg-[#e6e6e6] rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-card rounded-[14px] p-8 space-y-8">
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-muted-foreground text-[0.875rem]">{category.name}</span>
          </div>

          {/* Competency name */}
          <h2 className="text-foreground">{currentCompetency.name}</h2>

          {/* Expectation text */}
          <div className="p-5 bg-[#f5f5f5] rounded-[10px]">
            <p className="text-muted-foreground text-[0.875rem] mb-2">
              Verwachting voor {roleLabels[state.role]}:
            </p>
            <p className="text-foreground leading-relaxed">
              {expectation}
            </p>
          </div>

          {/* Question */}
          <div className="space-y-5">
            <p className="text-foreground text-[1.1rem]">
              In hoeverre voldoe je aan deze verwachting?
            </p>

            {/* Answer options */}
            <div className="space-y-3">
              {([1, 2, 3, 4, 5] as AssessmentScore[]).map(score => {
                const isSelected = currentScore === score;
                return (
                  <button
                    key={score}
                    onClick={() => handleSelectScore(score)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[10px] border transition-all text-left ${
                      isSelected
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-[#e6e6e6] bg-white text-foreground hover:border-foreground/30'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-background'
                          : 'border-[#ccc]'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-background" />
                      )}
                    </span>
                    <span>{scoreLabels[score]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[14px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Radaroverzicht</h3>
            <span className="text-muted-foreground text-[0.875rem]">
              Live preview
            </span>
          </div>
          <GenericRadarChart competencies={axisCompetencies} series={previewSeries} segments={categorySegments} min={0} max={5} height={260} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
              canGoPrev
                ? 'border border-foreground text-foreground hover:bg-accent'
                : 'border border-[#e6e6e6] text-muted-foreground cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Vorige
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
                allFilled
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Assessment opslaan
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className={`flex items-center gap-2 px-[21px] py-[14px] rounded-[10px] transition-all ${
                hasAnswered
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Volgende <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── List view (default) ───────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <h1 className="text-foreground">Assessments</h1>
          <p className="text-muted-foreground">
            Bekijk je eerdere assessments of start een nieuw assessment.
          </p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Nieuw assessment
        </button>
      </div>

      <div className="bg-card rounded-[14px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground">Radaroverzicht</h3>
          <span className="text-muted-foreground text-[0.875rem]">
            {sortedAssessments.length > 0 ? 'Laatste assessment' : 'Nog geen data'}
          </span>
        </div>
        {sortedAssessments.length > 0 ? (
          <p className="text-muted-foreground text-[0.875rem]">
            {new Date(sortedAssessments[0].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        ) : null}
        <GenericRadarChart
          competencies={axisCompetencies}
          series={buildSelfSeries(sortedAssessments[0]?.scores ?? {})}
          segments={categorySegments}
          min={0}
          max={5}
          height={280}
        />
      </div>

      {sortedAssessments.length === 0 ? (
        <div className="bg-card rounded-[14px] p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-foreground mb-2">Nog geen assessments</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">Je hebt nog geen assessment gedaan. Start je eerste assessment om je huidige niveau in kaart te brengen.</p>
          <button
            onClick={startNew}
            className="px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Start eerste assessment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssessments.map((assessment) => {
            const date = new Date(assessment.date);
            const formattedDate = date.toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            const categoryAverages = categories.map(cat => {
              const catScores = cat.competencies
                .map(compId => assessment.scores[compId])
                .filter((s): s is number => s !== undefined);
              const avg = catScores.length > 0
                ? (catScores.reduce((a, b) => a + b, 0) / catScores.length).toFixed(1).replace('.', ',')
                : '–';
              return { name: cat.name, color: cat.color, avg };
            });

            return (
              <button
                key={assessment.id}
                onClick={() => openDetail(assessment)}
                className="w-full bg-card rounded-[14px] px-8 py-6 hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground text-[14px]">Gedaan door mij</p>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1 text-[14px]">
                    <Eye className="w-4 h-4" /> Bekijk
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {categoryAverages.map(cat => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-foreground">
                        {cat.name}: {cat.avg}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-[14px] mt-4">{formattedDate}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
