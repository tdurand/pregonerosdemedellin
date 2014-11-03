define(["underscore",
       "backbone",
       "utils/LocalParams"],
            function(
                _,
                Backbone,
                LocalParams) {

    var Localization = {

        init: function(lang) {
            var self = this;

            if(lang) {
                if(self.isLangInSupportedTranslation(lang)) {
                    self.loadTranslation(lang, true);
                    return;
                }
            }

            if(_.isNull(LocalParams.getUserTranslationLang())) {
                var navigatorLang = self.getNavigatorLang();
                //Try to set the translation on the navigator of the user
                if(self.isLangInSupportedTranslation(navigatorLang)) {
                    self.loadTranslation(navigatorLang, true);
                }
                //if not available
                else {
                    //Try to set English
                    if(self.isLangInSupportedTranslation("en")) {
                        self.loadTranslation("en", true);
                    }
                }
            }
            else {
                //Not the first use
                self.loadTranslation(LocalParams.getUserTranslationLang(), true);
            }
        },

        loadTranslation: function(translation, firstLoad) {
            var self = this;

            $.ajax({
              url: self.getPath(translation),
              async : true,
              // dataType: 'json',
              success: function(data) {
                self.STR = data;
                self.translationLoaded = translation;
                LocalParams.setUserTranslationLang(translation);
                if(firstLoad) {
                    self.trigger("STRSuccess STRLoaded");
                }
                else {
                    self.trigger("STRSuccess STRChanged");
                }
              },
              error: function(e) {
                console.log('Error while loading : ' + self.getPath(translation));
              }
            });
        },

        getPath:function(translation) {
            var self = this;

            var path = "data/content/string_"+translation+".json";

            return path;
        },

        getSupportedTranslation:function() {
            return ['en','fr','es'];
        },

        isLangInSupportedTranslation:function(lang) {
            return _.contains(this.getSupportedTranslation(),lang);
        },

        getNavigatorLang:function() {
            var language = window.navigator.language;
            var lang = "";
            if(language) {
                lang = language.substring(0,2);
            }
            return lang;
        }

    };

    //Give capability to use events
    _.extend(Localization, Backbone.Events);

    return Localization;

});