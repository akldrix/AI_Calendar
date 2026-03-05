import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, createTask, generateTasksAI } from "../services/api";
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
    mutationFn: (taskData) => createTask({ ...taskData, completed: false }),
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
  const toggleTask = (taskId) => {
    queryClient.setQueryData(["tasks"], (old) =>
      old.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };
  return {
    tasks,
    isLoading: isLoading || aiMutation.isPending || addMutation.isPending,
    error: error || aiMutation.error?.message || addMutation.error?.message,
    generateFromPrompt: aiMutation.mutateAsync,
    addManualTask: addMutation.mutateAsync,
    toggleTask,
  };
};

export default useTasks;
