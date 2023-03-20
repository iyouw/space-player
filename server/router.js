const Router = require('@koa/router');
const ffmpeg = require('fluent-ffmpeg');
const webSocketStream = require("websocket-stream/stream");

const router = new Router();

router.all('/rtsp/mpeg', (ctx)=> {
  const stream = webSocketStream(ctx.websocket, {
    binary: true,
    browserBufferTimeout: 1000000
  }, {
      browserBufferTimeout: 1000000
  });
  const url = ctx.query.url;
  console.log("rtsp url:", url);
  try {
      ffmpeg(url)
        .addInputOption("-rtsp_transport", "tcp", "-re")
        .on("start", function () {
            console.log(url, "Stream started.");
        })
        .on("codecData", function () {
            console.log(url, "Stream codecData.")
        // 摄像机在线处理
        })
        .on('progress', function(status) {
            // console.log(status);
        })
        .on("error", function (err) {
            console.log(url, "An error occured: ", err.message);
            console.log(err);
        })
        .on("end", function () {
            console.log(url, "Stream end!");
        // 摄像机断线的处理
        })
        .addOutputOption("-preset", "ultrafast", "-movflags", "faststart", "-tune", "zerolatency", "-b:v", "2MiB", "-bf", "0")
        .format("mpegts")
        .videoCodec("mpeg1video")
        .audioCodec("mp2")
        .audioBitrate(44100)
        .audioChannels(1)

        .pipe(stream);
  } catch (error) {
    console.log(error);
  }
});

router.all('/rtsp/webm', (ctx) => {
    const stream = webSocketStream(ctx.websocket, {
    binary: true,
    browserBufferTimeout: 1000000
    }, {
        browserBufferTimeout: 1000000
    });
    const url = ctx.query.url;
    console.log("rtsp url:", url);
    try {
        ffmpeg(url)
            .addInputOption("-rtsp_transport", "tcp", "-re")
            .on("start", function () {
                console.log(url, "Stream started.");
            })
            .on("codecData", function () {
                console.log(url, "Stream codecData.")
            // 摄像机在线处理
            })
            .on('progress', function(status) {
                // console.log(status);
            })
            .on("error", function (err) {
                console.log(url, "An error occured: ", err.message);
                console.log(err);
            })
            .on("end", function () {
                console.log(url, "Stream end!");
            // 摄像机断线的处理
            })
            .format("webm")
            .addOutputOption("-preset", "ultrafast") 
            .noAudio()
            .pipe(stream);
    } catch (error) {
        console.log(error);
    }
});


router.all('/rtsp/mp4', (ctx) => {
    const stream = webSocketStream(ctx.websocket, {
    binary: true,
    browserBufferTimeout: 1000000
    }, {
        browserBufferTimeout: 1000000
    });
    const url = ctx.query.url;
    console.log("rtsp url:", url);
    try {
        ffmpeg(url)
            .addInputOption("-rtsp_transport", "tcp", "-re")
            .on("start", function () {
                console.log(url, "Stream started.");
            })
            .on("codecData", function () {
                console.log(url, "Stream codecData.")
            // 摄像机在线处理
            })
            .on('progress', function(status) {
                // console.log(status);
            })
            .on("error", function (err) {
                console.log(url, "An error occured: ", err.message);
                console.log(err);
            })
            .on("end", function () {
                console.log(url, "Stream end!");
            // 摄像机断线的处理
            })
            .format("mp4")
            //.addOutputOption("-preset", "ultrafast")
            //.videoCodec('libx264')
            .noAudio()
            .pipe(stream);
    } catch (error) {
        console.log(error);
    }
});
module.exports = router;