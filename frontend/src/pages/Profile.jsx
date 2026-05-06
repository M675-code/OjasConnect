import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Heart, Baby, Briefcase, Mail, Phone, Calendar, MapPin, Building, Image as ImageIcon } from 'lucide-react';
import './Profile.css';

export default function Profile() {
    const { id } = useParams(); 
    const { user: loggedInUser } = useContext(AuthContext); 
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    const targetId = id || loggedInUser?.id;

    useEffect(() => {
        if (targetId) {
            // axios.get(`http://localhost:5000/api/users/${targetId}`)
            fetch(`${import.meta.env.VITE_API_URL}/api/users/me`)
                .then(res => { setProfileData(res.data); setLoading(false); })
                .catch(err => { console.error(err); setLoading(false); });
        }
    }, [targetId]);

    if (loading) return <div style={{ padding: '30px' }}>Loading profile...</div>;
    if (!profileData) return <div style={{ padding: '30px' }}>User not found.</div>;

    const isMySpace = !id || parseInt(id) === loggedInUser.id;
    const isMarried = profileData.marital_status?.toLowerCase() === 'married';

    return (
        <div className="profile-container">
            <h2 style={{ color: 'var(--primary-deep)', marginBottom: '30px', textAlign: 'center' }}>
                {isMySpace ? "My Space" : `${profileData.first_name}'s Profile`}
            </h2>

            {/* --- LEVEL 1: BASE USER DETAIL --- */}
            <div className="tree-level">
                <div className="ojas-profile-card root-card">
                    <div className="card-header root-header">
                        <div className="avatar-slot">
                            {profileData.profile_image ? <img src={profileData.profile_image} alt="User" /> : <User size={40} color="#fff" />}
                        </div>
                        <h3 className="card-title">{profileData.first_name} {profileData.last_name}</h3>
                    </div>
                    <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="data-row">
                            <span className="data-label">Gender / Status</span>
                            {(profileData.gender || 'N/A').toUpperCase()} / {(profileData.marital_status || 'N/A').toUpperCase()}
                        </div>
                        <div className="data-row">
                            <span className="data-label"><Calendar size={14}/> Date of Birth</span>
                            {profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="data-row">
                            <span className="data-label"><Mail size={14}/> Email</span>
                            {profileData.email || 'N/A'}
                        </div>
                        <div className="data-row">
                            <span className="data-label"><Phone size={14}/> Contact</span>
                            {profileData.contact_number || 'N/A'}
                        </div>
                        <div className="data-row" style={{ gridColumn: 'span 2' }}>
                            <span className="data-label"><MapPin size={14}/> Residential Address</span>
                            {profileData.residential_address || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* --- LEVEL 2: BRANCHES --- */}
                {/* Render branches when married (to show spouse and possible children) or when there are businesses/jobs to show for single users */}
                {(isMarried || profileData.businesses?.length > 0 || profileData.jobs?.length > 0) && (
                    <div className="tree-branches">
                        <div className="tree-line-horizontal"></div>

                        {/* SPOUSE BRANCH (UPDATE: Now always shows if marital_status is 'married') */}
                        {isMarried && (
                            <div className="tree-node">
                                <div className="ojas-profile-card">
                                    <div className="card-header gold spouse-header">
                                        <div className="avatar-slot small">
                                            {profileData.spouse?.image_url ? <img src={profileData.spouse.image_url} alt="Spouse" /> : <Heart size={24} color="#fff" />}
                                        </div>
                                        <h3 className="card-title">Spouse</h3>
                                    </div>
                                    <div className="card-body">
                                        {profileData.spouse && profileData.spouse.first_name ? (
                                            <>
                                                <div className="data-row"><span className="data-label">Name</span><strong>{profileData.spouse.first_name} {profileData.spouse.last_name}</strong></div>
                                                {profileData.spouse.dob && <div className="data-row"><span className="data-label">DOB</span>{new Date(profileData.spouse.dob).toLocaleDateString()}</div>}
                                                <div className="data-row"><span className="data-label">Occupation</span>{(profileData.spouse.occupation_type || 'N/A').toUpperCase()}</div>
                                            </>
                                        ) : (
                                            <p style={{color: '#888', fontStyle: 'italic', fontSize: '14px'}}>Spouse details pending.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KIDS BRANCH: show only for married users who have added children */}
                        {isMarried && profileData.kids?.length > 0 && (
                            <div className="tree-node">
                                <div className="ojas-profile-card">
                                    <div className="card-header orange kid-header">
                                        <div className="avatar-slot small">
                                             <Baby size={24} color="#fff" />
                                        </div>
                                        <h3 className="card-title">Children ({profileData.kids.length})</h3>
                                    </div>
                                    <div className="card-body">
                                        {profileData.kids.map(kid => (
                                            <div key={kid.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                                <div className="data-row" style={{ marginBottom: '4px' }}>
                                                    <strong>{kid.first_name} {kid.last_name}</strong> ({kid.relationship})
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#666' }}>{kid.details}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EMPLOYMENT BRANCH */}
                        {profileData.jobs?.length > 0 && (
                            <div className="tree-node">
                                <div className="ojas-profile-card">
                                    <div className="card-header" style={{ backgroundColor: '#2196F3' }}>
                                        <Building size={20} />
                                        <h3 className="card-title">Employment</h3>
                                    </div>
                                    <div className="card-body">
                                        {profileData.jobs.map(job => (
                                            <div key={job.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                                <div className="data-row" style={{ marginBottom: '4px' }}>
                                                    <strong style={{ color: '#2196F3' }}>{job.employer_name}</strong>
                                                </div>
                                                <div className="data-row" style={{ marginBottom: '4px' }}>
                                                    <span className="data-label">Designation</span> {job.job_title}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BUSINESS BRANCH */}
                        {profileData.businesses?.length > 0 && (
                            <div className="tree-node">
                                <div className="ojas-profile-card">
                                    <div className="card-header">
                                        <Briefcase size={20} />
                                        <h3 className="card-title">Businesses</h3>
                                    </div>
                                    <div className="card-body">
                                        {profileData.businesses.map(biz => (
                                            <div key={biz.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                                <div className="data-row" style={{ marginBottom: '4px' }}>
                                                    <strong style={{ color: 'var(--primary-deep)' }}>{biz.business_name}</strong>
                                                    {biz.dba_name && <span style={{fontSize:'12px', color:'#888'}}> (DBA: {biz.dba_name})</span>}
                                                </div>
                                                <div className="data-row" style={{ marginBottom: '4px' }}>
                                                    <span className="data-label">{biz.business_structure} • {biz.industry}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}