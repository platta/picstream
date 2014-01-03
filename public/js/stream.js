$(function() {
  var carousel = $('#carousel').dynamicCarousel({slideDuration: 5000, maxSlides: 3, transition: 'kenburns'}).data('dynamicCarousel');
  //carousel.debug = true;
  carousel.start();
  
  var params = parseGetParameters();
  
  if (params.keyword) {
    var rootUrl = $('#root-url').val();
    var socket = io.connect(rootUrl);
    
    socket.on('new-image', function(data) {
      var image = new Image();
      image.src = data.url;
      image.className = 'slide';
      
      $(image).data("metadata", data);
            
      carousel.addSlide(image);
    });
    
    socket.emit('start', {
      keyword: params.keyword,
      streamInstagram: params.streamInstagram,
      streamTwitter: params.streamTwitter,
      maxSlides: carousel.settings.maxSlides
    });
  } else {
    // No keyword passed in...
  }
});


// Take the get parameters out of the url and parse them into an object
function parseGetParameters() {
  var params = {};
  var paramString = decodeURIComponent(window.location.href.slice(window.location.href.indexOf('?') + 1));
  var getParameters = paramString.split('&');
  getParameters.forEach(function(item) {
    var param = item.split('=');
    params[param[0]] = param[1];
  });
  
  return params;
}