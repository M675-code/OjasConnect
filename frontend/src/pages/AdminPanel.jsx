import { useState } from 'react';
import axios from 'axios';
import './AdminPanel.css'; // UPDATE: Added stylesheet for clean micro-buttons

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AdminPanel() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [errors, setErrors] = useState([]);
    const [successMsg, setSuccessMsg] = useState(null);

    // Primary User States
    const [userData, setUserData] = useState({ first_name: '', last_name: '', email: '', contact_number: '', residential_address: '', gender: 'male', marital_status: 'single', role: 'user', dob: '', anniversary: '', occupation: '' });
    const [userOtherOccupation, setUserOtherOccupation] = useState('');
    
    // Spouse States
    const [spouseData, setSpouseData] = useState({ first_name: '', last_name: '', dob: '', anniversary_date: '', occupation_type: 'housewife', contact_number: '', email: '' });
    
    // Complex States
    const [kidsData, setKidsData] = useState([{ first_name: '', last_name: '', dob: '', relationship: 'son', current_status: 'school', details: '' }]);
    const [jobData, setJobData] = useState([{ employer_name: '', job_title: '', work_address: '' }]);
    const [businessData, setBusinessData] = useState([{ business_name: '', dba_name: '', business_structure: '', tax_id: '', industry: '', business_address: '', description: '' }]);

    // New: per-field inline errors and helper styles
    const [fieldErrors, setFieldErrors] = useState({});
    // ensure first invalid field is focused when validation fails
    const focusFirstInvalid = () => {
        try {
            const el = document.querySelector('[data-error="true"]');
            if (el && typeof el.focus === 'function') el.focus();
        } catch (e) {}
    };
    const errorStyle = { color: '#c62828', fontSize: '13px', marginTop: '6px' };
    const requiredMark = (show = true) => (show ? <span style={{ color: '#c62828', marginLeft: 6 }}>*</span> : null);

    const setErrorsFor = (map) => setFieldErrors(map || {});

    // Handlers
    const handleAddKid = () => { if (kidsData.length < 6) setKidsData([...kidsData, { first_name: '', last_name: '', dob: '', relationship: 'son', current_status: 'school', details: '' }]); };
    const handleRemoveKid = (index) => { setKidsData(kidsData.filter((_, i) => i !== index)); };
    
    const handleAddBusiness = () => setBusinessData([...businessData, { business_name: '', dba_name: '', business_structure: '', tax_id: '', industry: '', business_address: '', description: '' }]);
    const handleRemoveBusiness = (index) => { setBusinessData(businessData.filter((_, i) => i !== index)); };

    // Validation helpers
    const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s || '');
    const isPhone = (s) => !s || /^\+?[0-9\-\s]{6,20}$/.test(s);

    function validateAll() {
        const errs = [];
        if (!userData.first_name || !userData.first_name.trim()) errs.push('User first name is required');
        if (!userData.last_name || !userData.last_name.trim()) errs.push('User last name is required');
        if (!userData.email || !isEmail(userData.email)) errs.push('Valid user email is required');
        if (!isPhone(userData.contact_number)) errs.push('Contact number is invalid');

        // Marital status vs spouse
        const spouseProvided = Object.values(spouseData).some(v => v && String(v).trim().length > 0);
        if (userData.marital_status !== 'married' && spouseProvided) {
            errs.push('Marital status is not married but spouse data provided. Change marital status or remove spouse data.');
        }
        // Kids validation
        for (let i=0;i<kidsData.length;i++){
            const k = kidsData[i];
            if (!k.first_name || !k.first_name.trim()) errs.push(`Kid #${i+1}: first name is required`);
            if (!k.relationship) errs.push(`Kid #${i+1}: relationship is required`);
        }
        // Businesses & jobs minimal checks
        businessData.forEach((b, idx) => { if (b.business_name && b.business_name.trim().length < 2) errs.push(`Business #${idx+1}: name too short`); });
        jobData.forEach((j, idx) => { if (j.employer_name && j.employer_name.trim().length < 2) errs.push(`Job #${idx+1}: employer name too short`); });

        return errs;
    }

    const validateStep = (n) => {
        const errs = {};
        if (n === 1) {
            if (!userData.first_name || !userData.first_name.trim()) errs['user.first_name'] = 'First name is required';
            if (!userData.last_name || !userData.last_name.trim()) errs['user.last_name'] = 'Last name is required';
            if (!userData.email || !isEmail(userData.email)) errs['user.email'] = 'Valid email is required';
            if (userData.contact_number && !isPhone(userData.contact_number)) errs['user.contact_number'] = 'Contact number is invalid';
        }

        if (n === 2) {
            // Only enforce spouse fields when user marked married OR spouse fields filled
            const spouseProvided = Object.values(spouseData).some(v => v && String(v).trim().length > 0);
            if (userData.marital_status === 'married' || spouseProvided) {
                if (!spouseData.first_name || !spouseData.first_name.trim()) errs['spouse.first_name'] = 'Spouse first name is required';
                if (!spouseData.last_name || !spouseData.last_name.trim()) errs['spouse.last_name'] = 'Spouse last name is required';
            }
        }

        if (n === 3) {
            for (let i = 0; i < kidsData.length; i++) {
                const k = kidsData[i];
                if (!k.first_name || !k.first_name.trim()) errs[`kids.${i}.first_name`] = `Child #${i + 1}: first name is required`;
                if (!k.relationship) errs[`kids.${i}.relationship`] = `Child #${i + 1}: relationship is required`;
            }
        }

        // You can add additional step validations (4,5) if needed

        setErrorsFor(errs);
        if (Object.keys(errs).length > 0) {
            // allow React to render error markers then focus
            setTimeout(() => focusFirstInvalid(), 10);
        }
        return Object.keys(errs).length === 0;
    }

    const handleNext = (n) => {
        if (validateStep(n)) {
            setStep(n + 1);
            // clear step-specific errors after moving on
        } else {
            // scroll to top so user can see global errors and focused field
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        setErrors([]);
        setSuccessMsg(null);
        const errs = validateAll();
        if (errs.length > 0) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/admin/users`, { userData, spouseData, kidsData, jobData, businessData }, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
            const temp = res.data.tempPassword || '***';
            setSuccessMsg(`User created successfully. Temporary password: ${temp} (share securely)`);
            setErrors([]);
            // reset form optionally
        } catch (err) { 
            if (err.response && err.response.data && err.response.data.message) setErrors([err.response.data.message]);
            else setErrors([err.message || 'Unknown error']);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setLoading(false);
    };

    const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa' };
    const btnStyle = { padding: '12px 24px', backgroundColor: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

    // Common Renders
    const renderJobDetails = (index) => (
        <div className="dynamic-subform">
            <h4 style={{marginBottom: '10px', fontSize: '14px', color: 'var(--primary-deep)'}}>Employment Details</h4>
            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Employer Name" value={jobData[index]?.employer_name || ''} onChange={e => { const newJob = [...jobData]; if(!newJob[index]) newJob[index] = {}; newJob[index].employer_name = e.target.value; setJobData(newJob); }} />
            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Job Title / Designation" value={jobData[index]?.job_title || ''} onChange={e => { const newJob = [...jobData]; if(!newJob[index]) newJob[index] = {}; newJob[index].job_title = e.target.value; setJobData(newJob); }} />
            <textarea style={{...inputStyle, background: '#fff'}} placeholder="Work Address" value={jobData[index]?.work_address || ''} onChange={e => { const newJob = [...jobData]; if(!newJob[index]) newJob[index] = {}; newJob[index].work_address = e.target.value; setJobData(newJob); }} />
        </div>
    );

    return (
        <div className="ojas-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--primary-deep)', borderBottom: '2px solid var(--primary-light)', paddingBottom: '10px' }}>
                Admin Panel - Member Onboarding
            </h2>

            {errors.length > 0 && (
                <div style={{ background: '#ffe6e6', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                    <strong>Errors:</strong>
                    <ul>
                        {errors.map((e,i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}
            {successMsg && (
                <div style={{ background: '#e6ffed', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                    {successMsg}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: step >= num ? 'var(--primary-main)' : '#eee', transition: '0.3s' }} />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div />
                <button onClick={() => setShowRules(!showRules)} style={{ ...btnStyle, backgroundColor: '#666', padding: '8px 12px', fontSize: '14px' }}>{showRules ? 'Hide' : 'Show'} Relationship Rules</button>
            </div>

            {showRules && (
                <div style={{ background: '#f5f7ff', padding: '12px', borderRadius: '6px', marginBottom: '14px' }}>
                    <h4>Relationship Rules (UI guidance)</h4>
                    <ul>
                        <li>If a user is not marked as Married, spouse fields must be empty.</li>
                        <li>Kids can be added regardless of marital status, but relationship (son/daughter/other) is required.</li>
                        <li>Changing marital status from Married to Single requires admin confirmation to remove spouse record.</li>
                        <li>Spouse is stored as dependent record (not a separate member). To make spouse a full member, create separate user and link manually.</li>
                    </ul>
                </div>
            )}

            {/* STEP 1: USER DETAILS */}
            {step === 1 && (
                <div>
                    <h3>Step 1: User Details</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <input data-field="user.first_name" data-error={!!fieldErrors['user.first_name']} style={{...inputStyle, borderColor: fieldErrors['user.first_name'] ? '#c62828' : inputStyle.border}} type="text" placeholder={"First Name"} value={userData.first_name} onChange={e => { setUserData({...userData, first_name: e.target.value}); setFieldErrors(prev => { const p = {...prev}; delete p['user.first_name']; return p; }); }} />
                            {requiredMark()} 
                            {fieldErrors['user.first_name'] && <div style={errorStyle}>{fieldErrors['user.first_name']}</div>}
                        </div>
                        <div style={{ flex: 1 }}>
                            <input data-field="user.last_name" data-error={!!fieldErrors['user.last_name']} style={{...inputStyle, borderColor: fieldErrors['user.last_name'] ? '#c62828' : inputStyle.border}} type="text" placeholder={"Last Name"} value={userData.last_name} onChange={e => { setUserData({...userData, last_name: e.target.value}); setFieldErrors(prev => { const p = {...prev}; delete p['user.last_name']; return p; }); }} />
                            {requiredMark()}
                            {fieldErrors['user.last_name'] && <div style={errorStyle}>{fieldErrors['user.last_name']}</div>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <input data-field="user.email" data-error={!!fieldErrors['user.email']} style={{...inputStyle, borderColor: fieldErrors['user.email'] ? '#c62828' : inputStyle.border}} type="email" placeholder={"Personal Email"} value={userData.email} onChange={e => { setUserData({...userData, email: e.target.value}); setFieldErrors(prev => { const p = {...prev}; delete p['user.email']; return p; }); }} />
                            {requiredMark()}
                            {fieldErrors['user.email'] && <div style={errorStyle}>{fieldErrors['user.email']}</div>}
                        </div>
                        <div style={{ flex: 1 }}>
                            <input data-field="user.contact_number" data-error={!!fieldErrors['user.contact_number']} style={{...inputStyle, borderColor: fieldErrors['user.contact_number'] ? '#c62828' : inputStyle.border}} type="tel" placeholder={"Primary Phone"} value={userData.contact_number} onChange={e => { setUserData({...userData, contact_number: e.target.value}); setFieldErrors(prev => { const p = {...prev}; delete p['user.contact_number']; return p; }); }} />
                            {fieldErrors['user.contact_number'] && <div style={errorStyle}>{fieldErrors['user.contact_number']}</div>}
                        </div>
                    </div>
                    <textarea style={inputStyle} placeholder="Current Residential Address" value={userData.residential_address} onChange={e => setUserData({...userData, residential_address: e.target.value})} />
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select style={inputStyle} value={userData.gender} onChange={e => setUserData({...userData, gender: e.target.value})}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        <select style={inputStyle} value={userData.marital_status} onChange={e => setUserData({...userData, marital_status: e.target.value})}>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                        </select>
                    </div>

                    {/* Inside Step 1 of AdminPanel.jsx, replace the existing Date of Birth logic with this: */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{fontSize:'12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px'}}>Date of Birth</label>
                            <input style={{...inputStyle, marginBottom: 0}} type="date" value={userData.dob} onChange={e => setUserData({...userData, dob: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{fontSize:'12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px'}}>Anniversary Date</label>
                            <input style={{...inputStyle, marginBottom: 0}} type="date" value={userData.anniversary} onChange={e => setUserData({...userData, anniversary: e.target.value})} />
                        </div>
                    </div>
                    

                    <label style={{fontSize:'12px'}}>Occupation Status</label>
                    <select style={inputStyle} value={userData.occupation} onChange={e => setUserData({...userData, occupation: e.target.value})}>
                        <option value="">Select Occupation</option>
                        <option value="job">Job</option>
                        <option value="business">Business</option>
                        <option value="other">Other</option>
                    </select>

                    {userData.occupation === 'job' && renderJobDetails(0)}
                    {userData.occupation === 'business' && (
                        <div className="dynamic-subform">
                            <h4 style={{marginBottom: '10px', fontSize: '14px', color: 'var(--primary-deep)'}}>Business Details</h4>
                            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Business Name" value={businessData[0]?.business_name || ''} onChange={e => { const newBiz = [...businessData]; newBiz[0].business_name = e.target.value; setBusinessData(newBiz); }} />
                            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Industry / Sector" value={businessData[0]?.industry || ''} onChange={e => { const newBiz = [...businessData]; newBiz[0].industry = e.target.value; setBusinessData(newBiz); }} />
                            <textarea style={{...inputStyle, background: '#fff'}} placeholder="Business Address" value={businessData[0]?.business_address || ''} onChange={e => { const newBiz = [...businessData]; newBiz[0].business_address = e.target.value; setBusinessData(newBiz); }} />
                        </div>
                    )}
                    {userData.occupation === 'other' && (
                         <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Please specify occupation details..." value={userOtherOccupation} onChange={e => setUserOtherOccupation(e.target.value)} />
                    )}

                    <button onClick={() => handleNext(1)} style={{...btnStyle, width: '100%', marginTop: '10px'}}>Next: Spouse Details</button>
                </div>
            )}

            {/* STEP 2: SPOUSE DETAILS */}
            {step === 2 && (
                <div>
                    <h3>Step 2: Spouse Details</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={inputStyle} type="text" placeholder="First Name" value={spouseData.first_name} onChange={e => setSpouseData({...spouseData, first_name: e.target.value})} />
                        <input style={inputStyle} type="text" placeholder="Last Name" value={spouseData.last_name} onChange={e => setSpouseData({...spouseData, last_name: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={inputStyle} type="email" placeholder="Spouse Email (if different)" value={spouseData.email} onChange={e => setSpouseData({...spouseData, email: e.target.value})} />
                        <input style={inputStyle} type="tel" placeholder="Spouse Phone" value={spouseData.contact_number} onChange={e => setSpouseData({...spouseData, contact_number: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><label style={{fontSize:'12px'}}>Date of Birth</label><input style={inputStyle} type="date" value={spouseData.dob} onChange={e => setSpouseData({...spouseData, dob: e.target.value})} /></div>
                        <div style={{ flex: 1 }}><label style={{fontSize:'12px'}}>Anniversary Date</label><input style={inputStyle} type="date" value={spouseData.anniversary_date} onChange={e => setSpouseData({...spouseData, anniversary_date: e.target.value})} /></div>
                    </div>
                    
                    <label style={{fontSize:'12px'}}>Occupation Status</label>
                    <select style={inputStyle} value={spouseData.occupation_type} onChange={e => setSpouseData({...spouseData, occupation_type: e.target.value})}>
                        <option value="housewife">Housewife</option>
                        <option value="job">Job</option>
                        <option value="business">Business</option>
                    </select>
                    
                    {spouseData.occupation_type === 'job' && renderJobDetails(1)}
                    {spouseData.occupation_type === 'business' && (
                        <div className="dynamic-subform">
                            <h4 style={{marginBottom: '10px', fontSize: '14px', color: 'var(--primary-deep)'}}>Spouse Business Details</h4>
                            {businessData.slice(1).map((biz, idx) => {
                                const realIdx = idx + 1; // Offset by 1 since primary user uses index 0
                                return (
                                    <div key={realIdx} className="repeated-block">
                                        <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Business Name" value={biz.business_name} onChange={e => { const newBiz = [...businessData]; newBiz[realIdx].business_name = e.target.value; setBusinessData(newBiz); }} />
                                        <div className="btn-row">
                                            <button onClick={handleAddBusiness} className="ctrl-btn plus">+</button>
                                            <button onClick={() => handleRemoveBusiness(realIdx)} className="ctrl-btn minus">-</button>
                                        </div>
                                    </div>
                                )
                            })}
                            {businessData.length === 1 && (
                                <button onClick={handleAddBusiness} className="add-start-btn">+ Add Business</button>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button onClick={() => setStep(1)} style={{...btnStyle, backgroundColor: '#888'}}>Back</button>
                        <button onClick={() => handleNext(2)} style={btnStyle}>Next: Kids Details</button>
                    </div>
                </div>
            )}

            {/* STEP 3: KIDS DETAILS */}
            {step === 3 && (
                <div>
                    <h3>Step 3: Kid Details</h3>
                    {kidsData.map((kid, index) => (
                        <div key={index} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px', background: '#fafafa', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="First Name" value={kid.first_name} onChange={e => { const newKids = [...kidsData]; newKids[index].first_name = e.target.value; setKidsData(newKids); }} />
                                <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Last Name" value={kid.last_name} onChange={e => { const newKids = [...kidsData]; newKids[index].last_name = e.target.value; setKidsData(newKids); }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{fontSize:'12px'}}>Date of Birth</label><input style={{...inputStyle, background: '#fff'}} type="date" value={kid.dob} onChange={e => { const newKids = [...kidsData]; newKids[index].dob = e.target.value; setKidsData(newKids); }} /></div>
                                <div style={{ flex: 1 }}><label style={{fontSize:'12px'}}>Relationship</label><select style={{...inputStyle, background: '#fff'}} value={kid.relationship} onChange={e => { const newKids = [...kidsData]; newKids[index].relationship = e.target.value; setKidsData(newKids); }}><option value="son">Son</option><option value="daughter">Daughter</option><option value="other">Other</option></select></div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select style={{...inputStyle, background: '#fff', flex: 0.5}} value={kid.current_status} onChange={e => { const newKids = [...kidsData]; newKids[index].current_status = e.target.value; setKidsData(newKids); }}>
                                    <option value="school">School</option>
                                    <option value="college">College</option>
                                    <option value="job">Job</option>
                                </select>
                                <input style={{...inputStyle, background: '#fff', flex: 1}} type="text" placeholder="Details (Grade, Degree, Company)" value={kid.details} onChange={e => { const newKids = [...kidsData]; newKids[index].details = e.target.value; setKidsData(newKids); }} />
                            </div>

                            <div className="btn-row" style={{justifyContent: 'flex-end'}}>
                                {kidsData.length < 6 && index === kidsData.length - 1 && <button onClick={handleAddKid} className="ctrl-btn plus">+</button>}
                                {kidsData.length > 1 && <button onClick={() => handleRemoveKid(index)} className="ctrl-btn minus">-</button>}
                            </div>
                        </div>
                    ))}
                    
                    {kidsData.length === 0 && (
                         <button onClick={handleAddKid} className="add-start-btn">+ Add Child</button>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button onClick={() => setStep(2)} style={{...btnStyle, backgroundColor: '#888'}}>Back</button>
                        <button onClick={() => handleNext(3)} style={btnStyle}>Next: Employment</button>
                    </div>
                </div>
            )}

            {/* STEP 4: EMPLOYMENT (Additional details if needed) */}
            {step === 4 && (
                <div>
                    <h3>Step 4: Employment Details</h3>
                    {jobData.map((job, index) => (
                        <div key={index} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px', background: '#fafafa' }}>
                            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Employer Name" value={job.employer_name} onChange={e => { const newJob = [...jobData]; newJob[index].employer_name = e.target.value; setJobData(newJob); }} />
                            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Job Title / Designation" value={job.job_title} onChange={e => { const newJob = [...jobData]; newJob[index].job_title = e.target.value; setJobData(newJob); }} />
                            <textarea style={{...inputStyle, background: '#fff'}} placeholder="Work Address" value={job.work_address} onChange={e => { const newJob = [...jobData]; newJob[index].work_address = e.target.value; setJobData(newJob); }} />
                        </div>
                    ))}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button onClick={() => setStep(3)} style={{...btnStyle, backgroundColor: '#888'}}>Back</button>
                        <button onClick={() => handleNext(4)} style={btnStyle}>Next: Business</button>
                    </div>
                </div>
            )}

            {/* STEP 5: BUSINESS */}
            {step === 5 && (
                <div>
                    <h3>Step 5: Business Details</h3>
                    {businessData.map((biz, index) => (
                        <div key={index} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px', background: '#fafafa' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Business Name" value={biz.business_name} onChange={e => { const newBiz = [...businessData]; newBiz[index].business_name = e.target.value; setBusinessData(newBiz); }} />
                                <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="DBA Name" value={biz.dba_name} onChange={e => { const newBiz = [...businessData]; newBiz[index].dba_name = e.target.value; setBusinessData(newBiz); }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Structure (LLC, S-Corp)" value={biz.business_structure} onChange={e => { const newBiz = [...businessData]; newBiz[index].business_structure = e.target.value; setBusinessData(newBiz); }} />
                                <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Tax ID (EIN/VAT)" value={biz.tax_id} onChange={e => { const newBiz = [...businessData]; newBiz[index].tax_id = e.target.value; setBusinessData(newBiz); }} />
                            </div>
                            <input style={{...inputStyle, background: '#fff'}} type="text" placeholder="Industry / Sector" value={biz.industry} onChange={e => { const newBiz = [...businessData]; newBiz[index].industry = e.target.value; setBusinessData(newBiz); }} />
                            <textarea style={{...inputStyle, background: '#fff'}} placeholder="Business Address (Physical & Registered)" value={biz.business_address} onChange={e => { const newBiz = [...businessData]; newBiz[index].business_address = e.target.value; setBusinessData(newBiz); }} />
                        </div>
                    ))}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button onClick={() => setStep(4)} style={{...btnStyle, backgroundColor: '#888'}}>Back</button>
                        <button onClick={handleSubmit} disabled={loading} style={{...btnStyle, backgroundColor: 'var(--accent-orange)'}}>
                            {loading ? 'Saving...' : 'Finish & Save User'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}