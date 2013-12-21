$(function() {
  var rootUrl = $('#root-url').val();

  var socket = io.connect(rootUrl);
  socket.on('list', function(data) {
    $('#growing-list').append('<li><img src="' + data.text + '" /></li>');
    
    if ($('#growing-list > li').size() > 10) {
      $('#growing-list > li:first-child').remove();
    }
  });
});