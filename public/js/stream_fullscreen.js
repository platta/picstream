var fadeTimeout = 2500;
var toolbarShown = true;
var forceHide = false;
var timeoutHandle;

$(function() {
  $('#main_nav').mouseenter(function() {
    stopFade();
  });
  
  $('#main_nav').mouseleave(function() {
    resetFade();
  });
  
  $('#carousel').mousemove(function() {
    if (!forceHide) {
      showNav();
      resetFade();
    }
  });
  
  $('#carousel').click(function() {
    if (toolbarShown) {
      forceHide = true;
      hideNav();
    } else {
      showNav();
      resetFade();
    }
  });
  
  resetFade();
});

function stopFade() {
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
}

function resetFade() {
  stopFade();
  timeoutHandle = setTimeout(hideNav, fadeTimeout);
}

function hideNav() {
  var $main_nav = $('#main_nav');
  
  if (toolbarShown) {
    toolbarShown = false;
    $main_nav.stop().fadeOut(function() {
      setTimeout(function() {
        forceHide = false;
      }, 500);
    });
  }
}

function showNav() {
  var $main_nav = $('#main_nav');
  
  if (!toolbarShown) {
    toolbarShown = true;
    // Note: there is a bug in jQuery that will cause this not to work correctly if you
    // call this while a fadeOut animation is in progress.  Hopefully fixed in 1.11.1
    // whenever that gets released...
    $main_nav.stop().fadeIn();
  }
  forceHide = false;
}