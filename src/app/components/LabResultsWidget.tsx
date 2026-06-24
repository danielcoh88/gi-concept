import { TestTube, ArrowRight } from 'lucide-react';

interface LabResult {
  id: number;
  caseId: string;
  resultsCount: number;
  resultType: string;
}

export function LabResultsWidget() {
  const labResults: LabResult[] = [
    {
      id: 1,
      caseId: '05-CV-00234',
      resultsCount: 5,
      resultType: 'DNA Analysis',
    },
    {
      id: 2,
      caseId: '05-CV-00189',
      resultsCount: 3,
      resultType: 'Toxicology',
    },
    {
      id: 3,
      caseId: '05-CV-00156',
      resultsCount: 7,
      resultType: 'Fingerprint Match',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="w-5 h-5 text-purple-600" />
        <h3 className="text-gray-900 dark:text-white">3 New Lab Results Came Back</h3>
      </div>
      <div className="space-y-3">
        {labResults.map((result) => (
          <a
            key={result.id}
            href="#"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">{result.caseId}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.resultType}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
