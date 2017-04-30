var request = require('request');
var ytdl = require('youtube-dl');
var async = require('async');
var {dialog} =require('electron');
var fs = require('fs-extra');
var path = require('path');

function getMeta(body){
    var head = body.substring( body.indexOf("<head>") + 6, body.indexOf("</head>") - 1);
    var metas = {};
    while( head.indexOf('property="') ){
        var meta = head.substr( 0, head.indexOf(">") );
        var head = head.substr( meta.length + 1 );
        if( meta == "" ){
            break;
        }
        if( meta.indexOf('property="') >= 0 ){
            var property = meta.substr( meta.indexOf('property="og:') + 13 );
            property = property.substr( 0, property.indexOf('"') );
        } else {
            continue;
        }
        if( meta.indexOf('content="') >= 0 ){
            var content = meta.substr( meta.indexOf('content="') + 9 );
            content = content.substr( 0, content.indexOf('"') );
        } else {
            continue;
        }
        metas[ property ] = content;
    }
    return metas;
}


function Parse(url,cb){
    request( url, function( err, response, body ){
        if( err ){
            cb("존재하지 않는 페이지입니다.")
        } else if( response.statusCode !== 200 ){
            cb("접근할 수 없는 페이지입니다.")
        } else {
            var metas = getMeta(body);
            if( metas.title ){
                cb(metas);
            } else {
                cb("파싱할 데이터가 없습니다");
            }
        }
    });
}

function getAudio(vid,cb){
    var url = 'http://www.youtube.com/watch?v=' + vid;
    console.log("getAduio : " + url)
    ytdl.getInfo( url, [], { maxBuffer : 1000 * 1024 }, function( err, info ){
        var duration;
        if( info && info.duration ){
            duration = info.duration.split(':');
        }
        if( info == undefined || info.duration == undefined ){
            cb("잘못된 링크입니다 : " + vid)
        } else if( duration.length >= 3 || (duration.length == 2 && duration[0] > 10 ) ){
            cb("10분 이내의 영상만 음원을 추출할 수 있습니다.")
        } else {
            console.log("Duration : " + duration);
            ytdl.exec( url, ['-F'], { maxBuffer : 1000 * 1024 }, function(err,list){
                if( err ){
                    cb("저작권 문제로 사용하실 수 없는 영상입니다.");
                } else {
                    var flag = 0;
                    async.each( list, function(value, callback){
                        if( value.indexOf("audio only") >= 0 && ( value.indexOf("webm") >= 0 || value.indexOf("mp4") >= 0 ) && flag == 0 ){
                            flag = 1;
                            var num = value.split(' ')[0];
                            var ystream = ytdl(url,['-f',num], { maxBuffer : 1000 * 1024 });
                            
                            var filepath = dialog.showOpenDialog({
                                properties : ['openDirectory'],
                                message: "저장할 폴더를 선택해주세요",
                                defaultPath : path.join(process.env.HOME,"Downloads")
                            });
                            var title = info.title.replace(/(\*|\||\:|\?|\"|\'|\>|\<|\/| |\.|\\)/g,"_");
                            console.log(title);
                            var filename = title + ".";
                            var type = "mp4";
                            if( value.indexOf("webm") >= 0 ){
                                type = "webm";
                            }
                            filename += type;
                            
                            var fstream = fs.createWriteStream( path.join(filepath[0],filename) );
                            var stream = ystream.pipe(fstream);
                            stream.on('finish',function(){
                                cb("저장이 완료되었습니다.")
                            })
                            return;
                        } else {
                            callback(null);
                        }
                    });
                }
            })
        }
    });
}

module.exports = {
    Parse : Parse,
    getAudio : getAudio
}
