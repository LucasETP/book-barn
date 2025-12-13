import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  if (!currentUser) {
    return children;
  }

  return (
    <div className="min-h-screen bg-barn-cream">
      {/* Header */}
      <header className="bg-barn-brown text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              📚 Book Barn
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`hover:text-barn-light transition-colors ${isActive('/') ? 'text-barn-light font-semibold' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`hover:text-barn-light transition-colors ${isActive('/search') ? 'text-barn-light font-semibold' : ''}`}
              >
                Search
              </Link>
              <Link
                to="/shelves"
                className={`hover:text-barn-light transition-colors ${isActive('/shelves') ? 'text-barn-light font-semibold' : ''}`}
              >
                My Shelves
              </Link>
              {userProfile?.isTeacher && (
                <Link
                  to="/admin"
                  className={`hover:text-barn-light transition-colors ${isActive('/admin') ? 'text-barn-light font-semibold' : ''}`}
                >
                  Teacher View
                </Link>
              )}
              <Link
                to={`/profile/${currentUser.uid}`}
                className="flex items-center gap-2 hover:text-barn-light transition-colors"
              >
                <img
                  src={userProfile?.photoURL || '/default-avatar.png'}
                  alt={userProfile?.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden lg:inline">{userProfile?.displayName}</span>
              </Link>
              <button
                onClick={logout}
                className="btn-secondary text-sm"
              >
                Sign Out
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 space-y-2">
              <Link
                to="/"
                className="block py-2 hover:text-barn-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/search"
                className="block py-2 hover:text-barn-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                to="/shelves"
                className="block py-2 hover:text-barn-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Shelves
              </Link>
              {userProfile?.isTeacher && (
                <Link
                  to="/admin"
                  className="block py-2 hover:text-barn-light"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Teacher View
                </Link>
              )}
              <Link
                to={`/profile/${currentUser.uid}`}
                className="block py-2 hover:text-barn-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left py-2 hover:text-barn-light"
              >
                Sign Out
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-barn-brown text-white shadow-lg">
        <div className="flex justify-around items-center py-2">
          <Link
            to="/"
            className={`flex flex-col items-center py-2 px-4 ${isActive('/') ? 'text-barn-light' : ''}`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link
            to="/search"
            className={`flex flex-col items-center py-2 px-4 ${isActive('/search') ? 'text-barn-light' : ''}`}
          >
            <span className="text-xl">🔍</span>
            <span className="text-xs">Search</span>
          </Link>
          <Link
            to="/shelves"
            className={`flex flex-col items-center py-2 px-4 ${isActive('/shelves') ? 'text-barn-light' : ''}`}
          >
            <span className="text-xl">📖</span>
            <span className="text-xs">Shelves</span>
          </Link>
          <Link
            to={`/profile/${currentUser.uid}`}
            className={`flex flex-col items-center py-2 px-4 ${isActive(`/profile/${currentUser.uid}`) ? 'text-barn-light' : ''}`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;

