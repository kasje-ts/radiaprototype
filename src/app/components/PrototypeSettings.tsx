import { useState } from 'react';
import { useApp } from '../data/AppContext';
import { monthNames } from '../data/planning-logic';
import {
  Settings, Calendar, Trash2, RotateCcw, AlertTriangle,
  Target, MessageSquare, ClipboardCheck,
} from 'lucide-react';

export function PrototypeSettings() {
  const {
    state, getNow, setFakeDate,
    deleteMonthlyPlan, deleteMonthlyReflection,
    deleteAssessment, deleteDevelopmentPlan, resetAll,
    getActivePlan, getMonthlyPlan, getMonthlyReflection,
    loadDemoProfile,
  } = useApp();

  const now = getNow();
  const realNow = new Date();
  const isFaked = !!state.fakeDate;

  const [dateInput, setDateInput] = useState(
    state.fakeDate
      ? new Date(state.fakeDate).toISOString().split('T')[0]
      : ''
  );

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const hasDemoProfile = !!state.demoProfile;

  const activePlan = getActivePlan();
  const currentYear = now.getFullYear();

  const monthData = Array.from({ length: 12 }, (_, m) => {
    const mp = activePlan ? getMonthlyPlan(activePlan.id, m, currentYear) : undefined;
    const refl = mp ? getMonthlyReflection(mp.id) : undefined;
    return {
      month: m,
      hasPlan: !!mp,
      hasReflection: !!refl,
      planCount: mp ? (mp.tasks || []).length : 0,
    };
  });

  const handleSetDate = () => {
    if (dateInput) {
      setFakeDate(new Date(dateInput + 'T12:00:00').toISOString());
    }
  };

  const handleClearDate = () => {
    setFakeDate(undefined);
    setDateInput('');
  };

  const handleResetAll = () => {
    resetAll();
    setShowResetConfirm(false);
  };

  const presets = [
    { label: 'Begin jan', date: currentYear + '-01-02' },
    { label: 'Eind jan', date: currentYear + '-01-31' },
    { label: '7 feb', date: currentYear + '-02-07' },
    { label: 'Begin mrt', date: currentYear + '-03-02' },
    { label: 'Eind mrt', date: currentYear + '-03-31' },
    { label: '7 apr', date: currentYear + '-04-07' },
    { label: 'Vandaag', date: realNow.toISOString().split('T')[0] },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-foreground flex items-center gap-3">
           Prototype instellingen
        </h1>
        <p className="text-muted-foreground">
          Test de applicatie door de datum te wijzigen en data te beheren.
        </p>
      </div>

      {isFaked && (
        <div className="bg-badge-yellow/20 rounded-[14px] p-6 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-foreground">
              Fictieve datum actief:{' '}
              <span className="font-[600]">
                {now.toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
            <p className="text-muted-foreground text-[14px] mt-1">
              Echte datum:{' '}
              {realNow.toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={handleClearDate}
            className="px-[21px] py-[14px] bg-card text-foreground rounded-[10px] hover:bg-muted transition-colors"
          >
            Reset naar vandaag
          </button>
        </div>
      )}

      {/* Fictieve datum */}
      <div className="bg-card rounded-[14px] p-8">
        <h3 className="text-foreground mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Fictieve datum
        </h3>
        <p className="text-muted-foreground text-[14px] mb-6">
          Stel een fictieve datum in om te testen hoe de app zich gedraagt op
          verschillende momenten in het jaar.
        </p>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="px-4 py-3 rounded-[10px] border border-border bg-background text-foreground w-52"
          />
          <button
            onClick={handleSetDate}
            disabled={!dateInput}
            className={
              'px-[21px] py-[14px] rounded-[10px] transition-all ' +
              (dateInput
                ? 'bg-foreground text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed')
            }
          >
            Datum instellen
          </button>
          {isFaked && (
            <button
              onClick={handleClearDate}
              className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
            >
              Wissen
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setDateInput(p.date);
                setFakeDate(new Date(p.date + 'T12:00:00').toISOString());
              }}
              className={
                'px-4 py-2 rounded-full border text-[14px] transition-colors ' +
                (dateInput === p.date
                  ? 'border-foreground bg-foreground/5 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground')
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Realistic demo profile */}
      <div className="bg-card rounded-[14px] p-8">
        <h3 className="text-foreground mb-2 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" /> Realistisch profiel
        </h3>
        <p className="text-muted-foreground text-[14px] mb-6">
          Laad een volwassen gebruiker met assessments, plannen, acties en reflecties
          om de volledige productflow te bekijken.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {!hasDemoProfile ? (
            <button
              onClick={() => loadDemoProfile(state.fakeDate)}
              className="px-[21px] py-[14px] bg-foreground text-primary-foreground rounded-[10px] hover:opacity-90 transition-opacity"
            >
              Realistisch profiel laden
            </button>
          ) : (
            <>
              <span className="text-muted-foreground text-[14px]">
                Demo profiel is actief.
              </span>
              <button
                onClick={resetAll}
                className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
              >
                Reset naar leeg profiel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Maanddata beheren */}
      <div className="bg-card rounded-[14px] p-8">
        <h3 className="text-foreground mb-2 flex items-center gap-2">
          <Target className="w-5 h-5" /> Maanddata beheren
        </h3>
        <p className="text-muted-foreground text-[14px] mb-6">
          Verwijder maandplannen en reflecties per maand. Het verwijderen van een
          maandplan verwijdert ook de bijbehorende reflectie.
        </p>

        {!activePlan ? (
          <p className="text-muted-foreground italic">
            Geen actief ontwikkelplan gevonden voor {currentYear}.
          </p>
        ) : (
          <div className="space-y-2">
            {monthData.map((md) => (
              <div
                key={md.month}
                className={
                  'flex items-center gap-4 px-4 py-3 rounded-[10px] ' +
                  (md.hasPlan || md.hasReflection
                    ? 'bg-accent'
                    : 'bg-accent/50')
                }
              >
                <span className="text-foreground w-24 shrink-0">
                  {monthNames[md.month]}
                </span>

                <div className="flex items-center gap-2 flex-1">
                  {md.hasPlan ? (
                    <span className="flex items-center gap-1 text-[12px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Target className="w-3 h-3" />
                      {md.planCount} {md.planCount === 1 ? 'taak' : 'taken'}
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted-foreground/50">
                      Geen doelen
                    </span>
                  )}

                  {md.hasReflection && (
                    <span className="flex items-center gap-1 text-[12px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <MessageSquare className="w-3 h-3" />
                      Reflectie
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {md.hasReflection && (
                    <button
                      onClick={() =>
                        deleteMonthlyReflection(md.month, currentYear)
                      }
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-[10px] text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Reflectie
                    </button>
                  )}
                  {md.hasPlan && (
                    <button
                      onClick={() => deleteMonthlyPlan(md.month, currentYear)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-[10px] text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Doelen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assessments beheren */}
      <div className="bg-card rounded-[14px] p-8">
        <h3 className="text-foreground mb-2 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" /> Assessments beheren
        </h3>
        <p className="text-muted-foreground text-[14px] mb-6">
          Verwijder individuele assessments.
        </p>

        {state.assessments.length === 0 ? (
          <p className="text-muted-foreground italic">
            Geen assessments gevonden.
          </p>
        ) : (
          <div className="space-y-2">
            {[...state.assessments].reverse().map((a) => {
              const date = new Date(a.date);
              const scoreCount = Object.keys(a.scores).length;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-[10px] bg-accent"
                >
                  <span className="text-foreground flex-1">
                    {date.toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-muted-foreground text-[14px]">
                    {scoreCount} competenties beoordeeld
                  </span>
                  <button
                    onClick={() => deleteAssessment(a.id)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-[10px] text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Verwijderen
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ontwikkelplannen beheren */}
      <div className="bg-card rounded-[14px] p-8">
        <h3 className="text-foreground mb-2 flex items-center gap-2">
          <Target className="w-5 h-5" /> Ontwikkelplannen beheren
        </h3>
        <p className="text-muted-foreground text-[14px] mb-6">
          Het verwijderen van een plan verwijdert ook alle bijbehorende
          maandplannen en reflecties.
        </p>

        {state.developmentPlans.length === 0 ? (
          <p className="text-muted-foreground italic">
            Geen ontwikkelplannen gevonden.
          </p>
        ) : (
          <div className="space-y-2">
            {state.developmentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center gap-4 px-4 py-3 rounded-[10px] bg-accent"
              >
                <span className="text-foreground flex-1">
                  Ontwikkelplan {plan.year}
                </span>
                <span className="text-muted-foreground text-[14px]">
                  {plan.goals.length} doelen
                </span>
                <button
                  onClick={() => deleteDevelopmentPlan(plan.id)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-[10px] text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Verwijderen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alles resetten */}
      <div className="bg-red-50/50 border border-red-200 rounded-[14px] p-8">
        <h3 className="text-red-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Alles resetten
        </h3>
        <p className="text-red-700/70 text-[14px] mb-6">
          Verwijder alle data: assessments, ontwikkelplannen, maandplannen,
          reflecties en de fictieve datum.
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-[21px] py-[14px] border border-red-300 rounded-[10px] text-red-700 hover:bg-red-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Alles resetten
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-red-800">
              Weet je het zeker?
            </span>
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-[21px] py-[14px] bg-red-600 text-white rounded-[10px] hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Ja, alles verwijderen
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-[21px] py-[14px] bg-muted text-foreground rounded-[10px] hover:bg-muted/80 transition-colors"
            >
              Annuleren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
