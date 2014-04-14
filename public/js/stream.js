$(function() {
  var carousel = $('#carousel').dynamicCarousel({slideDuration: 5000, maxSlides: 10, transition: 'kenburns'}).data('dynamicCarousel');
  carousel.start();
  
  var params = parseGetParameters();
  

  var rootUrl = $('#root-url').val();
  console.log('rootUrl = ' + rootUrl);
  var streamId = $('#stream-id').val();
  var socket = io.connect(null);
  var wasConnected = false;
  
  socket.on('new-media', function(data) {
    var image = new Image();
    image.src = data.url;
    image.className = 'slide';
    
    $(image).data("metadata", data);
          
    carousel.addSlide(image);
  });
  
  socket.on('detach', function() {
    toast('Detached from stream', 'danger');
  });
  
  socket.on('reconnect', function() {
    toast('Reconnected to socket', 'success');
  });

  socket.on('disconnect', function() {
    toast('Disconnected from socket', 'danger');
  });

  socket.on('reconnecting', function() {
    toast('Reconnecting to socket', 'info');
  });

  socket.on('connecting', function() {
    toast('Connecting to socket', 'info');
  });
  
  
  socket.on('connect', function() {
    toast('Connected to socket', 'info');
    
    console.log(socket.id);
    
    // Now that we're connected to the socket, attach to the stream.
    socket.emit('attach', {streamId: streamId, reconnect: wasConnected}, function(err, data) {
      if (data.attached) {
        wasConnected = true;
        toast('Attached to stream', 'success');
      } else {
        toast('Unable to attach to stream', 'danger');
      }
    });
  });

  
  // Issue a detach command when navigating away from the page so that the server doesn't
  // think we have just dropped connection.
  $(window).unload(function() {
    socket.emit('detach', {intentional: true});
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

function toast(message, type) {
  var div = document.createElement('div');
  var $div = $(div);
  
  $div.addClass('alert')
    .addClass('alert-' + type)
    .text(message).hide();
    
  $('#toast_area').append($div);
  $div.fadeIn();
  
  setTimeout(function() {
    $div.fadeOut(function() {
      $div.remove();
    });
  }, 3500);
}