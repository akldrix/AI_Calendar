package service

import (
	"time"

	"planner/internal/domain/task"
)

type CreateTaskInput struct {
	Title     string
	Date      string // "2026-02-29"
	StartTime string // "15:00"
	EndTime   string // "16:30"
	Category  string
	Completed bool
}

func BuildTaskFromRequest(req CreateTaskInput) (task.Task, error) {
	startStr := req.Date + " " + req.StartTime
	endStr := req.Date + " " + req.EndTime

	start, err := time.ParseInLocation("2006-01-02 15:04", startStr, time.Local)
	if err != nil {
		return task.Task{}, err
	}

	end, err := time.ParseInLocation("2006-01-02 15:04", endStr, time.Local)
	if err != nil {
		return task.Task{}, err
	}

	return task.Task{
		Title:     req.Title,
		Start:     start,
		End:       end,
		Category:  req.Category,
		Completed: req.Completed,
	}, nil
}
