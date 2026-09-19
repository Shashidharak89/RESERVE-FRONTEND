import React from 'react';
import { 
  Shield, Lock, Globe, Mail, Heart, 
  Cloud, Folder, Share2, Upload, 
  ExternalLink, ChevronRight 
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer-new">
      <div className="footer-wave-divider">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1350,30 1440,30 L1440,60 L0,60 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="footer-inner">
        {/* Top Section */}
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-col footer-col-brand">
            <div className="footer-brand-row">
              <img src="/Reserve-logo.png" alt="Reserve Logo" className="footer-logo-img-new" />
              <span className="footer-brand-name">Reserve</span>
              <span className="footer-vault-badge">Vault</span>
            </div>
            <p className="footer-brand-desc">
              Your secure, cloud-powered file management platform. 
              Store, organize, and share your files with confidence. 
              Built for speed, privacy, and simplicity.
            </p>
            <div className="footer-contact-row">
              <Mail size={15} />
              <a href="mailto:shashidharak334@gmail.com" className="footer-email-link">
                shashidharak334@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <a href="/my-files" className="footer-link">
                  <ChevronRight size={14} />
                  <Folder size={14} />
                  <span>My Files</span>
                </a>
              </li>
              <li>
                <a href="/shared" className="footer-link">
                  <ChevronRight size={14} />
                  <Share2 size={14} />
                  <span>Shared Uploads</span>
                </a>
              </li>
              <li>
                <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
                  <ChevronRight size={14} />
                  <Upload size={14} />
                  <span>Upload Files</span>
                </a>
              </li>
              <li>
                <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
                  <ChevronRight size={14} />
                  <Cloud size={14} />
                  <span>Cloud Storage</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Security & Privacy Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Security & Privacy</h4>
            <ul className="footer-info-list">
              <li>
                <Shield size={15} className="footer-info-icon" />
                <span>End-to-end encrypted transfers</span>
              </li>
              <li>
                <Lock size={15} className="footer-info-icon" />
                <span>JWT-based authentication</span>
              </li>
              <li>
                <Globe size={15} className="footer-info-icon" />
                <span>Cloudinary CDN-backed delivery</span>
              </li>
              <li>
                <Cloud size={15} className="footer-info-icon" />
                <span>Real-time WebSocket uploads</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Reserve. All rights reserved.
          </p>
          <p className="footer-made-with">
            Made with <Heart size={13} className="footer-heart-icon" /> by Shashidhara K
          </p>
        </div>
      </div>
    </footer>
  );
}
