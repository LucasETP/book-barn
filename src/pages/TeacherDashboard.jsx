import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTeacherStats } from '../services/users';
import { getBookDetails } from '../services/books';

const TeacherDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.isTeacher) return;

    const loadStats = async () => {
      try {
        const data = await getTeacherStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading teacher stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userProfile]);

  if (!userProfile?.isTeacher) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">Access denied. Teacher access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-barn-brown mb-6">Teacher Dashboard</h1>
        <div className="card animate-pulse h-64"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">Failed to load statistics.</p>
      </div>
    );
  }

  // Sort students by activity
  const sortedStudents = [...stats.students].sort((a, b) => {
    const aActivity = (a.stats?.booksRead || 0) + (a.stats?.reviewsWritten || 0);
    const bActivity = (b.stats?.booksRead || 0) + (b.stats?.reviewsWritten || 0);
    return bActivity - aActivity;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-barn-brown mb-6">Teacher Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-barn-brown">{stats.totalStudents}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Books Read</h3>
          <p className="text-3xl font-bold text-barn-brown">
            {stats.students.reduce((sum, s) => sum + (s.stats?.booksRead || 0), 0)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Reviews</h3>
          <p className="text-3xl font-bold text-barn-brown">
            {stats.students.reduce((sum, s) => sum + (s.stats?.reviewsWritten || 0), 0)}
          </p>
        </div>
      </div>

      {/* Most Active Readers */}
      <div className="card mb-6">
        <h2 className="text-2xl font-bold text-barn-brown mb-4">Most Active Readers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Student</th>
                <th className="text-left py-2">Books Read</th>
                <th className="text-left py-2">Reviews</th>
                <th className="text-left py-2">Currently Reading</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.slice(0, 10).map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="py-2">
                    <Link
                      to={`/profile/${student.id}`}
                      className="flex items-center gap-2 hover:text-barn-brown"
                    >
                      <img
                        src={student.photoURL || '/default-avatar.png'}
                        alt={student.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                      <span>{student.displayName}</span>
                    </Link>
                  </td>
                  <td className="py-2">{student.stats?.booksRead || 0}</td>
                  <td className="py-2">{student.stats?.reviewsWritten || 0}</td>
                  <td className="py-2">
                    {/* This would require additional query - simplified for now */}
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trending Books */}
      <div className="card">
        <h2 className="text-2xl font-bold text-barn-brown mb-4">Trending Books</h2>
        {stats.trendingBooks.length === 0 ? (
          <p className="text-gray-500">No trending books yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.trendingBooks.map(({ bookId, count }) => (
              <TrendingBookItem key={bookId} bookId={bookId} count={count} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TrendingBookItem = ({ bookId, count }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const bookData = await getBookDetails(bookId);
        setBook(bookData);
      } catch (error) {
        console.error('Error loading book:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId]);

  if (loading) {
    return <div className="animate-pulse h-16 bg-gray-100 rounded"></div>;
  }

  if (!book) return null;

  return (
    <Link
      to={`/book/${bookId}`}
      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <img
        src={book.thumbnail || '/placeholder-book.png'}
        alt={book.title}
        className="w-12 h-16 object-cover rounded"
      />
      <div className="flex-1">
        <h3 className="font-semibold">{book.title}</h3>
        <p className="text-sm text-gray-600">{book.authors?.join(', ')}</p>
      </div>
      <div className="text-barn-brown font-semibold">
        {count} {count === 1 ? 'reader' : 'readers'}
      </div>
    </Link>
  );
};

export default TeacherDashboard;

