(function($) {
  $.fn.dynamicCarousel.transitions['kenburns'] = function(container, currentSlide, nextSlide) {
    function getRandom(from, to) {
      return Math.floor(Math.random() * (to - from + 1) + from);
    }
  
    function clamp(value, min, max) {
      return value > max ? max : value < min ? min : value;
    }
  
    // Settings
    var minScale = 5;
    var maxScale = 20;
    var maxTranslatePercent = 20;
    var fadeSpeed = 1000;
  
    currentSlide.css('z-index', 2);
    nextSlide.css('z-index', 1);
  
    var cWidth = container.width();
    var cHeight = container.height();
  
    var sWidth = nextSlide.width();
    var sHeight = nextSlide.height();
  
    // Scale
    var bScale = Math.max(cWidth / sWidth, cHeight / sHeight);
    var sScale = bScale * (getRandom(minScale, maxScale) / 100 + 1);
    var eScale = bScale * (getRandom(minScale, maxScale) / 100 + 1);
  
    var smallest = Math.min(sScale, eScale);
  
    // Translate
    var bX = -(sWidth - (sWidth * smallest)) / 2 + (cWidth - (sWidth * smallest)) / 2;
    var bY = -(sHeight - (sHeight * smallest)) / 2 + (cHeight - (sHeight * smallest)) / 2;
  
    var xPadding = (cWidth - (sWidth * smallest)) / 2;
    var yPadding = (cHeight - (sHeight * smallest)) / 2;
  
    var maxTranslatePixels = (maxTranslatePercent / 100) * Math.min(sHeight * smallest, sWidth * smallest);
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
      currentSlide.fadeOut(fadeSpeed, 'swing', function() {
        that.slideHidden(currentSlide);
      });
    }).transition({
      left: eX,
      top: eY,
      scale: eScale,
      queue: false}, this.settings.slideDuration + fadeSpeed, 'linear');
  };
}(jQuery));