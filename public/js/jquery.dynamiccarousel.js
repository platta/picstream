(function($) {
  function DynamicCarousel (element, options) {
    this.container = $(element);

    this.slides = [];
    this.currentSlide = null;
    this.slideIndex = 0;
    this.active = false;
    this.animating = false;
    
    this.settings = $.extend($.fn.dynamicCarousel.defaults, options);
  }
  
  DynamicCarousel.prototype.start = function() {
    if (this.active) {
      return;
    }
    
    this.active = true;
    this.nextSlide();
  }
  
  DynamicCarousel.prototype.stop = function() {
    this.active = false;
  }
  
  DynamicCarousel.prototype.nextSlide = function() {
    if (!this.active) {
      return;
    }
    
    if (this.slides.length > 0) {
      if (!this.currentSlide) {
        if (this.slideIndex < 0) {
          this.slideIndex = 0;
        }
        this.currentSlide = this.slides[this.slideIndex];
      }
    
      // Current slide
      var currentSlide = this.currentSlide;
    
      // Next slide
      this.slideIndex = (this.slideIndex + 1) % this.slides.length;
      var nextSlide = this.slides[this.slideIndex]
      if (currentSlide != nextSlide) {
        // Call transition
        this.animating = true;
        $.fn.dynamicCarousel.transitions[this.settings.transition].call(this, this.container, currentSlide, nextSlide);
        this.currentSlide = nextSlide;
      }
    }
    
    var that = this;
    setTimeout(function() {
      that.nextSlide()
    }, this.settings.slideDuration);
  }
  
  DynamicCarousel.prototype.addSlide = function(element) {
    var slide = $(element).hide();
    this.container.append(slide);
    this.slides.push(slide);
    
    if (this.settings.maxSlides > 0 && this.slides.length > this.settings.maxSlides) {
      if (this.slideIndex > 0 && !this.animating || this.slideIndex > 1) {
        this.slides[0].remove();
      }
      
      if (this.slideIndex >= 0) {
        this.slideIndex--;
      }

      this.slides = this.slides.slice(1);
    }
  }
  
  DynamicCarousel.prototype.slideHidden = function(slide) {
    this.animating = false;
    if ($.inArray(slide, this.slides) === -1) {
      slide.remove();
    }
  }
  
  $.fn.dynamicCarousel = function(options) {
    return this.each(function() {
      var element = $(this);
      
      if (element.data('dynamicCarousel')) {
        return;
      }
      
      var dynamicCarousel = new DynamicCarousel(this, options);
      
      element.data('dynamicCarousel', dynamicCarousel);
    });
  };
  
  $.fn.dynamicCarousel.transitions = {}
  
  $.fn.dynamicCarousel.transitions['default'] = function(container, currentSlide, nextSlide) {
    currentSlide.hide();
    this.slideHidden(currentSlide);
    nextSlide.show();
  }
  
  $.fn.dynamicCarousel.defaults = {
    maxSlides: 5,
    slideDuration: 5000,
    transition: 'default'
  };
  

}(jQuery));