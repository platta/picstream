(function($) {
  $.fn.dynamicCarousel.transitions['kenburns'] = function(settings, transitionSettings, container, currentSlide, nextSlide) {
    function getRandom(from, to) {
      return Math.floor(Math.random() * (to - from + 1) + from);
    }
  
    function clamp(value, min, max) {
      return value > max ? max : value < min ? min : value;
    }
    
    currentSlide.css('z-index', 2);
    nextSlide.css('z-index', 1);
  
    var cWidth = container.width();
    var cHeight = container.height();
      
    var sWidth = nextSlide.width();
    var sHeight = nextSlide.height();
  
    // Scale
    var bScale = Math.max(cWidth / sWidth, cHeight / sHeight);
    var sScale = bScale * (getRandom(transitionSettings.minScale, transitionSettings.maxScale) / 100 + 1);
    var eScale = bScale * (getRandom(transitionSettings.minScale, transitionSettings.maxScale) / 100 + 1);
  
    var smallest = Math.min(sScale, eScale);
  
    // Translate
    var bX = -(sWidth - (sWidth * smallest)) / 2 + (cWidth - (sWidth * smallest)) / 2;
    var bY = -(sHeight - (sHeight * smallest)) / 2 + (cHeight - (sHeight * smallest)) / 2;
  
    var xPadding = (cWidth - (sWidth * smallest)) / 2;
    var yPadding = (cHeight - (sHeight * smallest)) / 2;
  
    var maxTranslatePixels = (transitionSettings.maxTranslate / 100) * Math.min(sHeight * smallest, sWidth * smallest);
    var sX = bX + clamp(getRandom(0, 2 * xPadding) - xPadding, -maxTranslatePixels, maxTranslatePixels);
    var sY = bY + clamp(getRandom(0, 2 * yPadding) - yPadding, -maxTranslatePixels, maxTranslatePixels);
  
    var eX = bX + clamp(getRandom(0, 2 * xPadding) - xPadding, -maxTranslatePixels, maxTranslatePixels);
    var eY = bY + clamp(getRandom(0, 2 * yPadding) - yPadding, -maxTranslatePixels, maxTranslatePixels);

    nextSlide.css({
      left: sX,
      top: sY,
      scale: sScale
    });
  
    var that = this;
    nextSlide.show(0, function() {
      currentSlide.fadeOut(transitionSettings.fadeSpeed, 'swing', function() {
        that.slideHidden(currentSlide);
      });
    }).transition({
      left: eX,
      top: eY,
      scale: eScale,
      queue: false}, this.settings.slideDuration + transitionSettings.fadeSpeed, 'linear');
  };
  
  $.fn.dynamicCarousel.defaultTransitionSettings['kenburns'] = {
    minScale: 5,
    maxScale: 10,
    maxTranslate: 2,
    fadeSpeed: 1000
  };
}(jQuery));