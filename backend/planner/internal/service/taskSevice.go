package service

import (
	"fmt"
	"time"

	"planner/internal/domain/task"
)

type CreateTaskInput struct {
	Title           string
	Date            string
	StartTime       string
	DurationMinutes int
	Priority        string
}

func BuildTaskFromRequest(req CreateTaskInput) (task.Task, error) {
	dateStr := fmt.Sprintf("%s %s", req.Date, req.StartTime)

	startTime, err := time.Parse("2006-01-02 15:04", dateStr)
	if err != nil {
		return task.Task{}, err
	}

	duration := time.Duration(req.DurationMinutes) * time.Minute

	return task.Task{
		Title:    req.Title,
		Start:    startTime,
		Duration: duration,
		Priority: req.Priority,
	}, nil
}
