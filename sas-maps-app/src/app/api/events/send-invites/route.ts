import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    const { eventId, emails, eventTitle, inviteLink, hostEmail } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { message: 'No email addresses provided' },
        { status: 400 }
      );
    }

    const trimmedEmails = emails
      .map((email: string) => email?.trim())
      .filter((email: string | undefined): email is string => Boolean(email));

    if (trimmedEmails.length === 0) {
      return NextResponse.json(
        { message: 'No valid email addresses provided' },
        { status: 400 }
      );
    }

    const seen = new Map<string, string>();
    const duplicatesInRequest: string[] = [];

    for (const email of trimmedEmails) {
      const normalized = email.toLowerCase();
      if (seen.has(normalized)) {
        duplicatesInRequest.push(email);
      } else {
        seen.set(normalized, email);
      }
    }

    const uniqueEmails = Array.from(seen.values());

    // Verify the event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('current_participants, max_participants, link_expiry')
      .eq('id', eventId)
      .single();

    if (eventError) throw new Error('Event not found');
    if (!event) throw new Error('Event not found');

    // Check if the event is full
    if (event.current_participants >= event.max_participants) {
      return NextResponse.json(
        { message: 'Event has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Check if the invite link has expired
    if (new Date(event.link_expiry) < new Date()) {
      return NextResponse.json(
        { message: 'Invite link has expired' },
        { status: 400 }
      );
    }

    let alreadyInvited: string[] = [];

    if (uniqueEmails.length > 0) {
      const { data: existing, error: existingError } = await supabase
        .from('event_invites')
        .select('email')
        .eq('event_id', eventId)
        .in('email', uniqueEmails);

      if (existingError) throw existingError;

      const existingSet = new Set((existing || []).map(item => item.email.toLowerCase()));

      alreadyInvited = uniqueEmails.filter(email => existingSet.has(email.toLowerCase()));

      const newEmails = uniqueEmails.filter(email => !existingSet.has(email.toLowerCase()));

      if (newEmails.length > 0) {
        const invites = newEmails.map((email: string) => ({
          event_id: eventId,
          email,
          status: 'pending'
        }));

        const { error: inviteError } = await supabase
          .from('event_invites')
          .insert(invites);

        if (inviteError) throw inviteError;

        // Send emails using SendGrid for new invitees only
        const emailPromises = newEmails.map(async (email: string) => {
          try {
            const msg = {
              to: email,
              from: sendGridSender,
              subject: `You're invited to ${eventTitle}!`,
              text: `${hostEmail} has invited you to join their event: ${eventTitle}. Click here to join: ${inviteLink}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">You're invited to ${eventTitle}!</h2>
                  <p>${hostEmail} has invited you to join their event.</p>
                  <p>Click the link below to join:</p>
                  <a href="${inviteLink}" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 16px 0;
                  ">Join Event</a>
                  <p>Or copy this link:</p>
                  <p style="word-break: break-all;">${inviteLink}</p>
                </div>
              `,
            };

            await sgMail.send(msg);
            return { email, success: true };
          } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
            return { email, success: false };
          }
        });

        const emailResults = await Promise.all(emailPromises);
        const failedEmails = emailResults.filter(result => !result.success);

        if (failedEmails.length > 0) {
          return NextResponse.json(
            {
              message: 'Some emails failed to send',
              failedEmails: failedEmails.map(result => result.email),
              skippedEmails: {
                duplicatesInRequest,
                alreadyInvited,
              },
            },
            { status: 207 }
          );
        }

        if (duplicatesInRequest.length > 0 || alreadyInvited.length > 0) {
          return NextResponse.json(
            {
              message: 'Invites sent, but some addresses were skipped',
              sentEmails: newEmails,
              skippedEmails: {
                duplicatesInRequest,
                alreadyInvited,
              },
            },
            { status: 207 }
          );
        }

        return NextResponse.json(
          { message: 'Invites sent successfully', sentEmails: newEmails },
          { status: 200 }
        );
      }
    }

    if (duplicatesInRequest.length > 0 || alreadyInvited.length > 0) {
      return NextResponse.json(
        {
          message: 'No new invites were sent because these addresses were already invited or duplicated',
          sentEmails: [],
          skippedEmails: {
            duplicatesInRequest,
            alreadyInvited,
          },
        },
        { status: 207 }
      );
    }

    return NextResponse.json(
      { message: 'No invites were sent' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error sending invites:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}