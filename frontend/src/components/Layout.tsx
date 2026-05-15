import { Outlet } from 'react-router';
import Footer from './Footer';
import Navbar from './Navbar';

// Wrap each page with the shared navbar and footer
function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
