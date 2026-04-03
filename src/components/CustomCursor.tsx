import { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  useEffect(() => {
    const addEventListeners = () => {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);
      
      const setupHoverListeners = () => {
        const interactables = document.querySelectorAll('button, a, input, .card-3d, .group');
        interactables.forEach((el) => {
          el.addEventListener("mouseenter", onMouseEnter);
          el.addEventListener("mouseleave", onMouseLeave);
        });
      };
      
      setTimeout(setupHoverListeners, 1000);
      
      const observer = new MutationObserver(() => {
        setupHoverListeners();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        observer.disconnect();
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);
    const onMouseEnter = () => setLinkHovered(true);
    const onMouseLeave = () => setLinkHovered(false);

    const cleanup = addEventListeners();
    
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      cleanup();
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[9999] rounded-full transition-all duration-300 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${clicked ? 0.8 : 1})`,
        width: linkHovered ? "24px" : "8px",
        height: linkHovered ? "24px" : "8px",
        backgroundColor: linkHovered ? "transparent" : "#C8A96E",
        border: linkHovered ? "1px solid #C8A96E" : "none",
        boxShadow: linkHovered ? "none" : "0 0 15px #C8A96E",
      }}
    />
  );
}
