"use client";

import { useState, useEffect } from 'react';
import styles from './EventsSidebar.module.css';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import EmailInvite from './EmailInvite';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  host_id: string;
  max_participants: number;
  current_participants: number;
  invite_link: string;
  link_expiry: string;
  invite_code: string;
  created_at: string;
}

interface Invite {
  id: string;
  event_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function EventsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    maxParticipants: '',
    linkExpiry: ''
  });
  const [createStatus, setCreateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setCreateStatus(null);
      setIsSubmitting(true);

      const participantLimit = Number(formData.maxParticipants);
      if (!Number.isFinite(participantLimit) || participantLimit < 1) {
        setCreateStatus({ type: 'error', message: 'Please enter a participant limit of at least 1.' });
        setIsSubmitting(false);
        return;
      }

      if (!formData.linkExpiry) {
        setCreateStatus({ type: 'error', message: 'Please choose an invite expiry date.' });
        setIsSubmitting(false);
        return;
      }

      const baseUrl = window.location.origin;
      const inviteCode = Math.random().toString(36).substring(2, 15);
      const inviteLink = `${baseUrl}/events/join/${inviteCode}`;

      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title: formData.title,
            date: formData.date,
            location: formData.location,
            description: formData.description,
            host_id: user.id,
            max_participants: participantLimit,
            current_participants: 1,
            invite_link: inviteLink,
            link_expiry: formData.linkExpiry,
            invite_code: inviteCode
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        await fetchEvents(); // Refresh the events list
        setShowCreateForm(false);
        setFormData({
          title: '',
          date: '',
          location: '',
          description: '',
          maxParticipants: '',
          linkExpiry: ''
        });
        setSelectedEvent(data[0]);
        setInviteStatus(null);
        setShowInviteForm(true);
        setCreateStatus({ type: 'success', message: 'Event created! Invite your friends below.' });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      const message = error instanceof Error ? error.message : 'We could not create that event. Please try again.';
      setCreateStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvite = async (emails: string[]) => {
    if (!selectedEvent || !user) return;

    try {
      setInviteStatus(null);

      const response = await fetch('/api/events/send-invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          emails: emails,
          eventTitle: selectedEvent.title,
          inviteLink: selectedEvent.invite_link,
          hostEmail: user.email
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send invites');
      }

      if (response.status === 207) {
        const failedEmails: string[] = result.failedEmails || [];
        const duplicatesInRequest: string[] = result.skippedEmails?.duplicatesInRequest || [];
        const alreadyInvited: string[] = result.skippedEmails?.alreadyInvited || [];
        const sentEmails: string[] = result.sentEmails || [];

        const summaryParts: string[] = [];
        if (sentEmails.length > 0) {
          summaryParts.push(`Sent: ${sentEmails.join(', ')}`);
        }
        if (duplicatesInRequest.length > 0) {
          summaryParts.push(`Skipped duplicates: ${duplicatesInRequest.join(', ')}`);
        }
        if (alreadyInvited.length > 0) {
          summaryParts.push(`Already invited: ${alreadyInvited.join(', ')}`);
        }
        if (failedEmails.length > 0) {
          summaryParts.push(`Failed: ${failedEmails.join(', ')}`);
        }

        const message = summaryParts.length > 0
          ? summaryParts.join(' · ')
          : (result.message || 'Some invites could not be processed.');

        setInviteStatus({
          type: failedEmails.length > 0 ? 'error' : 'warning',
          message
        });

        if (sentEmails.length > 0 && failedEmails.length === 0) {
          setShowInviteForm(false);
          setSelectedEvent(null);
        }

        return;
      }

      setInviteStatus({ type: 'success', message: 'Invites sent successfully.' });
      setShowInviteForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error sending invites:', error);
      const message = error instanceof Error ? error.message : 'Failed to send invites. Please try again.';
      setInviteStatus({ type: 'error', message });
    }
  };

  const copyInviteLink = async (inviteLink: string) => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      // You could add a toast notification here
      console.log('Invite link copied to clipboard');
    } catch (error) {
      console.error('Error copying invite link:', error);
    }
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : '+'}
      </button>

      <div className={styles.sidebarContent}>
        <h2>Night Out Events</h2>
        
        {!user ? (
          <div className={styles.loginPrompt}>
            <p>Please log in to create and manage events</p>
            <button onClick={() => router.push('/auth/login')} className={styles.loginButton}>
              Log In
            </button>
          </div>
        ) : (
          <>
            {createStatus && (
              <div
                className={`${styles.statusMessage} ${
                  createStatus.type === 'success'
                    ? styles.successMessage
                    : styles.errorMessage
                }`}
                role="status"
              >
                {createStatus.message}
              </div>
            )}
            <button 
              className={styles.createButton}
              onClick={() => {
                setShowCreateForm(true);
                setShowInviteForm(false);
                setInviteStatus(null);
              }}
              disabled={showCreateForm || isSubmitting}
            >
              Create New Event
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateEvent} className={styles.createForm}>
                <input
                  type="text"
                  placeholder="Event Title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Max Participants"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({...formData, maxParticipants: e.target.value })}
                  required
                  min="1"
                />
                <input
                  type="datetime-local"
                  placeholder="Link Expiry"
                  value={formData.linkExpiry}
                  onChange={(e) => setFormData({...formData, linkExpiry: e.target.value})}
                  required
                />
                <div className={styles.formButtons}>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateStatus(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showInviteForm && selectedEvent && (
              <div className={styles.inviteForm}>
                <h3>Invite People to {selectedEvent.title}</h3>
                {inviteStatus && (
                  <div
                    className={`${styles.statusMessage} ${
                      inviteStatus.type === 'success'
                        ? styles.successMessage
                        : inviteStatus.type === 'warning'
                          ? styles.warningMessage
                          : styles.errorMessage
                    }`}
                    role="status"
                  >
                    {inviteStatus.message}
                  </div>
                )}
                <EmailInvite onInvite={handleInvite} eventId={selectedEvent.id} />
                <div className={styles.inviteLinkSection}>
                  <p>Or share invite link:</p>
                  <div className={styles.inviteLink}>
                    <input
                      type="text"
                      value={selectedEvent.invite_link}
                      readOnly
                    />
                    <button onClick={() => copyInviteLink(selectedEvent.invite_link)}>
                      Copy Link
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteStatus(null);
                    }}
                    className={styles.closeInviteButton}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className={styles.eventsList}>
              {events.length === 0 ? (
                <div className={styles.noEvents}>
                  <p>No events yet. Create your first event!</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className={styles.eventCard}>
                    <h3>{event.title}</h3>
                    <p>Date: {new Date(event.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                    <p>Location: {event.location}</p>
                    <p>Participants: {event.current_participants}/{event.max_participants}</p>
                    <div className={styles.eventActions}>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowInviteForm(true);
                          setShowCreateForm(false);
                          setInviteStatus(null);
                        }}
                        className={styles.inviteButton}
                      >
                        Invite People
                      </button>
                      <button
                        onClick={() => copyInviteLink(event.invite_link)}
                        className={styles.copyLinkButton}
                      >
                        Copy Link
                      </button>
                    </div>
                    <p className={styles.expiryNote}>
                      Link expires: {new Date(event.link_expiry).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}