import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Award,
  Trophy,
  FileText,
  Users,
  Clock,
  Shield,
  Search,
  Sparkles,
  ChevronRight,
  BookOpen,
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';

// Subviews
import { MemoryOverviewTab } from './memory/MemoryOverviewTab';
import { MemoryYearViewTab } from './memory/MemoryYearViewTab';
import { MemoryWallOfFameTab } from './memory/MemoryWallOfFameTab';
import { MemoryTrophiesTab } from './memory/MemoryTrophiesTab';
import { MemoryDocumentsTab } from './memory/MemoryDocumentsTab';
import { MemoryPeopleTab } from './memory/MemoryPeopleTab';
import { MemoryPersonProfileTab } from './memory/MemoryPersonProfileTab';
import { MemoryOrderShowcaseTab } from './memory/MemoryOrderShowcaseTab';
import { MemoryTimelineTab } from './memory/MemoryTimelineTab';
import { MemoryArchiveWizardTab } from './memory/MemoryArchiveWizardTab';

// Modals
import { CertificateModal } from './memory/CertificateModal';
import { DiplomaModal } from './memory/DiplomaModal';

export const MemoryMainView = () => {
  const {
    currentUser,
    memoryTab,
    setMemoryTab,
    memoryYearId,
    setMemoryYearId,
    memoryPersonId,
    setMemoryPersonId,
    memoryHouseKey,
    setMemoryHouseKey,
    navigateToMemory,
    navigateToMemoryYear,
    navigateToMemoryPerson,
    navigateToMemoryOrder
  } = useSchool();

  const [overviewData, setOverviewData] = useState(null);
  const [currentYearData, setCurrentYearData] = useState(null);
  const [wallData, setWallData] = useState(null);
  const [trophiesData, setTrophiesData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Universal Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Modals for Certificates & Diplomas
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedDiploma, setSelectedDiploma] = useState(null);

  // Load Overview Data
  const loadOverview = async () => {
    setLoading(true);
    const res = await api.getMemoryOverview();
    if (res.ok && res.data) {
      setOverviewData(res.data);
    }
    setLoading(false);
  };

  // Load Specific Year Data
  const loadYearData = async (yId) => {
    setLoading(true);
    const res = await api.getMemoryYear(yId);
    if (res.ok && res.data) {
      setCurrentYearData(res.data);
    }
    setLoading(false);
  };

  // Load Wall of Fame
  const loadWallOfFame = async () => {
    setLoading(true);
    const res = await api.getMemoryWallOfFame();
    if (res.ok && res.data) {
      setWallData(res.data);
    }
    setLoading(false);
  };

  // Load Trophies
  const loadTrophies = async () => {
    setLoading(true);
    const res = await api.getMemoryTrophies('all');
    if (res.ok && res.data) {
      setTrophiesData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (memoryTab === 'year' || memoryTab === 'years') {
      loadYearData(memoryYearId || 'year-xvii');
    } else if (memoryTab === 'wall-of-fame') {
      loadWallOfFame();
    } else if (memoryTab === 'trophies') {
      loadTrophies();
    }
  }, [memoryTab, memoryYearId]);

  // Universal Search Handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await api.searchMemory(searchQuery);
      if (res.ok && res.data) {
        setSearchResults(res.data);
      }
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'headmaster' || currentUser.role === 'deputy' || currentUser.role === 'professor');

  const navTabs = [
    { id: 'overview', label: 'Strona Główna', icon: '🏛️' },
    { id: 'year', label: 'Archiwum Lat', icon: '📅' },
    { id: 'wall-of-fame', label: 'Ściana Chwały', icon: '🛡️' },
    { id: 'trophies', label: 'Sala Pucharów', icon: '🏆' },
    { id: 'documents', label: 'Sala Dokumentów', icon: '📜' },
    { id: 'people', label: 'Kronika Ludzi', icon: '👥' },
    { id: 'order', label: 'Gabloty Zakonów', icon: '🏛️' },
    { id: 'timeline', label: 'Oś Czasu', icon: '⏳' }
  ];

  if (isAdmin) {
    navTabs.push({ id: 'wizard', label: 'Kreator Archiwum', icon: '⚙️' });
  }

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem 2rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* =========================================================================
          1. MONUMENTAL HEADER WITH RUNIC ENGRAVINGS
          ========================================================================= */}
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 1.5rem 2rem',
          position: 'relative',
          marginBottom: '2rem'
        }}
      >
        <div style={{ fontSize: '0.78rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>
          ᛏᚹᛁᛖᚱᛞᛉᚨ ᛗᚨᚷᛁᛁ ᛞᚢᚱᛗᛋᛏᚱᚨᚾᚷ • ARCHIVUM AETERNUM
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '3.2rem',
            letterSpacing: '0.08em',
            margin: '0.2rem 0 0.5rem',
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 35px rgba(197, 159, 78, 0.3)'
          }}
        >
          IZBA PAMIĘCI
        </h1>

        <p
          style={{
            color: '#cbd5e1',
            fontStyle: 'italic',
            fontSize: '1.05rem',
            maxWidth: '650px',
            margin: '0 auto 1.8rem',
            lineHeight: 1.6
          }}
        >
          „To, co zapisano w murach Twierdzy, nie zostaje zapomniane.”
        </p>

        {/* Universal Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <Search size={18} color="var(--gold-ancient)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Przeszukaj całą Izbę Pamięci (adept, rocznik, dyplom, puchar, wydarzenie)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gothic-input"
            style={{
              paddingLeft: '2.8rem',
              paddingRight: searchQuery ? '2.5rem' : '1rem',
              width: '100%',
              fontSize: '0.95rem',
              borderRadius: '25px',
              border: '1px solid rgba(197, 159, 78, 0.4)',
              background: 'rgba(10, 14, 20, 0.85)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.8rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Universal Search Autocomplete Overlay */}
        {searchResults && (
          <div
            className="gothic-card"
            style={{
              position: 'absolute',
              top: 'calc(100% - 1.5rem)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '680px',
              zIndex: 100,
              background: 'rgba(15, 20, 28, 0.98)',
              border: '2px solid var(--gold-ancient)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
              padding: '1.5rem',
              textAlign: 'left',
              maxHeight: '420px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                Wyniki Wyszukiwania w Archiwum
              </span>
              <button onClick={() => setSearchResults(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* People Results */}
            {searchResults.people?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>
                  👥 Osoby & Absolwenci ({searchResults.people.length})
                </div>
                {searchResults.people.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSearchResults(null);
                      setSearchQuery('');
                      navigateToMemoryPerson(p.userId || p.characterName);
                    }}
                    style={{ padding: '0.5rem 0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', marginBottom: '0.3rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{p.characterName}</strong> ({p.house?.toUpperCase()})
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>{p.yearName}</span>
                    </div>
                    <ChevronRight size={14} color="var(--gold-ancient)" />
                  </div>
                ))}
              </div>
            )}

            {/* Years Results */}
            {searchResults.years?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>
                  📅 Roczniki ({searchResults.years.length})
                </div>
                {searchResults.years.map((y) => (
                  <div
                    key={y.id}
                    onClick={() => {
                      setSearchResults(null);
                      setSearchQuery('');
                      navigateToMemoryYear(y.id);
                    }}
                    style={{ padding: '0.5rem 0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', marginBottom: '0.3rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{y.name}</strong> ({y.term})
                      <span style={{ fontSize: '0.75rem', color: '#fde047', marginLeft: '0.5rem' }}>🏆 {y.winningHouse?.toUpperCase()}</span>
                    </div>
                    <ChevronRight size={14} color="var(--gold-ancient)" />
                  </div>
                ))}
              </div>
            )}

            {/* Diplomas & Certificates */}
            {searchResults.diplomas?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#fde047', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>
                  🎖️ Dyplomy & Świadectwa ({searchResults.diplomas.length})
                </div>
                {searchResults.diplomas.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSearchResults(null);
                      setSearchQuery('');
                      setSelectedDiploma(d);
                    }}
                    style={{ padding: '0.5rem 0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', marginBottom: '0.3rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{d.title}</strong> — {d.recipientName}
                    </div>
                    <ChevronRight size={14} color="var(--gold-ancient)" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          2. GLOBAL MEMORIAL NAVIGATION BAR
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
          paddingBottom: '1rem',
          marginBottom: '2.5rem'
        }}
      >
        {navTabs.map((tab) => {
          const isActive = (memoryTab === tab.id) || (tab.id === 'year' && memoryTab === 'years');
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'overview') navigateToMemory('overview');
                else if (tab.id === 'year') navigateToMemoryYear(memoryYearId || 'year-xvii');
                else if (tab.id === 'wall-of-fame') navigateToMemory('wall-of-fame');
                else if (tab.id === 'trophies') navigateToMemory('trophies');
                else if (tab.id === 'documents') navigateToMemory('documents');
                else if (tab.id === 'people') navigateToMemory('people');
                else if (tab.id === 'order') navigateToMemoryOrder(memoryHouseKey || 'ravnheim');
                else if (tab.id === 'timeline') navigateToMemory('timeline');
                else if (tab.id === 'wizard') navigateToMemory('wizard');
              }}
              style={{
                padding: '0.7rem 1.3rem',
                borderRadius: '6px',
                background: isActive ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(197, 159, 78, 0.08) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #c59f4e' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? 'var(--gold-ancient)' : '#cbd5e1',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 800 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: isActive ? '0 0 15px rgba(197, 159, 78, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          3. ACTIVE SUBVIEW COMPONENT
          ========================================================================= */}
      {memoryTab === 'overview' && (
        <MemoryOverviewTab
          overviewData={overviewData}
          onSelectYear={(yId) => navigateToMemoryYear(yId)}
          onSelectTab={(tab) => navigateToMemory(tab)}
          onSelectHouse={(hKey) => navigateToMemoryOrder(hKey)}
          onInspectCertificate={(c) => setSelectedCertificate(c)}
          onInspectDiploma={(d) => setSelectedDiploma(d)}
        />
      )}

      {(memoryTab === 'year' || memoryTab === 'years') && (
        <MemoryYearViewTab
          yearData={currentYearData}
          onSelectPerson={(pId) => navigateToMemoryPerson(pId)}
          onInspectCertificate={(c) => setSelectedCertificate(c)}
          onInspectDiploma={(d) => setSelectedDiploma(d)}
        />
      )}

      {memoryTab === 'wall-of-fame' && (
        <MemoryWallOfFameTab
          wallData={wallData}
          onSelectYear={(yId) => navigateToMemoryYear(yId)}
          onSelectPerson={(pId) => navigateToMemoryPerson(pId)}
        />
      )}

      {memoryTab === 'trophies' && (
        <MemoryTrophiesTab
          trophies={trophiesData}
          onSelectYear={(yId) => navigateToMemoryYear(yId)}
        />
      )}

      {memoryTab === 'documents' && (
        <MemoryDocumentsTab
          onInspectCertificate={(c) => setSelectedCertificate(c)}
          onInspectDiploma={(d) => setSelectedDiploma(d)}
        />
      )}

      {memoryTab === 'people' && (
        <MemoryPeopleTab
          onSelectPerson={(pId) => navigateToMemoryPerson(pId)}
        />
      )}

      {memoryTab === 'person' && (
        <MemoryPersonProfileTab
          personIdentifier={memoryPersonId}
          onBack={() => navigateToMemory('people')}
          onInspectCertificate={(c) => setSelectedCertificate(c)}
          onInspectDiploma={(d) => setSelectedDiploma(d)}
        />
      )}

      {memoryTab === 'order' && (
        <MemoryOrderShowcaseTab
          houseKey={memoryHouseKey}
          onSelectHouse={(hKey) => setMemoryHouseKey(hKey)}
          onSelectPerson={(pId) => navigateToMemoryPerson(pId)}
        />
      )}

      {memoryTab === 'timeline' && (
        <MemoryTimelineTab
          onSelectYear={(yId) => navigateToMemoryYear(yId)}
        />
      )}

      {memoryTab === 'wizard' && (
        <MemoryArchiveWizardTab
          onPublishedYear={(newYearId) => {
            loadOverview();
            navigateToMemoryYear(newYearId);
          }}
        />
      )}

      {/* =========================================================================
          4. MODALS (CERTIFICATE & DIPLOMA INSPECTOR)
          ========================================================================= */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {selectedDiploma && (
        <DiplomaModal
          diploma={selectedDiploma}
          onClose={() => setSelectedDiploma(null)}
        />
      )}
    </div>
  );
};
