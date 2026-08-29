import './Footer.css';
import Logo from '../assets/logo.png'
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-content">
        <div>
          <img src={Logo} alt="logo" className='footer-logo'/>
          <h2 className="footer-headline">Build worlds, publish chapters, and shape stories together.</h2>
        </div>

        <div className="footer-meta">
          <span>Dark glass interface</span>
          <span>Responsive layout</span>
          <span>Inspired by anime-streaming energy</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
