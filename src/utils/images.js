// Utility function to handle missing book cover images
export const getBookThumbnail = (thumbnail) => {
  if (thumbnail) {
    // Replace http with https and increase thumbnail size
    return thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=2');
  }
  // Return a placeholder or data URI for missing images
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBDb3ZlcjwvdGV4dD48L3N2Zz4=';
};

// Utility function to handle missing user avatars
export const getUserAvatar = (photoURL) => {
  if (photoURL) {
    return photoURL;
  }
  // Return a default avatar SVG
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2QyYjQ4YyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM2NTQzMjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5C5PC90ZXh0Pjwvc3ZnPg==';
};

