import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, Mail, Clock, Archive, QrCode, Settings, User, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { EmailSearch } from '../components/EmailSearch';
import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { CopyButton } from '../components/CopyButton';
import { QRCodeSVG } from 'qrcode.react';

interface ReceivedEmail {
  subject: string;
  received_at: string;
}

interface TempEmail {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  lastEmail?: ReceivedEmail;
}

interface Domain {
  id: string;
  domain: string;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
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

function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Password changed successfully');
      setTimeout(onClose, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring focus:ring-[#4A90E2] focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring focus:ring-[#4A90E2] focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring focus:ring-[#4A90E2] focus:ring-opacity-50"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempEmails, setTempEmails] = useState<TempEmail[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; emailId: string; email: string }>({
    isOpen: false,
    emailId: '',
    email: ''
  });
  const [qrModal, setQRModal] = useState<{ isOpen: boolean; email: string }>({
    isOpen: false,
    email: ''
  });
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { token, user, logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    fetchEmails();
    fetchDomains();
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(fetchEmails, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && !(event.target as Element).closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/emails`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const emailsWithLastMessage = await Promise.all(
        response.data.map(async (email: TempEmail) => {
          try {
            const lastEmailResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/emails/${email.id}/received`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
              ...email,
              lastEmail: lastEmailResponse.data[0] || null
            };
          } catch (error) {
            return email;
          }
        })
      );
      setTempEmails(emailsWithLastMessage);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/domains`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDomains(response.data);
      if (response.data.length > 0 && !selectedDomain) {
        setSelectedDomain(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const createEmail = async () => {
    try {
      if (!selectedDomain) {
        setError('Please select a domain');
        return;
      }

      const selectedDomainObj = domains.find(d => d.id === selectedDomain);
      if (!selectedDomainObj) {
        setError('Invalid domain selected');
        return;
      }

      const emailPrefix = newEmail.trim() || Math.random().toString(36).substring(2, 8);
      const fullEmail = `${emailPrefix}@${selectedDomainObj.domain}`;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/emails/create`,
        { 
          email: fullEmail,
          domainId: selectedDomain 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTempEmails([response.data, ...tempEmails]);
      setNewEmail('');
      setError('');
    } catch (error) {
      console.error('Create email error:', error);
      setError('Failed to create email');
    }
  };

  const confirmDelete = (id: string, email: string) => {
    setDeleteConfirmation({ isOpen: true, emailId: id, email });
  };

  const deleteEmail = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/emails/delete/${deleteConfirmation.emailId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTempEmails(tempEmails.filter(email => email.id !== deleteConfirmation.emailId));
      setDeleteConfirmation({ isOpen: false, emailId: '', email: '' });
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const handleArchive = async (emailId: string) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/emails/${emailId}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTempEmails(tempEmails.filter(email => email.id !== emailId));
    } catch (error) {
      console.error('Failed to archive email:', error);
    }
  };

  const filteredEmails = tempEmails.filter(email =>
    email.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEmails();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex flex-col space-y-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Your Temporary Emails
          </h1>
          <div className="relative profile-menu">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center space-x-2 p-2 rounded-lg ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } transition-colors`}
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">{user?.email}</span>
            </button>
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50`}>
                <button
                  onClick={() => {
                    setChangePasswordModal(true);
                    setShowProfileMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className={`block w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex w-full sm:w-auto">
            <input
              type="text"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter username (optional)"
              className={`w-48 rounded-l-lg border-r-0 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                isDark ? 'bg-gray-700 text-white border-gray-600' : ''
              }`}
            />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className={`rounded-r-lg border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                isDark ? 'bg-gray-700 text-white border-gray-600' : ''
              }`}
            >
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  @{domain.domain}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={createEmail}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4A90E2] hover:bg-[#357ABD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2 sm:mr-0 sm:hidden" />
            <span>Create</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <EmailSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Refresh emails"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {filteredEmails.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
          <Mail className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="mt-2 text-sm font-medium">No temporary emails</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchTerm ? 'No emails match your search.' : 'Get started by creating a new temporary email.'}
          </p>
        </div>
      ) : (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden sm:rounded-lg`}>
          <ul className="divide-y divide-gray-200">
            {filteredEmails.map((email) => (
              <Link 
                key={email.id}
                to={`/dashboard/email/${email.id}`}
                className={`block hover:bg-gray-50 transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          {email.email}
                        </p>
                        <CopyButton 
                          text={email.email} 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Expires {formatDate(email.expires_at)}
                        </span>
                        {email.lastEmail && (
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {email.lastEmail.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQRModal({ isOpen: true, email: email.email });
                        }}
                        className={`text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleArchive(email.id);
                        }}
                        className={`text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <Archive className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          confirmDelete(email.id, email.email);
                        }}
                        className={`text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </ul>
        </div>
      )}

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, emailId: '', email: '' })}
        onConfirm={deleteEmail}
        itemName={deleteConfirmation.email}
      />

      <QRModal
        isOpen={qrModal.isOpen}
        onClose={() => setQRModal({ isOpen: false, email: '' })}
        email={qrModal.email}
      />

      <ChangePasswordModal
        isOpen={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
      />
    </div>
  );
}