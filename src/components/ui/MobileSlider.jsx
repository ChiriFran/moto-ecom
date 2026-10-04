import { useState, useRef } from 'react';
import './MobileSlider.css';

const MobileSlider = ({ children, gridClass = '' }) => {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const items = Array.isArray(children) ? children : [children];
  const total = items.length;

  const goTo = (index) => {
    if (index >= 0 && index < total) setCurrent(index);
  };

  const handleTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const minSwipe = 50;

    if (distance > minSwipe && current < total - 1) {
      setCurrent((prev) => prev + 1);
    } else if (distance < -minSwipe && current > 0) {
      setCurrent((prev) => prev - 1);
    }

    touchStart.current = null;
    touchEnd.current = null;
  };

  return (
    <div className="mobile-slider">
      <div
        className={`mobile-slider__track ${gridClass}`}
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((child, i) => (
          <div className="mobile-slider__slide" key={i}>
            {child}
          </div>
        ))}
      </div>

      {total > 1 && (
        <div className="mobile-slider__dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`mobile-slider__dot ${i === current ? 'mobile-slider__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileSlider;
