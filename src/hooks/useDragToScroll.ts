import { useRef, useEffect } from 'react';

export const useDragToScroll = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startY: number;
    let scrollTop: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      el.classList.add('cursor-grabbing');
      el.classList.remove('cursor-pointer', 'cursor-auto');
      startY = e.pageY - el.offsetTop;
      scrollTop = el.scrollTop;
    };

    const onMouseLeave = () => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
    };

    const onMouseUp = () => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - el.offsetTop;
      const walk = (y - startY) * 1.5; // Multiplier for speed
      el.scrollTop = scrollTop - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return ref;
};
