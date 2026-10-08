import { useMemo, useState } from "react";
import "./App.css";

const TYPE_CLASS = { "Лк.": "lk", "Лб.": "lb", "Пр.": "pr" };
const TYPE_FULL = { "Лк.": "Лекция", "Лб.": "Лабораторная", "Пр.": "Практика" };

// "8:30-9:50" -> ["08:30", "09:50"]
const splitTime = (t = "") =>
  t.split("-").map((s) => s.trim().padStart(5, "0"));

// Принимает и весь ответ API ({data: [...]}), и просто массив
function parse(text) {
  const json = JSON.parse(text);
  const list = Array.isArray(json) ? json : json.data;
  if (!Array.isArray(list)) throw new Error("Не нашёл массив data");

  const days = new Map();
  for (const item of list) {
    if (!item.discipline) continue; // пустые пары пропускаем
    if (!days.has(item.day_number)) {
      days.set(item.day_number, { name: item.WeekDayName, items: [] });
    }
    days.get(item.day_number).items.push(item);
  }
  return [...days.entries()].sort((a, b) => a[0] - b[0]).map(([, d]) => d);
}

export default function App() {
  const [text, setText] = useState("");

  const { days, error } = useMemo(() => {
    if (!text.trim()) return { days: [], error: "" };
    try {
      return { days: parse(text), error: "" };
    } catch (e) {
      return { days: [], error: "Не получилось прочитать JSON: " + e.message };
    }
  }, [text]);

  // Первые 3 дня по 1/3 ширины, оставшиеся (обычно Чт, Пт) делят вторую строку
  const rest = days.length - 3;
  const spanFor = (i) => (i < 3 ? 2 : rest === 2 ? 3 : 2);

  return (
    <div className="page">
      <div className="controls">
        <textarea
          className="input"
          placeholder="Вставь сюда JSON с расписанием"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        {days.length > 0 && (
          <button className="print" onClick={() => window.print()}>
            Распечатать
          </button>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="grid">
      {days.map((day, i) => (
        <section
          key={day.name}
          className="day"
          style={{ gridColumn: `span ${spanFor(i)}` }}
        >
          <h2>{day.name}</h2>
          {day.items.map((it) => {
            const [from, to] = splitTime(it.Time_);
            const cls = TYPE_CLASS[it.StudyTypeName] ?? "";
            return (
              <div key={it.day_number + "-" + it.id_time} className="row">
                <div className="time">
                  <span>{from}</span>
                  <span>{to}</span>
                </div>
                <div className={"card " + cls}>
                  <div className="top">
                    <p className="title">{it.discipline}</p>
                    {it.StudyTypeName && (
                      <span
                        className={"badge " + cls}
                        title={TYPE_FULL[it.StudyTypeName]}
                      >
                        {it.StudyTypeName.replace(".", "")}
                      </span>
                    )}
                  </div>
                  <p className="meta">
                    {it.AuditoryName} ({it.Groups})
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      ))}
      </div>
    </div>
  );
}
