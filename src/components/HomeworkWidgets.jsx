import React, { useEffect, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export const StudentHomeworkWidget = () => {
  const { homeworkOverview, navigateToHomeworkCenter, navigateToHomeworkDetail, currentUser } = useSchool();
  const { playRuneChime, playWandSwoosh } = useSound();

  if (!currentUser || currentUser.role !== 'student') return null;

  const toSubmitCount = homeworkOverview?.stats?.toSubmitCount || 0;
  const inReviewCount = homeworkOverview?.stats?.inReviewCount || 0;
  const closestTask = homeworkOverview?.toSubmit?.[0];

  return (
    <div className="portal-sidebar-module homework-student-widget">
      <div className="module-header-title">
        <BookOpen size={16} />
        <span>PRACE DOMOWE</span>
      </div>

      <div className="hw-widget-stats-row">
        <div className="stat-item">
          <span className="stat-num">{toSubmitCount}</span>
          <span className="stat-text">do oddania</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">{inReviewCount}</span>
          <span className="stat-text">w ocenie</span>
        </div>
      </div>

      {closestTask && (
        <div
          className="closest-task-box"
          onClick={() => {
            playRuneChime();
            navigateToHomeworkDetail(closestTask.id);
          }}
        >
          <div className="closest-task-label">NAJBLIŻSZY TERMIN</div>
          <div className="closest-task-subject">{closestTask.subjectName}</div>
          <div className="closest-task-title">„{closestTask.title}”</div>
          <div className="closest-task-due">
            <Clock size={12} />
            <span>{new Date(closestTask.dueDate).toLocaleDateString('pl-PL')}, {new Date(closestTask.dueDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}

      <button
        className="hw-widget-all-btn"
        onClick={() => {
          playWandSwoosh();
          navigateToHomeworkCenter();
        }}
      >
        <span>ZOBACZ WSZYSTKIE</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
};

export const ProfessorHomeworkWidget = () => {
  const { homeworkAssignments, navigateToHomeworkCenter, currentUser } = useSchool();
  const { playWandSwoosh } = useSound();

  if (!currentUser || (currentUser.role !== 'professor' && currentUser.role !== 'admin')) return null;

  const totalInReview = homeworkAssignments.reduce((sum, h) => sum + (h.stats?.inReviewCount || 0), 0);

  // Group by subject
  const subjectGroups = {};
  homeworkAssignments.forEach(h => {
    const inRev = h.stats?.inReviewCount || 0;
    if (inRev > 0) {
      subjectGroups[h.subjectName] = (subjectGroups[h.subjectName] || 0) + inRev;
    }
  });

  const subjectEntries = Object.entries(subjectGroups);

  return (
    <div className="portal-sidebar-module homework-professor-widget">
      <div className="module-header-title">
        <Shield size={16} />
        <span>DO SPRAWDZENIA</span>
      </div>

      <div className="prof-widget-list">
        {subjectEntries.length > 0 ? (
          subjectEntries.map(([subj, cnt]) => (
            <div key={subj} className="prof-widget-row">
              <span className="p-subj">{subj}</span>
              <span className="p-count">{cnt}</span>
            </div>
          ))
        ) : (
          <div className="prof-widget-empty">Wszystkie nadesłane prace zostały sprawdzone!</div>
        )}
      </div>

      <div className="prof-widget-total">
        <span>Łącznie do sprawdzenia:</span>
        <strong>{totalInReview} prac</strong>
      </div>

      <button
        className="hw-widget-all-btn"
        onClick={() => {
          playWandSwoosh();
          navigateToHomeworkCenter();
        }}
      >
        <span>PRZEJDŹ DO SPRAWDZANIA</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
};
