enum Priority {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export interface Task {
  id: string;
  title: string;
  deskription?: string;
  start_time: string | null;
  duration: number;
  priority: Priority;
  date: string;
}
