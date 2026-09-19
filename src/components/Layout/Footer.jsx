import React from 'react';
import { ShieldCheck, Heart, Code, Cloud, Server, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-brand">
            <img src="/Reserve-logo.png" alt="Reserve Logo" className="footer-logo-img" />
            <span className="footer-title">Reserve</span>
          </div>
          <p className="footer-description">
            Personal File Management System powered by Spring Boot, PostgreSQL & Cloudinary.
          </p>
        </div>

        <div className="footer-tech-stack">
          <span className="tech-badge"><Server size={14} /> Spring Boot 3</span>
          <span className="tech-badge"><Database size={14} /> PostgreSQL (Neon)</span>
          <span className="tech-badge"><Cloud size={14} /> Cloudinary CDN</span>
          <span className="tech-badge"><ShieldCheck size={14} /> JWT Auth</span>
        </div>

        <div className="footer-right">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} Reserve. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
