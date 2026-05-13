// src/components/NotificationSlider.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSliderCards } from '../services/sliderService';

function NotificationSlider() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slides.length]);

  const loadSlides = async () => {
    setLoading(true);
    const data = await getSliderCards();
    setSlides(data);
    setLoading(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleSlideClick = (slide) => {
    if (slide.link) {
      if (slide.link.startsWith('/')) {
        navigate(slide.link);
      } else {
        window.open(slide.link, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl overflow-hidden mb-8">
        <div className="h-48 md:h-56 animate-pulse bg-green-400"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-8 group">
      {/* Main Slider */}
      <div 
        className="relative overflow-hidden rounded-xl cursor-pointer"
        onClick={() => handleSlideClick(slides[currentIndex])}
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="w-full flex-shrink-0">
              <div className="relative h-48 md:h-56 bg-gradient-to-r from-green-500 to-green-600 rounded-xl overflow-hidden">
                {/* Background Image */}
                {slide.image_url && (
                  <img 
                    src={slide.image_url} 
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center h-full px-6 text-white">
                  <h2 className="text-xl md:text-2xl font-bold mb-2">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base text-white/90 mb-4 line-clamp-2">
                    {slide.description}
                  </p>
                  <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium w-fit hover:bg-green-50 transition">
                    {slide.button_text || 'View More'} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ◀
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ▶
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationSlider;