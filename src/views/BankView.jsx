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
  FileText
} from 'lucide-react';

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

  // Ledger Filter State
  const [txCategoryFilter, setTxCategoryFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all'); // 'all' | 'inflow' | 'outflow'
  const [searchQuery, setSearchQuery] = useState('');

  // Payroll Form State
  const [payrollAmount, setPayrollAmount] = useState('500');
  const [payrollPeriod, setPayrollPeriod] = useState('Semestr Zimowy 2026/2027');

  const userHouse = currentUser?.house ? houses[currentUser.house] : null;
  const currentBalance = currentUser?.currency || bankAccount?.balance || 0;

  // Filtered transactions for the ledger
  const filteredTransactions = (bankTransactions || []).filter(tx => {
    // Filter by user if student/prof (or show all if admin viewing global ledger)
    const matchesUser = currentRole === 'admin' ||
      tx.senderId === currentUser?.id ||
      tx.recipientId === currentUser?.id;

    const matchesCategory = txCategoryFilter === 'all' || tx.category === txCategoryFilter;
    const matchesType = txTypeFilter === 'all' ||
      (txTypeFilter === 'inflow' && tx.recipientId === currentUser?.id) ||
      (txTypeFilter === 'outflow' && tx.senderId === currentUser?.id);

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
      title: transferTitle,
      note: transferNote
    });

    if (success) {
      setTransferSuccess(true);
      setTransferAmount('');
      setTransferTitle('');
      setTransferNote('');
      setTimeout(() => setTransferSuccess(false), 5000);
    }
  };

  const handleBulkPayroll = async () => {
    playCoinSound();
    await payoutAllSalaries(parseInt(payrollAmount, 10), payrollPeriod);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* =========================================================================
          1. HEADER WITH VAULT BANNER
          ========================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            ᛟ Podziemia Granitowe Twierdzy Magii (TMD) ᛟ
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Kaupangr Skírnisbanki
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '650px', fontSize: '0.98rem' }}>
            Oficjalny Bank Północy i Skarbiec Twierdzy Magii Durmstrang (TMD). Przechowuj Skirniry, realizuj błyskawiczne przelewy runiczne, odbieraj stypendia oraz wypłaty profesorskie.
          </p>
        </div>

        {/* Global Wallet Pill */}
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '1.2rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            border: '1px solid var(--gold-ancient)',
            background: 'linear-gradient(135deg, rgba(25, 32, 45, 0.95) 0%, rgba(12, 15, 22, 0.98) 100%)',
            boxShadow: '0 0 25px rgba(197, 159, 78, 0.2)'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(197, 159, 78, 0.15)',
              border: '1px solid var(--gold-ancient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Coins size={26} color="var(--gold-ancient)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
              Stan Skrytki ({bankAccount?.vaultNumber || 'SKR-001'})
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#f7dca0', lineHeight: 1.1 }}>
              {currentBalance} ᛋ
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. NAVIGATION TABS
          ========================================================================= */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('vault')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'vault' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'vault' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'vault' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Building size={16} /> Karta Skrytki Bankowej
        </button>

        <button
          onClick={() => setActiveTab('transfer')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'transfer' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'transfer' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'transfer' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Send size={16} /> Przelew Skirnirów
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'ledger' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'ledger' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'ledger' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <History size={16} /> Księga Wpływów i Wydatków ({filteredTransactions.length})
        </button>

        {(currentRole === 'admin' || currentRole === 'professor') && (
          <button
            onClick={() => setActiveTab('payroll')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '6px',
              border: activeTab === 'payroll' ? '1px solid #d8b4fe' : '1px solid rgba(168, 85, 247, 0.3)',
              background: activeTab === 'payroll' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: '#d8b4fe',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginLeft: 'auto'
            }}
          >
            <Briefcase size={16} /> Wypłaty Profesorskie
          </button>
        )}
      </div>

      {/* =========================================================================
          3. TAB 1: VAULT CARD & SECURITY
          ========================================================================= */}
      {activeTab === 'vault' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.8rem' }}>
          {/* Main Vault Passport */}
          <div
            className="gothic-card runic-corners"
            style={{
              padding: '2.2rem',
              background: 'linear-gradient(135deg, rgba(16, 22, 32, 0.95) 0%, rgba(8, 12, 18, 0.98) 100%)',
              border: '1px solid var(--gold-ancient)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                  Świadectwo Depozytowe
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(46, 196, 182, 0.15)', border: '1px solid #2ec4b6', color: '#8cefe6', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  STATUS: AKTYWNY
                </span>
              </div>

              <h2 style={{ fontSize: '1.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
                {currentUser?.fullName || 'Adept Durmstrangu'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: userHouse ? userHouse.colors.secondary : 'var(--gold-ancient)', marginBottom: '1.4rem' }}>
                {bankAccount?.vaultTier || 'Skrytka Adepta Kręgu IV'} • {userHouse ? userHouse.name : 'Cytadela Durmstrang'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Numer Skrytki:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--gold-glow)', fontWeight: 700, marginTop: '0.15rem' }}>
                    {bankAccount?.vaultNumber || 'SKR-782-RAVN'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Oprocentowanie:</div>
                  <div style={{ fontSize: '0.95rem', color: '#8cefe6', fontWeight: 600, marginTop: '0.15rem' }}>
                    {bankAccount?.interestRate || '2.5% rocznie'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pieczęć Ochronna:</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.15rem' }}>
                    {bankAccount?.runeSeal || 'Pieczęć Algiz & Kenaz'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Strażnik Skarbca:</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.15rem' }}>
                    {bankAccount?.guardian || 'Górski Troll Granitowy'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem', display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => setActiveTab('transfer')}
                className="btn-durmstrang"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
              >
                <Send size={14} /> Wykonaj Przelew
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className="btn-durmstrang-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
              >
                <History size={14} /> Historia Transakcji
              </button>
            </div>
          </div>

          {/* Quick Stats & Security Vault Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div
              className="gothic-card"
              style={{
                padding: '1.6rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(46, 196, 182, 0.15)', border: '1px solid #2ec4b6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#2ec4b6" />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.2rem' }}>Nienaruszalność Depozytów</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  Zgodnie z Paktem 1294, żadna klątwa ani nakaz aresztowania nie może zamrozić Skirnirów w skrytkach Kaupangr bez zgody Rady Mistrzów.
                </p>
              </div>
            </div>

            <div
              className="gothic-card"
              style={{
                padding: '1.6rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={24} color="var(--gold-ancient)" />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.2rem' }}>Waluta Skirnirów (ᛋ)</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  Bita z czystego złota fiordowego z domieszką meteorytowego żelaza. Akceptowana na całym rynku Kaupangr oraz w rozliczeniach Katedr.
                </p>
              </div>
            </div>

            <div
              className="gothic-card"
              style={{
                padding: '1.6rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} color="#d8b4fe" />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.2rem' }}>Automatyczne Wynagrodzenia</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  Wszystkie wypłaty za opublikowane dzienniki lekcyjne i wygrane w Loterii Odyna trafiają bezpośrednio na Twoje konto w banku.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. TAB 2: MONEY TRANSFER WIZARD
          ========================================================================= */}
      {activeTab === 'transfer' && (
        <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <div
            className="gothic-card runic-corners"
            style={{
              padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(16, 22, 32, 0.96) 0%, rgba(8, 11, 18, 0.98) 100%)',
              border: '1px solid var(--gold-ancient)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', margin: '0 auto 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={26} color="var(--gold-glow)" />
              </div>
              <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>
                Przelew Skirnirów
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Przekaż fundusze innemu adeptowi, profesorowi lub zasil skarbiec swojego Zakonu.
              </p>
            </div>

            {transferSuccess && (
              <div style={{ background: 'rgba(46, 196, 182, 0.15)', border: '1px solid #2ec4b6', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#8cefe6' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Przelew został pomyślnie zrealizowany i opieczętowany w księdze bankowej!
                </span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {/* Recipient Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Wybierz Odbiorcę Przelewu:
                </label>
                <select
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', padding: '0.7rem 0.9rem', fontSize: '0.9rem', background: 'rgba(8, 12, 18, 0.9)' }}
                >
                  <option value="">-- Wybierz postać lub skarbiec --</option>
                  <optgroup label="🏰 Skarbce Zakonów & Twierdzy (TMD)">
                    <option value="cytadela-treasury">Skarbiec Główny Twierdzy Magii Durmstrang (TMD)</option>
                    <option value="house-treasury-reinhall">🦌 Skarbiec Zakonu Reinhall</option>
                    <option value="house-treasury-bjornhall">🐻 Skarbiec Zakonu Björnhall</option>
                    <option value="house-treasury-ravnheim">🐦 Skarbiec Zakonu Ravnheim</option>
                    <option value="house-treasury-otergard">🦦 Skarbiec Zakonu Otergard</option>
                  </optgroup>
                  <optgroup label="🧙 Adeptowie i Profesorowie">
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--gold-ancient)', fontWeight: 600 }}>
                    Kwota Przelewu (Skirniry):
                  </label>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
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
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[25, 50, 100, 200].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTransferAmount(Math.min(currentBalance, val).toString())}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: '#cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      {val} ᛋ
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTransferAmount(currentBalance.toString())}
                    style={{
                      padding: '0.25rem 0.6rem',
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
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Tytuł Przelewu:
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Zapłata za grimuar, Wsparcie badań nad runami"
                  value={transferTitle}
                  onChange={(e) => setTransferTitle(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.88rem' }}
                />
              </div>

              {/* Note / Message */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Wiadomość dołączona do Przelewu (Opcjonalnie):
                </label>
                <textarea
                  rows="3"
                  placeholder="Wpisz treść listu lub dedykacji..."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={!recipientId || !transferAmount || parseInt(transferAmount, 10) <= 0 || parseInt(transferAmount, 10) > currentBalance}
                className="btn-durmstrang"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                  opacity: (!recipientId || !transferAmount || parseInt(transferAmount, 10) <= 0 || parseInt(transferAmount, 10) > currentBalance) ? 0.5 : 1
                }}
              >
                <Send size={18} /> Pieczętuj i Przelej Skirniry
              </button>
            </form>
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
                  onClick={() => setTxCategoryFilter(cat.id)}
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

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
