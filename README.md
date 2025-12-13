# 📚 Book Barn

A classroom book tracking and social reading platform for students. Book Barn is a simplified, education-focused alternative to Goodreads that emphasizes community reading and discussion within a single classroom environment.

## Features

- **Book Search & Discovery**: Search for books using Google Books API
- **Personal Bookshelves**: Organize books into "Want to Read", "Currently Reading", and "Read" shelves
- **Reviews & Ratings**: Write and share book reviews with classmates
- **Social Feed**: See what your classmates are reading and reviewing
- **User Profiles**: View classmates' reading activity and reviews
- **Teacher Dashboard**: Analytics and insights for educators (admin access)
- **Mobile-First Design**: Fully responsive, works seamlessly on all devices

## Tech Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Database**: Cloud Firestore
- **Book Data**: Google Books API
- **Hosting**: Netlify (free tier)

## Prerequisites

- Node.js 18+ and npm
- Firebase project with:
  - Authentication enabled (Google Sign-In)
  - Firestore database
  - Storage (optional, for profile pictures)
- Google Books API key (optional, but recommended for higher rate limits)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd book-barn
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → **Google Sign-In**
3. Create a **Firestore Database** (start in production mode, we'll add security rules)
4. Copy your Firebase configuration from Project Settings → General → Your apps

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key_optional
VITE_ALLOWED_EMAIL_DOMAIN=yourdomain.edu
```

**Note**: `VITE_GOOGLE_BOOKS_API_KEY` is optional but recommended. `VITE_ALLOWED_EMAIL_DOMAIN` restricts sign-ins to a specific email domain (e.g., your school's domain).

### 4. Firestore Security Rules

In Firebase Console → Firestore Database → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read all user profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Books are readable by all, writable by any authenticated user
    match /books/{bookId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Shelves readable by all, writable only by owner
    match /shelves/{shelfId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth.uid == resource.data.userId;
    }

    // Reviews: public ones readable by all, private only by author and teachers
    match /reviews/{reviewId} {
      allow read: if request.auth != null &&
        (!resource.data.isPrivate ||
         request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isTeacher);
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // Review replies readable/writable same as parent review
    match /review_replies/{replyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Firestore Indexes

Create these composite indexes in Firestore:

1. **shelves**: `userId` (Ascending), `status` (Ascending)
2. **shelves**: `bookId` (Ascending), `status` (Ascending)
3. **reviews**: `bookId` (Ascending), `createdAt` (Descending)
4. **reviews**: `userId` (Ascending), `createdAt` (Descending)
5. **review_replies**: `reviewId` (Ascending), `createdAt` (Ascending)

To create indexes, go to Firestore → Indexes → Create Index.

### 6. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment to Netlify

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Netlify](https://www.netlify.com/) and sign in
3. Click "New site from Git"
4. Connect your GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables in Netlify → Site settings → Environment variables
7. Deploy!

### Option 2: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Firebase Auth Domain Configuration

After deploying to Netlify, add your Netlify domain to Firebase:

1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your Netlify domain (e.g., `your-site.netlify.app`)

## Making a User a Teacher

To grant teacher/admin access, update the user document in Firestore:

1. Go to Firestore → `users` collection
2. Find the user document
3. Set `isTeacher: true`

## Project Structure

```
book-barn/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth)
│   ├── firebase/         # Firebase configuration
│   ├── pages/            # Page components
│   ├── services/         # API and Firestore services
│   ├── App.jsx           # Main app component with routing
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── .env                  # Environment variables (not in git)
├── netlify.toml          # Netlify configuration
└── package.json
```

## Key Features Explained

### Authentication

- Google Sign-In only
- Optional domain restriction via `VITE_ALLOWED_EMAIL_DOMAIN`
- Automatic user profile creation on first sign-in

### Books

- Searched via Google Books API
- Cached in Firestore for performance
- Book details page with reviews and shelf management

### Shelves

- Three statuses: Want to Read, Currently Reading, Read
- Books can be moved between shelves
- Visible on user profiles

### Reviews

- 1-5 star ratings
- Optional text review
- Can be marked private (visible only to author and teachers)
- Reply threads for discussion

### Activity Feed

- Shows recent shelf additions, reviews, and replies
- Real-time updates from classmates
- Links to relevant books and profiles

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"

- Add your domain to Firebase Auth authorized domains

### "Missing or insufficient permissions" in Firestore

- Check security rules are deployed
- Verify indexes are created
- Ensure user is authenticated

### Books not loading

- Check Google Books API key is set (optional but recommended)
- Verify network requests in browser console

## License

This project is open source and available for educational use.

## Support

For issues or questions, please open an issue on GitHub.
