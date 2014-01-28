$(function() {
  var carousel = $('#carousel').dynamicCarousel({slideDuration: 2000, maxSlides: 10, transition: 'kenburns'}).data('dynamicCarousel');
  carousel.start();
  
  var params = parseGetParameters();
  

  var rootUrl = $('#root-url').val();
  var streamId = $('#stream-id').val();
  var socket = io.connect(rootUrl);
  
  socket.on('new-image', function(data) {
    var image = new Image();
    image.src = data.url;
    image.className = 'slide';
    
    $(image).data("metadata", data);
          
    carousel.addSlide(image);
  });
  
  // TODO: How do we record success or failure of this?
  socket.on('reconnect', function() {
    socket.emit('reconnect');
  });

  // TODO: How do we record success or failure of this?  
  socket.emit('attach', streamId);
  
  // Issue a detach command when navigating away from the page so that the server doesn't
  // think we have just dropped connection.
  $(window).unload(function() {
    socket.emit('detach');
  });
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