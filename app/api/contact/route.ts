import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const { type, name, email, phone, message, confirmed } = await request.json();

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    if (type === 'call' && !confirmed) {
      return NextResponse.json({
        needsConfirmation: true,
        message: `Are you sure you want us to call you at ${phone}? We'll reach out during business hours (Mon-Fri, 9 AM - 5 PM).`
      });
    }

    const emailSubject = type === 'call' 
      ? `🔔 CALL REQUEST from ${name}` 
      : `📧 Contact Form Submission from ${name}`;

    const emailBody = `
      <h2>New ${type === 'call' ? 'Call Request' : 'Contact Form'} from Website</h2>
      
      <p><strong>Name:</strong> ${name}</p>
      ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      
      ${type === 'call' ? '<p><strong>⚠️ CALL REQUESTED - Please contact this person by phone</strong></p>' : ''}
      
      <hr>
      <p><em>Sent from Rex Security Chatbot - ${new Date().toLocaleString()}</em></p>
    `;

    await sendEmail({
      to: process.env.HR_EMAIL!,
      subject: emailSubject,
      html: emailBody,
    });

    return NextResponse.json({
      success: true,
      message: type === 'call' 
        ? `Thank you! Our HR team will call you at ${phone} during business hours.`
        : 'Thank you! Your message has been sent to our HR team. We\'ll respond within 1 business hour.'
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}