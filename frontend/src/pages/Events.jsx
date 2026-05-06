import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
// NEW: Import Calendar libraries
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Calendar default styles

import { AuthContext } from '../context/AuthContext';
import './Events.css';

const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

// NEW: Setup the localizer for the calendar
const localizer = momentLocalizer(moment);

export default function Events() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    
    // NEW: State to track which event the user clicked on the calendar
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || '';
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    };

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/events`);
            
            // NEW: Transform data so the Calendar can read it (needs 'start' and 'end')
            const calendarEvents = res.data.map(ev => {
                const startDate = new Date(ev.event_date);
                // Assume events last 2 hours for calendar block display
                const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); 
                
                return {
                    ...ev,
                    start: startDate,
                    end: endDate,
                    title: ev.title // Calendar uses the 'title' property natively
                };
            });
            
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);
    
    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        try {
            await axios.delete(`${API_BASE}/api/events/${eventId}`, getAuthHeaders());
            setSelectedEvent(null); // Close modal on delete
            fetchEvents();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || 'Failed to delete event. Check permissions.');
        }
    };
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onloadend = () => setImageUrl(reader.result);
                reader.readAsDataURL(file);
            } catch (e) {
                console.warn('FileReader failed, skipping preview.');
                setImageUrl('');
            }
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/events`, {
                title, description, event_date: eventDate, image_url: imageUrl, created_by: user.id
            }, getAuthHeaders());
            setShowForm(false);
            setTitle(''); setDescription(''); setEventDate(''); setImageUrl('');
            fetchEvents(); 
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || 'Failed to create event. Check your permissions and try again.');
        }
    };

    const handleRSVP = async (eventId, status) => {
        try {
            await axios.post(`${API_BASE}/api/events/rsvp`, {
                event_id: eventId, user_id: user.id, status
            }, getAuthHeaders());
            alert(`RSVP set to: ${status}`);
            
            // Update the selected event locally so the modal updates immediately
            setSelectedEvent(prev => ({ ...prev, rsvp_count: status === 'going' ? (prev.rsvp_count || 0) + 1 : prev.rsvp_count }));
            fetchEvents();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || 'Failed to update RSVP.');
        }
    };

    const canManageEvents = user?.role === 'admin' || user?.role === 'eventmanager' || user?.role === 'event_manager';

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--primary-deep)' }}>Events Calendar</h2>
                {canManageEvents && (
                    <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 15px', backgroundColor: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {showForm ? 'Cancel' : '+ Create Event'}
                    </button>
                )}
            </div>

            {/* Create Event Form (Hidden by default) */}
            {showForm && (
                <form onSubmit={handleCreateEvent} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--primary-light)' }}>
                    <input type="text" placeholder="Event Title" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} />
                    <input type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} />
                    
                    <div style={{ marginBottom: '10px', border: '1px dashed var(--primary-main)', padding: '15px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--primary-deep)', fontWeight: 'bold' }}>Upload Event Cover Image (Optional)</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', cursor: 'pointer' }} />
                        {imageUrl && <img src={imageUrl} alt="Preview" style={{ marginTop: '10px', width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />}
                    </div>
                    
                    <textarea placeholder="Event Description" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px', minHeight: '80px' }} />
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Event</button>
                </form>
            )}

            {/* NEW: Interactive Calendar Grid */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '700px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={(event) => setSelectedEvent(event)} // Open modal on click
                    views={['month', 'week', 'day', 'agenda']} // Allow users to change view
                />
            </div>

            {/* NEW: Event Details Popup Modal */}
            {selectedEvent && (
                <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="event-modal-content" onClick={e => e.stopPropagation()}>
                        
                        <button className="close-btn" onClick={() => setSelectedEvent(null)}>✕</button>
                        
                        {selectedEvent.image_url && (
                            <img src={selectedEvent.image_url} alt={selectedEvent.title} className="event-modal-image" />
                        )}
                        
                        <h2 style={{ marginTop: selectedEvent.image_url ? '15px' : '0' }}>{selectedEvent.title}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>
                            {moment(selectedEvent.start).format('MMMM Do YYYY, h:mm a')} | Organized by: {selectedEvent.creator_name}
                        </p>
                        
                        <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>{selectedEvent.description}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{selectedEvent.rsvp_count || 0} People Going</span>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button disabled={selectedEvent.is_past} onClick={() => handleRSVP(selectedEvent.id, 'going')} style={{ padding: '8px 15px', cursor: selectedEvent.is_past ? 'not-allowed' : 'pointer', border: '1px solid var(--primary-main)', backgroundColor: 'transparent', borderRadius: '4px' }}>
                                    {selectedEvent.is_past ? 'Event Ended' : 'Going'}
                                </button>
                                <button disabled={selectedEvent.is_past} onClick={() => handleRSVP(selectedEvent.id, 'not_going')} style={{ padding: '8px 15px', cursor: selectedEvent.is_past ? 'not-allowed' : 'pointer', border: '1px solid #ccc', backgroundColor: 'transparent', borderRadius: '4px' }}>
                                    {selectedEvent.is_past ? 'Event Ended' : 'Not Going'}
                                </button>
                                
                                {user?.role === 'admin' && (
                                    <button onClick={() => handleDeleteEvent(selectedEvent.id)} style={{ padding: '8px 15px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}