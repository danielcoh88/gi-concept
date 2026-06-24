import { Car } from 'lucide-react';
import { useState } from 'react';

interface Subject {
  id: number;
  type: 'person' | 'vehicle';
  name: string;
  caseCount: number;
  imageUrl?: string;
  cases: {
    caseId: string;
    role: 'Victim' | 'Suspect' | 'Witness';
  }[];
}

export function MutualSubjectsWidget() {
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null);

  const subjects: Subject[] = [
    {
      id: 1,
      type: 'person',
      name: 'John Miller',
      caseCount: 2,
      imageUrl: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      cases: [
        { caseId: '05-CV-00234', role: 'Suspect' },
        { caseId: '05-CV-00189', role: 'Witness' }
      ]
    },
    {
      id: 2,
      type: 'person',
      name: 'Sarah Chen',
      caseCount: 2,
      imageUrl: 'https://images.unsplash.com/photo-1769636929388-99eff95d3bf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      cases: [
        { caseId: '05-CV-00156', role: 'Victim' },
        { caseId: '05-CV-00178', role: 'Witness' }
      ]
    },
    {
      id: 3,
      type: 'person',
      name: 'Marcus Davis',
      caseCount: 3,
      imageUrl: 'https://images.unsplash.com/photo-1762522926157-bcc04bf0b10a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      cases: [
        { caseId: '05-CV-00234', role: 'Witness' },
        { caseId: '05-CV-00156', role: 'Suspect' },
        { caseId: '05-CV-00201', role: 'Victim' }
      ]
    },
    {
      id: 4,
      type: 'vehicle',
      name: 'Vehicle 1',
      caseCount: 4,
      cases: [
        { caseId: '05-CV-00189', role: 'Suspect' },
        { caseId: '05-CV-00178', role: 'Suspect' },
        { caseId: '05-CV-00234', role: 'Suspect' },
        { caseId: '05-CV-00156', role: 'Suspect' }
      ]
    },
  ];

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <h3 className="text-gray-900 dark:text-white mb-4">Mutual Subjects</h3>
      <div className="grid grid-cols-2 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="relative flex flex-col items-center text-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            onMouseEnter={() => setHoveredSubject(subject.id)}
            onMouseLeave={() => setHoveredSubject(null)}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-pink-500 flex items-center justify-center flex-shrink-0 mb-3 shadow-md">
              {subject.type === 'person' && subject.imageUrl ? (
                <img
                  src={subject.imageUrl}
                  alt={subject.name}
                  className="w-full h-full object-cover"
                />
              ) : subject.type === 'vehicle' ? (
                <Car className="w-10 h-10 text-white" />
              ) : null}
            </div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{subject.name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{subject.caseCount} cases</div>

            {hoveredSubject === subject.id && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-[#131f35] rounded-lg shadow-lg border border-gray-200 dark:border-white/10 p-3 z-10 min-w-[240px]">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Related Cases:</div>
                <div className="space-y-1">
                  {subject.cases.map((caseItem) => (
                    <a
                      key={caseItem.caseId}
                      href="#"
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-white/5 rounded transition-colors"
                    >
                      <span className="text-blue-600">{caseItem.caseId}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">{caseItem.role}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
