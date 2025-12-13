import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import Shelves from './pages/Shelves';
import Profile from './pages/Profile';
import TeacherDashboard from './pages/TeacherDashboard';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { userProfile } = useAuth();
  
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <Search />
            </PrivateRoute>
          }
        />
        <Route
          path="/book/:bookId"
          element={
            <PrivateRoute>
              <BookDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/shelves"
          element={
            <PrivateRoute>
              <Shelves />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:userId?"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        {userProfile?.isTeacher && (
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
