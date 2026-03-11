package api

import "net/http"

func RegisterRoutes(mux *http.ServeMux, h *Handler) {
	// Обычные задачи: /tasks
	mux.HandleFunc("/tasks", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			h.CreateTask(w, r) // POST /tasks
		case http.MethodGet:
			h.ListTasks(w, r) // GET /tasks
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/tasks/from-text", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.CreateTaskFromText(w, r) // POST /tasks/from-text
	})
}
