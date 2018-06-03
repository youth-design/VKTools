const remote = require('electron').remote;
const $ = require('jquery');
var request = require("request").defaults({
    jar: true,
    followAllRedirects: true
});

var action;
var form = window.document.getElementById("auth_form");



// Get access_token function
function getToken() {
    var action = null;
    var url = "https://oauth.vk.com/authorize?client_id=6412736&display=mobile&redirect_uri=https://oauth.vk.com/blank.html&scope=wall&response_type=token&v=5.73&state=123456"
    request(url, {}, (err, res, body) => {
        if($(body).find("form[method=post]").length) {
            action = $(body).find("form[method=post]").attr("action");
            request.post(action, {}, (err,res,body) => {
                remote.getGlobal('Storage').token = res.request.href.split("&")[0].split("=")[1];
                window.location.href = "./main.html";
            });
        }else {
            remote.getGlobal('Storage').token = res.request.href.split("access_token=")[1].split("&")[0];
            window.location.href = "./main.html";
        }
        
    });
}


function auth(login, password) {
    if ($("input[name=captcha_key]").val()) {
            var options = {
                form: {
                    email: login,
                    pass: password,
                    captcha_key: $("input[name=captcha_key]").val(),
                    captcha_sid: $("input[name=captcha_sid]").attr('value'),
                }
            }

    }
    else {
    var options = {
        form: {
            email: login,
            pass: password,
        }
    }
    }
        request("http://m.vk.com", {}, (err, res, body) => {
        action = $(body).find('form[method=post]').attr('action');

        request.post(action, options, (err, res, body) => {
            if ($(body).find(".op_fcont").length > 0) {
                remote.getGlobal('Storage').session = res.request.headers.cookie;
                getToken();
                console.log(remote.getGlobal('Storage'.token));
            } else {
                if($(body).find("#captcha")) {
                    var img = document.createElement('img');
                    img.setAttribute('src', "https://vk.com/" + $(body).find("#captcha").attr('src'));
                    document.querySelector("#captcha_img").innerHTML = "";
                    document.querySelector("#captcha_img").appendChild(img);
                    document.querySelector("input[name=captcha_key]").setAttribute('type', 'text');
                    document.querySelector('input[name=captcha_sid]').setAttribute('value', $(body).find("input[name=captcha_sid]").attr('value'));
                }
                else {
                    $("#auth_fail").addClass("auth_fail");
                    setTimeout(() => {$(".auth_fail").removeClass('auth_fail')},3000);
                }
            }
        });
    });

}

// Enter button handler
form.onsubmit = (e) => {
    var login = this.form['0']['value'];
    var password = this.form['1']['value']; 
    auth(login, password);
    e.preventDefault();
}
