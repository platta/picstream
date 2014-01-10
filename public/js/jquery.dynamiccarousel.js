(function($) {
  function DynamicCarousel (element, options, transitionOptions) {
    this.container = $(element);

    this.slides = [];
    this.currentSlide = null;
    this.slideIndex = 0;
    this.active = false;
    this.animating = false;
    this.setAtNewSlide = false;
    
    this.debug = false;
    
    this.settings = $.extend($.fn.dynamicCarousel.defaults, options);
    this.transitionSettings = $.extend($.fn.dynamicCarousel.defaultTransitionSettings[this.settings.transition] || {}, transitionOptions);
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
      var nextSlide = this.slides[this.slideIndex];
      
      if (currentSlide != nextSlide) {
        // Call transition
        this.animating = true;
        nextSlide.data('visible', true);
        $.fn.dynamicCarousel.transitions[this.settings.transition].call(this, this.settings, this.transitionSettings, this.container, currentSlide, nextSlide);
        this.currentSlide = nextSlide;
        
        if (this.debug) {
          var $image = $("#debug_image");
          $image.attr("src", this.currentSlide.attr("src"));
          
          var data = this.currentSlide.data("metadata");
          if (data) {
            $("#debug_service").text(data.service);
            $("#debug_created").text(data.created);
            
            $("#debug_userprofile").attr("src", data.user.image);
            $("#debug_name").text(data.user.name);
            $("#debug_username").text(data.user.username);
            $("#debug_text").text(data.text);
          }
          
          // Moved this down because trying to set this CSS too soon after changing the
          // src of the image was causing incorrect sizing.
          if ($image.height() > $image.width()) {
            $image.css("height", "90%");
            $image.css("width", "auto");
          } else {
            $image.css("width", "90%");
            $image.css("height", "auto");
          }
        }
      }
    }
    
    var that = this;
    setTimeout(function() {
      that.nextSlide()
    }, this.settings.slideDuration);
  }
  
  DynamicCarousel.prototype.addSlide = function(element) {
    var self = this;
    var attempts = 0;
    
    // This is a weird way to do this...This function will re-call itself 10 times over
    // the course of 5 seconds until the image has finished loading into memory.  Once
    // the image is done loading, we will actually add it to the array of slides.  If the
    // image doesn't finish loading in 5 seconds time, we just drop it.  The reason it's
    // being done this way is to stop blanks from being shown while images are still
    // loading.  It's also important to note that this may cause issues in slide order
    // with keywords that are very active (like selfie).
    var addFunction = function() {
      if (element.complete) {
        var slide = $(element).hide();
        slide.data('visible', false);
        self.container.append(slide);
        self.slides.push(slide);

        if (self.settings.maxSlides > 0 && self.slides.length > self.settings.maxSlides) {
          //if (self.slideIndex > 1 || self.slideIndex > 0 && !self.animating || self.slides[0] !== self.currentSlide) {
          if (!self.slides[0].data('visible')) {
            self.slides[0].remove();
          }
      
          if (self.slideIndex >= 0) {
            self.slideIndex--;
          }

          self.slides = self.slides.slice(1);
        }
        
        if (!self.setAtNewSlide) {
          // When a new slide is added, make it show up next in the rotation (unless
          // we've queued up multiple new slides while a single current slide is showing
          self.setAtNewSlide = true;
          self.slideIndex = self.slides.length - 2;
        }
      } else {
        if (attempts++ < 10) {
          setTimeout(addFunction, 500);
        }
      }
    }
    
    addFunction();
  };
  
  DynamicCarousel.prototype.slideHidden = function(slide) {
    this.animating = false;
    this.setAtNewSlide = false;
    slide.data('visible', false);
    if ($.inArray(slide, this.slides) === -1) {
      slide.remove();
    }
  };
  
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
  
  $.fn.dynamicCarousel.transitions = {};
  $.fn.dynamicCarousel.defaultTransitionSettings = {};
  
  $.fn.dynamicCarousel.transitions['default'] = function(settings, transitionSettings, container, currentSlide, nextSlide) {
    currentSlide.hide();
    this.slideHidden(currentSlide);
    nextSlide.show();
  };
  
  $.fn.dynamicCarousel.defaults = {
    maxSlides: 5,
    slideDuration: 5000,
    transition: 'default'
  };
  

}(jQuery));