package api

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"planner/internal/domain/task"
	"planner/internal/service"
)

type Handler struct {
	tasks map[string]task.Task
	mu    sync.Mutex
}

// создаём новый Handler
func NewHandler() *Handler {
	return &Handler{
		tasks: make(map[string]task.Task),
	}
}

// POST /tasks
func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request) {
	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	t, err := service.BuildTaskFromRequest(service.CreateTaskInput{
		Title:     req.Title,
		Date:      req.Date,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Category:  req.Category,
		Completed: req.Completed,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t.ID = uuid.New().String()

	h.mu.Lock()
	h.tasks[t.ID] = t
	h.mu.Unlock()

	// DTO ответа
	resp := CreateTaskResponse{
		ID:        t.ID,
		Title:     t.Title,
		Date:      t.Start.Format("2006-01-02"),
		StartTime: t.Start.Format("15:04"),
		EndTime:   t.End.Format("15:04"),
		Category:  t.Category,
		Completed: t.Completed,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// internal/transport/api/handler.go

func (h *Handler) CreateTaskFromText(w http.ResponseWriter, r *http.Request) {
	var req CreateTaskFromTextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	aiResp, err := callAIService(req.Text)
	if err != nil {
		http.Error(w, "ai service error: "+err.Error(), http.StatusBadGateway)
		return
	}

	input := service.CreateTaskInput{
		Title:     aiResp.Title,
		Date:      aiResp.Date,
		StartTime: aiResp.StartTime,
		EndTime:   aiResp.EndTime,
		Category:  aiResp.Category,
		Completed: aiResp.Completed,
	}

	// 3. переиспользуем твою логику построения и сохранения задачи
	t, err := service.BuildTaskFromRequest(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	t.ID = uuid.New().String()

	h.mu.Lock()
	h.tasks[t.ID] = t
	h.mu.Unlock()

	resp := TaskResponse{
		ID:        t.ID,
		Title:     t.Title,
		Date:      t.Start.Format("2006-01-02"),
		StartTime: t.Start.Format("15:04"),
		EndTime:   t.End.Format("15:04"),
		Category:  t.Category,
		Completed: t.Completed,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// GET /tasks
func (h *Handler) ListTasks(w http.ResponseWriter, r *http.Request) {
	h.mu.Lock()
	defer h.mu.Unlock()

	list := make([]TaskResponse, 0, len(h.tasks))
	for _, t := range h.tasks {
		list = append(list, TaskResponse{
			ID:        t.ID,
			Title:     t.Title,
			Date:      t.Start.Format("2006-01-02"),
			StartTime: t.Start.Format("15:04"),
			EndTime:   t.End.Format("15:04"),
			Category:  t.Category,
			Completed: t.Completed,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
