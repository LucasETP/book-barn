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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-8 py-6 rounded-2xl max-w-md text-center shadow-lg">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>You need teacher privileges to view this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!stats) return <div className="text-center py-12 text-gray-500">Failed to load statistics.</div>;

  // Process Data
  const sortedStudents = [...stats.students].sort((a, b) => {
    const aActivity = (a.stats?.booksRead || 0) + (a.stats?.reviewsWritten || 0);
    const bActivity = (b.stats?.booksRead || 0) + (b.stats?.reviewsWritten || 0);
    return bActivity - aActivity;
  });

  const totalBooks = stats.students.reduce((sum, s) => sum + (s.stats?.booksRead || 0), 0);
  const totalReviews = stats.students.reduce((sum, s) => sum + (s.stats?.reviewsWritten || 0), 0);
  const avgBooks = stats.totalStudents ? (totalBooks / stats.totalStudents).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-barn-brown tracking-tight">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-2 text-lg">Overview of your classroom's reading journey</p>
        </div>
        <div className="bg-barn-brown/10 px-4 py-2 rounded-full font-medium text-barn-brown flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Updates
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          color="blue"
        />
        <StatCard
          title="Total Books Read"
          value={totalBooks}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          color="green"
        />
        <StatCard
          title="Reviews Written"
          value={totalReviews}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          color="purple"
        />
        <StatCard
          title="Avg Books / Student"
          value={avgBooks}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard Section - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-bold text-gray-800">Reading Champions</h2>
            </div>

            {/* Podium */}
            {sortedStudents.length >= 3 && (
              <div className="flex justify-center items-end gap-4 mb-12 h-64">
                <PodiumSpot student={sortedStudents[1]} rank={2} color="bg-gray-300" height="h-32" />
                <PodiumSpot student={sortedStudents[0]} rank={1} color="bg-yellow-300" height="h-40" isWinner />
                <PodiumSpot student={sortedStudents[2]} rank={3} color="bg-amber-600" height="h-24" />
              </div>
            )}

            {/* List for the rest */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Honorable Textures</h3>
              <div className="space-y-3">
                {sortedStudents.slice(3, 8).map((student, idx) => (
                  <StudentRow key={student.id} student={student} rank={idx + 4} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Trending & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">🔥</span> Trending Books
            </h2>
            {stats.trendingBooks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No trending books yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.trendingBooks.map(({ bookId, count }) => (
                  <TrendingBookItem key={bookId} bookId={bookId} count={count} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-barn-brown to-amber-900 rounded-3xl shadow-lg p-6 text-white text-center">
            <h3 className="text-lg font-bold mb-2">Class Goal</h3>
            <p className="text-sm opacity-90 mb-4">Reach 100 books collectively!</p>
            <div className="w-full bg-black/20 rounded-full h-4 mb-2 overflow-hidden">
              <div
                className="bg-green-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((totalBooks / 100) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="font-bold text-2xl">{totalBooks} / 100</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
  );
};

const PodiumSpot = ({ student, rank, color, height, isWinner }) => {
  if (!student) return null;

  return (
    <div className="flex flex-col items-center w-1/3 max-w-[120px]">
      <div className="relative mb-3">
        {isWinner && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
            👑
          </span>
        )}
        <div className={`relative ${isWinner ? 'w-20 h-20 ring-4 ring-yellow-300' : 'w-16 h-16'} rounded-full overflow-hidden shadow-lg`}>
          <img
            src={student.photoURL || '/default-avatar.png'}
            alt={student.displayName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          #{rank}
        </div>
      </div>

      <div className={`w-full ${height} ${color} rounded-t-lg shadow-inner flex flex-col items-center justify-end pb-2 opacity-90`}>
        <span className={`${isWinner ? 'text-2xl text-gray-800' : 'text-xl text-white/50'} font-bold`}>
          {rank}
        </span>
      </div>

      <div className="text-center mt-2">
        <p className={`font-bold text-gray-800 ${isWinner ? 'text-lg' : 'text-sm'} truncate w-full`}>
          {student.displayName?.split(' ')[0]}
        </p>
        <p className="text-xs text-gray-500 font-medium">
          {student.stats?.booksRead || 0} books
        </p>
      </div>
    </div>
  );
};

const StudentRow = ({ student, rank }) => (
  <div className="flex items-center p-3 bg-white rounded-xl border border-gray-100 hover:border-barn-brown/30 transition-colors">
    <span className="font-bold text-gray-400 w-8 text-center">{rank}</span>
    <Link to={`/profile/${student.id}`} className="flex items-center gap-3 flex-1 min-w-0">
      <img
        src={student.photoURL || '/default-avatar.png'}
        alt={student.displayName}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
      />
      <div>
        <p className="font-bold text-gray-800 truncate">{student.displayName}</p>
        <p className="text-xs text-gray-500">{student.stats?.reviewsWritten || 0} reviews</p>
      </div>
    </Link>
    <div className="text-right pl-2">
      <span className="block font-bold text-barn-brown">{student.stats?.booksRead || 0}</span>
      <span className="text-[10px] text-gray-400 uppercase font-medium">Books</span>
    </div>
  </div>
);

const TrendingBookItem = ({ bookId, count }) => {
  const [book, setBook] = useState(null);

  useEffect(() => {
    getBookDetails(bookId).then(setBook).catch(console.error);
  }, [bookId]);

  if (!book) return <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>;

  return (
    <Link
      to={`/book/${bookId}`}
      className="flex gap-4 p-3 hover:bg-orange-50 rounded-xl transition-all group"
    >
      <img
        src={book.thumbnail || '/placeholder-book.png'}
        alt={book.title}
        className="w-12 h-18 object-cover rounded-md shadow-sm group-hover:shadow-md transition-shadow"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-barn-brown transition-colors">
          {book.title}
        </h4>
        <p className="text-xs text-gray-500 truncate">{book.authors?.join(', ')}</p>
        <div className="flex items-center gap-1 mt-2">
          <span className="bg-barn-brown/10 text-barn-brown text-[10px] font-bold px-2 py-0.5 rounded-full">
            {count} readers
          </span>
        </div>
      </div>
    </Link>
  );
};

export default TeacherDashboard;

