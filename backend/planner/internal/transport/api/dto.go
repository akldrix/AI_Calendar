package api

type CreateTaskFromTextRequest struct {
	Text string `json:"text"`
	Mode string `json:"mode,omitempty"` // "task" | "plan"
}
type CreateTaskRequest struct {
	Title     string `json:"title"`
	Date      string `json:"date"`       // "2026-02-29"
	StartTime string `json:"start_time"` // "15:00"
	EndTime   string `json:"end_time"`   // "16:30"
	Category  string `json:"category"`
	Completed bool   `json:"completed"`
}

type CreateTaskResponse struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Category  string `json:"category"`
	Completed bool   `json:"completed"`
}

type TaskResponse struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Category  string `json:"category"`
	Completed bool   `json:"completed"`
}

type AIParsedTask struct {
	Title     string `json:"title"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Category  string `json:"category"`
	Completed bool   `json:"completed"`
}

type AIParseResponse struct {
	Task AIParsedTask `json:"task"`
}
