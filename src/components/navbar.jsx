import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // set initial
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      backgroundColor: 'red',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      rounded: '10%',
      color: 'white',
    }}>
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          21xEngineers
        </Link>
      </div>

      {/* Hamburger button for mobile */}
      {isMobile ? (
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none',
          border: 'none',
          fontSize: '28px',
          cursor: 'pointer',
          color: 'white'
        }}>
          ☰
        </button>
      ) : null}

      {/* Navigation links */}
      <ul style={{
        display: isMobile ? (menuOpen ? 'flex' : 'none') : 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '20px' : '32px',
        position: isMobile ? 'absolute' : 'static',
        top: isMobile ? '70px' : undefined,
        right: isMobile ? '20px' : undefined,
        backgroundColor: isMobile ? 'white' : 'transparent',
        boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        padding: isMobile ? '20px' : 0,
        listStyle: 'none',
        margin: 0,
        transition: 'all 0.3s ease',
        borderRadius: '8px'
      }}>
        {['sketch-ai', 'products', 'contact'].map((page, idx) => (
          <li key={idx}>
            <Link 
              to={`/${page}`} 
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                textDecoration: 'none'
              }}
              onMouseEnter={e => e.target.style.color = '#3b82f6'}
              onMouseLeave={e => e.target.style.color = '#374151'}
              onClick={() => setMenuOpen(false)} // close on click mobile
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
