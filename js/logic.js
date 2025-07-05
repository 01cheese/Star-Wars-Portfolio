/* Instatiates Aniframer -> ( id_canvas, update_callback_function) */
var AF = new Aniframer('star_wars_intro', Update);

/* UI Elements */
var dbgBox = document.getElementById('debugBox');
var audioplayer = document.getElementById('audioplayer');
var introText_textArea = document.getElementById('introText');
var scrolling_text_container = document.getElementById('scrollingText_container');
var perspectiveText_base = document.getElementById('perspectiveText_base');


/* Animation Vars */
var yellowcolor = "255, 166, 0";			//Default yellow text color

/* Debug options*/
var debug;

/* Animation Objects */
var sky = {};								//Sky object.
var logo = {};								//Logo object
var introText = {};							//Intro text object
var loadingAnimation = {};					//Initial Loading animation


//The default timeline.
//The times are in miliseconds. To all values are added the loading time.
var timeline = {
    start_logo: 2000,
    start_text: 11000,
    start_fade_out_logo: 14500,
    end_logo: 16000,
    intro_text_fadeout_start: 77000,
    intro_text_fadeout_end: 80000,		//1m + 20s
    sky_zoom_in: 81000					//1m + 21s = 81000
};


/* Animation Controls */
var animationControls = {
    playing: 0,				//Holds the value of the full animation stages (loading|play|pause|end)
    step: "loading",				//Holds the value of the full animation stages (loading|play|pause|end)
    preloadCount: 0,
    playTime: 0,
    animationPauseStarted: 0,		//TS indicating when the pause started
    animationTimerDrift: 0,		//Total of unused time from the global Timer. Counts the amount of time spent with pauses and loding animations. To be discounted on AF.Timer.now.
    pause: function () {
        this.playing = 0;
        this.step = "pause";
        this.animationPauseStarted = AF.time.now;
    },
    play: function () {
        this.playing = 1;
        this.step = "play";
        this.animationTimerDrift += AF.time.now - this.animationPauseStarted;
        this.animationPauseStarted = 0;
    },
    updateAnimationTime: function () {		//Global animation time without the pauses and loading animation times.
        if (this.step == "play") this.playTime = AF.time.now - this.animationTimerDrift;

    }

};

/* ================================================================================================================================================================= */
/*	Animation Logic Setup */
/* ================================================================================================================================================================= */

//Initiate all vars. Works as reset to
init();
AF.startAnimation();

/*
	Inits all the objects with their current update/draw functions
 */
function init() {
    //init debug info
    init_debug();

    // Audio:
    animationControls.preloadCount++;
    AF.addAudio("starwars", "sound/star_wars_intro.mp3", preLoadCallBack);


    //Init loadingAnimation and assigns the event handler for the play Button
    init_loadingAnimation();

    function startAnimationOnce() {
        if (animationControls.step === "loading" && animationControls.preloadCount === 0) {
            play(); // Запускаем анимацию
            console.log("🎬 Анимация запущена!");
            // Убираем слушатели после первого запуска
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("click", onClick);
        }
    }

    function onKeyDown(e) {
        if (e.code === "Space") {
            e.preventDefault();
            startAnimationOnce();
        }
    }

    function onTouchStart() {
        startAnimationOnce();
    }

    function onClick() {
        startAnimationOnce();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("click", onClick);

    //Init loadingAnimation and assigns the event handler for the play Button
    init_sky();

    init_logo();
    animationControls.preloadCount++;
    logo.calibrateSize();

    init_intro_text();
}

function play() {
    animationControls.play();
    audioplayer.play();
}

function pause() {
    animationControls.pause();
    audioplayer.pause();
}

//Preload Callback. Called after when udio is loaded
//Called by AF plugin
function preLoadCallBack(audio_name) {
    if (AF.audio[audio_name].audioname == "starwars") {
        audioplayer.src = AF.audio[audio_name].audio.src;
        animationControls.preloadCount--;
    }
}

function Update() {
    //Update Animation time
    animationControls.updateAnimationTime();

    //Show debug info
    debug.show();
    //Show sky
    sky.update();
    sky.draw();


    if (animationControls.step == "loading") {
        loadingAnimation.update();
        loadingAnimation.draw();
    }


    logo.update();
    introText.update();

    logo.draw();
    introText.draw();

};

/* ================================================================================================================================================================= */
/*	Object Creation Setup functions */
/* ================================================================================================================================================================= */

// Show debug info
function init_debug() {
    console.log("Debug init");
    debug = {
        lastUpdate: 0,
        fps: 0,
        totalSeconds: 0,
        animSeconds: 0,
        show: function () {
            if (AF.time.now - this.lastUpdate > 100) {
                this.fps = AF.time.fps;
                this.totalSeconds = (AF.time.now / 1000).toFixed(1);
                this.animSeconds = (animationControls.playTime / 1000).toFixed(1);
                this.lastUpdate = AF.time.now;
            }
        }
    };
}

// Loading animation. Just a simple loading text in very dim red with outer glow in the center of the screen
function init_loadingAnimation() {
    loadingAnimation = {
        opacity: 0.1,								// holds the opacity value for animation
        opacity_direction: 1,						// holds the opacity increment directionvalue for animation
        fontSize: Math.floor(AF.canvas.h * 0.1),	// Font size
        playFontSize: Math.floor(AF.canvas.h * 0.05),	// Font size
        playBtWidth: 100,
        playBtClick: function () {
            if (animationControls.step === "loading" && animationControls.preloadCount === 0) {
                play();
                AF.canvas.removeEventListener("click", loadingAnimation.playBtClick);
            }
        },
        update: function () {
            if (animationControls.preloadCount > 0) {
                this.opacity += AF.MR * this.opacity_direction * 0.3;
                if (this.opacity > 0.5 || this.opacity < 0.1) this.opacity_direction *= -1;
            }
        },
        draw: function () {
            if (animationControls.preloadCount > 0) {
                AF.ctx.save();
                AF.ctx.shadowBlur = this.fontSize / 2;
                AF.ctx.shadowColor = "rgba(255, 255, 255, " + this.opacity + ")";
                AF.ctx.font = this.fontSize + 'px STARWARS';
                AF.ctx.fillStyle = "rgba(0, 0, 0, " + this.opacity + ")";
                AF.ctx.textAlign = "center";
                AF.ctx.fillText("loading", AF.canvas.w / 2, AF.canvas.h / 2);
                AF.ctx.restore();
            } else {
                const text = "A long time ago\nin a galaxy far, far away...";
                const lines = text.split("\n");
                const baseFontSize = Math.max(AF.canvas.w, AF.canvas.h) * 0.03; // 3% от ширины или высоты
                const lineHeight = baseFontSize * 1.5;

                const x = AF.canvas.w / 2;
                let y = AF.canvas.h / 2 - ((lines.length - 1) * lineHeight) / 2;

                AF.ctx.font = `${baseFontSize}px consolas`;
                AF.ctx.textAlign = "center";
                let glowOpacity = 0.8 + 0.2 * Math.sin(Date.now() / 300);

                lines.forEach(line => {
                    const parts = line.split(/(galaxy)/); // Разделяет строку на части, где "galaxy" особое слово
                    let currentX = x - AF.ctx.measureText(line).width / 2;

                    parts.forEach(part => {
                        // Обычный текст
                        AF.ctx.fillStyle = "#00FFFF"; // желто-оранжевый
                        AF.ctx.shadowColor = "transparent";
                        AF.ctx.shadowBlur = 0;

                        // Рисуем текст
                        AF.ctx.fillText(part, currentX + AF.ctx.measureText(part).width / 2, y);


                        // Сдвигаем X для следующей части
                        currentX += AF.ctx.measureText(part).width;
                    });

                    y += lineHeight;
                });
            }
        }
    };

    // Вешаем обработчик как у кнопки паузы
    AF.canvas.addEventListener("click", loadingAnimation.playBtClick);
}

// Sky animation. Just stars that starts to move at the end to give an efect of motion from the POV
function init_sky() {
    sky = {
        sky: [],
        stars_count: 400,
        radius_factor: 1.5,

        //init all stars
        init: function () {
            for (var c = 0; c <= this.stars_count - 1; c++) {
                var _x = Math.round(Math.random() * AF.canvas.w);		//Distributes the star long width
                var _y = Math.round(Math.random() * AF.canvas.h);		//Distributes the star long height
                var _r = Math.max(Math.random().toFixed(4), 0.5);		//star radius. from 0.5 to 4px
                var _color = Math.max((120 * _r).toFixed(0), 80);			//For rgb. Min 80, max 120*star radius. As bigger the star is, the whiter it is also
                this.sky[c] = {											//Adds the star to the sky array
                    x: _x,
                    y: _y,
                    radius: _r,
                    color: _color
                };
            }
        },

        // Regenerates a new star when called.
        // Used to renew stars when they get outside canvas boundaries.
        renewStar: function (c) {
            this.sky[c].y = AF.canvas.h + Math.round(Math.random() * 30);
            this.sky[c].x = Math.round(Math.random() * AF.canvas.w);
        },

        // Every frame update.
        // Makes all the calculations
        update: function () {
            //Is timeline scheduled?
            if (animationControls.playTime >= timeline.sky_zoom_in) {

                //Loop all stars
                for (var c = 0; c <= this.stars_count - 1; c++) {

                    //if a star is outside the canvas boundaries, is renewed
                    if (this.sky[c].y < 0 || this.sky[c].x < 0 || this.sky[c].x > AF.canvas.w) this.renewStar(c);

                    //Sky accelaration. To prevent imediate motion when the sky starts to move
                    //Accelaration takes 2 seconds (2000ms) from 0 to 1.
                    var accel = (animationControls.playTime - timeline.sky_zoom_in) / 2000;
                    accel = Math.min(accel.toFixed(2), 1);

                    //Final update of the star position.
                    //The far a star is from the center x, the most speed it gains on x.
                    //The higher the y position is, the most speed on y it has.
                    //The y speed also derivates from the radius, trying to give the effect that the smaller, the far away the star is, and the far, the slowest.
                    this.sky[c].x += AF.MR * accel * (this.sky[c].x - ((AF.canvas.w / 2) + 300)) * 0.08;
                    this.sky[c].y -= AF.MR * accel * (20 + ((this.sky[c].y / 100) * this.sky[c].radius * 4) * 3);
                }
            }
        },
        draw: function () {
            for (var c = 0; c <= this.stars_count - 1; c++) {
                AF.ctx.beginPath();
                AF.ctx.arc(this.sky[c].x, this.sky[c].y, this.sky[c].radius * this.radius_factor, 0, 2 * Math.PI, false);
                AF.ctx.fillStyle = "rgba(" + this.sky[c].color + ", " + this.sky[c].color + ", " + this.sky[c].color + ", 1)";		//'#666666';
                AF.ctx.fill();
            }
        }
    };

    sky.init();
    window.addEventListener('resize', () => {
        // Обновляем размер canvas
        AF.canvas.width = window.innerWidth;
        AF.canvas.height = window.innerHeight;
        // Пересоздаём звёзды с учётом нового размера
        sky.init();
    });
}

// The star wars logo zoomOut animation
function init_logo() {
    logo = {
        y_star: AF.canvas.h / 2, //position y
        y_wars: AF.canvas.h / 2, //position y
        initial_size: 0, //Starts on 400, ends on 20. Takes 13 seconds to zoomOut. 13/380 =
        size: 0, //Starts on 400, ends on 20. Takes 13 seconds to zoomOut. 13/380 =
        logoHPos: 0,
        lineWidth: 10,
        fade: 1,
        calibrateSize: function () {
            var w = 0;
            while (w < AF.canvas.w * 1.2) {
                this.initial_size++;
                AF.ctx.font = Math.floor(this.initial_size) + 'px STARWARS';
                w = AF.ctx.measureText("STAR").width;
            }
            animationControls.preloadCount--;
            this.size = this.initial_size;
        },
        update: function () {

            //Zoom Out
            if (animationControls.playTime >= timeline.start_logo && animationControls.playTime <= timeline.end_logo) {
                this.size -= AF.MR * (this.initial_size / ((timeline.end_logo - timeline.start_logo) / 1000)) * animationControls.playing;
                this.lineWidth = 0.03 * this.size;
                this.y_star = (AF.canvas.h / 2);
                this.y_wars = this.y_star + this.size * 0.75; // 0.75 to compensate the padding around the font
                //logo fade out
                if (animationControls.playTime >= timeline.start_fade_out_logo) {
                    this.fade -= AF.MR * (1 / ((timeline.end_logo - timeline.start_fade_out_logo) / 1000)) * animationControls.playing;
                    this.fade = Math.max(0, this.fade);
                }

                if (animationControls.playTime >= timeline.end_logo) this.fade = 0;
            }
        },
        draw: function () {
            if (animationControls.playTime >= timeline.start_logo) {
                AF.ctx.font = Math.floor(this.size) + 'px STARWARS';
                AF.ctx.lineWidth = this.lineWidth;
                AF.ctx.strokeStyle = "rgba(" + yellowcolor + ", " + this.fade.toFixed(2) + ")";
                AF.ctx.textAlign = "center";

                AF.ctx.strokeText("JOHN DOE", AF.canvas.w / 2, this.y_star);
                AF.ctx.strokeText("WEB DEV", AF.canvas.w / 2, this.y_wars);
            }
        }
    };
}

function init_intro_text() {
    introText = {
        y: perspectiveText_base.offsetHeight,
        text: 'My name is John Doe and I\'m a web developer<br><br>' +
            'Featured projects:<br>' +
            '<a href="https://github.com/johndoe/galaxy-explorer" target="_blank" style="color:#00FFFF;">Galaxy Explorer</a> | ' +
            '<a href="https://johndoe.dev/weather-app" target="_blank" style="color:#00FFFF;">Weather Sphere</a> | ' +
            '<a href="https://johndoe.dev/chat-hub" target="_blank" style="color:#00FFFF;">ChatHub</a><br><br>' +
            '<a href="https://johndoe.dev/resume.pdf" target="_blank" style="color:#00FFFF;">Resume</a><br> May the Force be with you',
        opacity: 1,
        update: function () {
            if (animationControls.playTime >= timeline.start_text) {
                const stopPosition = perspectiveText_base.offsetHeight / 4;
                // Двигаем текст вверх
                if (this.y > stopPosition) {
                    this.y -= AF.MR * 50 * animationControls.playing; // скорость прокрутки
                    if (this.y < stopPosition) this.y = stopPosition; // фиксация
                }

                if (this.y === stopPosition) {
                    if (!this.hasStopped) {
                        this.hasStopped = true; // помечаем, что текст остановился
                        this.straightenStartTime = animationControls.playTime; // запоминаем момент
                    }
                    // Вычисляем время с момента остановки
                    const timeSinceStop = animationControls.playTime - this.straightenStartTime;
                    const startAngle = 45;            // начальный угол
                    const endAngle = 5;               // финальный угол
                    const straightenDuration = 3000;  // 3 секунды
                    // Линейная интерполяция угла
                    const progress = Math.min(timeSinceStop / straightenDuration, 1);
                    const currentAngle = startAngle - (startAngle - endAngle) * progress;
                    // Применяем угол
                    perspectiveText_base.style.transform = `perspective(400px) rotateX(${currentAngle}deg)`;
                }
                // Текст всегда полностью видим
                this.opacity = 1;
            }
        },

        draw: function () {
            if (!scrolling_text_container.dataset.initialized) {
                scrolling_text_container.innerHTML = this.text;
                scrolling_text_container.dataset.initialized = "true";
            }

            scrolling_text_container.style.top = this.y.toFixed(2) + "px";
            scrolling_text_container.style.opacity = this.opacity;
        }
    };

    window.addEventListener('resize', () => {
        perspectiveText_base.style.width = '80%';
        perspectiveText_base.style.margin = '0 auto';
    });
}