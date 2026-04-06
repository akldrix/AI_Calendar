import type {ReactNode} from "react";

export enum Category {
    Home = "home",
    Work = "work",
    Self = "self",
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    category: Category;
    date: string;
    completed: boolean;
}

export type CreateTaskInput = Omit<Task, "id" | "completed">;

export interface UseTasksReturn {
    tasks: Task[];
    isLoading: boolean;
    error: string | null | undefined;
    generateFromPrompt: (prompt: string) => Promise<Task>;
    addManualTask: (task: CreateTaskInput) => Promise<Task>;
    handleToggle: (task: Task) => void;
    handleDeleteTask: (task: Task) => void;
    handleTaskChange: (task: Task) => void;
}
export interface ConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
}

export interface TaskFormData extends Partial<Omit<Task, "id">> {
    title: string;
    date: string;
    category: Category;
}