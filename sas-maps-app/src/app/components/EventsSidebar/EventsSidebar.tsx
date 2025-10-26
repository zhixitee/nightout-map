"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './EventsSidebar.module.css';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import EmailInvite from './EmailInvite';
import { useRouter } from 'next/navigation';
import { useRoutePlanner } from '@/lib/RoutePlannerContext';
import RoutePreviewMap from './RoutePreviewMap';
import PlacesSearch from '../PlacesComponent';
import { useMapSearch } from '@/lib/MapSearchContext';

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

const initialFormState = {
  title: '',
  date: '',
  location: '',
  description: '',
  maxParticipants: '',
  linkExpiry: ''
};

export default function EventsSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormState });
  const [createStatus, setCreateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationTouched, setLocationTouched] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { venues, removeVenue, clearVenues } = useRoutePlanner();
  const [routeOrder, setRouteOrder] = useState<string[]>([]);
  const { center, setCenter, radius, setRadius, selectedTypes, setSelectedTypes } = useMapSearch();

  useEffect(() => {
    setRouteOrder((current) => {
      const placeIds = venues.map((venue) => venue.place_id);

      if (placeIds.length === 0) {
        return current.length === 0 ? current : [];
      }

      const filtered = current.filter((id) => placeIds.includes(id));

      if (filtered.length === placeIds.length) {
        return filtered;
      }

      const missing = placeIds.filter((id) => !filtered.includes(id));
      return [...filtered, ...missing];
    });
  }, [venues]);

  const orderedVenues = useMemo(() => {
    if (routeOrder.length === venues.length && venues.length > 0) {
      const venueMap = new Map(venues.map((venue) => [venue.place_id, venue]));
      const mapped = routeOrder
        .map((id) => venueMap.get(id))
        .filter((value): value is typeof venues[number] => Boolean(value));

      if (mapped.length === venues.length) {
        return mapped;
      }
    }

    return venues;
  }, [routeOrder, venues]);

  const handleRouteComputed = useCallback(
    (orderedPlaceIds: string[]) => {
      if (orderedPlaceIds.length === 0) {
        return;
      }

      setRouteOrder(() => {
        const uniqueOrderedIds = orderedPlaceIds.filter((id, index, arr) => arr.indexOf(id) === index);
        const validIds = uniqueOrderedIds.filter((id) => venues.some((venue) => venue.place_id === id));

        const missing = venues
          .map((venue) => venue.place_id)
          .filter((id) => !validIds.includes(id));

        return [...validIds, ...missing];
      });
    },
    [venues]
  );

  const hasOptimizedOrder = useMemo(() => {
    if (venues.length < 2 || routeOrder.length !== venues.length) {
      return false;
    }

    return routeOrder.some((id, index) => id !== venues[index].place_id);
  }, [routeOrder, venues]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  useEffect(() => {
    if (locationTouched) {
      return;
    }

    if (orderedVenues.length === 0) {
      setFormData((prev) => {
        if (prev.location === '') {
          return prev;
        }
        return { ...prev, location: '' };
      });
      return;
    }

    const autoLocation = orderedVenues
      .map((venue, index) => {
        const base = venue.address ? `${venue.name} • ${venue.address}` : venue.name;
        return orderedVenues.length > 1 ? `Stop ${index + 1}: ${base}` : base;
      })
      .join('\n');

    setFormData((prev) => {
      if (prev.location === autoLocation) {
        return prev;
      }
      return { ...prev, location: autoLocation };
    });
  }, [orderedVenues, locationTouched]);

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
        setFormData({ ...initialFormState });
        setSelectedEvent(data[0]);
        setInviteStatus(null);
        setEventStatus(null);
        setShowInviteForm(true);
        setCreateStatus({ type: 'success', message: 'Event created! Invite your friends below.' });
        setLocationTouched(false);
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

  const handleCancelEvent = async (eventToCancel: Event) => {
    if (!user) return;

    if (!user.email) {
      setEventStatus({ type: 'error', message: 'We need your account email to send cancellation notices.' });
      return;
    }

    const confirmation = window.confirm(`Cancel "${eventToCancel.title}" and notify all invitees?`);
    if (!confirmation) {
      return;
    }

    try {
      setEventStatus(null);
      setDeletingEventId(eventToCancel.id);

      const response = await fetch(`/api/events/${eventToCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId: user.id,
          hostEmail: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok && response.status !== 207) {
        throw new Error(result.message || 'Failed to cancel event.');
      }

      setEvents((prev) => prev.filter((item) => item.id !== eventToCancel.id));

      if (selectedEvent?.id === eventToCancel.id) {
        setSelectedEvent(null);
        setShowInviteForm(false);
        setInviteStatus(null);
      }

      if (response.status === 207) {
        const failedEmails: string[] = Array.isArray(result.failedEmails) ? result.failedEmails : [];
        const message = result.message
          || (failedEmails.length > 0
            ? `Event cancelled, but we could not email: ${failedEmails.join(', ')}`
            : 'Event cancelled with some warnings.');

        setEventStatus({
          type: 'warning',
          message,
        });
      } else {
        setEventStatus({
          type: 'success',
          message: result.message || 'Event cancelled and all invitees notified.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel event. Please try again.';
      setEventStatus({ type: 'error', message });
    } finally {
      setDeletingEventId(null);
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
            <div className={styles.createForm}>
              <div className={styles.formHeader}>
                <h3>Create Night Out</h3>
                <p>Set the details and build your perfect route below.</p>
              </div>

              <div className={styles.placeSearchPanel}>
                <div className={styles.placeSearchHeader}>
                  <h4>Find Venues Nearby</h4>
                  <p>Search and add stops to auto-fill your itinerary.</p>
                </div>
                {center ? (
                  <PlacesSearch
                    center={center}
                    radius={radius}
                    type={selectedTypes}
                    onRadiusChange={setRadius}
                    onTypeChange={setSelectedTypes}
                    onPlaceSelect={(place) => setCenter({ lat: place.lat, lng: place.lng })}
                  />
                ) : (
                  <div className={styles.emptyRouteMessage}>
                    Getting your location… try searching again in a moment.
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateEvent} className={styles.eventForm}>
                <label className={styles.fieldGroup}>
                  <span>Title</span>
                  <input
                    type="text"
                    placeholder="Night out name"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span>Date & Time</span>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span>Locations</span>
                  <textarea
                    placeholder="Stops will appear here as you add venues"
                    value={formData.location}
                    onChange={(e) => {
                      setLocationTouched(true);
                      setFormData({ ...formData, location: e.target.value });
                    }}
                    required
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span>Plan Notes</span>
                  <textarea
                    placeholder="Share the vibe, meeting point, or dress code"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </label>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldGroup}>
                    <span>Max Guests</span>
                    <input
                      type="number"
                      placeholder="10"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      required
                      min="1"
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span>Link Expiry</span>
                    <input
                      type="datetime-local"
                      value={formData.linkExpiry}
                      onChange={(e) => setFormData({ ...formData, linkExpiry: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <div className={styles.formButtons}>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...initialFormState });
                      setCreateStatus(null);
                      setLocationTouched(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Reset
                  </button>
                </div>
              </form>

              <div className={styles.routePlanner}>
                <div className={styles.routePlannerHeader}>
                  <h4>Night Out Planner</h4>
                  {venues.length > 0 && (
                    <button
                      type="button"
                      className={styles.routeClearButton}
                      onClick={() => {
                        clearVenues();
                        setLocationTouched(false);
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                  <p className={styles.routePlannerDescription}>
                    Stops you add appear here. We’ll optimise the route automatically.
                  </p>
                  {venues.length === 0 ? (
                    <p className={styles.emptyRouteMessage}>
                      No stops yet—grab a few from the search above to get started.
                    </p>
                  ) : (
                    <>
                      {hasOptimizedOrder && (
                        <p className={styles.optimizedHint}>
                          Order updated for the quickest journey between each stop.
                        </p>
                      )}
                      <ol className={styles.routeList}>
                        {orderedVenues.map((venue, index) => (
                          <li key={venue.place_id} className={styles.routeItem}>
                            <div className={styles.routeItemInfo}>
                              <span className={styles.routeBadge}>Stop {index + 1}</span>
                              <div className={styles.routeVenueName}>{venue.name}</div>
                              <div className={styles.routeVenueAddress}>{venue.address}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVenue(venue.place_id)}
                              className={styles.routeRemoveButton}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ol>
                      {venues.length >= 2 && (
                        <div className={styles.routeMapWrapper}>
                          <RoutePreviewMap venues={venues} onRouteComputed={handleRouteComputed} />
                        </div>
                      )}
                    </>
                  )}
                </div>
            </div>

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

            {eventStatus && (
              <div
                className={`${styles.statusMessage} ${
                  eventStatus.type === 'success'
                    ? styles.successMessage
                    : eventStatus.type === 'warning'
                      ? styles.warningMessage
                      : styles.errorMessage
                }`}
                role="status"
              >
                {eventStatus.message}
              </div>
            )}

            <div className={styles.eventsList}>
              {events.length === 0 ? (
                <div className={styles.noEvents}>
                  <p>No events yet. Create your first event!</p>
                </div>
              ) : (
                events.map((night) => (
                  <div key={night.id} className={styles.eventCard}>
                    <div className={styles.eventCardTopRow}>
                      <h3>{night.title}</h3>
                      <button
                        type="button"
                        className={styles.deleteEventButton}
                        onClick={() => handleCancelEvent(night)}
                        disabled={deletingEventId === night.id}
                      >
                        {deletingEventId === night.id ? 'Cancelling…' : 'Cancel Event'}
                      </button>
                    </div>
                    <p>Date: {new Date(night.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                    <p>Location: {night.location}</p>
                    <p>Participants: {night.current_participants}/{night.max_participants}</p>
                    <div className={styles.eventActions}>
                      <button
                        onClick={() => {
                          setSelectedEvent(night);
                          setShowInviteForm(true);
                          setInviteStatus(null);
                        }}
                        className={styles.inviteButton}
                      >
                        Invite People
                      </button>
                      <button
                        onClick={() => copyInviteLink(night.invite_link)}
                        className={styles.copyLinkButton}
                      >
                        Copy Link
                      </button>
                    </div>
                    <p className={styles.expiryNote}>
                      Link expires: {new Date(night.link_expiry).toLocaleDateString()}
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