import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import sgMail from '@sendgrid/mail';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sendGridApiKey = process.env.SENDGRID_API_KEY;
const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

if (!sendGridApiKey || !sendGridFromEmail) {
  throw new Error('Missing SendGrid configuration. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

sgMail.setApiKey(sendGridApiKey);
const sendGridSender = sendGridFromEmail as string;

interface CancelRequestBody {
  hostId: string;
  hostEmail: string;
}

type InviteRow = {
  email: string | null;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ message: 'Missing event identifier.' }, { status: 400 });
    }

    let body: CancelRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
    }

    const { hostId, hostEmail } = body;

    if (!hostId || !hostEmail) {
      return NextResponse.json({ message: 'Missing host credentials.' }, { status: 400 });
    }

    const { data: eventRecord, error: eventError } = await supabase
      .from('events')
      .select('id, title, date, host_id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventRecord) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 });
    }

    if (eventRecord.host_id !== hostId) {
      return NextResponse.json({ message: 'You do not have permission to cancel this event.' }, { status: 403 });
    }

    const { data: inviteRows, error: invitesError } = await supabase
      .from('event_invites')
      .select('email')
      .eq('event_id', eventId);

    if (invitesError) {
      throw invitesError;
    }

    const uniqueEmails = new Map<string, string>();
    (inviteRows as InviteRow[] | null)?.forEach((invite) => {
      const trimmed = invite.email?.trim();
      if (!trimmed) return;
      const normalized = trimmed.toLowerCase();
      if (!uniqueEmails.has(normalized)) {
        uniqueEmails.set(normalized, trimmed);
      }
    });

    const recipientEmails = Array.from(uniqueEmails.values());

    const formattedDate = eventRecord.date
      ? (() => {
          const parsed = new Date(eventRecord.date as string);
          return Number.isNaN(parsed.getTime())
            ? null
            : parsed.toLocaleString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
        })()
      : null;

    let failedEmails: string[] = [];

    if (recipientEmails.length > 0) {
      const emailResults = await Promise.all(
        recipientEmails.map(async (email) => {
          const message = {
            to: email,
            from: sendGridSender,
            subject: `Event cancelled: ${eventRecord.title}`,
            text: [
              'Hi there,',
              '',
              `${hostEmail} has cancelled the event "${eventRecord.title}".`,
              formattedDate ? `Original date: ${formattedDate}` : '',
              'We hope to see you at a future event.',
            ]
              .filter(Boolean)
              .join('\n'),
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">${eventRecord.title} has been cancelled</h2>
                <p>${hostEmail} has cancelled this event.</p>
                ${
                  formattedDate
                    ? `<p><strong>Original date:</strong> ${formattedDate}</p>`
                    : ''
                }
                <p>We hope to see you at a future night out.</p>
              </div>
            `,
          };

          try {
            await sgMail.send(message);
            return { email, success: true };
          } catch (error) {
            console.error(`Failed to send cancellation email to ${email}:`, error);
            return { email, success: false };
          }
        })
      );

      failedEmails = emailResults.filter((result) => !result.success).map((result) => result.email);
    }

    const { error: deleteInvitesError } = await supabase
      .from('event_invites')
      .delete()
      .eq('event_id', eventId);

    if (deleteInvitesError) {
      throw deleteInvitesError;
    }

    const { error: deleteEventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteEventError) {
      throw deleteEventError;
    }

    if (failedEmails.length > 0) {
      return NextResponse.json(
        {
          message: 'Event cancelled, but some invitees could not be notified via email.',
          failedEmails,
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      message:
        recipientEmails.length > 0
          ? 'Event cancelled and all invitees were notified.'
          : 'Event cancelled. No invitees to notify.',
    });
  } catch (error) {
    console.error('Error cancelling event:', error);
    return NextResponse.json(
      {
        message: 'Internal server error.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
