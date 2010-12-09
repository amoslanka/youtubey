window.YouTubeState = {
    UNSTARTED:  -1,
    ENDED:      0,
    PLAYING:    1,
    PAUSED:     2,
    BUFFERING:  3,
    CUED:       5
};

window.YouTubeY = {
	CURRENT_CLASS: 'current'
}

var go_youtubey = function(id, props, player_container, controls_container, additional_class_objects) {
	props = props || {};
	var thisVideo = {};

	// A list of html elements that will receive the different classes applied for different states of being for the video player
	var classable = $(controls_container).add($(player_container));

	thisVideo.id = id;
	thisVideo.name = '';
	thisVideo.container = player_container;
	thisVideo.params = {
		type    : 'youtube',
		videoId : id,
		chromeless: true,
		resize: true,
		autoPlay: props.autoPlay || false,
		enablejsapi:1,
		version:3
	}
	
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// Disabled chromeless player!!!!!!!!!!!!!!!!!!!!!!!
	thisVideo.params.chromeless = false;
	controls_container = null;
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	

	// assign the 'current' class and attach the video. Currently uses 
	// jquery.vid.js
	// thisVideo.container.addClass(YouTubeY.CURRENT_CLASS);
	thisVideo.container.vid(thisVideo.params);

	// Add additional params that are necessary for api controls.
	$('object', thisVideo.container).append('<param value="#000000" name="bgcolor"/>');
	$('object', thisVideo.container).append('<param value="always" name="allowScriptAccess"/>');
	$('object', thisVideo.container).attr('id', id);
	$('embed', thisVideo.container).attr('bgcolor', '#000000');
	$('embed', thisVideo.container).attr('allowScriptAccess', 'always');
	$('embed', thisVideo.container).attr('id', id);

	// thisVideo.api = $('#'+current.video);
	var api = document.getElementById(id);
	thisVideo.api = api;

	var controls = function(container) {
			var controls = {
				container: container,
				play_pause: $('.play-pause', container),
				volume: $('.volume', container),
				scrub: $('.scrub', container),
				progress: $('.progress', container),
				cc: $('.cc', container)
			};

			// Play / Pause
			controls.play_pause.click(function(){
				toggle_play_pause();
				return false;
			});
			var toggle_play_pause = function() {
				if (thisVideo.state == YouTubeState.PLAYING) { 
					thisVideo.api.pauseVideo();
				} else {
					thisVideo.api.playVideo();
				}
			}

			// Captioning / Transcript
			controls.cc.click(function(){
				return false;
			});

			// Volume
			controls.volume.click(function(){
				switch(api.getVolume())
				{
					case 0:
						api.setVolume(100);
				  	break;
					case 50:
						api.setVolume(00);
					break;
					default:
						api.setVolume(50);
					break;
				}

				update_volume_classes();
				return false;
			});
			var update_volume_classes = function(){
				var c = 'volume-';
				if (typeof(api.getVolume) == 'function') { 
					c += api.getVolume();
				} else {
					c += '100';
				}
				classable.each(function(){
					$(this).removeClass('volume-0').removeClass('volume-50').removeClass('volume-100');
					$(this).addClass(c);
				});
				// controls.container.removeClass('volume-0').removeClass('volume-50').removeClass('volume-100');
				// video_player.removeClass('volume-0').removeClass('volume-50').removeClass('volume-100');
				// controls.container.addClass(c);
				// video_player.addClass(c);
			}
			update_volume_classes();

			// Scrub Slider / Progress Bar
			controls.scrub.slider({ min: 0, max: 100 });
			$('a', controls.scrub).click(function(){ return false; });
			controls.progress.progressbar({value:37});
			controls.scrub.bind( "slide", function(event, ui) {
				// set the progress bar
				controls.progress.progressbar('option', 'value', ui.value / controls.scrub.slider('option', 'max') * 100);
				// set the video seek.
			});
			controls.scrub.bind( 'slidestart', function(event, ui){
				api.playVideo();
				api.pauseVideo();
			});
			controls.scrub.bind( 'slidestop', function(event, ui){
				// api.playVideo();
				var l = ui.value / 100 * api.getDuration();
				api.seekTo(l);
				api.playVideo();

				console.log('seekTo: ', l);

			});
		
			var update_video_progress = function(){
				var p = 0;
				if (typeof(api.getCurrentTime) == 'function') {
					p = api.getCurrentTime() / api.getDuration() * 100;
				}
				controls.progress.progressbar('option', 'value', p);
				// console.log("update_video_progress: ", p);

			}
			controls.update_video_progress = update_video_progress;
			update_video_progress();

			// Video Controls animation
			var hide_video_controls = function(speed){
				if (speed == undefined || speed == null) { speed = 300; }
				clearTimeout(controls.hide_timeout);
				controls.container.fadeOut(speed);
			};
			controls.hide_video_controls = hide_video_controls;
			hide_video_controls();
			var show_video_controls = function(speed){
				if (speed == undefined || speed == null) { speed = 300; }
				controls.container.fadeIn(speed);
			}
			controls.show_video_controls = show_video_controls;

			// Mouse move to animate controls.
			thisVideo.container.mousemove(function(){
				clearTimeout(controls.hide_timeout);
				if (controls.can_show) {
					show_video_controls();
					if (controls.can_hide) {
						controls.hide_timeout = setTimeout(hide_video_controls, 2000);
					}
				}
			});

			// console.log('controls: ' , controls);
		
			controls.destroy = function() {
				hide_video_controls();
				controls.scrub.slider( "destroy" );
				clearInterval(controls.progress_interval);
			}

			return controls;
		}(controls_container);
	thisVideo.controls = controls;
	
	// buildVideoControls(api, video_controls);

	// a method called from the main window when player has loaded.
	thisVideo.handle_youtube_player_ready = function(playerId) {
	
		// api.addEventListener('onStateChange', 'onStateChange');
		api.addEventListener("onStateChange", "onPlayerStateChange");
		api.addEventListener("onError", "onPlayerError");
		
		api.cueVideoById(thisVideo.id);
		if (params.autoPlay) {
			api.playVideo();
		}
	}
	thisVideo.handle_youtube_player_state_change = function(state) {
		
		setClassesByState(state);
		console.log('handle_youtube_player_state_change:', state);
		
		thisVideo.state = state;
		// clearInterval(controls.progress_interval);
		console.log('got here:', state);

		controls.can_show = false;
		controls.can_hide = true;
		console.log('got here a little further:', state);
		
		switch(state)
		{
			case YouTubeState.ENDED:
			
				console.log("IT HAS ENDED!");
			

				api.cueVideoById(thisVideo.id);
				controls.progress.progressbar('option', 'value', 0);
		
				hide_video_controls(0);
		  	break;
			case YouTubeState.CUED:
				// a simple fade applied to a cued video. (fades in once its loaded)
				thisVideo.container.fadeTo(0, .01);
				setTimeout(function(){ thisVideo.container.fadeTo(300, 1); }, 100);
				
			break;
			case YouTubeState.PLAYING:
				// update max property on slider
				controls.scrub.slider(( "option", 'max', api.getDuration() ));
				
				// set interval to monitor progress
				controls.progress_interval = setInterval(controls.update_video_progress, 100);
				controls.can_show = true;
			break;
			case YouTubeState.PAUSED:
				controls.can_show = true;
				controls.can_hide = false;
			break;
		}
		
	}
	thisVideo.handle_youtube_player_error = function(err) {
		console.log('handle_youtube_player_error:', err);
	}

	
	var setClassesByState = function(state) {
		// if state is null, we remove all the classes from the objects.
		
		for (var i=0; i < classable.length; i++) {
			var e = $(classable[i]);

			// remove the state classes
			e.removeClass('unstarted').removeClass('ended').removeClass('playing').removeClass('paused').removeClass('buffering').removeClass('cued');
			// remove the general classes
			e.removeClass(YouTubeY.CURRENT_CLASS);
		
			var add = '';
			switch(state) {
				case YouTubeState.UNSTARTED:
					add = 'unstarted'
				break;
				case YouTubeState.ENDED:
					add = 'ended'
				break;
				case YouTubeState.PLAYING:
					add = 'playing'
				break;
				case YouTubeState.PAUSED:
					add = 'paused'
				break;
				case YouTubeState.BUFFERING:
					add = 'buffering'
				break;
				case YouTubeState.CUED:
					add = 'cued'
				break;
			}
			
			if (state != null) {
				e.addClass(add);
				e.addClass(YouTubeY.CURRENT_CLASS);
			}
		}
	}
	thisVideo.setClassesByState = setClassesByState;

	var destroy = function() {
		console.log("destroying", thisVideo.name, thisVideo.id, this);
		
		// effectively removes css classes.
		setClassesByState(null);
		if (controls) {controls.destroy();}
		$(api).remove();
	}
	thisVideo.destroy = destroy;

	return thisVideo;
}


// $(document).ready(function() {
// 	// auto initialize any youtuby videos.
// 	$('.youtubey')
// });
