import React from "react";
import { useState } from "react";
import CalendarGrid from "./features/Calendar/CalendarGrid";
import { generateTasksAI } from "./services/api";
import "./styles/main.css";
function App() {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState("");

  return <h1>wdf</h1>;
}

export default App;
