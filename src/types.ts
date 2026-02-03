enum Priority {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  start_time: string | null;
  duration_minutes: number;
  priority: Priority;
  date: string;
}
