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
            window.AIO = AllInOne = {
                init: function (config) {
                    this.initOverride();
                    return this
                },
                initOverride: function () {
                    function override (dest, src) {
                        var ok = true;
                        var key;
                        for (key in src) {
                            if (dest[key]) {
                                ok = override(dest[key], src[key]);
                                if (ok) {
                                    dest[key] = src[key];
                                }
                            } else {
                                dest[key] = src[key];
                            }
                            ok = false;
                        }

                        return ok;
                    }
                    function overrides (dest, src) {
                        if (!dest._super) dest._super = {};
                        for (var key in src) {
                            if (dest[key])
                                dest._super[key] = dest[key];

                            dest[key] = src[key];
                        }
                    }

                    var base = {
                        ui:{
                            create:{
                                card: ui.create.card,
                                cards: ui.create.cards,
                                confirm: ui.create.confirm,
                                volume: ui.create.volume,
                                chat: ui.create.chat,
                                button: ui.create.button,
                                menu: ui.create.menu,
                                player: ui.create.player,
                                selectlist: ui.create.selectlist,
                            },

                            update: ui.update,
                            updatec: ui.updatec,
                        },
                        get:{
                            infoHp: get.infoHp,
                            infoMaxHp: get.infoMaxHp,
                            objtype: get.objtype,
                            skillState: get.skillState,
                        },
                        game:{
                            check: game.check,
                            expandSkills: game.expandSkills,
                            uncheck: game.uncheck,
                            loop: game.loop,
                            over: game.over,
                            updateRoundNumber: game.updateRoundNumber,
                            phaseLoop: game.phaseLoop,
                            bossPhaseLoop: game.bossPhaseLoop,
                            gameDraw: game.gameDraw,
                        },
                        lib:{
                            element:{
                                card:{
                                    init: lib.element.card.init,
                                },

                                content:{
                                    chooseButton: lib.element.content.chooseButton,
                                    turnOver: lib.element.content.turnOver,
                                },

                                control:{
                                    add: lib.element.control.add,
                                    open: lib.element.control.open,
                                    close: lib.element.control.close,
                                },

                                player:{
                                    getState: lib.element.player.getState,
                                    init: lib.element.player.init,
                                    uninit: lib.element.player.uninit,
                                    setModeState: lib.element.player.setModeState,
                                    $compare: lib.element.player.$compare,
                                    $disableEquip: lib.element.player.$disableEquip,
                                    $damage: lib.element.player.$damage,
                                    $damagepop: lib.element.player.$damagepop,
                                    $dieAfter: lib.element.player.$dieAfter,
                                    $skill: lib.element.player.$skill,
                                },
                                event:{
                                    send: lib.element.event.send,
                                },
                            },
                        },
                    };

                    var ride = {};
                    ride.lib = {
                        element:{
                            player:{
                                $dieAfter:function(){
                                    this.stopDynamic();

                                    if (!lib.config.extension_AllInOne_dieEffect) { //Note lib.config.extension_AllInOne_dieEffect
                                        if (base.lib.element.player.$dieAfter) base.lib.element.player.$dieAfter.apply(this, arguments);
                                        return;
                                    }

                                    if(!this.node.dieidentity) this.node.dieidentity = ui.create.div('died-identity', this);
                                    this.node.dieidentity.classList.add('died-identity');

                                    var that = this;
                                    var image = new Image();
                                    var identity = AIO.getPlayerIdentity(this); // Fixme lib中没有这个函数吗

                                    // 不同阵亡图片样式
                                    if (lib.config.extension_AllInOne_UIStyle == 'on') {
                                        var url = extensionPath + 'image/decoration/dead_' + identity + '.png'; } else {
                                        var url = extensionPath + 'image/decorations/dead2_' + identity + '.png'; }


                                    image.onerror = function(){
                                        that.node.dieidentity.innerHTML = AIO.getPlayerIdentity(that, that.identity, true) + '<br>阵亡';// Fixme lib中没有这个函数吗
                                    };

                                    that.node.dieidentity.style.backgroundImage = 'url("' + url + '")';
                                    image.src = url;
                                    setTimeout(function(){
                                        var rect = that.getBoundingClientRect();
                                        AIO.animation.playSpine('effect_zhenwang', { //Link animation.js
                                            x: rect.left + rect.width / 2 - 7,
                                            y: AIO.get.bodySize().height - rect.top - rect.height / 2 + 1, // Fixme lib中没有这个函数吗
                                            scale: 0.8,
                                        });
                                    }, 250);
                                },
                                $skill:function(name, type, color, avatar){
                                    // Note lib.config.extension_AllInOne_dieEffect
                                    // Link animation.js
                                    if (!lib.config.extension_AllInOne_AnimationEffect || !AIO.animation.gl) return base.lib.element.player.$skill.apply(this, arguments);
                                    var _this = this;
                                    if (typeof type != 'string') type = 'legend';

                                    game.addVideo('skill', this, [name, type, color, avatar]);
                                    game.broadcastAll(function(player, type, name, color, avatar){
                                        if (window.AIO == void 0) {
                                            game.delay(2.5);
                                            if (name) player.$fullscreenpop(name, color, avatar);
                                            return;
                                        }

                                        AIO.delay(2500); // Fixme lib中没有这个函数吗
                                        if (name) AIO.effect.skill(player, name, avatar); // Link effect.js
                                    }, _this, type, name, color, avatar);
                                },
                            }
                        }
                    }
                    override(lib, ride.lib);
                    // 执行导入的js
                    if (importModule.modules)
                        for (var i = 0; i < importModule.modules.length; i++)
                            importModule.modules[i](lib, game, ui, get, ai, _status);
                    /**
                     *  添加伤害与治疗的动画
                     * @param num 体力变化值
                     * @param nature 属性
                     * @param font game.addVideo调用参数
                     * @param nobroadcast 是否调用game.broadcast
                     */
                    lib.element.player.$damagepop = function(num, nature, font, nobroadcast){
                        if (typeof num == 'number' || typeof num == 'string') {
                            game.addVideo('damagepop', this, [num, nature, font]);
                            if (nobroadcast !== false) {
                                game.broadcast(function(player, num, nature, font) {
                                    player.$damagepop(num, nature, font);
                                }, this, num, nature, font);
                            }

                            var node;
                            if (this.popupNodeCache && this.popupNodeCache.length) {
                                node = this.popupNodeCache.shift();
                            } else {
                                node = AIO.element.create('damage'); //Fixme lib 中没有这个函数吗
                            }

                            if (font) {
                                node.classList.add('normal-font');
                            } else {
                                node.classList.remove('normal-font');
                            }

                            if (typeof num == 'number') {
                                node.popupNumber = num;
                                if (num == Infinity) {
                                    num = '+∞';
                                } else if (num == -Infinity) {
                                    num = '-∞';
                                } else if (num > 0 && num != Infinity) {
                                    num = '';//回复体力数值赋空
                                } else if (num <= 0 && num != -Infinity) {
                                    num = '';//伤害体力数值赋空
                                }

                            } else {
                                node.popupNumber = null;
                            }

                            node.textContent = num;
                            node.dataset.text = num;
                            node.nature = nature || 'soil';
                            this.damagepopups.push(node);
                        }

                        if (this.damagepopups.length && !this.damagepopLocked) {
                            var node = this.damagepopups.shift();
                            this.damagepopLocked = true;
                            if (this != node.parentNode) this.appendChild(node);

                            var player = this;
                            if (typeof node.popupNumber == 'number') {
                                var popupNum = node.popupNumber;
                                if (popupNum < 0) {
                                    switch (node.nature) {
                                        case 'thunder':
                                            if (popupNum <= -2) {
                                                AIO.animation.playSpine({ name:'effect_shoujidonghua', action: 'play6' }, { scale: 0.8, parent: player });
                                            } else {
                                                AIO.animation.playSpine({ name:'effect_shoujidonghua', action: 'play5' }, { scale: 0.8, parent: player });
                                            }
                                            break;
                                        case 'fire':
                                            if (popupNum <= -2) {
                                                AIO.animation.playSpine({ name:'effect_shoujidonghua', action: 'play4' }, { scale: 0.8, parent: player });
                                            } else {
                                                AIO.animation.playSpine({ name:'effect_shoujidonghua', action: 'play3' }, { scale: 0.8, parent: player });
                                            }
                                            break;
                                        case 'water':
                                            break;
                                        default:
                                            if (popupNum <= -2) {
                                                AIO.animation.playSpine({ name:'effect_shoujidonghua', action: 'play2' }, { scale: 0.8, parent: player });
                                            } else {
                                                AIO.animation.playSpine({ name:'effect_shoujidonghua', action: 'play1' }, { scale: 0.8, parent: player });
                                            }
                                            break;
                                    }
                                } else {
                                    if (node.nature == 'wood') {
                                        AIO.animation.playSpine('effect_zhiliao', { scale: 0.7, parent: player });
                                    }
                                }
                            }

                            node.style.animation = 'open-fade-in-out 1.2s';
                            setTimeout(function(player, node){
                                if (!player.popupNodeCache) player.popupNodeCache = [];
                                node.style.animation = '';
                                player.popupNodeCache.push(node);
                            }, 1210, player, node);

                            setTimeout(function(player) {
                                player.damagepopLocked = false;
                                player.$damagepop();
                            }, 500, player);
                        }
                    };
                },

                /**
                 *  插值函数
                 * @param min 最大值
                 * @param max 最小值
                 * @param fraction 比例
                 * @returns {*}
                 */
                lerp: function (min, max, fraction) {
                    return (max - min) * fraction + min;
                },

                get:{},

                set:{},
                create:{},
                animate:{
                    /**
                     *  检查canvas区域是否创建
                     * @returns {boolean}
                     */
                    check:function(){
                        if (!ui.arena) return false;
                        if (this.updates == undefined) this.updates = [];
                        if (this.canvas == undefined) {
                            this.canvas = ui.arena.appendChild(document.createElement('canvas'));
                            this.canvas.id = 'canvas-arena';
                        }
                        return true;
                    },
                    /**
                     * 添加动画到updates中
                     * @param frameFunc 传入函数
                     */
                    add:function(frameFunc){
                        if (typeof frameFunc != 'function') return;
                        if (!this.check()) return;

                        var obj = {
                            inits: [],
                            update: frameFunc,
                            id: decadeUI.getRandom(0, 100), //Fixme id随机
                        };
                        // 将参数传入放入inits
                        if (arguments.length > 2) {
                            obj.inits = new Array(arguments.length - 2);
                            for (var i = 2; i < arguments.length; i++) {
                                obj.inits[i - 2] = arguments[i];
                            }
                        }

                        this.updates.push(obj);
                        if (this.frameId == undefined) this.frameId = requestAnimationFrame(this.update.bind(this));
                    },
                    update:function(){
                        var frameTime = performance.now();
                        var delta = frameTime - (this.frameTime == undefined ? frameTime : this.frameTime);

                        this.frameTime = frameTime;
                        var e = {
                            canvas: this.canvas,
                            context: this.canvas.getContext('2d'),
                            deltaTime: delta,
                            save:function(){
                                this.context.save();
                                return this.context;
                            },
                            restore:function(){
                                this.context.restore();
                                return this.context;
                            },
                            drawLine:function(x1, y1, x2, y2, color, lineWidth){
                                if (x1 == null || y1 == null) throw 'arguments';

                                var context = this.context;
                                context.beginPath();

                                if (color) context.strokeStyle = color;
                                if (lineWidth) context.lineWidth = lineWidth;

                                if (x2 == null || y2 == null) {
                                    context.lineTo(x1, y1);
                                } else {
                                    context.moveTo(x1, y1);
                                    context.lineTo(x2, y2);
                                }

                                context.stroke();
                            },
                            drawRect:function(x, y , width, height, color, lineWidth){
                                if (x == null || y == null || width == null || height == null) throw 'arguments';

                                var ctx = this.context;
                                ctx.beginPath();

                                if (color) ctx.strokeStyle = color;
                                if (lineWidth) ctx.lineWidth = lineWidth;
                                ctx.rect(x, y, width, height);
                                ctx.stroke();
                            },
                            drawText:function(text, font, color, x, y, textAlign, textBaseline, stroke){
                                if (!text) return;
                                if (x == null || y == null) throw 'x or y';
                                var context = this.context;

                                if (font) context.font = font;
                                if (textAlign) context.textAlign = textAlign;
                                if (textBaseline) context.textBaseline = textBaseline;
                                if (color) {
                                    if (!stroke) context.fillStyle = color;
                                    else context.strokeStyle = color;
                                }

                                if (!stroke) context.fillText(text, x, y);
                                else context.strokeText(text, x, y);
                            },
                            drawStrokeText:function(text, font, color, x, y, textAlign, textBaseline){
                                this.drawText(text, font, color, x, y, textAlign, textBaseline, true);
                            },
                            fillRect:function(x, y , width, height, color){
                                if (color) this.context.fillStyle = color;
                                this.context.fillRect(x, y , width, height);
                            },
                        }

                        if (!AIO.dataset.animSizeUpdated) { // Fixme 使用了flag animSizeUpdated
                            AIO.dataset.animSizeUpdated = true;
                            e.canvas.width = e.canvas.parentNode.offsetWidth;
                            e.canvas.height = e.canvas.parentNode.offsetHeight;
                        }

                        e.canvas.height = e.canvas.height;
                        var args;
                        var task;
                        for (var i = 0; i < this.updates.length; i++) {
                            task = this.updates[i];
                            args = Array.from(task.inits);
                            args.push(e);
                            e.save();
                            if (task.update.apply(task, args)) {
                                this.updates.remove(task);i--;
                            }
                            e.restore();
                        }

                        if (this.updates.length == 0) {
                            this.frameId = undefined;
                            this.frameTime = undefined;
                            return;
                        }

                        this.frameId = requestAnimationFrame(this.update.bind(this));
                    },
                },
                // 存放一些flag判断是否更新
                dataset:{
                    animSizeUpdated: false, //动画是否更新
                    bodySizeUpdated: false,
                    bodySize: {
                        height: 1,
                        width: 1,
                        updated: false,
                    },
                },
            };
            AIO.init();
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
                    this.importCss(AssetPath + 'home.css');
                    this.importCss(AssetPath + 'menu.css');
                    // this.importCss(AssetPath + 'layout.css');
                    // this.importCss(AssetPath + 'decadeLayout.css');
                    // this.importCss(AssetPath + 'card.css');
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
                    //     this.importCss(AssetPath + 'home' + parseFloat(['on', 'off', 'othersOn'].indexOf(lib.config.extension_AllInOne_characterStyle) + 1) + '.css');
                    // } else {
                    //     this.importCss(AssetPath + 'home1.css');
                    // }

                    this.importJs(AssetPath + 'spine.js');
                    this.importJs(AssetPath + 'effect.js');
                    this.importJs(AssetPath + 'animation.js');
                    this.importJs(AssetPath + 'dynamicSkin.js');
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
                return importModule.init();
            })({})

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

            homeStyle: {
                name: '主界面样式',
                intro: '修改启动页主界面样式',
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
            homeDynamicBG: {
                name: '主界面动态背景',
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
                init: true,
                onclick: function (value) {
                    game.saveConfig('extension_AIO_indicatorEffect', value);
                    if (window.AIO) AIO.config.indicatorEffect = value;
                },
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
        editable: false
    }
});
