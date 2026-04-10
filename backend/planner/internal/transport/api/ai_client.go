package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func callAIService(text string) (AIParsedTask, error) {
	body, err := json.Marshal(map[string]string{
		"text": text,
	})
	if err != nil {
		return AIParsedTask{}, err
	}

	// адрес Python-сервиса — пока хардкод, потом можно вынести в конфиг / env
	resp, err := http.Post(
		"http://localhost:8001/parse-task",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return AIParsedTask{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return AIParsedTask{}, fmt.Errorf("ai service returned %s", resp.Status)
	}

	var parsed AIParsedTask
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return AIParsedTask{}, err
	}

	return parsed, nil
}
