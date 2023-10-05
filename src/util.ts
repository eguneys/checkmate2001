export function debounce(func: (...args: any[]) => void, wait: number) {
  let t_id: number;
  return (...args: any[]) => {
    window.clearTimeout(t_id)
    t_id = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle(func: (...args: any[]) => void, delay: number) {
  let lastCallTime = 0;
  
  return function (...args: any[]) {
    const now = new Date().getTime();
    
    if (now - lastCallTime >= delay) {
      func(...args);
      lastCallTime = now;
    }
  };
}