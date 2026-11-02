import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/logo.png';

export default function Footer() {
  return <footer className="product-footer"><div className="product-footer-inner"><Link className="site-brand" to="/"><span className="brand-mark">N</span><span>NovelForge</span></Link><p>Stories worth staying up for.</p><div><Link to="/novels">Discover</Link><Link to="/community">Community</Link><Link to="/studio">Create</Link></div><small>© {new Date().getFullYear()} NovelForge</small></div></footer>;
}