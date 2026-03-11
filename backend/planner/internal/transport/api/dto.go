package api

type CreateTaskFromTextRequest struct {
	Text string `json:"text"`
}
type CreateTaskRequest struct {
	Title           string `json:"title"`
	Date            string `json:"date"` // "2026-02-02"
	StartTime       string `json:"start_time"`
	DurationMinutes int    `json:"duration_minutes"`
	Priority        string `json:"priority"`
}

type CreateTaskResponse struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Date            string `json:"date"`
	StartTime       string `json:"start_time"`
	DurationMinutes int    `json:"duration_minutes"`
	Priority        string `json:"priority"`
}

type TaskResponse struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Date            string `json:"date"`
	StartTime       string `json:"start_time"`
	DurationMinutes int    `json:"duration_minutes"`
	Priority        string `json:"priority"`
}

type AIParsedTask struct {
	Title           string `json:"title"`
	Date            string `json:"date"`
	StartTime       string `json:"start_time"`
	DurationMinutes int    `json:"duration_minutes"`
	Priority        string `json:"priority"`
}
