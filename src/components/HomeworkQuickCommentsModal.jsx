import React, { useState, useEffect } from 'react';
import { useSound } from '../context/SoundContext';
import {
  MessageSquare,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import api from '../api';

export const HomeworkQuickCommentsModal = ({ onClose }) => {
  const { playRuneChime } = useSound();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('Merytoryka');

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await api.getHomeworkQuickComments();
      if (res.ok && res.data) {
        setComments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    try {
      await api.createHomeworkQuickComment({
        category: newCategory,
        text: newText.trim()
      });
      setNewText('');
      playRuneChime();
      loadComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteHomeworkQuickComment(id);
      loadComments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="tmd-modal-overlay">
      <div className="tmd-modal-box">
        <div className="modal-header-flex">
          <div className="modal-title-with-icon">
            <MessageSquare size={20} />
            <h3>BIBLIOTEKA SZYBKICH UWAG PROFESORSKICH</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-sub">
          Zarządzaj prywatną biblioteką najczęściej używanych uwag i recenzji wstawianych do formularza oceny.
        </p>

        {/* Add comment form */}
        <div className="add-quick-comment-row mt-3">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="tmd-select small-select"
          >
            <option value="Merytoryka">Merytoryka</option>
            <option value="Argumentacja">Argumentacja</option>
            <option value="Tekst źródłowy">Tekst źródłowy</option>
            <option value="Runy">Runy</option>
            <option value="Forma">Forma</option>
            <option value="Wyróżnienie">Wyróżnienie</option>
          </select>
          <input
            type="text"
            placeholder="Wpisz treść uwagi (np. Bardzo trafna teza poparta materiałem)..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="tmd-input"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <button
            type="button"
            className="tmd-action-btn primary small"
            onClick={handleAdd}
          >
            <Plus size={14} />
            <span>Dodaj</span>
          </button>
        </div>

        {/* List of comments */}
        <div className="quick-comments-management-list mt-3">
          {comments.map(c => (
            <div key={c.id} className="quick-comment-mgmt-item">
              <div className="qc-left">
                <span className="qc-cat-tag">{c.category}</span>
                <span className="qc-txt">„{c.text}”</span>
              </div>
              <button
                type="button"
                className="qc-del-btn"
                onClick={() => handleDelete(c.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
