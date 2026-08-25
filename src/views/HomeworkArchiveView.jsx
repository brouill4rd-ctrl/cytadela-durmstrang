import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Archive,
  BookOpen,
  Calendar,
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import api from '../api';

export const HomeworkArchiveView = ({ onOpenHomework }) => {
  const { playRuneChime, playWandSwoosh } = useSound();
  const [archiveData, setArchiveData] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedYears, setExpandedYears] = useState(['XVII Rok Szkolny']);

  useEffect(() => {
    const fetchArchive = async () => {
      setLoading(true);
      try {
        const res = await api.getHomeworkArchive();
        if (res.ok && res.data) {
          setArchiveData(res.data);
        }
      } catch (err) {
        console.error('Error loading archive:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchive();
  }, []);

  const toggleYear = (yr) => {
    playWandSwoosh();
    setExpandedYears(prev =>
      prev.includes(yr) ? prev.filter(y => y !== yr) : [...prev, yr]
    );
  };

  if (loading) {
    return (
      <div className="homework-archive-loading">
        <div className="tmd-spinner"></div>
        <span>Otwieranie archiwalnych roczników Cytadeli...</span>
      </div>
    );
  }

  const schoolYears = Object.keys(archiveData);

  return (
    <div className="homework-archive-component">
      <div className="archive-intro-box">
        <Archive size={24} />
        <div>
          <h3>ARCHIWUM PRAC DOMOWYCH I ROZPRAW NAUKOWYCH</h3>
          <p>
            Wszystkie dysertacje, protokoły z pracowni alchemicznych oraz tłumaczenia inskrypcji
            są permanentnie archiwizowane w annałach Cytadeli.
          </p>
        </div>
      </div>

      {schoolYears.length === 0 ? (
        <div className="archive-empty">
          <p>Brak zarchiwizowanych roczników.</p>
        </div>
      ) : (
        <div className="archive-years-list">
          {schoolYears.map(yearKey => {
            const isExpanded = expandedYears.includes(yearKey);
            const classesObj = archiveData[yearKey] || {};
            const classKeys = Object.keys(classesObj);

            return (
              <div key={yearKey} className="archive-year-card">
                <div className="year-header" onClick={() => toggleYear(yearKey)}>
                  <div className="year-title-flex">
                    <span className="year-icon">ᛟ</span>
                    <h4>{yearKey}</h4>
                  </div>
                  <div className="year-expand-btn">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="year-classes-body">
                    {classKeys.map(cKey => {
                      const subjectsObj = classesObj[cKey] || {};
                      const subjectKeys = Object.keys(subjectsObj);

                      return (
                        <div key={cKey} className="archive-class-block">
                          <div className="class-title-tag">{cKey}</div>
                          <div className="class-subjects-grid">
                            {subjectKeys.map(sKey => {
                              const assignments = subjectsObj[sKey] || [];
                              return (
                                <div key={sKey} className="archive-subject-group">
                                  <div className="subject-group-header">
                                    <BookOpen size={14} />
                                    <span>{sKey} ({assignments.length} prac)</span>
                                  </div>
                                  <div className="archive-assignments-list">
                                    {assignments.map(hw => (
                                      <div
                                        key={hw.id}
                                        className="archive-assignment-row"
                                        onClick={() => {
                                          playRuneChime();
                                          onOpenHomework(hw.id);
                                        }}
                                      >
                                        <div className="row-left">
                                          <span className="a-nr">#{hw.assignmentNumber}</span>
                                          <span className="a-title">„{hw.title}”</span>
                                        </div>
                                        <div className="row-right">
                                          {hw.mySubmission?.gradeScore !== null && hw.mySubmission?.gradeScore !== undefined ? (
                                            <span className="a-score">{hw.mySubmission.gradeScore}/{hw.maxPoints} pkt</span>
                                          ) : (
                                            <span className="a-date">{new Date(hw.dueDate).toLocaleDateString('pl-PL')}</span>
                                          )}
                                          <ExternalLink size={12} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
