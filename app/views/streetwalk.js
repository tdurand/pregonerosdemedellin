define(['jquery',
        'underscore',
        'backbone',
        'models/Ways',
        'models/Sounds',
        'utils/GeoUtils',
        'utils/LocalParams',
        'utils/Logger',
        'utils/Localization',
        'text!templates/streetwalk/streetWalkViewTemplate.html',
        'popcorn'
        ],
function($, _, Backbone,
                Ways,
                Sounds,
                GeoUtils,
                LocalParams,
                LOGGER,
                Localization,
                streetWalkViewTemplate){

  var StreetWalkView = Backbone.View.extend({

    el:"#streetwalk",
    elImg:"#streetwalk .streetwalkImg",

    currentPosition:0,
    bodyHeight:5000,
    fullscreen:false,

    scrollToEndEventSended:false,

    events:{
        "click .toggle-sounds ":"toggleSounds",
        "submit #signup-mailchimp-form":"signUpMailChimp",
        "click .launching-button-share":"buttonShare"
    },

    initialize : function(params) {
        var self = this;

        self.wayName = params.wayName;
    },

    initSounds: function() {
        var self = this;

        self.sounds = new Sounds();
        self.sounds.init();
    },

    prepare:function() {

        var self = this;

        self.firstScroll = true;

        if(_.isUndefined(Localization.STR)) {
            
            self.listenToOnce(Localization,"STRLoaded", function() {
                self.render();
            });
        }
        else {
            self.render();
        }

        self.initSounds();

        window.scrollTo(0,0);

    },

    render:function() {

        var self = this;

        //render first still
        var pathFirstStill = "data/casapare/highres/way00.jpg";

        self.$el.html(_.template(streetWalkViewTemplate,{
            pathFirstStill:pathFirstStill,
            STR:Localization.STR,
            lang:Localization.translationLoaded
        }));

        //insert svg
        $.ajax({
              url: "templates/svg/scrolltostart_"+ Localization.translationLoaded+ ".html",
              success: function(data) {
                    self.$el.find(".scrolltostart").html(data);
                    self.loadPath();
              },
              error: function(e) {
                LOGGER.debug("Error while loading templates/svg/scrolltostart_"+ Localization.translationLoaded + ".html");
              }
        });

        //State bonus
        //if already unlocked
        if(LocalParams.getBonusUnlocked()) {
            self.$el.find('.launching-signup').hide();
            self.$el.find('.launching-signup-thanks').addClass("show");
        }

        // Add video bonus
        self.popcorn= Popcorn.smart( ".launching-bonusvideo", "http://player.vimeo.com/video/"+Localization.STR.teaserIdVimeo);
        
        self.popcorn.on("play",function() {
            //Mute sounds
            self.muteSounds();
            
        });
        
        $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(e)
        {
            if(self.fullscreen) {
                //tryfix chrome bug return from fullscreen
                window.scrollTo(0,5000);
                //return from fullscreen
                self.animating = true;
                self.computeAnimation(true);
                
            }
            else {
                //enter in fullscreen
                self.animating = false;
            }

            //update status
            if(self.fullscreen) {
                self.fullscreen = false;
            }
            else {
                self.fullscreen =  true;
            }
        });

        
    },

    loadPath: function() {
        var self = this;

        self.way = Ways.where({ wayName : self.wayName})[0];

        self.way.fetch();

        self.way.on("updatePercentageLoaded", function() {
            self.updateLoadingIndicator(self.way.percentageLoaded);
        });

        self.way.on("loadingFinished", function() {
            self.animating = true;
            self.currentStill = self.way.wayStills.first();
            self.$el.css("height",self.bodyHeight+"px");
            self.computeAnimation(true);
            self.computeScrollableElements();
            self.$el.find("#scrollToStartLoaded").show();
            self.$el.find("#scrollToStartLoading").hide();
            //init sounds
            // Update sounds volume
            if(self.sounds) {
                self.sounds.updateSounds(self.way.wayPath[self.currentStill.id]);
            }
        });
        
    },

    updateLoadingIndicator: function(pourcentage) {
        var self = this;
        self.$el.find(".loadingIndicator").text(pourcentage);
    },

    renderImg: function(imgNb) {
        var self = this;

        LOGGER.debug("RENDER IMGNB" + imgNb);

        if(self.currentStill && self.currentStill.id == imgNb) {
            //no need to render again same still
            return;
        }

        self.currentStill = self.way.wayStills.get(imgNb);

        if(!self.currentStill.loaded) {
            LOGGER.debug("IMG NB NOT LOADED :" +imgNb);

            function sortNumber(a,b) {
              return a - b;
            }
            //Get closest still loaded : TODO FIND THE BEST ALGORITHM, this one is not so optimized and insert the still in the array
            self.currentStill = self.way.wayStills.get(self.way.wayStills.stillLoaded.push( imgNb ) && self.way.wayStills.stillLoaded.sort(sortNumber)[ self.way.wayStills.stillLoaded.indexOf( imgNb ) - 1 ]);


            LOGGER.debug("Load IMG NB instead:" +self.currentStill.id);
        }

        $(self.elImg).attr("src", self.currentStill.get("srcLowRes"));

    },

    renderImgHighRes: function() {
        var self = this;

        LOGGER.debug("HIGH RES RENDER");

        self.currentStill.loadHighRes(function() {
            $(self.elImg).attr("src", self.currentStill.get("srcHighRes"));
        });

    },

    renderElements: function(imgNb) {

        var self = this;

    },

    computeScrollableElements: function() {
        var self = this;

        var lastElementPosition = self.bodyHeight - window.innerHeight;
        self.$el.find(".launching").css("bottom",-lastElementPosition+"px");
        self.$el.find(".launching").show();

    },

    computeAnimation: function(firstStill) {
        var self = this;

        if(self.animating) {
 
        //LOGGER.debug("Compute animation");

        var supportPageOffset = window.pageXOffset !== undefined;
        var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
        self.targetPosition  = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;

        if( Math.floor(self.targetPosition) != Math.floor(self.currentPosition) || firstStill) {
            //LOGGER.debug("Compute We have moved : scroll position " + self.currentPosition);
            var deaccelerate = Math.max( Math.min( Math.abs(self.targetPosition - self.currentPosition) * 5000 , 10 ) , 2 );
            self.currentPosition += (self.targetPosition - self.currentPosition) / deaccelerate;

            if(self.targetPosition > self.currentPosition) {
                self.currentPosition = Math.ceil(self.currentPosition);
            }
            else{
                self.currentPosition = Math.floor(self.currentPosition);
            }


            //Change image
            var availableHeigth = (self.bodyHeight - window.innerHeight);

            var imgNb = Math.floor( self.currentPosition / availableHeigth * self.way.wayStills.length);

            //Do not render same img (we can have changed position a bit but do not have image for this position)
            if(imgNb == self.currentStill.id) {
                LOGGER.debug("DO NOT RENDER SAME STILL " + imgNb);
            }
            else {

                //Make sure imgNb is in bounds (on chrome macosx we can scroll more than height (rebound))
                if(imgNb < 0) { imgNb = 0; }
                if(imgNb >= self.way.wayStills.length) { imgNb = self.way.wayStills.length-1; }

                if(imgNb == self.way.wayStills.length -1 && !self.scrollToEndEventSended) {
                    //send event to GA, scrolltoend reached
                    ga('send', 'event', 'ScrolledToTheEnd', 'yes');
                    self.scrollToEndEventSended = true;
                }

                //Render image
                self.renderImg(imgNb);
                
                //Render elements at this position:
                self.renderElements(imgNb);
                $("body").removeClass('not-moving');

                //Render highres after 100ms
                clearTimeout(self.highResLoadingInterval);
                self.highResLoadingInterval = setTimeout(function() {
                    self.renderImgHighRes();
                    $("body").addClass('not-moving');
                },100);

                // Update sounds volume
                if(self.sounds) {
                    self.sounds.updateSounds(self.way.wayPath[self.currentStill.id]);
                }
            }
        }

        window.requestAnimationFrame(function() {
            self.computeAnimation();
        });

        }
    },

    toggleSounds: function(e) {
        var self = this;

        var state = $(e.currentTarget).attr("data-state");

        if(state == "normal") {
            $(e.currentTarget).attr("data-state","muted");
            self.sounds.mute();
        }
        else {
            $(e.currentTarget).attr("data-state","normal");
            self.sounds.unmute();
        }
    },

    muteSounds: function() {
        var self = this;

        self.$el.find(".toggle-sounds").attr("data-state","muted");
        self.sounds.mute();
    },

    signUpMailChimp: function(e) {
        var self = this;

        e.preventDefault();

        self.$el.find('.launching-button-subscribe').attr('disabled','disabled');
        var label = self.$el.find('.launching-button-subscribe').val();
        self.$el.find('.launching-button-subscribe').val(label+" ...");
        self.$el.find('.launching-errorsignup').html("");

        $.ajax({
            url: self.$el.find('#signup-mailchimp-form').attr("action"),
            type: 'POST',
            data: self.$el.find('#signup-mailchimp-form').serialize(),
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            success: function (data) {
               self.$el.find('.launching-button-subscribe').removeAttr("disabled");
               self.$el.find('.launching-button-subscribe').val(label);
               if (data['result'] != "success") {
                    //ERROR
                    LOGGER.debug(data['msg']);
                    self.$el.find('.launching-errorsignup').html(data['msg']);
               } else {
                    //SUCCESS - Do what you like here
                    //redirect to teaser video
                    self.$el.find('.launching-signup').hide();
                    self.$el.find('.launching-signup-thanks').addClass("show");
                    LocalParams.setBonusUnlocked();
                    //send event to GA, bonus unlocked reached
                    ga('send', 'event', 'teaserUnlocked', 'yes');
               }
            }
        });
    },

    buttonShare: function(e) {
        e.preventDefault();

        ga('send', 'event', 'ClickonShareButton', 'yes');

        FB.ui({
          method: 'feed',
          link: 'http://www.pregonerosdemedellin.com/#'+Localization.translationLoaded,
          picture: 'http://pregonerosdemedellin.com/seo/screenshot_'+ Localization.translationLoaded +'.jpg',
          description: Localization.STR.teaserDescriptionHeadline + " " + Localization.STR.teaserDescriptionParagraph
        }, function(response){
        });
    },


    onClose: function(){
      //Clean
      this.undelegateEvents();
      this.way.clear();
      this.animating = false;
    }

  });

  return StreetWalkView;
  
});


