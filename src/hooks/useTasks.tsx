import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import React from "react";
import {
    fetchTasks,
    createTask,
    generateTasksAI,
    toggleTaskCompleteness,
    deleteTask,
    changeTask,
} from "../services/api.ts";

import type {Task, CreateTaskInput, UseTasksReturn} from "../types.ts";

export const useTasks = (): UseTasksReturn => {

    const queryClient = useQueryClient();
    const {
        data: tasks = [],
        isLoading,
        error,
    } = useQuery<Task[], Error>({
        queryKey: ["tasks"],
        queryFn: fetchTasks,
        staleTime: 1000 * 60 * 5,
    });
    const addMutation = useMutation<Task, Error, CreateTaskInput>({
        mutationFn: (taskData: CreateTaskInput) => createTask({...taskData, completed: false}),
        onSuccess: (newTask) => {
            queryClient.setQueryData<Task[]>(["tasks"], (old) => old ? [newTask, ...old] : [newTask]);
        },
    });
    const aiMutation = useMutation<Task, Error, string>({
        mutationFn: generateTasksAI,
        onSuccess: (newTask) => {
            queryClient.setQueryData<Task[]>(["tasks"], (old) => old ? [newTask, ...old] : [newTask]);
        },
    });

    /*const toggleTask = (taskId) => {
      queryClient.setQueryData(["tasks"], (old) =>
        old.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      );
    };*/
    const taskCompletenessMutation = useMutation<Task, Error, Task, { previousTasks: Task[] | undefined}>({
        mutationFn: toggleTaskCompleteness,

        onMutate: async (updatedTask) => {
            await queryClient.cancelQueries({queryKey: ["tasks"]});
            const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

            queryClient.setQueryData<Task[]>(["tasks"], (old) =>
                old?.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
            );

            return {previousTasks};
        },

        onError: (_err, _variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(["tasks"], context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["tasks"]});
        },
    });

    const handleToggle = (task: Task) => {
        taskCompletenessMutation.mutate({...task, completed: !task.completed});
    };

    const deleteTaskMutation = useMutation<void, Error, Task, {previousTasks: Task[] | undefined}>({
        mutationFn: deleteTask,

        onMutate: async (deletedTask) => {
            await queryClient.cancelQueries({queryKey: ["tasks"]});
            const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

            queryClient.setQueryData<Task[]>(["tasks"], (old) =>
                old?.filter((task) => task.id !== deletedTask.id),
            );

            return {previousTasks};
        },

        onError: (_err, _variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(["tasks"], context.previousTasks);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["tasks"]});
        },
    });

    const handleDeleteTask = (task: Task) => {
        deleteTaskMutation.mutate(task);
    };

    const changeTaskMutation = useMutation<Task, Error, Task, { previousTasks: Task[] | undefined}>({
        mutationFn: changeTask,

        onMutate: async (changedTask) => {
            await queryClient.cancelQueries({queryKey: ["tasks"]});
            const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

            queryClient.setQueryData<Task[]>(["tasks"], (old) =>
                old?.map((task) => (task.id === changedTask.id ? changedTask : task)),
            );

            return {previousTasks};
        },

        onError: (_err, _updatedTask, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(["tasks"], context.previousTasks);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["tasks"]});
        },
    });

    const handleTaskChange = (task: Task) => {
        changeTaskMutation.mutate(task);
    };
    return {
        tasks,
        isLoading: isLoading || aiMutation.isPending || addMutation.isPending,
        error: error?.message || aiMutation.error?.message || addMutation.error?.message,
        generateFromPrompt: aiMutation.mutateAsync,
        addManualTask: addMutation.mutateAsync,
        handleToggle,
        handleDeleteTask,
        handleTaskChange,
    };
};

export default useTasks;
