import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Events() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const fetchEvents = async () => {
        const res = await axios.get('http://localhost:5000/api/events');
        setEvents(res.data);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // NEW: Handle File Upload & Convert to Base64
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result); // Sets the Base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:5000/api/events', {
            title, description, event_date: eventDate, image_url: imageUrl, created_by: user.id
        });
        setShowForm(false);
        setTitle(''); setDescription(''); setEventDate(''); setImageUrl('');
        fetchEvents(); // Refresh list
    };

    const handleRSVP = async (eventId, status) => {
        await axios.post('http://localhost:5000/api/events/rsvp', {
            event_id: eventId, user_id: user.id, status
        });
        alert(`RSVP set to: ${status}`);
        fetchEvents();
    };

    const canManageEvents = user.role === 'admin' || user.role === 'eventmanager';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--primary-deep)' }}>Upcoming Events</h2>
                {canManageEvents && (
                    <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 15px', backgroundColor: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {showForm ? 'Cancel' : '+ Create Event'}
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleCreateEvent} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--primary-light)' }}>
                    <input type="text" placeholder="Event Title" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} />
                    <input type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} />
                    
                    {/* NEW: Drag and Drop / File Selector Field */}
                    <div style={{ marginBottom: '10px', border: '1px dashed var(--primary-main)', padding: '15px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--primary-deep)', fontWeight: 'bold' }}>
                            Upload Event Cover Image (Optional)
                        </label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', cursor: 'pointer' }} />
                        {imageUrl && (
                            <img src={imageUrl} alt="Preview" style={{ marginTop: '10px', width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                    </div>
                    
                    <textarea placeholder="Event Description" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px', minHeight: '80px' }} />
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '5px' }}>Save Event</button>
                </form>
            )}

            <div style={{ display: 'grid', gap: '15px' }}>
                {events.map(ev => (
                    <div key={ev.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid var(--primary-main)' }}>
                        {/* NEW: Displays the uploaded image or URL */}
                        {ev.image_url && (
                            <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '15px' }} />
                        )}
                        <h3>{ev.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Date: {new Date(ev.event_date).toLocaleString()} | Organized by: {ev.creator_name}</p>
                        <p style={{ margin: '15px 0' }}>{ev.description}</p>
                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }}/>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: 'var(--accent-orange)' }}>{ev.rsvp_count || 0} People Going</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleRSVP(ev.id, 'going')} style={{ padding: '5px 15px', cursor: 'pointer', border: '1px solid var(--primary-main)', backgroundColor: 'transparent' }}>Going</button>
                                <button onClick={() => handleRSVP(ev.id, 'not_going')} style={{ padding: '5px 15px', cursor: 'pointer', border: '1px solid #ccc', backgroundColor: 'transparent' }}>Not Going</button>
                            </div>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <p>No upcoming events.</p>}
            </div>
        </div>
    );
}