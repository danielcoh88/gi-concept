import { ComponentType } from 'react';

// ─── Entity & Domain Types ────────────────────────────────────────────────────

export type EntityType =
  | 'subject'
  | 'location'
  | 'file'
  | 'task'
  | 'submission'
  | 'crimeline'
  | 'note'
  | 'cdr';

export type SubjectType = 'person' | 'vehicle' | 'other';
export type SubjectRole = 'Suspect' | 'Victim' | 'Witness' | 'Unknown';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'overdue' | 'in_progress' | 'upcoming' | 'completed';

export type CaseStatus =
  | 'Active Investigation'
  | 'Under Review'
  | 'Pending Investigation'
  | 'Active'
  | 'Suspended'
  | 'Cold Case'
  | 'Closed'
  | 'Resolved'
  | 'Open Inactive'
  | 'Pending Trial'
  | 'Closed by Arrest'
  | 'Closed by Exceptional Means';

// ─── Tree / Entity Model ──────────────────────────────────────────────────────

export interface CaseEntity {
  id: string;
  type: EntityType;
  label: string;
  sublabel?: string;
  subType?: SubjectType;
  role?: SubjectRole;
  status?: string;
  children?: CaseEntity[];
  metadata?: Record<string, string | number | boolean>;
  linkedEntityIds?: string[];
  isNew?: boolean;
  hasAlert?: boolean;
}

export interface TreeSection {
  id: string;
  entityType: EntityType;
  label: string;
  count: number;
  newCount?: number;
  alertCount?: number;
  entities: CaseEntity[];
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  applicableTypes: EntityType[];
  variant?: 'default' | 'destructive' | 'primary';
  onExecute: (entity: CaseEntity) => void;
}

export interface ContextMenuState {
  entity: CaseEntity;
  x: number;
  y: number;
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export type FeedActionType =
  | 'upload'
  | 'mention'
  | 'link'
  | 'create'
  | 'update'
  | 'complete'
  | 'lab_result'
  | 'match'
  | 'move'
  | 'share'
  | 'download';

export interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  actorName: string;
  actorInitials: string;
  actorColor: string;
  actionType: FeedActionType;
  action: string;
  entityType: EntityType;
  entityLabel: string;
  entityId: string;
  caseId: string;
  isNew: boolean;
  isMention?: boolean;
  isFlagged?: boolean;
  replyCount?: number;
}

// ─── Dashboard / Habit Loop ───────────────────────────────────────────────────

export interface HabitReminder {
  id: string;
  message: string;
  type: 'task' | 'submission' | 'mention' | 'match' | 'lab';
  caseId: string;
  caseName: string;
  urgency: UrgencyLevel;
}

export interface KPICardData {
  id: string;
  type: 'overdue_task' | 'missing_submission' | 'new_match' | 'pending_mention';
  label: string;
  sublabel: string;
  count: number;
  urgency: UrgencyLevel;
}

export interface CrossCaseNotification {
  id: string;
  type: 'download' | 'mention' | 'match' | 'lab_result' | 'upload' | 'status_change';
  message: string;
  actorName: string;
  actorInitials: string;
  caseId: string;
  caseName: string;
  timestamp: Date;
  isNew: boolean;
  actionLabel?: string;
}

// ─── Cellebrite AI Panel ─────────────────────────────────────────────────────────

export interface AIActionWidget {
  id: string;
  title: string;
  description: string;
  // 'map_location' → renders a minimap pin; 'create_task' → renders a task form prompt
  type: 'map_location' | 'create_task' | 'run_osint' | 'link_entity';
  coordinates?: { lat: number; lng: number; label: string };
  linkedEntityId?: string;
  urgency: UrgencyLevel;
  primaryCTA: string;
  secondaryCTA?: string;
}

export interface AIEventWidget {
  id: string;
  title: string;
  description: string;
  // ISO string so widgets remain serializable
  eventTimestamp: string;
  type: 'incident' | 'movement' | 'communication' | 'transaction';
  relatedEntityIds: string[];
  // If set, "Add to Crimeline" CTA links to this crimeline
  crimelineId?: string;
  primaryCTA: string;
}

export interface AINextStep {
  id: string;
  suggestion: string;
  rationale: string;
  actionType: 'investigate' | 'verify' | 'document' | 'escalate';
  urgency: UrgencyLevel;
}

export interface AIResponse {
  id: string;
  summary: string;
  confidence: number; // 0–100
  processingMs: number;
  sources: EntityType[];
  // Max 2 action widgets; max 2 event widgets — per spec requirement
  actionWidgets: [AIActionWidget?, AIActionWidget?];
  eventWidgets: [AIEventWidget?, AIEventWidget?];
  nextSteps: AINextStep[];
  timestamp: Date;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface WorkspaceProps {
  caseId: string;
  caseName: string;
  caseStatus: CaseStatus;
}
