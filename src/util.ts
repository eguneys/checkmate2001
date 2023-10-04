export function debounce(func: (...args: any[]) => void, wait: number) {
  let t_id: number;
  return (...args: any[]) => {
    window.clearTimeout(t_id)
    t_id = setTimeout(() => {
      func(...args)
    }, wait)
  }
}