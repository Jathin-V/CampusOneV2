export type UserRole = 'Student' | 'Teacher' | 'Lab Instructor' | 'Technician' | 'Admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  studentId?: string;
  employeeId?: string;
}

export type TicketCategory = 'Electrical' | 'Plumbing' | 'IT' | 'Classroom Utilities' | 'Lab Utilities';
export type TicketPriority = 'Normal' | 'Medium' | 'Extreme';
export type TicketStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface ReopenAuditItem {
  reopenedAt: string;
  reopenedBy: string;
  reopenedByRole: UserRole;
  reason: string;
}

export interface ActionPlan {
  suggestedTools: string[];
  estimatedTime: string;
  safetyCaution: string;
  actionSteps: string[];
  generatedAt: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  location: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  reportedBy: string;
  reportedByEmail: string;
  reportedByRole: UserRole;
  createdAt: string;
  upvoteCount: number;
  reopenCount: number;
  reopenHistory: ReopenAuditItem[];
  resolutionNotes?: string;
  resolutionPhotoUrl?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actionPlan?: ActionPlan;
}

export type AcademicCycle = 'P' | 'E'; // Physics or Electronics for Year 1
export type EngineeringStream = 'CSE' | 'CSE(AIML)' | 'CSE(DS)' | 'CSE(AIDS)' | 'ECE' | 'EEE';
export type ResourceType = 'Notes' | 'Textbooks' | 'Question Banks' | 'Lab Manuals';

export interface AcademicResource {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  year: number; // 1, 2, 3, 4
  cycle?: AcademicCycle; // For Year 1
  semester?: number; // 3 to 8 for Years 2 to 4
  stream?: EngineeringStream;
  type: ResourceType;
  fileSize: string;
  downloadsCount: number;
  uploadedBy: string;
  uploadedByRole: UserRole;
  uploadedAt: string;
  description: string;
  contentSnippet?: string;
}

export type EventCategory = 'Technical' | 'Clubs' | 'Cultural' | 'Sports';

export interface CampusEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  shortDescription: string;
  fullDescription: string;
  registrationDeadline: string;
  isUrgent?: boolean;
  urgentBadge?: string;
  registeredCount: number;
  maxCapacity: number;
  bannerGradient: string;
  tags: string[];
  contactEmail: string;
}

export interface StudentAttendanceStatus {
  studentRoll: string;
  studentName: string;
  isPresent: boolean;
}

export interface AttendanceSession {
  id: string;
  roomCode: string;
  roomDecoded: string;
  classCode: string;
  classDecoded: string;
  subject: string;
  period: string; // e.g. "Period 1 (09:00 - 10:00)"
  date: string; // YYYY-MM-DD
  teacherEmail: string;
  teacherName: string;
  students: StudentAttendanceStatus[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  createdAt: string;
}

export interface SuggestionItem {
  id: string;
  authorName: string;
  authorEmail: string;
  category: 'Infrastructure' | 'Academics' | 'Events' | 'Canteen & Campus' | 'Other';
  idea: string;
  createdAt: string;
  status: 'Reviewed' | 'Under Consideration' | 'Implemented';
}
