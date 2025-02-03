import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Features } from './pages/Features';
import { Benefits } from './pages/Benefits';
import { HowItWorks } from './pages/HowItWorks';
import { FAQ } from './pages/FAQ';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { EmailView } from './pages/EmailView';
import { AdminPanel } from './pages/AdminPanel';
import { AdminOnlyBoom } from './pages/AdminOnlyBoom';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Cookies } from './pages/Cookies';
import { GDPR } from './pages/GDPR';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Careers } from './pages/Careers';
import { TempMailAdvanced } from './pages/TempMailAdvanced';
import { ProFeatures } from './pages/ProFeatures';
import { TempMailInstant } from './pages/TempMailInstant';

function App() {
  if (window.location.pathname === '/sitemap.xml') {
    return null;
  }

  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/benefits" element={<Benefits />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/temp-mail-advanced" element={<TempMailAdvanced />} />
          <Route path="/temp-mail-instant" element={<TempMailInstant />} />
          <Route path="/temp-mail-pro" element={<ProFeatures />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookie-policy" element={<Cookies />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/gdpr" element={<GDPR />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/adminonlyboom" element={<AdminOnlyBoom />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="email/:id" element={<EmailView />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;