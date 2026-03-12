package planning

import (
	"errors"
	"fmt"
	"sort"
	"time"

	"planner/internal/domain/task"
	"planner/internal/service/scheduler"
)

type PlanItem struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Category     string `json:"category"` // "work"|"home"|"self"
	DurationMin  int    `json:"duration_minutes"`
	CountPerWeek int    `json:"count_per_week,omitempty"`
	CountTotal   int    `json:"count_total,omitempty"`
}

type Occurrence struct {
	OccID       string `json:"occ_id"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	DurationMin int    `json:"duration_minutes"`
}

type SlotDTO struct {
	ID          string `json:"id"`
	Start       string `json:"start"` // RFC3339
	End         string `json:"end"`   // RFC3339
	DurationMin int    `json:"duration_minutes"`
}

type Assignment struct {
	OccID  string `json:"occ_id"`
	SlotID string `json:"slot_id"`
}

// ExpandToOccurrences: на горизонте 7 дней можно просто:
// count_total (если задан) иначе count_per_week (раз это одна неделя)
func ExpandToOccurrences(items []PlanItem, horizonDays int) []Occurrence {
	_ = horizonDays // сейчас не используем, т.к. MVP = 7 дней

	var occ []Occurrence
	for _, it := range items {
		n := it.CountTotal
		if n <= 0 {
			n = it.CountPerWeek
		}
		if n <= 0 {
			n = 1
		}
		for i := 1; i <= n; i++ {
			occ = append(occ, Occurrence{
				OccID:       fmt.Sprintf("%s#%d", it.ID, i),
				Title:       it.Title,
				Category:    it.Category,
				DurationMin: it.DurationMin,
			})
		}
	}
	return occ
}

func BuildBusyFromTasks(tasks map[string]task.Task) []scheduler.Interval {
	busy := make([]scheduler.Interval, 0, len(tasks))
	for _, t := range tasks {
		if !t.End.After(t.Start) {
			continue
		}
		busy = append(busy, scheduler.Interval{Start: t.Start, End: t.End})
	}
	return busy
}

// BuildSlotsForOccurrences генерит слоты под все нужные длительности (60/30/45...)
// и возвращает объединённый список SlotDTO.
func BuildSlotsForOccurrences(
	busy []scheduler.Interval,
	from time.Time,
	horizonDays int,
	dayStartHM, dayEndHM string,
	step time.Duration,
	occ []Occurrence,
	maxSlotsPerDuration int,
) []SlotDTO {

	// собираем уникальные длительности
	durSet := map[int]struct{}{}
	for _, o := range occ {
		if o.DurationMin > 0 {
			durSet[o.DurationMin] = struct{}{}
		}
	}
	durations := make([]int, 0, len(durSet))
	for d := range durSet {
		durations = append(durations, d)
	}
	sort.Ints(durations)

	out := make([]SlotDTO, 0)

	for _, dmin := range durations {
		dur := time.Duration(dmin) * time.Minute
		slots := scheduler.GenerateSlotsForHorizon(
			busy,
			from,
			horizonDays,
			dayStartHM,
			dayEndHM,
			dur,
			step,
			maxSlotsPerDuration,
		)

		for _, s := range slots {
			out = append(out, SlotDTO{
				ID:          s.ID,
				Start:       s.Start.Format(time.RFC3339),
				End:         s.End.Format(time.RFC3339),
				DurationMin: dmin,
			})
		}
	}

	return out
}

// GreedyAssign — fallback без AI: просто берём самые ранние слоты нужной длительности,
// не повторяя slot_id.
func GreedyAssign(occ []Occurrence, slots []SlotDTO) ([]Assignment, []map[string]any) {
	// индекс слотов по длительности
	byDur := map[int][]SlotDTO{}
	for _, s := range slots {
		byDur[s.DurationMin] = append(byDur[s.DurationMin], s)
	}
	// сортируем слоты по start
	for d := range byDur {
		sort.Slice(byDur[d], func(i, j int) bool {
			return byDur[d][i].Start < byDur[d][j].Start
		})
	}

	used := map[string]bool{}
	assign := make([]Assignment, 0, len(occ))
	unscheduled := make([]map[string]any, 0)

	for _, o := range occ {
		list := byDur[o.DurationMin]
		found := false
		for _, s := range list {
			if used[s.ID] {
				continue
			}
			used[s.ID] = true
			assign = append(assign, Assignment{OccID: o.OccID, SlotID: s.ID})
			found = true
			break
		}
		if !found {
			unscheduled = append(unscheduled, map[string]any{
				"occ_id":  o.OccID,
				"title":   o.Title,
				"reason":  "not_enough_slots",
				"minutes": o.DurationMin,
			})
		}
	}

	return assign, unscheduled
}

// DraftTask — структура, которую удобно сразу отдавать фронту
type DraftTask struct {
	Title     string `json:"title"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Category  string `json:"category"`
	Completed bool   `json:"completed"`
}

func BuildDraftTasks(assignments []Assignment, occ []Occurrence, slots []SlotDTO) ([]DraftTask, error) {
	occByID := map[string]Occurrence{}
	for _, o := range occ {
		occByID[o.OccID] = o
	}
	slotByID := map[string]SlotDTO{}
	for _, s := range slots {
		slotByID[s.ID] = s
	}

	usedSlot := map[string]bool{}
	out := make([]DraftTask, 0, len(assignments))

	for _, a := range assignments {
		if usedSlot[a.SlotID] {
			return nil, errors.New("ai returned duplicate slot_id (overlap)")
		}
		usedSlot[a.SlotID] = true

		o, ok := occByID[a.OccID]
		if !ok {
			return nil, fmt.Errorf("unknown occ_id: %s", a.OccID)
		}
		s, ok := slotByID[a.SlotID]
		if !ok {
			return nil, fmt.Errorf("unknown slot_id: %s", a.SlotID)
		}
		if s.DurationMin != o.DurationMin {
			return nil, fmt.Errorf("duration mismatch for %s: occ=%d slot=%d", a.OccID, o.DurationMin, s.DurationMin)
		}

		st, err := time.Parse(time.RFC3339, s.Start)
		if err != nil {
			return nil, fmt.Errorf("bad slot start: %w", err)
		}
		en, err := time.Parse(time.RFC3339, s.End)
		if err != nil {
			return nil, fmt.Errorf("bad slot end: %w", err)
		}

		out = append(out, DraftTask{
			Title:     o.Title,
			Date:      st.Format("2006-01-02"),
			StartTime: st.Format("15:04"),
			EndTime:   en.Format("15:04"),
			Category:  o.Category,
			Completed: false,
		})
	}

	return out, nil
}

// GreedyAssignNoOverlap — fallback без AI: выбираем самые ранние слоты нужной длительности,
// но НЕ допускаем пересечения по времени (даже если slot_id разные).
func GreedyAssignNoOverlap(occ []Occurrence, slots []SlotDTO) ([]Assignment, []map[string]any, error) {
	// индекс слотов по длительности
	byDur := map[int][]SlotDTO{}
	for _, s := range slots {
		byDur[s.DurationMin] = append(byDur[s.DurationMin], s)
	}

	// сортируем слоты по Start (RFC3339 строки сравнимы лексикографически)
	for d := range byDur {
		sort.Slice(byDur[d], func(i, j int) bool {
			return byDur[d][i].Start < byDur[d][j].Start
		})
	}

	type chosenInterval struct {
		start time.Time
		end   time.Time
	}
	chosen := make([]chosenInterval, 0)

	overlaps := func(aStart, aEnd time.Time) bool {
		for _, c := range chosen {
			// пересечение интервалов: [aStart,aEnd) и [c.start,c.end)
			if aStart.Before(c.end) && aEnd.After(c.start) {
				return true
			}
		}
		return false
	}

	usedSlot := map[string]bool{}
	assignments := make([]Assignment, 0, len(occ))
	unscheduled := make([]map[string]any, 0)

	for _, o := range occ {
		list := byDur[o.DurationMin]
		placed := false

		for _, s := range list {
			if usedSlot[s.ID] {
				continue
			}

			st, err := time.Parse(time.RFC3339, s.Start)
			if err != nil {
				return nil, nil, err
			}
			en, err := time.Parse(time.RFC3339, s.End)
			if err != nil {
				return nil, nil, err
			}

			if overlaps(st, en) {
				continue
			}

			usedSlot[s.ID] = true
			chosen = append(chosen, chosenInterval{start: st, end: en})
			assignments = append(assignments, Assignment{OccID: o.OccID, SlotID: s.ID})
			placed = true
			break
		}

		if !placed {
			unscheduled = append(unscheduled, map[string]any{
				"occ_id":  o.OccID,
				"title":   o.Title,
				"reason":  "not_enough_non_overlapping_slots",
				"minutes": o.DurationMin,
			})
		}
	}

	return assignments, unscheduled, nil
}
