"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './join.module.css';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function JoinEvent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const inviteParam = Array.isArray(params?.id)
          ? params.id[0]
          : params?.id;

        if (!inviteParam) {
          setError('Invalid invite link');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('invite_code', inviteParam)
          .single();

        if (error) throw error;

        if (data) {
          // Check if link has expired
          if (new Date(data.link_expiry) < new Date()) {
            setError('This invite link has expired');
            return;
          }

          // Check if event is full
          if (data.current_participants >= data.max_participants) {
            setError('This event has reached maximum capacity');
            return;
          }

          setEvent(data);
        }
      } catch (err) {
        setError('Failed to load event');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params, supabase]);

  const handleJoin = async () => {
    if (!user || !event) return;

    try {
      const { error } = await supabase
        .from('event_invites')
        .insert([
          {
            event_id: event.id,
            email: user.email,
            status: 'accepted'
          }
        ]);

      if (error) throw error;

      router.push('/'); // Redirect to home or events page
    } catch (err) {
      setError('Failed to join event');
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner} />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Event Not Found</h2>
          <p>This event may no longer exist or the invite link is invalid.</p>
          <button onClick={() => router.push('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.eventCard}>
        <h1>{event.title}</h1>
        <div className={styles.eventDetails}>
          <p>
            <strong>Date:</strong>{' '}
            {new Date(event.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p>
            <strong>Location:</strong> {event.location}
          </p>
          <p>
            <strong>Description:</strong> {event.description}
          </p>
          <p>
            <strong>Participants:</strong> {event.current_participants}/{event.max_participants}
          </p>
        </div>

        {!user ? (
          <div className={styles.authPrompt}>
            <p>Please log in to join this event</p>
            <button onClick={() => router.push('/auth/login')}>Log In</button>
          </div>
        ) : (
          <button onClick={handleJoin} className={styles.joinButton}>
            Join Event
          </button>
        )}
      </div>
    </div>
  );
}