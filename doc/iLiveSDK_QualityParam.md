## 直播质量回调各参数意义

```
{
	"exeCpuRate": 3456,		// 应用CPU使用率×10000(例如：3456对应于34.56%)
	"sysCpuRate": 3456,		// 系统CPU使用率×10000(例如：3456对应于34.56%)
	"rtt": 10,			// 往返时延（Round-Trip Time），单位毫秒;
	
	"videoEncodeParams": [		// 视频编码参数
		{
			"viewType": 0,	// 画面类型，作为编码信息索引：0-主路画面 2-辅路
			"width": 0,	// 视频编码宽
			"height": 0,	// 视频编码高
			"fps": 0,	// 视频编码实时帧率×10
			"angle": 253,	// 角度
			"bitrate": 0	// 视频编码码率(无包头)
		},
		{
			"viewType": 0,
			"width": 0,
			"height": 0,
			"fps": 0,
			"angle": 253,
			"bitrate": 0
		},
		{
			"viewType": 2,
			"width": 1920,
			"height": 1080,
			"fps": 0,
			"angle": 0,
			"bitrate": 0
		}
	],
	"videoDecodeParams": [			// 视频解码参数
		{
			"userId": "userId",	// 解码用户
			"viewType": 0,		// 画面类型，作为编码信息索引：0-主路画面 2-辅路
			"width": 1280,		// 视频解码宽
			"height": 720,		// 视频解码高
			"fps": 131,		// 视频解码出的帧率×10
			"bitrate": 193		// 视频解码出的码率(无包头)
		}
	],
	
	"videoMainQosParam": {	// 主路视频流控下发参数
		"bitrate": 0,	// 码率
		"fps": 0,	// 帧率
		"height": 0,	// 视频宽
		"width": 0	// 视频高
	},
	"videoAuxQosParam": {	// 辅路视频流控下发参数
		"bitrate": 0,	// 码率
		"fps": 0,	// 帧率
		"height": 0,	// 视频宽
		"width": 0	// 视频高
	},
	
	"audioEncodeParams": {		// 音频编码参数(此参数暂时为空，后续会修正)
		"encodeBitrate": 0	//音频编码码率
	},
	"audioDecodeParams": [		// 音频解码参数(此参数暂时为空，后续会修正)
		{
			"userId": "UserId",	// 音频解码用户
			"sampleRate": 48000,	// 音频编码采样率
			"channelCount": 2	// 通道数，1表示单声道(mono)，2表示立体声(stereo)
		}
	],
	
	"audioQosParam": {		// 音频流控下发参数
		"aecEnable": 1,		// AEC功能是否开启
		"agcEnable": 0,		// AGC功能是否开启
		"bitrate": 24000,	// 码率
		"channelCount": 2,	// 通道数，1表示单声道(mono)，2表示立体声(stereo)
		"sampleRate": 48000 	// 采样率
	}
}
```
