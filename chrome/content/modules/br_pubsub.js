// Bare bones, fast publish subscribe. Will return an object that lets you drive
// the events; you can also pass in an object that will be augmented with the functions
// directly.

/**
 * EXAMPLE
 * var my_events = br_pubsub();
 *
 * my_events.sub("echo", function(value) { alert(value); });
 * my_events.sub("echo", function(value) { alert(value); });
 *
 * my_events.pub("echo", ["hello!"]); // hello! hello!
 **/
var br_pubsub = function(subject) {
  var me = {};
  subject = subject || {};
  me.functions = {};
  me.sub = function(topic, callback) {
    if(!me.functions[topic]) {
      me.functions[topic] = [];
    }
    me.functions[topic].push(callback);
  };
  me.pub = function(topic, args) {
    var i, ii, funcs = me.functions[topic];

    if(!funcs) {return;}
    
    for(i = 0, ii = funcs.length; i<ii; i++) {
      funcs[i].apply(me, args || []);
    }
  };
  me.clear = function(topic, func) {
    var i, ii, funcs;
    if(!topic) { 
      me.functions = {};
    } else if(!func) {
      me.functions[topic] = [];
    } else {
      funcs = me.functions[topic];
      if(!funcs) {return;}
      for(i=0, ii = funcs.length; i<ii; i++) {
        if(func === funcs[i]) {
          funcs.splice(i, 1);
        }
      }
    }
  };

  // If you pass in an object, then the object will be augmented with 
  // pub, sub, and clear directly.
  subject.pub = me.pub;
  subject.sub = me.sub;
  subject.clear = me.clear;
  return me;
};
