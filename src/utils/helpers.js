// View limit for guest users
const MAX_GUEST_VIEWS = 5;

export function checkViewLimit() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user) return true;
  
  let viewCount = parseInt(localStorage.getItem('viewCount') || '0');
  
  if (viewCount >= MAX_GUEST_VIEWS) {
    return false;
  }
  
  localStorage.setItem('viewCount', (viewCount + 1).toString());
  return true;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}