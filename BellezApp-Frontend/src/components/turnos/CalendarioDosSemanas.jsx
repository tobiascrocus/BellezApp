// src/components/CalendarioDosSemanas.jsx
import React from "react";
import "../../styles/turnos/CalendarioDosSemanas.css";

export default function CalendarioDosSemanas({ startDate, daysStatus = {}, highlightedDate }) {
  let start = new Date(startDate);
  if (isNaN(start)) start = new Date();

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    let iso = null;
    if (!isNaN(d)) {
      try {
        iso = d.toISOString().slice(0, 10);
      } catch {
        iso = null;
      }
    }

    return {
      d,
      iso,
      dayNum: !isNaN(d) ? d.getDate() : "",
      weekday: !isNaN(d) ? d.getDay() : null,
      status: iso && daysStatus[iso] ? daysStatus[iso] : "free",
    };
  });

  return (
    <div className="calendar-twoweeks">
      <div className="calendar-header">
        <div className="weekday">dom</div>
        <div className="weekday">lun</div>
        <div className="weekday">mar</div>
        <div className="weekday">mié</div>
        <div className="weekday">jue</div>
        <div className="weekday">vie</div>
        <div className="weekday">sáb</div>
      </div>

      <div className="calendar-grid">
        {days.map((day, index) =>
          day.iso ? (
            <div
              key={day.iso}
              className={`calendar-cell ${day.status} ${day.weekday === 1 || day.weekday === 2 ? "weekend" : ""} ${
                highlightedDate === day.iso ? "highlighted" : ""
              }`}
            >
              <div className="cell-num">{day.dayNum}</div>
            </div>
          ) : (
            <div key={index} className="calendar-cell invalid"></div>
          )
        )}
      </div>
    </div>
  );
}
