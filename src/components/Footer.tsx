import { useEffect, useRef } from 'react';
import { feel } from '../cats/catBus';

export function Footer() {
  const ref = useRef<HTMLElement>(null);

  // Llegar al final del portafolio despierta al gatito curioso
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && feel('curioso', { cooldownMs: 120_000 }));
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={ref} className="bg-band border-t border-line py-6">
      <div className="max-w-6xl mx-auto px-4 text-start text-ink">
        <a href="#" className="text-xl font-bold text-accent">
          &lt;/div&gt;
        </a>
      </div>
    </footer>
  );
}
