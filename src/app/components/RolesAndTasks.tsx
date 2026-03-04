import { useState } from 'react';
import { useApp } from '../data/AppContext';
import {
  categories,
  competencies,
  expectations,
  roleLabels,
  type Role,
  type CategoryId,
} from '../data/competencies';
import { MapPin } from 'lucide-react';

const roles: Role[] = ['junior', 'medior', 'senior'];

const categoryDescriptions: Record<CategoryId, string> = {
  product_execution: 'Het vermogen om effectief producten te bouwen en te verbeteren.',
  customer_insight: 'Het begrijpen van klantbehoeften en marktontwikkelingen.',
  product_strategy: 'Het bepalen van richting en lange termijn waarde van het product.',
  influencing_people: 'Het creëren van alignment en draagvlak bij betrokkenen.',
};

export function RolesAndTasks() {
  const { state } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role>(state.role);
  const isCurrentRole = selectedRole === state.role;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-foreground">Verwachtingen per rol</h1>
        <p className="text-muted-foreground">
          Selecteer een niveau om te zien wat er van die rol verwacht wordt.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex items-center gap-4">
        <div className="flex bg-card rounded-[10px] p-1">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-6 py-3 rounded-[8px] transition-colors ${
                selectedRole === role
                  ? 'bg-foreground text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>
        {isCurrentRole && (
          <span className="flex items-center gap-2 text-[14px] text-muted-foreground">
            <MapPin className="w-4 h-4" /> Jij bent op dit niveau
          </span>
        )}
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => {
          const catCompetencies = competencies.filter(c => c.categoryId === cat.id);
          return (
            <div
              key={cat.id}
              className="bg-card rounded-[14px] p-8"
            >
              {/* Category header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h3 className="text-foreground">{cat.name}</h3>
                </div>
                <p className="text-muted-foreground text-[14px]">
                  {categoryDescriptions[cat.id as CategoryId]}
                </p>
              </div>

              {/* Competencies */}
              <div className="space-y-5">
                {catCompetencies.map(comp => (
                  <div key={comp.id}>
                    <h4 className="text-foreground mb-1">{comp.name}</h4>
                    <p className="text-muted-foreground text-[14px] leading-relaxed">
                      {expectations[selectedRole][comp.id]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
