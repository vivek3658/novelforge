import React from 'react'
import Logo from '../assets/logo.png'
import './Navbar.css'

const Navbar = () => {
  const navLinks = ()=>{
    return <ul id='nav-paths'>
          <li>Home</li>
          <li>Tranding</li>
          <li>Novels</li>
          <li>Category</li>
          <li>Community</li>
        </ul>;
  }
  return (
    <>
      <nav id='nav'>
        <img src={Logo} alt='logo' id='nav-logo'/>
        {navLinks()}
        <ul id='nav-links'>
          <li><Link id='nav-login' to='/login'>Log in</Link></li>
          <li><Link id='nav-signup' to='/login'>Sign Up</Link></li>
        </ul>
        
        {/* <h1 id='nav-title'>NovelForge</h1> */}
      </nav>
    </>
  );
}

export default Navbar
