import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Phone, Briefcase, Mail } from 'lucide-react';
import './Directory.css'; 

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function Directory() {
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [hasMore, setHasMore] = useState(false);
    // default to sort by last name for predictable directory ordering
    const [sortBy, setSortBy] = useState('lastName');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'deactivate' | 'restore'
    const [modalUserId, setModalUserId] = useState(null);
    const [modalUserName, setModalUserName] = useState('');
    const [modalReason, setModalReason] = useState('');
    const [modalError, setModalError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const loaderRef = useRef(null);

    // Determine current user role from JWT stored in localStorage (best-effort, no validation)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let currentUser = null;
    try {
        if (token) {
            const payload = token.split('.')[1];
            const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            currentUser = json;
        }
    } catch (e) {
        currentUser = null;
    }
    const isAdmin = currentUser && currentUser.role === 'admin';

    async function fetchDirectory(p = page) {
        setLoading(true);
        setActionError(null);
        try {
            const res = await axios.get(`${API_BASE}/api/directory`, { params: { search, status: statusFilter, industry: '', page: p, size, sort: sortBy } });
            const list = (res.data && (res.data.data || res.data)) || [];
            if (Array.isArray(list)) {
                if (p > 1) {
                    // append for subsequent pages
                    setMembers(prev => [...prev, ...list]);
                } else {
                    setMembers(list);
                }
                setHasMore(list.length === size);
            } else {
                setMembers([]);
                setHasMore(false);
            }
        } catch (err) {
            console.error('Failed to fetch directory', err);
            setMembers([]);
            setActionError('Failed to load directory');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { setPage(1); setMembers([]); fetchDirectory(1); }, [search, statusFilter, sortBy]);
    useEffect(() => { fetchDirectory(page); }, [page]);

    // Infinite scroll using IntersectionObserver on loaderRef
    useEffect(() => {
        if (!loaderRef.current) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasMore && !loading) {
                    setPage(p => p + 1);
                }
            });
        }, { root: null, rootMargin: '200px', threshold: 0.1 });
        obs.observe(loaderRef.current);
        return () => obs.disconnect();
    }, [loaderRef.current, hasMore, loading]);

    const highlightText = (text, query) => {
        if (!query || !text) return text;
        try {
            const q = String(query).trim();
            if (!q) return text;
            const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
            const parts = String(text).split(re);
            return parts.map((part, i) => re.test(part) ? <mark key={i} style={{ background: 'yellow', padding: '0' }}>{part}</mark> : <span key={i}>{part}</span>);
        } catch (e) {
            return text;
        }
    };

    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // Open the confirmation modal for admin actions
    const openModal = (action, id, name) => {
        setModalAction(action);
        setModalUserId(id);
        setModalUserName(name || '');
        setModalReason('');
        setModalError(null);
        setSubmitting(false);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalAction(null);
        setModalUserId(null);
        setModalUserName('');
        setModalReason('');
        setModalError(null);
        setSubmitting(false);
    };

    const submitModal = async () => {
        if (!modalReason || modalReason.trim().length < 3) {
            setModalError('Please provide a short reason (at least 3 characters).');
            return;
        }
        setSubmitting(true);
        setModalError(null);
        try {
            if (modalAction === 'deactivate') {
                // axios.delete supports a request body via the `data` option
                await axios.delete(`${API_BASE}/api/admin/users/${modalUserId}`, { headers: authHeader, data: { reason: modalReason } });
            } else if (modalAction === 'restore') {
                await axios.post(`${API_BASE}/api/admin/users/${modalUserId}/restore`, { reason: modalReason }, { headers: authHeader });
            }
            await fetchDirectory();
            closeModal();
        } catch (err) {
            console.error('Action failed', err);
            setModalError(err?.response?.data?.message || 'Action failed');
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--text-dark)', marginBottom: '20px' }}>Member Directory</h2>
            
            <div className="ojas-card" style={{ marginBottom: '30px', display: 'flex', gap: '15px', padding: '15px' }}>
                <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', border: '1px solid #ddd', padding: '10px 15px', borderRadius: '8px', background: '#fdfdfd' }}>
                    <Search size={20} color="var(--primary-main)" style={{ marginRight: '10px' }}/>
                    <input 
                        type="text" 
                        placeholder="Search First Name, Surname, or Business..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent', fontSize: '15px' }}
                    />
                </div>
                <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: '#fdfdfd' }}>
                    <option value="">All Members</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Members</option>
                </select>
                <select onChange={(e) => setSortBy(e.target.value)} value={sortBy} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: '#fdfdfd' }}>
                    <option value="lastName">Sort: Last name</option>
                    <option value="firstName">Sort: First name</option>
                    <option value="createdAt">Sort: Created</option>
                    <option value="updatedAt">Sort: Updated</option>
                </select>
            </div>

            {actionError && <div style={{ marginBottom: 12, color: '#c62828' }}>{actionError}</div>}

            {/* FIX: A responsive grid layout for the directory cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {loading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading members...
                    </div>
                )}

                {members.map(m => (
                    <div key={m.id} className="ojas-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
                                    <Link to={`/user/${m.id}`} style={{ color: 'var(--primary-deep)', textDecoration: 'none' }}>
                                        {highlightText(m.full_name || `${m.first_name || 'Unknown'} ${m.last_name || 'User'}`, search)}
                                    </Link>
                                </h3>
                                {/* Small Badge for Active/Past */}
                                <span style={{ 
                                    fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', 
                                    backgroundColor: m.status === 'active' ? '#E8F5E9' : (m.status === 'inactive' ? '#FFF3E0' : (m.status === 'suspended' ? '#FFEBEE' : (m.status === 'invited' ? '#E3F2FD' : '#BDBDBD'))), 
                                    color: m.status === 'active' ? '#2E7D32' : (m.status === 'inactive' ? '#EF6C00' : (m.status === 'suspended' ? '#C62828' : (m.status === 'invited' ? '#1976D2' : '#424242'))) 
                                }}>
                                    {(m.status || 'active').toUpperCase()}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* Admin actions */}
                                {isAdmin && (
                                    <>
                                        <Link to={`/admin/users/${m.id}`} style={{ fontSize: 14, padding: '6px 8px', borderRadius: 6, background: '#1976d2', color: '#fff', textDecoration: 'none' }}>Edit</Link>
                                        {m.status !== 'deleted' ? (
                                            m.status !== 'inactive' ? (
                                                <button
                                                    title="Hide from Directory"
                                                    aria-label={`Deactivate ${m.full_name || `${m.first_name || ''} ${m.last_name || ''}`}`}
                                                    onClick={() => openModal('deactivate', m.id, m.full_name || `${m.first_name || ''} ${m.last_name || ''}`)}
                                                    style={{ padding: '6px 8px', borderRadius: 6, background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer' }}
                                                >
                                                    Deactivate
                                                </button>
                                             ) : (
                                                <button
                                                    title="Allow access again"
                                                    aria-label={`Activate ${m.full_name || `${m.first_name || ''} ${m.last_name || ''}`}`}
                                                    onClick={() => openModal('restore', m.id, m.full_name || `${m.first_name || ''} ${m.last_name || ''}`)}
                                                    style={{ padding: '6px 8px', borderRadius: 6, background: '#2e7d32', color: '#fff', border: 'none', cursor: 'pointer' }}
                                                >
                                                    Activate
                                                </button>
                                             )
                                         ) : (
                                             <span style={{ padding: '6px 8px', borderRadius: 6, background: '#999', color: '#fff' }}>Removed</span>
                                         )}
                                    </>
                                )}

                                {/* Normal user view action */}
                                {!isAdmin && (
                                    <Link to={`/user/${m.id}`} style={{ fontSize: 14, padding: '6px 8px', borderRadius: 6, background: '#e0e0e0', color: '#111', textDecoration: 'none' }}>View</Link>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)', fontSize: '14px' }}>
                                <Mail size={16} color="var(--text-muted)" /> {highlightText(m.email || m.personal_email || 'No email provided', search)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)', fontSize: '14px' }}>
                                <Phone size={16} color="var(--text-muted)" /> {highlightText(m.contact_number || 'No contact provided', search)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-dark)', fontSize: '14px' }}>
                                <Briefcase size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} /> 
                                <div>
                                    <strong>{highlightText(m.business_name || m.employer_name || 'No Business Listed', search)}</strong>
                                    {m.industry && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{highlightText(m.industry, search)}</div>}
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
                
                {!loading && members.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No members found matching your search.
                    </div>
                )}
            </div>
            
            {/* Action modal for admin confirm + reason */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                    <div role="dialog" aria-modal="true" style={{ width: 520, maxWidth: '94%', background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0 }}>{modalAction === 'deactivate' ? 'Deactivate member' : 'Reinstate member'}</h3>
                        <div style={{ marginBottom: 10, color: 'var(--text-muted)' }}>
                            {modalAction === 'deactivate' ? (
                                <span>You're about to hide <strong>{modalUserName || 'this member'}</strong> from the directory. Please provide a short reason to keep an audit trail.</span>
                            ) : (
                                <span>You're about to reinstate <strong>{modalUserName || 'this member'}</strong>. Please provide a short reason for the audit log.</span>
                            )}
                        </div>
                        <textarea value={modalReason} onChange={(e) => setModalReason(e.target.value)} placeholder="Short reason (required)" style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }} maxLength={1000} />
                        {modalError && <div style={{ color: '#c62828', marginTop: 8 }}>{modalError}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <button onClick={closeModal} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }} disabled={submitting}>Cancel</button>
                            <button onClick={submitModal} style={{ padding: '8px 12px', borderRadius: 6, background: modalAction === 'deactivate' ? '#c62828' : '#2e7d32', color: '#fff', border: 'none', cursor: 'pointer' }} disabled={submitting}>{submitting ? 'Please wait...' : (modalAction === 'deactivate' ? 'Confirm Deactivate' : 'Confirm Reinstate')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
                <button onClick={() => { if (page > 1) { setPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} disabled={page === 1 || loading} style={{ padding: '8px 12px', borderRadius: 6 }}>Prev</button>
                <div style={{ alignSelf: 'center' }}>Page {page}</div>
                <button onClick={() => { if (hasMore) setPage(prev => prev + 1); }} disabled={!hasMore || loading} style={{ padding: '8px 12px', borderRadius: 6 }}>Next</button>
            </div>
            
            {/* Loader sentinel for infinite scroll (keeps in DOM) */}
            <div ref={loaderRef} style={{ height: 1 }} aria-hidden="true" />
        </div>
    );
}