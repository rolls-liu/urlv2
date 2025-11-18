设计目标：推流地址生成器

功能：
1. 支持RTMP、WebRTC、SRT、RTMP over SRT、RTMP over QUIC协议
2. 支持选择MD5、SHA256加密
3. 支持自定义推流域名、AppName、StreamName
4. 支持自定义key
5. 支持自定义过期时间
6. 支持生成推流地址
7. 支持复制推流地址
8. 支持数据持久化，支持恢复上一次的输入
9. 支持历史记录查看，数据存在数据库内


界面：
1. 支持选择协议
2. 支持选择加密类型
3. 支持输入推流域名、AppName、StreamName、key、过期时间
4. 支持生成推流地址
5. 支持复制推流地址
6. 支持清空输入框
7. 支持复制输出框

注意事项：
1. 过期时间为UTC时间，格式为YYYY-MM-DD HH:MM:SS



推流地址解析：
地址组成：推流域名 + AppName + StreamName + 鉴权信息

加密类型：MD5

RTMP地址：rtmp://推流域名/AppName/StreamName?txSecret=md5(key+StreamName+hex(time))&txTime=hex(time)

WebRTC地址：webrtc://推流域名/AppName/StreamName?txSecret=md5(key+StreamName+hex(time))&txTime=hex(time)	

SRT地址：srt://推流域名:9000?streamid=#!::h=推流域名,r=AppName/StreamName,txSecret=md5(key+StreamName+hex(time)),txTime=hex(time)	

RTMP over SRT 地址：rtmp://推流域名:3570/AppName/StreamName?txSecret=md5(key+StreamName+hex(time))&txTime=hex(time)	

RTMP over QUIC 地址：rtmp://推流域名:443/AppName/StreamName?txSecret=
md5(key+StreamName+hex(time))&txTime=hex(time)


加密类型：SHA256

RTMP地址：rtmp://推流域名/AppName/StreamName?txSecret=SHA256(key+StreamName+hex(time))&txTime=hex(time)

WebRTC地址：webrtc://推流域名/AppName/StreamName?txSecret=SHA256(key+StreamName+hex(time))&txTime=hex(time)	

SRT地址：srt://推流域名:9000?streamid=#!::h=推流域名,r=AppName/StreamName,txSecret=SHA256(key+StreamName+hex(time)),txTime=hex(time)	

RTMP over SRT 地址：rtmp://推流域名:3570/AppName/StreamName?txSecret=SHA256(key+StreamName+hex(time))&txTime=hex(time)	

RTMP over QUIC 地址：rtmp://推流域名:443/AppName/StreamName?txSecret=
SHA256(key+StreamName+hex(time))&txTime=hex(time)



输出示例：
RTMP 地址
rtmp://214287.push.tlivecloud.com/live/rollsliu?txSecret=4f9db66f59ba26f211478a1d73433fbf&txTime=691DC0C9

WebRTC 地址
webrtc://214287.push.tlivecloud.com/live/rollsliu?txSecret=4f9db66f59ba26f211478a1d73433fbf&txTime=691DC0C9

SRT 地址
srt://214287.push.tlivecloud.com:9000?streamid=#!::h=214287.push.tlivecloud.com,r=live/rollsliu,txSecret=4f9db66f59ba26f211478a1d73433fbf,txTime=691DC0C9

RTMP over SRT 地址
rtmp://214287.push.tlivecloud.com:3570/live/rollsliu?txSecret=4f9db66f59ba26f211478a1d73433fbf&txTime=691DC0C9

RTMP over QUIC 地址
rtmp://214287.push.tlivecloud.com:443/live/rollsliu?txSecret=4f9db66f59ba26f211478a1d73433fbf&txTime=691DC0C9


参考代码:(go语言)
package a

import (
	"crypto/md5"
	"fmt"
	"strconv"
	"strings"
	"time"
)

func GetPushUrl(domain, streamName, key string, time int64)(addrstr string){
	var ext_str string
	if key != "" && time != 0{
		txTime := strings.ToUpper(strconv.FormatInt(time, 16))
		txSecret := md5.Sum([]byte(key + streamName + txTime))
		txSecretStr := fmt.Sprintf("%x", txSecret)
		ext_str = "?txSecret=" + txSecretStr + "&txTime=" + txTime
	}
	addrstr = "rtmp://" + domain + "/live/" + streamName + ext_str
	return
}
/*
*domain: 123.test.com
*streamName: streamname
*key: 69e0daf7234b01f257a7adb9f807ae9f
*time: 2022-04-26 14:57:19 CST
*/
func main(){
	domain, streamName, key := "123.test.com", "streamname", "69e0daf7234b01f257a7adb9f807ae9f"
	//CST: ChinaStandardTimeUT, "2006-01-02 15:04:05 MST" must be const
	t, err := time.Parse("2006-01-02 15:04:05 MST", "2022-04-26 14:57:19 CST")
	if err != nil{
		fmt.Println("time transfor error!")
		return
	}
	fmt.Println(GetPushUrl(domain, streamName, key, t.Unix()))
	return
}