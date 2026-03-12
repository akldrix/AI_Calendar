package scheduler

import (
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Interval struct {
	Start time.Time
	End   time.Time
}

type Slot struct {
	ID    string    `json:"id"`
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// MergeIntervals merges overlapping/touching intervals.
// Precondition: intervals may be unsorted.
func MergeIntervals(in []Interval) []Interval {
	if len(in) == 0 {
		return nil
	}

	// фильтруем мусор
	tmp := make([]Interval, 0, len(in))
	for _, iv := range in {
		if iv.End.After(iv.Start) {
			tmp = append(tmp, iv)
		}
	}
	if len(tmp) == 0 {
		return nil
	}

	sort.Slice(tmp, func(i, j int) bool {
		return tmp[i].Start.Before(tmp[j].Start)
	})

	out := make([]Interval, 0, len(tmp))
	out = append(out, tmp[0])

	for _, iv := range tmp[1:] {
		last := &out[len(out)-1]
		// пересекаются или касаются
		if !iv.Start.After(last.End) {
			if iv.End.After(last.End) {
				last.End = iv.End
			}
			continue
		}
		out = append(out, iv)
	}

	return out
}

// FreeWindowsForDay returns free intervals inside [dayStart, dayEnd),
// subtracting merged busy intervals (busy can cover multiple days).
func FreeWindowsForDay(dayStart, dayEnd time.Time, busyMerged []Interval) []Interval {
	if !dayEnd.After(dayStart) {
		return nil
	}

	free := make([]Interval, 0)
	cur := dayStart

	for _, b := range busyMerged {
		// не пересекает дневное окно
		if b.End.Before(dayStart) || !b.Start.Before(dayEnd) {
			continue
		}

		// пересечение busy с дневным окном
		bs := maxTime(b.Start, dayStart)
		be := minTime(b.End, dayEnd)

		// если есть свободный кусок до busy
		if bs.After(cur) {
			free = append(free, Interval{Start: cur, End: bs})
		}

		// двигаем "курсор" на конец busy
		if be.After(cur) {
			cur = be
		}

		if !cur.Before(dayEnd) {
			break
		}
	}

	if cur.Before(dayEnd) {
		free = append(free, Interval{Start: cur, End: dayEnd})
	}

	return free
}

// GenerateSlots creates candidate slots of length dur inside free windows.
// step controls allowed start times (e.g. 30 minutes).
func GenerateSlots(free []Interval, dur, step time.Duration, maxTotal int) []Slot {
	if dur <= 0 || step <= 0 {
		return nil
	}

	slots := make([]Slot, 0)

	for _, w := range free {
		// окно слишком короткое
		if w.End.Sub(w.Start) < dur {
			continue
		}

		for start := w.Start; !start.Add(dur).After(w.End); start = start.Add(step) {
			slots = append(slots, Slot{
				ID:    uuid.NewString(),
				Start: start,
				End:   start.Add(dur),
			})
			if maxTotal > 0 && len(slots) >= maxTotal {
				return slots
			}
		}
	}

	return slots
}

// GenerateSlotsForHorizon builds free windows for each day in [from, from+days)
// and returns candidate slots with given duration.
func GenerateSlotsForHorizon(
	busy []Interval,
	from time.Time,
	days int,
	dayStartHM, dayEndHM string,
	dur time.Duration,
	step time.Duration,
	maxTotal int,
) []Slot {
	if days <= 0 {
		return nil
	}

	loc := from.Location()
	busyMerged := MergeIntervals(busy)

	freeAll := make([]Interval, 0, days*2)

	for i := 0; i < days; i++ {
		d := dateOnly(from.AddDate(0, 0, i), loc)

		dayStart := combineDateHM(d, dayStartHM, loc)
		dayEnd := combineDateHM(d, dayEndHM, loc)

		// ВАЖНО: сегодня не планируем "в прошлое"
		if i == 0 {
			minStart := roundUp(from.In(loc), step) // ближайшее время по шагу
			if minStart.After(dayStart) {
				dayStart = minStart
			}
		}

		// если уже поздно и dayStart >= dayEnd — сегодня слотов нет
		if !dayEnd.After(dayStart) {
			continue
		}

		freeDay := FreeWindowsForDay(dayStart, dayEnd, busyMerged)
		freeAll = append(freeAll, freeDay...)
	}

	return GenerateSlots(freeAll, dur, step, maxTotal)
}

// Helpers

func dateOnly(t time.Time, loc *time.Location) time.Time {
	return time.Date(t.In(loc).Year(), t.In(loc).Month(), t.In(loc).Day(), 0, 0, 0, 0, loc)
}

func combineDateHM(date time.Time, hm string, loc *time.Location) time.Time {
	h, m := parseHM(hm)
	return time.Date(date.Year(), date.Month(), date.Day(), h, m, 0, 0, loc)
}

func roundUp(t time.Time, step time.Duration) time.Time {
	x := t.Truncate(step)
	if x.Before(t) {
		x = x.Add(step)
	}
	return x
}
func parseHM(hm string) (int, int) {
	parts := strings.Split(hm, ":")
	if len(parts) != 2 {
		return 0, 0
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	return h, m
}

func minTime(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}
