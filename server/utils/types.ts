export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  registrationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: number;
  memberId: number;
  sabbathDate: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  visitorName: string;
  sabbathDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface ImportAttendanceOptions {
  overwrite?: boolean;
  validateMembers?: boolean;
}