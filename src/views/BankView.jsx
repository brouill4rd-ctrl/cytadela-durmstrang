import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Coins,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Search,
  Filter,
  Lock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
  Award,
  CreditCard,
  Briefcase,
  History,
  FileText,
  Check,
  ChevronRight,
  Landmark,
  UserCheck,
  Compass,
  Flame,
  RefreshCw
} from 'lucide-react';

const TREASURIES = [
  {
    id: 'cytadela-treasury',
    name: 'Skarbiec Główny Twierdzy Magii Durmstrang (TMD)',
    shortName: 'Skarbiec Główny TMD',
    house: null,
    role: 'treasury',
    icon: '🏰',
    rune: 'ᛟ',
    color: 'var(--gold-ancient)',
    bgColor: 'rgba(197, 159, 78, 0.15)',
    description: 'Oficjalny skarbiec centralny Cytadeli i Rady Dyrekcji. Gromadzi fundusze na stypendia, rozbudowę twierdzy i pensje.'
  },
  {
    id: 'house-treasury-reinhall',
    name: 'Skarbiec Zakonu Reinhall',
    shortName: 'Skarbiec Reinhall',
    house: 'reinhall',
    role: 'treasury',
    icon: '🐂',
    rune: 'ᚦ',
    color: '#a8384b',
    bgColor: 'rgba(122, 38, 50, 0.35)',
    description: 'Skarbiec rodowy Zakonu Krwi i Wiecznej Zmarzliny. Fundusze na uzbrojenie i badania runiczne.'
  },
  {
    id: 'house-treasury-bjornhall',
    name: 'Skarbiec Zakonu Björnhall',
    shortName: 'Skarbiec Björnhall',
    house: 'bjornhall',
    role: 'treasury',
    icon: '🐻',
    rune: 'ᛉ',
    color: '#5b8aaf',
    bgColor: 'rgba(53, 83, 111, 0.6)',
    description: 'Skarbiec w Bastionie Żelaza. Wspiera Ligę Bojową, turnieje Hólmganga i alchemię kuźniczą.'
  },
  {
    id: 'house-treasury-ravnheim',
    name: 'Skarbiec Zakonu Ravnheim',
    shortName: 'Skarbiec Ravnheim',
    house: 'ravnheim',
    role: 'treasury',
    icon: '🦅',
    rune: 'ᚱ',
    color: '#7a6ea0',
    bgColor: 'rgba(66, 56, 95, 0.6)',
    description: 'Skarbiec Wieży Nocnych Szeptów. Finansuje badania nad astralnymi runami, grimuarami i nekromancją.'
  },
  {
    id: 'house-treasury-otergard',
    name: 'Skarbiec Zakonu Otergard',
    shortName: 'Skarbiec Otergard',
    house: 'otergard',
    role: 'treasury',
    icon: '🦇',
    rune: 'ᛞ',
    color: '#3aaa9f',
    bgColor: 'rgba(35, 97, 91, 0.6)',
    description: 'Skarbiec Ogrodów Lodowych Cieplic. Zapewnia rzadkie odczynniki alchemiczne i destylaty.'
  }
];

export const BankView = () => {
  const {
    bankAccount,
    bankTransactions,
    transferFunds,
    payoutAllSalaries,
    teacherSalaries,
    salaryConfig,
    currentUser,
    currentRole,
    users,
    houses
  } = useSchool();

  const { playCoinSound, playWandSwoosh, playRuneChime } = useSound();

  // Navigation tabs in Bank
  const [activeTab, setActiveTab] = useState('vault'); // 'vault' | 'transfer' | 'ledger' | 'payroll'

  // Transfer Form State
  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTitle, setTransferTitle] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState(null);

  // Recipient Filters (Zakon & Funkcja)
  const [recipientHouseFilter, setRecipientHouseFilter] = useState('all'); // 'all' | 'reinhall' | 'bjornhall' | 'ravnheim' | 'otergard' | 'treasury'
  const [recipientRoleFilter, setRecipientRoleFilter] = useState('all'); // 'all' | 'student' | 'professor' | 'admin' | 'treasury'
  const [recipientSearch, setRecipientSearch] = useState('');

  // Ledger Filter State
  const [txCategoryFilter, setTxCategoryFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all'); // 'all' | 'inflow' | 'outflow'
  const [searchQuery, setSearchQuery] = useState('');

  // Payroll Form State
  const [payrollAmount, setPayrollAmount] = useState('500');
  const [payrollPeriod, setPayrollPeriod] = useState('Semestr Zimowy 2026/2027');

  const userHouse = currentUser?.house ? houses[currentUser.house] : null;
  const currentBalance = currentUser?.currency || bankAccount?.balance || 0;

  // Build unified recipient list with metadata
  const allPotentialRecipients = [
    ...TREASURIES.map(t => ({
      id: t.id,
      name: t.name,
      fullName: t.name,
      shortName: t.shortName,
      isTreasury: true,
      role: 'treasury',
      roleLabel: 'Skarbiec Oficjalny',
      house: t.house,
      houseName: t.house ? (houses[t.house]?.name || t.house) : 'Cytadela TMD',
      icon: t.icon,
      rune: t.rune,
      color: t.color,
      bgColor: t.bgColor,
      description: t.description,
      avatar: null
    })),
    ...(users || [])
      .filter(u => u.id !== currentUser?.id)
      .map(u => {
        const h = u.house ? houses[u.house] : null;
        const roleLabel = u.role === 'admin'
          ? 'Dyrekcja Cytadeli'
          : u.role === 'professor'
          ? 'Profesor / Mistrz Katedry'
          : `Adept • ${h?.name || u.house || 'Nowicjusz'}`;

        return {
          id: u.id,
          name: u.fullName || `${u.name || ''} ${u.surname || ''}`.trim() || u.username,
          fullName: u.fullName || `${u.name || ''} ${u.surname || ''}`.trim() || u.username,
          shortName: u.name || u.fullName,
          isTreasury: false,
          role: u.role || 'student',
          roleLabel,
          house: u.house,
          houseName: h?.name || (u.house ? u.house.toUpperCase() : 'Brak przydziału'),
          icon: u.role === 'admin' ? '👑' : u.role === 'professor' ? '📜' : (h?.crestIcon || '🧙'),
          rune: h?.crestIcon || (u.role === 'admin' ? 'ᛟ' : 'ᛋ'),
          color: h ? h.colors.secondary : (u.role === 'admin' ? 'var(--gold-ancient)' : '#cbd5e1'),
          bgColor: h ? `${h.colors.primary}44` : 'rgba(255,255,255,0.04)',
          description: u.title || (u.role === 'professor' ? u.departmentName : u.classYear) || '',
          avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          currency: u.currency || 0
        };
      })
  ];

  // Filtered recipients
  const filteredRecipients = allPotentialRecipients.filter(rec => {
    // House filter
    if (recipientHouseFilter === 'treasury') {
      if (!rec.isTreasury) return false;
    } else if (recipientHouseFilter !== 'all') {
      if (rec.house !== recipientHouseFilter) return false;
    }

    // Role filter
    if (recipientRoleFilter !== 'all') {
      if (rec.role !== recipientRoleFilter) return false;
    }

    // Text search
    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      const matchName = (rec.fullName || '').toLowerCase().includes(q);
      const matchRole = (rec.roleLabel || '').toLowerCase().includes(q);
      const matchDesc = (rec.description || '').toLowerCase().includes(q);
      const matchHouse = (rec.houseName || '').toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchDesc && !matchHouse) return false;
    }

    return true;
  });

  const selectedRecipient = allPotentialRecipients.find(r => r.id === recipientId);

  // Filtered transactions for the ledger
  const filteredTransactions = (bankTransactions || []).filter(tx => {
    const matchesUser = currentRole === 'admin' ||
      tx.senderId === currentUser?.id ||
      tx.recipientId === currentUser?.id;

    const matchesCategory = txCategoryFilter === 'all' || tx.category === txCategoryFilter;
    const matchesType = txTypeFilter === 'all' ||
      (txTypeFilter === 'inflow' && (tx.recipientId === currentUser?.id || tx.type === 'inflow')) ||
      (txTypeFilter === 'outflow' && (tx.senderId === currentUser?.id || tx.type === 'outflow'));

    const matchesSearch = (tx.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.senderName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.recipientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.referenceCode || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesUser && matchesCategory && matchesType && matchesSearch;
  });

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    const numAmount = parseInt(transferAmount, 10);
    if (isNaN(numAmount) || numAmount <= 0) return;

    playCoinSound();
    const success = await transferFunds({
      recipientId,
      amount: numAmount,
      title: transferTitle || 'Przelew bankowy Skirnirów',
      note: transferNote
    });

    if (success) {
      setTransferSuccess(true);
      setTransferFeedback({
        amount: numAmount,
        recipientName: selectedRecipient?.fullName || recipientId,
        title: transferTitle || 'Przelew bankowy Skirnirów'
      });
      setTransferAmount('');
      setTransferTitle('');
      setTransferNote('');
      setTimeout(() => {
        setTransferSuccess(false);
      }, 7000);
    }
  };

  const handleBulkPayroll = async () => {
    playCoinSound();
    await payoutAllSalaries(parseInt(payrollAmount, 10), payrollPeriod);
  };

  const selectRecipientCard = (id) => {
    playWandSwoosh();
    setRecipientId(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* =========================================================================
          1. HEADER WITH VAULT BANNER & INTEGRATED STATUS
          ========================================================================= */}
      <div
        className="gothic-card runic-corners"
        style={{
          padding: '2rem 2.4rem',
          background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          boxShadow: '0 10px 35px rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.8rem'
        }}
      >
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--gold-ancient)', fontSize: '0.82rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              ᛟ Podziemia Granitowe Twierdzy Magii (TMD) ᛟ
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', color: 'var(--gold-glow)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              Oficjalny Skarbiec Północy
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', margin: '0.2rem 0 0.5rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
            Kaupangr Skírnisbanki
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: 1.5, margin: 0, maxWidth: '640px' }}>
            Magiczny Skarbiec Twierdzy Magii Durmstrang. Przechowuj cenne Skirniry (ᛋ), wykonuj błyskawiczne przelewy runiczne do adeptów i zakonów oraz odbieraj wypłaty i stypendia.
          </p>
        </div>

        {/* Global Wallet Pill */}
        <div
          style={{
            padding: '1.2rem 1.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            borderRadius: '10px',
            border: '1px solid rgba(197, 159, 78, 0.5)',
            background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.95) 0%, rgba(14, 18, 26, 0.98) 100%)',
            boxShadow: '0 0 20px rgba(197, 159, 78, 0.15)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(197, 159, 78, 0.25) 0%, rgba(197, 159, 78, 0.05) 70%)',
              border: '2px solid var(--gold-ancient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(197, 159, 78, 0.3)'
            }}
          >
            <Coins size={28} color="var(--gold-ancient)" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800 }}>
              Stan Skrytki ({bankAccount?.vaultNumber || (currentUser?.house ? `SKR-${currentUser.house.toUpperCase().slice(0,4)}` : 'SKR-400-NOV')})
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.1rem', fontWeight: 800, color: '#ffe7a3', lineHeight: 1.1 }}>
              {currentBalance} <span style={{ color: 'var(--gold-glow)', fontSize: '1.6rem' }}>ᛋ</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
              Waluta: Złote Skirniry Durmstrangu
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. NAVIGATION TABS
          ========================================================================= */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => { playWandSwoosh(); setActiveTab('vault'); }}
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'vault' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
            background: activeTab === 'vault' ? 'rgba(197, 159, 78, 0.22)' : 'rgba(12, 16, 24, 0.6)',
            color: activeTab === 'vault' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Building size={16} color={activeTab === 'vault' ? 'var(--gold-glow)' : 'currentColor'} /> Karta Skrytki Bankowej
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('transfer'); }}
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'transfer' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
            background: activeTab === 'transfer' ? 'rgba(197, 159, 78, 0.22)' : 'rgba(12, 16, 24, 0.6)',
            color: activeTab === 'transfer' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Send size={16} color={activeTab === 'transfer' ? 'var(--gold-glow)' : 'currentColor'} /> Przelew Skirnirów
          <span style={{ fontSize: '0.72rem', background: 'rgba(197,159,78,0.2)', padding: '0.1rem 0.45rem', borderRadius: '10px', color: 'var(--gold-glow)' }}>
            {allPotentialRecipients.length}
          </span>
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('ledger'); }}
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'ledger' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
            background: activeTab === 'ledger' ? 'rgba(197, 159, 78, 0.22)' : 'rgba(12, 16, 24, 0.6)',
            color: activeTab === 'ledger' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={16} color={activeTab === 'ledger' ? 'var(--gold-glow)' : 'currentColor'} /> Księga Wpływów i Wydatków
          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
            {filteredTransactions.length}
          </span>
        </button>

        {(currentRole === 'admin' || currentRole === 'professor') && (
          <button
            onClick={() => { playWandSwoosh(); setActiveTab('payroll'); }}
            style={{
              padding: '0.7rem 1.4rem',
              borderRadius: '6px',
              border: activeTab === 'payroll' ? '1px solid #d8b4fe' : '1px solid rgba(168, 85, 247, 0.3)',
              background: activeTab === 'payroll' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.08)',
              color: '#d8b4fe',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginLeft: 'auto',
              transition: 'all 0.15s ease'
            }}
          >
            <Briefcase size={16} /> Wypłaty Profesorskie
          </button>
        )}
      </div>

      {/* =========================================================================
          3. TAB 1: VAULT CARD & BANK SECURITY
          ========================================================================= */}
      {activeTab === 'vault' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.8rem', alignItems: 'start' }}>
          {/* Main Vault Passport */}
          <div
            className="gothic-card runic-corners"
            style={{
              padding: '2.2rem',
              background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.96) 0%, rgba(8, 12, 18, 0.98) 100%)',
              border: '1px solid var(--gold-ancient)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.6rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                  ᛟ Świadectwo Depozytowe Skrytki ᛟ
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(46, 196, 182, 0.15)', border: '1px solid #2ec4b6', color: '#8cefe6', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                  STATUS: AKTYWNY
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.4rem' }}>
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser?.fullName || 'Adept'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '2px solid var(--gold-ancient)',
                    boxShadow: '0 0 15px rgba(197, 159, 78, 0.2)'
                  }}
                />
                <div>
                  <h2 style={{ fontSize: '1.7rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0, lineHeight: 1.2 }}>
                    {currentUser?.fullName || 'Adept Durmstrangu'}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: userHouse ? userHouse.colors.secondary : 'var(--gold-ancient)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{userHouse?.crestIcon || 'ᛟ'}</span>
                    <span>{bankAccount?.vaultTier || (currentUser?.role === 'admin' ? 'Najwyższy Skarbiec Dyrekcji' : currentUser?.role === 'professor' ? 'Krypta Profesorska' : 'Skrytka Adepta')}</span>
                    <span>•</span>
                    <span>{userHouse ? userHouse.fullName : 'Cytadela Durmstrang'}</span>
                  </div>
                </div>
              </div>

              {/* Depository Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.35)', padding: '1.3rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Numer Skrytki:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--gold-glow)', fontWeight: 700, marginTop: '0.2rem' }}>
                    {bankAccount?.vaultNumber || (currentUser?.house ? `SKR-782-${currentUser.house.toUpperCase().slice(0,4)}` : 'SKR-400-NOV')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Oprocentowanie:</div>
                  <div style={{ fontSize: '0.95rem', color: '#8cefe6', fontWeight: 600, marginTop: '0.2rem' }}>
                    {bankAccount?.interestRate || '2.5% rocznie'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pieczęć Ochronna:</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                    {bankAccount?.runeSeal || 'Pieczęć Algiz & Sowilo'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strażnik Skarbca:</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                    {bankAccount?.guardian || 'Górski Troll Granitowy (Brokk)'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem', display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => { playWandSwoosh(); setActiveTab('transfer'); }}
                className="btn-durmstrang"
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                <Send size={15} /> Wykonaj Przelew
              </button>
              <button
                onClick={() => { playWandSwoosh(); setActiveTab('ledger'); }}
                className="btn-durmstrang-secondary"
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                <History size={15} /> Historia Transakcji
              </button>
            </div>
          </div>

          {/* Quick Stats & Security Vault Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div
              className="gothic-card"
              style={{
                padding: '1.5rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(46, 196, 182, 0.15)', border: '1px solid #2ec4b6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={24} color="#2ec4b6" />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1rem', margin: '0 0 0.25rem', fontFamily: 'var(--font-heading)' }}>
                  Nienaruszalność Depozytów Paktu 1294
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, margin: 0 }}>
                  Zgodnie z Paktem 1294, żadna klątwa ani dekret aresztowania nie może zamrozić Skirnirów w skrytkach Kaupangr bez jednogłośnej zgody Rady Mistrzów.
                </p>
              </div>
            </div>

            <div
              className="gothic-card"
              style={{
                padding: '1.5rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Coins size={24} color="var(--gold-ancient)" />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1rem', margin: '0 0 0.25rem', fontFamily: 'var(--font-heading)' }}>
                  Waluta Skirnirów (ᛋ)
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, margin: 0 }}>
                  Bita z czystego złota fiordowego z domieszką meteorytowego żelaza. Akceptowana na całym targu Kaupangr, w Katedrach oraz w zbrojowniach.
                </p>
              </div>
            </div>

            <div
              className="gothic-card"
              style={{
                padding: '1.5rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={24} color="#d8b4fe" />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1rem', margin: '0 0 0.25rem', fontFamily: 'var(--font-heading)' }}>
                  Automatyczne Wynagrodzenia i Stypendia
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, margin: 0 }}>
                  Wszystkie wypłaty za publikację Dzienników Lekcyjnych, nagrody za punkty roczne oraz wygrane w Loterii Odyna trafiają prosto na Twoje konto.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. TAB 2: MONEY TRANSFER WIZARD (INTERACTIVE RECIPIENT SELECTOR)
          ========================================================================= */}
      {activeTab === 'transfer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Transfer Success Notification */}
          {transferSuccess && transferFeedback && (
            <div
              style={{
                background: 'rgba(46, 196, 182, 0.15)',
                border: '1px solid #2ec4b6',
                borderRadius: '8px',
                padding: '1.2rem 1.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                color: '#8cefe6',
                boxShadow: '0 0 20px rgba(46, 196, 182, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <CheckCircle2 size={24} color="#2ec4b6" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                    Przelew {transferFeedback.amount} ᛋ został pomyślnie zrealizowany!
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    Odbiorca: <strong>{transferFeedback.recipientName}</strong> • Tytuł: <em>„{transferFeedback.title}”</em>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTransferSuccess(false)}
                style={{ background: 'transparent', border: 'none', color: '#8cefe6', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ✕ Zamknij
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* -------------------------------------------------------------
                LEFT COLUMN: STEP 1 - INTERACTIVE RECIPIENT SELECTION & FILTERS
                ------------------------------------------------------------- */}
            <div
              className="gothic-card runic-corners"
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.96) 0%, rgba(8, 11, 18, 0.98) 100%)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.4rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                    KROK 1: WYBÓR ODBIORCY
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Dostępnych: <strong style={{ color: 'var(--gold-glow)' }}>{filteredRecipients.length}</strong>
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0 0 0.3rem' }}>
                  Adresaci Przelewu
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  Wybierz postać, profesora lub skarbiec Zakonu za pomocą filtrów:
                </p>
              </div>

              {/* 1. FILTER BY ZAKON (HOUSE) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  🏛️ Filtruj Zakonem:
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Wszystkie' },
                    { id: 'treasury', label: '🏰 Skarbce' },
                    { id: 'reinhall', label: '🐂 Reinhall' },
                    { id: 'bjornhall', label: '🐻 Björnhall' },
                    { id: 'ravnheim', label: '🦅 Ravnheim' },
                    { id: 'otergard', label: '🦇 Otergard' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { playWandSwoosh(); setRecipientHouseFilter(f.id); }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        borderRadius: '4px',
                        border: recipientHouseFilter === f.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                        background: recipientHouseFilter === f.id ? 'rgba(197, 159, 78, 0.25)' : 'rgba(255,255,255,0.03)',
                        color: recipientHouseFilter === f.id ? '#ffe49e' : '#9ca3af',
                        fontWeight: recipientHouseFilter === f.id ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. FILTER BY FUNKCJA (ROLE) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  📜 Filtruj Funkcją:
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Wszyscy' },
                    { id: 'student', label: '🧙 Adeptowie' },
                    { id: 'professor', label: '📜 Profesorowie' },
                    { id: 'admin', label: '👑 Dyrekcja' },
                    { id: 'treasury', label: '🏛️ Skarbce' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { playWandSwoosh(); setRecipientRoleFilter(r.id); }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        borderRadius: '4px',
                        border: recipientRoleFilter === r.id ? '1px solid #d8b4fe' : '1px solid rgba(255,255,255,0.08)',
                        background: recipientRoleFilter === r.id ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.03)',
                        color: recipientRoleFilter === r.id ? '#ffffff' : '#9ca3af',
                        fontWeight: recipientRoleFilter === r.id ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. SEARCH BAR */}
              <div style={{ position: 'relative' }}>
                <Search size={15} color="var(--gold-ancient)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Szukaj po nazwisku, katedrze lub tytule..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', paddingLeft: '2.2rem', paddingRight: '0.8rem', fontSize: '0.85rem' }}
                />
              </div>

              {/* 4. RECIPIENT CARDS SCROLLABLE LIST */}
              <div
                style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  paddingRight: '0.3rem'
                }}
              >
                {filteredRecipients.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Nie znaleziono odbiorców dla podanych filtrów</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>Zmień filtry lub wyczyść pole wyszukiwania.</div>
                  </div>
                ) : (
                  filteredRecipients.map(rec => {
                    const isSelected = recipientId === rec.id;

                    return (
                      <div
                        key={rec.id}
                        onClick={() => selectRecipientCard(rec.id)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.22) 0%, rgba(20, 26, 38, 0.95) 100%)'
                            : 'rgba(12, 16, 24, 0.75)',
                          boxShadow: isSelected ? '0 0 15px rgba(197, 159, 78, 0.2)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.8rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
                          {rec.isTreasury ? (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                background: rec.bgColor || 'rgba(197, 159, 78, 0.15)',
                                border: `1px solid ${rec.color || 'var(--gold-ancient)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.3rem',
                                flexShrink: 0
                              }}
                            >
                              {rec.icon}
                            </div>
                          ) : (
                            <img
                              src={rec.avatar}
                              alt={rec.name}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: isSelected ? '2px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.2)',
                                flexShrink: 0
                              }}
                            />
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {rec.fullName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: rec.color || '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                              <span style={{ fontWeight: 600 }}>{rec.rune}</span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.roleLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {isSelected ? (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gold-ancient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={14} color="#000000" strokeWidth={3} />
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Wybierz →</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* -------------------------------------------------------------
                RIGHT COLUMN: STEP 2 - TRANSFER FORM & AMOUNT
                ------------------------------------------------------------- */}
            <div
              className="gothic-card runic-corners"
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.96) 0%, rgba(8, 11, 18, 0.98) 100%)',
                border: '1px solid var(--gold-ancient)'
              }}
            >
              <div style={{ marginBottom: '1.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                  KROK 2: SZCZEGÓŁY TRANSAKCJI
                </span>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0.2rem 0 0.3rem' }}>
                  Formularz Przelewu
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  Określ liczbę Skirnirów oraz dołącz dedykację runiczną.
                </p>
              </div>

              {/* Selected Recipient Card Banner */}
              <div
                style={{
                  padding: '1.1rem 1.3rem',
                  borderRadius: '8px',
                  border: selectedRecipient ? '1px solid var(--gold-ancient)' : '1px dashed rgba(255,255,255,0.15)',
                  background: selectedRecipient ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.15) 0%, rgba(12, 16, 24, 0.9) 100%)' : 'rgba(0,0,0,0.2)',
                  marginBottom: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                {selectedRecipient ? (
                  <>
                    {selectedRecipient.isTreasury ? (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: selectedRecipient.bgColor, border: `1px solid ${selectedRecipient.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {selectedRecipient.icon}
                      </div>
                    ) : (
                      <img
                        src={selectedRecipient.avatar}
                        alt={selectedRecipient.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold-ancient)', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                        Wybrany Odbiorca:
                      </div>
                      <div style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedRecipient.fullName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: selectedRecipient.color || '#94a3b8' }}>
                        {selectedRecipient.roleLabel} • {selectedRecipient.houseName}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <AlertCircle size={18} color="var(--gold-ancient)" />
                    <span>Wybierz odbiorcę z listy po lewej stronie, aby odblokować formularz.</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Fallback Selector for accessibility / quick change */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Adresat docelowy:
                  </label>
                  <select
                    required
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.65rem 0.8rem', fontSize: '0.88rem', background: 'rgba(8, 12, 18, 0.9)' }}
                  >
                    <option value="">-- Wybierz postać lub skarbiec --</option>
                    <optgroup label="🏰 Skarbce Zakonów & Twierdzy (TMD)">
                      {TREASURIES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🧙 Adeptowie, Profesorowie i Dyrekcja">
                      {(users || []).filter(u => u.id !== currentUser?.id).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role === 'professor' ? 'Profesor' : u.role === 'admin' ? 'Dyrekcja' : `Adept ${u.house || ''}`})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Amount with Fast Pills */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 600 }}>
                      Kwota Przelewu (Skirniry):
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Dostępne saldo: <strong style={{ color: 'var(--gold-glow)' }}>{currentBalance} ᛋ</strong>
                    </span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Coins size={16} color="var(--gold-ancient)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="number"
                      required
                      min="1"
                      max={currentBalance}
                      placeholder="np. 50, 100"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '1rem', fontWeight: 700 }}
                    />
                  </div>

                  {/* Quick amount buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {[25, 50, 100, 250].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { playCoinSound(); setTransferAmount(Math.min(currentBalance, val).toString()); }}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          color: '#cbd5e1',
                          cursor: 'pointer'
                        }}
                      >
                        +{val} ᛋ
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { playCoinSound(); setTransferAmount(currentBalance.toString()); }}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        background: 'rgba(197, 159, 78, 0.15)',
                        border: '1px solid var(--gold-ancient)',
                        borderRadius: '4px',
                        color: 'var(--gold-glow)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Całe Saldo (MAX)
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Tytuł Przelewu:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Wsparcie Zakonu, Zapłata za grimuar, Darowizna"
                    value={transferTitle}
                    onChange={(e) => setTransferTitle(e.target.value)}
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
                  />

                  {/* Suggested quick titles */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      'Wsparcie Zakonu',
                      'Zapłata za Grimuar',
                      'Zlecenie Alchemiczne',
                      'Stypendium Badawcze'
                    ].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTransferTitle(t)}
                        style={{
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '4px',
                          color: '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note / Message */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Wiadomość / List Runiczny (Opcjonalnie):
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Wpisz treść listu dołączonego do sakiewki..."
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

                {/* Balance after transfer preview */}
                {transferAmount && parseInt(transferAmount, 10) > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.25)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pozostałe saldo po transakcji:</span>
                    <strong style={{ color: currentBalance - parseInt(transferAmount, 10) >= 0 ? '#8cefe6' : '#f87171' }}>
                      {Math.max(0, currentBalance - parseInt(transferAmount, 10))} ᛋ
                    </strong>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!recipientId || !transferAmount || parseInt(transferAmount, 10) <= 0 || parseInt(transferAmount, 10) > currentBalance}
                  className="btn-durmstrang"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.98rem',
                    justifyContent: 'center',
                    marginTop: '0.3rem',
                    opacity: (!recipientId || !transferAmount || parseInt(transferAmount, 10) <= 0 || parseInt(transferAmount, 10) > currentBalance) ? 0.5 : 1
                  }}
                >
                  <Send size={18} /> Pieczętuj i Przelej Skirniry
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. TAB 3: TRANSACTION LEDGER (HISTORIA WPŁYWÓW I WYDATKÓW)
          ========================================================================= */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Wszystkie Operacje' },
                { id: 'stypendium', label: 'Stypendia' },
                { id: 'zakup', label: 'Zakupy na Rynku' },
                { id: 'przelew', label: 'Przelewy' },
                { id: 'pensja', label: 'Pensje Profesorskie' },
                { id: 'loteria', label: 'Loteria Odyna' },
                { id: 'nagroda_wyprawka', label: 'Nagrody za Wyprawki' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { playWandSwoosh(); setTxCategoryFilter(cat.id); }}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '4px',
                    border: txCategoryFilter === cat.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                    background: txCategoryFilter === cat.id ? 'rgba(197, 159, 78, 0.2)' : 'rgba(15, 19, 27, 0.6)',
                    color: txCategoryFilter === cat.id ? '#ffe8aa' : '#9ca3af',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Inflow / Outflow Filter + Search */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="gothic-input"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <option value="all">Wszystkie kierunki</option>
                <option value="inflow">Tylko Wpływy (+)</option>
                <option value="outflow">Tylko Wydatki (-)</option>
              </select>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="var(--gold-ancient)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Szukaj w księdze..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <FileText size={40} style={{ margin: '0 auto 0.8rem', opacity: 0.4 }} />
              <h3 style={{ color: '#ffffff', marginBottom: '0.3rem' }}>Brak wpisów w wybranej kategorii</h3>
              <p style={{ fontSize: '0.85rem' }}>Zmień filtry wyszukiwania lub zrealizuj nową transakcję.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredTransactions.map(tx => {
                const isInflow = tx.recipientId === currentUser?.id || tx.type === 'inflow';

                return (
                  <div
                    key={tx.id}
                    className="gothic-card"
                    style={{
                      padding: '1.1rem 1.5rem',
                      background: 'rgba(12, 16, 24, 0.88)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Left Icon & Main Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: isInflow ? 'rgba(46, 196, 182, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                          border: isInflow ? '1px solid #2ec4b6' : '1px solid rgba(239, 68, 68, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isInflow ? (
                          <ArrowDownLeft size={20} color="#2ec4b6" />
                        ) : (
                          <ArrowUpRight size={20} color="#f87171" />
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                          {tx.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                          <span>Od: <strong style={{ color: '#cbd5e1' }}>{tx.senderName}</strong></span>
                          <span>→</span>
                          <span>Do: <strong style={{ color: '#cbd5e1' }}>{tx.recipientName}</strong></span>
                          {tx.note && <span style={{ fontStyle: 'italic' }}>„{tx.note}”</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right Amount & Metadata */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: isInflow ? '#8cefe6' : '#fca5a5'
                          }}
                        >
                          {isInflow ? `+${tx.amount}` : `-${tx.amount}`} ᛋ
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {tx.referenceCode} • {tx.date}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          6. TAB 4: TEACHER PAYROLL & SALARIES
          ========================================================================= */}
      {activeTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Payroll Dispatcher Card for Admin */}
          {currentRole === 'admin' && (
            <div
              className="gothic-card runic-corners"
              style={{
                padding: '2.2rem',
                background: 'linear-gradient(135deg, rgba(25, 18, 38, 0.95) 0%, rgba(12, 10, 20, 0.98) 100%)',
                border: '1px solid #a855f7'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d8b4fe', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
                    <Briefcase size={15} /> Panel Skarbnika Dyrekcji
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginTop: '0.2rem', fontFamily: 'var(--font-heading)' }}>
                    Masowa Wypłata Uposażeń Profesorskich
                  </h2>
                  <p style={{ color: '#d1d5db', fontSize: '0.9rem', maxWidth: '600px' }}>
                    Wyślij oficjalne dekretowe honoraria do wszystkich zatwierdzonych profesorów Katedr Durmstrangu jednym kliknięciem z kasy Cytadeli.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#d8b4fe', marginBottom: '0.2rem' }}>Stawka na Profesora (ᛋ):</label>
                    <input
                      type="number"
                      value={payrollAmount}
                      onChange={(e) => setPayrollAmount(e.target.value)}
                      className="gothic-input"
                      style={{ width: '120px', padding: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#d8b4fe', marginBottom: '0.2rem' }}>Okres / Semestr:</label>
                    <input
                      type="text"
                      value={payrollPeriod}
                      onChange={(e) => setPayrollPeriod(e.target.value)}
                      className="gothic-input"
                      style={{ width: '220px', padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    onClick={handleBulkPayroll}
                    className="btn-durmstrang"
                    style={{
                      marginTop: '1.1rem',
                      padding: '0.65rem 1.4rem',
                      fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                      border: '1px solid #c084fc',
                      color: '#ffffff'
                    }}
                  >
                    <Coins size={16} /> Wypłać Pensje Wszystkim
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Faculty List & Rates */}
          <div className="gothic-card" style={{ padding: '1.8rem', background: 'rgba(12, 16, 24, 0.9)' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
              Kadra Profesorska i Zarejestrowane Uposażenia
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {(users || []).filter(u => u.role === 'professor').map(prof => (
                <div
                  key={prof.id}
                  style={{
                    background: 'rgba(8, 12, 18, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <img
                    src={prof.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
                    alt={prof.fullName}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-ancient)' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                      {prof.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#d8b4fe' }}>
                      {prof.departmentName || 'Katedra Magii'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold-glow)', fontWeight: 700, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Coins size={13} color="var(--gold-ancient)" /> Stan Skrytki: {prof.currency || 0} Skirnirów
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
