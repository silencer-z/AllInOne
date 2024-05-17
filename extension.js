import {splashCreate} from "./splash.js";
game.import("extension", function (lib, game, ui, get, ai, _status) {
    const ExtensionName = window.ExtentionName = "AllInOne";
    const AssetPath = window.AssetPath = lib.assetURL + "extension/" + ExtensionName + '/';
    // const ResolvePath = window.ResolvePath = nonameInitialized + "extension/" + ExtensionName + '/';
    return {
        name: "AllInOne",
        content: function (config, pack) {
            if (get.mode() == 'chess' || get.mode() == 'tafang') return;
            let extension = lib.extensionMenu['extension_' + ExtensionName];
            if (!(extension && extension.enable && extension.enable.init)) return;
            // 特效实现
            window.AIO = {
                init: function (config) {
					this.extensionName = ExtensionName;;
                    this.initOverride();
                    return this
                },
                initOverride: function () {
                    // 执行导入的js
                    if (importModule.modules)
                        for (var i = 0; i < importModule.modules.length; i++)
                            importModule.modules[i](lib, game, ui, get, ai, _status);
                },
            };
			AIO.config = config
            AIO.init();
			// 向全屏设置添加返回按钮 并移除system栏
			var node = ui.create.div('.menuBackBtn','返回',ui.menuContainer);
			node.addEventListener('click', event => {
				ui.menuContainer.hide();
			})
        },
        precontent: function () {
            // 加载调试程序，虽然不一定用得到，但是还是添加上
            if (lib.config[`extension_${ExtensionName}_eruda`]) {
                let script = document.createElement('script');
                script.src = AssetPath + 'js/eruda.js';
                document.body.appendChild(script);
                script.onload = function () {
                    eruda.init();
                };
            }
            // 确定开启环境，棋和塔防模式不开启
            if (get.mode() == 'chess' || get.mode() == 'tafang') return;
            const extension = lib.extensionMenu[`extension_${ExtensionName}`];
            if (!(extension && extension.enable && extension.enable.init)) return;
            // 生成导入模块
            window.importModule = (function (importModule) {
                const version = lib.extensionPack.AllInOne.version; // 获取版本
                importModule.init = function () {
                    // 导入主界面和菜单的css样式表
                    this.importCss(AssetPath + 'menu.css');
					this.importCss(AssetPath + 'splash.css');
                    // this.importCss(AssetPath + (lib.config.extension_AllInOne_characterStyle == 'on' ? 'equip.css' : 'equip_new.css'));

                    // 当且仅当初次载入时，characterStyle == void 0 player1.css(on):十周年， player2.css(off):手杀，player3.css(othersOn):OL移动
                    // if (lib.config.extension_AllInOne_characterStyle != void 0) {
                    // 	this.importCss(AssetPath + 'player' + parseFloat(['on', 'off', 'othersOn'].indexOf(lib.config.extension_AllInOne_characterStyle) + 1) + '.css');
                    // } else {
                    // 	this.importCss(AssetPath + 'player1.css');
                    // }
                    // if (lib.config.extension_AllInOne_interfaceStyle != 'On'){
                    //     this.importCss(AssetPath + 'layout1.css');
                    // } else {
                    //     this.importCss(AssetPath + 'layout2.css');
                    // }
                    //
                    // if (lib.config.extension_AllInOne_homeStyle != void 0) {
                    //     this.importCss(AssetPath + 'splash' + parseFloat(['on', 'off', 'othersOn'].indexOf(lib.config.extension_AllInOne_characterStyle) + 1) + '.css');
                    // } else {
                    //     this.importCss(AssetPath + 'home1.css');
                    // }
					// this.importJs(AssetPath + 'splash.js');
					this.importJs(AssetPath + 'menu.js');
					this.importJs(AssetPath + 'indicatorLine.js');
                    // 避免提示是否下载图片和字体素材
                    if (!lib.config.asset_version) game.saveConfig('asset_version', '无');
                    return this;
                };
                importModule.importJs = function (path) {
                    if (!path) return console.error('path');

                    const script = document.createElement('script');
                    script.onload = function () {
                        this.remove();
                    };
                    script.onerror = function () {
                        this.remove();
                        console.error(`${this.src}not found`);
                    };
                    script.src = `${path}?v=${version}`;
                    document.head.appendChild(script);
                    return script;
                };
                importModule.importCss = function (path) {
                    if (!path) return console.error('path');
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `${path}?v=${version}`;
                    document.head.appendChild(link);
                    return link;
                };
                importModule.import = function (module) {
                    if (!this.modules) this.modules = [];
                    if (typeof module != 'function') return console.error('import failed');
                    this.modules.push(module);
                };
				importModule.preImport = function (module) {
					if (!this.preModules) this.preModules = [];
					if (typeof preModules != 'function') return console.error('import failed');
					this.preModules.push(module);
				};
                return importModule.init();
            })({});
			splashCreate(lib, game, ui, get, ai, _status);
			// 添加加载动画 
        },
        help: {},
        config: {
            eruda: {
                name: '开发者选项',
                init: false
            },
            characterStyle: {
                name: '角色样式',
                intro: '切换武将边框样式',
                init: 'on',
                item: {
                    on: '十周年',
                    off: '手杀',
                    othersOn: 'OL',
                },
                onclick: function (control) {
                    const origin = lib.config['extension_AllInOne_characterStyle'];
                    game.saveConfig('extension_AllInOne_characterStyle', control);
                    if (origin != control) {
                        setTimeout(() => game.reload(), 100);
                    }
                },
                update: function () {
                    if (window.AIO) {
                        ui.arena.dataset.characterStyle = lib.config['extension_AllInOne_characterStyle'];
                    }
                }
            },
            UIStyle: {
                name: '界面样式',
                intro: '切换界面样式格式',
                init: 'on',
                item: {
                    on: '十周年样式',
                    off: '手杀样式',
                },
                onclick: function (control) {
                    const origin = lib.config['extension_AllInOne_UIStyle'];
                    game.saveConfig('extension_AllInOne_UIStyle', control);
                    if (origin != control) {
                        setTimeout(() => game.reload(), 100);
                    }
                },
                update: function () {
                    if (window.AIO) {
                        ui.arena.dataset.UIStyle = lib.config['extension_AllInOne_UIStyle'];
                    }
                }
            },
            rightLayout: {
                name: '右手布局',
                init: true,
            },
            equipSeparate: {
                name: '分离装备栏',
                init: true,
            },

			splashStyle: {
                name: '启动页样式',
                intro: '修改启动页样式',
                init: 'on',
                item: {
                    'on': '十周年',
                    'othersOn': '手杀',
                    'off': '关闭',
                }
            },
            cardPrettify: {
                name: '卡牌美化',
                init: 'on',
                item: {
                    'on': '十周年样式',
                    'othersOn': '手杀样式',
                    'off': '关闭',
                }
            },
            menuPrettify: {
                name: '菜单美化',
                init: true,
            },

            dynamicBG: {
                name: "游戏动态背景",
                init: 'off',
                item: {
                    //TODO
                    off: '关闭',
                    1: '1',
                }
            },
			splashDynamicBG: {
                name: '启动页动态背景',
                init: '1',
                item: {
                    //TODO
                    off: 'off',
                    1: '1',
                }
            },

            killEffect: {
                name: '击杀特效',
                init: true,
                onclick: function (value) {
                    game.saveConfig('extension_AIO_killEffect', value);
                    if (window.AIO) AIO.config.killEffect = value;
                },
            },
            dieEffect: {
                name: '阵亡特效',
                init: true,
                onclick: function (value) {
                    game.saveConfig('extension_AIO_dieEffect', value);
                    if (window.AIO) AIO.config.dieEffect = value;
                },
            },
            animationEffect: {
                name: '动画特效',
                init: true,
            },
            cardUseEffect: {
                name: '卡牌使用特效',
                init: true,
                onclick: function (value) {
                    game.saveConfig('extension_十周年UI_cardUseEffect', value);
                    if (window.AIO) AIO.config.cardUseEffect = value;
                },
            },
            indicatorEffect: {
                name: '指示线特效',
                init: 'classic',
				item:{ // TODO 添加动态指示线
					origin:'默认指示线',
					classic:'经典指示线',
					jadeDragon:'金龙指示线',
					decade:'十周年指示线',
					decadeDragon:'十周年龙头指示线',
				},
                onclick: function (item) {
					const origin = lib.config['extension_AIO_indicatorEffect'];
                    game.saveConfig('extension_AIO_indicatorEffect', item);
					console.log(item);
					if (origin != item) {
						game.linexy = game[''+item+'LineXy']
					}
                },
            },
			criticalHitsEffect:{
				name:'暴击指示线特效',
				init: false,
				intro:'需要打开指示线特效,当伤害大于1时触发',
			},

            skinSwitch: {
                name: '换肤',
                init: false,
            },
            dynamicSkin: {
                name: '动态皮肤',
                init: true
            },
            dynamicSkinOutcrop: {
                name: '动皮露头',
                init: true
            },
            outcropSkin: {
                name: '皮肤露头',
                intro: '需要素材',
                init: false
            },

            progressBar: {
                name: '进度条',
                init: true,
            },
            //TODO 做成后面设置以前面设置为前提打开
            progressBarStyle: {
                name: '进度条样式',
                init: '1',
                item: {
                    //TODO
                    1: '1'
                }
            },
            progressBarTime: {
                name: '进度条时间',
                init: '1',
                item: {
                    //TODO
                    1: '1',
                }
            },
            progressBarSet: {
                name: '进度条位置',
                init: '1',
                item: {
                    //TODO
                    1: '1',
                }
            }
        },
        package: {
            character: {
                character: {},
                translate: {}
            },
            card: {
                card: {},
                translate: {},
                list: []
            },
            skill: {
                skill: {},
                translate: {}
            },
            intro: "All In One 目标是集大成 基于十周年,手杀UI，皮肤切换等",
            author: "Yasusi",
            diskURL: "",
            forumURL: "",
            version: "0.0.1",
        },
        files: {
            "character": [],
            "card": [],
            "skill": []
        },
        editable: true
    }
});
