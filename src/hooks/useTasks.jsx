import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
    fetchTasks,
    createTask,
    generateTasksAI,
    toggleTaskCompleteness,
    deleteTask,
    changeTask,
} from "../services/api";
import React from "react";

export const useTasks = () => {
    const queryClient = useQueryClient();
    const {
        data: tasks = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["tasks"],
        queryFn: fetchTasks,
        staleTime: 1000 * 60 * 5,
    });
    const addMutation = useMutation({
        mutationFn: (taskData) => createTask({...taskData, completed: false}),
        onSuccess: (response) => {
            queryClient.setQueryData(["tasks"], (old) => [response, ...old]);
        },
    });
    const aiMutation = useMutation({
        mutationFn: generateTasksAI,
        onSuccess: (response) => {
            queryClient.setQueryData(["tasks"], (old) => [response, ...old]);
        },
    });

    /*const toggleTask = (taskId) => {
      queryClient.setQueryData(["tasks"], (old) =>
        old.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      );
    };*/
    const taskCompletenessMutation = useMutation({
        mutationFn: toggleTaskCompleteness,

        onMutate: async (updatedTask) => {
            await queryClient.cancelQueries({queryKey: ["tasks"]});
            const previousTasks = queryClient.getQueryData(["tasks"]);

            queryClient.setQueryData(["tasks"], (old) =>
                old?.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
            );

            return {previousTasks};
        },

        onError: (err, updatedTask, context) => {
            queryClient.setQueryData(["tasks"], context.previousTasks);
        },

        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["tasks"]});
        },
    });

    const handleToggle = (task) => {
        taskCompletenessMutation.mutate({...task, completed: !task.completed});
    };

    const deleteTaskMutation = useMutation({
        mutationFn: deleteTask,

        onMutate: async (deletedTask) => {
            await queryClient.cancelQueries({queryKey: ["tasks"]});
            const previousTasks = queryClient.getQueryData(["tasks"]);

            queryClient.setQueryData(["tasks"], (old) =>
                old?.filter((task) => task.id !== deletedTask.id),
            );

            return {previousTasks};
        },

        onError: (err, updatedTask, context) => {
            queryClient.setQueryData(["tasks"], context.previousTasks);
        },

        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["tasks"]});
        },
    });

    const handleDeleteTask = (task) => {
        deleteTaskMutation.mutate(task);
    };

    const changeTaskMutation = useMutation({
        mutationFn: changeTask,

        onMutate: async (changedTask) => {
            await queryClient.cancelQueries({queryKey: ["tasks"]});
            const previousTasks = queryClient.getQueryData(["tasks"]);

            queryClient.setQueryData(["tasks"], (old) =>
                old?.map((task) => (task.id === changedTask.id ? changedTask : task)),
            );

            return {previousTasks};
        },

        onError: (err, updatedTask, context) => {
            queryClient.setQueryData(["tasks"], context.previousTasks);
        },

        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["tasks"]});
        },
    });

    const handleTaskChange = (task) => {
        changeTaskMutation.mutate(task);
    };
    return {
        tasks,
        isLoading: isLoading || aiMutation.isPending || addMutation.isPending,
        error: error || aiMutation.error?.message || addMutation.error?.message,
        generateFromPrompt: aiMutation.mutateAsync,
        addManualTask: addMutation.mutateAsync,
        handleToggle,
        handleDeleteTask,
        handleTaskChange,
    };
};

export default useTasks;
