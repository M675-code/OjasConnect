import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminEditUser(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState('');

    useEffect(()=>{ fetchUser(); }, [id]);

    const fetchUser = async () => {
        setLoading(true); setGlobalError('');
        try{
            const res = await axios.get(`${API_BASE}/api/users/${id}`);
            setUser(res.data);
        }catch(err){ setGlobalError('Failed to load user'); }
        setLoading(false);
    };

    if(loading) return <div>Loading...</div>;
    if(!user) return <div style={{color:'#c62828'}}>{globalError || 'User not found'}</div>;

    const handleChange = (k, v) => { setUser({...user, [k]: v}); setErrors(prev => { const p={...prev}; delete p[k]; return p; }); };

    const validate = () => {
        const e = {};
        if(!user.first_name || !user.first_name.trim()) e.first_name = 'First name required';
        if(!user.last_name || !user.last_name.trim()) e.last_name = 'Last name required';
        if(!user.email || !/^\S+@\S+\.\S+$/.test(user.email)) e.email = 'Valid email required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if(!validate()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE}/api/admin/users/${id}`, user, { headers: { Authorization: `Bearer ${token}` } });
            // After saving from Directory -> Edit, return to Directory
            navigate('/directory');
        } catch (err) {
            setGlobalError(err?.response?.data?.message || 'Failed to save');
        }
    };

    const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff' };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2>Edit User</h2>
            {globalError && <div style={{color:'#c62828'}}>{globalError}</div>}
            <label>First Name</label>
            <input style={{...inputStyle, borderColor: errors.first_name ? '#c62828' : inputStyle.border}} value={user.first_name||''} onChange={e=>handleChange('first_name', e.target.value)} />
            {errors.first_name && <div style={{color:'#c62828'}}>{errors.first_name}</div>}

            <label>Last Name</label>
            <input style={{...inputStyle, borderColor: errors.last_name ? '#c62828' : inputStyle.border}} value={user.last_name||''} onChange={e=>handleChange('last_name', e.target.value)} />
            {errors.last_name && <div style={{color:'#c62828'}}>{errors.last_name}</div>}

            <label>Email</label>
            <input style={{...inputStyle, borderColor: errors.email ? '#c62828' : inputStyle.border}} value={user.email||''} onChange={e=>handleChange('email', e.target.value)} />
            {errors.email && <div style={{color:'#c62828'}}>{errors.email}</div>}

            <label>Status</label>
            <select value={user.status||'active'} onChange={e=>handleChange('status', e.target.value)} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button onClick={() => navigate(-1)} style={{ padding: '10px 16px' }}>Cancel</button>
                <button onClick={handleSave} style={{ padding: '10px 16px', background: '#1976d2', color: '#fff', border: 'none' }}>Save</button>
            </div>
        </div>
    );
}
