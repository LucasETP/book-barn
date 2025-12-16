import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserShelf, addBookToShelf, removeBookFromShelf } from '../services/shelves';
import { getBookDetails } from '../services/books';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const BookItem = ({ shelfEntry, currentStatus, onBookClick, onMoveToAdjacent, onDelete, bookData, readOnly = false }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shelfEntry.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!bookData) {
    return (
      <div className="animate-pulse">
        <div className="w-20 h-32 bg-gray-300 rounded shadow-md"></div>
      </div>
    );
  }

  const getAdjacentShelves = () => {
    const shelves = ['want-to-read', 'currently-reading', 'read'];
    const currentIndex = shelves.indexOf(currentStatus);
    const adjacent = {};
    
    if (currentIndex > 0) {
      adjacent.left = shelves[currentIndex - 1];
    }
    if (currentIndex < shelves.length - 1) {
      adjacent.right = shelves[currentIndex + 1];
    }
    
    return adjacent;
  };

  const adjacent = getAdjacentShelves();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group"
    >
      <div
        className="relative transform transition-transform hover:scale-105"
        onClick={(e) => {
          // Only navigate if not clicking on arrow buttons
          if (!e.target.closest('button')) {
            onBookClick(bookData.googleBooksId);
          }
        }}
      >
        <img
          {...(!readOnly ? listeners : {})}
          src={bookData.thumbnail || '/placeholder-book.png'}
          alt={bookData.title}
          className={`w-20 h-32 object-cover rounded shadow-lg border-2 border-barn-dark ${readOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
          style={{
            boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        />
        
        {/* Top buttons: Info and Delete - only show if not read-only */}
        {!readOnly && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBookClick(bookData.googleBooksId);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-xl hover:bg-blue-700 hover:scale-110 transition-all text-xs font-bold border-2 border-white pointer-events-auto z-30"
            aria-label="View book details"
            title="View book details"
          >
            ℹ
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            className="bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-xl hover:bg-red-700 hover:scale-110 transition-all text-xs font-bold border-2 border-white pointer-events-auto z-30"
            aria-label="Remove from shelf"
            title="Remove from shelf"
          >
            ×
          </button>
        </div>
        )}

        {/* Arrow buttons for adjacent shelves - only show if not read-only */}
        {!readOnly && (
        <div className="absolute -inset-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          {adjacent.left && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveToAdjacent(shelfEntry, adjacent.left);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className="bg-barn-brown text-white rounded-full w-8 h-8 flex items-center justify-center shadow-xl hover:bg-barn-dark hover:scale-110 transition-all text-sm font-bold border-2 border-white pointer-events-auto z-30"
              aria-label={`Move to ${adjacent.left}`}
              title={`Move to ${adjacent.left.replace('-', ' ')}`}
            >
              ←
            </button>
          )}
          {adjacent.right && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveToAdjacent(shelfEntry, adjacent.right);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className="bg-barn-brown text-white rounded-full w-8 h-8 flex items-center justify-center shadow-xl hover:bg-barn-dark hover:scale-110 transition-all text-sm font-bold border-2 border-white ml-auto pointer-events-auto z-30"
              aria-label={`Move to ${adjacent.right}`}
              title={`Move to ${adjacent.right.replace('-', ' ')}`}
            >
              →
            </button>
          )}
        </div>
        )}
      </div>
      
      {/* Book title tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-[150px] truncate">
          {bookData.title}
        </div>
      </div>

      {/* Delete confirmation modal - only show if not read-only */}
      {!readOnly && showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-barn-brown mb-2">Remove Book from Shelf?</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to remove <strong>{bookData.title}</strong> from your shelf? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                  onDelete(shelfEntry);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Bookshelf = ({ title, status, books, onBookClick, onMoveToAdjacent, onDelete, id, bookDataMap, readOnly = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `shelf-${status}`,
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-0"
    >
      <div className={`bg-gradient-to-b from-barn-dark via-barn-brown to-barn-dark rounded-lg p-4 shadow-2xl border-4 border-barn-dark relative transition-all ${isOver ? 'border-barn-light ring-4 ring-barn-light ring-opacity-50' : ''}`}>
        {/* Wood grain texture effect */}
        <div 
          className="absolute inset-0 rounded-lg opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`,
          }}
        />
        
        {/* Shelf label */}
        <div className="relative z-10 mb-4">
          <h2 className="text-xl font-bold text-white text-center mb-2 drop-shadow-lg">
            {title}
          </h2>
          <div className="text-center text-barn-light text-sm">
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </div>
        </div>

        {/* Shelf board (where books sit) */}
        <div className="relative z-10 bg-gradient-to-b from-barn-light via-barn-cream to-barn-light rounded border-2 border-barn-dark min-h-[200px] p-4 shadow-inner">
          {/* Wood grain on shelf */}
          <div 
            className="absolute inset-0 rounded opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(101, 67, 33, 0.3) 1px,
                rgba(101, 67, 33, 0.3) 2px
              )`,
            }}
          />
          
          {/* Books container */}
          {readOnly ? (
            <div 
              className="flex flex-wrap gap-3 justify-center items-end min-h-[160px] relative z-10"
              data-shelf-id={status}
            >
              {books.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8 w-full">
                  No books yet
                </div>
              ) : (
                books.map((shelfEntry) => (
                  <BookItem
                    key={shelfEntry.id}
                    shelfEntry={shelfEntry}
                    currentStatus={status}
                    onBookClick={onBookClick}
                    onMoveToAdjacent={onMoveToAdjacent}
                    onDelete={onDelete}
                    bookData={bookDataMap[shelfEntry.bookId]}
                    readOnly={readOnly}
                  />
                ))
              )}
            </div>
          ) : (
            <SortableContext
              items={books.map(b => b.id)}
              strategy={verticalListSortingStrategy}
              id={status}
            >
              <div 
                className="flex flex-wrap gap-3 justify-center items-end min-h-[160px] relative z-10"
                data-shelf-id={status}
              >
                {books.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8 w-full">
                    No books yet
                  </div>
                ) : (
                  books.map((shelfEntry) => (
                    <BookItem
                      key={shelfEntry.id}
                      shelfEntry={shelfEntry}
                      currentStatus={status}
                      onBookClick={onBookClick}
                      onMoveToAdjacent={onMoveToAdjacent}
                      onDelete={onDelete}
                      bookData={bookDataMap[shelfEntry.bookId]}
                      readOnly={readOnly}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          )}
        </div>

        {/* Shelf support brackets (decorative) */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-barn-dark rounded-b-lg"></div>
      </div>
    </div>
  );
};

const Shelves = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [shelves, setShelves] = useState({
    'want-to-read': [],
    'currently-reading': [],
    'read': [],
  });
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedBook, setDraggedBook] = useState(null);
  const [bookDataMap, setBookDataMap] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadShelves = async () => {
      if (!currentUser) return;

      try {
        const [wantToRead, currentlyReading, read] = await Promise.all([
          getUserShelf(currentUser.uid, 'want-to-read'),
          getUserShelf(currentUser.uid, 'currently-reading'),
          getUserShelf(currentUser.uid, 'read'),
        ]);

        setShelves({
          'want-to-read': wantToRead,
          'currently-reading': currentlyReading,
          'read': read,
        });

        // Load book data for all books
        const allBookIds = [
          ...wantToRead.map(e => e.bookId),
          ...currentlyReading.map(e => e.bookId),
          ...read.map(e => e.bookId),
        ];
        
        const uniqueBookIds = [...new Set(allBookIds)];
        const bookDataPromises = uniqueBookIds.map(bookId => 
          getBookDetails(bookId).catch(err => {
            console.error(`Error loading book ${bookId}:`, err);
            return null;
          })
        );
        
        const bookDataArray = await Promise.all(bookDataPromises);
        const newBookDataMap = {};
        bookDataArray.forEach((bookData, index) => {
          if (bookData) {
            newBookDataMap[uniqueBookIds[index]] = bookData;
          }
        });
        
        setBookDataMap(prev => ({ ...prev, ...newBookDataMap }));
      } catch (error) {
        console.error('Error loading shelves:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShelves();
  }, [currentUser]);

  // Load book data when new books are added
  useEffect(() => {
    const loadNewBooks = async () => {
      const allBookIds = [
        ...shelves['want-to-read'].map(e => e.bookId),
        ...shelves['currently-reading'].map(e => e.bookId),
        ...shelves['read'].map(e => e.bookId),
      ];
      
      const uniqueBookIds = [...new Set(allBookIds)];
      const missingBookIds = uniqueBookIds.filter(id => !bookDataMap[id]);
      
      if (missingBookIds.length > 0) {
        const bookDataPromises = missingBookIds.map(bookId => 
          getBookDetails(bookId).catch(err => {
            console.error(`Error loading book ${bookId}:`, err);
            return null;
          })
        );
        
        const bookDataArray = await Promise.all(bookDataPromises);
        const newBookDataMap = {};
        bookDataArray.forEach((bookData, index) => {
          if (bookData) {
            newBookDataMap[missingBookIds[index]] = bookData;
          }
        });
        
        setBookDataMap(prev => ({ ...prev, ...newBookDataMap }));
      }
    };

    if (!loading) {
      loadNewBooks();
    }
  }, [shelves, loading, bookDataMap]);

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleDeleteBook = async (shelfEntry) => {
    if (!currentUser) return;

    try {
      await removeBookFromShelf(currentUser.uid, shelfEntry.bookId);
      
      // Update local state optimistically
      const shelfStatus = Object.keys(shelves).find(status =>
        shelves[status].some(b => b.id === shelfEntry.id)
      );
      
      if (shelfStatus) {
        setShelves(prev => ({
          ...prev,
          [shelfStatus]: prev[shelfStatus].filter(b => b.id !== shelfEntry.id),
        }));
      }
    } catch (error) {
      console.error('Error removing book:', error);
      alert('Failed to remove book. Please try again.');
    }
  };

  const handleMoveToAdjacent = async (shelfEntry, newStatus) => {
    if (!currentUser) return;

    const oldStatus = Object.keys(shelves).find(status => 
      shelves[status].some(b => b.id === shelfEntry.id)
    );
    
    if (!oldStatus) return;

    // Optimistic update - immediately update UI
    const previousShelves = { ...shelves };
    
    setShelves(prev => ({
      ...prev,
      [oldStatus]: prev[oldStatus].filter(b => b.id !== shelfEntry.id),
      [newStatus]: [...prev[newStatus], shelfEntry],
    }));
    
    // Then update Firestore
    try {
      await addBookToShelf(currentUser.uid, shelfEntry.bookId, newStatus);
    } catch (error) {
      console.error('Error moving book:', error);
      // Revert on error
      setShelves(previousShelves);
      alert('Failed to move book. Please try again.');
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the book being dragged
    const allBooks = [
      ...shelves['want-to-read'],
      ...shelves['currently-reading'],
      ...shelves['read'],
    ];
    const book = allBooks.find(b => b.id === active.id);
    if (book) {
      getBookDetails(book.bookId).then(setDraggedBook);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || !currentUser) {
      setActiveId(null);
      setDraggedBook(null);
      return;
    }

    // Find which shelf the book is being dragged from
    const sourceShelf = Object.keys(shelves).find(status =>
      shelves[status].some(b => b.id === active.id)
    );

    if (!sourceShelf) {
      setActiveId(null);
      setDraggedBook(null);
      return;
    }

    const shelfEntry = shelves[sourceShelf].find(b => b.id === active.id);
    if (!shelfEntry) {
      setActiveId(null);
      setDraggedBook(null);
      return;
    }

    // Check if dropped on another book (reordering within shelf)
    const targetBook = Object.values(shelves)
      .flat()
      .find(b => b.id === over.id);

    if (targetBook && targetBook.id !== active.id) {
      const targetShelf = Object.keys(shelves).find(status =>
        shelves[status].some(b => b.id === targetBook.id)
      );

      if (targetShelf && targetShelf !== sourceShelf) {
        // Moving to different shelf - optimistic update
        const previousShelves = { ...shelves };
        
        // Immediately update UI
        setShelves(prev => ({
          ...prev,
          [sourceShelf]: prev[sourceShelf].filter(b => b.id !== active.id),
          [targetShelf]: [...prev[targetShelf], shelfEntry],
        }));
        
        // Then update Firestore
        try {
          await addBookToShelf(currentUser.uid, shelfEntry.bookId, targetShelf);
        } catch (error) {
          console.error('Error moving book:', error);
          // Revert on error
          setShelves(previousShelves);
          alert('Failed to move book. Please try again.');
        }
      } else if (targetShelf === sourceShelf) {
        // Reordering within same shelf
        const items = shelves[sourceShelf];
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        if (oldIndex !== newIndex) {
          setShelves(prev => ({
            ...prev,
            [sourceShelf]: arrayMove(items, oldIndex, newIndex),
          }));
        }
      }
    } else {
      // Check if dropped on a shelf container (droppable area)
      const shelfId = over.id.toString();
      if (shelfId.startsWith('shelf-')) {
        const targetShelf = shelfId.replace('shelf-', '');
        
        if (targetShelf && targetShelf !== sourceShelf && ['want-to-read', 'currently-reading', 'read'].includes(targetShelf)) {
          // Optimistic update - immediately update UI
          const previousShelves = { ...shelves };
          
          setShelves(prev => ({
            ...prev,
            [sourceShelf]: prev[sourceShelf].filter(b => b.id !== active.id),
            [targetShelf]: [...prev[targetShelf], shelfEntry],
          }));
          
          // Then update Firestore
          try {
            await addBookToShelf(currentUser.uid, shelfEntry.bookId, targetShelf);
          } catch (error) {
            console.error('Error moving book:', error);
            // Revert on error
            setShelves(previousShelves);
            alert('Failed to move book. Please try again.');
          }
        }
      }
    }
    
    // Clear drag state after all updates
    setActiveId(null);
    setDraggedBook(null);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-barn-brown mb-6">My Bookshelves</h1>
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 bg-gray-200 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const shelfConfig = [
    { status: 'want-to-read', title: 'Want to Read', id: 'shelf-want-to-read' },
    { status: 'currently-reading', title: 'Currently Reading', id: 'shelf-currently-reading' },
    { status: 'read', title: 'Read', id: 'shelf-read' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-barn-brown">My Bookshelves</h1>
        <button
          onClick={() => navigate('/search')}
          className="btn-primary"
        >
          + Add Books
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {shelfConfig.map((config) => (
            <Bookshelf
              key={config.status}
              title={config.title}
              status={config.status}
              books={shelves[config.status]}
              onBookClick={handleBookClick}
              onMoveToAdjacent={handleMoveToAdjacent}
              onDelete={handleDeleteBook}
              id={config.id}
              bookDataMap={bookDataMap}
            />
          ))}
        </div>

        <DragOverlay>
          {draggedBook ? (
            <div className="transform rotate-3">
              <img
                src={draggedBook.thumbnail || '/placeholder-book.png'}
                alt={draggedBook.title}
                className="w-20 h-32 object-cover rounded shadow-2xl border-2 border-barn-dark"
                style={{
                  boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-6 card bg-barn-cream border-2 border-barn-light">
        <p className="text-sm text-gray-700 text-center">
          💡 <strong>Tip:</strong> Drag books between shelves or use the arrow buttons to move them to adjacent shelves
        </p>
      </div>
    </div>
  );
};

export default Shelves;
