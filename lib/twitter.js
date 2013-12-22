/**
 * Twitter library
 * Handles integration with the Twitter API and their authentication strategy.
 */

module.exports.socketHandler = function(socket) {
  return function(data) {
    if (data.entities.media) {
      data.entities.media.forEach(function(item) {
        socket.emit('new-image', {
          service: 'twitter',
          url: item.media_url
        });
      });
    }
  };
};