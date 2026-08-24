import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Download,
  Check,
  X,
  AlertTriangle,
  Code,
  Table,
  Layers,
  Sparkles,
  Eye,
  Copy,
  ChevronRight,
  ShieldAlert,
  Server,
  FileText,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';

const TABLE_ICONS = {
  users: '👥',
  news: '📜',
  emails: '✉️',
  events: '📅',
  lessons: '📖',
  lesson_messages: '💬',
  lesson_participants: '🧙',
  point_transactions: '⭐',
  point_audit_logs: '⚖️',
  subjects: '🏛️',
  grades: '📝',
  grade_categories: '🏷️',
  timetable_entries: '⏰',
  bank_accounts: '🏦',
  bank_transactions: '🪙',
  store_items: '🛍️',
  shopping_lists: '📋',
  lottery_rounds: '🎰',
  lottery_tickets: '🎫',
  documents: '📑',
  cms_banners: '🖼️',
  cms_block_graphics: '🧱',
  completed_quests: '🗺️',
  discovered_secrets: '🔮',
  crafted_formulas: '✨',
  homework_submissions: '🎒',
  raven_messages: '🦅',
  audit_logs: '🛡️',
  discord_bot_config: '🤖',
  school_config: '⚙️'
};

export const DatabaseExplorerPanel = () => {
  const { showNotification, currentUser } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('users');
  const [tableData, setTableData] = useState({ columns: [], rows: [], totalCount: 0 });
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'json'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editAsJson, setEditAsJson] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [savingRow, setSavingRow] = useState(false);

  // Load table list
  const loadTables = async () => {
    setLoadingTables(true);
    const res = await api.getDbTables();
    if (res.ok && res.data?.tables) {
      setTables(res.data.tables);
      if (!selectedTable && res.data.tables.length > 0) {
        setSelectedTable(res.data.tables[0].name);
      }
    } else {
      // Fallback local schema if offline
      const localTables = [
        { name: 'users', count: 9, columns: [{ name: 'id', pk: true }, { name: 'username' }, { name: 'role' }, { name: 'house' }, { name: 'points' }, { name: 'currency' }] },
        { name: 'news', count: 8, columns: [{ name: 'id', pk: true }, { name: 'title' }, { name: 'author' }, { name: 'created_at' }] },
        { name: 'point_transactions', count: 20, columns: [{ name: 'id', pk: true }, { name: 'house' }, { name: 'points' }, { name: 'reason' }] },
        { name: 'subjects', count: 8, columns: [{ name: 'id', pk: true }, { name: 'name' }, { name: 'department' }] },
        { name: 'store_items', count: 12, columns: [{ name: 'id', pk: true }, { name: 'name' }, { name: 'price' }, { name: 'shop_id' }] }
      ];
      setTables(localTables);
    }
    setLoadingTables(false);
  };

  // Load rows for selected table
  const loadTableRows = async (tableName, search = '') => {
    if (!tableName) return;
    setLoadingRows(true);
    const res = await api.getDbTableRows(tableName, { search, limit: 150 });
    if (res.ok && res.data) {
      setTableData({
        columns: res.data.columns || [],
        rows: res.data.rows || [],
        totalCount: res.data.totalCount || (res.data.rows || []).length
      });
    } else {
      // Fallback from localStorage
      const localKey = `durmstrang_${tableName}_db` || `durmstrang_${tableName}`;
      const saved = localStorage.getItem(localKey) || localStorage.getItem(`durmstrang_${tableName}`);
      let rows = [];
      try {
        if (saved) rows = JSON.parse(saved);
      } catch {
        rows = [];
      }
      const columns = rows.length > 0 ? Object.keys(rows[0]).map(k => ({ name: k, type: 'TEXT', pk: k === 'id' })) : [];
      setTableData({
        columns,
        rows,
        totalCount: rows.length
      });
    }
    setLoadingRows(false);
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableRows(selectedTable, searchQuery);
    }
  }, [selectedTable]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadTableRows(selectedTable, searchQuery);
  };

  const handleOpenAddRow = () => {
    playWandSwoosh();
    setIsCreatingNew(true);
    const initial = {};
    (tableData.columns || []).forEach(c => {
      initial[c.name] = c.name === 'id' ? `${selectedTable.slice(0, 4)}-${Date.now()}` : '';
    });
    setEditFormData(initial);
    setJsonText(JSON.stringify(initial, null, 2));
    setEditAsJson(false);
    setEditModalOpen(true);
  };

  const handleOpenEditRow = (row) => {
    playWandSwoosh();
    setIsCreatingNew(false);
    setRowToEdit(row);
    setEditFormData({ ...row });
    setJsonText(JSON.stringify(row, null, 2));
    setEditAsJson(false);
    setEditModalOpen(true);
  };

  const handleDeleteRow = async (row) => {
    const pkCol = (tableData.columns.find(c => c.pk) || tableData.columns.find(c => c.name === 'id') || { name: 'id' }).name;
    const rowId = row[pkCol] || row.id;

    if (!window.confirm(`⚠️ Czy na pewno chcesz nieodwracalnie USUNĄĆ rekord o kluczu "${rowId}" z tabeli [${selectedTable}]?`)) {
      return;
    }

    playWandSwoosh();
    const res = await api.deleteDbTableRow(selectedTable, rowId);
    if (res.ok) {
      showNotification('Usunięto Wpis', `Rekord o ID "${rowId}" został usunięty z tabeli ${selectedTable}.`, 'success');
      loadTableRows(selectedTable, searchQuery);
      loadTables();
    } else {
      showNotification('Błąd Usuwania', res.error || 'Nie udało się usunąć rekordu z bazy.', 'error');
    }
  };

  const handleSaveRow = async () => {
    setSavingRow(true);
    let payload = {};

    if (editAsJson) {
      try {
        payload = JSON.parse(jsonText);
      } catch (err) {
        showNotification('Błąd Składni JSON', err.message, 'error');
        setSavingRow(false);
        return;
      }
    } else {
      payload = { ...editFormData };
    }

    const pkCol = (tableData.columns.find(c => c.pk) || tableData.columns.find(c => c.name === 'id') || { name: 'id' }).name;
    const rowId = payload[pkCol] || payload.id;

    let res;
    if (isCreatingNew) {
      res = await api.createDbTableRow(selectedTable, payload);
    } else {
      res = await api.updateDbTableRow(selectedTable, rowId, payload);
    }

    if (res.ok) {
      playRuneChime();
      showNotification('Zapisano w Bazie', isCreatingNew ? `Dodano nowy wpis do [${selectedTable}].` : `Zaktualizowano rekord [${rowId}] w [${selectedTable}].`, 'success');
      setEditModalOpen(false);
      loadTableRows(selectedTable, searchQuery);
      loadTables();
    } else {
      showNotification('Błąd Zapisu', res.error || 'Nie udało się zapisać rekordu.', 'error');
    }
    setSavingRow(false);
  };

  const handleExportTableJson = () => {
    playRuneChime();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tableData.rows, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tabela_${selectedTable}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Eksport Tabeli', `Pobrano dane tabeli ${selectedTable} w formacie JSON.`, 'info');
  };

  // Main container styles based on fullscreen mode
  const containerStyle = isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 8, 14, 0.98)',
        backdropFilter: 'blur(20px)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      };

  return (
    <div style={containerStyle} className="animate-fade-in">
      {/* Top Header Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.9) 0%, rgba(10, 16, 26, 0.95) 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 8px 25px rgba(0,0,0,0.7)',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(15, 22, 34, 0.8) 100%)',
              border: '1px solid var(--gold-ancient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Database size={20} color="var(--gold-ancient)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--gold-glow)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Eksplorator & Edytor Bazy Danych
            </h2>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Zarządzanie tabelami SQLite i strukturami danych Cytadeli Durmstrang
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              playWandSwoosh();
              loadTables();
              loadTableRows(selectedTable, searchQuery);
            }}
            className="btn-durmstrang-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.74rem', gap: '0.35rem' }}
            title="Odśwież tabele"
          >
            <RefreshCw size={13} className={loadingTables || loadingRows ? 'spin' : ''} />
            <span>Odśwież</span>
          </button>

          <button
            onClick={handleExportTableJson}
            className="btn-durmstrang-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.74rem', gap: '0.35rem' }}
            title="Eksportuj wybraną tabelę do pliku JSON"
          >
            <Download size={13} />
            <span>Eksport ({selectedTable})</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              playWandSwoosh();
              setIsFullscreen(!isFullscreen);
            }}
            style={{
              padding: '0.4rem 0.75rem',
              background: isFullscreen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: isFullscreen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isFullscreen ? '#7dd3fc' : '#cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              fontWeight: 700
            }}
            title={isFullscreen ? "Zamknij tryb pełnoekranowy" : "Otwórz w trybie pełnoekranowym (panoramicznym)"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? 'Zwiń Ekran' : 'Pełny Ekran'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          HORIZONTAL TABLE SELECTOR BAR (FULL WIDTH)
          ========================================================= */}
      <div
        style={{
          background: 'rgba(10, 15, 24, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Layers size={13} color="var(--gold-ancient)" /> Tabela:
        </span>

        {/* Dropdown for quick selection */}
        <select
          value={selectedTable}
          onChange={(e) => {
            playWandSwoosh();
            setSelectedTable(e.target.value);
            setSearchQuery('');
          }}
          style={{
            padding: '0.35rem 0.6rem',
            background: 'rgba(5, 8, 14, 0.9)',
            border: '1px solid var(--gold-ancient)',
            borderRadius: '5px',
            color: 'var(--gold-glow)',
            fontSize: '0.78rem',
            fontWeight: 700,
            outline: 'none',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {tables.map(tbl => (
            <option key={tbl.name} value={tbl.name}>
              {TABLE_ICONS[tbl.name] || '📁'} {tbl.name} ({tbl.count})
            </option>
          ))}
        </select>

        {/* Horizontal Quick Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            paddingBottom: '2px',
            flex: 1,
            scrollbarWidth: 'thin'
          }}
        >
          {tables.map(tbl => {
            const isSelected = selectedTable === tbl.name;
            const icon = TABLE_ICONS[tbl.name] || '📁';

            return (
              <button
                key={tbl.name}
                onClick={() => {
                  playWandSwoosh();
                  setSelectedTable(tbl.name);
                  setSearchQuery('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '5px',
                  border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'linear-gradient(90deg, rgba(197, 159, 78, 0.3) 0%, rgba(20, 28, 42, 0.8) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#ffe599' : '#cbd5e1',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{icon}</span>
                <span>{tbl.name}</span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    padding: '0.05rem 0.35rem',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#090d14' : '#94a3b8',
                    fontWeight: 800
                  }}
                >
                  {tbl.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          DATA BROWSER & CRUD PANEL (FULL WIDTH)
          ========================================================= */}
      <div
        style={{
          background: 'rgba(10, 15, 24, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          flex: isFullscreen ? 1 : undefined,
          minHeight: isFullscreen ? 0 : '500px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Table Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              {TABLE_ICONS[selectedTable] || '📁'} {selectedTable}
            </span>
            <span style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(197, 159, 78, 0.15)', color: 'var(--gold-glow)', border: '1px solid rgba(197,159,78,0.3)' }}>
              {tableData.totalCount} wierszy • {tableData.columns.length} kolumn
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search Form */}
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filtruj wiersze..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.35rem 0.55rem 0.35rem 1.7rem',
                  background: 'rgba(5, 8, 14, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '5px',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  outline: 'none',
                  width: '180px'
                }}
              />
            </form>

            {/* View Switcher */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.3rem 0.55rem',
                  background: viewMode === 'grid' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? '#ffe599' : '#94a3b8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.72rem'
                }}
                title="Widok Tabeli"
              >
                <Table size={12} />
                <span>Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                style={{
                  padding: '0.3rem 0.55rem',
                  background: viewMode === 'json' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'json' ? '#ffe599' : '#94a3b8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.72rem'
                }}
                title="Widok JSON"
              >
                <Code size={12} />
                <span>JSON</span>
              </button>
            </div>

            {/* Add Record Button */}
            <button
              onClick={handleOpenAddRow}
              className="btn-durmstrang"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.76rem', gap: '0.35rem' }}
            >
              <Plus size={13} />
              <span>Nowy Wpis</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            VIEW MODE: GRID TABLE (RESPONSIVE HORIZONTAL SCROLL)
            ========================================================= */}
        {viewMode === 'grid' ? (
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              flex: 1,
              maxHeight: isFullscreen ? 'calc(100vh - 240px)' : '550px',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              background: 'rgba(5, 8, 14, 0.6)'
            }}
          >
            <table
              style={{
                width: 'max-content',
                minWidth: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.76rem'
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(15, 22, 34, 0.98)', borderBottom: '1px solid rgba(197, 159, 78, 0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '0.55rem 0.65rem', width: '80px', color: 'var(--gold-ancient)', position: 'sticky', left: 0, background: 'rgba(15, 22, 34, 0.98)', zIndex: 11, borderRight: '1px solid rgba(197, 159, 78, 0.2)' }}>
                    Akcje
                  </th>
                  {tableData.columns.map(col => (
                    <th
                      key={col.name}
                      style={{
                        padding: '0.55rem 0.65rem',
                        color: col.pk ? 'var(--gold-glow)' : '#cbd5e1',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '0.74rem'
                      }}
                    >
                      {col.name} {col.pk && <span style={{ color: 'var(--gold-ancient)', fontSize: '0.62rem' }}>[PK]</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={tableData.columns.length + 1} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      Brak rekordów w tabeli {selectedTable}.
                    </td>
                  </tr>
                ) : (
                  tableData.rows.map((row, rIdx) => {
                    return (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: rIdx % 2 === 0 ? 'rgba(8, 12, 18, 0.4)' : 'rgba(12, 18, 28, 0.4)',
                          transition: 'background 0.15s ease'
                        }}
                        className="hover-row"
                      >
                        {/* Row Actions Sticky Left */}
                        <td
                          style={{
                            padding: '0.45rem 0.65rem',
                            whiteSpace: 'nowrap',
                            position: 'sticky',
                            left: 0,
                            background: rIdx % 2 === 0 ? '#0b0f17' : '#0d131f',
                            zIndex: 5,
                            borderRight: '1px solid rgba(197, 159, 78, 0.15)'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              onClick={() => handleOpenEditRow(row)}
                              style={{
                                padding: '0.2rem 0.35rem',
                                background: 'rgba(197, 159, 78, 0.15)',
                                border: '1px solid rgba(197, 159, 78, 0.3)',
                                color: '#ffe599',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                              title="Edytuj rekord"
                            >
                              <Edit size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row)}
                              style={{
                                padding: '0.2rem 0.35rem',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#fca5a5',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                              title="Usuń rekord"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>

                        {/* Columns */}
                        {tableData.columns.map(col => {
                          const val = row[col.name];
                          const isObj = typeof val === 'object' && val !== null;
                          const displayVal = isObj ? JSON.stringify(val) : String(val === null || val === undefined ? 'NULL' : val);

                          return (
                            <td
                              key={col.name}
                              style={{
                                padding: '0.45rem 0.65rem',
                                color: val === null || val === undefined ? '#64748b' : '#e2e8f0',
                                fontFamily: col.pk || col.name.endsWith('_id') || typeof val === 'number' ? 'monospace' : 'inherit',
                                maxWidth: '240px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                borderRight: '1px solid rgba(255,255,255,0.03)'
                              }}
                              title={displayVal}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* =========================================================
              VIEW MODE: JSON VIEWER
              ========================================================= */
          <div style={{ background: 'rgba(5, 8, 14, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '1rem', flex: 1, maxHeight: isFullscreen ? 'calc(100vh - 240px)' : '550px', overflowY: 'auto' }}>
            <pre style={{ margin: 0, color: '#a4c8e1', fontSize: '0.74rem', fontFamily: 'monospace', lineHeight: 1.5 }}>
              {JSON.stringify(tableData.rows, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* =========================================================
          ROW EDITOR / ADD MODAL
          ========================================================= */}
      {editModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(3, 6, 12, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              background: 'linear-gradient(180deg, #101624 0%, #0a0d16 100%)',
              border: '1.5px solid var(--gold-ancient)',
              borderRadius: '10px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                background: 'rgba(15, 22, 34, 0.95)',
                borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Database size={18} color="var(--gold-ancient)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)' }}>
                  {isCreatingNew ? `Nowy Wpis do Tabeli [${selectedTable}]` : `Edycja Wpisu w Tabeli [${selectedTable}]`}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditAsJson(!editAsJson)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    background: editAsJson ? 'rgba(197, 159, 78, 0.25)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: editAsJson ? '#ffe599' : '#94a3b8',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  {editAsJson ? 'Formularz Pól' : 'Tryb JSON'}
                </button>

                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editAsJson ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Edytuj obiekt JSON:
                  </label>
                  <textarea
                    rows={16}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(5, 8, 14, 0.95)',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      borderRadius: '6px',
                      color: '#a4c8e1',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      lineHeight: 1.4,
                      outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {tableData.columns.map(col => {
                    const isPk = col.pk;
                    const val = editFormData[col.name];
                    const isLongText = col.name === 'content' || col.name === 'description' || col.name === 'bio' || col.name === 'backstory';

                    return (
                      <div
                        key={col.name}
                        style={{
                          gridColumn: isLongText ? '1 / -1' : 'span 1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <label style={{ fontSize: '0.74rem', color: isPk ? 'var(--gold-glow)' : '#cbd5e1', fontWeight: 600 }}>
                          {col.name} {isPk && <span style={{ color: 'var(--gold-ancient)', fontSize: '0.65rem' }}>[Klucz Główny]</span>}
                        </label>
                        {isLongText ? (
                          <textarea
                            rows={3}
                            value={val || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, [col.name]: e.target.value })}
                            style={{
                              padding: '0.45rem 0.6rem',
                              background: 'rgba(5, 8, 14, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '4px',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            disabled={isPk && !isCreatingNew}
                            value={val !== null && val !== undefined ? String(val) : ''}
                            onChange={(e) => setEditFormData({ ...editFormData, [col.name]: e.target.value })}
                            style={{
                              padding: '0.45rem 0.6rem',
                              background: isPk && !isCreatingNew ? 'rgba(0,0,0,0.5)' : 'rgba(5, 8, 14, 0.8)',
                              border: isPk ? '1px solid rgba(197, 159, 78, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '4px',
                              color: isPk && !isCreatingNew ? '#94a3b8' : '#ffffff',
                              fontSize: '0.78rem',
                              outline: 'none',
                              fontFamily: isPk || col.name.endsWith('_id') ? 'monospace' : 'inherit'
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                background: 'rgba(10, 15, 24, 0.95)',
                borderTop: '1px solid rgba(197, 159, 78, 0.25)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.6rem'
              }}
            >
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSaveRow}
                disabled={savingRow}
                className="btn-durmstrang"
                style={{ padding: '0.45rem 1.2rem', fontSize: '0.78rem', gap: '0.35rem' }}
              >
                <Check size={14} />
                <span>{savingRow ? 'Zapisywanie...' : 'Zapisz w Bazie Danych'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
