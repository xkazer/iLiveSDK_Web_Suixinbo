

/**
* iliveSDK成功回调
* @callback ILiveSDK~iliveSucCallback
*/

/**
* iliveSDK失败回调
* @callback ILiveSDK~iliveErrCallback
* @param {ILiveErrorMessage} message 错误信息
*/

/**
* iliveSDK收消息回调
* @callback ILiveSDK~iliveMessageCallback
* @param {ILiveMessage} msg 消息
*/

/**
* iliveSDK房间内事件回调
* @callback ILiveSDK~iliveRoomEventListener
* @param {ILiveRoomEvent} roomevent 房间内事件
*/

/**
* iliveSDK被踢下线回调
* @callback ILiveSDK~iliveOnForceOffline
*/

/**
* iliveSDK设备操作回调
* @callback ILiveSDK~iliveDeviceOperationCallback
* @param {E_iLiveOperType} oper 设备操作类型
* @param {number} code 设备操作结果,0表示成功
*/

/**
* iliveSDK设备插拔回调
* @callback ILiveSDK~iliveDeviceDetectCallback
*/

/**
* iliveSDK直播质量回调
* @callback ILiveSDK~iliveQualityParamCallback
* @param {json} param 直播质量参数,各个字段含义见https://github.com/zhaoyang21cn/iLiveSDK_Web_Suixinbo/blob/master/doc/iLiveSDK_QualityParam.md
*/

/**
* ILiveSDK
* @constructor
* @throws iliveSDKObj不存在时抛出异常
* @param {number} appid - 腾讯云分配的appid
* @param {number} accountType - 腾讯云分配的accoutType
* @param {string} iliveSDK - html页面中iLiveSDK object的ID
*/
function ILiveSDK(appid, accountType, iliveSDKObj) {
    this.appid = appid;
    this.accountType = accountType;
    this.ilive = document.getElementById(iliveSDKObj);
    if (!this.ilive) throw new Error("iliveSDK object not found");
}

ILiveSDK.prototype = {
    /**
    * 获取iliveSDK版本
    * @returns {string} 版本号
    */
    version: function () {
        return this.ilive.getVersion();
    },

    detect: function() {
        var ua = navigator.userAgent;
        var msie = ua.indexOf('MSIE ');
        var version = 0;
        if (msie > 0) {
            // IE 10 or older => return version number
            version = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            msie = true;
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            version = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10) || version;
        }

        //不支持64位IE
        if ( msie !== -1 && ((window.navigator.cpuClass == "x86" && (version == 8 || version == 9 || version == 10) ) || version == 11) ) {
            return false;
        }
        return {
            "msie": !!msie,
            "version": version,
            "cpuClass": window.navigator.cpuClass
        };
    },

    /**
    * 设置是否支持IM功能(聊天等即时通讯功能),注意,必须在初始化之前调用;
    * @param {boolean} imSupport - 是否支持IM功能
    */
    setIMSupport: function (imSupport) {
        this.ilive.setIMSupport(imSupport);
    },

    /**
    * 设置房间内直播质量回调接口
    * @param {ILiveSDK~iliveQualityParamCallback} listener - 监听函数
    * @description 调用此接口设置回调后，进入房间就会每隔1秒通知一次业务层房间内相关参数情况
    */
    setQualityParamCallback: function (listener) {
        this.ilive.setQualityParamCallback( function(szRet){
            if (listener) {
                var obj = JSON.parse(szRet);
                if (obj.videoEncodeParams == null) {
                    obj.videoEncodeParams = new Array();
                }
                if (obj.videoDecodeParams == null) {
                    obj.videoDecodeParams = new Array();
                }
                if (obj.audioDecodeParams == null) {
                    obj.audioDecodeParams = new Array();
                }
                listener(obj);
            }
        }
        );
    },

    /**
    * 将初始化iliveSDK.
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    init: function (suc, err)
    {
        var detect = this.detect();
        if (detect) {
            err(detect);
            alert('浏览器版本有误，只能为32位的IE8/IE9/IE10以及32位或64位的IE11,当前版本 ' + JSON.stringify(detect));
            return;
        }
        this.ilive.initSdk(this.appid, this.accountType, function () {
            if(suc) {
                suc();
            }
        },
        function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        }
        );
    },

    /**
    * 释放iliveSDK
    */
    unInit: function () {
        this.ilive.release();
    },

    /**
    * 登录
    * @param {string} id - 登录id
    * @param {string} sig - 登录签名
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    login: function (id, sig, suc, err) {
        this.ilive.iLiveLogin(id, sig, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

    /**
    * 登出
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    logout: function (suc, err) {
        this.ilive.iLiveLogout(function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

    /**
    * 开始设备测试; 在登录之后，进入房间之前，可以开启设备测试，成功后，可以对摄像头、麦克风、扬声器，进行设备测试;此时,美颜、美白功能可用;
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    * @param {number} preWidth - 设备测试中，摄像头预览画面的宽度
    * @param {number} preHeight - 设备测试中，摄像头预览画面的高度
    */
    startDeviceTest: function(suc, err, preWidth, preHeight) {
        if (preWidth === undefined || preHeight === undefined) {
            preWidth = 640;
            preHeight = 480;
        }
        this.ilive.startDeviceTest(function () {
            if(suc){
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        }, preWidth, preHeight );
    },
    
    /**
    * 停止设备测试; 在开始设备测试后，需要停止设备测试，才能进入房间，否则会返回相应错误码;
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    stopDeviceTest: function(suc, err) {
        this.ilive.stopDeviceTest(function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

    /**
    * 创建房间
    * @param {number} roomID - 房间ID
    * @param {E_iLiveAuthBits} authBits - 角色权限位
    * @param {string} controlRole - 角色
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    * @param {boolean} model - 是否竖屏开播; false: 否 true: 是; 如果createRoom 不传该参数，默认false横屏
    */ 
    createRoom: function (roomID, authBits, controlRole, suc, err, model) {
        var rotate = -1;
        if (true == model){
            rotate = 3; // 3 代表旋转 270度；-1代表不旋转 
        }else{
            rotate = 0; // 0 代表不旋转
        }
        this.ilive.createRoom(roomID, authBits, controlRole, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        }, rotate);
    },

   /**
    * 加入房间
    * @param {number} roomID - 房间ID
    * @param {E_iLiveAuthBits} authBits - 角色权限位
    * @param {string} controlRole - 角色
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    joinRoom: function (roomID, authBits, controlRole, suc, err) {
        this.ilive.joinRoom(roomID, authBits, controlRole, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 退出房间
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    quitRoom: function (suc, err) {
        this.ilive.quitRoom(function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 获取摄像头列表
    * @returns {ILiveDeviceList} 摄像头列表信息结果
    */
    getCameraList: function () {        
        var szRet = this.ilive.getCameraList();
        var obj = JSON.parse(szRet);
        var cList = [];
        if (obj.code == 0) {
            for (var i = 0; i < obj.cameralist.length; ++i) {
                var camera = new ILiveDevice(obj.cameralist[i].id, obj.cameralist[i].name);
                cList.push(camera);
            }
        }
        return new ILiveDeviceList(obj.code, cList);
    },

   /**
    * 打开摄像头
    * @param {string} id - 需要打开的摄像头ID
    */
    openCamera: function (id) {
        this.ilive.openCamera(id);
    },

   /**
    * 关闭摄像头
    */
    closeCamera: function () {
        return this.ilive.closeCamera();
    },

    /**
    * 获取任务栏打开的窗口列表
    * @returns {ILiveDeviceList} 获取的窗口列表结果
    */
    getWndList: function () {
        var szRet = this.ilive.getWndList();
        var obj = JSON.parse(szRet);
        var wList = [];
        if (obj.code == 0) {
            for (var i = 0; i < obj.wndlist.length; ++i) {
                var wnd = new ILiveDevice(obj.wndlist[i].id, obj.wndlist[i].title);
                wList.push(wnd);
            }
        }
        return new ILiveDeviceList(obj.code, wList);
    },

    /**
    * 指定窗口进行屏幕分享
    * @param {number} wndID - 指定窗口的id
    */
    openScreenShareWnd: function(wndID) {
        this.ilive.openScreenShareWnd(wndID);
    },

    /**
    * 指定区域进行屏幕分享
    * @param {number} left - 指定区域的左边界x坐标
    * @param {number} top - 指定区域的上边界y坐标
    * @param {number} right - 指定区域的右边界x坐标
    * @param {number} bottom - 指定区域的下边界y坐标
    */
    openScreenShareArea: function(left, top, right, bottom){
        this.ilive.openScreenShareArea(left, top, right, bottom);
    },

    /**
    * 修改指定的屏幕分享区域
    * @param {number} left - 指定区域的左边界x坐标
    * @param {number} top - 指定区域的上边界y坐标
    * @param {number} right - 指定区域的右边界x坐标
    * @param {number} bottom - 指定区域的下边界y坐标
    * @returns {number} 结果（0为成功）
    */
    changeScreenShareSize: function(left, top, right, bottom)
    {
        return this.ilive.changeScreenShareSize(left, top, right, bottom);
    },

    /**
    * 关闭屏幕分享
    */
    closeScreenShare: function()
    {
        this.ilive.closeScreenShare();
    },

    /**
    * 获取麦克风列表
    * @returns {ILiveDeviceList} 获取麦克风列表信息结果
    */
    getMicList: function () {    
        var szRet = this.ilive.getMicList();
        var obj = JSON.parse(szRet);
        var cList = [];
        if (obj.code == 0) {
            for (var i = 0; i < obj.miclist.length; ++i) {
                var mic = new ILiveDevice(obj.miclist[i].id, obj.miclist[i].name);
                cList.push(mic);
            }
        }
        return new ILiveDeviceList(obj.code, cList);
    },

   /**
    * 打开麦克风
    * @param {string} id - 需要打开的麦克风ID
    */
    openMic: function (id) {
        this.ilive.openMic(id);
    },

   /**
    * 关闭麦克风
    */
    closeMic: function () {
        this.ilive.closeMic();
    },

    /**
    * 获取扬声器列表
    * @returns {ILiveDeviceList} 获取扬声器列表信息结果
    */
    getSpeakerList: function () {        
        var szRet = this.ilive.getPlayerList();
        var obj = JSON.parse(szRet);
        var cList = [];
        if (obj.code == 0) {
            for (var i = 0; i < obj.playerlist.length; ++i) {
                var speaker = new ILiveDevice(obj.playerlist[i].id, obj.playerlist[i].name);
                cList.push(speaker);
            }
        }
        return new ILiveDeviceList(obj.code, cList);
    },
   
   /**
    * 打开扬声器
    * @param {string} id - 需要打开的扬声器ID
    */
    openSpeaker: function (id) {
        this.ilive.openPlayer(id);
    },

   /**
    * 关闭扬声器
    */
    closeSpeaker: function () {
        this.ilive.closePlayer();
    },

   /**
    * 发送群消息
    * @param {ILiveMessage} message - 消息
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    sendGroupMessage: function (message, suc, err) {
        if (message instanceof ILiveMessage) {
            if (message.elems.length == 0) return;

            var msg = {};
	        var elems = [];
	        for (var i = 0; i < message.elems.length; ++i) {
            	var elem = {};
	            elem.type = message.elems[i].type;
	            elem.content = message.elems[i].content;
	            elems.push(elem);
            }
            msg.elems = elems;
            this.ilive.sendGroupMessage(JSON.stringify(msg), function () {
                if (suc) {
                    suc();
                }
            }, function (msg) {
                if (err) {
                    var obj = JSON.parse(msg);
                    err(obj);
                }
            });
        }        
    },

    /**
    * 发送C2C消息
    * @param {string} to - 发送对象
    * @param {ILiveMessage} message - 消息
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    sendC2CMessage: function (to, message, suc, err) {
        if (message instanceof ILiveMessage) {
            if (message.elems.length == 0) return;
	        var msg = {};
	        var elems = [];
	        msg.to = to;
	        for (var i = 0; i < message.elems.length; ++i) {
            	var elem = {};
	            elem.type = message.elems[i].type;
	            elem.content = message.elems[i].content;	
	            elems.push(elem);
            }
	        msg.elems = elems;
            this.ilive.sendC2CMessage(JSON.stringify(msg), function () {
                if (suc) {
                    suc();
                }
            }, function (msg) {
                if (err) {
                    var obj = JSON.parse(msg);
                    err(obj);
                }
            });
        }        
    },

    /**
    * 设置消息监听
    * @param {iliveMessageCallback} listener - 消息监听
    */
    setMessageListener: function (listener) {
        var msglistener = function (msg) {
            var obj = JSON.parse(msg);
            elems = [];
            for (var i = 0; i < obj.elements.length; ++i) {
                var elem = new ILiveMessageElem(obj.elements[i].type, obj.elements[i].content);
                elems.push(elem);
            }
            var message = new ILiveMessage(elems);
            message.time = obj.time;
            message.sender = obj.sender;
            listener(message);
        };
        if (listener) {
            this.ilive.setMessageCallBack(msglistener);
        }
    },

    /**
    * 设置与房间断开连接的监听函数
    * @param {ILiveSDK~iliveErrCallback} listener - 监听函数
    * @description 在一些异常情况下，sdk会自动退出房间，如断网超时未能自动重连成功等。
    * 收到此回调后,sdk已自动退出房间，重新连上网后，需重新进入房间;
    */
    setRoomDisconnectListener: function(listener)
    {
        this.ilive.setRoomDisconnectListener( function (msg) {
            if (listener) {
                var obj = JSON.parse(msg);
                listener(obj);
            }
        });
    },

   /**
    * 设置房间内事件的监听函数
    * @param {iliveRoomEventListener} listener - 事件监听函数
    */
    setRoomEventListener: function (listener) {        
        this.ilive.setRoomEventListener(function (eventid, identifier) {
            roomevent = new ILiveRoomEvent(eventid, identifier);
            listener(roomevent);
        });
    },

   /**
    * 设置被踢下线监听
    * @param {iliveOnForceOffline} listener - 事件监听
    */
    setForceOfflineListener: function (listener) {
        this.ilive.setForceOfflineCallback(function () {
            listener();
        });
    },
    
    /**
    * 设置设备操作监听
    * @param {iliveDeviceOperationCallback} listener - 事件监听
    */
    setDeviceOperationCallback: function (listener) {
        this.ilive.setDeviceOperationCallback(function (szInfo) {
            var obj = JSON.parse(szInfo);
            if (listener) {
                listener(obj.oper, obj.code);
            }
        });
    },

    /**
    * 设置设备插拔监听; 当设备插拔时，会通过此回调通知用户侧，收到此回调时，需要更新麦克风、扬声器、摄像头列表;
    * 如果是正在使用中的设备被拔出，在此回调之前,还会收到对应的设备关闭回调;注意: 只有在房间中，或者设备测试中时，才会收到此回调;
    * @param {iliveDeviceDetectCallback} listener - 设备插拔监听
    */
    setDeviceDetectCallback: function (listener) {
        this.ilive.setDeviceDetectCallback(function () {
            if (listener) {
                listener();
            }
        });
    },

   /**
    * 开始推流
    * @param {ILivePushStreamOption} option - 推流参数
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调, 回调返回流信息
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    startPushStream: function (option, suc, err) {
        if (option instanceof ILivePushStreamOption) {
            this.ilive.startPushStream(JSON.stringify(option), function (msg) {
                if (suc) {
                    var obj = JSON.parse(msg);
                    suc(obj);
                }
            }, function (msg) {
                if (err) {
                    var obj = JSON.parse(msg);
                    err(obj);
                }
            });
        }
    },

   /**
    * 结束推流
    * @param {number} channelID - 流ID
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    stopPushStream: function (channelID, suc, err) {
        this.ilive.stopPushStream(channelID, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 设置美颜程度
    * @param {number} beauty - 美颜程度 0~7
    */
	setBeauty: function (beauty) {

		this.ilive.setBeauty(beauty);
	},
    /**
    * 设置美白程度
    * @param {number} white - 美白程度 0~9
    */
	setWhite: function (white) {
		this.ilive.setWhite(white);
	},
    /**
    * 设置清晰程度
    * @param {number} sharpen - 清晰程度 0~9
    */
	setSharpen: function (sharpen) {
		this.ilive.setSharpen(sharpen);
	},

   /**
    * 修改角色
    * @param {string} role - 角色名
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    changeRole: function (role, suc, err) {
        this.ilive.changeRole(role, function () {
            if (suc) {
                suc();
            }
        }, function () {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },
}

/**
* 错误信息
* @class
* @constructor
* @param {string} module - 报错的模块
* @param {number} code - 错误码
* @param {string} message - 错误描述
*/
function ILiveErrorMessage(module, code, message) {
    this.module = module;
    this.code = code;
    this.message = message;
}

/**
* 消息
* @class
* @constructor
* @param {ILiveMessageElem[]} elems - 消息内容
*/
function ILiveMessage(elems) {
    this.elems = elems;
}

/**
* 消息内容元素
* @class
* @constructor
* @param {E_iLiveMessageElemType} type - 消息类型
* @param {string} content - 消息内容
*/
function ILiveMessageElem(type, content) {
    this.type = type;
    this.content = content;
}

/**
* 房间内事件
* @class
* @constructor
* @param {E_iLiveRoomEventType} eventid - 事件id
* @param {string} identifier - 发生此事件的用户id
*/
function ILiveRoomEvent(eventid, identifier) {
    this.eventid = eventid;
    this.identifier = identifier;
}

/**
* 设备信息
* @class
* @constructor
* @param {string} id - 设备ID
* @param {string} name - 设备名称
*/
function ILiveDevice(id, name) {
    this.id = id;
    this.name = name;
}

/**
* 设备列表
* @class
* @constructor
* @param {number} code - 获取结果,0表示成功
* @param {ILiveDevice[]} devices - 设备信息列表
*/
function ILiveDeviceList(code, devices) {
    this.code = code;
    this.devices = devices;
}

/**
* 视频渲染器
* @class
* @constructor
* @param {string} iliveRenderObj - html中iLiveRender object的ID
*/
function ILiveRender(iliveRenderObj) {
    this.render = document.getElementById(iliveRenderObj);
}

ILiveRender.prototype = {
    /**
    * 设置渲染器绑定的用户id。
    * @description 渲染器绑定id后，将会开始渲染绑定用户的视频画面;
    * @param {string} identifer - 用户id
    */
    setIdentifer: function (identifer) {
        this.render.setIdentifer(identifer);
    },

    /**
    * 获取渲染器绑定的用户id
    * @returns {string} 绑定用户的id
    */
    getIdentifer: function () {
        return this.render.getIdentifer();
    },

    /**
    * 渲染器是否空闲可用。
    * @returns {boolean} 控件是否空闲可用，true 是，false 否;
    */
    isFreeRender: function () {
        return this.render.isFreeRender();
    },

    /**
    * 视频帧截图.
    * @description 对渲染器的当前画面进行截图.
    * @returns {string} 截图的base64编码数据,如果截图失败，返回空字符串;
    */
    snapShot: function () {
        return this.render.snapShot();
    },

    /**
    * 设置是否为辅路视频渲染器.
    * @param {boolean} bAuxRoad - 是否为辅路视频渲染器.
    * @description 屏幕分享通过辅路流进行传输; 将渲染器设置为辅路视频渲染器，将会渲染屏幕分享的画面;
    * 设置辅路视频渲染器后，不需要设置此渲染器的identifier了，因为一个房间内只有一路辅流，即同一时刻只能一个用户占用;
    */
    setAuxRoadVideo: function (bAuxRoad) {
        return this.render.setAuxRoadVideo(bAuxRoad);
    },

    /**
    * 获取是否为辅路视频渲染器.
    * @returns {boolean} 是否为辅路视频渲染器;
    */
    getAuxRoadVideo: function (bAuxRoad) {
        return this.render.getAuxRoadVideo();
    },

    /**
    * 设置渲染器的渲染模式.
    * @param {E_iLiveRenderMode} mode - 渲染模式
    */
    setRenderMode: function (mode) {
        this.render.setRenderMode(mode);
    },
}

/**
* 直播码推流录制参数
* @class
* @constructor
* @param {E_iLivePushDataType} dataType - 推流数据类型
* @param {E_iLivePushEncode} encode - 推流数据编码方式
* @param {E_iLivePushRecordFileType} fileType - 录制文件类型
*/
function ILivePushStreamOption(dataType, encode, fileType) {
    this.dataType = dataType;
    this.encode = encode;
    this.fileType = fileType;
}

/**
 * 消息元素类型
 * @readonly
 * @enum {number}
 */
var E_iLiveMessageElemType = {
    /** 文本消息 */
    TEXT: 0,
    /** 自定义消息，消息内容为string。业务层负责解析 */
    CUSTOM: 1,
};

/**
 * 房间内事件类型
 * @readonly
 * @enum {number}
 */
var E_iLiveRoomEventType = {
    /** 打开摄像头 */
    HAS_CAMERA_VIDEO: 3,
    /** 关闭摄像头 */
    NO_CAMERA_VIDEO: 4,
    /** 打开屏幕分享 */
    HAS_SCREEN_VIDEO: 7,
    /** 关闭屏幕分享 */
    NO_SCREEN_VIDEO: 8,
    /** 打开文件播放 */
    HAS_MEDIA_VIDEO: 9,
    /** 关闭文件播放 */
    NO_MEDIA_VIDEO: 10,
};

/**
 * 推流数据类型
 * @readonly
 * @enum {number}
 */
var E_iLivePushDataType = {
    /** 摄像头 */
    CAMERA: 0,
    /** 辅路 */
    SCREEN: 1,
};

/**
 * 推流数据编码类型
 * @readonly
 * @enum {number}
 */
var E_iLivePushEncode = {
    HLS: 0x1,
    FLV: 0x2,
    HLS_AND_FLV: 0x3,
    RAW: 0x4,
    RTMP: 0x5,
    HLS_AND_RTMP: 0x6,
};

/**
 * 录制文件类型
 * @readonly
 * @enum {number}
 */
var E_iLivePushRecordFileType = {
    /** 不录制，默认。控制台如果设置了自动录制则以控制台配置为准 */
    NONE: 0,
    HLS: 1,
    FLV: 2,
    HLS_FLV: 3,
    MP4: 4,
    HLS_MP4: 5,
    FLV_MP4: 6,
    HLS_FLV_MP4: 7,
};

/**
 * 设备操作类型
 * @readonly
 * @enum {number}
 */
var E_iLiveOperType = {
    /** 打开摄像头 */
	Open_Camera: 1,
    /** 关闭摄像头 */
	Close_Camera: 2,
    /** 打开麦克风 */
	Open_Mic: 5,
    /** 关闭麦克风 */
	Close_Mic: 6,
    /** 打开扬声器 */
	Open_Player: 7,
    /** 关闭扬声器 */
	Close_Player: 8,
    /** 打开屏幕分享 */
	Open_Screen_Share: 9,
    /** 关闭屏幕分享 */
	Close_ScreenShare: 10,
};

/**
 * 渲染器模式
 * @readonly
 * @enum {number}
 */
var E_iLiveRenderMode = {
    /** 根据视频画面比例缩放，不足的填充黑边 */
	RenderMode_BlackBorder: 0,
    /** 拉伸画面到渲染控件大小 */
	RenderMode_FullWnd: 1,
};

/**
 * 进入房间的权限位
 * @readonly
 * @enum {number}
 */
var E_iLiveAuthBits = {
    /** 主播权限位(所有权限) */
    AuthBit_LiveMaster: 0xFFFFFFFF,
    /** 连麦观众权限位(出了创建房间之外的所有权限) */
    AuthBit_LiveGuest: 0xFFFFFFFE,
    /** 普通观众权限位(只有下行数据权限) */
    AuthBit_Guest: 0x000000AA,
};