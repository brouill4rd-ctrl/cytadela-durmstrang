import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import { Archive, Newspaper, Search, Calendar, BookOpen, ChevronRight, ArrowLeft, Feather } from 'lucide-react';

export const GazetteArchiveView = () => {
  const { navigateToGazette, navigateToGazetteIssue } = useSchool();
  const [issues, setIssues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadArchive(); }, []);

  const loadArchive = async () => {
    setLoading(true);
    const res = await api.getGazetteArchive();
    if (res.ok) setIssues(res.data || []);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    const res = await api.searchGazette(searchQuery);
    if (res.ok) setSearchResults(res.data || []);
    setSearching(false);
  };

  // Group by school year
  const grouped = {};
  issues.forEach(i => {
    const year = i.schoolYear || 'Bez roku';
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(i);
  });

  if (loading) {
    return (
      <div className="gazette-archive-loading">
        <Feather size={32} className="gazette-spin" />
        <span>Ładowanie archiwum...</span>
      </div>
    );
  }

  return (
    <div className="gazette-archive">
      {/* ═══════ HEADER ═══════ */}
      <div className="gazette-archive-header">
        <button className="gazette-archive-back" onClick={navigateToGazette}>
          <ArrowLeft size={18} /> Powrót
        </button>
        <div className="gazette-archive-title">
          <Archive size={24} />
          <div>
            <h1>Archiwum Żelaznego Pióra</h1>
            <p className="gazette-archive-subtitle">Kolekcja wszystkich wydań gazety Twierdzy Durmstrang</p>
          </div>
        </div>
      </div>

      <div className="gazette-archive-ornament">✦ ─── ⚜ ─── ✦</div>

      {/* ═══════ SEARCH ═══════ */}
      <div className="gazette-archive-search">
        <div className="gazette-archive-search-box">
          <Search size={18} />
          <input
            placeholder="Szukaj artykułów, autorów, tematów..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="gazette-archive-search-btn" onClick={handleSearch}>Szukaj</button>
        </div>
      </div>

      {/* ═══════ SEARCH RESULTS ═══════ */}
      {searchResults.length > 0 && (
        <div className="gazette-archive-results">
          <h2 className="gazette-archive-results-title">
            <Search size={18} /> Wyniki wyszukiwania ({searchResults.length})
          </h2>
          <div className="gazette-archive-results-list">
            {searchResults.map((result, i) => (
              <div
                key={i}
                className="gazette-archive-result-card"
                onClick={() => navigateToGazetteIssue(result.issueId)}
              >
                <div className="gazette-archive-result-info">
                  <div className="gazette-archive-result-title">{result.title}</div>
                  <div className="gazette-archive-result-meta">
                    {result.authorName && <span>✎ {result.isAnonymous ? 'Anonimowy' : result.authorName}</span>}
                    {result.sectionName && <span> │ {result.sectionName}</span>}
                    {result.issueNumber && <span> │ Nr {result.issueNumber}</span>}
                    {result.pageNumber && <span> │ str. {result.pageNumber}</span>}
                  </div>
                  {result.lead && <div className="gazette-archive-result-lead">{result.lead.slice(0, 150)}...</div>}
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
          <button className="gazette-archive-clear" onClick={() => setSearchResults([])}>Wyczyść wyniki</button>
        </div>
      )}

      {/* ═══════ ISSUES BY YEAR ═══════ */}
      <div className="gazette-archive-collection">
        {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([year, yearIssues]) => (
          <div key={year} className="gazette-archive-year">
            <h2 className="gazette-archive-year-title">
              <Calendar size={18} />
              Rok szkolny {year}
            </h2>
            <div className="gazette-archive-year-grid">
              {yearIssues.map(issue => (
                <div
                  key={issue.id}
                  className="gazette-archive-issue-card"
                  onClick={() => navigateToGazetteIssue(issue.id)}
                >
                  <div className="gazette-archive-issue-cover">
                    {issue.coverImage ? (
                      <img src={issue.coverImage} alt={`Nr ${issue.number}`} />
                    ) : (
                      <div className="gazette-archive-cover-placeholder">
                        <Newspaper size={36} />
                        <div className="gazette-archive-cover-num">Nr {issue.number}</div>
                      </div>
                    )}
                    <div className="gazette-archive-cover-overlay">
                      <BookOpen size={20} />
                      <span>Czytaj</span>
                    </div>
                  </div>
                  <div className="gazette-archive-issue-info">
                    <div className="gazette-archive-issue-number">Nr {String(issue.number).padStart(2, '0')}</div>
                    {issue.theme && <div className="gazette-archive-issue-theme">„{issue.theme}"</div>}
                    {issue.title && <div className="gazette-archive-issue-title">{issue.title}</div>}
                    {issue.publicationDate && (
                      <div className="gazette-archive-issue-date">
                        {new Date(issue.publicationDate).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {issues.length === 0 && (
        <div className="gazette-archive-empty">
          <Newspaper size={48} />
          <p>Archiwum jest puste — pierwszy numer jest w przygotowaniu.</p>
        </div>
      )}

      <div className="gazette-archive-ornament">✦ ─── ⚜ ─── ✦</div>
    </div>
  );
};
