define(['jquery',
        'underscore',
        'backbone',
        'models/Sound'
        ],
function($, _, Backbone,
                Sound){

  var Sounds = Backbone.Collection.extend({

    model: Sound,

    init:function(params) {
        
        var self = this;

        self.add([
          {position: [6.257793859679471,-75.61135411262512],
            name:"pregonnegra",
            db:30
           },
          {position: [6.257884511393891,-75.61177790164948],
            name:"bruitdefondmusic",
            db:30
           },
           {position: [6.257983161771122,-75.61168402433395],
            name:"pregonlimonpajarito",
            db:30
           }
        ]);
    },

    updateSounds: function(newUserPosition) {
        var self = this;
        _.each(self.models, function(sound) {
            sound.updateSound(newUserPosition);
        });
    },

    addMarkersToMap: function(map) {
        var self = this;
        _.each(self.models, function(sound) {
            L.marker(sound.position).addTo(map);
        });
    },

    mute: function() {
        var self = this;
        _.each(self.models, function(sound) {
            sound.sound.stop();
        });
    }


  });

  return Sounds;
  
});


