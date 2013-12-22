$(function() {
  var params = parseGetParameters();
  
  if (params.keyword) {
    var rootUrl = $('#root-url').val();
    var socket = io.connect(rootUrl);
    
    socket.on('new-image', function(data) {
      $('#growing-list').append('<li><strong>' + data.service + '</strong> - <img src="' + data.url + '" /></li>');
    
      if ($('#growing-list > li').size() > 50) {
        $('#growing-list > li:first-child').remove();
      }
    });
    
    socket.emit('start', {keyword: params.keyword});
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