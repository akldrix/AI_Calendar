package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func callAIService(text string) (AIParsedTask, error) {
	body, err := json.Marshal(map[string]string{
		"user_input": text,
	})
	if err != nil {
		return AIParsedTask{}, err
	}

	resp, err := http.Post(
		"http://127.0.0.1:8000/parse",
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

	var wrapper AIParseResponse
	if err := json.NewDecoder(resp.Body).Decode(&wrapper); err != nil {
		return AIParsedTask{}, err
	}

	return wrapper.Task, nil
}
