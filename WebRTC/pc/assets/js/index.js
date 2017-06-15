"use strict";
var RoomNumber = 0;
var ReportInterval = null;
var Stream = {
    remote: null,
    local: null
};
var gSpinner;
var rtclistener = {
    onRemoteCloseAudio: onRemoteCloseAudio,
    onRemoteLeave: onRemoteLeave,
    onRemoteCloseVideo: onRemoteCloseVideo,
    onKickout: onKickout,
    onInitResult: onInitResult,
    onLocalStreamAdd: onLocalStreamAdd,
    onRemoteStreamAdd: onRemoteStreamAdd
};
var clicking = false;
//角色
var Role = {
    Guest: 0, //观众
    LiveMaster: 1, //主播
    LiveGuest: 2 //连麦观众
};
var loginInfo = {
    'sdkAppID': 1400027849,
    'accountType': 11656,
    'identifier': null,
    'userSig': null,
    'identifierNick': null,
    'headurl': null,
    'token': null
};

var App = {
    render: function (name) {
        $(".mode").hide();
        $("#" + name).show();
    },
    login: function () {
        var self = this;
        $("#login").prop("disable", true);
        var roomNumber = $("#room-number").val();
        var username = $("#username").val();
        var sdkAppId = $("#sdkappid").val();
        var password = $("#password").val();
        if (!sdkAppId) {
            toastr.info("SDKAPPID为空！");
            return;
        }
        if (!password) {
            toastr.info("密码为空！");
            return;
        }
        if (!username) {
            toastr.info("用户名为空！");
            return;
        }

        store.set("username", username);
        store.set("password", password);
        ilvbLogin({
            username: username,
            password: password,
            success: function () {
                toastr.success("登录成功");
                self.render("main-container")
            }
        });
    },
    logout: function () {
        $.extend(loginInfo, {
            'identifier': null,
            'userSig': null,
            'identifierNick': null,
            'headurl': null,
            'token': null
        });
        store.clear();
        this.render('login-container');
    },
    register: function () {
        webimRegister();
    },
    refreshRoom: function () {
        getRoomList();
    },
    sendMsg: function () {
        onSendMsg();
    },

    init: function () {
        $("#username").val(store.get("username"));
        $("#password").val(store.get("password"));

        if (store.get("loginInfo")) {
            loginInfo = store.get("loginInfo");


            getRoomList(function () {
                if (store.get("roomnum")) {
                    RoomNumber = store.get("roomnum");
                    if (store.get('role') == 'LiveGuest') {
                        $("#roomlist-box button[data-roomnum='" + store.get("roomnum") + "']").trigger('click');
                    } else {
                        webimLogin(function () {
                            createRoom();
                        });
                    }
                }
            });
        } else {
            this.render('login-container');
        }

        $("#mute-audio").off("click").on("click", function () {
            if (toggle(this)) {
                WebRTCAPI.closeAudio();
            } else {
                WebRTCAPI.openAudio();
            }
        });

        $("#mute-video").off("click").on("click", function () {
            if (toggle(this)) {
                WebRTCAPI.closeVideo();
            } else {
                WebRTCAPI.openVideo();
            }
        });

        $("#hangup").off("click").on("click", function () {
            WebRTCAPI.quit();
            store.remove("roomnum");
        });
        $("#reversal").off("click").on("click", function () {
            $("video").toggleClass("viewMode");
        });


        $("#snapcapture").off("click").on("click", function () {
            MediaAPI.snapCapture();
        });

        $("#record").click(function () {
            var ele = $(this);
            var clicks = ele.data('clicks');
            if (clicking) return
            clicking = true;
            if (clicks) {
                MediaAPI.stopRecording(function () {
                    ele.data("clicks", !clicks);
                    ele.text("录制");
                    clicking = false;
                }, function () {
                    clicking = false;
                });
            } else {
                MediaAPI.startRecording(function () {
                    ele.data("clicks", !clicks);
                    ele.text("停止");
                    clicking = false;
                });
            }
        });

        $("#play").off("click").on("click", function () {
            if (!MediaAPI.recordedBlobs) {
                toastr.warning("没有视频数据");
                return;
            }
            MediaAPI.play();
        });

        $("#download").off("click").on("click", function () {
            if (!MediaAPI.recordedBlobs) {
                toastr.warning("没有视频数据");
                return;
            }
            MediaAPI.download();
        });

        $("#roomlist-box").on("click", "[role=button]", function () {
            var btn = $(this);
            if (btn.data("playurl")) {
                $("#record-video").attr("src", btn.data('playurl'));
            } else if (btn.data("roomnum")) {
                RoomNumber = btn.data("roomnum");
                store.set("role", 'LiveGuest');
                store.set("roomnum", RoomNumber);
                webimLogin(function () {
                    applyJoinGroup();
                    initRTC();
                });
                $("#roomlist-box [role=button]").removeClass("active");
                btn.addClass("active");
            }
        });

        $("#msg_input").keypress(function (e) {
            if (e.which === 13) {
                App.sendMsg();
            }
        });
    },
};


var MediaAPI = {
    mediaRecorder: null,
    recordedBlobs: null,
    recordedVideo: document.querySelector('video#recorded'),
    //截图
    snapCapture: function () {
        var video = $("#remote-video").get(0);
        var capture = $("<canvas/>").get(0);
        const videoWidth = video.videoWidth,
            videoHeight = video.videoHeight;
        if (videoWidth && videoHeight) {
            capture.width = videoWidth;
            capture.height = videoHeight;
            capture.getContext('2d').drawImage(
                video, 0, 0, videoWidth, videoHeight
            );
            var img = $("<img />");
            img.attr('src', capture.toDataURL('image/png'));
            var wrapper = $('<div class="list-group-item" />');
            $("#snapcapture-list").append(wrapper.append(img));
        } else {
            setTimeout(snapCapture, 200);
        }
    },

    //本地录制
    startRecording: function (succ, error) {
        var stream = Stream.remote || Stream.local;
        var self = this;

        function handleStop(event) {
            console.log('Recorder stopped: ', event);
        }

        function handleDataAvailable(event) {
            if (event.data && event.data.size > 0) {
                self.recordedBlobs.push(event.data);
            }
        }
        var options = { mimeType: 'video/webm', bitsPerSecond: 100000 };
        this.recordedBlobs = [];
        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e0) {
            console.log('Unable to create MediaRecorder with options Object: ', e0);
            try {
                options = { mimeType: 'video/webm,codecs=vp9', bitsPerSecond: 100000 };
                this.mediaRecorder = new MediaRecorder(stream, options);
            } catch (e1) {
                console.log('Unable to create MediaRecorder with options Object: ', e1);
                try {
                    options = 'video/vp8'; // Chrome 47
                    this.mediaRecorder = new MediaRecorder(stream, options);
                } catch (e2) {
                    alert('MediaRecorder is not supported by this browser.\n\n' +
                        'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                    console.error('Exception while creating MediaRecorder:', e2);
                    if (error) error();
                    return;
                }
            }
        }
        if (succ) succ();
        // recordButton.textContent = 'Stop Recording';
        // playButton.disabled = true;
        // downloadButton.disabled = true;
        this.mediaRecorder.onstop = handleStop;
        this.mediaRecorder.ondataavailable = handleDataAvailable;
        this.mediaRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', this.mediaRecorder);
        this.recordedVideo.poster = "https://dummyimage.com/260x200/&text=Recording...";
        this.recordedVideo.src = null;
        this.recordedVideo.controls = false;
    },
    stopRecording: function (cb) {
        this.mediaRecorder.stop();
        console.log('Recorded Blobs: ', this.recordedBlobs);
        this.recordedVideo.controls = true;
        this.recordedVideo.poster = null;
        if (cb) cb();
    },
    play: function () {
        var superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
        this.recordedVideo.src = window.URL.createObjectURL(superBuffer);
    },

    download: function () {
        var blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'record.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

};

function createRoom() {
    var jsonObj = {
        "type": 'live',
        "token": loginInfo.token
    };
    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=create",
        data: JSON.stringify(jsonObj),
        success: function (json) {
            RoomNumber = json.data.roomnum;
            store.set("roomnum", RoomNumber);
            store.set("role", 'LiveMaster');
            createGroup();
            initRTC();


            var reportObj = {
                "token": loginInfo.token,
                "room": {
                    "title": '[WebRTC]' + loginInfo.identifier,
                    "roomnum": RoomNumber,
                    "type": "live",
                    "groupid": String(RoomNumber),
                    "appid": loginInfo.sdkAppID,
                    "device": 2,
                    "videotype": 0
                }
            };
            $.ajax({
                type: "POST",
                url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=reportroom",
                data: JSON.stringify(reportObj),
                success: function (rspJson) {
                    report({
                        "token": loginInfo.token,
                        "roomnum": RoomNumber,
                        "role": Role.LiveGuest,
                        "thumbup": 0
                    });
                }
            });
        }
    });
}

function report(obj) {
    clearInterval(ReportInterval);
    var handleReport = function () {
        $.ajax({
            type: "POST",
            url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=heartbeat",
            data: JSON.stringify(obj),
            success: function (rspJson) {
                console.debug(rspJson);
            }
        });
    };
    handleReport();
    ReportInterval = setInterval(handleReport, 10000)
}



function onRemoteCloseAudio() {
    console.log("on remote close audio!");
}

function onRemoteLeave() {
    console.log("on remote leave!");
}

function onRemoteCloseVideo() {
    console.log("on remote close video!");
}

function onKickout() {
    console.log("on kick out!");
}

function onCreateRoomCallback(result) {
    if (result !== 0) {
        toastr.error("create room failed!!!");
        return;
    }
    WebRTCAPI.startWebRTC(function (result) {
        if (result !== 0) {
            var errorStr = "";
            if (result === -10007) {
                errorStr = "PeerConnection 创建失败";
            } else if (result === -10008) {
                errorStr = "getUserMedia 失败";
            } else if (result === -10009) {
                errorStr = "getLocalSdp 失败";
            } else {
                errorStr = "start WebRTC failed!!!";
            }
            toastr.error(errorStr);
        }
    });
}

function onLocalStreamAdd(stream) {
    Stream.local = stream;
    $("#local-video")[0].srcObject = stream;
}

function onRemoteStreamAdd(stream) {
    Stream.remote = stream;
    $("#remote-video")[0].srcObject = stream;;
}

function onInitResult(result) {
    $("#login").prop("disable", false);
    if (result !== 0) {
        var errorStr = "";
        if (result === -10001) {
            errorStr = "WebRTCJSAPI初始化参数不正确";
        } else if (result === -10002) {
            errorStr = "浏览器版本不正确";
        } else if (result === -10003) {
            errorStr = "sig校验失败";
        } else if (result === -10006) {
            errorStr = "WebSocket 初始化失败";
        } else {
            errorStr = "初始化错误";
        }
        toastr.error(errorStr);
    } else {
        WebRTCAPI.createRoom(String(RoomNumber), onCreateRoomCallback);
    }
}

function toggle(element) {
    var isMute = false;
    if (element.hasClass("on")) {
        element.removeClass("on");
        isMute = false;
    } else {
        element.addClass("on");
        isMute = true;
    }
    return isMute;
}


function webimRegister() {
    //注册
    var username = $("#username").val();
    var pwd = $("#password").val();
    if (!$.trim(username) || !$.trim(pwd)) {
        toastr.error('用户名密码不能为空');
        return;
    }
    var jsonObj = {
        "id": username,
        "pwd": pwd
    };
    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=account&cmd=regist",
        data: JSON.stringify(jsonObj),
        success: function (json) {
            if (json.errorCode == 0) {
                toastr.success("注册成功");
            } else {
                toastr.error(json.errorInfo);
            }
        }
    });
}

//sdk登录
function ilvbLogin(opt) {
    loginInfo.identifier = opt.username;
    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=account&cmd=login",
        data: JSON.stringify({
            "id": loginInfo.identifier,
            "pwd": opt.password,
            "appid": parseInt(loginInfo.sdkAppID)
        }),
        success: function (data) {
            if (data && data.errorCode === 0) {
                loginInfo.token = data.data.token;
                loginInfo.userSig = data.data.userSig;
                store.set('loginInfo', loginInfo);
                if (opt.success) {
                    opt.success();
                }
                getRoomList();
                // webimLogin();
            } else {
                $("#login").prop("disable", false);
                toastr.error("获取UserSig失败, Info = " + JSON.stringify(data));
            }
        },
        error: function (error, xhr) {
            toastr.error("初始化失败！！！get user sig ajax failed! error : " + error);
            console.error("get user sig ajax failed!");
        }
    });
}


function initRTC() {
    var ret = WebRTCAPI.init(rtclistener, {
        "openid": loginInfo.identifier,
        "userSig": loginInfo.userSig,
        "sdkAppId": String(loginInfo.sdkAppID),
        "accountType": String(loginInfo.accountType)
    });
    if (ret !== 0) {
        $("#login").prop("disable", false);
        toastr.error("初始化失败！！！");
    }
}
//过滤随心播svr返回的房间名，只有特定名字的才展示在列表
function filterLiveRoomName(rooms) {
    var ret = [];
    $.each(rooms, function (idx, item) {
        if (true || item.info.title.indexOf('WebRTC') !== -1) {
            ret.push(item);
        }
    });
    return ret;
}

function getRoomList(cb) {
    $("#login-container").hide();
    $("#main-container").show();
    gSpinner = new Spinner({ lines: 11, length: 26, width: 16, radius: 28, scale: 0.25, corners: 1, color: '#fff', opacity: 0.25, rotate: 13, direction: 1, speed: 1, trail: 60, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: false, position: 'absolute' }).spin();

    document.getElementById('roomlist').appendChild(gSpinner.el);
    $("#roomlist-box").html('');


    if (/record/.test(location.href)) {
        var type = "record";
        var url = "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=recordlist";
    } else {
        var type = "live";
        var url = "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=roomlist";
    }
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            "type": 'live',
            "token": loginInfo.token,
            "index": 0,
            "size": 50,
            "type": 1,
            "appid": loginInfo.sdkAppID
        }),
        success: function (data) {
            gSpinner.stop();
            if (data && data.errorCode === 0) {
                if (type == 'record') {
                    var html = template("record-tpl", { rooms: filterLiveRoomName(data.data.videos) });
                } else {
                    var html = template("room-tpl", { rooms: filterLiveRoomName(data.data.rooms) });
                }
                $("#roomlist-box").html(html);
                if (cb) cb();
            } else {
                ajaxErrorCallback(data);
            }
        },
        error: function (error, xhr) {
            setTimeout(function () {
                gSpinner.stop();
            }, 10000);
        }
    });
}

function ajaxErrorCallback(data) {
    switch (data.errorCode) {
        case 10009:
            toastr.error("登录态失效,请重新登录");
            store.clear();
            setTimeout(function () {
                location.reload();
            }, 1500);
            break;
    }
}


App.init();