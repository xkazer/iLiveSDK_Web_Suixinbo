# iLiveSDK 1.2.0.0 升级指引

为了提升sdk质量，iLiveSDK 1.2.0.0对接口做了一些小改动，此处作一一列举，方便用户升级;
1. setC2CListener()\setGroupListener()两个接口，合并为一个接口setMessageListener(群消息和C2C消息都通过此回调通知业务侧侧);
2. 增加获取麦克风和扬声器列表的接口，打开麦克风和扬声器都需要传入对应的设备id了;
	为了和麦克风、扬声器设备统一,之前的摄像头\窗口都做把名字进行了统一，具体如下,<br/>
	IliveCamera		->	ILiveDevice;
	IliveCameraList	->	ILiveDeviceList;
	ILiveWndList	->	ILiveDeviceList;
3. 之前的设备(摄像头\麦克风\扬声器\屏幕分享)操作接口，不再通过返回值表示成功与否，而是通过setDeviceOperationCallback设置的异步回调通知给业务侧,具体情况参考随心播;
4. createRoom()\joinRoom()增加一个参数authBits，需要根据对应角色填写相应的权限,详细情况，见接口注释;
   通过配置此字段，可以直接以连麦身份加入房间;
5. 去掉destroyFilter()接口,SDK内部会自动销毁;
6. 去掉渲染器的freeRender()接口，SDK内部会自动释放;

注: 版本接口改动，请参考随心播代码进行修改; 新增的一些功能，随心播上可能没有对应的演示代码，请参考接口注释;






腾讯云互动直播团队

