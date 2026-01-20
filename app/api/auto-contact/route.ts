import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const { type, conversationHistory, userPhone } = await request.json();

    const conversationText = conversationHistory
      .map((msg: any) => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
      .join('\n\n');

    if (type === 'high_interest') {
      const emailSubject = '🔥 HIGH INTEREST LEAD - Immediate Follow-up Required';
      const emailBody = `
        <h2 style="color: #d97706;">🔥 HIGH INTEREST CUSTOMER DETECTED</h2>
        
        <p><strong>Action Required:</strong> Call this customer immediately!</p>
        
        ${userPhone ? `<p><strong>📞 Customer Phone:</strong> <a href="tel:${userPhone}" style="font-size: 18px; color: #d97706;">${userPhone}</a></p>` : '<p><strong>⚠️ Phone number not provided yet</strong></p>'}
        
        <h3>Conversation Context:</h3>
        <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #d97706; white-space: pre-wrap;">
${conversationText}
        </div>
        
        <hr>
        <p style="color: #6b7280;"><em>Sent from Rex Security AI Assistant - ${new Date().toLocaleString()}</em></p>
        <p style="color: #6b7280;"><em>This customer showed high buying intent. Contact immediately for best conversion rate.</em></p>
      `;

      await sendEmail({
        to: process.env.HR_EMAIL!,
        subject: emailSubject,
        html: emailBody,
      });

      return NextResponse.json({
        success: true,
        message: 'High interest alert sent to operations team'
      });

    } else if (type === 'hr_contact') {
      const emailSubject = '📧 HR Inquiry from Website Chat';
      const emailBody = `
        <h2 style="color: #d97706;">HR/Employment Inquiry</h2>
        
        ${userPhone ? `<p><strong>📞 Customer Phone:</strong> ${userPhone}</p>` : ''}
        
        <h3>Conversation Context:</h3>
        <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #d97706; white-space: pre-wrap;">
${conversationText}
        </div>
        
        <hr>
        <p style="color: #6b7280;"><em>Sent from Rex Security AI Assistant - ${new Date().toLocaleString()}</em></p>
      `;

      await sendEmail({
        to: process.env.HR_EMAIL!,
        subject: emailSubject,
        html: emailBody,
      });

      return NextResponse.json({
        success: true,
        message: 'HR inquiry forwarded'
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid contact type'
    }, { status: 400 });

  } catch (error) {
    console.error('Auto-contact error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}