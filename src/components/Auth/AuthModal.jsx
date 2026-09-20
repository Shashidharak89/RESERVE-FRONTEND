import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff, Cloud, Folder, Share2 } from 'lucide-react';
import Footer from '../Layout/Footer';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await api.login(email, password);
      } else {
        await api.register(name, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/shared');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page-content">
        {/* Left: Hero Section */}
        <div className="auth-hero-section">
          <div className="auth-hero-inner">
            <div className="auth-hero-brand">
              <img src="/Reserve-logo.png" alt="Reserve" className="auth-hero-logo" />
              <span className="auth-hero-title">Reserve</span>
              <span className="auth-hero-badge">Vault</span>
            </div>

            <h1 className="auth-hero-heading">
              Your files,<br />
              <span className="auth-hero-highlight">secured & accessible.</span>
            </h1>

            <p className="auth-hero-desc">
              A powerful cloud file management platform. Store, organize, and share 
              your documents with military-grade security and lightning-fast delivery.
            </p>

            <div className="auth-hero-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Cloud size={18} />
                </div>
                <div>
                  <strong>Cloud Storage</strong>
                  <p>Powered by Cloudinary CDN for global delivery</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Folder size={18} />
                </div>
                <div>
                  <strong>Smart Organization</strong>
                  <p>Nested folders with drag-and-drop management</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Share2 size={18} />
                </div>
                <div>
                  <strong>Instant Sharing</strong>
                  <p>Share files publicly or keep them private</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="auth-hero-glow"></div>
          <div className="auth-hero-glow-2"></div>
        </div>

        {/* Right: Auth Form */}
        <div className="auth-form-section">
          <div className="auth-card-new">
            <div className="auth-card-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Sign in to access your personal vault' : 'Start storing & sharing your files securely'}</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-switch-section">
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            <div className="auth-divider-row">
              <span className="auth-divider-line"></span>
              <span className="auth-divider-text">or</span>
              <span className="auth-divider-line"></span>
            </div>

            <button type="button" className="btn-secondary auth-skip-btn" onClick={handleSkip}>
              <Share2 size={16} />
              <span>Continue without signing in</span>
            </button>

            <div className="auth-security-badge-new">
              <ShieldCheck size={15} />
              <span>Secured with JWT & End-to-End Encryption</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
