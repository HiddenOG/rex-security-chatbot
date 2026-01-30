export const REX_KNOWLEDGE = {
  company: {
    name: "Rex Security Patrol Inc",
    address: "2500 Wilcrest Drive, Suite 371, Houston, TX 77042",
    president: "Yusuf Abu",
    hr: "Tyra Salisbury",
    hrPhone: "832-684-3621",
    officePhone: "832-690-5813",
    email: "rexllc24@gmail.com",
    altEmail: "rexllc24@yahoo.com",
    website: "https://Rexsecuritypatrols.com"
  },
  services: [
    "Unarmed Security Guards",
    "Armed Security Guards",
    "Mobile Patrol Services",
    "Residential & HOA Security",
    "Commercial Property Security",
    "Construction Site Security",
    "Event & Crowd Control Security",
    "Access Control / Front Desk Security",
    "Parking Lot & Perimeter Patrol"
  ],
  pricing: {
    unarmed: "starting at $20 per officer/hour",
    armed: "starting at $20 per officer/hour",
    mobilePatrol: "mobile patrol rental options; $600 monthly",
    event: " $350 per officer up to 5hrs (overtimerate applies)"
  },
  coverage: [
    "Houston Metro Area",
    "Westchase",
    "Katy",
    "Sugar Land",
    "Cypress",
    "Downtown Houston"
  ],
  hours: {
    office: "Monday–Friday | 9:00 AM – 5:00 PM",
    operations: "24 Hours / 7 Days a Week"
  }
};

export const SYSTEM_PROMPT = `You are the official virtual assistant for Rex Security Patrol Inc, a professional security services company in Houston, Texas.

**Your Role:**
- Answer questions about security services, pricing, coverage areas, and company information
- Maintain a professional, calm, and confident tone
- Never make up information - only use the provided context
- Detect when users show serious buying intent and offer to email the HR

**Company Context:**
${JSON.stringify(REX_KNOWLEDGE, null, 2)}

**CRITICAL - Intent Detection:**
You MUST detect when users show HIGH BUYING INTENT and include special markers in your response:

HIGH INTENT SIGNALS:
- User requests immediate/urgent service
- User asks for formal proposal/quote
- User wants to schedule security coverage
- User mentions specific dates/times they need service
- User asks "how do I get started" or "when can you start"
- User discusses budget or payment
- User provides specific property details (address, size, etc.)

When you detect HIGH INTENT, include this EXACT marker at the end of your response:
[INTENT:HIGH_INTEREST]

When user wants to contact HR or apply for job, include:
[INTENT:HR_CONTACT]

**Rules:**
1. NEVER share personal guard information
2. NEVER give exact live schedules or sensitive operational details
3. Always offer to connect complex inquiries to HR or Operations
4. Be helpful but professional - no casual slang
5. For employment/hiring questions, direct to HR contact
6. For quotes, provide indicative rates and offer formal proposal via Operations
7. Do not drop numbers or email of HR unless user specifically and directly asks for it
8. Only offer to contact HR directly by yourself without dropping any contact

**Response Style:**
- Clear and direct
- Professional but friendly
- Use bullet points for lists
- Include relevant contact info when appropriate`;

export const generateSimulatedResponse = (userMessage: string): string | null => {
  const msg = userMessage.toLowerCase();
  
  // HR & Employment
  if (msg.includes('job') || msg.includes('hire') || msg.includes('apply') || msg.includes('employment') || msg.includes('hr')) {
    return `For hiring or employment verification, you may contact our HR department:\n\n📞 Phone: ${REX_KNOWLEDGE.company.hrPhone}\n📧 Email: ${REX_KNOWLEDGE.company.email}\n\nHR Manager: ${REX_KNOWLEDGE.company.hr}\nOffice Hours: ${REX_KNOWLEDGE.hours.office}\n\n[INTENT:HR_CONTACT]`;
  }
  
  // High intent keywords
  const highIntentKeywords = [
    'need security now', 'urgent', 'emergency', 'asap', 'immediately',
    'when can you start', 'how do i get started', 'send proposal',
    'formal quote', 'i want to hire', 'book', 'schedule', 'reserve'
  ];
  
  const hasHighIntent = highIntentKeywords.some(keyword => msg.includes(keyword));
  
  // Quote Request with high intent
  if (msg.includes('quote') || msg.includes('price') || msg.includes('cost') || msg.includes('rate')) {
    const intentMarker = hasHighIntent ? '\n\n[INTENT:HIGH_INTEREST]' : '';
    return `**Security Service Rates (Indicative):**\n\n• Unarmed Guard: ${REX_KNOWLEDGE.pricing.unarmed}\n• Armed Guard: ${REX_KNOWLEDGE.pricing.armed}\n• Mobile Patrol: ${REX_KNOWLEDGE.pricing.mobilePatrol}\n• Event Security: ${REX_KNOWLEDGE.pricing.event}\n\nWould you like me to connect you with our operations team for a formal proposal?${intentMarker}`;
  }
  
  // Coverage Areas
  if (msg.includes('area') || msg.includes('location') || msg.includes('cover') || msg.includes('where')) {
    return `**Coverage Areas:**\n\n${REX_KNOWLEDGE.coverage.map(area => `• ${area}`).join('\n')}\n\nWe also serve surrounding suburbs upon request. Available 24/7 across all locations.`;
  }
  
  // Contact Info (simple queries)
  if ((msg.includes('contact') || msg.includes('phone') || msg.includes('call')) && msg.split(' ').length < 5) {
    return `**Contact Rex Security Patrol Inc:**\n\n📍 ${REX_KNOWLEDGE.company.address}\n\n📞 Operations: ${REX_KNOWLEDGE.company.officePhone}\n📞 HR: ${REX_KNOWLEDGE.company.hrPhone}\n📧 ${REX_KNOWLEDGE.company.email}\n\n🕐 Office Hours: ${REX_KNOWLEDGE.hours.office}\n🕐 Security Operations: ${REX_KNOWLEDGE.hours.operations}`;
  }
  
  // Return null to trigger Gemini for complex queries
  return null;
};

// NEW: Extract intent from AI response
export const extractIntent = (response: string): {
  intent: 'high_interest' | 'hr_contact' | 'none';
  cleanResponse: string;
} => {
  if (response.includes('[INTENT:HIGH_INTEREST]')) {
    return {
      intent: 'high_interest',
      cleanResponse: response.replace('[INTENT:HIGH_INTEREST]', '').trim()
    };
  }
  
  if (response.includes('[INTENT:HR_CONTACT]')) {
    return {
      intent: 'hr_contact',
      cleanResponse: response.replace('[INTENT:HR_CONTACT]', '').trim()
    };
  }
  
  return {
    intent: 'none',
    cleanResponse: response
  };
};
