var fadeTimeout = 5000;
var timeoutHandle;

$(function() {
  $('#main_nav').mouseenter(function() {
    stopFade();
  });
  
  $('#main_nav').mouseleave(function() {
    resetFade();
  });
  
  $('#carousel').mousemove(function() {
    showNav();
    resetFade();
  });
  
  $('#carousel').click(function() {
    showNav();
  });
});

function stopFade() {
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
}

function resetFade() {
  stopFade();
  timeoutHandle = setTimeout(hideNav, fadeTimeout);
}

function hideNav() {
  $('#main_nav').fadeOut();
}

function showNav() {
  $('#main_nav').fadeIn();
}