/**
 * Twitter library
 * Handles integration with the Twitter API and their authentication strategy.
 */

module.exports.socketHandler = function(socket) {
  return function(data) {
    if (data.entities.media) {
      data.entities.media.forEach(function(item) {
        socket.emit('new-image', module.exports.createItem(data, item));
      });
    }
  };
};

module.exports.createItem = function(data, media) {
  return {
    service: 'twitter',
    url: media.media_url,
    created: new Date(data.created_at),
    user: {
      username: data.user.screen_name,
      name: data.user.name,
      image: data.user.profile_image_url
    }
  };
}