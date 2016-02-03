// This is used to create a progress listener per:
// (https://developer.mozilla.org/en/Code_snippets/Progress_Listeners)
// Useful for tracking the progress of elements loading in the browser.
function br_progress_listener() {
  var listener = {
    start: Components.interfaces.nsIWebProgressListener.STATE_START,
    stop: Components.interfaces.nsIWebProgressListener.STATE_STOP,
    is_doc: Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT,
    QueryInterface: function(aIID) {
      if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
          aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
          aIID.equals(Components.interfaces.nsISupports)) {
        return this;
      }
      throw Components.results.NS_NOINTERFACE;
    },
    onLocationChange: function(aProgress, aRequest, aURI) { }, 
    onStateChange: function(aProgress, aRequest, aFlag, aStatus) { },
    onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) {},
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {},
    onSecurityChange: function(aWebProgress, aRequest, aState) {}
  };

  return listener;
}
