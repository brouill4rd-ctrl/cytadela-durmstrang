import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Layers,
  Plus,
  Trash2,
  X,
  FileText,
  Check,
  ChevronRight
} from 'lucide-react';
import api from '../api';

export const HomeworkTemplatesModal = ({ onClose, onUseTemplate }) => {
  const { playRuneChime, playWandSwoosh } = useSound();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.getHomeworkTemplates();
      if (res.ok && res.data) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Czy na pewno chcesz usunąć ten szablon?')) {
      await api.deleteHomeworkTemplate(id);
      loadTemplates();
    }
  };

  return (
    <div className="tmd-modal-overlay">
      <div className="tmd-modal-box wide-modal">
        <div className="modal-header-flex">
          <div className="modal-title-with-icon">
            <Layers size={20} />
            <h3>BIBLIOTEKA SZABLONÓW PRAC DOMOWYCH</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-sub">
          Wybierz gotową strukturę dysertacji lub zadania, aby błyskawicznie wypełnić kreator prac domowych.
        </p>

        {loading ? (
          <div className="modal-loading-state">
            <div className="tmd-spinner"></div>
            <span>Wczytywanie szablonów...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="modal-empty-state">
            <p>Brak zapisanych szablonów. Możesz zapisać dowolne zadanie jako szablon w Kroku 6 kreatora.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="template-card"
                onClick={() => {
                  playRuneChime();
                  onUseTemplate(tpl);
                }}
              >
                <div className="tpl-top-bar">
                  <span className="tpl-badge">{tpl.category || tpl.type}</span>
                  <button
                    type="button"
                    className="tpl-delete-btn"
                    onClick={(e) => handleDelete(tpl.id, e)}
                    title="Usuń szablon"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <h4 className="tpl-title">{tpl.title}</h4>
                <p className="tpl-desc">{tpl.description || tpl.instructions?.slice(0, 90) + '...'}</p>
                <div className="tpl-meta-tags">
                  <span>{tpl.requirements?.length || 0} wymagań</span>
                  <span>•</span>
                  <span>{tpl.rubric?.length || 0} kryteriów rubryki</span>
                </div>
                <button className="tpl-use-btn">
                  <span>Użyj tego szablonu</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
