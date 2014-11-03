define([
        'jquery',
        'underscore',
        'backbone',
        'utils/AppView',
        'utils/Localization',
        'views/streetwalk'
        ],
    function($, _, Backbone,
                    AppView,
                    Localization,
                    StreetWalkView) {

        var Router = Backbone.Router.extend({
            routes: {
                '':                                     'streetwalk',
                ':lang':                                'streetwalk',
                ':lang/streetwalk':                     'streetwalk',
                ':lang/streetwalk/:way':                'streetwalk'
             },

        initialize: function() {
            var self = this;

            

        },

        streetwalk: function(lang,wayName) {

            var self = this;

            Localization.on("STRSuccess",function() {
                self.navigate("#"+Localization.translationLoaded, {trigger:false,replace:true});
            });

            Localization.init(lang);

            if(_.isUndefined(wayName)) {
                wayName = "casapare";
            }

            var streetWalkView = new StreetWalkView({
                wayName : wayName
            });

            streetWalkView = AppView.show(streetWalkView);
            AppView.changePage(streetWalkView);
        }

    });

    return Router;

});