import { useEffect, useRef } from 'react';

// Measure the available viewport below the existing site header and page controls.
export default function useBlogPanels(ready = true) {
  const ref = useRef(null);
  useEffect(() => {
    const layout = ref.current;
    if (!ready || !layout) return;
    const measure = () => {
      const top = layout.getBoundingClientRect().top + window.scrollY;
      layout.style.setProperty('--blog-panel-height', `${Math.max(240, window.innerHeight - top - 16)}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (layout.parentElement) observer?.observe(layout.parentElement);
    const header = document.querySelector('header');
    if (header) observer?.observe(header);
    return () => { window.removeEventListener('resize', measure); observer?.disconnect(); };
  }, [ready]);
  return ref;
}
