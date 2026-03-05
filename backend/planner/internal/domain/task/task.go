package task

import "time"

type Task struct {
	ID       string
	Title    string
	Start    time.Time
	Duration time.Duration
	Priority string
}
