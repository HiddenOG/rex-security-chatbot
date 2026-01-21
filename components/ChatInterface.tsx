'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Menu, Plus, MessageSquare, Trash2, Phone, Mail, MapPin } from 'lucide-react';


const SUGGESTED_PROMPTS = [
  "Request a security quote",
  "What areas do you cover?",
  "Do you offer armed guards?",
  "How fast can service start?",
  "I need construction site security",
  "I want to speak with HR"
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'New Conversation',
      messages: [
        { 
          role: 'assistant', 
          content: '🦁 Welcome to Rex Security Patrol Inc.\n\nHow can we assist you today — security services, pricing, coverage areas, or employment inquiries?' 
        }
      ],
      timestamp: new Date()
    }
  ]);
  const [mounted, setMounted] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'call'>('email');
  const [showCallButton, setShowCallButton] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<'high_interest' | 'hr_contact' | 'none'>('none');
  const [userProvidedPhone, setUserProvidedPhone] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [showCallConfirm, setShowCallConfirm] = useState(false);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [
        { 
          role: 'assistant', 
          content: '🦁 Welcome to Rex Security Patrol Inc.\n\nHow can we assist you today — security services, pricing, coverage areas, or employment inquiries?' 
        }
      ],
      timestamp: new Date()
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setShowSuggestions(true);
  };

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) {
      setConversations([{
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [
          { 
            role: 'assistant', 
            content: '🦁 Welcome to Rex Security Patrol Inc.\n\nHow can we assist you today — security services, pricing, coverage areas, or employment inquiries?' 
          }
        ],
        timestamp: new Date()
      }]);
      setCurrentConversationId(Date.now().toString());
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(conversations.find(c => c.id !== id)?.id || conversations[0].id);
    }
  };

  const updateConversationTitle = (conversationId: string, userMessage: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId && conv.title === 'New Conversation') {
        return {
          ...conv,
          title: userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '')
        };
      }
      return conv;
    }));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    
    const phoneRegex = /\b\d{10,11}\b/;
    const phoneMatch = input.match(phoneRegex);
    if (phoneMatch) {
      setUserProvidedPhone(phoneMatch[0]);
    }
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          timestamp: new Date()
        };
      }
      return conv;
    }));

    if (currentConversation?.messages.length === 1) {
      updateConversationTitle(currentConversationId, input);
    }

    setInput('');
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response
      };
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, aiMessage]
          };
        }
        return conv;
      }));

      if (data.intent === 'high_interest') {
        setDetectedIntent('high_interest');
        setShowCallButton(true);

        await fetch('/api/auto-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'high_interest',
            conversationHistory: [...currentConversation!.messages, userMessage, aiMessage],
            userPhone: userProvidedPhone
          })
        });
        
      } else if (data.intent === 'hr_contact') {
        setDetectedIntent('hr_contact');

        await fetch('/api/auto-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'hr_contact',
            conversationHistory: [...currentConversation!.messages, userMessage, aiMessage],
            userPhone: userProvidedPhone
          })
        });
        
        setTimeout(() => {
          setShowContactForm(true);
        }, 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, {
              role: 'assistant',
              content: 'I apologize, but I\'m having trouble connecting. Please call us directly at 832-690-5813.'
            }]
          };
        }
        return conv;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contactType,
          ...contactForm,
          confirmed: !showCallConfirm
        })
      });

      const data = await response.json();

      if (data.needsConfirmation) {
        setShowCallConfirm(true);
        return;
      }

      if (data.success) {
        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, {
                role: 'assistant',
                content: data.message
              }]
            };
          }
          return conv;
        }));
        setShowContactForm(false);
        setShowCallConfirm(false);
        setContactForm({ name: '', email: '', phone: '', message: '' });
      }

    } catch (error) {
      console.error('Contact error:', error);
      alert('Failed to send message. Please try again or call us directly.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-neutral-900 border-r border-yellow-600/20 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-yellow-600/20 flex items-center justify-between">
          <button
            onClick={createNewConversation}
            className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-600/30"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`group relative rounded-xl p-3 cursor-pointer transition-all ${
                currentConversationId === conv.id
                  ? 'bg-yellow-600/20 border border-yellow-600/40'
                  : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
              }`}
              onClick={() => {
                setCurrentConversationId(conv.id);
                setShowSuggestions(conv.messages.length === 1);
              }}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-yellow-100 truncate font-medium">{conv.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {conv.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-yellow-600/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-600/40 overflow-hidden">
              <img 
                src="https://static.vecteezy.com/system/resources/previews/002/007/732/original/golden-lion-head-sign-free-vector.jpg" 
                alt="Rex Security Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-500 font-bold">Rex Security</p>
              <p className="text-xs text-neutral-400">Professional Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-black via-neutral-900 to-black">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-yellow-600/20 p-4 shadow-lg shadow-yellow-900/10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-yellow-500 hover:text-yellow-400 transition-colors p-2 hover:bg-yellow-600/10 rounded-lg"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-yellow-500 via-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-2xl shadow-yellow-600/50 overflow-hidden">
                  <img 
                    src="https://static.vecteezy.com/system/resources/previews/002/007/732/original/golden-lion-head-sign-free-vector.jpg" 
                    alt="Rex Security Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  Rex Security Patrol Inc
                </h1>
                <p className="text-sm text-yellow-600/80">Professional Security Services • Houston, TX</p>
              </div>

              <div className="hidden md:flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">24/7 Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-4 duration-300`}
              >
                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-yellow-700 to-yellow-600 shadow-lg shadow-yellow-700/30' 
                    : 'bg-gradient-to-br from-yellow-500 to-yellow-400 shadow-lg shadow-yellow-500/30 overflow-hidden'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="text-black text-[10px] md:text-xs font-bold">You</span>
                  ) : (
                    <img 
                      src="https://static.vecteezy.com/system/resources/previews/002/007/732/original/golden-lion-head-sign-free-vector.jpg" 
                      alt="Rex Security"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className={`flex-1 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-3 py-2.5 md:px-5 md:py-3.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-yellow-700 to-yellow-600 text-white shadow-lg shadow-yellow-700/20'
                      : 'bg-neutral-900 text-yellow-50 border border-yellow-600/30 shadow-lg shadow-yellow-900/10'
                  }`}>
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                  <span className="text-[10px] md:text-xs text-neutral-600 mt-1 md:mt-1.5 px-2">
                    {mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 md:gap-3 animate-in slide-in-from-bottom-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-500 to-yellow-400 shadow-lg shadow-yellow-500/30 overflow-hidden">
                  <img 
                    src="https://static.vecteezy.com/system/resources/previews/002/007/732/original/golden-lion-head-sign-free-vector.jpg" 
                    alt="Rex Security"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-neutral-900 rounded-2xl px-3 py-2.5 md:px-5 md:py-3.5 border border-yellow-600/30">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && messages.length === 1 && (
              <div className="space-y-3 animate-in fade-in-50 duration-500">
                <p className="text-xs md:text-sm text-neutral-500 text-center">Quick questions you can ask:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setInput(prompt); setShowSuggestions(false); }}
                      className="bg-neutral-900 hover:bg-neutral-800 border border-yellow-600/20 hover:border-yellow-600/40 text-yellow-100 text-xs md:text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition-all hover:scale-[1.02] text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-yellow-500/30 rounded-2xl p-4 md:p-6 max-w-md w-full shadow-2xl shadow-yellow-900/20 animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-yellow-500">Contact HR</h3>
                <button onClick={() => setShowContactForm(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setContactType('email')}
                  className={`flex-1 px-3 md:px-4 py-2 rounded-lg transition-all text-sm ${
                    contactType === 'email' 
                      ? 'bg-yellow-500 text-black font-semibold' 
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </button>
                <button
                  onClick={() => setContactType('call')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    contactType === 'call' 
                      ? 'bg-yellow-500 text-black font-semibold' 
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Call Me
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name *"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-2.5 md:py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-yellow-600/40 text-sm"
                />
                
                {contactType === 'email' && (
                  <input
                    type="email"
                    placeholder="Your Email *"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="w-full bg-neutral-800 border border-yellow-500/30 rounded-lg px-4 py-2.5 text-yellow-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                )}

                {contactType === 'call' && (
                  <input
                    type="tel"
                    placeholder="Your Phone Number *"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full bg-neutral-800 border border-yellow-500/30 rounded-lg px-4 py-2.5 text-yellow-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                )}

                <textarea
                  placeholder="Your Message *"
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  className="w-full bg-neutral-800 border border-yellow-500/30 rounded-lg px-4 py-2.5 text-yellow-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />

                {showCallConfirm && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs md:text-sm text-yellow-300">
                      ⚠️ We'll call you at <strong>{contactForm.phone}</strong> during business hours (Mon-Fri, 9 AM - 5 PM). Confirm?
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-yellow-600/40"
                >
                  {showCallConfirm ? 'Confirm Call Request' : contactType === 'call' ? 'Request Call' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Call Button (appears when high intent detected) */}
        {showCallButton && (
          <div className="fixed bottom-20 md:bottom-24 left-4 right-4 md:left-auto md:right-8 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 md:p-4 rounded-2xl shadow-2xl shadow-green-600/50 max-w-sm md:ml-auto">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Phone className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs md:text-sm mb-1">Ready to get started?</p>
                  <p className="text-[10px] md:text-xs opacity-90 mb-2 md:mb-3">Our team has been notified and will call you shortly!</p>
                  <a
                    href="tel:832-690-5813"
                    className="block w-full bg-white text-green-600 font-bold py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-center hover:bg-green-50 transition-all text-xs md:text-sm"
                  >
                    Call Now: 832-690-5813
                  </a>
                  {!userProvidedPhone && (
                    <p className="text-[10px] md:text-xs opacity-75 mt-2">Or provide your number and we will call you!</p>
                  )}
                </div>
                <button
                  onClick={() => setShowCallButton(false)}
                  className="text-white/80 hover:text-white flex-shrink-0"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        

        {/* Quick Contact Bar */}
        <div className="bg-neutral-900/80 backdrop-blur-sm border-t border-yellow-600/20 px-2 md:px-4 py-2 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 md:gap-4 text-[10px] md:text-xs text-neutral-500">
            <div className="flex items-center gap-1 md:gap-1.5">
              <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-600" />
              <span className="truncate">832-690-5813</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-600" />
              <span className="truncate">rexllc24@gmail.com</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-600" />
              <span>Houston, TX</span>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-black/80 backdrop-blur-xl border-t border-yellow-600/20 p-3 md:p-4 shadow-lg shadow-yellow-900/10 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about our security services..."
                  className="w-full bg-neutral-900 border border-yellow-600/30 rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base text-yellow-50 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all"
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-neutral-800 disabled:to-neutral-700 disabled:cursor-not-allowed text-black font-bold p-3 md:p-4 rounded-2xl shadow-lg shadow-yellow-600/40 hover:shadow-yellow-500/60 transition-all transform hover:scale-105 disabled:scale-100 flex-shrink-0"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <p className="text-[10px] md:text-xs text-neutral-600 text-center mt-2">
              Licensed • Reliable • Professional Security Services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

