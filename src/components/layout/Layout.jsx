import Header from './Header';
import Footer from './Footer';
import Toast from '../ui/Toast';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        {children}
      </main>
      <Footer />
      <Toast />
    </div>
  );
};

export default Layout;
