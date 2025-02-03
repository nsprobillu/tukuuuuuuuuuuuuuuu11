import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Loader, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface Email {
  id: string;
  from_email: string;
  subject: string;
  body_html: string;
  body_text: string;
  received_at: string;
  temp_email: string;
}

export function AdminOnlyBoom() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add the full API URL here
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/emails/admin/all`, {
        headers: {
          'Admin-Access': 'esrattormarechudifuck'
        }
      });
      
      console.log('Fetched emails:', response.data);
      setEmails(response.data);
    } catch (err: any) {
      console.error('Failed to fetch emails:', err);
      setError(err.response?.data?.error || 'Failed to fetch emails');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('adminAuth');
    if (storedAuth === 'esrattormarechudifuck') {
      setIsAuthorized(true);
      fetchEmails();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isAuthorized) {
      interval = setInterval(fetchEmails, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isAuthorized]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase === 'esrattormarechudifuck') {
      sessionStorage.setItem('adminAuth', passphrase);
      setIsAuthorized(true);
      fetchEmails();
    } else {
      setError('Invalid passphrase');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <form onSubmit={handleAuth} className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access Required</h1>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 mb-4 focus:outline-none focus:border-blue-500"
            placeholder="Enter passphrase"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 transition-colors"
          >
            Access Admin Panel
          </button>
        </form>
      </div>
    );
  }

  if (isLoading && !emails.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Email Monitor</h1>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg ${
              autoRefresh ? 'bg-green-600' : 'bg-gray-700'
            } hover:opacity-80 transition-colors`}
            title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          >
            <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4 h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="space-y-2">
              {emails.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No emails received yet</p>
                </div>
              ) : (
                emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'bg-blue-900'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <p className="text-sm text-blue-300 mb-1">{email.temp_email}</p>
                    <h3 className="font-medium mb-1 truncate">
                      {email.subject || 'No Subject'}
                    </h3>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span className="truncate">{email.from_email}</span>
                      <span>{new Date(email.received_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 h-[calc(100vh-8rem)] overflow-y-auto">
            {selectedEmail ? (
              <div>
                <div className="border-b border-gray-700 pb-4 mb-4">
                  <h2 className="text-xl font-semibold mb-2">
                    {selectedEmail.subject || 'No Subject'}
                  </h2>
                  <div className="flex flex-col space-y-1 text-sm text-gray-400">
                    <p>To: {selectedEmail.temp_email}</p>
                    <p>From: {selectedEmail.from_email}</p>
                    <p>Received: {new Date(selectedEmail.received_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  {selectedEmail.body_html ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedEmail.body_html
                      }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">
                      {selectedEmail.body_text}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select an email to view its contents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}