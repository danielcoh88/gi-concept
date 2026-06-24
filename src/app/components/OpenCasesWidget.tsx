import { ArrowRight } from 'lucide-react';

export function OpenCasesWidget() {
  const openCases = 47;

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10 flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-8xl font-bold text-gray-900 dark:text-white mb-2">{openCases}</div>
        <h3 className="text-xl text-gray-600 dark:text-gray-400">Open Cases Assigned to You</h3>
      </div>
      <div className="flex items-center justify-end mt-4">
        <button className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
          <span className="text-sm">View All Cases</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
