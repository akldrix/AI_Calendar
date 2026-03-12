package api

import (
	"encoding/json"
	"log"
	"net/http"
	"planner/internal/service/planning"
	"sync"
	"time"

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
func overlaps(a, b task.Task) bool {
	// пересечение полуинтервалов [Start, End)
	return a.Start.Before(b.End) && a.End.After(b.Start)
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
	defer h.mu.Unlock()
	for _, existing := range h.tasks {
		if overlaps(existing, t) {
			http.Error(w, "task overlaps with existing task", http.StatusConflict)
			return
		}
	}
	h.tasks[t.ID] = t

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
	log.Printf("PLAN: tasks in memory = %d", len(h.tasks))
	mode := req.Mode
	if mode == "" {
		mode = "task"
	}

	switch mode {
	case "task":
		h.createSingleTaskFromText(w, req.Text)
		return

	case "plan":
		h.createPlanDraftFromText(w, req.Text)
		return

	default:
		http.Error(w, "invalid mode", http.StatusBadRequest)
		return
	}
}

func (h *Handler) createSingleTaskFromText(w http.ResponseWriter, text string) {
	// НЕ читаем r.Body здесь!

	aiResp, err := callAIService(text)
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

	t, err := service.BuildTaskFromRequest(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t.ID = uuid.NewString()

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
	_ = json.NewEncoder(w).Encode(map[string]any{
		"action": "task",
		"task":   resp,
	})
}

func (h *Handler) createPlanDraftFromText(w http.ResponseWriter, text string) {
	const horizonDays = 7
	dayStartHM := "08:00"
	dayEndHM := "22:00"
	step := 30 * time.Minute

	// пока хардкод, потом заменишь на callAIPlanItems(text, horizonDays)
	items := []planning.PlanItem{
		{ID: "run", Title: "Бег", Category: "self", DurationMin: 60, CountPerWeek: 2},
		{ID: "read", Title: "Чтение", Category: "self", DurationMin: 30, CountPerWeek: 4},
		{ID: "shop", Title: "Магазин", Category: "home", DurationMin: 45, CountTotal: 1},
	}

	occ := planning.ExpandToOccurrences(items, horizonDays)

	h.mu.Lock()
	busy := planning.BuildBusyFromTasks(h.tasks)
	h.mu.Unlock()

	from := time.Now()
	slots := planning.BuildSlotsForOccurrences(
		busy,
		from,
		horizonDays,
		dayStartHM,
		dayEndHM,
		step,
		occ,
		200,
	)

	assignments, unscheduled, err := planning.GreedyAssignNoOverlap(occ, slots)
	if err != nil {
		http.Error(w, "assign error: "+err.Error(), http.StatusBadRequest)
		return
	}

	draftTasks, err := planning.BuildDraftTasks(assignments, occ, slots)

	if err != nil {
		http.Error(w, "draft build error: "+err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"action":      "plan",
		"draft_id":    uuid.NewString(),
		"tasks":       draftTasks,
		"unscheduled": unscheduled,
	})
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
