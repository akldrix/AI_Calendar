package main

import (
	"log"
	"net/http"

	httpTransport "planner/internal/transport/api"
)

func main() {
	handler := httpTransport.NewHandler()

	mux := http.NewServeMux()
	httpTransport.RegisterRoutes(mux, handler)

	log.Println("server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", withCORS(mux)))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
