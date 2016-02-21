
var canvas = document.getElementById("canvas"),
	context = canvas.getContext("2d"),
	button = document.getElementById("snap"),
	video = document.getElementById("video"),
	videoContainer = document.querySelector('.video'),
	heroPanel = document.getElementById("heroPanel"),
	heroIcon = document.getElementById("heroIcon"),
	heroLoader = document.getElementById("heroLoader"),
	actions = document.querySelector('.actions')

var imageUrl;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;


videoContainer.style.height = videoContainer.offsetWidth / 1.33333 + 'px';


var videoObj = {
		"video": {
			mandatory: {
				"minWidth": "640",
				"minHeight": "480",
				"minAspectRatio": "1.333",
				"maxWidth": "640",
				"maxHeight": "480",
				"maxAspectRatio": "1.333"
			}
		}
	},
	errBack = function(error) {
		console.log("Video capture error: ", error.code);
	};
	
navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;

if (navigator.getUserMedia) {

	navigator.getUserMedia(
		videoObj,
		function(stream) {
		    
            video.src = window.URL.createObjectURL(stream);
			video.play();
            startAutoCapturing();
		},
		function(error) {
			console.log(error)
			alert('Sorry, the browser you are using doesn\'t support getUserMedia. You are probably using Chrome. Chrome requires https for getUserMedia to work. We will do that in production. But, this Hackathon is running under Koding VMs. We suggest Firefox for this Hackathon.');
			return;
		}
	);
} else {
	alert('Sorry, the browser you are using doesn\'t support getUserMedia. You are probably using IE or Safari or an old browser. That would take flash fallback which would have been done in production. We suggest Firefox for this Hackathon.');
}					 

var down;
if ("ontouchstart" in window) {
	down = 'touchstart';
} else {
	down = 'mousedown';
}

var progressInterval, ctr=0,max= 1.005;
function startAutoCapturing() {
   
    setTimeout(function(){
        captureImage(true);
        setTimeout(function(){
            startProgressInterval();
        }
        , 1000);
    }
    , 1000);
}

function startProgressInterval() {
     progressInterval = setInterval(function(){
        ctr++;
        var value = ctr * max;
        $( ".progress-bar" ).css( "width", value + "%" ).attr( "aria-valuenow", value ); 
        
         if (ctr==100){
            captureImage(true);
            clearInterval(progressInterval);
            $(".progress-bar").css( "width", "0px").attr( "aria-valuenow", 0); 
            ctr=0;
            
            setTimeout(function(){
                startProgressInterval();
            }
            , 1000);
        }
    }
    , 300); 
}

// Trigger photo take
button.addEventListener(down, function() {
    clearInterval(progressInterval);
    $(".progress-bar").css( "width", "0px").attr( "aria-valuenow", 0); 
    ctr=0;
	showHero();
	captureImage();
});

function captureImage(autoClose) {
	var box = canvas.getBoundingClientRect()
	canvas.width = box.width;
	canvas.height = box.height;
	context.drawImage(video, 0, 0, box.width, box.height);
	getBase(autoClose);
}



function getBase(autoClose) {

	var imgBase = canvas.toDataURL("image/png");
	var imgBlob = dataURItoBlob(imgBase);
	
	callFaceAPI(imgBlob, autoClose);
}

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}


function callFaceAPI(imgBlob, autoClose) {


	var http = new XMLHttpRequest();
	var url = 'https://api.projectoxford.ai/emotion/v1.0/recognize';

	http.open("POST", url, true);
	http.setRequestHeader('Content-type', 'application/octet-stream');
	http.setRequestHeader('Ocp-Apim-Subscription-Key', '5197021d4ac24dddac73726a3fcf17ec');
	http.onreadystatechange = function() {

		if (http.readyState == 4 && http.status == 200) {

           
            var x2js = new X2JS({
                arrayAccessFormPaths : [
                   "ArrayOfFaceRecognitionResult.FaceRecognitionResult"
                ]
            });
            
            var jsonObj = x2js.xml_str2json(http.response);
            
            if(jsonObj && jsonObj.ArrayOfFaceRecognitionResult && jsonObj.ArrayOfFaceRecognitionResult.FaceRecognitionResult) {
                if(jsonObj.ArrayOfFaceRecognitionResult.FaceRecognitionResult.length > 0) {
                    draw(jsonObj.ArrayOfFaceRecognitionResult.FaceRecognitionResult, autoClose);
                } else {
                    hideHero();
                    if(autoClose)
                        tryAgain();
                    
                }
            } else {
                hideHero();
                if(autoClose)
                    tryAgain();
                
            }
		}
	}

	http.send(imgBlob);
}

function draw(data, autoClose) {

	console.log('Face API', data)

  
	hideHero();

	var i = 0,
		il = data.length;

	
	var storedFaceData = localStorage.getItem("emotialize-data-2");
	if(!storedFaceData || typeof storedFaceData == 'undefined' || storedFaceData == '')
        storedFaceData = [];
    else
        storedFaceData = JSON.parse(storedFaceData);

	for (; i < il; i += 1) {

		var face = data[i],
			faceRectangle = face.faceRectangle,
			top = faceRectangle.top - 16,
			left = faceRectangle.left - 8,
			width = faceRectangle.width,
			height = faceRectangle.height;
			
		face.time = new Date();
		storedFaceData.push(face);
        
        var style = 'top:' + top + 'px;left:' + left + 'px;width:' + width + 'px;height:' + height + 'px;'; 
     
       
        var $labelBox = $('<div />', {
            'onmouseout': 'hideImginfo()',
            'class': 'labelbox labelpointer',
            'style': style
        });
        $labelBox.data("faceData", face);
        
        $labelBox.mouseover(showFaceInfo);
        
        $labelBox.data('data', face);
        
        var $labelBorder =  $('<div />', {
              'class': 'malelabelboxborder'
        }).appendTo($labelBox);
        
        
        $('#canvas').before($labelBox);

	}
	
	localStorage.setItem("emotialize-data-2", JSON.stringify(storedFaceData));
    initChart();
    
    if(autoClose){
        tryAgain();
    }
}



function showFaceInfo( ev) {
    
    var target = $(ev.target);
    if(target.hasClass('malelabelboxborder'))
        target = target.parent();
        
    var Scores = target.data( "faceData" ).scores;
    
    var html = '<p><span>Anger</span>' + Number(Scores.anger).toFixed(5) + '</p>';
    html += '<p><span>Contempt</span>' + Number(Scores.contempt).toFixed(5) + '</p>';
    html += '<p><span>Disgust</span>' + Number(Scores.disgust).toFixed(5) + '</p>';
    html += '<p><span>Fear</span>' + Number(Scores.fear).toFixed(5) + '</p>';
    html += '<p><span>Happiness</span>' + Number( Scores.happiness).toFixed(5) + '</p>';
    html += '<p><span>Neutral</span>' + Number(Scores.neutral).toFixed(5) + '</p>';
    html += '<p><span>Sadness</span>' + Number(Scores.sadness).toFixed(5) + '</p>';
    html += '<p><span>Surprise</span>' + Number(Scores.surprise).toFixed(5) + '</p>';
    
  
    var width = target.width();
    var top = target.position().top;
    var left = target.position().left;
    var height = target.height();

    var faceinfobox = $(".faceinfo");
    faceinfobox.children(".facecode").html(html);
    var faceinfoboxHeight = faceinfobox.height();
    
    faceinfobox.css("top", Number(top) + height / 2 - faceinfoboxHeight / 2 - 10 + "px")
            .css("left", Number(width) + Number(left) + 10 + "px");
            
    faceinfobox.show();
}

function hideImginfo() {
    $(".faceinfo").hide();
}

function showHero() {

	var hero = video,
		hero__icon = heroIcon,
		mark = button;

	heroIcon.style.opacity = 1;

	var iconRect = hero__icon.getBoundingClientRect(),
		markRect = mark.getBoundingClientRect(),
		heroRect = hero.getBoundingClientRect();

	var targetRect = {
		left: iconRect.left + (markRect.left - iconRect.left),
		top: iconRect.top + 0 + (heroRect.bottom - iconRect.bottom)
	};

	var v1 = [targetRect.left, targetRect.top],
		v2 = [iconRect.left, iconRect.top],
		deltaY = v2[1] - v1[1],
		deltaX = v2[0] - v1[0],

		angleInDegrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI,
		w = targetRect.left - iconRect.left,
		l = targetRect.top - iconRect.top,
		d = Math.sqrt(w * w + l * l);

	var rotation = angleInDegrees,
		compensation = -rotation,
		x = -d,
		y = 0,
		r2 = 0

	if (iconRect.left < targetRect.left && iconRect.top < targetRect.top) {

		if (w < l) {

			rotation = angleInDegrees + 90;
			x = 0;
			y = d;

		} else {

			r2 = angleInDegrees + (180 + angleInDegrees)
		}

	} else if (iconRect.left < targetRect.left && iconRect.top > targetRect.top) {
		r2 = 90;

	} else if (iconRect.left > targetRect.left && iconRect.top < targetRect.top) {

		if (Math.abs(w) < Math.abs(l)) {

			rotation = angleInDegrees + 90;
			x = 0;
			y = d;

		} else {

			r2 = angleInDegrees * 2;
		}
	}

	compensation = -rotation;

	button.style[paper.capabilities.transform] = 'scale(0)';

	paper.transition(hero__icon, [{
		transform: 'rotate(' + rotation + 'deg)' + 'translateX(' + x + 'px)' + 'translateY(' + y + 'px)' + 'rotate(' + compensation + 'deg)',
	}, {
		transform: 'rotate(' + r2 + 'deg) translateX(0px) translateY(0px) rotate(' + -r2 + 'deg)'
	}], {
		duration: 300,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
		delay: 0,

	}).onfinish = function() {
		loadingPanel();
	}
}

function loadingPanel() {

	heroPanel.style.overflow = 'hidden';

	paper.transition(heroIcon, [{
		transform: 'scale(1)',
	}, {
		transform: 'scale(15)'
	}], {
		duration: 300,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	}).onfinish = function() {
		heroLoader.style.opacity = 1;
	}
}

function hideHero() {

	heroLoader.style.opacity = 0;
	canvas.style.display = 'block';
	canvas.style.opacity = 1;
	heroIcon.style.opacity = 1;


	paper.transition(heroIcon, [{
		transform: 'scale(15)',
	}, {
		transform: 'scale(0)'
	}], {
		duration: 300,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	})

	paper.transition(actions, [{
		transform: 'translateY(0px)'
	}, {
		transform: 'translateY(64px)'
	}], {
		duration: 200,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
		delay: 320
	})
	

}


document.querySelector('.new').addEventListener(down, function() {
    startProgressInterval();
    tryAgain();
}, false);

function tryAgain() {
    
    $(".faceinfo").hide();
    $(".facecode").html('');
    $('.labelbox').hide();
    
  canvas.style.opacity = 0;
	context.clearRect(0, 0, canvas.width, canvas.height);
	heroPanel.style.overflow = 'visible'

	paper.transition(actions, [{
		transform: 'translateY(65px)'
	}, {
		transform: 'translateY(0px)'
	}], {
		duration: 200,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	})

	paper.transition(button, [{
		transform: 'scale(0)',
	}, {
		transform: 'scale(1)'
	}], {
		duration: 300,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	})
    
}



$(document).ready(function() {
    initChart();
});

$('#clearData').click(function() {
    if(confirm("Are you sure you want to clear your emotion analytic data? It will be deleted permantely.")) {
        localStorage.setItem("emotialize-data-2", "");
        initChart();
    }
});

var chart;

$( "#graph-type" ).change(function() {
    initChart();
});

function initChart() {
    
    var graphType =  $( "#graph-type" ).val();
    
    if(graphType == 'hourly') {
        $('#chart-container-daily').hide();
        $('#chart-container-hour').show();
        initHourChart();
    } else {
         $('#chart-container-daily').show();
        $('#chart-container-hour').hide();
        initDailyChart();
    }
    
}

function initDailyChart() {
    chart = new Highcharts.Chart({
        
        chart: {
            type: 'heatmap',
            renderTo: 'chart-container-daily',
            marginTop: 40,
            marginBottom: 80,
            plotBorderWidth: 1
        },


        title: {
            text: 'Emotions per day'
        },

        xAxis: {
            categories: ['anger', 'disgust', 'sadness', 'fear', 'neutral', 'contempt', 'surprise', 'happiness']
        },

        yAxis: {
            categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            title: null
        },

        colorAxis: {
            min: 0,
            max: 1,
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[0]
        },

        legend: {
            align: 'right',
            layout: 'vertical',
            margin: 0,
            verticalAlign: 'top',
            y: 25,
            symbolHeight: 280
        },
        tooltip: {
          enabled: false  
        },
        credits: {
          enabled: false
        },
        series: [{
            name: 'Emotions',
            borderWidth: 1,
            data : (function () {
                //TODO: make sure we are getting this weeks days
                var thisWeeksSunday = moment().startOf('week');
                var thisWeeksMonday = moment().startOf('week').add('days', 1);
                var thisWeeksTuesday = moment().startOf('week').add('days', 2);
                var thisWeeksWednesday = moment().startOf('week').add('days', 3);
                var thisWeeksThursday = moment().startOf('week').add('days', 4);
                var thisWeeksFriday = moment().startOf('week').add('days', 5);
                var thisWeeksSaturday = moment().startOf('week').add('days', 6);
            
                
                var data = [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 6, 0], 
                            [1, 0, 0], [1, 1, 0], [1, 2, 0], [1, 3, 0], [1, 4, 0], [1, 5, 0], [1, 6, 0],
                            [2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 3, 0], [2, 4, 0], [2, 5, 0], [2, 6, 0], 
                            [3, 0, 0], [3, 1, 0], [3, 2, 0], [3, 3, 0], [3, 4, 0], [3, 5, 0], [3, 6, 0], 
                            [4, 0, 0], [4, 1, 0], [4, 2, 0], [4, 3, 0], [4, 4, 0], [4, 5, 0], [4, 6, 0], 
                            [5, 0, 0], [5, 1, 0], [5, 2, 0], [5, 3, 0], [5, 4, 0], [5, 5, 0], [5, 6, 0], 
                            [6, 0, 0], [6, 1, 0], [6, 2, 0], [6, 3, 0], [6, 4, 0], [6, 5, 0], [6, 6, 0],
                            [7, 0, 0], [7, 1, 0], [7, 2, 0], [7, 3, 0], [7, 4, 0], [7, 5, 0], [7, 6, 0]];
                             
                var storedFaceData = localStorage.getItem("emotialize-data-2");
                if(storedFaceData && typeof storedFaceData !== 'undefined' && storedFaceData !== "") {
                
                    storedFaceData = JSON.parse(storedFaceData);
                    for (i = 0; i < storedFaceData.length; i++) {
                        
                        var face = storedFaceData[i];
                        var time = moment(face.time);
                        var row = time.day();
                        var scores = face.scores;
                            
                        setData(data, row, 0, scores.anger);
                        setData(data, row, 1, scores.disgust);
                        setData(data, row, 2, scores.sadness);
                        setData(data, row, 3, scores.fear);
                        setData(data, row, 4, scores.neutral);
                        setData(data, row, 5, scores.contempt);
                        setData(data, row, 6, scores.surprise);
                        setData(data, row, 7, scores.happiness);
                     
                    }
                
                }
                return data; 
            }()),
            dataLabels: {
                enabled: true,
                color: '#000000'
            }
        }]

    });
    
}




function initHourChart() {
    chart = new Highcharts.Chart({
        
        chart: {
            type: 'heatmap',
            renderTo: 'chart-container-hour',
            marginTop: 40,
            marginBottom: 80,
            plotBorderWidth: 1
        },


        title: {
            text: 'Emotions per hour'
        },

        xAxis: {
            categories: ['anger', 'disgust', 'sadness', 'fear', 'neutral', 'contempt', 'surprise', 'happiness']
        },

        yAxis: {
            categories: ['0000', '0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010', '0011', '0012', 
                        '0013', '0014', '0015', '0016', '0017', '0018', '0019', '0020', '0021', '0022', '0023', '0024'],
            title: null
        },

        colorAxis: {
            min: 0,
            max: 1,
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[0]
        },

        legend: {
            align: 'right',
            layout: 'vertical',
            margin: 0,
            verticalAlign: 'top',
            y: 25,
            symbolHeight: 480
        },
        tooltip: {
          enabled: false  
        },
        credits: {
          enabled: false
        },
        series: [{
            name: 'Emotions',
            borderWidth: 1,
            data : (function () {
                //TODO: make sure we are getting this weeks days
                var thisWeeksSunday = moment().startOf('week');
                var thisWeeksMonday = moment().startOf('week').add('days', 1);
                var thisWeeksTuesday = moment().startOf('week').add('days', 2);
                var thisWeeksWednesday = moment().startOf('week').add('days', 3);
                var thisWeeksThursday = moment().startOf('week').add('days', 4);
                var thisWeeksFriday = moment().startOf('week').add('days', 5);
                var thisWeeksSaturday = moment().startOf('week').add('days', 6);
            
                
                var data = [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 6, 0],[0, 7, 0], [0, 8, 0], [0, 9, 0], [0, 10, 0], [0, 11, 0], [0, 12, 0], [0, 13, 0],[0, 14, 0], [0, 15, 0], [0, 16, 0], [0, 17, 0],[0, 18, 0], [0, 19, 0], [0, 20, 0], [0, 21, 0], [0, 22, 0], [0, 23, 0],    
                            [1, 0, 0], [1, 1, 0], [1, 2, 0], [1, 3, 0], [1, 4, 0], [1, 5, 0], [1, 6, 0],[1, 7, 0], [1, 8, 0], [1, 9, 0], [1, 10, 0], [1, 11, 0], [1, 12, 0], [1, 13, 0],[1, 14, 0], [1, 15, 0], [1, 16, 0], [1, 17, 0],[1, 18, 0], [1, 19, 0], [1, 20, 0], [1, 21, 0], [1, 22, 0], [1, 23, 0], 
                            [2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 3, 0], [2, 4, 0], [2, 5, 0], [2, 6, 0],[2, 7, 0], [2, 8, 0], [2, 9, 0], [2, 10, 0], [2, 11, 0], [2, 12, 0], [2, 13, 0],[2, 14, 0], [2, 15, 0], [2, 16, 0], [2, 17, 0],[2, 18, 0], [2, 19, 0], [2, 20, 0], [2, 21, 0], [2, 22, 0], [2, 23, 0], 
                            [3, 0, 0], [3, 1, 0], [3, 2, 0], [3, 3, 0], [3, 4, 0], [3, 5, 0], [3, 6, 0],[3, 7, 0], [3, 8, 0], [3, 9, 0], [3, 10, 0], [3, 11, 0], [3, 12, 0], [3, 13, 0],[3, 14, 0], [3, 15, 0], [3, 16, 0], [3, 17, 0],[3, 18, 0], [3, 19, 0], [3, 20, 0], [3, 21, 0], [3, 22, 0], [3, 23, 0], 
                            [4, 0, 0], [4, 1, 0], [4, 2, 0], [4, 3, 0], [4, 4, 0], [4, 5, 0], [4, 6, 0],[4, 7, 0], [4, 8, 0], [4, 9, 0], [4, 10, 0], [4, 11, 0], [4, 12, 0], [4, 13, 0],[4, 14, 0], [4, 15, 0], [4, 16, 0], [4, 17, 0],[4, 18, 0], [4, 19, 0], [4, 20, 0], [4, 21, 0], [4, 22, 0], [4, 23, 0], 
                            [5, 0, 0], [5, 1, 0], [5, 2, 0], [5, 3, 0], [5, 4, 0], [5, 5, 0], [5, 6, 0],[5, 7, 0], [5, 8, 0], [5, 9, 0], [5, 10, 0], [5, 11, 0], [5, 12, 0], [5, 13, 0],[5, 14, 0], [5, 15, 0], [5, 16, 0], [5, 17, 0],[5, 18, 0], [5, 19, 0], [5, 20, 0], [5, 21, 0], [5, 22, 0], [5, 23, 0], 
                            [6, 0, 0], [6, 1, 0], [6, 2, 0], [6, 3, 0], [6, 4, 0], [6, 5, 0], [6, 6, 0],[6, 7, 0], [6, 8, 0], [6, 9, 0], [6, 10, 0], [6, 11, 0], [6, 12, 0], [6, 13, 0],[6, 14, 0], [6, 15, 0], [6, 16, 0], [6, 17, 0],[6, 18, 0], [6, 19, 0], [6, 20, 0], [6, 21, 0], [6, 22, 0], [6, 23, 0], 
                            [7, 0, 0], [7, 1, 0], [7, 2, 0], [7, 3, 0], [7, 4, 0], [7, 5, 0], [7, 6, 0],[7, 7, 0], [7, 8, 0], [7, 9, 0], [7, 10, 0], [7, 11, 0], [7, 12, 0], [7, 13, 0],[7, 14, 0], [7, 15, 0], [7, 16, 0], [7, 17, 0],[7, 18, 0], [7, 19, 0], [7, 20, 0], [7, 21, 0], [7, 22, 0], [7, 23, 0]];
                             
                var storedFaceData = localStorage.getItem("emotialize-data-2");
                if(storedFaceData && typeof storedFaceData != 'undefined' && storedFaceData != "") {
                
                    storedFaceData = JSON.parse(storedFaceData);
                    for (i = 0; i < storedFaceData.length; i++) {
                        
                        var face = storedFaceData[i];
                        var time = moment(face.time);
                        var row = time.hour();
                        var scores = face.scores;
                            
                        setData(data, row, 0, scores.anger);
                        setData(data, row, 1, scores.disgust);
                        setData(data, row, 2, scores.sadness);
                        setData(data, row, 3, scores.fear);
                        setData(data, row, 4, scores.neutral);
                        setData(data, row, 5, scores.contempt);
                        setData(data, row, 6, scores.surprise);
                        setData(data, row, 7, scores.happiness);
                     
                    }
                
                }
                return data; 
            }()),
            dataLabels: {
                enabled: true,
                color: '#000000'
            }
        }]

    });
    
}
  

  



function findCurrData(data, row, col) {
    for (j = 0; j < data.length; j++) {
        var arr = data[j];
        if(arr[0] === col && arr[1] == row)
            return arr[2];
    }
    
    return 0;
}

function setData(data, row, col, score) {
    
    var currentScore = findCurrData(data, row, col);
    var averageScore;
    if(currentScore === '') {
      //-1 means we haven't baselined symbolHeight
      averageScore = Number(score).toFixed(4);
    } else {
      var newScore = Number(score).toFixed(4);
      averageScore = ((Number(currentScore)+Number(newScore))/2).toFixed(4);
    }
    
    for (x = 0; x < data.length; x++) {
        var arr = data[x];
        if(arr[0] === col) {
            if(arr[1] == row) {
               arr[2] = averageScore;
               return;
            } 
        }
    }
 
}
