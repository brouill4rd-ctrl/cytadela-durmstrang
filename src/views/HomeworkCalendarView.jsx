import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../api';

export const HomeworkCalendarView = ({ onOpenHomework }) => {
  const { currentUser } = useSchool();
  const { playRuneChime, playWandSwoosh } = useSound();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 25)); // Aug 2026 default
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const res = await api.getHomeworkCalendar();
        if (res.ok && res.data) {
          setCalendarEvents(res.data);
        }
      } catch (err) {
        console.error('Error fetching homework calendar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const handlePrevMonth = () => {
    playWandSwoosh();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    playWandSwoosh();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(ev => {
      if (!ev.dueDate) return false;
      return ev.dueDate.startsWith(targetDateStr);
    });
  };

  return (
    <div className="homework-calendar-component">
      {/* Calendar Header Navigation */}
      <div className="calendar-nav-bar">
        <div className="month-selector">
          <button className="cal-nav-btn" onClick={handlePrevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span className="current-month-label">
            {monthNames[month]} {year}
          </span>
          <button className="cal-nav-btn" onClick={handleNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="calendar-legend">
          <span className="legend-item"><span className="legend-dot to-submit"></span> Do oddania</span>
          <span className="legend-item"><span className="legend-dot in-review"></span> Złożona</span>
          <span className="legend-item"><span className="legend-dot graded"></span> Oceniona</span>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="calendar-weekdays-grid">
        <span>Poniedziałek</span>
        <span>Wtorek</span>
        <span>Środa</span>
        <span>Czwartek</span>
        <span>Piątek</span>
        <span>Sobota</span>
        <span>Niedziela</span>
      </div>

      {/* Days Grid */}
      <div className="calendar-days-grid">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day-cell empty"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = getEventsForDay(day);
          const isToday = day === 25 && month === 7 && year === 2026;

          return (
            <div key={`day-${day}`} className={`calendar-day-cell ${isToday ? 'today' : ''}`}>
              <div className="day-number">{day}</div>
              <div className="day-events-list">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className={`day-event-pill status-${ev.status}`}
                    onClick={() => {
                      playRuneChime();
                      onOpenHomework(ev.id);
                    }}
                    title={`${ev.subjectName}: „${ev.title}” (Termin: ${ev.dueDate})`}
                  >
                    <span className="event-subj">{ev.subjectName}</span>
                    <span className="event-title">„{ev.title}”</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
