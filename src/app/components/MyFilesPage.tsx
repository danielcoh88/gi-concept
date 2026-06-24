import { File, Image, FileText, Video, Download, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface FileItem {
  id: number;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  size: string;
  uploadedBy: {
    name: string;
    initials: string;
  };
  uploadDate: string;
  caseId?: string;
  caseName?: string;
  unit?: string;
}

export function MyFilesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const files: FileItem[] = [
    {
      id: 1,
      name: 'Evidence_Photo_Scene1.jpg',
      type: 'document',
      size: '28 KB',
      uploadedBy: {
        name: 'James Doakes',
        initials: 'JD',
      },
      uploadDate: '2023-05-03 | 07:02',
      caseId: '05-CV-07953',
      caseName: 'Sunny moon',
      unit: 'Homicide',
    },
    {
      id: 2,
      name: 'Witness_Statement_Draft.pdf',
      type: 'document',
      size: '28 KB',
      uploadedBy: {
        name: 'James Doakes',
        initials: 'JD',
      },
      uploadDate: '2023-05-03 | 07:02',
      caseId: '05-CV-07953',
      caseName: 'Sunny moon',
      unit: 'Homicide',
    },
    {
      id: 3,
      name: 'Security_Footage_Main_Entrance.mp4',
      type: 'document',
      size: '28 KB',
      uploadedBy: {
        name: 'James Doakes',
        initials: 'JD',
      },
      uploadDate: '2023-05-03 | 07:02',
      caseId: '05-CV-07953',
      caseName: 'Sunny moon',
      unit: 'Homicide',
    },
    {
      id: 4,
      name: 'Lab_Report_DNA_Analysis.pdf',
      type: 'document',
      size: '28 KB',
      uploadedBy: {
        name: 'James Doakes',
        initials: 'JD',
      },
      uploadDate: '2023-05-03 | 07:02',
      caseId: '05-CV-07953',
      caseName: 'Sunny moon',
      unit: 'Homicide',
    },
    {
      id: 5,
      name: 'Crime_Scene_Overview.jpg',
      type: 'document',
      size: '28 KB',
      uploadedBy: {
        name: 'James Doakes',
        initials: 'JD',
      },
      uploadDate: '2023-05-03 | 07:02',
      caseId: '05-CV-07953',
      caseName: 'Sunny moon',
      unit: 'Homicide',
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5 text-blue-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 dark:bg-[#0f1929]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Files Shared With Me</h1>

          <div className="bg-white dark:bg-[#131f35] rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/8">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-8 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-shrink-0 w-64">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{file.size}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1 flex-shrink-0 min-w-[180px]">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Shared by</div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                        {file.uploadedBy.initials}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-200">{file.uploadedBy.name}</span>
                    </div>
                  </div>

                  {file.caseId && (
                    <div className="flex flex-col items-start gap-1 flex-shrink-0 min-w-[180px]">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Case</div>
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {file.caseId} | {file.caseName}
                      </div>
                    </div>
                  )}

                  {file.unit && (
                    <div className="flex flex-col items-start gap-1 flex-shrink-0 min-w-[100px]">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Unit</div>
                      <div className="text-sm text-gray-900 dark:text-gray-200">{file.unit}</div>
                    </div>
                  )}

                  <div className="flex-1"></div>

                  <div className="flex-shrink-0 min-w-[150px] text-right">
                    <div className="text-sm text-gray-900 dark:text-gray-200">{file.uploadDate}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                      Review
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                      Move to case
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
