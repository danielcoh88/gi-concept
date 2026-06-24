export type TaskStatus = 'on-hold' | 'in-progress' | 'to-do' | 'done';
export type Priority   = 'normal' | 'medium' | 'high' | 'overdue';

export interface Assignee     { initials: string; color: string; }
export interface TaskFile     { ext: 'PDF' | 'DOCX' | 'UFDR'; name: string; }
export interface LinkedEntity { type: 'subject' | 'submission' | 'location'; label: string; }

export interface Task {
  id: number;
  name: string;
  assignees: Assignee[];
  dueDateISO: string;
  priority: Priority;
  status: TaskStatus;
  description?: string;
  file?: TaskFile;
  linkedTo?: LinkedEntity;
}

const A: Record<string, Assignee> = {
  YL: { initials: 'YL', color: '#16a34a' }, TA: { initials: 'TA', color: '#0891b2' },
  KB: { initials: 'KB', color: '#2563eb' }, NF: { initials: 'NF', color: '#7c3aed' },
  AI: { initials: 'AI', color: '#6366f1' }, JS: { initials: 'JS', color: '#ea580c' },
  MR: { initials: 'MR', color: '#be185d' }, PL: { initials: 'PL', color: '#0f766e' },
};

export const CASE_TASKS: Task[] = [
  { id:  1, name: 'Case File Review',            assignees: [A.YL],              dueDateISO: '2026-06-10', priority: 'overdue', status: 'on-hold',     linkedTo: { type: 'subject',    label: 'Marcus Davis'     }, description: 'Draft subpoenas and review legal documents.',           file: { ext: 'PDF',  name: 'm_OSHE1246.pdf'    } },
  { id:  2, name: 'Evidence Collection',         assignees: [A.YL],              dueDateISO: '2026-06-19', priority: 'high',    status: 'in-progress', linkedTo: { type: 'location',   label: '1234 Oak Street'  },                                                                      file: { ext: 'DOCX', name: 'evidence.docx'     } },
  { id:  3, name: 'Crime Scene Analysis',        assignees: [A.TA, A.KB],        dueDateISO: '2026-06-21', priority: 'medium',  status: 'to-do',       linkedTo: { type: 'submission', label: 'B92M84'           }, description: 'Analyze crime scene for forensic evidence.',            file: { ext: 'PDF',  name: 'scene_report.pdf'  } },
  { id:  4, name: 'Suspect Interrogation',       assignees: [A.NF],              dueDateISO: '2026-06-22', priority: 'medium',  status: 'in-progress', linkedTo: { type: 'subject',    label: 'John Miller'      }, description: 'Conduct formal suspect interrogation.',                 file: { ext: 'DOCX', name: 'interrogation.docx' } },
  { id:  5, name: 'Witness Interview',           assignees: [A.AI, A.JS, A.YL], dueDateISO: '2026-06-18', priority: 'high',    status: 'done',                                                                                                                                            file: { ext: 'DOCX', name: 'witness_stmt.docx' } },
  { id:  6, name: 'Lab Results Review',          assignees: [A.JS, A.YL, A.PL], dueDateISO: '2026-06-12', priority: 'overdue', status: 'to-do',       linkedTo: { type: 'submission', label: 'C1089Z'           }, description: 'Review toxicology lab results.',                        file: { ext: 'UFDR', name: 'lab_results.ufdr'  } },
  { id:  7, name: 'CDR Data Analysis',           assignees: [A.TA, A.KB],        dueDateISO: '2026-06-14', priority: 'overdue', status: 'in-progress', linkedTo: { type: 'location',   label: 'Central Park West'}, description: 'Analyze call detail records for key timeframe.',        file: { ext: 'UFDR', name: 'cdr_extract.ufdr'  } },
  { id:  8, name: 'Digital Evidence Review',     assignees: [A.AI, A.JS],        dueDateISO: '2026-06-25', priority: 'medium',  status: 'in-progress',                                                                                                                                    file: { ext: 'UFDR', name: 'device_dump.ufdr'  } },
  { id:  9, name: 'Pattern of Life Report',      assignees: [A.NF],              dueDateISO: '2026-06-27', priority: 'medium',  status: 'in-progress', linkedTo: { type: 'subject',    label: 'Sarah Chen'       }, description: 'Document behavioral patterns from device data.',        file: { ext: 'PDF',  name: 'pol_report.pdf'    } },
  { id: 10, name: 'Subpoena Preparation',        assignees: [A.AI, A.JS],        dueDateISO: '2026-07-03', priority: 'normal',  status: 'in-progress',                                                                                                                                    file: { ext: 'PDF',  name: 'subpoena.pdf'      } },
  { id: 11, name: 'Surveillance Review',         assignees: [A.YL],              dueDateISO: '2026-06-15', priority: 'overdue', status: 'to-do',       linkedTo: { type: 'subject',    label: 'Marcus Davis'     },                                                                      file: { ext: 'DOCX', name: 'surveillance.docx' } },
  { id: 12, name: 'Report Preparation',          assignees: [A.YL],              dueDateISO: '2026-07-10', priority: 'normal',  status: 'done',                                                                                                                                            file: { ext: 'PDF',  name: 'case_report.pdf'   } },
  { id: 13, name: 'Expert Witness Debrief',      assignees: [A.AI, A.JS],        dueDateISO: '2026-07-15', priority: 'normal',  status: 'in-progress',                                                                                                                                    file: { ext: 'UFDR', name: 'expert_notes.ufdr' } },
  { id: 14, name: 'Evidence Chain Verification', assignees: [A.YL],              dueDateISO: '2026-06-28', priority: 'high',    status: 'in-progress', linkedTo: { type: 'submission', label: 'D74Q55'           }, description: 'Verify chain of custody documentation.',               file: { ext: 'UFDR', name: 'chain_verify.ufdr' } },
  { id: 15, name: 'Pre-trial Preparation',       assignees: [A.TA, A.KB],        dueDateISO: '2026-07-20', priority: 'medium',  status: 'on-hold',     linkedTo: { type: 'location',   label: 'Downtown Mall'    }, description: 'Compile court file materials for prosecution.',         file: { ext: 'DOCX', name: 'pretrial.docx'     } },
];
