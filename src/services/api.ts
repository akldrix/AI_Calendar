import {QueryClient} from "@tanstack/react-query";
import type {Task, CreateTaskInput} from "../types.ts";
import axios from 'axios';

const BASE_URL = "/api";
// "https://posttracheal-beckie-lithographical.ngrok-free.dev";//


const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
    };
};

const apiClient = axios.create({
    baseURL: `${BASE_URL}`,
});

export const fetchTasks = async (): Promise<Task[]> => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch tasks");
    }
    return await response.json();
};

export const generateTasksAI = async (text: string): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/from-text`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({text: text}),
    });

    if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

export const createTask = async (taskData: CreateTaskInput & { completed: boolean }): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData),
    });

    if (!response.ok) {
        throw new Error("Failed to create task");
    }
    return await response.json();
};
export const toggleTaskCompleteness = async (task: Task): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
    });
    if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};
export const deleteTask = async (task: Task): Promise<void> => {
    const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }
};
export const changeTask = async (task: Task): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
    });
    if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};


export const registerUser = async (email: string, password: string) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({email, password}),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Registration Fail", error.detail);
        return null;
    }

    return await response.json();
}

export const loginUser = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${BASE_URL}/auth/jwt/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,

    });
    if (!response.ok) {
        throw new Error("Authorisation fail");
    }

    const data = await response.json();

    localStorage.setItem("access_token", data.access_token)
    return data;
}
