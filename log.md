# AllInOne 指南
## 接口设置
1. 插件的配置读取：AIO.config.配置名/lib.config['extension_扩展名_配置名']
2. AIO.config.配置名只能看开没开 lib.config['extension_扩展名_配置名'] 则能看选的是什么
3. 配置选项记得每一个最后要加上逗号结束。
4. 角色点击事件在ui.click中
5. 角色UI生成通过覆写lib.element.Player(类)实现

## Css设置
1. 固定比例不能使用aspect-radio不支持
2. 利用padding-bottom实现，他是根据父类宽度设置的，然后再在容器里面使用绝对定位


## TODO tree
1. 字体设置
2. 载入动画
3. 加载界面
4. pixi实现
5. 主页其他模式
6. 主页功能区实现
