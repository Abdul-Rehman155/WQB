import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, Button, Container, Modal, Form, Spinner } from 'react-bootstrap';
import { Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { getEvents, createEvent } from '../Service/api';
import { useTheme } from "../context/ThemeContext";

export default function CalendarComponent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Events logic
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      const formattedEvents = data.map(evt => ({
        id: evt._id,
        title: evt.title,
        start: evt.startDate,
        allDay: evt.allDay,
        backgroundColor: isDark ? '#1a3a32' : '#E6F7F0',
        textColor: '#00A86B',
        borderColor: '#00A86B'
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, [isDark]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle Date Click (Open Modal)
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setShowModal(true);
  };

  // Save Event logic
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSaving(true);
    try {
      const newEventData = { 
        title: newTitle, 
        startDate: selectedDate, 
        endDate: selectedDate, 
        allDay: true 
      };
      const savedEvt = await createEvent(newEventData);
      
      // Update local state immediately
      setEvents(prev => [...prev, { 
        id: savedEvt._id, 
        title: savedEvt.title, 
        start: savedEvt.startDate, 
        allDay: savedEvt.allDay, 
        backgroundColor: isDark ? '#1a3a32' : '#E6F7F0', 
        textColor: '#00A86B',
        borderColor: '#00A86B'
      }]);
      
      setShowModal(false);
      setNewTitle('');
    } catch (err) {
      alert("Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`page-layout ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Container fluid className="px-3 px-md-4 py-4">
        
        {/* HEADER SECTION */}
        <header className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className={`d-flex align-items-center gap-2 mb-1 ${isDark ? 'text-light-emphasis' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>
              <CalendarIcon size={14} />
              <span>Workforce / Calendar</span>
            </div>
            <h1 className={`h3 fw-bold m-0 ${isDark ? 'text-white' : 'text-dark'}`}>Event Schedule</h1>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant={isDark ? "outline-light" : "outline-secondary"} 
              className="rounded-3 shadow-sm d-flex align-items-center gap-2 px-3"
              onClick={loadEvents}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span className="d-none d-md-inline">Refresh</span>
            </Button>
            <Button 
              style={{ backgroundColor: '#00A86B', border: 'none' }}
              className="rounded-3 shadow-sm d-flex align-items-center gap-2 px-3 text-white"
              onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowModal(true); }}
            >
              <Plus size={18} />
              <span className="d-none d-md-inline">Add Event</span>
            </Button>
          </div>
        </header>

        {/* CALENDAR CARD */}
        <Card className={`border-0 shadow-sm p-4 rounded-4 ${isDark ? 'bg-secondary' : 'bg-white'}`}>
          {loading && events.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <Spinner animation="border" variant="success" className="mb-2" />
              <span className="text-muted">Loading calendar...</span>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={handleDateClick}
              height="75vh"
              headerToolbar={{ 
                left: 'title', 
                center: '', 
                right: 'prev,today,next' 
              }}
              dayMaxEvents={true}
            />
          )}
        </Card>
      </Container>

      {/* ADD EVENT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className={isDark ? 'bg-secondary text-white border-bottom-0' : ''}>
          <Modal.Title className="fw-bold">Create New Event</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDark ? 'bg-secondary text-white' : ''}>
          <Form onSubmit={handleSaveEvent}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Date Selected</Form.Label>
              <Form.Control type="text" readOnly value={selectedDate} className={isDark ? 'bg-dark text-white border-secondary' : 'bg-light'} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Event Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Meeting, Birthday, Deadline..." 
                autoFocus
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={isDark ? 'bg-dark text-white border-secondary' : ''}
              />
            </Form.Group>
            <div className="d-flex gap-2 mt-4">
              <Button variant="light" className="w-100" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="w-100 border-0" 
                style={{ backgroundColor: '#00A86B' }}
                disabled={isSaving}
              >
                {isSaving ? <Spinner size="sm" /> : "Save Event"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style>{`
        /* --- Page Layout --- */
        .page-layout {
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        @media (min-width: 992px) {
          .page-layout {
            margin-left: 280px; 
            width: calc(100% - 280px); 
          }
        }

        @media (max-width: 991px) {
          .page-layout {
            margin-left: 0;
            width: 100%;
          }
        }

        /* --- FullCalendar Overrides --- */
        .fc { 
          --fc-border-color: ${isDark ? '#4A5568' : '#E2E8F0'}; 
          background-color: transparent;
        }
        
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${isDark ? '#fff' : '#1A202C'};
        }

        .fc .fc-col-header-cell-cushion, 
        .fc .fc-daygrid-day-number { 
          color: ${isDark ? '#CBD5E0' : '#4A5568'}; 
          text-decoration: none !important; 
          font-size: 0.85rem; 
          padding: 8px !important;
        }

        .fc-event { 
          border-radius: 6px !important; 
          padding: 3px 8px !important; 
          font-weight: 500; 
          font-size: 0.75rem; 
          border-left: 4px solid #00A86B !important; 
          cursor: pointer;
        }

        .fc .fc-button-primary {
          background-color: ${isDark ? '#2D3748' : '#fff'} !important;
          border-color: ${isDark ? '#4A5568' : '#E2E8F0'} !important;
          color: ${isDark ? '#fff' : '#4A5568'} !important;
          box-shadow: none !important;
          text-transform: capitalize !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
        }

        .fc .fc-button-primary:hover {
          background-color: ${isDark ? '#4A5568' : '#F8F9FA'} !important;
        }

        .fc .fc-button-active {
          background-color: #00A86B !important;
          border-color: #00A86B !important;
          color: #fff !important;
        }

        .fc .fc-day-today {
          background-color: ${isDark ? 'rgba(0, 168, 107, 0.05)' : 'rgba(0, 168, 107, 0.03)'} !important;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}