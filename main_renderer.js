
const remote = require('electron').remote;
const $ = require('jquery');
const cookies = remote.getGlobal('Storage').session;
const token = remote.getGlobal('Storage').token;
const fs = require('fs');
var http = require('https');
var request = require("request").defaults({
    jar: true,
    followAllRedirects: true,
    headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
        'Accept': '/',
        'Connection': 'keep-alive'
    }
});
var user_id = null;


function makeRequest(method, params, callback) {
    var url = "https://api.vk.com/method/" + method + "?" + params + "&access_token=" + token + "&v=5.8";
    request(url, {}, (err,res,body) => {
        callback(body);
    })
}


$("#button-group").click((e) => {
    if($(".active").length > 0) {
        var data =$(".active").attr('data');
        $("#"+data).fadeOut(200);
    }
    $("#button-group .active").removeClass('active');


    if(e.target == $("#button-group > .active")) return;

    $(e.target).addClass('active');
    var data = $(e.target).attr('data');
    setTimeout(() =>{
        $("#"+data).fadeIn(200);
    },200)

});



// PARSER
$("#parser > button").click((e) => {
    if (!$(e.target).hasClass('disabled')) parser();
    $(e.target).addClass("disabled");
})
function parser() {
    fs.writeFileSync("log.txt", "");
    users = {
        count: null,
        ids: []
    }
    function getAllInfo() {
        var ids = [];
        var i = users.ids.length;
        (function() {
            if(i >= 0){
                if (ids.length >= 300 || i == 0) {
                    $("#parser > button").html("Прогресс: " + (100 - ~~(i / users.count * 100)) + "%");
                    if (i == 0) {
                        $("#parser > button").removeClass("disabled");
                        $("#parser > button").html("Завершено!");
                    }
                    makeRequest("users.get", "user_ids=" + ids.toString() + "&fields=home_town,sex,city", displayInfo);
                    ids = [];
                    i--;
                    setTimeout(arguments.callee, 3000);
                } else{
                    ids.push(users.ids[i]);
                    i--;
                    arguments.callee();
                }
            } else{};
        })();
        function displayInfo(body) {
            body = JSON.parse(body);
            body.response.forEach((e) => {
                var res = (e.first_name + " " + e.last_name).padEnd(40);
                if(e.sex == 1) res += "Ж".padEnd(3);
                else res += "М".padEnd(3);
                res += ("https://vk.com/id" + e.id).padEnd(35);
                if("city" in e) res += (e.city.title).padEnd(20);
                else res += "".padEnd(20);
                if("home_town" in e && e.home_town != "") res += e.home_town.padEnd(20);
                else "".padEnd(20);
                fs.appendFile("log.txt",res + "\n", (err) =>{
                    if(err) alert("Ошибка записи в файл!");
                });
            });
        }
    }
    function getAllUsers(body) {
        body = JSON.parse(body);
        users.ids = users.ids.concat(body.response.items);
        users.count = body.response.count;
        if(users.ids.length < (body.response.count - 1)) {
            makeRequest("likes.getList", "type=post&owner_id=" + post_id.split('_')[0] + "&item_id=" + post_id.split('_')[1] + "&count=1000&offset=" + ~~(users.count / users.ids.length) * 1000, getAllUsers);
        } else {
            getAllInfo();
        }
    }
    var link = $("#parser input[type=text]").val();
    var post_id = link.split("-");
    post_id = '-' + post_id[(post_id.length-1)];
    makeRequest("likes.getList", "type=post&owner_id=" + post_id.split('_')[0] + "&item_id=" + post_id.split('_')[1] + "&count=1000", getAllUsers);
}




// AUDIO
$("#audio #audio-control button[name=refresh]").click(() => {
    $("#audio #audio-control button[name=refresh]").addClass('disabled');
    getAudioList();
})
$("#audio #audio-control button[name=check-all]").click(() => {
    var i = false;

    $.makeArray($(".audio-item")).forEach((e) => {
        if(!$(e).hasClass('song-checked')) i = true;
    })
    if(i == true) $(".audio-item").addClass('song-checked');
    else $(".audio-item").removeClass('song-checked');
})
$("#audio #audio-control button[name=download]").click(() => {
   var songs = $.makeArray($(".song-checked"));
   var i = 0;
   var threads_count = Number($("#threads-controller input").val());
   $("#audio #audio-control button[name=download]").addClass('disabled');

   for(var j = 0; j < threads_count; j++) {
       if(j < songs.length) {
        getSong(songs[j],worker);
        i +=1;
       }
       else $("#audio #audio-control button[name=download]").removeClass('disabled');
   }
   function worker() {
       if((i) < songs.length){
        getSong(songs[i],worker);
        i+=1;
       }
       else $("#audio #audio-control button[name=download]").removeClass('disabled');
   }

})


function getSong(target, callback) {

    var n = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=", i = {
        v: function(e) {
            return e.split("").reverse().join("")
        },
        r: function(e, t) {
            e = e.split("");
            for (var i, o = n + n, a = e.length; a--;) i = o.indexOf(e[a]), ~i && (e[a] = o.substr(i - t, 1));
            return e.join("")
        },
        s: function(e, t) {
            var n = e.length;
            if (n) {
                var i = s(e, t),
                    o = 0;
                for (e = e.split(""); ++o < n;) e[o] = e.splice(i[n - 1 - o], 1, e[o])[0];
                e = e.join("")
            }
            return e
        },
        i: function(e, t) {
            return i.s(e, t ^ user_id)
        },
        x: function(e, t) {
            var n = [];
            return t = t.charCodeAt(0), each(e.split(""), function(e, i) {
                n.push(String.fromCharCode(i.charCodeAt(0) ^ t))
            }), n.join("")
        }
    };
    function a(e) {
        if (~e.indexOf("audio_api_unavailable")) {
            var t = e.split("?extra=")[1].split("#"),
                n = "" === t[1] ? "" : r(t[1]);
            if (t = r(t[0]), "string" != typeof n || !t) return e;
            n = n ? n.split(String.fromCharCode(9)) : [];
            for (var a, s, l = n.length; l--;) {
                if (s = n[l].split(String.fromCharCode(11)), a = s.splice(0, 1, t)[0], !i[a]) return e;
                t = i[a].apply(null, s)
            }
            if (t && "http" === t.substr(0, 4)) return t
        }
        return e
    }

    function r(e) {
        if (!e || e.length % 4 == 1) return !1;
        for (var t, i, o = 0, a = 0, r = ""; i = e.charAt(a++);) i = n.indexOf(i), ~i && (t = o % 4 ? 64 * t + i : i, o++ % 4) && (r += String.fromCharCode(255 & t >> (-2 * o & 6)));
        return r
    }

    function s(e, t) {
        var n = e.length,
            i = [];
        if (n) {
            var o = n;
            for (t = Math.abs(t); o--;) t = (n * (o + 1) ^ t + o) % n, i[o] = t
        }
        return i
    }

    var url = a($(target).attr('link'));

    if (!fs.existsSync("downloads"))
        fs.mkdir("downloads");

    var file = fs.createWriteStream("./downloads/" + $(target).find('p').text() + ".mp3");


    request(url).on('response', (res) => {
        var length = res.headers['content-length'];
        var downloaded = 0;

        res.on('data', (chunk) => {
            downloaded += chunk.length;
            $(target).find('.status').css("width", (100.0 * downloaded / length).toFixed(1) + "%");
            $(target).find('.percent-status').html((100.0 * downloaded / length).toFixed(1));
        });

        res.on('end', () => {
            $(target).removeClass('song-checked');
            $(target).find('.percent-status').html("ЗАГРУЖЕНО");

            var not = new Notification("Загружено " + $(target).find("p").text());
            callback();
        })

    }).pipe(file);

}

function getAudioList() {
    audios = {
        count: 999,
        all: [],
    }
    request("https://m.vk.com",{},(err,res,body) => {
        user_id = body.match(/id\d{4,10}/m)[0].split('id')[1];
        var i = 0;

        (function () {
            if(i < audios.count) {
                request.post("https://m.vk.com/audio", {
                    form: {
                        _ajax: 1,
                        offset: i,
                    }}, (err, res, body) => {
                    $.makeArray($(body).find(`.AudioPlaylistRoot[data-playlist-id=audios${user_id}] .audio_item`)).forEach((e) => {
                        var link = $(e).find(".ai_play").attr('style');
                        if(link) link = link.split('url(')[1].split(')')[0];
                            item = {
                            title: $(e).find("span[class=ai_title]").html(),
                            artist: $(e).find("span[class=ai_artist]").html(),
                            data: $(e).attr('data-id'),
                            link: $(e).find("input[type=hidden]").val(),
                            image: link,
                        }
                        audios.all.push(item);
                    });
                    if(audios.count == 999) audios.count = Number($(body).find(".audioPage__count").html().split(' ')[0]);
                })
                i+= 49;
                setTimeout(arguments.callee,500);
            } else {
                var container = $("#audios_container");
                container.html("");
                audios.all.forEach((e) => {
                    if(e.image)
                        container.append("<div class='audio-item' data_id='" + e.data + "' link='" + e.link + "' ><img src='" + e.image + "'><p><strong>" + e.title + "</strong> - " + e.artist + "</p><div class='status'></div><span class='percent-status'></span></div>");
                    else if(e.artist == undefined && e.title == undefined);
                    else
                        container.append("<div class='audio-item' data_id='" + e.data + "' link='" + e.link + "' ><img src='./media/music.png'><p><strong>" + e.title + "</strong> - " + e.artist + "</p><div class='status'></div><span class='percent-status'></span></div>");
                    $(".audio-item").last().click((e) => {
                        if($(e.currentTarget).hasClass('song-checked'))
                            $(e.currentTarget).removeClass('song-checked');
                        else $(e.currentTarget).addClass('song-checked');
                    })
                })
                $("#audio #audio-control button[name=refresh]").removeClass('disabled');
            }
        })();
    })
}
