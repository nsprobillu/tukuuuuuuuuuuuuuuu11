import React, { useState, useEffect } from 'react';
import {
  Mail, Shield, Clock, Globe, CheckCircle, Zap, RefreshCw, Copy,
  Loader, Inbox, Trash2, Archive, Star, QrCode, AlertTriangle,
  ExternalLink, ArrowRight // Add ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { PublicLayout } from '../components/PublicLayout';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

// Storage keys
const STORAGE_KEYS = {
  TEMP_EMAIL: 'boomlify_temp_email',
  SELECTED_DOMAIN: 'boomlify_selected_domain'
};

// Pre-define static content for faster loading
const STATIC_CONTENT = {
  title: "Free Temporary Email Generator - Create Instant Disposable Email | Boomlify",
  description: "Generate free temporary email addresses instantly. No registration required. Protect your privacy with disposable email addresses that last up to 48 hours.",
  schema: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Boomlify Temporary Email Generator",
    "applicationCategory": "Email Service",
    "description": "Generate free temporary email addresses instantly. No registration required. Protect your privacy with disposable email addresses that last up to 48 hours.",
    "operatingSystem": "All",
    "url": "https://boomlify.com/temp-mail-instant",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Instant email generation",
      "48-hour validity",
      "No registration required",
      "Spam protection",
      "Real-time email updates"
    ]
  }
};

interface Domain {
  id: string;
  domain: string;
}

interface TempEmail {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
}

interface ReceivedEmail {
  id: string;
  from_email: string;
  subject: string;
  body_html: string;
  body_text: string;
  received_at: string;
  temp_email: string;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

function QRModal({ isOpen, onClose, email }: QRModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4 break-all">
          QR Code for {email}
        </h3>
        <div className="flex justify-center mb-4">
          <QRCodeSVG
            value={email}
            size={Math.min(window.innerWidth - 80, 200)}
            className="w-full max-w-[200px]"
          />
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <Copy className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );
}

function EmptyInboxContent() {
  return (
    <div className="space-y-12">
      {/* How to use section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How to use temporary email?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#4A90E2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#4A90E2] font-semibold">1</span>
            </div>
            <p className="text-gray-600">
              Copy email address from the top left corner
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#4A90E2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#4A90E2] font-semibold">2</span>
            </div>
            <p className="text-gray-600">
              Use this to sign up on websites, social media, etc
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#4A90E2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#4A90E2] font-semibold">3</span>
            </div>
            <p className="text-gray-600">
              Read incoming emails on this page in the left side
            </p>
          </div>
        </div>
      </div>

      {/* What is disposable email section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          What is disposable temporary email?
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto text-center">
          <span className="font-semibold">Disposable temporary email</span> protects your real email address from spam, advertising mailings, malwares. It's anonymous and free. This email has a limited lifetime period: if this email will not receive messages due to some time — it will be removed. Sometimes disposable email is also called <span className="text-gray-700">"throwaway email"</span>, <span className="text-gray-700">"10 minute mail"</span>, <span className="text-gray-700">"tempmail"</span>, <span className="text-gray-700">"trash mail"</span> and <span className="text-gray-700">"fake mail"</span>.
        </p>
      </div>

      {/* Features section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Protect Your Privacy with Boomlify Temp Mail
        </h2>
        <p className="text-gray-600 mb-8">
          Your secure gateway to anonymous online communication. Generate unlimited disposable email addresses instantly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <Shield className="w-12 h-12 text-[#4A90E2] mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Privacy Protection
            </h3>
            <p className="text-gray-600">
              Keep your real email private and protect yourself from spam and data breaches.
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <Zap className="w-12 h-12 text-[#4A90E2] mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Instant Access
            </h3>
            <p className="text-gray-600">
              No registration required. Generate temporary email addresses instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TempMailInstant() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [tempEmail, setTempEmail] = useState<TempEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');
  const [qrModal, setQRModal] = useState({ isOpen: false, email: '' });

  // Load saved email on mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        // First fetch available domains
        const domainsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/domains/public`);
        const availableDomains = domainsResponse.data;

        if (!availableDomains || availableDomains.length === 0) {
          throw new Error('No domains available');
        }

        setDomains(availableDomains);
        setSelectedDomain(availableDomains[0]);

        // Try to load saved email
        const savedEmail = localStorage.getItem(STORAGE_KEYS.TEMP_EMAIL);
        const savedDomain = localStorage.getItem(STORAGE_KEYS.SELECTED_DOMAIN);

        if (savedEmail && savedDomain) {
          const emailData = JSON.parse(savedEmail);
          const domainData = JSON.parse(savedDomain);

          // Check if the email is still valid
          const expiryDate = new Date(emailData.expires_at);
          if (expiryDate > new Date()) {
            setTempEmail(emailData);
            setSelectedDomain(domainData);
            await fetchEmails(emailData.email);
          } else {
            // Clear expired email and generate new one
            localStorage.removeItem(STORAGE_KEYS.TEMP_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.SELECTED_DOMAIN);
            await generateEmail(availableDomains[0]);
          }
        } else {
          // No saved email, generate new one
          await generateEmail(availableDomains[0]);
        }
      } catch (error: any) {
        console.error('Error loading saved email:', error);
        setError(error.response?.data?.error || 'Failed to initialize email service');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedEmail();
  }, []);

  const generateEmail = async (domain: Domain) => {
    if (!domain) {
      setError('No domain selected');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const randomPrefix = Math.random().toString(36).substring(2, 8);
      const fullEmail = `${randomPrefix}@${domain.domain}`;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/emails/public/create`,
        {
          email: fullEmail,
          domainId: domain.id
        }
      );

      if (!response.data) {
        throw new Error('Failed to create email');
      }

      // Save email and domain to localStorage
      localStorage.setItem(STORAGE_KEYS.TEMP_EMAIL, JSON.stringify(response.data));
      localStorage.setItem(STORAGE_KEYS.SELECTED_DOMAIN, JSON.stringify(domain));

      setTempEmail(response.data);
      setSelectedDomain(domain);
      setReceivedEmails([]);
      setSelectedEmail(null);
    } catch (error: any) {
      console.error('Failed to generate email:', error);
      setError(error.response?.data?.error || 'Failed to create email address');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmails = async (email: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/emails/public/${email}`);
      setReceivedEmails(response.data || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && tempEmail?.email) {
      fetchEmails(tempEmail.email);
      interval = setInterval(() => fetchEmails(tempEmail.email), 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, tempEmail]);

  const handleDomainChange = (domainId: string) => {
    const newDomain = domains.find(d => d.id === domainId);
    if (!newDomain) return;
    setSelectedDomain(newDomain);
  };

  const handleChangeEmail = async () => {
    if (!selectedDomain) return;
    await generateEmail(selectedDomain);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-[#4A90E2] mx-auto mb-4" />
            <p className="text-gray-600">Generating your temporary email...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Helmet>
        <title>{STATIC_CONTENT.title}</title>
        <meta name="description" content={STATIC_CONTENT.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://boomlify.com/temp-mail-instant" />
        <script type="application/ld+json">
          {JSON.stringify(STATIC_CONTENT.schema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Free Temporary Email Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create disposable email addresses instantly. Protect your privacy and avoid spam with our secure temporary email service.
            </p>
          </div>

          {/* Email Generation Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-mono truncate">{tempEmail?.email}</span>
                  <CopyButton text={tempEmail?.email || ''} />
                  <button
                    onClick={() => setQRModal({ isOpen: true, email: tempEmail?.email || '' })}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Show QR Code"
                  >
                    <QrCode className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center mt-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Valid until {new Date(tempEmail?.expires_at || '').toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedDomain?.id || ''}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                >
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      @{domain.domain}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleChangeEmail}
                  className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Change Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg ${
                    autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  } hover:bg-opacity-75 transition-colors`}
                  title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
                >
                  <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Inbox Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  <Inbox className="w-5 h-5 mr-2" />
                  Inbox
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {receivedEmails.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Your inbox is empty</p>
                      <p className="text-sm">Emails will appear here automatically</p>
                    </div>
                  ) : (
                    receivedEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedEmail?.id === email.id
                            ? 'bg-[#4A90E2]/10'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium truncate flex-1 text-gray-900">
                            {email.subject || 'No Subject'}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {new Date(email.received_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {email.from_email}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <div className="max-h-[600px] overflow-y-auto">
                  {selectedEmail ? (
                    <div>
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-xl font-semibold mb-2 text-gray-900">
                          {selectedEmail.subject || 'No Subject'}
                        </h2>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>From: {selectedEmail.from_email}</span>
                          <span>{new Date(selectedEmail.received_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        {selectedEmail.body_html ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedEmail.body_html
                            }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-gray-700">
                            {selectedEmail.body_text}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyInboxContent />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Banner - Moved here */}
          <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white py-4 my-8 rounded-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap justify-center gap-8">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Free: 48 hours</span>
                  </div>
                  <div className="flex items-center text-white/80">vs</div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    <span>Registered: 3+ months</span>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="bg-white text-[#4A90E2] px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
                >
                  Register Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table - Moved here */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              Why Register for a Free Account?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300">
                <Clock className="w-12 h-12 text-[#4A90E2] mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Extended Validity</h3>
                <p className="text-gray-600 mb-4">Emails last 3+ months instead of 48 hours</p>
                <div className="text-[#4A90E2] font-bold">Premium Feature</div>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300">
                <Mail className="w-12 h-12 text-[#4A90E2] mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Unlimited Addresses</h3>
                <p className="text-gray-600 mb-4">Create as many addresses as you need</p>
                <div className="text-[#4A90E2] font-bold">Premium Feature</div>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300">
                <Shield className="w-12 h-12 text-[#4A90E2] mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Custom Usernames</h3>
                <p className="text-gray-600 mb-4">Choose your preferred email usernames</p>
                <div className="text-[#4A90E2] font-bold">Premium Feature</div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/register"
                className="inline-flex items-center bg-[#4A90E2] text-white px-8 py-3 rounded-lg hover:bg-[#357ABD] transition-colors"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <p className="mt-2 text-gray-500">No credit card required • Cancel anytime</p>
            </div>
          </div>

          {/* Rest of the content remains the same */}
        </div>
      </div>

      {/* QR Code Modal */}
      <QRModal
        isOpen={qrModal.isOpen}
        onClose={() => setQRModal({ isOpen: false, email: '' })}
        email={qrModal.email}
      />

      {/* Floating Reminder Button */}
      <div className="fixed bottom-4 right-4 z-50 animate-bounce hover:animate-none">
        <Link
          to="/register"
          className="bg-[#4A90E2] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#357ABD] transition-colors flex items-center group"
        >
          <Star className="w-5 h-5 mr-2" />
          <span className="hidden group-hover:inline">Get 3+ Months Free</span>
          <span className="inline group-hover:hidden">Upgrade Free</span>
        </Link>
      </div>
    </PublicLayout>
  );
}