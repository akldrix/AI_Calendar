import React from "react";
import "../../styles/main.css";
interface Category {
  id: string;
  label: string;
}

const categories = [
  { id: "home", label: "Дом" },
  { id: "work", label: "Работа" },
  { id: "self", label: "Личное" },
];
interface FilterCategoryProps {
  hiddenCategories: string[];
  onToggle: (id: string) => void;
}
export function FilterCategory({ hiddenCategories, onToggle }: FilterCategoryProps) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {categories.map((cat) => {
        const isHidden = hiddenCategories.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.id)}
            className={`filter-btn category-${cat.id} ${isHidden ? "inactive" : ""}`}
            style={{
              cursor: "pointer",
            }}
          >
            {cat.label} {isHidden ? "" : "✕"}
          </button>
        );
      })}
    </div>
  );
}
