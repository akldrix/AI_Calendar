package task

import "time"

type Task struct {
	ID        string
	Title     string
	Start     time.Time
	End       time.Time
	Category  string
	Completed bool
}
