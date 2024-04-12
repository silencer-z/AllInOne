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
			// TODO
			game.menuZoom = 1;
			_status.nopopequip = lib.config.extension_AllInOne_aloneEquip;

			window.AIOcfg = config;
			window.AIO = {
				init: function () {
					this.extensionName = ExtensionName;
					var sensor = AIO.element.create('sensor', document.body);
					sensor.id = 'AIO-body-sensor';
					this.bodySensor = new AIO.ResizeSensor(sensor);
					this.initOverride();
					return this;
				},
				initOverride: function () {
					function override(dest, src) {
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
					function overrides(dest, src) {
						if (!dest._super) dest._super = {};
						for (var key in src) {
							if (dest[key])
								dest._super[key] = dest[key];

							dest[key] = src[key];
						}
					}

					var base = {
						ui: {
							create: {
								cards: ui.create.cards,
								confirm: ui.create.confirm,
								volume: ui.create.volume,
								chat: ui.create.chat,
								menu: ui.create.menu,
								player: ui.create.player,
								selectlist: ui.create.selectlist,
							},

							update: ui.update,
							updatec: ui.updatec,
						},
						get: {
							infoHp: get.infoHp,
							infoMaxHp: get.infoMaxHp,
							objtype: get.objtype,
							skillState: get.skillState,
						},
						game: {
							check: game.check,
							expandSkills: game.expandSkills,
							uncheck: game.uncheck,
							loop: game.loop,
							over: game.over,
							phaseLoop: game.phaseLoop,
							bossPhaseLoop: game.bossPhaseLoop,
							gameDraw: game.gameDraw,
							swapSeat: game.swapSeat,
						},
						lib: {
							element: {
								content: {
									chooseButton: lib.element.content.chooseButton,
									turnOver: lib.element.content.turnOver,
								},

								control: {
									add: lib.element.control.add,
									open: lib.element.control.open,
									close: lib.element.control.close,
								}
							},
						},
					};
					// NOTE EventContent => lib.element.content gameDraw -> effect.gameStart
					//  changeHp -> delay chooseBool,chooseTarget,chooseToDiscard,chooseToRespond,chooseToUse,gameDraw,judge -> showHandTip
					var EventContent = (function (EventContent) {
						EventContent.changeHp = function () {
							game.getGlobalHistory().changeHp.push(event);
							if (num < 0 && player.hujia > 0 && event.getParent().name == 'damage' && !player.hasSkillTag('nohujia')) {
								event.hujia = Math.min(-num, player.hujia);
								event.getParent().hujia = event.hujia;
								event.num += event.hujia;
								game.log(player, '的护甲抵挡了' + get.cnNumber(event.hujia) + '点伤害');
								player.changeHujia(-event.hujia).type = 'damage';
							}
							num = event.num;
							player.hp += num;
							if (isNaN(player.hp)) player.hp = 0;
							if (player.hp > player.maxHp) player.hp = player.maxHp;
							player.update();
							if (event.popup !== false) {
								player.$damagepop(num, 'water');
							}
							if (_status.dying.includes(player) && player.hp > 0) {
								_status.dying.remove(player);
								game.broadcast(function (list) {
										_status.dying = list;
									},
									_status.dying);
								var evt = event.getParent('_save');
								if (evt && evt.finish) evt.finish();
								evt = event.getParent('dying');
								if (evt && evt.finish) evt.finish()
							}
							event.trigger('changeHp');
							AIO.delay(68);
						};
						EventContent.chooseBool = function () {
							"step 0"
							if ((typeof event.isMine == 'function') && event.isMine()) {
								if (event.frequentSkill && !lib.config.autoskilllist.includes(event.frequentSkill)) {
									ui.click.ok();
									return;
								} else if (event.hsskill && _status.prehidden_skills.includes(event.hsskill)) {
									ui.click.cancel();
									return;
								}
								ui.create.confirm('oc');
								if (event.createDialog && !event.dialog) {
									if (Array.isArray(event.createDialog)) {
										event.dialog = ui.create.dialog.apply(this, event.createDialog);
										if (event.dialogselectx) {
											for (var i = 0; i < event.dialog.buttons.length; i++) {
												event.dialog.buttons[i].classList.add('selectedx');
											}
										}
									}
								}
								if (event.dialog) {
									event.dialog.open();
								} else if (event.prompt !== false) {
									var tipText;
									var handTip = event.handTip = AIO.showHandTip(); // MARK
									if (typeof event.prompt == 'function') {
										tipText = event.prompt(event);
									} else if (typeof event.prompt == 'string') {
										tipText = event.prompt;
									}

									if (event.prompt2) {
										if (tipText == null)
											tipText = ''

										handTip.setInformation(event.prompt2);
									}

									if (tipText != undefined) {
										event.dialog = handTip;
										tipText = tipText.replace(/<\/?.+?\/?>/g, '');
										handTip.appendText(tipText)
										handTip.strokeText();
										handTip.show();
									} else {
										handTip.close();
									}
								}
								game.pause();
								game.countChoose();
								event.choosing = true;
							} else if (event.isOnline()) {
								event.send();
							} else {
								event.result = 'ai';
							}
							"step 1"
							if (event.result == 'ai') {
								if (event.ai) {
									event.choice = event.ai(event.getParent(), player);
								}
								event.result = {
									bool: event.choice
								};
							}
							_status.imchoosing = false;
							event.choosing = false;
							if (event.dialog) event.dialog.close();
							event.resume();
						};
						EventContent.chooseTarget = function () {
							"step 0"
							if ((typeof event.isMine == 'function') && event.isMine()) {
								if (event.hsskill && !event.forced && _status.prehidden_skills.includes(event.hsskill)) {
									ui.click.cancel();
									return;
								}
								game.check();
								game.pause();
								if (event.createDialog && !event.dialog && Array.isArray(event.createDialog)) {
									event.dialog = ui.create.dialog.apply(this, event.createDialog);
								}
								else if (event.prompt !== false) {
									var tipText;
									var handTip = event.handTip = AIO.showHandTip(); // MARK
									if (typeof event.prompt == 'function') {
										tipText = event.prompt(event);
									} else if (typeof event.prompt == 'string') {
										tipText = event.prompt;
									} else {
										tipText = '请选择';
										var range = get.select(event.selectTarget);
										if (range[0] == range[1])
											tipText += get.cnNumber(range[0]);
										else if (range[1] == Infinity)
											tipText += '至少' + get.cnNumber(range[0]);
										else
											tipText += get.cnNumber(range[0]) + '至' + get.cnNumber(range[1]);

										tipText += '个目标';
									}

									if (event.prompt2) {
										if (tipText == null)
											tipText = ''

										handTip.setInformation(event.prompt2);
									}

									if (tipText != undefined) {
										event.dialog = handTip;
										tipText = tipText.replace(/<\/?.+?\/?>/g, '');
										handTip.appendText(tipText);
										if (event.promptbar != 'none') {
											var from = get.select(event.selectTarget)[0];
											var to = get.select(event.selectTarget)[1];
											if (!isFinite(to)) {
												to = '∞';
											}
											event.promptbar = handTip.appendText(' ' + from + ' - ' + to);
											event.promptbar.sels = 0;
											event.promptbar.reqs = get.numStr(get.select(event.selectTarget)[1], 'target');
											event.custom.add.target = function () {
												var handTip = _status.event.dialog;
												var promptbar = _status.event.promptbar;
												if (promptbar.sels == ui.selected.cards.length)
													return;

												promptbar.sels = ui.selected.targets.length;
												promptbar.textContent = ' ' + promptbar.sels + ' - ' + promptbar.reqs;
												handTip.strokeText();
											}
										}
										handTip.strokeText();
										handTip.show();
									} else {
										handTip.close();
									}
								}
								else if (get.itemtype(event.dialog) == 'dialog') {
									event.dialog.open();
								}
							} else if (event.isOnline()) {
								event.send();
							} else {
								event.result = 'ai';
							}
							"step 1"
							if (event.result == 'ai') {
								game.check();
								if ((ai.basic.chooseTarget(event.ai) || forced) && (!event.filterOk || event.filterOk())) {
									ui.click.ok();
								} else {
									ui.click.cancel();
								}
							}
							if (event.result.bool && event.animate !== false) {
								for (var i = 0; i < event.result.targets.length; i++) {
									event.result.targets[i].animate('target');
								}
							}
							if (event.dialog) event.dialog.close();
							event.resume();
							"step 2"
							if (event.onresult) {
								event.onresult(event.result);
							}
							if (event.result.bool && event.autodelay && !((typeof event.isMine == 'function') && event.isMine())) {
								if (typeof event.autodelay == 'number') {
									game.delayx(event.autodelay);
								} else {
									game.delayx();
								}
							}
						};
						EventContent.chooseToDiscard = function () {
							"step 0"
							if (event.autochoose()) {
								event.result = {
									bool: true,
									autochoose: true,
									cards: player.getCards(event.position),
									rawcards: player.getCards(event.position),
								}
								for (var i = 0; i < event.result.cards.length; i++) {
									if (!lib.filter.cardDiscardable(event.result.cards[i], player, event)) {
										event.result.cards.splice(i--, 1);
									}
								}
							} else {
								if (game.modeSwapPlayer && !_status.auto && player.isUnderControl()) {
									game.modeSwapPlayer(player);
								}
								event.rangecards = player.getCards(event.position);
								for (var i = 0; i < event.rangecards.length; i++) {
									if (lib.filter.cardDiscardable(event.rangecards[i], player, event)) {
										event.rangecards.splice(i--, 1);
									} else {
										event.rangecards[i].uncheck('chooseToDiscard');
									}
								}
								var range = get.select(event.selectCard);
								if ((typeof event.isMine == 'function') && event.isMine()) {
									game.check();
									if (event.hsskill && !event.forced && _status.prehidden_skills.includes(event.hsskill)) {
										ui.click.cancel();
										return;
									}
									game.pause();
									if (range[1] > 1 && typeof event.selectCard != 'function') {
										event.promptdiscard = ui.create.control('AI代选', function () {
											ai.basic.chooseCard(event.ai);
											if (_status.event.custom.add.card) {
												_status.event.custom.add.card();
											}
											for (var i = 0; i < ui.selected.cards.length; i++) {
												ui.selected.cards[i].updateTransform(true);
											}
										});
									}

									if (Array.isArray(event.dialog)) {
										event.dialog = ui.create.dialog.apply(this, event.dialog);
										event.dialog.open();
										event.dialog.classList.add('noselect');
									} else if (event.prompt !== false) {
										var tipText;
										var handTip = event.handTip = AIO.showHandTip(); // MARK
										if (typeof event.prompt == 'function') {
											tipText = event.prompt(event);
										} else if (typeof event.prompt == 'string') {
											tipText = event.prompt;
										} else {
											tipText = '请弃置';
											if (range[0] == range[1])
												tipText += get.cnNumber(range[0]);
											else if (range[1] == Infinity)
												tipText += '至少' + get.cnNumber(range[0]);
											else
												tipText += get.cnNumber(range[0]) + '至' + get.cnNumber(range[1]);

											tipText += '张';
											if (event.position == 'h' || event.position == undefined)
												tipText += '手';
											if (event.position == 'e')
												tipText += '装备';
											tipText += '牌';
										}

										if (event.prompt2) {
											if (tipText == null)
												tipText = ''

											handTip.setInformation(event.prompt2);
										}

										if (tipText != undefined) {
											event.dialog = handTip;
											tipText = tipText.replace(/<\/?.+?\/?>/g, '');
											handTip.appendText(tipText);
											var from = event.selectCard[0];
											var to = event.selectCard[1];
											if (!isFinite(to)) {
												to = '∞';
											}
											if (Array.isArray(event.selectCard)) {
												event.promptbar = handTip.appendText(' ' + from + ' - ' + to);
												event.promptbar.sels = 0;
												event.promptbar.reqs = get.numStr(event.selectCard[1], 'card');
												event.custom.add.card = function () {
													var handTip = _status.event.dialog;
													var promptbar = _status.event.promptbar;
													if (promptbar.sels == ui.selected.cards.length)
														return;

													promptbar.sels = ui.selected.cards.length;
													promptbar.textContent = ' ' + promptbar.sels + ' - ' + promptbar.reqs;
													handTip.strokeText();
												}
											}

											handTip.strokeText();
											handTip.show();
										} else {
											handTip.close();
										}
									} else if (get.itemtype(event.dialog) == 'dialog') {
										event.dialog.style.display = '';
										event.dialog.open();
									}
								} else if (event.isOnline()) {
									event.send();
								} else {
									event.result = 'ai';
								}
							}
							"step 1"
							if (event.result == 'ai') {
								game.check();
								if ((ai.basic.chooseCard(event.ai) || forced) && (!event.filterOk || event.filterOk())) {
									ui.click.ok();
								} else if (event.skill) {
									var skill = event.skill;
									ui.click.cancel();
									event._aiexclude.add(skill);
									event.redo();
									game.resume();
								} else {
									ui.click.cancel();
								}
							}
							if (event.rangecards) {
								for (var i = 0; i < event.rangecards.length; i++) {
									event.rangecards[i].recheck('chooseToDiscard');
								}
							}
							"step 2"
							event.resume();
							if (event.promptdiscard) {
								event.promptdiscard.close();
							}
							"step 3"
							if (event.result.bool && event.result.cards && event.result.cards.length && !game.online && event.autodelay && !((typeof event.isMine == 'function') && event.isMine())) {
								if (typeof event.autodelay == 'number') {
									game.delayx(event.autodelay);
								} else {
									game.delayx();
								}
							}
							"step 4"
							if (event.logSkill && event.result.bool && !game.online) {
								if (typeof event.logSkill == 'string') {
									player.logSkill(event.logSkill);
								} else if (Array.isArray(event.logSkill)) {
									player.logSkill.apply(player, event.logSkill);
								}
							}
							if (!game.online) {
								if (typeof event.delay == 'boolean') {
									event.done = player.discard(event.result.cards).set('delay', event.delay);
								} else {
									event.done = player.discard(event.result.cards);
								}
								event.done.discarder = player;
							}
							if (event.dialog && event.dialog.close) event.dialog.close();
						};
						EventContent.chooseToRespond = function () {
							"step 0"
							if (event.responded) {
								event.dialog = undefined;
								return;
							}
							var skills = player.getSkills('invisible').concat(lib.skill.global);
							game.expandSkills(skills);
							for (var i = 0; i < skills.length; i++) {
								var info = lib.skill[skills[i]];
								if (info && info.onChooseToRespond) {
									info.onChooseToRespond(event);
								}
							}
							_status.noclearcountdown = true;
							if (!_status.connectMode && lib.config.skip_shan && event.autochoose && event.autochoose()) {
								event.result = {
									bool: false
								};
							} else {
								if (game.modeSwapPlayer && !_status.auto && player.isUnderControl()) {
									game.modeSwapPlayer(player);
								}
								if ((typeof event.isMine == 'function') && event.isMine()) {
									if (event.hsskill && !event.forced && _status.prehidden_skills.includes(event.hsskill)) {
										ui.click.cancel();
										return;
									}
									var ok = game.check();
									if (!ok || !lib.config.auto_confirm) {
										game.pause();
										var tipText;
										var handTip = event.handTip = AIO.showHandTip(); // MARK
										if (event.openskilldialog) {
											tipText = event.openskilldialog;
											event.openskilldialog = undefined;
										} else if (event.prompt !== false) {
											if (typeof event.prompt == 'function') {
												tipText = event.prompt(event);
											} else if (typeof event.prompt == 'string') {
												tipText = event.prompt;
											} else {
												tipText = '请打出' + get.cnNumber(event.selectCard[0]) + '张';
												if (event.source) {
													handTip.appendText(get.translation(event.source), 'player');
													handTip.appendText('使用了');
													handTip.appendText(get.translation(event.getParent().name), 'card');
													tipText = '，' + tipText;
												}

												if (event.filter && event.filter.name) {
													handTip.appendText(tipText);
													handTip.appendText(get.translation(event.filter.name), 'card');
													tipText = '';
												} else {
													tipText += '牌';
												}
											}

											if (event.prompt2) {
												if (tipText == null)
													tipText = ''

												handTip.setInformation(event.prompt2);
											}
										}

										if (tipText != undefined) {
											event.dialog = handTip;
											tipText = tipText.replace(/<\/?.+?\/?>/g, '');
											handTip.appendText(tipText)
											handTip.strokeText();
											handTip.show();
										} else {
											handTip.close();
										}
									}
								} else if (event.isOnline()) {
									event.send();
								} else {
									event.result = 'ai';
								}
							}
							"step 1"
							if (event.result == 'ai') {
								var ok = game.check();
								if (ok) {
									ui.click.ok();
								} else if (ai.basic.chooseCard(event.ai1 || event.ai) || forced) {
									if ((ai.basic.chooseTarget(event.ai2) || forced) && (!event.filterOk || event.filterOk())) {
										ui.click.ok();
										event._aiexcludeclear = true;
									} else {
										if (!event.norestore) {
											if (event.skill) {
												var skill = event.skill;
												ui.click.cancel();
												event._aiexclude.add(skill);
												var info = get.info(skill);
												if (info.sourceSkill) {
													event._aiexclude.add(info.sourceSkill);
												}
											} else {
												get.card(true).aiexclude();
												game.uncheck();
											}
											event.redo();
											game.resume();
										} else {
											ui.click.cancel();
										}
									}
								} else if (event.skill && !event.norestore) {
									var skill = event.skill;
									ui.click.cancel();
									event._aiexclude.add(skill);
									var info = get.info(skill);
									if (info.sourceSkill) {
										event._aiexclude.add(info.sourceSkill);
									}
									event.redo();
									game.resume();
								} else {
									ui.click.cancel();
								}
								if (event.aidelay && event.result && event.result.bool) {
									game.delayx();
								}
							}
							"step 2"
							event.resume();
							if (event.result) {
								if (event.result._sendskill) {
									lib.skill[event.result._sendskill[0]] = event.result._sendskill[1];
								}
								if (event.result.skill) {
									var info = get.info(event.result.skill);
									if (info && info.chooseButton) {
										if (event.dialog && typeof event.dialog == 'object') event.dialog.close();
										var dialog = info.chooseButton.dialog(event, player);
										if (info.chooseButton.chooseControl) {
											var next = player.chooseControl(info.chooseButton.chooseControl(event, player));
											if (dialog.direct) next.direct = true;
											if (dialog.forceDirect) next.forceDirect = true;
											next.dialog = dialog;
											next.set('ai', info.chooseButton.check ||
												function () {
													return 0;
												});
										} else {
											var next = player.chooseButton(dialog);
											if (dialog.direct) next.direct = true;
											if (dialog.forceDirect) next.forceDirect = true;
											next.set('ai', info.chooseButton.check ||
												function () {
													return 1;
												});
											next.set('filterButton', info.chooseButton.filter ||
												function () {
													return true;
												});
											next.set('selectButton', info.chooseButton.select || 1);
										}
										event.buttoned = event.result.skill;
									} else if (info && info.precontent && !game.online) {
										var next = game.createEvent('pre_' + event.result.skill);
										next.setContent(info.precontent);
										next.set('result', event.result);
										next.set('player', player);
									}
								}
							}
							"step 3"
							if (event.buttoned) {
								if (result.bool || result.control && result.control != 'cancel2') {
									var info = get.info(event.buttoned).chooseButton;
									lib.skill[event.buttoned + '_backup'] = info.backup(info.chooseControl ? result : result.links, player);
									lib.skill[event.buttoned + '_backup'].sourceSkill = event.buttoned;
									if (game.online) {
										event._sendskill = [event.buttoned + '_backup', lib.skill[event.buttoned + '_backup']];
									}
									event.backup(event.buttoned + '_backup');
									if (info.prompt) {
										event.openskilldialog = info.prompt(info.chooseControl ? result : result.links, player);
									}
								} else {
									ui.control.animate('nozoom', 100);
									event._aiexclude.add(event.buttoned);
								}
								event.goto(0);
								delete event.buttoned;
							}
							"step 4"
							_status.noclearcountdown = undefined;
							if (event.skillDialog && get.objtype(event.skillDialog) == 'div') {
								event.skillDialog.close();
							}
							if (event.result.bool && !game.online) {
								if (event.result._sendskill) {
									lib.skill[event.result._sendskill[0]] = event.result._sendskill[1];
								}
								var info = get.info(event.result.skill);
								if (event.onresult) {
									event.onresult(event.result);
								}
								if (event.result.skill) {
									if (info.direct && !info.clearTime) {
										_status.noclearcountdown = true;
									}
								}
								if (event.logSkill) {
									if (typeof event.logSkill == 'string') {
										player.logSkill(event.logSkill);
									} else if (Array.isArray(event.logSkill)) {
										player.logSkill.apply(player, event.logSkill);
									}
								}
								if (!event.result.card && event.result.skill) {
									event.result.used = event.result.skill;
									player.useSkill(event.result.skill, event.result.cards, event.result.targets);
								} else {
									if (info && info.prerespond) {
										info.prerespond(event.result, player);
									}
									var next = player.respond(event.result.cards, event.result.card, event.animate, event.result.skill, event.source);
									if (event.result.noanimate) next.animate = false;
									if (event.parent.card && event.parent.type == 'card') {
										next.set('respondTo', [event.parent.player, event.parent.card]);
									}
									if (event.noOrdering) next.noOrdering = true;
								}
							} else if (event._sendskill) {
								event.result._sendskill = event._sendskill;
							}
							if (event.dialog && event.dialog.close) event.dialog.close();
							if (!_status.noclearcountdown) {
								game.stopCountChoose();
							}
						};
						EventContent.chooseToUse = function () {
							"step 0"
							if (event.responded) return;
							if (game.modeSwapPlayer && !_status.auto && player.isUnderControl() && !lib.filter.wuxieSwap(event)) {
								game.modeSwapPlayer(player);
							}
							var skills = player.getSkills('invisible').concat(lib.skill.global);
							game.expandSkills(skills);
							for (var i = 0; i < skills.length; i++) {
								var info = lib.skill[skills[i]];
								if (info && info.onChooseToUse) {
									info.onChooseToUse(event);
								}
							}
							_status.noclearcountdown = true;
							if (event.type == 'phase') {
								if ((typeof event.isMine == 'function') && event.isMine()) {
									event.endButton = ui.create.control('结束回合', 'stayleft',
										function () {
											var evt = _status.event;
											if (evt.name != 'chooseToUse' || evt.type != 'phase') return;
											if (evt.skill) {
												ui.click.cancel();
											}
											ui.click.cancel();
										});
									event.fakeforce = true;
								} else {
									if (event.endButton) {
										event.endButton.close();
										delete event.endButton;
									}
									event.fakeforce = false;
								}
							}
							if (event.player.isUnderControl() && !_status.auto) {
								event.result = {
									bool: false
								}
								return;
							} else if ((typeof event.isMine == 'function') && event.isMine()) {
								if (event.hsskill && !event.forced && _status.prehidden_skills.includes(event.hsskill)) {
									ui.click.cancel();
									return;
								}
								if (event.type == 'wuxie') {
									if (ui.tempnowuxie) {
										var triggerevent = event.getTrigger();
										if (triggerevent && triggerevent.targets && triggerevent.num == triggerevent.targets.length - 1) {
											ui.tempnowuxie.close();
										}
									}
									if (lib.filter.wuxieSwap(event)) {
										event.result = {
											bool: false
										}
										return;
									}
								}
								var ok = game.check();
								if (!ok || !lib.config.auto_confirm) {
									game.pause();
									if (lib.config.enable_vibrate && player._noVibrate) {
										delete player._noVibrate;
										game.vibrate();
									}
								}
								if (!ok) {
									var tipText;
									var handTip = event.handTip = AIO.showHandTip(); // MARK
									if (event.openskilldialog) {
										tipText = event.openskilldialog;
										event.openskilldialog = undefined;
									} else if (event.prompt !== false) {
										if (typeof event.prompt == 'function') {
											tipText = event.prompt(event);
										} else if (typeof event.prompt == 'string') {
											tipText = event.prompt;
										} else {
											if (typeof event.filterCard == 'object') {
												var filter = event.filterCard;
												tipText = '请使用' + get.cnNumber(event.selectCard[0]) + '张'
												if (filter.name) {
													tipText += get.translation(filter.name);
												} else {
													tipText += '牌';
												}
											} else {
												tipText = '请选择一张卡牌';
											}

											if (event.type == 'phase' && (typeof event.isMine == 'function') && event.isMine()) {
												handTip.appendText('出牌阶段', 'phase');
												tipText = '，' + tipText
											}
										}

										if (event.prompt2) {
											if (tipText == null)
												tipText = ''

											handTip.setInformation(event.prompt2);
										}
									}

									if (tipText != undefined) {
										event.dialog = handTip;
										tipText = tipText.replace(/<\/?.+?\/?>/g, '');
										handTip.appendText(tipText);
										handTip.strokeText();
										handTip.show();
									} else {
										handTip.close();
									}
								}
							} else if (event.isOnline()) {
								event.send();
							} else {
								event.result = 'ai';
							}
							"step 1"
							if (event.result == 'ai') {
								var ok = game.check();
								if (ok) {
									ui.click.ok();
								} else if (ai.basic.chooseCard(event.ai1) || forced) {
									if ((ai.basic.chooseTarget(event.ai2) || forced) && (!event.filterOk || event.filterOk())) {
										ui.click.ok();
										event._aiexcludeclear = true;
									} else {
										if (!event.norestore) {
											if (event.skill) {
												var skill = event.skill;
												ui.click.cancel();
												event._aiexclude.add(skill);
												var info = get.info(skill);
												if (info.sourceSkill) {
													event._aiexclude.add(info.sourceSkill);
												}
											} else {
												get.card(true).aiexclude();
												game.uncheck();
											}
											event.redo();
											game.resume();
										} else {
											ui.click.cancel();
										}
									}
								} else if (event.skill && !event.norestore) {
									var skill = event.skill;
									ui.click.cancel();
									event._aiexclude.add(skill);
									var info = get.info(skill);
									if (info.sourceSkill) {
										event._aiexclude.add(info.sourceSkill);
									}
									event.redo();
									game.resume();
								} else {
									ui.click.cancel();
								}
								if (event.aidelay && event.result && event.result.bool) {
									game.delayx();
								}
							}
							"step 2"
							if (event.endButton) {
								event.endButton.close();
								delete event.endButton;
							}
							event.resume();
							if (event.result) {
								if (event.result._sendskill) {
									lib.skill[event.result._sendskill[0]] = event.result._sendskill[1];
								}
								if (event.result.skill) {
									var info = get.info(event.result.skill);
									if (info && info.chooseButton) {
										if (event.dialog && typeof event.dialog == 'object') event.dialog.close();
										var dialog = info.chooseButton.dialog(event, player);
										if (info.chooseButton.chooseControl) {
											var next = player.chooseControl(info.chooseButton.chooseControl(event, player));
											if (dialog.direct) next.direct = true;
											if (dialog.forceDirect) next.forceDirect = true;
											next.dialog = dialog;
											next.set('ai', info.chooseButton.check ||
												function () {
													return 0;
												});
											if (event.id) next._parent_id = event.id;
											next.type = 'chooseToUse_button';
										} else {
											var next = player.chooseButton(dialog);
											if (dialog.direct) next.direct = true;
											if (dialog.forceDirect) next.forceDirect = true;
											next.set('ai', info.chooseButton.check ||
												function () {
													return 1;
												});
											next.set('filterButton', info.chooseButton.filter ||
												function () {
													return true;
												});
											next.set('selectButton', info.chooseButton.select || 1);
											if (event.id) next._parent_id = event.id;
											next.type = 'chooseToUse_button';
										}
										event.buttoned = event.result.skill;
									} else if (info && info.precontent && !game.online && !event.nouse) {
										var next = game.createEvent('pre_' + event.result.skill);
										next.setContent(info.precontent);
										next.set('result', event.result);
										next.set('player', player);
									}
								}
							}
							"step 3"
							if (event.buttoned) {
								if (result.bool || result.control && result.control != 'cancel2') {
									var info = get.info(event.buttoned).chooseButton;
									lib.skill[event.buttoned + '_backup'] = info.backup(info.chooseControl ? result : result.links, player);
									lib.skill[event.buttoned + '_backup'].sourceSkill = event.buttoned;
									if (game.online) {
										event._sendskill = [event.buttoned + '_backup', lib.skill[event.buttoned + '_backup']];
									}
									event.backup(event.buttoned + '_backup');
									if (info.prompt) {
										event.openskilldialog = info.prompt(info.chooseControl ? result : result.links, player);
									}
								} else {
									ui.control.animate('nozoom', 100);
									event._aiexclude.add(event.buttoned);
								}
								event.goto(0);
								delete event.buttoned;
							}
							"step 4"
							if (event._aiexcludeclear) {
								delete event._aiexcludeclear;
								event._aiexclude.length = 0;
							}
							delete _status.noclearcountdown;
							if (event.skillDialog && get.objtype(event.skillDialog) == 'div') {
								event.skillDialog.close();
							}
							if (event.result && event.result.bool && !game.online && !event.nouse) {
								player.useResult(event.result, event);
							} else if (event._sendskill) {
								event.result._sendskill = event._sendskill;
							}
							if (event.dialog && typeof event.dialog == 'object') event.dialog.close();
							if (!_status.noclearcountdown) {
								game.stopCountChoose();
							}
							"step 5"
							if (event._result && event.result) {
								event.result.result = event._result;
							}
						};
						EventContent.gameDraw = function () {
							"step 0"
							if (_status.brawl && _status.brawl.noGameDraw)
								return event.goto(4);

							var end = player;
							var gainNum = num;
							do {
								if (typeof num == 'function')
									gainNum = num(player);

								if (player.getTopCards)
									player.directgain(player.getTopCards(gainNum));
								else
									player.directgain(get.cards(gainNum));

								player.$draw(gainNum);
								if (player.singleHp === true && get.mode() != 'guozhan' && (lib.config.mode != 'doudizhu' || _status.mode != 'online'))
									player.doubleDraw();

								player._start_cards = player.getCards('h');
								player = player.next;
							} while (player != end);
							event.changeCard = get.config('change_card');
							if (_status.connectMode || (lib.config.mode == 'doudizhu' && _status.mode == 'online') || lib.config.mode != 'identity' && lib.config.mode != 'guozhan' && lib.config.mode != 'doudizhu' && lib.config.mode != 'huanhuazhizhan') {
								event.changeCard = 'disabled';
							}
							"step 1"
							if (event.changeCard != 'disabled' && !_status.auto) {
								event.dialog = AIO.showHandTip('是否使用手气卡？'); // MARK
								event.dialog.strokeText();
								ui.create.confirm('oc');
								event.custom.replace.confirm = function (bool) {
									_status.event.bool = bool;
									game.resume();
								}
							} else {
								event.goto(4);
							}
							"step 2"
							if (event.changeCard == 'once') {
								event.changeCard = 'disabled';
							} else if (event.changeCard == 'twice') {
								event.changeCard = 'once';
							} else if (event.changeCard == 'disabled') {
								event.bool = false;
								return;
							}
							_status.imchoosing = true;
							event.switchToAuto = function () {
								_status.event.bool = false;
								game.resume();
							}
							game.pause();
							"step 3"
							_status.imchoosing = false;
							if (event.bool) {
								if (game.changeCoin) {
									game.changeCoin(- 3);
								}
								var hs = game.me.getCards('h');
								game.addVideo('lose', game.me, [get.cardsInfo(hs), [], [], []]);
								for (var i = 0; i < hs.length; i++) {
									hs[i].discard(false);
								}
								game.me.directgain(get.cards(hs.length));
								event.goto(2);
							} else {
								if (event.dialog) event.dialog.close();
								if (ui.confirm) ui.confirm.close();
								game.me._start_cards = game.me.getCards('h');
								event.goto(4);
							}
							"step 4"
							setTimeout(AIO.effect.gameStart, 51);
						};
						EventContent.judge = function () {
							"step 0"
							var judgestr = get.translation(player) + '的' + event.judgestr + '判定';
							event.videoId = lib.status.videoId++;
							var cardj = event.directresult;
							if (!cardj) {
								if (player.getTopCards) cardj = player.getTopCards()[0];
								else cardj = get.cards()[0];
							}
							var owner = get.owner(cardj);
							if (owner) {
								owner.lose(cardj, 'visible', ui.ordering);
							} else {
								var nextj = game.cardsGotoOrdering(cardj);
								if (event.position != ui.discardPile) nextj.noOrdering = true;
							}
							player.judging.unshift(cardj);
							game.addVideo('judge1', player, [get.cardInfo(player.judging[0]), judgestr, event.videoId]);
							game.broadcastAll(function (player, card, str, id, cardid) {
								var event = game.online ? {} : _status.event;
								if (game.chess)
									event.node = card.copy('thrown', 'center', ui.arena).animate('start');
								else
									event.node = player.$throwordered2(card.copy(), true);

								if (lib.cardOL) lib.cardOL[cardid] = event.node;
								event.node.cardid = cardid;
								if (!window.AIO) { //MARK
									ui.arena.classList.add('thrownhighlight');
									event.node.classList.add('thrownhighlight');
									event.dialog = ui.create.dialog(str);
									event.dialog.classList.add('center');
								} else {
									event.dialog = AIO.showHandTip(str);// MARK
									event.dialog.strokeText();
									if (game.online)
										ui.dialogs.push(event.dialog);
								}

								event.dialog.videoId = id;
							}, player, player.judging[0], judgestr, event.videoId, get.id());

							game.log(player, '进行' + event.judgestr + '判定，亮出的判定牌为', player.judging[0]);
							game.delay(2);
							if (!event.noJudgeTrigger)
								event.trigger('judge');
							"step 1"
							event.result = {
								card: player.judging[0],
								name: player.judging[0].name,
								number: get.number(player.judging[0]),
								suit: get.suit(player.judging[0]),
								color: get.color(player.judging[0]),
								node: event.node,
							};
							if (event.fixedResult) {
								for (var i in event.fixedResult) {
									event.result[i] = event.fixedResult[i];
								}
							}
							event.result.judge = event.judge(event.result);
							if (event.result.judge > 0) event.result.bool = true;
							else if (event.result.judge < 0) event.result.bool = false;
							else event.result.bool = null;
							player.judging.shift();
							game.checkMod(player, event.result, 'judge', player);
							if (event.judge2) {
								var judge2 = event.judge2(event.result);
								if (typeof judge2 == 'boolean') player.tryJudgeAnimate(judge2);
							};
							if (event.clearArena != false) {
								game.broadcastAll(ui.clear);
							}

							event.dialog.close();
							game.broadcast(function (id) {
								var dialog = get.idDialog(id);
								if (dialog)
									dialog.close();

								if (!window.AIO)
									ui.arena.classList.remove('thrownhighlight');
							}, event.videoId);

							game.addVideo('judge2', null, event.videoId);
							game.log(player, '的判定结果为', event.result.card);
							event.triggerMessage('judgeresult');
							event.trigger('judgeFixing');
							if (event.callback) {
								var next = game.createEvent('judgeCallback', false);
								next.player = player;
								next.card = event.result.card;
								next.judgeResult = get.copy(event.result);
								next.setContent(event.callback);
							} else {
								if (!get.owner(event.result.card)) {
									if (event.position != ui.discardPile)
										event.position.appendChild(event.result.card);
								}
							}
						};
						EventContent.turnOver = function () {
							game.log(player, '翻面');
							player.classList.toggle('turnedover');
							game.broadcast(function (player) {
								player.classList.toggle('turnedover');
							}, player);
							game.addVideo('turnOver', player, player.classList.contains('turnedover'));
							player.queueCssAnimation('turned-over 0.5s linear');
						};
						return EventContent;
					})({});
					// NOTE Skill => lib.skill
					var Skill = (function (Skill) {
						Skill._save = {
							priority: 5,
							forced: true,
							popup: false,
							filter: function () { return false; },
							content: function () {
								"step 0"
								event.dying = trigger.player;
								if (!event.acted) event.acted = [];
								"step 1"
								if (trigger.player.isDead()) {
									event.finish();
									return;
								}
								event.acted.push(player);
								if (lib.config.tao_enemy && event.dying.side != player.side && lib.config.mode != 'identity' && lib.config.mode != 'guozhan' && !event.dying.hasSkillTag('revertsave')) {
									event._result = {
										bool: false
									}
								} else if (player.canSave(event.dying)) {
									player.chooseToUse({
										filterCard: function (card, player, event) {
											event = event || _status.event;
											return lib.filter.cardSavable(card, player, event.dying);
										},
										dyingPlayer: trigger.player,
										filterTarget: function (card, player, target) {
											if (target != _status.event.dying) return false;
											if (!card) return false;
											var info = get.info(card);
											if (!info.singleCard || ui.selected.targets.length == 0) {
												var mod = game.checkMod(card, player, target, 'unchanged', 'playerEnabled', player);
												if (mod == false) return false;
												var mod = game.checkMod(card, player, target, 'unchanged', 'targetEnabled', target);
												if (mod != 'unchanged') return mod;
											}
											return true;
										},
										prompt: function (event) {
											var handTip = event.handTip;
											var player = event.player;
											var target = event.dyingPlayer;
											if (player != target) {
												handTip.appendText(get.translation(target), 'player');
												handTip.appendText('濒死，需要');
												handTip.appendText((Math.abs(target.hp) + 1), 'number');
												handTip.appendText('个桃，是否对其使用桃？');
											} else {
												handTip.appendText('你当前体力值为');
												handTip.appendText(target.hp, 'number');
												handTip.appendText('，需要');
												handTip.appendText((Math.abs(target.hp) + 1), 'number');
												handTip.appendText('个桃，是否出桃？');
											}

											return '';
										},
										ai1: function (card) {
											if (typeof card == 'string') {
												var info = get.info(card);
												if (info.ai && info.ai.order) {
													if (typeof info.ai.order == 'number') {
														return info.ai.order;
													} else if (typeof info.ai.order == 'function') {
														return info.ai.order();
													}
												}
											}
											return 1;
										},
										ai2: get.effect_use,
										type: 'dying',
										targetRequired: true,
										dying: event.dying
									});
								} else {
									event._result = {
										bool: false
									}
								}
								"step 2"
								if (result.bool) {
									var player = trigger.player;
									if (player.hp <= 0 && !trigger.nodying && !player.nodying && player.isAlive() && !player.isOut() && !player.removed) event.goto(0);
									else trigger.untrigger();
								} else {
									for (var i = 0; i < 20; i++) {
										if (event.acted.includes(event.player.next)) {
											break;
										} else {
											event.player = event.player.next;
											if (!event.player.isOut()) {
												event.goto(1);
												break;
											}
										}
									}
								}
							}
						};
						return Skill;
					})({});
					// NOTE Click => lib.click Click.click -> showHandTip
					var Click = (function (Click) {
						Click.skill = function (skill) {
							var info = get.info(skill);
							var event = _status.event;
							event.backup(skill);
							if (info.filterCard && info.discard != false && info.lose != false && !info.viewAs) {
								var cards = event.player.getCards(event.position);
								for (var i = 0; i < cards.length; i++) {
									if (!lib.filter.cardDiscardable(cards[i], event.player)) {
										cards[i].uncheck('useSkill');
									}
								}
							}
							if (typeof event.skillDialog == 'object') {
								event.skillDialog.close();
							}
							if ((typeof event.isMine == 'function') && event.isMine()) {
								event.skillDialog = true;
							}
							game.uncheck();
							game.check();
							if (event.skillDialog) {
								var title = get.translation(skill);
								var intro;
								if (info.prompt) {
									if (typeof info.prompt == 'function') {
										intro = info.prompt(event);
									} else {
										intro = info.prompt;
									}
								} else if (info.promptfunc) {
									intro = info.promptfunc(event, event.player);
								} else if (lib.dynamicTranslate[skill]) {
									intro = lib.dynamicTranslate[skill](event.player, skill);
								} else if (lib.translate[skill + '_info']) {
									intro = lib.translate[skill + '_info'];
								}

								if (intro != undefined) {
									if (intro.length > 25) {
										event.skillDialog = ui.create.dialog(title, '<div><div style="width:100%">' + intro + '</div></div>');
									} else {
										var handTip = AIO.showHandTip(intro);
										handTip.strokeText();
										event.skillDialog = handTip;
									}
								}
							}
						};
						return Click;
					})({});
					//NOTE Game => game Game.bossPhaseLoop,phaseLoop -> element.create logv -> boundsCaches
					var Game = (function (Game) {
						Game.bossPhaseLoop = function () {
							game.broadcastAll(function (firstAction) {
								var cur;
								for (var i = 0; i < game.players.length; i++) {
									cur = game.players[i];
									if (!cur.node.seat)
										cur.node.seat = AIO.element.create('seat', cur); // MARK element.create

									cur.seat = get.distance(firstAction, cur, 'absolute') + 1;
									cur.node.seat.innerHTML = get.cnNumber(cur.seat, true);
								}
							}, game.boss);

							return this._super.bossPhaseLoop.apply(this, arguments);
						};
						// NOTE 修改player内容
						Game.logv = function (player, card, targets, event, forced, logvid) {
							if (!player) {
								player = _status.event.getParent().logvid;
								if (!player) return;
							}
							const node = ui.create.div('.hidden');
							node.node = {};
							logvid = logvid || get.id();
							game.broadcast((player, card, targets, event, forced, logvid) => game.logv(player, card, targets, event, forced, logvid), player, card, targets, event, forced, logvid);
							if (typeof player == 'string') {
								const childNode = Array.from(ui.historybar.childNodes).find(value => value.logvid == player);
								if (childNode) childNode.added.push(card);
								return;
							}
							if (typeof card == 'string') {
								if (card != 'die') {
									if (lib.skill[card] && lib.skill[card].logv === false && !forced) return;
									if (!lib.translate[card]) return;
								}
								let avatar;
								if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
								else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
								else return;
								node.node.avatar = avatar;
								avatar.style.transform = '';
								avatar.className = 'avatar';
								if (card == 'die') {
									node.dead = true;
									node.player = player;
									const avatar2 = avatar.cloneNode();
									avatar2.className = 'avatarbg grayscale1';
									avatar.appendChild(avatar2);
									avatar.style.opacity = 0.6;
								} else {
									node.node.text = ui.create.div('', get.translation(card, 'skill'), avatar);
									node.node.text.dataset.nature = 'water';
									node.skill = card;
								}
								node.appendChild(avatar);
								if (card == 'die' && targets && targets != player) {
									node.source = targets;
									player = targets;
									if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
									else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
									else if (get.mode() == 'guozhan' && player.node && player.node.name_seat) {
										avatar = ui.create.div('.avatar.cardbg');
										avatar.innerHTML = player.node.name_seat.innerHTML[0];
									} else return;
									avatar.style.transform = '';
									node.node.avatar2 = avatar;
									avatar.classList.add('avatar2');
									node.appendChild(avatar);
								}
							} else if (Array.isArray(card)) {
								node.cards = card[1].slice(0);
								card = card[0];
								const info = [card.suit || '', card.number || '', card.name || '', card.nature || ''];
								if (!Array.isArray(node.cards) || !node.cards.length) {
									node.cards = [ui.create.card(node, 'noclick', true).init(info)];
								}
								if (card.name == 'wuxie') {
									if (ui.historybar.firstChild && ui.historybar.firstChild.type == 'wuxie') {
										ui.historybar.firstChild.players.push(player);
										ui.historybar.firstChild.cards.addArray(node.cards);
										return;
									}
									node.type = 'wuxie';
									node.players = [player];
								}
								if (card.copy) card.copy(node, false);
								else {
									card = ui.create.card(node, 'noclick', true);
									card.init(info);
								}
								let avatar;
								if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
								else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
								else if (get.mode() == 'guozhan' && player.node && player.node.name_seat) {
									avatar = ui.create.div('.avatar.cardbg');
									avatar.innerHTML = player.node.name_seat.innerHTML[0];
								} else return;
								node.node.avatar = avatar;
								avatar.style.transform = '';
								avatar.classList.add('avatar2');
								node.appendChild(avatar);

								if (targets && targets.length == 1 && targets[0] != player && get.itemtype(targets[0]) == 'player') (() => {
									var avatar2;
									var target = targets[0];
									if (!target.isUnseen(0)) {
										avatar2 = target.node.avatar.cloneNode();
									} else if (!player.isUnseen(1)) {
										avatar2 = target.node.avatar2.cloneNode();
									} else if (get.mode() == 'guozhan' && target.node && target.node.name_seat) {
										avatar2 = ui.create.div('.avatar.cardbg');
										avatar2.innerHTML = target.node.name_seat.innerHTML[0];
									} else {
										return;
									}
									node.node.avatar2 = avatar2;
									avatar2.style.transform = '';
									avatar2.classList.add('avatar2');
									avatar2.classList.add('avatar3');
									node.insertBefore(avatar2, avatar);
								})();
							}
							if (targets && targets.length) {
								if (targets.length == 1 && targets[0] == player) {
									node.targets = [];
								} else {
									node.targets = targets;
								}
							}

							const bounds = AIO.boundsCaches.window; // MARK boundsCaches
							bounds.check();
							const fullheight = bounds.height, num = Math.round((fullheight - 8) / 50), margin = (fullheight - 42 * num) / (num + 1);
							node.style.transform = 'scale(0.8)';
							ui.historybar.insertBefore(node, ui.historybar.firstChild);
							ui.refresh(node);
							node.classList.remove('hidden');
							Array.from(ui.historybar.childNodes).forEach((value, index) => {
								if (index < num) {
									value.style.transform = `scale(1) translateY(${margin + index * (42 + margin) - 4}px)`;
									return;
								}
								if (value.removetimeout) return;
								value.style.opacity = 0;
								value.style.transform = `scale(1) translateY(${fullheight}px)`;
								value.removetimeout = setTimeout((current => () => current.remove())(value), 500);
							});
							if (lib.config.touchscreen) node.addEventListener('touchstart', ui.click.intro);
							else {
								// node.addEventListener('mouseenter',ui.click.intro);
								node.addEventListener(lib.config.pop_logv ? 'mousemove' : 'click', ui.click.logv);
								node.addEventListener('mouseleave', ui.click.logvleave);
							}
							node.logvid = logvid;
							node.added = [];
							if (!game.online) {
								event = event || _status.event;
								event.logvid = node.logvid;
							}
							return node;
						}
						Game.phaseLoop = function (player) {
							game.broadcastAll(function (firstAction) {
								var cur;
								for (var i = 0; i < game.players.length; i++) {
									cur = game.players[i];
									if (!cur.node.seat)
										cur.node.seat = AIO.element.create('seat', cur); // MARK element.create

									cur.seat = cur.getSeatNum();
									cur.node.seat.innerHTML = get.cnNumber(cur.seat, true);
								}
							}, player);

							return this._super.phaseLoop.apply(this, arguments);
						};
						Game.swapSeat = function (player1, player2, prompt, behind, noanimate) {
							base.game.swapSeat.apply(this, arguments);
							player1.seat = player1.getSeatNum();
							if (player1.node.seat) player1.node.seat.innerHTML = get.cnNumber(player1.seat, true);
							player2.seat = player2.getSeatNum();
							if (player2.node.seat) player2.node.seat.innerHTML = get.cnNumber(player2.seat, true);
						};
						return Game;
					})({});

					overrides(lib.element.content, EventContent);
					overrides(lib.skill, Skill);
					overrides(ui.click, Click);
					overrides(game, Game);

					var ride = {};
					// NOTE 修改对话框、card，control，player逻辑
					//  ride.lib -> element.create,AIOCfg,AIOLib,isMobile
					ride.lib = {
						element: {
							dialog: {
								open: function () {
									if (this.noopen) return;
									for (var i = 0; i < ui.dialogs.length; i++) {
										if (ui.dialogs[i] == this) {
											this.show();
											this.refocus();
											ui.dialogs.remove(this);
											ui.dialogs.unshift(this);
											ui.update();
											return this;
										}
										if (ui.dialogs[i].static) ui.dialogs[i].unfocus();
										else ui.dialogs[i].hide();
									}
									ui.dialog = this;
									ui.arena.appendChild(this);
									ui.dialogs.unshift(this);
									ui.update();
									if (!this.classList.contains('prompt')) {
										this.style.animation = 'open-dialog 0.5s';
									}

									return this;
								},

								close: function () {
									if (this.intersection) {
										this.intersection.disconnect();
										this.intersection = undefined;
									}

									ui.dialogs.remove(this);
									if (ui.dialogs.length > 0) {
										ui.dialog = ui.dialogs[0];
										ui.dialog.show();
										ui.dialog.refocus();
										ui.update();
									}

									this.delete();
									return this;
								},
							},

							card: {
								updateTransform: function (bool, delay) {
									if (delay) {
										var that = this;
										setTimeout(function () {
											that.updateTransform(that.classList.contains('selected'));
										}, delay);
									} else {
										if (_status.event.player != game.me) return;
										if (this._transform && this.parentNode && this.parentNode.parentNode &&
											this.parentNode.parentNode.parentNode == ui.me && (!_status.mousedown || _status.mouseleft)) {
											if (bool) {
												this.style.transform = this._transform + ' translateY(-' + (AIO.isMobile() ? 10 : 12) + 'px)';
											} else {
												this.style.transform = this._transform || '';
											}
										}
									}
								},
							},

							control: {
								add: function (item) {
									var node = document.createElement('div');
									node.link = item;
									node.innerHTML = get.translation(item);
									node.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', ui.click.control);
									this.appendChild(node);
									this.updateLayout();
								},

								open: function () {
									ui.control.insertBefore(this, _status.createControl || ui.confirm);
									ui.controls.unshift(this);
									return this;
								},

								close: function () {
									this.remove();
									ui.controls.remove(this);
									if (ui.confirm == this) ui.confirm = null;
									if (ui.skills == this) ui.skills = null;
									if (ui.skills2 == this) ui.skills2 = null;
									if (ui.skills3 == this) ui.skills3 = null;
								},

								replace: function () {
									var items;
									var index = 0;
									var nodes = this.childNodes;

									if (Array.isArray(arguments[0])) {
										items = arguments[0];
									} else {
										items = arguments;
									}

									this.custom = undefined;

									for (var i = 0; i < items.length; i++) {
										if (typeof items[i] == 'function') {
											this.custom = items[i];
										} else {
											if (index < nodes.length) {
												nodes[i].link = items[i];
												nodes[i].innerHTML = get.translation(items[i]);
											} else {
												this.add(items[i]);
											}

											index++;
										}
									}

									while (index < nodes.length) {
										nodes[index].remove();
									}

									this.updateLayout();
									ui.updatec();
									return this;
								},

								updateLayout: function () {
									var nodes = this.childNodes;
									if (nodes.length >= 2) {
										this.classList.add('combo-control');
										for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('control');
									} else {
										this.classList.remove('combo-control');
										if (nodes.length == 1) nodes[0].classList.remove('control');
									}
								},
							},

							player: {
								mark: function (item, info, skill) {
									if (get.itemtype(item) == 'cards') {
										var marks = new Array(item.length);
										for (var i = 0; i < item.length; i++) marks.push(this.mark(item[i], info));
										return marks;
									}

									var mark;
									if (get.itemtype(item) == 'card') {
										mark = item.copy('mark');
										mark.suit = item.suit;
										mark.number = item.number;
										if (item.classList.contains('fullborder')) {
											mark.classList.add('fakejudge');
											mark.classList.add('fakemark'); // MARK element.create
											if (!mark.node.mark) mark.node.mark = mark.querySelector('.mark-text') || AIO.element.create('mark-text', mark);
											mark.node.mark.innerHTML = lib.translate[name.name + '_bg'] || get.translation(name.name)[0];
										}
										item = item.name;
									} else {
										mark = ui.create.div('.card.mark');
										var markText = lib.translate[item + '_bg'];
										if (!markText) {
											markText = get.translation(item).substr(0, 2);
											if (AIO.config.playerMarkStyle != 'decade') { // NOTE AIO.config.playerMarkStyle 读取配置参数，技能标记
												markText = markText[0];
											}
										}
										mark.text = AIO.element.create('mark-text', mark); // MARK element.create
										if (lib.skill[item] && lib.skill[item].markimage) {
											markText = '　';
											mark.text.style.animation = 'none';
											mark.text.setBackgroundImage(lib.skill[item].markimage);
											mark.text.style['box-shadow'] = 'none';
											mark.text.style.backgroundPosition = 'center';
											mark.text.style.backgroundSize = 'contain';
											mark.text.style.backgroundRepeat = 'no-repeat';
											mark.text.classList.add('before-hidden');
										} else {
											if (markText.length == 2) mark.text.classList.add('small-text');
										}
										if (lib.skill[item] && lib.skill[item].zhuanhuanji) {
											mark.text.style.animation = 'none';
											mark.text.classList.add('before-hidden');
										}
										mark.text.innerHTML = markText;
									}

									mark.name = item;
									mark.skill = skill || item;
									if (typeof info == 'object') {
										mark.info = info;
									} else if (typeof info == 'string') {
										mark.markidentifer = info;
									}

									mark.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', ui.click.card);
									if (!lib.config.touchscreen) {
										if (lib.config.hover_all) {
											lib.setHover(mark, ui.click.hoverplayer);
										}
										if (lib.config.right_info) {
											mark.oncontextmenu = ui.click.rightplayer;
										}
									}

									this.node.marks.appendChild(mark);
									this.updateMarks();
									ui.updatem(this);
									return mark;
								},

								/**
								 * @todo Rewrite using Mixin.
								 */
								markCharacter: function (name, info, learn, learn2) {
									if (typeof name == 'object') name = name.name;

									var nodeMark = ui.create.div('.card.mark');
									var nodeMarkText = ui.create.div('.mark-text', nodeMark);

									if (!info) info = {};
									if (!info.name) info.name = get.translation(name);
									if (!info.content) info.content = get.skillintro(name, learn, learn2);

									if (name.startsWith('unknown')) {
										nodeMarkText.innerHTML = get.translation(name)[0];
									} else {
										if (!lib.character[name]) return console.error(name);
										var text = info.name.substr(0, 2);
										if (text.length == 2) nodeMarkText.classList.add('small-text');
										nodeMarkText.innerHTML = text;
									}

									nodeMark.name = name + '_charactermark';
									nodeMark.info = info;
									nodeMark.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', ui.click.card);
									if (!lib.config.touchscreen) {
										if (lib.config.hover_all) {
											lib.setHover(nodeMark, ui.click.hoverplayer);
										}
										if (lib.config.right_info) {
											nodeMark.oncontextmenu = ui.click.rightplayer;
										}
									}

									this.node.marks.appendChild(nodeMark);
									ui.updatem(this);
									return nodeMark;
								},
								markSkillCharacter: function (id, target, name, content) {
									if (typeof target == 'object') target = target.name;
									game.broadcastAll(function (player, target, name, content, id) {
										if (player.marks[id]) {
											player.marks[id].name = name + '_charactermark';
											player.marks[id].info = {
												name: name,
												content: content,
												id: id
											};
											player.marks[id].setBackground(target, 'character');
											game.addVideo('changeMarkCharacter', player, {
												id: id,
												name: name,
												content: content,
												target: target
											});
										} else {
											player.marks[id] = player.markCharacter(target, {
												name: name,
												content: content,
												id: id
											});
											game.addVideo('markCharacter', player, {
												name: name,
												content: content,
												id: id,
												target: target
											});
										}
										player.marks[id]._name = target;
										player.marks[id].style.setProperty('background-size', 'cover', 'important');
									}, this, target, name, content, id);
									return this;
								},

								playDynamic: function (animation, deputy) {
									deputy = deputy === true;
									if (animation == undefined) return console.error('playDynamic: 参数1不能为空');
									var dynamic = this.dynamic;
									if (!dynamic) {
										dynamic = new AIOlib.DynamicPlayer('assets/dynamic/'); // MARK AIOlib.DynamicPlayer 创建动皮
										dynamic.dprAdaptive = true;
										this.dynamic = dynamic;
										this.$dynamicWrap.appendChild(dynamic.canvas);
									} else {
										if (deputy && dynamic.deputy) {
											dynamic.stop(dynamic.deputy);
											dynamic.deputy = null;
										} else if (!deputy && dynamic.primary) {
											dynamic.stop(dynamic.primary);
											dynamic.primary = null;
										}
									}

									if (typeof animation == 'string') animation = { name: animation };
									if (this.doubleAvatar) {
										if (Array.isArray(animation.x)) {
											animation.x = animation.x.concat();
											animation.x[1] += deputy ? 0.25 : -0.25;
										} else {
											if (animation.x == undefined) {
												animation.x = [0, deputy ? 0.75 : 0.25];
											} else {
												animation.x = [animation.x, deputy ? 0.25 : -0.25];
											}
										}

										animation.clip = {
											x: [0, deputy ? 0.5 : 0],
											y: 0,
											width: [0, 0.5],
											height: [0, 1],
											clipParent: true
										};
									}

									if (this.$dynamicWrap.parentNode != this) this.appendChild(this.$dynamicWrap);

									dynamic.outcropMask = AIOcfg.dynamicSkinOutcrop; // MARK AIOcfg.dynamicSkinOutcrop 读参动皮出框
									var avatar = dynamic.play(animation);
									if (deputy === true) {
										dynamic.deputy = avatar;
									} else {
										dynamic.primary = avatar;
									}

									this.classList.add(deputy ? 'd-skin2' : 'd-skin');
								},

								stopDynamic: function (primary, deputy) {
									var dynamic = this.dynamic;
									if (!dynamic) return;

									primary = primary === true;
									deputy = deputy === true;

									if (primary && dynamic.primary) {
										dynamic.stop(dynamic.primary);
										dynamic.primary = null;
									} else if (deputy && dynamic.deputy) {
										dynamic.stop(dynamic.deputy);
										dynamic.deputy = null;
									} else if (!primary && !deputy) {
										dynamic.stopAll();
										dynamic.primary = null;
										dynamic.deputy = null;
									}

									if (!dynamic.primary && !dynamic.deputy) {
										this.classList.remove('d-skin');
										this.classList.remove('d-skin2');
										this.$dynamicWrap.remove();
									}
								},

								say: function (str) {
									str = str.replace(/##assetURL##/g, lib.assetURL);

									if (!this.$chatBubble) {
										this.$chatBubble = AIO.element.create('chat-bubble'); // MARK element.create
									}

									var bubble = this.$chatBubble;
									bubble.innerHTML = str;
									if (this != bubble.parentNode) this.appendChild(bubble);
									bubble.classList.remove('removing');
									bubble.style.animation = 'fade-in 0.3s';

									if (bubble.timeout) clearTimeout(bubble.timeout)
									bubble.timeout = setTimeout(function (bubble) {
										bubble.timeout = undefined;
										bubble.delete();
									}, 2000, bubble);

									var name = get.translation(this.name);
									var info = [name ? (name + '[' + this.nickname + ']') : this.nickname, str];
									lib.chatHistory.push(info);
									if (_status.addChatEntry) {
										if (_status.addChatEntry._origin.parentNode) {
											_status.addChatEntry(info, false);
										} else {
											_status.addChatEntry = undefined;
										}
									}
									if (lib.config.background_speak && lib.quickVoice.indexOf(str) != -1) {
										game.playAudio('voice', (this.sex == 'female' ? 'female' : 'male'), lib.quickVoice.indexOf(str));
									}
								},

								updateMark: function (name, storage) {
									if (!this.marks[name]) {
										if (lib.skill[name] && lib.skill[name].intro && (this.storage[name] || lib.skill[name].intro.markcount)) {
											this.markSkill(name);
											if (!this.marks[name]) return this;
										} else {
											return this;
										}
									}
									var mark = this.marks[name];
									if (storage && this.storage[name]) this.syncStorage(name);
									if (name == 'ghujia' || (lib.skill[name] && lib.skill[name].intro && !lib.skill[name].intro.nocount && (this.storage[name] || lib.skill[name].intro.markcount))) {
										var num = 0;
										if (typeof lib.skill[name].intro.markcount == 'function') {
											num = lib.skill[name].intro.markcount(this.storage[name], this);
										} else if (lib.skill[name].intro.markcount == 'expansion') {
											num = this.countCards('x', (card) => card.hasGaintag(name));
										} else if (typeof this.storage[name + '_markcount'] == 'number') {
											num = this.storage[name + '_markcount'];
										} else if (name == 'ghujia') {
											num = this.hujia;
										} else if (typeof this.storage[name] == 'number') {
											num = this.storage[name];
										} else if (Array.isArray(this.storage[name])) {
											num = this.storage[name].length;
										}

										if (num) {
											if (!mark.markcount) mark.markcount = AIO.element.create('mark-count', mark); // MARK element.create
											mark.markcount.textContent = num;
										} else if (mark.markcount) {
											mark.markcount.delete();
											mark.markcount = undefined;
										}
									} else {
										if (mark.markcount) {
											mark.markcount.delete();
											mark.markcount = undefined;
										}

										if (lib.skill[name].mark == 'auto') {
											this.unmarkSkill(name);
										}
									}

									return this;
								}
							},

						}
					};
					// NOTE 修改界面布局
					//  ride.ui -> isMobile,queueNextFrameTick,layoutHand,get.bodySize,element.create
					ride.ui = {
						updatec: function () {
							var controls = ui.control.childNodes;
							var stayleft;
							var offsetLeft;
							for (var i = 0; i < controls.length; i++) {
								if (!stayleft && controls[i].stayleft) {
									stayleft = controls[i];
								} else if (!offsetLeft) {
									offsetLeft = controls[i].offsetLeft;
								}

								if (stayleft && offsetLeft) break;
							}

							if (stayleft) {
								if (ui.$stayleft != stayleft) {
									stayleft._width = stayleft.offsetWidth
									ui.$stayleft = stayleft;
								}

								if (offsetLeft < stayleft._width) {
									stayleft.style.position = 'static';
								} else {
									stayleft.style.position = 'absolute';
								}
							}
						},

						updatehl: function () {
							AIO.queueNextFrameTick(AIO.layoutHand, AIO); // MARK queueNextFrameTick,layoutHand
						},

						updatej: function (player) {
							if (!player) return;

							var judges = player.node.judges.childNodes;
							for (var i = 0; i < judges.length; i++) {
								if (judges[i].classList.contains('removing'))
									continue;

								judges[i].classList.remove('drawinghidden');
								if (_status.connectMode) {
									if (judges[i].viewAs) {
										judges[i].node.judgeMark.node.judge.innerHTML = get.translation(judges[i].viewAs)[0];
									} else {
										judges[i].node.judgeMark.node.judge.innerHTML = get.translation(judges[i].name)[0];
									}
								}
							}
						},

						updatez: function () {
							window.documentZoom = game.documentZoom;
							document.body.style.zoom = game.documentZoom;
							document.body.style.width = '100%';
							document.body.style.height = '100%';
							document.body.style.transform = '';
						},

						update: function () {
							for (var i = 0; i < ui.updates.length; i++) ui.updates[i]();
							if (ui.dialog == undefined || ui.dialog.classList.contains('noupdate')) return;
							if (game.chess) return base.ui.update();

							if ((!ui.dialog.buttons || !ui.dialog.buttons.length) && !ui.dialog.forcebutton && ui.dialog.classList.contains('fullheight') == false && get.mode() != 'stone') {
								ui.dialog.classList.add('prompt');
							} else {
								ui.dialog.classList.remove('prompt');
								var height = ui.dialog.content.offsetHeight;
								if (AIO.isMobile()) // MARK isMobile get.bodySize
									height = AIO.get.bodySize().height * 0.75 - 80;
								else
									height = AIO.get.bodySize().height * 0.45;

								ui.dialog.style.height = Math.min(height, ui.dialog.content.offsetHeight) + 'px';
							}

							if (!ui.dialog.forcebutton && !ui.dialog._scrollset) {
								ui.dialog.classList.remove('scroll1');
								ui.dialog.classList.remove('scroll2');
							} else {
								ui.dialog.classList.add('scroll1');
								ui.dialog.classList.add('scroll2');
							}
						},

						create: {
							cardTempName: (card, applyNode) => {
								const getApplyNode = applyNode || card;
								const cardName = get.name(card);
								const cardNature = get.nature(card);
								const cardNumber = get.number(card);
								const cardSuit = get.suit(card);
								const node = getApplyNode._tempName || ui.create.div('.temp-name', getApplyNode);
								getApplyNode._tempName = node;
								let tempname = '';
								if (card.suit != cardSuit) {
									if (cardSuit == 'none') {
										node.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
										node.style.color = 'white';
									}
									const span = document.createElement('span');
									for (const color in lib.color) {
										if (!lib.color[color].includes(cardSuit)) continue;
										span.style.color = color == 'none' ? 'white' : color;
										break;
									}
									span.textContent = get.translation(cardSuit);
									tempname += span.outerHTML;
								}
								if (card.number != cardNumber) {
									const b = document.createElement('b');
									let arr = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
									if(typeof cardNumber == 'number'){
										b.textContent = arr[cardNumber-1];
									}else{
										b.textContent = cardNumber;
									}
									tempname += b.outerHTML;
								}
								if (card.name != cardName || !get.is.sameNature(card.nature, cardNature, true)) {
									if (cardNature) {
										node.dataset.nature = cardNature;
										if (cardName == 'sha') tempname += get.translation(cardNature);
									}
									tempname += get.translation(cardName);
								}

								node.innerHTML = tempname;
								node.tempname = tempname;
								return node;
							},
							rarity: function (button) {
								var rarity = game.getRarity(button.link);
								var intro = button.node.intro;
								intro.classList.add('showintro');
								intro.classList.add('rarity');
								if (intro.innerText)
									intro.innerText = '';

								intro.style.backgroundImage = 'url("' + AssetPath + 'assets/image/rarity_' + rarity + '.png")'; // NOTE 素材路径
							},

							buttonPresets: {
								character: (item, type, position, noclick, node) => {
									if (node) {
										node.classList.add('button');
										node.classList.add('character');
										node.classList.add('AIO'); // NOTE 命名
										node.style.display = '';
									} else {
										node = ui.create.div('.button.character.AIO', position);
									}
									node._link = item;
									if (_status.noReplaceCharacter && type == 'characterx') type = 'character';
									if (type == 'characterx') {
										if (lib.characterReplace[item] && lib.characterReplace[item].length) item = lib.characterReplace[item].randomGet();
									}
									node.link = item;

									var double = get.is.double(node._link, true);
									var character = AIO.element.create('character', node); // MARK element.create
									if (double) node._changeGroup = true;
									if (type == 'characterx' && lib.characterReplace[node._link] && lib.characterReplace[node._link].length > 1) node._replaceButton = true;
									var func = function (node, item, intersection) {
										if (intersection) {
											node.awaitItem = item;
											intersection.observe(node);
										} else {
											node.setBackground(item, 'character');
										}
										if (node.node) {
											node.node.name.remove();
											node.node.hp.remove();
											node.node.group.remove();
											node.node.intro.remove();
											if (node.node.replaceButton) node.node.replaceButton.remove();
										} //NOTE 角色布局替换
										node.node = { // MARK element.create
											name: AIO.element.create('name', node),
											hp: AIO.element.create('hp', node),
											group: AIO.element.create('identity', node),
											intro: AIO.element.create('intro', node),
										};
										var infoitem = lib.character[item];
										if (!infoitem) {
											for (var itemx in lib.characterPack) {
												if (lib.characterPack[itemx][item]) {
													infoitem = lib.characterPack[itemx][item]; break;
												}
											}
										}
										node.node.name.innerHTML = get.slimName(item); // NOTE 读取配置buttoncharacter_style
										if (lib.config.buttoncharacter_style == 'default' || lib.config.buttoncharacter_style == 'simple') {
											if (lib.config.buttoncharacter_style == 'simple') {
												node.node.group.style.display = 'none';
											}
											node.classList.add('newstyle');
											node.node.name.dataset.nature = get.groupnature(get.bordergroup(infoitem));
											node.node.group.dataset.nature = get.groupnature(get.bordergroup(infoitem), 'raw');
											ui.create.div(node.node.hp);
											var hp = get.infoHp(infoitem[2]), maxHp = get.infoMaxHp(infoitem[2]), hujia = get.infoHujia(infoitem[2]);
											var str = get.numStr(hp);
											if (hp != maxHp) {
												str += '/';
												str += get.numStr(maxHp);
											}
											var textnode = ui.create.div('.text', str, node.node.hp);
											if (infoitem[2] == 0) {
												node.node.hp.hide();
											} else if (get.infoHp(infoitem[2]) <= 3) {
												node.node.hp.dataset.condition = 'mid';
											} else {
												node.node.hp.dataset.condition = 'high';
											}
											if (hujia > 0) {
												ui.create.div(node.node.hp, '.shield');
												ui.create.div('.text', get.numStr(hujia), node.node.hp);
											}
										} else {
											var hp = get.infoHp(infoitem[2]);
											var maxHp = get.infoMaxHp(infoitem[2]);
											var shield = get.infoHujia(infoitem[2]);
											if (maxHp > 14) {
												if (typeof infoitem[2] == 'string') node.node.hp.innerHTML = infoitem[2];
												else node.node.hp.innerHTML = get.numStr(infoitem[2]);
												node.node.hp.classList.add('text');
											} else {
												for (var i = 0; i < maxHp; i++) {
													var next = ui.create.div('', node.node.hp);
													if (i >= hp) next.classList.add('exclude');
												}
												for (var i = 0; i < shield; i++) {
													ui.create.div(node.node.hp, '.shield');
												}
											}
										}
										if (node.node.hp.childNodes.length == 0) {
											node.node.name.style.top = '8px';
										}
										if (node.node.name.querySelectorAll('br').length >= 4) {
											node.node.name.classList.add('long');
											if (lib.config.buttoncharacter_style == 'old') {
												node.addEventListener('mouseenter', ui.click.buttonnameenter);
												node.addEventListener('mouseleave', ui.click.buttonnameleave);
											}
										}
										node.node.intro.innerHTML = lib.config.intro;
										if (!noclick) {
											lib.setIntro(node);
										}
										if (infoitem[1]) {
											if (double) {
												node.node.group.innerHTML = double.reduce((previousValue, currentValue) => `${previousValue}<div data-nature="${get.groupnature(currentValue)}">${get.translation(currentValue)}</div>`, '');
												if (double.length > 4) if (new Set([5, 6, 9]).has(double.length)) node.node.group.style.height = '48px';
												else node.node.group.style.height = '64px';
											} else node.node.group.innerHTML = `<div>${get.translation(infoitem[1])}</div>`;
											node.node.group.style.backgroundColor = get.translation(`${get.bordergroup(infoitem)}Color`);
										} else {
											node.node.group.style.display = 'none';
										}
										if (node._replaceButton) {
											var intro = ui.create.div('.button.replaceButton', node);
											node.node.replaceButton = intro;
											intro.innerHTML = '切换';
											intro._node = node;
											intro.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', function () {
												_status.tempNoButton = true;
												var node = this._node;
												var list = lib.characterReplace[node._link];
												var link = node.link;
												var index = list.indexOf(link);
												if (index == list.length - 1) index = 0;
												else index++;
												link = list[index];
												node.link = link;
												node.refresh(node, link);
												setTimeout(function () {
													delete _status.tempNoButton;
												}, 200);
											});
										}
									};
									node.refresh = func;
									node.refresh(node, item, position ? position.intersection : undefined);

									return node;
								}
							},

							confirm: function (str, func) {
								if (ui.confirm && ui.confirm.str == str) return;

								switch (str) {
									case 'o':
										if (ui.confirm) {
											ui.confirm.replace('ok');
										} else {
											ui.confirm = ui.create.control('ok');
										}
										break;

									case 'oc':
									case 'co':
										if (ui.confirm) {
											ui.confirm.replace('ok', 'cancel');
										} else {
											ui.confirm = ui.create.control('ok', 'cancel');
										}
										break;

									case 'c':
										if (ui.confirm) {
											ui.confirm.replace('cancel');
										} else {
											ui.confirm = ui.create.control('cancel');
										}
										break;

									default:
										if (ui.confirm) {
											ui.confirm.close();
											ui.confirm = undefined;
										}
										break;
								}

								if (ui.confirm) {
									ui.confirm.str = str;
									if (func) {
										ui.confirm.custom = func;
									} else {
										ui.confirm.custom = undefined;
									}
								}
							},

							control: function () {
								var i, controls;
								var nozoom = false;
								if (Array.isArray(arguments[0])) {
									controls = arguments[0];
								} else {
									controls = arguments;
								}

								var control = document.createElement('div');
								control.className = 'control';
								control.style.opacity = 1;
								Object.entries(lib.element.control).forEach(entry => control[entry[0]] = entry[1]);
								for (i = 0; i < controls.length; i++) {
									if (typeof controls[i] == 'function') {
										control.custom = controls[i];
									} else if (controls[i] == 'nozoom') {
										nozoom = true;
									} else if (controls[i] == 'stayleft') {
										control.stayleft = true;
										control.classList.add('stayleft');
									} else {
										control.add(controls[i]);
									}
								}
								ui.controls.unshift(control);
								ui.control.insertBefore(control, _status.createControl || ui.confirm); //NOTE 读取配置touchscreen
								control.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', ui.click.control2);
								return control;
							},

							selectlist: function (list, init, position, onchange) {
								var select = document.createElement('select');
								for (var i = 0; i < list.length; i++) {
									var option = document.createElement('option');
									if (Array.isArray(list[i])) {
										option.value = list[i][0];
										option.innerText = list[i][1];
									} else {
										option.value = list[i];
										option.innerText = list[i];
									}
									if (init == option.value) option.selected = 'selected';
									select.appendChild(option);
								}
								if (position) position.appendChild(select);
								if (onchange) select.onchange = onchange;
								return select;
							},
						},

						click: {
							card: function (e) {
								delete this._waitingfordrag;
								if (_status.dragged) return;
								if (_status.clicked) return;
								if (ui.intro) return;
								_status.clicked = true;
								if (this.parentNode && (this.parentNode.classList.contains('judges') || this.parentNode.classList.contains('dui-marks'))) { // NOTE 命名
									if (!(e && e instanceof MouseEvent)) {
										var rect = this.getBoundingClientRect();
										e = {
											clientX: (rect.left + 10) * game.documentZoom,
											clientY: (rect.top + 10) * game.documentZoom,
										};
									}

									ui.click.touchpop();
									ui.click.intro.call(this, e);
									_status.clicked = false;
									return;
								}
								var custom = _status.event.custom;
								if (custom.replace.card) {
									custom.replace.card(this);
									return;
								}
								if (this.classList.contains('selectable') == false) return;
								if (this.classList.contains('selected')) {
									ui.selected.cards.remove(this);
									if (_status.multitarget || _status.event.complexSelect) {
										game.uncheck();
										game.check();
									} else {
										this.classList.remove('selected');
										this.updateTransform();
									}
								} else {
									ui.selected.cards.add(this);
									this.classList.add('selected');
									this.updateTransform(true);
								}
								if (game.chess && get.config('show_range') && !_status.event.skill && this.classList.contains('selected') && (typeof _status.event.isMine == 'function') && _status.event.isMine() && _status.event.name == 'chooseToUse') {
									var player = _status.event.player;
									var range = get.info(this).range;
									if (range) {
										if (typeof range.attack === 'number') {
											player.createRangeShadow(Math.min(8, player.getAttackRange(true) + range.attack - 1));
										} else if (typeof range.global === 'number') {
											player.createRangeShadow(Math.min(8, player.getGlobalFrom() + range.global));
										}
									}
								}
								if (custom.add.card) {
									custom.add.card();
								}
								game.check();

								if (lib.config.popequip && get.is.phoneLayout() && arguments[0] != 'popequip' && ui.arena && ui.arena.classList.contains('selecting') && this.parentNode.classList.contains('popequip')) {
									var rect = this.getBoundingClientRect();
									ui.click.touchpop();
									ui.click.intro.call(this.parentNode, {
										clientX: rect.left + 18,
										clientY: rect.top + 12
									});
								}
							},
						},
					};
					// NOTE
					//  ride.game -> backgroundAnimation,delay
					ride.game = {
						addOverDialog: function (dialog, result) {
							var sprite = AIO.backgroundAnimation.current;
							if (!(sprite && sprite.name == 'skin_xiaosha_default')) return;

							AIO.backgroundAnimation.canvas.style.zIndex = 7;
							switch (result) {
								case '战斗胜利':
									sprite.scaleTo(1.8, 600);
									sprite.setAction('shengli');
									break;
								case '平局':
								case '战斗失败':
									if (!AIOcfg.rightLayout) sprite.flipX = true;

									sprite.moveTo([0, 0.5], [0, 0.25], 600);
									sprite.scaleTo(2.5, 600);
									sprite.setAction('gongji');
									break;
							}
						},

						expandSkills: function (skills) {
							var expands = [];
							var info;
							for (var i = 0; i < skills.length; i++) {
								info = get.info(skills[i]);
								if (info) {
									if (info.group) {
										expands.add(info.group);
									}
								} else {
									console.log(skills[i]);
								}
							}

							var i, j;
							for (i = 0; i < expands.length; i++) {
								if (Array.isArray(expands[i])) {
									for (j = 0; j < expands[i].length; j++) {
										skills.add(expands[i][j]);
									}
								} else {
									skills.add(expands[i]);
								}
							}
							return skills;
						},

						gameDraw: function () {
							AIO.delay(100);
							return base.game.gameDraw.apply(game, arguments);
						},
					};
					override(lib, ride.lib);
					override(ui, ride.ui);
					override(game, ride.game);

					// NOTE 将AIOLib扩展到AIO中，并执行importModule.modules中的每个函数并传参
					AIO.get.extend(AIO, AIOlib);
					if (importModule.modules)
						for (var i = 0; i < importModule.modules.length; i++)
							importModule.modules[i](lib, game, ui, get, ai, _status);
					// 将本体中的参数单独命名
					var getNodeIntro = get.nodeintro;
					var gameUncheckFunction = game.uncheck;
					var baseChooseCharacter = game.chooseCharacter;
					var createMenuFunction = ui.create.menu;
					// 改写了原本的updatejm
					ui.updatejm = function (player, nodes, start, inv) {
						if (typeof start != 'number') start = 0;

						for (var i = 0; i < nodes.childElementCount; i++) {
							var node = nodes.childNodes[i];
							if (i < start) {
								node.style.transform = '';
							} else if (node.classList.contains('removing')) {
								start++;
							} else {
								node.classList.remove('drawinghidden');
							}
						}
					};
					// 把updatex放入节流阀中
					ui.updatexr = AIOlib.throttle(ui.updatex, 100, ui);
					document.body.onresize = ui.updatexr;
					// 改写infoHp，infoMaxHp考虑无限血的情况
					get.infoHp = function (hp) {
						if (typeof hp == 'number') return hp;
						else if (typeof hp == 'string') {
							var index = hp.indexOf('/');
							if (index >= 0) hp = hp.slice(0, hp.indexOf('/'));
							if (hp == 'Infinity' || hp == '∞') {
								return Infinity;
							} else {
								return parseInt(hp);
							}
						}
						return 0;
					};
					get.infoMaxHp = function (hp) {
						if (typeof hp == 'number') {
							return hp;
						} else if (typeof hp == 'string') {
							var index = hp.indexOf('/');
							if (index >= 0) hp = hp.slice(hp.indexOf('/') + 1);
							if (hp == 'Infinity' || hp == '∞') {
								return Infinity;
							} else {
								return parseInt(hp);
							}
						}

						return 0;
					};
					get.skillState = function (player) {
						var skills = base.get.skillState.apply(this, arguments);
						if (game.me != player) {
							var global = skills.global = skills.global.concat();
							for (var i = global.length - 1; i >= 0; i--) {
								if (global[i].indexOf('AIO') >= 0) global.splice(i, 1);
							}
						}
						return skills;
					};
					//game.check修改
					//添加target的un-selectable classList显示
					lib.hooks['checkTarget'].push((target, event) => {
						const list = ['selected', 'selectable'];
						target.classList[list.some(select => target.classList.contains(select)) ? 'remove' : 'add']('un-selectable');
					});
					//对十周年UI和本体的视为卡牌样式的同时适配
					lib.hooks['checkCard'][0] = function updateTempname(card, event) {
						if (lib.config.cardtempname != 'off') {
							var cardname = get.name(card);
							var cardsuit = get.suit(card);
							var cardnumber = get.number(card);
							if ((card.name != cardname) || !get.is.sameNature(get.nature(card), card.nature, true) || (card.suit != cardsuit) || (card.number != cardnumber)) ui.create.cardTempName(card);
						}
					};
					//game.uncheck修改
					//对十周年UI和本体的视为卡牌样式的同时适配
					lib.hooks['uncheckCard'][0] = function removeTempname(card, event) {
						if (card._tempName) {
							card._tempName.delete();
							delete card._tempName;
						}
					};
					//移除target的un-selectable classList显示
					lib.hooks['uncheckTarget'].push((target, event) => {
						target.classList.remove('un-selectable');
					});
					var gameLinexyFunction = game.linexy;
					var swapPlayerFunction = game.swapPlayer;
					var swapControlFunction = game.swapControl;
					// NOTE 读取配置修改指示线 linexy -> effect
					game.linexy = function (path) {
						if (!AIO.config.playerLineEffect) return gameLinexyFunction.apply(this, arguments);
						AIO.effect.line(path);
					};
					game.swapPlayer = function (player, player2) {
						var result = swapPlayerFunction.call(this, player, player2);
						if (game.me && game.me != ui.equipSolts.me) {
							ui.equipSolts.me.appendChild(ui.equipSolts.equips);
							ui.equipSolts.me = game.me;
							ui.equipSolts.equips = game.me.node.equips;
							ui.equipSolts.appendChild(game.me.node.equips);
						}
						return result;
					};
					game.swapControl = function (player) {
						var result = swapControlFunction.call(this, player);
						if (game.me && game.me != ui.equipSolts.me) {
							ui.equipSolts.me.appendChild(ui.equipSolts.equips);
							ui.equipSolts.me = game.me;
							ui.equipSolts.equips = game.me.node.equips;
							ui.equipSolts.appendChild(game.me.node.equips);
						}
						return result;
					};

					var createPauseFunction = ui.create.pause;
					var createArenaFunction = ui.create.arena;
					// NOTE clear->layout.clearout
					ui.clear = function () {
						game.addVideo('uiClear');
						var nodes = document.getElementsByClassName('thrown');
						for (var i = nodes.length - 1; i >= 0; i--) {
							if (nodes[i].fixed)
								continue;

							if (nodes[i].classList.contains('card')) {
								AIO.layout.clearout(nodes[i]); // MARK layout.clearout
							} else {
								nodes[i].delete();
							}
						}
					};

					ui.click.intro = function (e) {
						if (this.classList.contains('infohidden') || _status.dragged) return;
						_status.clicked = true;
						if (this.classList.contains('player') && !this.name) return;
						if (this.parentNode == ui.historybar) {
							if (ui.historybar.style.zIndex == '22') {
								if (_status.removePop) {
									if (_status.removePop(this) == false) return;
								} else {
									return;
								}
							}
							ui.historybar.style.zIndex = 22;
						}

						var uiintro = uiintro || get.nodeintro(this, false, e);
						if (!uiintro) return;
						uiintro.classList.add('popped');
						uiintro.classList.add('static');
						ui.window.appendChild(uiintro);
						var layer = ui.create.div('.poplayer', ui.window);
						var clicklayer = function (e) {
							if (_status.touchpopping) return;
							delete _status.removePop;
							uiintro.delete();
							this.remove();
							ui.historybar.style.zIndex = '';
							delete _status.currentlogv;
							if (!ui.arena.classList.contains('menupaused') && !uiintro.noresume) game.resume2();
							if (e && e.stopPropagation) e.stopPropagation();
							if (uiintro._onclose) {
								uiintro._onclose();
							}
							return false;
						};

						layer.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', clicklayer);
						if (!lib.config.touchscreen) layer.oncontextmenu = clicklayer;
						if (this.parentNode == ui.historybar && lib.config.touchscreen) {
							var rect = this.getBoundingClientRect();
							e = {
								clientX: 0,
								clientY: rect.top + 30
							};
						}

						lib.placePoppedDialog(uiintro, e, this);
						if (this.parentNode == ui.historybar) {
							if (lib.config.show_history == 'right') {
								uiintro.style.left = (ui.historybar.offsetLeft - 230) + 'px';
							} else {
								uiintro.style.left = (ui.historybar.offsetLeft + 60) + 'px';
							}
						}

						uiintro.style.zIndex = 21;
						var clickintro = function () {
							if (_status.touchpopping) return;
							delete _status.removePop;
							layer.remove();
							this.delete();
							ui.historybar.style.zIndex = '';
							delete _status.currentlogv;
							if (!ui.arena.classList.contains('menupaused') && !uiintro.noresume) game.resume2();
							if (uiintro._onclose) {
								uiintro._onclose();
							}
						};
						var currentpop = this;
						_status.removePop = function (node) {
							if (node == currentpop) return false;
							layer.remove();
							uiintro.delete();
							_status.removePop = null;
							return true;
						};
						if (uiintro.clickintro) {
							uiintro.listen(function () {
								_status.clicked = true;
							});
							uiintro._clickintro = clicklayer;
						} else if (!lib.config.touchscreen) {
							uiintro.addEventListener('mouseleave', clickintro);
							uiintro.addEventListener('click', clickintro);
						} else if (uiintro.touchclose) {
							uiintro.listen(clickintro);
						}
						uiintro._close = clicklayer;

						game.pause2();
						return uiintro;
					};
					// NOTE click.identity -> element.create,$identityMarkBox,set.activeElement
					ui.click.identity = function (e) {
						if (_status.dragged || !game.getIdentityList || _status.video || this.parentNode.forceShown) return;
						_status.clicked = true;
						var identityList = game.getIdentityList(this.parentNode);
						if (!identityList) return;

						if (lib.config.mark_identity_style == 'click') {
							var getNext = false;
							var theNext;
							var key;
							var current = this.firstChild.innerText;

							for (key in identityList) {
								if (theNext == null || getNext) {
									theNext = key;
									if (getNext) break;
								}

								if (current == identityList[key]) getNext = true;
							}

							this.parentNode.setIdentity(theNext);

						} else {
							if (get.mode() == 'guozhan') {
								identityList = {
									wei: '魏',
									shu: '蜀',
									wu: '吴',
									qun: '群',
									jin: '晋',
									ye: '野',
								};
								if (_status.forceKey) identityList.key = '键';
							}

							if (!AIO.$identityMarkBox) {
								AIO.$identityMarkBox = AIO.element.create('identity-mark-box'); // MARK element.create，$identityMarkBox
								AIO.$identityMarkBox.ondeactive = function () {
									AIO.$identityMarkBox.remove();
									_status.clicked = false;
									if (!ui.arena.classList.contains('menupaused')) game.resume2();
								}
							}

							var index = 0;
							var node;
							var nodes = AIO.$identityMarkBox.childNodes;
							for (key in identityList) {
								node = nodes[index];
								if (!node) {
									node = AIO.element.create('identity-mark-item', AIO.$identityMarkBox);// MARK element.create，$identityMarkBox
									node.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', function () {
										this.player.setIdentity(this.link);
										AIO.$identityMarkBox.remove();
										_status.clicked = false;
									});
								} else {
									node.style.display = '';
								}

								node.link = key;
								node.player = this.parentNode;
								node.innerText = identityList[key];
								index++;
							}

							while (index < nodes.length) {
								nodes[index].style.display = 'none';
								index++;
							}

							game.pause2();
							setTimeout(function (player) {
								player.appendChild(AIO.$identityMarkBox);
								AIO.set.activeElement(AIO.$identityMarkBox);// MARK set.activeElement，$identityMarkBox
							}, 0, this.parentNode);
						}


					};
					// NOTE click.volumn -> component.slider
					ui.click.volumn = function () {
						var setting = ui.create.dialog('hidden');
						setting.listen(function (e) {
							e.stopPropagation();
						});

						var backVolume = AIO.component.slider(0, 8, parseInt(lib.config.volumn_background));// MARK component.slider
						var gameVolume = AIO.component.slider(0, 8, parseInt(lib.config.volumn_audio));

						backVolume.onchange = function () {
							game.saveConfig('volumn_background', backVolume.value);
							ui.backgroundMusic.volume = backVolume.value / 8;
						};

						gameVolume.onchange = function () {
							game.saveConfig('volumn_audio', gameVolume.value);
						};

						setting.add('背景音量');
						setting.content.appendChild(backVolume);
						setting.add('游戏音量');
						setting.content.appendChild(gameVolume);
						setting.add(ui.create.div('.placeholder'));
						return setting;
					};
					ui.create.pause = function () {
						var dialog = createPauseFunction.call(this);
						dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
						return dialog;
					};
					// 移除部分css样式更新config
					ui.create.arena = function () {
						ui.updatez();
						var result = createArenaFunction.apply(this, arguments);
						ui.arena.classList.remove('slim_player');
						ui.arena.classList.remove('uslim_player');
						ui.arena.classList.remove('mslim_player');
						ui.arena.classList.remove('lslim_player');
						ui.arena.classList.remove('oldlayout');
						ui.arena.classList.remove('mobile');
						ui.arena.classList.add('AIO');
						ui.control.id = 'AIO-controls';

						AIO.config.update(); // MARK config
						return result;
					};
					// NOTE 重写了玩家的布局 element.create handler.handMousewheel/.touchScroll bodySensor(ResizeSensor) layout.resize
					ui.create.me = function (hasme) {
						ui.arena.dataset.layout = game.layout;

						ui.mebg = ui.create.div('#mebg', ui.arena);
						ui.me = ui.create.div('.hand-wrap', ui.arena);
						ui.handcards1Container = AIO.element.create('hand-cards', ui.me);
						ui.handcards2Container = ui.create.div('#handcards2');
						ui.arena.classList.remove('nome');
						if (lib.config.mousewheel && !lib.config.touchscreen) {
							ui.handcards1Container.onmousewheel = AIO.handler.handMousewheel;
							ui.handcards2Container.onmousewheel = ui.click.mousewheel;
						}

						var equipSolts = ui.equipSolts = AIO.element.create('equips-wrap');
						equipSolts.back = AIO.element.create('equips-back', equipSolts);

						for (let repetition = 0; repetition < 5; repetition++) {
							AIO.element.create(null, equipSolts.back);
						}

						ui.arena.insertBefore(equipSolts, ui.me);
						AIO.bodySensor.addListener(AIO.layout.resize);
						AIO.layout.resize();

						ui.handcards1Container.ontouchstart = ui.click.touchStart;
						ui.handcards2Container.ontouchstart = ui.click.touchStart;
						ui.handcards1Container.ontouchmove = AIO.handler.touchScroll;
						ui.handcards2Container.ontouchmove = AIO.handler.touchScroll;
						ui.handcards1Container.style.webkitOverflowScrolling = 'touch';
						ui.handcards2Container.style.webkitOverflowScrolling = 'touch';

						if (hasme && game.me) {
							ui.handcards1 = game.me.node.handcards1;
							ui.handcards2 = game.me.node.handcards2;
							ui.handcards1Container.appendChild(ui.handcards1);
							ui.handcards2Container.appendChild(ui.handcards2);
						} else if (game.players.length) {
							game.me = game.players[0];
							ui.handcards1 = game.me.node.handcards1;
							ui.handcards2 = game.me.node.handcards2;
							ui.handcards1Container.appendChild(ui.handcards1);
							ui.handcards2Container.appendChild(ui.handcards2);
						}

						if (game.me) {
							equipSolts.me = game.me;
							equipSolts.equips = game.me.node.equips;
							equipSolts.appendChild(game.me.node.equips);
						}
					};


					var initCssstylesFunction = lib.init.cssstyles;
					lib.init.cssstyles = function () {
						var temp = lib.config.glow_phase;
						lib.config.glow_phase = '';
						initCssstylesFunction.call(this);
						lib.config.glow_phase = temp;
						ui.css.styles.sheet.insertRule('.avatar-name, .avatar-name-default { font-family: "' + (lib.config.name_font || 'xinkai') + '", "xinwei" }', 0);
					};
					lib.init.layout = function (layout, nosave) {
						if (!nosave) game.saveConfig('layout', layout);
						game.layout = layout;

						var relayout = function () {
							ui.arena.dataset.layout = game.layout;
							if (get.is.phoneLayout()) {
								ui.css.phone.href = lib.assetURL + 'layout/default/phone.css';
								ui.arena.classList.add('phone');
							} else {
								ui.css.phone.href = '';
								ui.arena.classList.remove('phone');
							}

							for (var i = 0; i < game.players.length; i++) {
								if (get.is.linked2(game.players[i])) {
									if (game.players[i].classList.contains('linked')) {
										game.players[i].classList.remove('linked');
										game.players[i].classList.add('linked2');
									}
								} else {
									if (game.players[i].classList.contains('linked2')) {
										game.players[i].classList.remove('linked2');
										game.players[i].classList.add('linked');
									}
								}
							}

							ui.updatej();
							ui.updatem();
							setTimeout(function () {
								if (game.me) game.me.update();
								setTimeout(function () {
									ui.updatex();
								}, 500);

								setTimeout(function () {
									ui.updatec();
								}, 1000);
							}, 100);
						};

						setTimeout(relayout, 500);
					};

					lib.element.content.addJudge = function () {
						"step 0";
						const cardName = typeof card == 'string' ? card : card.name , cardInfo = lib.card[cardName];
						if (cards) {
							var owner = get.owner(cards[0]);
							if (owner) {
								event.relatedLose = owner.lose(cards, ui.special).set('getlx', false);
								if (cardInfo && !cardInfo.blankCard) {
									event.relatedLose.set('visible', true);
									event.set('visible', true);
								}
							}
							else if (get.position(cards[0]) == 'c') event.updatePile = true;
						}
						"step 1";
						if (cards[0].willBeDestroyed('judge', player, event)) {
							cards[0].selfDestroy(event);
							event.finish();
							return;
						}
						else if (event.relatedLose) {
							var owner = event.relatedLose.player;
							if (owner.getCards('hejsx').includes(card)) {
								event.finish();
								return;
							}
						}
						cards[0].fix();
						cards[0].style.transform = '';
						cards[0].classList.remove('drawinghidden');
						delete cards[0]._transform;
						var viewAs = typeof card == 'string' ? card : card.name;
						if (!lib.card[viewAs] || (!lib.card[viewAs].effect && !lib.card[viewAs].noEffect) ) {
							game.cardsDiscard(cards[0]);
						}
						else {
							cards[0].style.transform = '';
							cards[0].classList.add('drawinghidden');
							player.node.judges.insertBefore(cards[0], player.node.judges.firstChild);
							if (_status.discarded) {
								_status.discarded.remove(cards[0]);
							}
							ui.updatej(player);
							game.broadcast(function (player, card, viewAs){
								card.fix();
								card.style.transform = '';
								card.classList.add('drawinghidden');
								card.viewAs = viewAs;
								if (viewAs && viewAs != card.name) {
									if (window.AIO) {
										card.classList.add('fakejudge');
										card.node.judgeMark.node.judge.innerHTML = get.translation(viewAs)[0];

									} else if (card.classList.contains('fullskin') || card.classList.contains('fullborder')) {
										card.classList.add('fakejudge');
										card.node.background.innerHTML = lib.translate[viewAs + '_bg'] || get.translation(viewAs)[0];
									}
								} else {
									card.classList.remove('fakejudge');
									if (window.AIO) card.node.judgeMark.node.judge.innerHTML = get.translation(card.name)[0];
								}

								player.node.judges.insertBefore(card, player.node.judges.firstChild);
								ui.updatej(player);
								if (card.clone && (card.clone.parentNode == player.parentNode || card.clone.parentNode == ui.arena)) {
									card.clone.moveDelete(player);
									game.addVideo('gain2', player, get.cardsInfo([card]));
								}
							}, player, cards[0], viewAs);
							if (cards[0].clone && (cards[0].clone.parentNode == player.parentNode || cards[0].clone.parentNode == ui.arena)) {
								cards[0].clone.moveDelete(player);
								game.addVideo('gain2', player, get.cardsInfo(cards));
							}
							// player.$gain2(cards);
							if (get.itemtype(card) != 'card') {
								if (typeof card == 'string') cards[0].viewAs = card;
								else cards[0].viewAs = card.name;
							}
							else {
								delete cards[0].viewAs;
							}
							if (cards[0].viewAs && cards[0].viewAs != cards[0].name) {
								if (cards[0].classList.contains('fullskin') || cards[0].classList.contains('fullborder')) {
									cards[0].classList.add('fakejudge');
									cards[0].node.judgeMark.node.judge.innerHTML = get.translation(cards[0].viewAs)[0];
									//cards[0].node.background.innerHTML = lib.translate[cards[0].viewAs + '_bg'] || get.translation(cards[0].viewAs)[0];
								}
								if(lib.card[viewAs].blankCard){
									game.log(player, '被扣置了<span class="yellowtext">' + get.translation(cards[0].viewAs) + '</span>');
								}
								else {
									game.log(player, '被贴上了<span class="yellowtext">' + get.translation(cards[0].viewAs) + '</span>（', cards, '）');
								}
							}
							else {
								cards[0].classList.remove('fakejudge');
								cards[0].node.judgeMark.node.judge.innerHTML = get.translation(cards[0].name)[0];
								game.log(player, '被贴上了', cards);
							}
							game.addVideo('addJudge', player, [get.cardInfo(cards[0]), cards[0].viewAs]);
						}
						if (event.updatePile) game.updateRoundNumber();
					}
					// MARK delay,create.compareDialog
					lib.element.content.chooseToCompare = function () {
						"step 0"
						if (((!event.fixedResult || !event.fixedResult[player.playerid])
							&& player.countCards('h') == 0) || ((!event.fixedResult || !event.fixedResult[target.playerid])
							&& target.countCards('h') == 0)) {
							event.result = {
								cancelled: true,
								bool: false
							}
							event.finish();
							return;
						}
						game.log(player, '对', target, '发起拼点');
						event.lose_list = [];

						// 更新拼点框
						if (event.parent.name == null || event.parent.name == 'trigger') {
							event.compareName = event.name;
						} else {
							event.compareName = event.parent.name;
						}

						// 有空重写拼点
						game.broadcastAll(function (player, target, eventName) {
							if (!window.AIO) return;
							var dialog = AIO.create.compareDialog(); // MARK create.compareDialog
							dialog.caption = get.translation(eventName) + '拼点';
							dialog.player = player;
							dialog.target = target;
							dialog.open();

							AIO.delay(400); // MARK delay
							ui.dialogs[eventName] = dialog;
						}, player, target, event.compareName);

						"step 1"
						var sendback = function () {
							if (_status.event != event) {
								return function () {
									event.resultOL = _status.event.resultOL;
								};
							}
						};

						if (event.fixedResult && event.fixedResult[player.playerid]) {
							event.card1 = event.fixedResult[player.playerid];
							event.lose_list.push([player, event.card1]);//共同丢失逻辑。
						} else if (player.isOnline()) {
							player.wait(sendback);
							event.ol = true;
							player.send(function (ai) {
								game.me.chooseCard('请选择拼点牌', true).set('prompt', false).set('type', 'compare').ai = ai;
								game.resume();
							}, event.ai);
						} else {
							event.localPlayer = true;
							player.chooseCard('请选择拼点牌', true).set('prompt', false).set('type', 'compare').ai = event.ai;
						}

						if (event.fixedResult && event.fixedResult[target.playerid]) {
							event.card2 = event.fixedResult[target.playerid];
							event.lose_list.push([target, event.card2]);//共同丢失逻辑。
						} else if (target.isOnline()) {
							target.wait(sendback);
							event.ol = true;
							target.send(function (ai) {
									game.me.chooseCard('请选择拼点牌', true).set('prompt', false).set('type', 'compare').ai = ai;
									game.resume();
								},
								event.ai);
						} else {
							event.localTarget = true;
						}

						"step 2"
						if (event.localPlayer) {
							if (result.skill && lib.skill[result.skill] && lib.skill[result.skill].onCompare) {
								result.cards = lib.skill[result.skill].onCompare(player);
								player.logSkill(result.skill);
							} else {
								event.lose_list.push([player, result.cards[0]]);
							}
							event.card1 = result.cards[0];
							// 更新拼点框
							game.broadcastAll(function (eventName) {
								if (!window.AIO) return;

								var dialog = ui.dialogs[eventName];
								dialog.$playerCard.classList.add('infohidden');
								dialog.$playerCard.classList.add('infoflip');
							}, event.compareName);
						}
						if (event.localTarget) {
							target.chooseCard('请选择拼点牌', true).set('prompt', false).set('type', 'compare').ai = event.ai;
						}

						"step 3"
						if (event.localTarget) {
							if (result.skill && lib.skill[result.skill] && lib.skill[result.skill].onCompare) {
								target.logSkill(result.skill);
								result.cards = lib.skill[result.skill].onCompare(target);
							} else {
								event.lose_list.push([target, result.cards[0]]);
							}

							event.card2 = result.cards[0];

							// 更新拼点框
							game.broadcastAll(function (eventName) {
								if (!window.AIO) return;

								var dialog = ui.dialogs[eventName];
								dialog.$targetCard.classList.add('infohidden');
								dialog.$targetCard.classList.add('infoflip');
							}, event.compareName);
						}
						if (!event.resultOL && event.ol) {
							game.pause();
						}

						"step 4"
						try {
							if (!event.card1) {
								if (event.resultOL[player.playerid].skill && lib.skill[event.resultOL[player.playerid].skill] && lib.skill[event.resultOL[player.playerid].skill].onCompare) {
									player.logSkill(event.resultOL[player.playerid].skill);
									event.resultOL[player.playerid].cards = lib.skill[event.resultOL[player.playerid].skill].onCompare(player);
								} else {
									event.lose_list.push([player, event.resultOL[player.playerid].cards[0]]);
								}
								event.card1 = event.resultOL[player.playerid].cards[0];

								// 更新拼点框
								game.broadcastAll(function (eventName) {
									if (!window.AIO) return;

									var dialog = ui.dialogs[eventName];
									dialog.$playerCard.classList.add('infohidden');
									dialog.$playerCard.classList.add('infoflip');
								}, event.compareName);
							};
							if (!event.card2) {
								if (event.resultOL[target.playerid].skill && lib.skill[event.resultOL[target.playerid].skill] && lib.skill[event.resultOL[target.playerid].skill].onCompare) {
									target.logSkill(event.resultOL[target.playerid].skill);
									event.resultOL[target.playerid].cards = lib.skill[event.resultOL[target.playerid].skill].onCompare(player);
								} else {
									event.lose_list.push([target, event.resultOL[target.playerid].cards[0]]);
								}
								event.card2 = event.resultOL[target.playerid].cards[0];
								// 更新拼点框
								game.broadcastAll(function (eventName) {
									if (!window.AIO) return;

									var dialog = ui.dialogs[eventName];
									dialog.$targetCard.classList.add('infohidden');
									dialog.$targetCard.classList.add('infoflip');
								}, event.compareName);
							}
							if (!event.card1 || !event.card2) {
								throw ('err');
							}
						} catch (e) {
							console.log(e);
							game.print(e);
							event.finish();
							return;
						}
						if (event.card2.number >= 10 || event.card2.number <= 4) {
							if (target.countCards('h') > 2) {
								event.addToAI = true;
							}
						}
						if (event.lose_list.length) {
							game.loseAsync({
								lose_list: event.lose_list,
							}).setContent('chooseToCompareLose');
						}
						"step 5"
						event.trigger('compareCardShowBefore');

						"step 6"
						// 更新拼点框
						game.broadcastAll(function (eventName, player, target, playerCard, targetCard) {
							if (!window.AIO) {
								ui.arena.classList.add('thrownhighlight');
								player.$compare(playerCard, target, targetCard);
								return;
							}

							var dialog = ui.dialogs[eventName];
							dialog.playerCard = playerCard.copy();
							dialog.targetCard = targetCard.copy();
						}, event.compareName, player, target, event.card1, event.card2);

						game.log(player, '的拼点牌为', event.card1);
						game.log(target, '的拼点牌为', event.card2);
						var getNum = function (card) {
							for (var i of event.lose_list) {
								if (i[1] == card) return get.number(card, i[0]);
							}
							return get.number(card, false);
						}
						event.num1 = getNum(event.card1);
						event.num2 = getNum(event.card2);
						event.trigger('compare');
						AIO.delay(400); // MARK delay

						"step 7"
						event.result = {
							player: event.card1,
							target: event.card2,
							num1: event.num1,
							num2: event.num2
						}
						var str;
						if (event.num1 > event.num2) {
							event.result.bool = true;
							event.result.winner = player;
							str = get.translation(player) + '拼点成功';
							player.popup('胜');
							target.popup('负');
						} else {
							event.result.bool = false;
							str = get.translation(player) + '拼点失败';
							if (event.num1 == event.num2) {
								event.result.tie = true;
								player.popup('平');
								target.popup('平');
							} else {
								event.result.winner = target;
								player.popup('负');
								target.popup('胜');
							}
						}

						// 更新拼点框
						game.broadcastAll(function (str, eventName, result) {
							if (!window.AIO) {
								var dialog = ui.create.dialog(str);
								dialog.classList.add('center');
								setTimeout(function (dialog) {
									dialog.close();
								}, 1000, dialog);
								return;
							}

							var dialog = ui.dialogs[eventName];
							dialog.$playerCard.dataset.result = result ? '赢' : '没赢';

							setTimeout(function (dialog, eventName) {
								dialog.close();
								setTimeout(function (dialog) {
									dialog.player.$throwordered2(dialog.playerCard, true);
									dialog.target.$throwordered2(dialog.targetCard, true);
								}, 180, dialog);
								ui.dialogs[eventName] = undefined;

							}, 1400, dialog, eventName);

						}, str, event.compareName, event.result.bool);
						AIO.delay(1800); // MARK delay

						"step 8"
						if (typeof event.target.ai.shown == 'number' && event.target.ai.shown <= 0.85 && event.addToAI) {
							event.target.ai.shown += 0.1;
						}
						game.broadcastAll(function () {
							if (!window.AIO) ui.arena.classList.remove('thrownhighlight');
						});
						game.addVideo('thrownhighlight2');
						if (event.clear !== false) {
							game.broadcastAll(ui.clear);
						}
						if (typeof event.preserve == 'function') {
							event.preserve = event.preserve(event.result);
						} else if (event.preserve == 'win') {
							event.preserve = event.result.bool;
						} else if (event.preserve == 'lose') {
							event.preserve = !event.result.bool;
						}
					};
					lib.element.content.chooseToCompareMultiple = function () {
						"step 0"
						event.forceDie = true;
						if (player.countCards('h') == 0) {
							event.result = {
								cancelled: true,
								bool: false
							}
							event.finish();
							return;
						}
						for (var i = 0; i < targets.length; i++) {
							if (targets[i].countCards('h') == 0) {
								event.result = {
									cancelled: true,
									bool: false
								}
								event.finish();
								return;
							}
						}
						if (!event.multitarget) {
							targets.sort(lib.sort.seat);
						}
						game.log(player, '对', targets, '发起拼点');

						// 更新拼点框
						if (event.parent.name == null || event.parent.name == 'trigger') {
							event.compareName = event.name;
						} else {
							event.compareName = event.parent.name;
						}

						// 有空重写拼点
						game.broadcastAll(function (player, target, eventName) {
							if (!window.AIO) return;

							var dialog = AIO.create.compareDialog(); // MARK delay
							dialog.caption = get.translation(eventName) + '拼点';
							dialog.player = player;
							dialog.target = target;
							dialog.open();

							AIO.delay(400);
							ui.dialogs[eventName] = dialog;
						}, player, targets[0], event.compareName);

						"step 1"
						event._result = [];
						event.list = targets.filter(function (current) {
							return !event.fixedResult || !event.fixedResult[current.playerid];
						});

						if (event.list.length || !event.fixedResult || !event.fixedResult[player.playerid]) {
							if (!event.fixedResult || !event.fixedResult[player.playerid]) event.list.unshift(player);
							player.chooseCardOL(event.list, '请选择拼点牌', true).set('type', 'compare').set('ai', event.ai).set('source', player).aiCard = function (target) {
								var hs = target.getCards('h');
								var event = _status.event;
								event.player = target;
								hs.sort(function (a, b) {
									return event.ai(b) - event.ai(a);
								});
								delete event.player;
								return {
									bool: true,
									cards: [hs[0]]
								};
							};
						}

						"step 2"
						var cards = [];
						var lose_list = [];
						event.lose_list = lose_list;
						event.getNum = function (card) {
							for (var i of event.lose_list) {
								if (i[1].contains && i[1].includes(card)) return get.number(card, i[0]);
							}
							return get.number(card, false);
						};
						if (event.fixedResult && event.fixedResult[player.playerid]) {
							event.list.unshift(player);
							result.unshift({
								bool: true,
								cards: [event.fixedResult[player.playerid]]
							});
							lose_list.push([player, [event.fixedResult[player.playerid]]]);
						} else {
							if (result[0].skill && lib.skill[result[0].skill] && lib.skill[result[0].skill].onCompare) {
								player.logSkill(result[0].skill);
								result[0].cards = lib.skill[result[0].skill].onCompare(player)
							} else lose_list.push([player, result[0].cards]);
						};
						for (var j = 0; j < targets.length; j++) {
							if (event.list.includes(targets[j])) {
								var i = event.list.indexOf(targets[j]);
								if (result[i].skill && lib.skill[result[i].skill] && lib.skill[result[i].skill].onCompare) {
									event.list[i].logSkill(result[i].skill);
									result[i].cards = lib.skill[result[i].skill].onCompare(event.list[i]);
								} else lose_list.push([targets[j], result[i].cards]);
								cards.push(result[i].cards[0]);
							} else if (event.fixedResult && event.fixedResult[targets[j].playerid]) {
								cards.push(event.fixedResult[targets[j].playerid]);
								lose_list.push([targets[j], [event.fixedResult[targets[j].playerid]]]);
							}
						}
						if (lose_list.length) {
							game.loseAsync({
								lose_list: lose_list,
							}).setContent('chooseToCompareLose');
						}
						event.cardlist = cards;
						event.cards = cards;
						event.card1 = result[0].cards[0];
						event.num1 = event.getNum(event.card1);
						event.iwhile = 0;
						event.result = {
							player: event.card1,
							targets: event.cardlist.slice(0),
							num1: [],
							num2: [],
						};
						"step 3"
						event.trigger('compareCardShowBefore');
						"step 4"
						game.log(player, '的拼点牌为', event.card1);

						// 更新拼点框
						game.broadcastAll(function (eventName, playerCard) {
							if (!window.AIO) return;

							var dialog = ui.dialogs[eventName];
							dialog.playerCard = playerCard.copy();
						}, event.compareName, event.card1);

						"step 5"
						if (event.iwhile < targets.length) {
							event.target = targets[event.iwhile];
							// event.target.animate('target');
							// player.animate('target');
							event.card2 = event.cardlist[event.iwhile];
							event.num2 = event.getNum(event.card2);
							game.log(event.target, '的拼点牌为', event.card2);
							player.line(event.target);

							// 更新拼点框
							game.broadcastAll(function (eventName, player, target, playerCard, targetCard) {
								if (!window.AIO) {
									player.$compare(playerCard, target, targetCard);
									return;
								}

								var dialog = ui.dialogs[eventName];
								dialog.show();
								dialog.target = target;
								dialog.targetCard = targetCard.copy();
							}, event.compareName, player, event.target, event.card1, event.card2);
							event.trigger('compare');
							AIO.delay(400);
						} else {
							// 更新拼点框
							game.broadcastAll(function (eventName) {
								if (!window.AIO) return;

								var dialog = ui.dialogs[eventName];
								dialog.close();
								setTimeout(function (dialog) {
									dialog.player.$throwordered2(dialog.playerCard, true);
								}, 110, dialog);

							}, event.compareName);
							event.goto(9);
						}
						"step 6"
						event.result.num1[event.iwhile] = event.num1;
						event.result.num2[event.iwhile] = event.num2;

						var str, result;
						if (event.num1 > event.num2) {
							result = true;
							str = get.translation(player) + '拼点成功';
							player.popup('胜');
							target.popup('负');
						} else {
							result = false;
							str = get.translation(player) + '拼点失败';
							if (event.num1 == event.num2) {
								player.popup('平');
								target.popup('平');
							} else {
								player.popup('负');
								target.popup('胜');
							}
						}

						// 更新拼点框
						game.broadcastAll(function (str, eventName, result) {
							if (!window.AIO) {
								var dialog = ui.create.dialog(str);
								dialog.classList.add('center');
								setTimeout(function (dialog) {
									dialog.close();
								}, 1000, dialog);
								return;
							}

							var dialog = ui.dialogs[eventName];
							dialog.$playerCard.dataset.result = result ? '赢' : '没赢';

							setTimeout(function (dialog, eventName) {
								dialog.hide();
								dialog.$playerCard.dataset.result = '';
								setTimeout(function (dialog) {
									dialog.target.$throwordered2(dialog.targetCard, true);
								}, 180, dialog);
							}, 1400, dialog, eventName);

						}, str, event.compareName, result);
						AIO.delay(1800); // MARK delay

						"step 7"
						if (event.callback) {
							game.broadcastAll(function (card1, card2) {
								if (!window.AIO) {
									if (card1.clone) card1.clone.style.opacity = 0.5;
									if (card2.clone) card2.clone.style.opacity = 0.5;
								}
							}, event.card1, event.card2);
							var next = game.createEvent('compareMultiple');
							next.player = player;
							next.target = event.target;
							next.card1 = event.card1;
							next.card2 = event.card2;
							next.num1 = event.num1;
							next.num2 = event.num2;
							next.setContent(event.callback);
							event.compareMultiple = true;
						}

						"step 8"
						event.iwhile++;
						event.goto(5);
						"step 9"
						game.broadcastAll(ui.clear);
						event.cards.add(event.card1);
					};
					// MARK content.chooseGuanXing,get.cheatJudgeCards eventDialog(check)
					lib.element.content.chooseToGuanxing = function () {
						"step 0"
						if (player.isUnderControl()) {
							game.modeSwapPlayer(player);
						}

						var cards = get.cards(num);
						var guanxing = AIO.content.chooseGuanXing(player, cards, cards.length, null, cards.length); // MARK content.chooseGuanXing
						if (this.getParent() && this.getParent().name && get.translation(this.getParent().name) != this.getParent().name) {
							guanxing.caption = '【' + get.translation(this.getParent().name) + '】';
						} else {
							guanxing.caption = "请按顺序排列牌。";
						}
						game.broadcast(function (player, cards, callback) {
							if (!window.AIO) return;
							var guanxing = AIO.content.chooseGuanXing(player, cards, cards.length, null, cards.length);// MARK content.chooseGuanXing
							guanxing.caption = '【观星】';
							guanxing.callback = callback;
						}, player, cards, guanxing.callback);

						event.switchToAuto = function () {
							var cards = guanxing.cards[0].concat();
							var cheats = [];
							var judges = player.node.judges.childNodes;

							if (judges.length) cheats = AIO.get.cheatJudgeCards(cards, judges, true);
							if (cards.length) {
								for (var i = 0; i >= 0 && i < cards.length; i++) {
									if (get.value(cards[i], player) >= 5) {
										cheats.push(cards[i]);
										cards.splice(i, 1)
									}
								}
							}

							var time = 500;
							for (var i = 0; i < cheats.length; i++) {
								setTimeout(function (card, index, finished) {
									guanxing.move(card, index, 0);
									if (finished) guanxing.finishTime(1000);
								}, time, cheats[i], i, (i >= cheats.length - 1) && cards.length == 0);
								time += 500;
							}

							for (var i = 0; i < cards.length; i++) {
								setTimeout(function (card, index, finished) {
									guanxing.move(card, index, 1);
									if (finished) guanxing.finishTime(1000);
								}, time, cards[i], i, (i >= cards.length - 1));
								time += 500;
							}
						}

						if (event.isOnline()) {
							event.player.send(function () {
								if (!window.AIO && AIO.eventDialog) _status.event.finish();// MARK eventDialog
							}, event.player);

							event.player.wait();
							AIO.game.wait();
						} else if (!(typeof event.isMine == 'function' && event.isMine())) {
							event.switchToAuto();
						}
						"step 1"
						player.popup(get.cnNumber(event.num1) + '上' + get.cnNumber(event.num2) + '下');
						game.log(player, '将' + get.cnNumber(event.num1) + '张牌置于牌堆顶，' + get.cnNumber(event.num2) + '张牌置于牌堆底');
						game.updateRoundNumber()
					};

					lib.element.Player = class extends lib.element.Player {
						constructor(){
							let player = super(...arguments);
							Object.setPrototypeOf(player,lib.element.Player.prototype);
							return player;
						}
						get group() {
							return this._decadeGroup;
						}
						set group(group) {
							this._decadeGroup = group;
							this.node.campWrap.dataset.camp = get.bordergroup(this.name, true) || group;
							if (!group) return;
							if (!decadeUI.config.campIdentityImageMode) {
								this.node.campWrap.node.campName.innerHTML = group ? get.translation(group)[0] : '';
								return;
							}
							const image = new Image();
							const url = lib.decade_extGroupImage && lib.decade_extGroupImage[group] || `${decadeUIPath}image/decoration/name_${group}.png`;
							this._finalGroup = group;
							image.onerror = () => this.node.campWrap.node.campName.innerHTML = this._finalGroup ? get.translation(this._finalGroup)[0] : '';
							this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
							image.src = url;
						}
						buildNode() {
							super.buildNode();
							this.node.avatar.className = 'primary-avatar';
							this.node.avatar2.className = 'deputy-avatar';
							this.node.avatar2.hide();
							this.node.turnedover.className = 'turned-over';
							this.node.turnedover.textContent = '';
							this.node.count.show().className = 'card-count';
							this.node.marks.className = 'dui-marks';
							this.node.chain.textContent = '';
							const chainImg = new Image();
							chainImg.onerror = () => {
								const chainBack = ui.create.div('.chain-back', this.node.chain);

								for (let chainLink = 0; chainLink < 40; chainLink++) {
									ui.create.div('.cardbg', chainBack).style.transform = `translateX(${chainLink * 5 - 5}px)`;
								}

								delete chainImg.onerror;
							};
							chainImg.src = `${decadeUIPath}assets/image/tie_suo.png`;
							this.$cardCount = this.node.count;
							this.$dynamicWrap = ui.create.div('.dynamic-wrap');
							const realIdentity = ui.create.div(this.node.identity);
							realIdentity.player = this;
							Object.defineProperty(realIdentity, 'innerHTML', {
								configurable: true,
								get() {
									return this.innerText;
								},
								set(innerHTML) {
									if (get.mode() == 'guozhan' || _status.mode == 'jiange' || _status.mode == 'siguo') {
										this.style.display = 'none';
										this.innerText = innerHTML;
										this.parentNode.classList.add('guozhan-mode');
										return;
									}

									let filename;
									let checked;
									const identity = this.parentNode.dataset.color;
									const gameMode = get.mode();
									let isExt = false;

									if (lib.decade_extIdentity && (lib.decade_extIdentity[this.player.identity] || lib.decade_extIdentity[innerHTML]) && innerHTML != '猜') {
										if (lib.decade_extIdentity[innerHTML]) filename = lib.decade_extIdentity[innerHTML];
										else filename = lib.decade_extIdentity[this.player.identity];

										isExt = true;
									} else switch (innerHTML) {
										case '先':
											filename = 'xianshou';
											break;
										case '后':
											filename = 'houshou';
											break;
										case '猜':
											filename = 'cai';

											if (_status.mode == 'purple' && identity == 'cai') {
												filename += '_blue';
												checked = true;
											}

											break;
										case '友':
											filename = 'friend';
											break;
										case '敌':
											filename = 'enemy';
											break;
										case '反':
											filename = 'fan';

											if (get.mode() == 'doudizhu') {
												filename = 'nongmin';
												checked = true;
											}

											break;
										case '主':
											filename = 'zhu';

											if (get.mode() == 'versus' && get.translation(`${this.player.side}Color`) == 'wei') {
												filename += '_blue';
												this.player.classList.add('opposite-camp');
												checked = true;
											} else if (get.mode() == 'doudizhu') {
												filename = 'dizhu';
												checked = true;
											}

											break;
										case '忠':
											filename = 'zhong';

											if (gameMode == 'identity' && _status.mode == 'purple') filename = 'qianfeng';
											else if (get.mode() == 'versus' && get.translation(`${this.player.side}Color`) == 'wei') {
												filename += '_blue';
												this.player.classList.add('opposite-camp');
												checked = true;
											}

											break;
										case '内':
											if (_status.mode == 'purple') {
												filename = identity == 'rNei' ? 'xizuo' : 'xizuo_blue';
												checked = true;
											} else filename = 'nei';

											break;
										case '野':
											filename = 'ye';
											break;
										case '首':
											filename = 'zeishou';
											break;
										case '帅':
											filename = 'zhushuai';
											break;
										case '将':
											filename = 'dajiang';
											if (_status.mode == 'three' || get.translation(this.player.side + 'Color') == 'wei') {
												filename = 'zhushuai_blue';
												checked = true;
											}
											break;
										case '兵':
										case '卒':
											filename = this.player.side === false ? 'qianfeng_blue' : 'qianfeng';
											checked = true;
											break;
										case '师':
											filename = 'junshi';
											break;
										case '盟':
											filename = 'mengjun';
											break;
										case '神':
											filename = 'boss';
											break;
										case '从':
											filename = 'suicong';
											break;
										default:
											this.innerText = innerHTML;
											this.style.visibility = '';
											this.parentNode.style.backgroundImage = '';
											return;
									}

									if (!checked && this.parentNode.dataset.color && !isExt) {
										if (this.parentNode.dataset.color[0] == 'b') {
											filename += '_blue';
											this.player.classList.add('opposite-camp');
										}
									}

									this.innerText = innerHTML;

									if (decadeUI.config.campIdentityImageMode) {
										this.style.visibility = 'hidden';
										const image = new Image();
										image.onerror = () => this.style.visibility = '';

										if (isExt) image.src = filename;
										else image.src = `${decadeUIPath}image/decoration/identity_${filename}.png`;

										this.parentNode.style.backgroundImage = `url("${image.src}")`;
									} else this.style.visibility = '';
								}
							});
							Object.defineProperty(this.node.count, 'innerHTML', {
								configurable: true,
								get() {
									return this.textContent;
								},
								set(innerHTML) {
									if (this.textContent == innerHTML) return;

									this.textContent = innerHTML;
									this.dataset.text = innerHTML;
								}
							});
							const campWrap = ui.create.div('.camp-wrap');
							const hpWrap = ui.create.div('.hp-wrap');
							this.insertBefore(campWrap, this.node.name);
							this.insertBefore(hpWrap, this.node.hp);
							this.node.campWrap = campWrap;
							this.node.hpWrap = hpWrap;
							hpWrap.appendChild(this.node.hp);
							campWrap.node = {
								back: ui.create.div('.camp-back', campWrap),
								border: ui.create.div('.camp-border', campWrap),
								campName: ui.create.div('.camp-name', campWrap),
								avatarName: this.node.name,
								avatarDefaultName: ui.create.div('.avatar-name-default', campWrap)
							};
							campWrap.appendChild(this.node.name);
							campWrap.node.avatarName.className = 'avatar-name';
							campWrap.node.avatarDefaultName.innerHTML = '主将';
							this.node.mask = this.insertBefore(ui.create.div('.mask'), this.node.identity);
							this.node.gainSkill = ui.create.div('.gain-skill', this);
							this.node.gainSkill.player = this;
							this.node.gainSkill.gain = function (skill) {
								if (!this.skills) this.skills = [];

								if (this.skills.includes(skill) || !lib.translate[skill]) return;

								const info = lib.skill[skill];

								if (!info || info.charlotte || info.sub || (info.mark && !info.limited) || (info.nopop || info.popup === false)) return;

								if (info.onremove && game.me != this.player.storage[skill]) return;

								this.skills.push(skill);
								this.innerHTML = this.skills.reduce((html, senderSkill) => `${html}[${lib.translate[senderSkill]}]`, '');
							};
							this.node.gainSkill.lose = function (skill) {
								const index = this.skills.indexOf(skill);

								if (index == -1) return;

								this.skills.splice(index, 1);
								this.innerHTML = this.skills.reduce((html, senderSkill) => `${html}[${get.translation(senderSkill)}]`, '');
							};
						}
						buildExtra() {
							void 0;
						}
						$syncExpand() {
							super.$syncExpand(...arguments);
							const back = ui.equipSolts.back;

							while (back.firstChild) {
								back.removeChild(back.lastChild);
							}

							const numberOfSlots = 5 + Object.values(this.expandedSlots).reduce((numberOfExpandedSlots, numberOfExpandedSubtypeSlots) => numberOfExpandedSlots + numberOfExpandedSubtypeSlots, 0);

							for (let repetition = 0; repetition < numberOfSlots; repetition++) {
								back.appendChild(document.createElement('div'));
							}
						}
						setSeatNum() {
							super.setSeatNum(...arguments);
							this.seat = this.getSeatNum();
							this.node.seat.innerHTML = get.cnNumber(this.seat, true);
						}
						$init(character, character2) {
							super.$init(...arguments);
							this.doubleAvatar = (character2 && lib.character[character2]) != undefined;
							let currentDynamic = decadeUI.CUR_DYNAMIC;
							let maximumDynamic = decadeUI.MAX_DYNAMIC;

							if (typeof currentDynamic != 'number') decadeUI.CUR_DYNAMIC = currentDynamic = 0;

							if (typeof maximumDynamic != 'number') {
								maximumDynamic = decadeUI.isMobile() ? 2 : 10;

								if (window.OffscreenCanvas) maximumDynamic += 8;

								decadeUI.MAX_DYNAMIC = maximumDynamic;
							}

							if (this.dynamic) this.stopDynamic();

							const showDynamic = (this.dynamic || currentDynamic < maximumDynamic) && duicfg.dynamicSkin;

							if (showDynamic && _status.mode != null) {
								const dynamicSkins = decadeUI.dynamicSkin;
								const avatars = this.doubleAvatar ? [character, character2] : [character];
								let increased;
								avatars.forEach(avatar => {
									const skins = dynamicSkins[avatar];

									if (!skins) return;

									const keys = Object.keys(skins);

									if (keys.length == 0) {
										console.error(`player.init: ${avatar} 没有设置动皮参数`);
										return;
									}

									const skin = skins[Object.keys(skins)[0]];

									if (typeof skin.speed != 'number') skin.speed = 1;

									this.playDynamic({
										/**
										 * 骨骼文件名，一般是assets/dynamic 下的动皮文件，也可以使用.. 来寻找其他文件目录
										 * @type {string}
										 */
										name: skin.name,
										/**
										 * 播放动作 不填为默认
										 * @type {string}
										 */
										action: skin.action,
										/**
										 * 是否循环播放
										 * @type {boolean}
										 */
										loop: true,
										/**
										 * 循环次数，只有loop为true时生效
										 * @type {number}
										 */
										loopCount: -1,
										/**
										 * 播放速度
										 * @type {number}
										 */
										speed: skin.speed,
										/**
										 * 水平镜像
										 * @type {boolean}
										 */
										filpX: null,
										/**
										 * 垂直翻转
										 * @type {boolean}
										 */
										filpY: null,
										/**
										 * 0~1
										 *
										 * 不透明度
										 * @type {number}
										 */
										opacity: null,
										/**
										 * 相对于父节点坐标x，不填为居中
										 *
										 * (1) x: 10, 相当于 left: 10px；
										 *
										 * (2) x: [10, 0.5], 相当于 left: calc(50% + 10px)；
										 * @type {number | [number, number]}
										 */
										x: skin.x,
										/**
										 * 相对于父节点坐标y，不填为居中
										 *
										 * (1) y: 10，相当于 top: 10px；
										 *
										 * (2) y: [10, 0.5]，相当于 top: calc(50% + 10px)；
										 * @type {number | [number, number]}
										 */
										y: skin.y,
										/**
										 * 缩放
										 * @type {number}
										 */
										scale: skin.scale,
										/**
										 * 角度
										 * @type {number}
										 */
										angle: skin.angle,
										/**
										 * 隐藏不需要的部件，想知道具体部件名称请使用SpineAltasSplit工具查看
										 */
										hideSlots: skin.hideSlots,
										/**
										 * 剪掉超出头的部件，仅针对露头动皮，其他勿用
										 */
										clipSlots: skin.clipSlots,
									}, i == 1);
									this.$dynamicWrap.style.backgroundImage = `url("${decadeUIPath}assets/dynamic/${skin.background}")`;

									if (increased) return;

									increased = true;
									decadeUI.CUR_DYNAMIC++;
								});
							}

							let refreshPrefix;

							if (character && duicfg.showJieMark) {
								if (lib.characterPack.refresh) refreshPrefix = lib.characterPack.refresh[character];

								if (!refreshPrefix) refreshPrefix = character.substr(0, 3);

								if (refreshPrefix) {
									refreshPrefix = lib.translate[character] && lib.translate[character][0];

									if (refreshPrefix == '界') {
										if (!this.$jieMark) this.$jieMark = dui.element.create('jie-mark', this);
										else this.appendChild(this.$jieMark);
									}
								}
							}

							if (refreshPrefix == '界') {
								let text = this.node.name.innerText;

								if (text[1] == '\n') text = text.substr(2);
								else text = text.substr(1);

								this.node.name.innerText = text;
							}

							return this;
						}
						$uninit() {
							if (this.$jieMark) this.$jieMark.remove();

							this.stopDynamic();
							this.doubleAvatar = false;
							delete this.node.campWrap.dataset.camp;
							const campName = this.node.campWrap.node.campName;

							while (campName.firstChild) {
								campName.removeChild(campName.lastChild);
							}

							campName.style.removeProperty('background-image');
							super.$uninit(...arguments);
						}
						getState() {
							const state = super.getState(...arguments);
							state.seat = this.seat;
							return state;
						}
						$update() {
							const hpMax = this.maxHp;

							if (this.hp >= hpMax) this.hp = hpMax;

							const count = this.countCards('h');
							const hp = this.hp;

							if (!_status.video) {
								if (this.hujia) this.markSkill('ghujia');
								else this.unmarkSkill('ghujia');
							}

							const hpNode = this.node.hp;

							if (!this.storage.nohp) {
								if (hpMax > 5) {
									hpNode.innerHTML = `${isNaN(hp) ? '×' : hp == Infinity ? '∞' : hp}<br>/<br>${(isNaN(hpMax) ? '×' : hpMax == Infinity ? '∞' : hpMax)}<div></div>`;

									if (hp == 0) hpNode.lastChild.classList.add('lost');

									hpNode.classList.add('textstyle');
								} else {
									hpNode.innerHTML = '';
									hpNode.classList.remove('textstyle');

									while (hpMax > hpNode.childNodes.length) {
										ui.create.div(hpNode);
									}

									while (hpNode.childNodes.length && hpMax < hpNode.childNodes.length) {
										hpNode.lastChild.remove();
									}

									for (var i = 0; i < hpMax; i++) {
										if (i < hp) hpNode.childNodes[i].classList.remove('lost');
										else hpNode.childNodes[i].classList.add('lost');
									}
								}

								if (hpNode.classList.contains('room')) hpNode.dataset.condition = 'high';
								else if (hp == 0) hpNode.dataset.condition = '';
								else if (hp > Math.round(hpMax / 2) || hp === hpMax) hpNode.dataset.condition = 'high';
								else if (hp > Math.floor(hpMax / 3)) hpNode.dataset.condition = 'mid';
								else hpNode.dataset.condition = 'low';
							}

							this.node.count.innerHTML = count;

							if (count >= 10) this.node.count.dataset.condition = 'low';
							else if (count > 5) this.node.count.dataset.condition = 'higher';
							else if (count > 2) this.node.count.dataset.condition = 'high';
							else if (count > 0) this.node.count.dataset.condition = 'mid';
							else this.node.count.dataset.condition = 'none';

							this.dataset.maxHp = hpMax;

							if (this.updates) for (var i = 0; i < this.updates.length; i++) {
								this.updates[i](this);
							}

							if (!_status.video) game.addVideo('update', this, [this.countCards('h'), this.hp, this.maxHp, this.hujia]);

							this.updateMarks();
							return this;
						}
						line(target, config) {
							if (get.itemtype(target) == 'players') super.line(...arguments);
							else if (get.itemtype(target) == 'player') {
								if (target == this)
									return;

								var player = this;
								game.broadcast(function (player, target, config) {
									player.line(target, config);
								}, player, target, config);
								game.addVideo('line', player, [target.dataset.position, config]);

								player.checkBoundsCache(true);
								target.checkBoundsCache(true);
								var x1, y1;
								var x2, y2;
								var hand = dui.boundsCaches.hand;
								if (player == game.me) {
									hand.check();
									x1 = hand.x + hand.width / 2;
									y1 = hand.y;
								} else {
									x1 = player.cacheLeft + player.cacheWidth / 2;
									y1 = player.cacheTop + player.cacheHeight / 2;
								}

								if (target == game.me) {
									hand.check();
									x2 = hand.x + hand.width / 2;
									y2 = hand.y;
								} else {
									x2 = target.cacheLeft + target.cacheWidth / 2;
									y2 = target.cacheTop + target.cacheHeight / 2;
								}

								game.linexy([x1, y1, x2, y2], config, true);
							}
						}
						setIdentity(identity) {
							if (!identity) identity = this.identity;

							if (get.mode() == 'guozhan') {
								this.node.identity.dataset.color = identity;
								if (identity == 'ye' && get.is.jun(this)) this.identity = identity = lib.character[this.name1][1];
								this.group = identity;
								this.node.identity.firstChild.innerHTML = get.translation(identity);
								return this;
							}

							return super.setIdentity(identity);
						}
						chooseToRespond() {
							const chooseToRespond = super.chooseToRespond(...arguments);
							if (/^请打出.*张/.test(chooseToRespond.prompt)) delete chooseToRespond.prompt;
							return chooseToRespond;
						}
						useCard() {
							const useCard = super.useCard(...arguments);
							useCard.pushHandler((event, option) => {
								if (event.step == 0 && option.state == 'end') {
									const player = event.player;
									event.targets.forEach(current => {
										if (current != player) current.classList.add('target');
									});
								} else if (event.finished) event.targets.forEach(current => {
									const classList = current.classList;
									if (classList.contains('target')) classList.remove('target');
								});
							});
							return useCard;
						}
						directgain(cards) {
							super.directgain(...arguments);

							if (this == game.me) {
								if (cards && cards.length) dui.layoutHandDraws(cards.reverse());

								dui.queueNextFrameTick(dui.layoutHand, dui);
							}

							return this;
						}
						lose() {
							const event = get.event(), lose = super.lose(...arguments);

							if (event.name == 'useCard') {
								lose.animate = true;
								lose.blameEvent = event;
							}

							lose.pushHandler((event, option) => {
								const step = event.step;

								if (step == 0) {
									const state = option.state;

									if (state == 'begin') {
										const playerCards = event.player.getCards('hejsx');
										const cards = event.cards.filter(card => playerCards.includes(card));
										game.broadcastAll(cards => cards.duiMod = true, cards);
										cards.filter(card => playerCards.includes(card)).forEach(card => {
											const parentNode = card.parentNode;

											if (!parentNode) return;

											const classList = parentNode.classList;

											if (classList.contains('equips')) card.throwWith = 'e';
											else if (classList.contains('judges')) card.throwWith = 'j';
											else if (classList.contains('expansions')) card.throwWith = 'x';
											else if (!classList.contains('handcards')) return;

											if (card.classList.contains('glows')) card.throwWith = 's';
											else card.throwWith = 'h';
										});
									}
									else if (state == 'end') {
										const parent = event.getParent();

										if (!event.blameEvent && (parent.name != 'discard' || event.type != 'discard') && (parent.name != 'loseToDiscardpile' || event.type != 'loseToDiscardpile')) event.animate = false;
										else if (typeof event.animate != 'boolean') {
											const parentAnimate = parent.animate;

											if (typeof parentAnimate == 'boolean') event.animate = parentAnimate;
										}
									}
								} else if (step == 1 && option.state == 'end') {
									event.cards.forEach(card => {
										const style = card.style, transform = style.transform;

										if (transform.endsWith(' scale(0.2)')) style.transform = transform.slice(0, -11);
									});

									if (event.player == game.me) dui.queueNextFrameTick(dui.layoutHand, dui);
								}
							});
							return lose;
						}
						changeHp() {
							const changeHp = super.changeHp(...arguments);
							changeHp.pushHandler((event, option) => {
								if (event.finished) dui.delay(68);
							});
							return changeHp;
						}
						equip() {
							const equip = super.equip(...arguments);
							equip.pushHandler((event, option) => {
								if (event.step == 0 && option.state == 'end') {
									const lose = event.next[0];
									if (!lose || lose.name != 'lose') return;
									lose.animate = true;
									lose.blameEvent = event;
								}
							});
							return equip;
						}
						prompt() {
							super.prompt(...arguments);
							const prompt = this.node.prompt;
							prompt.dataset.text = prompt.innerText;
							prompt.style.animation = 'open-fade-in 0.6s';
						}
						addSkill() {
							const skill = super.addSkill(...arguments);

							if (!Array.isArray(skill)) {
								const character1 = lib.character[this.name];
								const character2 = lib.character[this.name2];

								if ((!character1 || !character1[3].includes(skill)) && (!character2 || !character2[3].includes(skill))) this.node.gainSkill.gain(skill);
							}

							return skill;
						}
						removeSkill() {
							const skill = super.removeSkill(...arguments);

							if (!Array.isArray(skill)) {
								const gainSkill = this.node.gainSkill;
								const skills = gainSkill.skills;

								if (skills && skills.includes(skill)) gainSkill.lose(skill);
							}

							return skill;
						}
						$draw(num, init, config) {
							if (game.chess)
								return super.$draw(...arguments);

							if (init !== false && init !== 'nobroadcast') {
								game.broadcast(function (player, num, init, config) {
									player.$draw(num, init, config);
								}, this, num, init, config);
							}

							var cards;
							var isDrawCard;
							if (get.itemtype(num) == 'cards') {
								cards = num.concat();
								isDrawCard = true;
							} else if (get.itemtype(num) == 'card') {
								cards = [num];
								isDrawCard = true;
							} else if (typeof num == 'number') {
								cards = new Array(num);
							} else {
								cards = new Array(1);
							}

							if (init !== false) {
								if (isDrawCard) {
									game.addVideo('drawCard', this, get.cardsInfo(cards));
								} else {
									game.addVideo('draw', this, num);
								}
							}

							if (game.me == this)
								return;

							var fragment = document.createDocumentFragment();
							var card;
							for (var i = 0; i < cards.length; i++) {
								card = cards[i];
								if (card == null)
									card = dui.element.create('card thrown drawingcard');
								else
									card = card.copy('thrown', 'drawingcard', false);

								card.fixed = true;
								cards[i] = card;
								fragment.appendChild(card);
							}

							var player = this;
							dui.layoutDrawCards(cards, player, true);
							ui.arena.appendChild(fragment);
							dui.queueNextFrameTick(function () {
								dui.layoutDrawCards(cards, player);
								dui.delayRemoveCards(cards, 460, 220);
							});
						}
						$compare(card1, target, card2) {
							game.broadcast(function (player, target, card1, card2) {
								player.$compare(card1, target, card2);
							}, this, target, card1, card2);
							game.addVideo('compare', this, [get.cardInfo(card1), target.dataset.position, get.cardInfo(card2)]);
							var player = this;
							target.$throwordered2(card2.copy(false));
							player.$throwordered2(card1.copy(false));
						}
						$throw(cards, time, record, nosource) {
							var itemtype;
							var duiMod = (cards.duiMod && game.me == this && !nosource);
							if (typeof cards == 'number') {
								itemtype = 'number';
								cards = new Array(cards);
							} else {
								itemtype = get.itemtype(cards);
								if (itemtype == 'cards') {
									cards = cards.concat();
								} else if (itemtype == 'card') {
									cards = [cards];
								} else {
									return;
								}
							}

							var card;
							var clone;
							var player = this;
							var hand = dui.boundsCaches.hand;
							hand.check();

							for (var i = 0; i < cards.length; i++) {
								card = cards[i];
								if (card) {
									clone = card.copy('thrown');
									if (duiMod && (card.throwWith == 'h' || card.throwWith == 's')) {
										clone.tx = Math.round(hand.x + card.tx);
										clone.ty = Math.round(hand.y + 30 + card.ty);
										clone.scaled = true;
										clone.throwordered = true;
										clone.style.transform = 'translate(' + clone.tx + 'px,' + clone.ty + 'px) scale(' + hand.cardScale + ')';
									}
									card = clone;
								} else {
									card = dui.element.create('card infohidden infoflip');
									card.moveTo = lib.element.Card.prototype.moveTo;
									card.moveDelete = lib.element.Card.prototype.moveDelete;
								}

								cards[i] = card;
							}

							if (record !== false) {
								if (record !== 'nobroadcast') {
									game.broadcast(function (player, cards, time, record, nosource) {
										player.$throw(cards, time, record, nosource);
									}, this, cards, 0, record, nosource);
								}

								game.addVideo('throw', this, [get.cardsInfo(cards), 0, nosource]);
							}

							if (duiMod && cards.length > 2) {
								cards.sort(function (a, b) {
									if (a.tx == undefined && b.tx == undefined)
										return 0;

									if (a.tx == undefined)
										return duicfg.rightLayout ? -1 : 1;

									if (b.tx == undefined)
										return duicfg.rightLayout ? 1 : -1;

									return b.tx - a.tx;
								});
							}

							for (var i = 0; i < cards.length; i++)
								player.$throwordered2(cards[i], nosource);

							if (game.chess)
								this.chessFocus();

							return cards[cards.length - 1];
						}
						$throwordered2(card, nosource) {
							if (_status.connectMode)
								ui.todiscard = [];

							if (card.throwordered == undefined) {
								var x, y;
								var bounds = dui.boundsCaches.arena;
								if (!bounds.updated)
									bounds.update();

								this.checkBoundsCache();
								if (nosource) {
									x = ((bounds.width - bounds.cardWidth) / 2 - bounds.width * 0.08);
									y = ((bounds.height - bounds.cardHeight) / 2);
								} else {
									x = ((this.cacheWidth - bounds.cardWidth) / 2 + this.cacheLeft);
									y = ((this.cacheHeight - bounds.cardHeight) / 2 + this.cacheTop);
								}

								x = Math.round(x);
								y = Math.round(y);

								card.tx = x;
								card.ty = y;
								card.scaled = true;
								card.classList.add('thrown');
								card.style.transform = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + bounds.cardScale + ')';
							} else {
								card.throwordered = undefined;
							}

							if (card.fixed)
								return ui.arena.appendChild(card);

							var before;
							for (var i = 0; i < ui.thrown; i++) {
								if (ui.thrown[i].parentNode == ui.arena) {
									before = ui.thrown[i];
									break;
								}
							}

							var tagNode = card.querySelector('.used-info');
							if (tagNode == null)
								tagNode = card.appendChild(dui.element.create('used-info'));

							card.$usedtag = tagNode;
							ui.thrown.unshift(card);
							if (before)
								ui.arena.insertBefore(before, card);
							else
								ui.arena.appendChild(card);

							dui.tryAddPlayerCardUseTag(card, this, _status.event);
							dui.queueNextFrameTick(dui.layoutDiscard, dui);
							return card;
						}
						$give(cards, target, log, record) {
							var itemtype;
							var duiMod = (cards.duiMod && game.me == target);
							if (typeof cards == 'number') {
								itemtype = 'number';
								cards = new Array(cards);
							} else {
								itemtype = get.itemtype(cards);
								if (itemtype == 'cards') {
									cards = cards.concat();
								} else if (itemtype == 'card') {
									cards = [cards];
								} else {
									return;
								}
							}

							if (record !== false) {
								var cards2 = cards;
								if (itemtype == 'number') {
									cards2 = cards.length;
									game.addVideo('give', this, [cards2, target.dataset.position]);
								} else {
									game.addVideo('giveCard', this, [get.cardsInfo(cards2), target.dataset.position]);
								}

								game.broadcast(function (source, cards2, target, record) {
									source.$give(cards2, target, false, record);
								}, this, cards2, target, record);
							}

							if (log != false) {
								if (itemtype == 'number')
									game.log(target, '从', this, '获得了' + get.cnNumber(cards.length) + '张牌');
								else
									game.log(target, '从', this, '获得了', cards);
							}

							if (this.$givemod) {
								this.$givemod(cards, target);
								return;
							}

							if (duiMod)
								return;

							var card;
							var hand = dui.boundsCaches.hand;
							hand.check();

							var draws = [];
							var player = this;
							var fragment = document.createDocumentFragment();
							for (var i = 0; i < cards.length; i++) {
								card = cards[i];
								if (card) {
									var cp = card.copy('card', 'thrown', 'gainingcard', false);
									var hs = player == game.me;
									if (hs) {
										if (card.throwWith)
											hs = card.throwWith == 'h' || card.throwWith == 's';
										else
											hs = card.parentNode == player.node.handcards1;
									}

									if (hs) {
										cp.tx = Math.round(hand.x + card.tx);
										cp.ty = Math.round(hand.y + 30 + card.ty);
										cp.scaled = true;
										cp.style.transform = 'translate(' + cp.tx + 'px,' + cp.ty + 'px) scale(' + hand.cardScale + ')';
									} else {
										draws.push(cp);
									}
									card = cp;
								} else {
									card = dui.element.create('card thrown gainingcard');
									draws.push(card);
								}

								cards[i] = card;
								cards[i].fixed = true;
								fragment.appendChild(cards[i]);
							}

							if (draws.length)
								dui.layoutDrawCards(draws, player);

							ui.arena.appendChild(fragment);
							dui.queueNextFrameTick(function () {
								dui.layoutDrawCards(cards, target);
								dui.delayRemoveCards(cards, 460, 220);
							});
						}
						$gain2(cards, log) {
							var type = get.itemtype(cards);
							if (type != 'cards') {
								if (type != 'card')
									return;

								type = 'cards';
								cards = [cards];
							}

							if (log === true)
								game.log(this, '获得了', cards);

							game.broadcast(function (player, cards) {
								player.$gain2(cards);
							}, this, cards);

							var gains = [];
							var draws = [];

							var card;
							var clone;
							for (var i = 0; i < cards.length; i++) {
								clone = cards[i].clone;
								card = cards[i].copy('thrown', 'gainingcard');
								card.fixed = true;
								if (clone && clone.parentNode == ui.arena) {
									card.scaled = true;
									card.style.transform = clone.style.transform;
									gains.push(card);
								} else {
									draws.push(card);
								}
							}

							if (gains.length)
								game.addVideo('gain2', this, get.cardsInfo(gains));

							if (draws.length)
								game.addVideo('drawCard', this, get.cardsInfo(draws));

							if (cards.duiMod && this == game.me)
								return;

							cards = gains.concat(draws);
							dui.layoutDrawCards(draws, this, true);

							var player = this;
							var fragment = document.createDocumentFragment();
							for (var i = 0; i < cards.length; i++)
								fragment.appendChild(cards[i]);

							ui.arena.appendChild(fragment);
							dui.queueNextFrameTick(function () {
								dui.layoutDrawCards(cards, player);
								dui.delayRemoveCards(cards, 460, 220);
							});
						}
						$skill(name, type, color, avatar) {
							if (!decadeUI.config.gameAnimationEffect || !decadeUI.animation.gl) return super.$skill(...arguments);
							var _this = this;
							if (typeof type != 'string') type = 'legend';

							game.addVideo('skill', this, [name, type, color, avatar]);
							game.broadcastAll(function (player, type, name, color, avatar) {
								if (window.decadeUI == void 0) {
									game.delay(2.5);
									if (name) player.$fullscreenpop(name, color, avatar);
									return;
								}

								decadeUI.delay(2500);
								if (name) decadeUI.effect.skill(player, name, avatar);
							}, _this, type, name, color, avatar);
						}
						$damagepop(num, nature, font, nobroadcast) {
							if (typeof num == 'number' || typeof num == 'string') {
								game.addVideo('damagepop', this, [num, nature, font]);
								if (nobroadcast !== false) {
									game.broadcast(function (player, num, nature, font) {
										player.$damagepop(num, nature, font);
									}, this, num, nature, font);
								}

								var node;
								if (this.popupNodeCache && this.popupNodeCache.length) {
									node = this.popupNodeCache.shift();
								} else {
									node = decadeUI.element.create('damage');
								}

								if (font) {
									node.classList.add('normal-font');
								} else {
									node.classList.remove('normal-font');
								}

								if (typeof num == 'number') {
									node.popupNumber = num;
									if (num == Infinity) {
										num = '+∞'
									} else if (num == -Infinity) {
										num = '-∞';
									} else if (num > 0) {
										num = '+' + num;
									}

								} else {
									node.popupNumber = null;
								}

								node.innerHTML = num;
								node.dataset.text = node.innerText;
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
													decadeUI.animation.playSpine({ name: 'effect_shoujidonghua', action: 'play6' }, { scale: 0.8, parent: player });
												} else {
													decadeUI.animation.playSpine({ name: 'effect_shoujidonghua', action: 'play5' }, { scale: 0.8, parent: player });
												}
												break;
											case 'fire':
												if (popupNum <= -2) {
													decadeUI.animation.playSpine({ name: 'effect_shoujidonghua', action: 'play4' }, { scale: 0.8, parent: player });
												} else {
													decadeUI.animation.playSpine({ name: 'effect_shoujidonghua', action: 'play3' }, { scale: 0.8, parent: player });
												}
												break;
											case 'water':
												break;
											default:
												if (popupNum <= -2) {
													decadeUI.animation.playSpine({ name: 'effect_shoujidonghua', action: 'play2' }, { scale: 0.8, parent: player });
												} else {
													decadeUI.animation.playSpine({ name: 'effect_shoujidonghua', action: 'play1' }, { scale: 0.8, parent: player });
												}
												break;
										}
									} else {
										if (node.nature == 'wood') {
											decadeUI.animation.playSpine('effect_zhiliao', { scale: 0.7, parent: player });
										}
									}
								}

								node.style.animation = 'open-fade-in-out 1.2s';
								setTimeout(function (player, node) {
									if (!player.popupNodeCache) player.popupNodeCache = [];
									node.style.animation = '';
									player.popupNodeCache.push(node);
								}, 1210, player, node);

								setTimeout(function (player) {
									player.damagepopLocked = false;
									player.$damagepop();
								}, 500, player);
							}
						}
						$damage(source) {
							if (get.itemtype(source) == 'player') {
								game.addVideo('damage', this, source.dataset.position);
							} else {
								game.addVideo('damage', this);
							}
							game.broadcast(function (player, source) {
								player.$damage(source);
							}, this, source);

							this.queueCssAnimation('player-hurt 0.3s');
						}
						$dieflip() {
							if (!decadeUI.config.playerDieEffect) super.$dieflip(...arguments);
						}
						$phaseJudge(card) {
							game.addVideo('phaseJudge', this, get.cardInfo(card));
							this.$throw(card);
							dui.delay(451);
						}
						$dieAfter() {
							this.stopDynamic();

							if (!decadeUI.config.playerDieEffect) {
								if (super.$dieAfter) super.$dieAfter(...arguments);
								return;
							}

							if (!this.node.dieidentity) this.node.dieidentity = ui.create.div('died-identity', this);
							this.node.dieidentity.classList.add('died-identity');

							var that = this;
							var image = new Image();
							var identity = decadeUI.getPlayerIdentity(this);
							var url = decadeUIPath + 'image/decoration/dead_' + identity + '.png';
							image.onerror = function () {
								that.node.dieidentity.innerHTML = decadeUI.getPlayerIdentity(that, that.identity, true) + '<br>阵亡';
							};

							that.node.dieidentity.innerHTML = '';
							that.node.dieidentity.style.backgroundImage = 'url("' + url + '")';
							image.src = url;
							setTimeout(function () {
								var rect = that.getBoundingClientRect();
								decadeUI.animation.playSpine('effect_zhenwang', {
									x: rect.left + rect.width / 2 - 7,
									y: decadeUI.get.bodySize().height - rect.top - rect.height / 2 + 1,
									scale: 0.8,
								});
							}, 250);
						}
						setModeState(info) {
							if (info && info.seat) {
								if (!this.node.seat) this.node.seat = ui.create.div('.seat', this);

								this.node.seat.innerHTML = get.cnNumber(info.seat, true);
							}

							return super.setModeState ? super.setModeState(...arguments) : this.init(info.name, info.name2);
						}
						checkBoundsCache(forceUpdate) {
							var update;
							var refer = dui.boundsCaches.arena;
							refer.check();

							if (this.cacheReferW != refer.width ||
								this.cacheReferH != refer.height ||
								this.cachePosition != this.dataset.position)
								update = true;

							this.cacheReferW = refer.width;
							this.cacheReferH = refer.height;
							this.cachePosition = this.dataset.position;
							if (this.cacheLeft == null)
								update = true;

							if (update || forceUpdate) {
								this.cacheLeft = this.offsetLeft;
								this.cacheTop = this.offsetTop;
								this.cacheWidth = this.offsetWidth;
								this.cacheHeight = this.offsetHeight;
							}
						}
						queueCssAnimation(animation) {
							var current = this.style.animation;
							var animations = this._cssanimations;
							if (animations == undefined) {
								animations = [];
								this._cssanimations = animations;
								this.addEventListener('animationend', function (e) {
									if (this.style.animationName != e.animationName)
										return;

									var current = this.style.animation;
									var animations = this._cssanimations;
									while (animations.length) {
										this.style.animation = animations.shift();
										if (this.style.animation != current)
											return;

										animations.current = this.style.animation;
									}

									animations.current = '';
									this.style.animation = '';
								});
							}

							if (animations.current || animations.length) {
								animations.push(animation);
								return;
							}

							animations.current = animation;
							this.style.animation = animation;
						}
					};
					lib.element.Card = class extends lib.element.Card {
						constructor(){
							let card = super(...arguments);
							Object.setPrototypeOf(card,lib.element.Card.prototype);
							return card;
						}
						buildNode() {
							super.buildNode();
							const node = this.node;
							this.removeChild(node.info);
							const suitNumber = this.$suitnum = node.suitnum = ui.create.div('.suit-num', this);
							this.$gaintag = node.gaintag = ui.create.div('.gaintag.info', this);
							const judgeMark = node.judgeMark = ui.create.div('.judge-mark', this);
							node.cardMask = ui.create.div('.card-mask', this);
							this.$name = ui.create.div('.top-name', this);
							this.$vertname = node.name;
							const equip = this.$equip = node.name2;
							this.$range = node.range;
							const numberNode = suitNumber.$num = decadeUI.element.create(null, suitNumber, 'span');
							numberNode.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
							const suitNode = suitNumber.$suit = decadeUI.element.create('suit', suitNumber, 'span');
							suitNode.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
							equip.$suitnum = decadeUI.element.create(null, equip, 'span');
							equip.$name = decadeUI.element.create(null, equip, 'span');
							judgeMark.node = {
								back: ui.create.div('.back', judgeMark),
								mark: ui.create.div('.mark', judgeMark),
								judge: ui.create.div('.judge', judgeMark)
							};
						}
						$init() {
							super.$init(...arguments);
							const verticalName = this.$vertname;
							this.$name.innerHTML = verticalName.innerHTML;
							let cardNumber = this.number || '';
							const parsedCardNumber = parseInt(cardNumber);

							if (parsedCardNumber == cardNumber) cardNumber = parsedCardNumber;

							switch (cardNumber) {
								case 1:
									this.$suitnum.$num.innerHTML = 'A';
									break;
								case 11:
									this.$suitnum.$num.innerHTML = 'J';
									break;
								case 12:
									this.$suitnum.$num.innerHTML = 'Q';
									break;
								case 13:
									this.$suitnum.$num.innerHTML = 'K';
									break;
								default: this.$suitnum.$num.innerHTML = cardNumber.toString();
							}

							this.$suitnum.$suit.innerHTML = get.translation(this.dataset.suit = this.suit);
							const equip = this.$equip;
							const innerHTML = equip.innerHTML;
							equip.$suitnum.innerHTML = innerHTML.slice(0, innerHTML.indexOf(' '));
							equip.$name.innerHTML = innerHTML.slice(innerHTML.indexOf(' '));
							const node = this.node;
							const background = node.background;
							node.judgeMark.node.judge.innerHTML = background.innerHTML;
							const classList = background.classList;

							if (classList.contains('tight')) classList.remove('tight');

							const cardStyle = this.style;

							if (cardStyle.color) cardStyle.removeProperty('color');

							if (cardStyle.textShadow) cardStyle.removeProperty('text-shadow');

							const info = node.info;
							const infoStyle = info.style;

							if (infoStyle.opacity) infoStyle.removeProperty('opacity');

							const verticalNameStyle = verticalName.style;

							if (verticalNameStyle.opacity) verticalNameStyle.removeProperty('opacity');

							if (info.childElementCount) while (info.firstChild) {
								info.removeChild(info.lastChild);
							}

							if (equip.childElementCount) while (equip.firstChild) {
								equip.removeChild(equip.lastChild);
							}

							if (decadeUI.config.cardPrettify) {
								const decadeExtCardImage = lib.decade_extCardImage || (lib.decade_extCardImage = {});
								const cardNature = this.nature;
								const cardName = this.name;
								const fileName = cardNature ? `${cardName}_${get.natureList(cardNature).sort(lib.sort.nature).join('_')}` : cardName;
								let decadeCardSource = decadeExtCardImage[fileName];
								if (!decadeCardSource && cardName != fileName) decadeCardSource = decadeExtCardImage[cardName];

								if (decadeCardSource) {
									this.classList.add('decade-card');

									if (!this.classList.contains('infohidden')) this.style.backgroundImage = `url('${this.decadeCardSource = decadeCardSource}')`;

									const avatar = this.node.avatar;

									if (avatar) avatar.remove();

									const frameBackground = this.node.framebg;

									if (frameBackground) frameBackground.remove();

									new MutationObserver(mutationRecords => mutationRecords.forEach(mutationRecord => {
										const target = mutationRecord.target;
										const informationHidden = target.classList.contains('infohidden');

										if (informationHidden == mutationRecord.oldValue.split(' ').includes('infohidden')) return;

										if (informationHidden) target.style.removeProperty('background-image');
										else target.style.backgroundImage = `url('${target.decadeCardSource}')`;
									})).observe(this, {
										attributeFilter: ['class'],
										attributeOldValue: true
									});
								}
							}

							return this;
						}
						moveDelete(player) {
							this.fixed = true;
							this.moveTo(player);
							setTimeout(function (card) {
								card.delete();
							}, 460, this);
						}
						moveTo(player) {
							if (!player)
								return;

							var arena = dui.boundsCaches.arena;
							if (!arena.updated)
								arena.update();

							player.checkBoundsCache();
							this.fixed = true;
							var x = Math.round((player.cacheWidth - arena.cardWidth) / 2 + player.cacheLeft);
							var y = Math.round((player.cacheHeight - arena.cardHeight) / 2 + player.cacheTop);
							var scale = arena.cardScale;

							this.tx = x;
							this.ty = y;
							this.scaled = true;
							this.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
							return this;
						}
						copy() {
							const node = super.copy(...arguments);
							node.decadeCardSource = this.decadeCardSource;

							if (this.clone && node.classList.contains('decade-card')) new MutationObserver(mutationRecords => mutationRecords.forEach(mutationRecord => {
								const target = mutationRecord.target, informationHidden = target.classList.contains('infohidden');

								if (informationHidden == mutationRecord.oldValue.split(' ').includes('infohidden')) return;

								if (informationHidden) target.style.removeProperty('background-image');
								else target.style.backgroundImage = `url('${target.decadeCardSource}')`;
							})).observe(node, {
								attributeFilter: ['class'],
								attributeOldValue: true
							});

							return node;
						}
					};
					lib.element.GameEvent = class extends lib.element.GameEvent {
						addMessageHook(message, callback) {
							if (this._messages == undefined)
								this._messages = {};

							message = message.toLowerCase();
							if (this._messages[message] == undefined)
								this._messages[message] = [];

							message = this._messages[message];
							message.push(callback);
						}
						triggerMessage(message) {
							if (this._messages == undefined)
								return;

							message = message.toLowerCase();
							if (this._messages[message] == undefined)
								return;

							message = this._messages[message];
							for (var i = 0; i < message.length; i++) {
								if (typeof message[i] == 'function')
									message[i].call(this);
							}

							this._messages[message] = [];
						}
					};
					lib.element.Dialog = class extends lib.element.Dialog {
						constructor() {
							const dialog = super(...arguments);
							dialog.bar1.remove();
							delete dialog.bar1;
							dialog.bar2.remove();
							delete dialog.bar2;
							Object.setPrototypeOf(dialog,lib.element.Dialog.prototype);
							return dialog;
						}
					};


				},
				delay: function (milliseconds) {
					if (typeof milliseconds != 'number') throw 'milliseconds is not number';
					if (_status.paused) return;
					game.pause();
					_status.timeout = setTimeout(game.resume, milliseconds);
				},
				isMobile: function () {
					return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|OperaMini/i.test(navigator.userAgent));
				},
				// NOTE showHandTip -> statics,element.create
				showHandTip: function (text) {
					var tip;
					var tips = this.statics.handTips;
					for (var i = 0; i < tips.length; i++) {
						if (tip == undefined && tips[i].closed) {
							tip = tips[i];
							tip.closed = false;
						} else {
							tips[i].hide();
						}
					}

					if (tip == undefined) {
						tip = AIO.element.create('hand-tip', ui.arena);
						tips.unshift(tip);
						tip.clear = function () {
							var nodes = this.childNodes;
							for (var i = 0; i < nodes.length; i++)
								nodes[i].textContent = '';

							this.dataset.text = '';
						};
						tip.setText = function (text, type) {
							this.clear();
							this.appendText(text, type);
						};
						tip.setInformation = function (text) {//NOTE 改了下单词拼写错误setInfomation->setInformation
							if (this.$info == null)
								this.$info = AIO.element.create('hand-tip-info', ui.arena);

							this.$info.innerHTML = text;
						};
						tip.appendText = function (text, type) {
							if (text == undefined || text === '')
								return;
							text = String(text).replace(/^###[\s\S]*###/, "");
							if (type == undefined)
								type = '';

							var nodes = this.childNodes;
							for (var i = 0; i < nodes.length; i++) {
								if (nodes[i].textContent == '') {
									nodes[i].textContent = text;
									nodes[i].dataset.type = type;
									return nodes[i];
								}
							}

							var span = document.createElement('span');
							span.textContent = text;
							span.dataset.type = type;
							return this.appendChild(span);
						};
						tip.strokeText = function () {
							this.dataset.text = this.innerText;
						};
						tip.show = function () {
							this.classList.remove('hidden');
							if (this.$info && this.$info.innerHTML)
								this.$info.show();
						};
						tip.hide = function () {
							this.classList.add('hidden');
							if (this.$info)
								this.$info.hide();
						};
						tip.close = function () {
							this.closed = true;
							this.hide();
							if (tip.$info)
								tip.$info.innerHTML = '';
							var tips = AIO.statics.handTips;
							for (var i = 0; i < tips.length; i++) {
								if (tips[i].closed)
									continue;

								tips[i].show();
								return;
							}
						};
						tip.isEmpty = function () {
							var nodes = this.childNodes;
							for (var i = 0; i < nodes.length; i++) {
								if (nodes[i].textContent != '')
									return false;
							}

							return true;
						};
					}
					tip.setText(text);
					tip.show();
					return tip;
				},
				// NOTE getHandCardSize -> sheet
				getHandCardSize: function (canUseDefault) {
					var style = AIO.sheet.getStyle('.media_defined > .card'); // MARK sheet.getStyle
					if (style == null) style = AIO.sheet.getStyle('.hand-cards > .handcards > .card'); // MARK sheet.getStyle
					if (style == null) return canUseDefault ? { width: 108, height: 150 } : { width: 0, height: 0 };
					var size = { width: parseFloat(style.width), height: parseFloat(style.height) };
					return size;
				},
				// NOTE getCardBestScale -> getHandCardSize,get,isMobile
				getCardBestScale: function (size) {
					if (!(size && size.height)) size = AIO.getHandCardSize(); // MARK getHandCardSize

					var bodySize = AIO.get.bodySize(); // MARK get.bodySize
					return Math.min(bodySize.height * (AIO.isMobile() ? 0.23 : 0.18) / size.height, 1); // MARK isMobile
				},
				// NOTE define _tickEntries
				queueNextTick: function (callback, ctx) {
					if (!AIO._tickEntries)
						AIO._tickEntries = [];

					AIO._tickEntries.push({
						ctx: ctx,
						callback: callback
					});

					if (AIO._queueTick)
						return;

					AIO._queueTick = Promise.resolve().then(function () {
						AIO._queueTick = null;
						var entries = AIO._tickEntries;
						AIO._tickEntries = [];
						for (var i = 0; i < entries.length; i++)
							entries[i].callback.call(entries[i].ctx);
					});
				},
				// NOTE define _frameTickEntries
				queueNextFrameTick: function (callback, ctx) {
					if (!AIO._frameTickEntries)
						AIO._frameTickEntries = [];

					AIO._frameTickEntries.push({
						ctx: ctx,
						callback: callback
					});

					if (AIO._queueFrameTick)
						return;

					AIO._queueFrameTick = requestAnimationFrame(function () {
						AIO._queueFrameTick = null;
						setTimeout(function (entries) {
							for (var i = 0; i < entries.length; i++)
								entries[i].callback.call(entries[i].ctx);

						}, 0, AIO._frameTickEntries);
						AIO._frameTickEntries = [];
					})
				},
				// NOTE layoutHand -> layout
				layoutHand: function () {
					AIO.layout.updateHand();
				},
				// NOTE layoutDiscard -> layout
				layoutDiscard: function () {
					AIO.layout.updateDiscard();
				},


				ResizeSensor: (function () {
					function ResizeSensor(element) {
						this.element = element;
						this.width = element.clientWidth || 1;
						this.height = element.clientHeight || 1;
						this.maximumWidth = 10000 * (this.width);
						this.maximumHeight = 10000 * (this.height);
						this.events = [];

						var expand = document.createElement('div');
						expand.style.cssText = 'position:absolute;top:0;bottom:0;left:0;right:0;z-index=-10000;overflow:hidden;visibility:hidden;transition:all 0s;';
						var shrink = expand.cloneNode(false);

						var expandChild = document.createElement('div');
						expandChild.style.cssText = 'transition: all 0s !important; animation: none !important;';
						var shrinkChild = expandChild.cloneNode(false);

						expandChild.style.width = this.maximumWidth + 'px';
						expandChild.style.height = this.maximumHeight + 'px';
						shrinkChild.style.width = '250%';
						shrinkChild.style.height = '250%';

						expand.appendChild(expandChild);
						shrink.appendChild(shrinkChild);
						element.appendChild(expand);
						element.appendChild(shrink);
						if (expand.offsetParent != element) {
							element.style.position = 'relative';
						}

						expand.scrollTop = shrink.scrollTop = this.maximumHeight;
						expand.scrollLeft = shrink.scrollLeft = this.maximumWidth;

						var sensor = this;
						sensor.onscroll = function (e) {
							sensor.w = sensor.element.clientWidth || 1;
							sensor.h = sensor.element.clientHeight || 1;

							if (sensor.w != sensor.width || sensor.h != sensor.height) {
								sensor.width = sensor.w;
								sensor.height = sensor.h;
								sensor.dispatchEvent();
							}

							expand.scrollTop = shrink.scrollTop = sensor.maximumHeight;
							expand.scrollLeft = shrink.scrollLeft = sensor.maximumWidth;
						};

						expand.addEventListener('scroll', sensor.onscroll);
						shrink.addEventListener('scroll', sensor.onscroll);
						sensor.expand = expand;
						sensor.shrink = shrink;
					}

					ResizeSensor.prototype.addListener = function (callback, capture) {
						if (this.events == undefined) this.events = [];
						this.events.push({
							callback: callback,
							capture: capture,
						});
					};

					ResizeSensor.prototype.dispatchEvent = function () {
						var capture = true;
						var evt;

						for (var i = 0; i < this.events.length; i++) {
							evt = this.events[i];
							if (evt.capture) {
								evt.callback();
							} else {
								capture = false;
							}
						}

						if (!capture) {
							requestAnimationFrame(this.dispatchFrameEvent.bind(this));
						}
					};

					ResizeSensor.prototype.dispatchFrameEvent = function () {
						var evt;
						for (var i = 0; i < this.events.length; i++) {
							evt = this.events[i];
							if (!evt.capture)
								evt.callback();
						}
					};

					ResizeSensor.prototype.close = function () {
						this.expand.removeEventListener('scroll', this.onscroll);
						this.shrink.removeEventListener('scroll', this.onscroll);

						if (!this.element) {
							this.element.removeChild(this.expand);
							this.element.removeChild(this.shrink);
						}

						this.events = null;
					};

					return ResizeSensor;
				})(),


				// NOTE get -> AIOlib.CubicBezierEase,dataset,boundsCaches

				get: {
					judgeEffect: function (name, value) {
						switch (name) {
							case 'caomu': case '草木皆兵':
							case 'fulei': case '浮雷':
							case 'shandian': case '闪电':
							case 'bingliang': case '兵粮寸断':
							case 'lebu': case '乐不思蜀':
								return value < 0 ? true : false;
						}
						return value;
					},

					isWebKit: function () {
						return document.body.style.webkitBoxShadow !== undefined;
					},

					lerp: function (min, max, fraction) {
						return (max - min) * fraction + min;
					},

					ease: function (fraction) {
						if (!AIO.get._bezier3) AIO.get._bezier3 = new AIOlib.CubicBezierEase(0.25, 0.1, 0.25, 1); // MARK AIOlib.CubicBezierEase
						return AIO.get._bezier3.ease(fraction);
					},

					extend: function (target, source) {
						if (source === null || typeof source !== 'object') return target;

						var keys = Object.keys(source);
						var i = keys.length;
						while (i--) {
							target[keys[i]] = source[keys[i]];
						}

						return target;
					},

					bodySize: function () {
						var size = AIO.dataset.bodySize; // MARK dataset
						if (!size.updated) {
							var body = document.body;
							size.updated = true;
							size.height = body.clientHeight; // NOTE 过时的长宽获取
							size.width = body.clientWidth;
						}
						return size;
					},

					bestValueCards: function (cards, player) {
						if (!player) player = _status.event.player;

						var matchs = [];
						var basics = [];
						var equips = [];
						var hasEquipSkill = player.hasSkill('xiaoji');
						cards.sort(function (a, b) {
							return get.value(b, player) - get.value(a, player);
						});

						for (var i = 0; i >= 0 && i < cards.length; i++) {
							var limited = false;
							switch (get.type(cards[i])) {
								case 'basic':
									for (var j = 0; j < basics.length; j++) {
										if (!cards[i].toself && basics[j].name == cards[i].name) {
											limited = true;
											break;
										}
									}
									if (!limited) basics.push(cards[i]);
									break;

								case 'equip':
									if (hasEquipSkill) break;
									for (var j = 0; j < equips.length; j++) {
										if (get.subtype(equips[j]) == get.subtype(cards[i])) {
											limited = true;
											break;
										}
									}
									if (!limited) equips.push(cards[i]);
									break;
							}

							if (!limited) {
								matchs.push(cards[i]);
								cards.splice(i--, 1);
							}
						}

						cards.sort(function (a, b) {
							return get.value(b, player) - get.value(a, player);
						});

						cards = matchs.concat(cards);
						return cards;
					},
					cheatJudgeCards: function (cards, judges, friendly) {
						if (!cards || !judges) throw arguments;

						var cheats = [];
						var judgeCost;
						for (var i = 0; i < judges.length; i++) {
							var judge = get.judge(judges[i]);
							if (typeof judge != 'function') {
								judge = function () {
									return 1;
								};
							}
							cards.sort(function (a, b) {
								return friendly ? judge(b) - judge(a) : judge(a) - judge(b);
							});

							judgeCost = judge(cards[0]);
							if ((friendly && judgeCost >= 0) || (!friendly && judgeCost < 0)) {
								cheats.push(cards.shift());
							} else {
								break;
							}
						}

						return cheats;
					},

					elementLeftFromWindow: function (element) {
						var left = element.offsetLeft;
						var current = element.offsetParent;

						while (current != null) {
							left += current.offsetLeft;
							current = current.offsetParent;
						}

						return left;
					},
					elementTopFromWindow: function (element) {
						var top = element.offsetTop;
						var current = element.offsetParent;

						while (current != null) {
							top += current.offsetTop;
							current = current.offsetParent;
						}

						return top;
					},

					handcardInitPos: function () {
						var hand = AIO.boundsCaches.hand; // MARK boundsCaches
						if (!hand.updated)
							hand.update();

						var cardW = hand.cardWidth;
						var cardH = hand.cardHeight;
						var scale = hand.cardScale;

						var x = -Math.round((cardW - cardW * scale) / 2);
						var y = ((cardH * scale - cardH) / 2);

						return {
							x: x,
							y: y,
							scale: scale
						};
					},
				},
				sheet: {
					init: function () {
						if (!this.sheetList) {
							this.sheetList = [];
							for (var i = 0; i < document.styleSheets.length; i++) { // MARK encodeURI(ExtensionName)
								if (document.styleSheets[i].href && document.styleSheets[i].href.indexOf('extension/' + encodeURI(ExtensionName)) != -1) {
									this.sheetList.push(document.styleSheets[i]);
								}
							}
						}

						if (this.sheetList) delete this.init;
					},
					getStyle: function (selector, cssName) {
						if (!this.sheetList) this.init();
						if (!this.sheetList) throw 'sheet not loaded';
						if ((typeof selector != 'string') || !selector) throw 'parameter "selector" error';
						if (!this.cachedSheet) this.cachedSheet = {};
						if (this.cachedSheet[selector]) return this.cachedSheet[selector];


						var sheetList = this.sheetList;
						var sheet;
						var shouldBreak = false;

						for (var j = sheetList.length - 1; j >= 0; j--) {
							if (typeof cssName == 'string') {
								cssName = cssName.replace(/.css/, '') + '.css';
								for (var k = j; k >= 0; k--) {
									if (sheetList[k].href.indexOf(cssName) != -1) {
										sheet = sheetList[k];
									}
								}

								shouldBreak = true;
								if (!sheet) throw 'cssName not found';
							} else {
								sheet = sheetList[j];
							}

							for (var i = 0; i < sheet.cssRules.length; i++) {
								if (!(sheet.cssRules[i] instanceof CSSMediaRule)) {
									if (sheet.cssRules[i].selectorText == selector) {
										this.cachedSheet[selector] = sheet.cssRules[i].style;
										return sheet.cssRules[i].style;
									}
								} else {
									var rules = sheet.cssRules[i].cssRules;
									for (var j = 0; j < rules.length; j++) {
										if (rules[j].selectorText == selector) {
											return rules[j].style;
										}
									}
								}
							}


							if (shouldBreak) break;
						}

						return null;
					},
					insertRule: function (rule, index, cssName) {
						if (!this.sheetList) this.init();
						if (!this.sheetList) throw 'sheet not loaded';
						if ((typeof rule != 'string') || !rule) throw 'parameter "rule" error';

						var sheet;
						if (typeof cssName == 'string') {
							for (var j = sheetList.length - 1; j >= 0; j--) {
								cssName = cssName.replace(/.css/, '') + '.css';
								if (sheetList[j].href.indexOf(cssName) != -1) {
									sheet = sheetList[k];
								}
							}

							if (!sheet) throw 'cssName not found';
						}

						if (!sheet) sheet = this.sheetList[this.sheetList.length - 1];
						var inserted = 0;
						if (typeof index == 'number') {
							inserted = sheet.insertRule(rule, index);
						} else {
							inserted = sheet.insertRule(rule, sheet.cssRules.length);
						}

						return sheet.cssRules[inserted].style;
					}
				},
				// NOTE get.bodySize
				create: {
					skillDialog: function () {
						var dialog = document.createElement('div');
						dialog.className = 'skill-dialog';

						var extend = {
							caption: undefined,
							tip: undefined,

							open: function (customParent) {
								if (!customParent) {
									var size = AIO.get.bodySize(); // MARK get.bodySize
									this.style.minHeight = (parseInt(size.height * 0.42)) + 'px';
									if (this.parentNode != ui.arena) ui.arena.appendChild(this);
								}

								this.style.animation = 'open-dialog 0.4s';
								return this;
							},
							show: function () {
								this.style.animation = 'open-dialog 0.4s';;
							},
							hide: function () {
								this.style.animation = 'close-dialog 0.1s forwards';
							},
							close: function () {
								var func = function (e) {
									if (e.animationName != 'close-dialog') return;
									this.remove();
									this.removeEventListener('animationend', func);
								};

								var animation = 'close-dialog';
								if (this.style.animationName == animation) {
									setTimeout(function (dialog) {
										dialog.remove();
									}, 100, this);
								} else {
									this.style.animation = animation + ' 0.1s forwards';
									this.addEventListener('animationend', func);
								}
							},

							appendControl: function (text, clickFunc) {
								var control = document.createElement('div');
								control.className = 'control-button';
								control.textContent = text;
								if (clickFunc) {
									control.addEventListener('click', clickFunc);
								}

								return this.$controls.appendChild(control);
							},

							$caption: AIO.element.create('caption', dialog), // MARK element.create
							$content: AIO.element.create('content', dialog),
							$tip: AIO.element.create('tip', dialog),
							$controls: AIO.element.create('controls', dialog),
						};
						AIO.get.extend(dialog, extend); // MARK get.extend

						Object.defineProperties(dialog, {
							caption: {
								configurable: true,
								get: function () {
									return this.$caption.innerHTML;
								},
								set: function (value) {
									if (this.$caption.innerHTML == value) return;
									this.$caption.innerHTML = value;
								},
							},
							tip: {
								configurable: true,
								get: function () {
									return this.$tip.innerHTML;
								},
								set: function (value) {
									if (this.$tip.innerHTML == value) return;
									this.$tip.innerHTML = value;
								},
							},
						});

						return dialog;
					},

					compareDialog: function (player, target) {
						var dialog = AIO.create.skillDialog();
						dialog.classList.add('compare');
						dialog.$content.classList.add('buttons');

						var extend = {
							player: undefined,
							target: undefined,
							playerCard: undefined,
							targetCard: undefined,

							$player: AIO.element.create('player-character player1', dialog.$content),
							$target: AIO.element.create('player-character player2', dialog.$content),
							$playerCard: AIO.element.create('player-card', dialog.$content),
							$targetCard: AIO.element.create('target-card', dialog.$content),
							$vs: AIO.element.create('vs', dialog.$content),
						};
						AIO.get.extend(dialog, extend);

						AIO.element.create('image', dialog.$player),
							AIO.element.create('image', dialog.$target),

							Object.defineProperties(dialog, {
								player: {
									configurable: true,
									get: function () {
										return this._player;
									},
									set: function (value) {
										if (this._player == value) return;
										this._player = value;

										if (value == null || value.isUnseen()) {
											this.$player.firstChild.style.backgroundImage = '';
										} else {
											this.$player.firstChild.style.backgroundImage = (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
										}

										if (value) this.$playerCard.dataset.text = `${get.translation(value).replace(/<br>/g, '\n')}发起`;
									},
								},
								target: {
									configurable: true,
									get: function () {
										return this._target;
									},
									set: function (value) {
										if (this._target == value) return;
										this._target = value;
										if (value == null || value.isUnseen()) {
											this.$target.firstChild.style.backgroundImage = '';
										} else {
											this.$target.firstChild.style.backgroundImage = (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
										}

										if (value) this.$targetCard.dataset.text = get.translation(value).replace(/<br>/g, '\n');
									},
								},
								playerCard: {
									configurable: true,
									get: function () {
										return this._playerCard;
									},
									set: function (value) {
										if (this._playerCard == value) return;
										if (this._playerCard) this._playerCard.remove();
										this._playerCard = value;
										if (value) this.$playerCard.appendChild(value);
									},
								},
								targetCard: {
									configurable: true,
									get: function () {
										return this._targetCard;
									},
									set: function (value) {
										if (this._targetCard == value) return;
										if (this._targetCard) this._targetCard.remove();
										this._targetCard = value;
										if (value) this.$targetCard.appendChild(value);
									},
								},
							});

						if (player) dialog.player = player;
						if (target) dialog.target = target;

						return dialog;
					},

				},
				dialog:{
					create:function(className, parentNode, tagName){
						var element = !tagName ? document.createElement('div') : document.createElement(tagName);
						for(var i in AIO.dialog){
							if (AIO.dialog[i]) element[i] = AIO.dialog[i];
						}

						element.listens = {};
						for(var i in AIO.dialog.listens){
							if (AIO.dialog.listens[i]) element.listens[i] = decadeUI.dialog.listens[i];
						}

						element.listens._dialog = element;
						element.listens._list = [];

						if (className) element.className = className;
						if (parentNode) parentNode.appendChild(element);

						return element;
					},
					open:function(){
						if (this == AIO.dialog) return console.error('undefined');
					},
					show:function(){
						if (this == AIO.dialog) return console.error('undefined');

						this.classList.remove('hidden');
					},
					hide:function(){
						if (this == AIO.dialog) return console.error('undefined');

						this.classList.add('hidden');
					},
					animate:function(property, duration, toArray, fromArrayOptional){
						if (this == AIO.dialog) return console.error('undefined');
						if (property == null || duration == null || toArray == null) return console.error('arguments');

						var propArray = property.replace(/\s*/g, '').split(',');
						if (!propArray || propArray.length == 0) return console.error('property');

						var realDuration = 0;
						if (duration.lastIndexOf('s') != -1){
							if (duration.lastIndexOf('ms') != -1){
								duration = duration.replace(/ms/, '');
								duration = parseInt(duration);
								if (isNaN(duration)) return console.error('duration');
								realDuration = duration;
							}else{
								duration = duration.replace(/s/, '');
								duration = parseFloat(duration);
								if (isNaN(duration)) return console.error('duration');
								realDuration = duration * 1000;
							}
						}else {
							duration = parseInt(duration);
							if (isNaN(duration)) return console.error('duration');
							realDuration = duration;
						}

						if (fromArrayOptional){
							for (var i = 0; i < propArray.length; i++){
								this.style.setProperty(propArray[i], fromArrayOptional[i]);
							}
						}

						var duraBefore = this.style.transitionDuration;
						var propBefore = this.style.transitionProperty;
						this.style.transitionDuration = realDuration + 'ms';
						this.style.transitionProperty = property;

						ui.refresh(this);
						for (var i = 0; i < propArray.length; i++){
							this.style.setProperty(propArray[i], toArray[i]);
						}

						var restore = this;
						setTimeout(function(){
							restore.style.transitionDuration = duraBefore;
							restore.style.transitionProperty = propBefore;
						}, realDuration);
					},
					close:function(delayTime, fadeOut){
						if (this == AIO.dialog) return console.error('undefined');
						this.listens.clear();

						if (!this.parentNode) return;

						if (fadeOut === true && delayTime) {
							this.animate('opacity', delayTime, 0);
						}

						if (delayTime) {
							var remove = this;
							delayTime = (typeof delayTime == 'number') ? delayTime : parseInt(delayTime);
							setTimeout(function(){
								if (remove.parentNode) remove.parentNode.removeChild(remove);
							}, delayTime);
							return;
						}

						this.parentNode.removeChild(this);
						return;
					},
					listens:{
						add:function(listenElement, event, func, useCapture){
							if (!this._dialog || !this._list) return console.error('undefined');
							if (!(listenElement instanceof HTMLElement) || !event || (typeof func !== 'function')) return console.error('arguments');

							this._list.push(new Array(listenElement, event, func));
							listenElement.addEventListener(event, func);
						},
						remove:function(listenElementOptional, eventOptional, funcOptional){
							if (!this._dialog || !this._list) return console.error('undefined');

							var list = this._list;
							if (listenElementOptional && eventOptional && funcOptional){
								var index = list.indexOf(new Array(listenElementOptional, eventOptional, funcOptional));
								if (index != -1){
									list[index][0].removeEventListener(list[index][1], list[index][2]);
									list.splice(index, 1);
									return;
								}
							}else if (listenElementOptional && eventOptional){
								for (var i = list.length - 1; i >= 0; i--){
									if (list[i][0] == listenElementOptional && list[i][1] == eventOptional){
										list[i][0].removeEventListener(list[i][1], list[i][2]);
										list.splice(i, 1);
									}
								}
							}else if (listenElementOptional && funcOptional){
								for (var i = list.length - 1; i >= 0; i--){
									if (list[i][0] == listenElementOptional && list[i][2] == funcOptional){
										list[i][0].removeEventListener(list[i][1], list[i][2]);
										list.splice(i, 1);
									}
								}
							}else if (eventOptional && funcOptional){
								for (var i = list.length - 1; i >= 0; i--){
									if (list[i][1] == eventOptional && list[i][2] == funcOptional){
										list[i][0].removeEventListener(list[i][1], list[i][2]);
										list.splice(i, 1);
									}
								}
							}else if (listenElementOptional){
								for (var i = list.length - 1; i >= 0; i--){
									if (list[i][0] == listenElementOptional){
										list[i][0].removeEventListener(list[i][1], list[i][2]);
										list.splice(i, 1);
									}
								}
							}else if (eventOptional){
								for (var i = list.length - 1; i >= 0; i--){
									if (list[i][1] == eventOptional){
										list[i][0].removeEventListener(list[i][1], list[i][2]);
										list.splice(i, 1);
									}
								}
							}else if (funcOptional){
								for (var i = list.length - 1; i >= 0; i--){
									if (list[i][2] == funcOptional){
										list[i][0].removeEventListener(list[i][1], list[i][2]);
										list.splice(i, 1);
									}
								}
							}
						},
						clear:function(){
							if (!this._dialog || !this._list) return console.error('undefined');

							var list = this._list;
							for (var i = list.length - 1; i >= 0; i--){
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list[i] = undefined;
							}
							list.length = 0;
						}
					}
				},
				// NOTE layout -> boundsCaches,queueNextFrameTick,layoutDiscard,isMobile,dataset,sheet,
				//  zooms,getCardBestScale,getHandCardSize
				layout: {
					update: function () {
						this.updateHand();
						this.updateDiscard();

					},
					updateHand: function () {
						if (!game.me)
							return;

						var handNode = ui.handcards1;
						if (!handNode)
							return console.error('hand undefined');

						var card;
						var cards = [];
						var childs = handNode.childNodes;
						for (var i = 0; i < childs.length; i++) {
							card = childs[i];
							if (!card.classList.contains('removing')) {
								cards.push(card);
							} else {
								card.scaled = false;
							}
						}

						if (!cards.length)
							return;

						var bounds = AIO.boundsCaches.hand; // MARK boundsCaches
						bounds.check();

						var pw = bounds.width;
						var ph = bounds.height;
						var cw = bounds.cardWidth;
						var ch = bounds.cardHeight;
						var cs = bounds.cardScale;

						var csw = cw * cs;
						var x;
						var y = Math.round((ch * cs - ch) / 2);

						var xMargin = csw + 2;
						var xStart = (csw - cw) / 2;
						var totalW = cards.length * csw + (cards.length - 1) * 2;
						var limitW = pw;
						var expand;

						if (totalW > limitW) {
							xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
							if (lib.config.fold_card) {
								var foldCardMinWidth = lib.config['extension_AllInOne_foldCardMinWidth']; // NOTE 读取配置手牌最小宽度
								var min = cs;
								if (foldCardMinWidth == 'cardWidth') {
									min *= cw;
								} else {
									min *= (foldCardMinWidth && foldCardMinWidth.length ? parseInt(foldCardMinWidth) : 81);
								}
								if (xMargin < min) {
									expand = true;
									xMargin = min;
								}
							}
						} else {
							xStart += (limitW - totalW) / 2;
						}

						var card;
						for (var i = 0; i < cards.length; i++) {
							x = Math.round(xStart + i * xMargin);
							card = cards[i];
							card.tx = x;
							card.ty = y;
							card.scaled = true;
							card.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + cs + ')';
							card._transform = card.style.transform;
						}

						if (expand) {
							ui.handcards1Container.style.overflowX = 'scroll';
							ui.handcards1Container.style.overflowY = 'hidden';
							handNode.style.width = Math.round(cards.length * xMargin + (csw - xMargin)) + 'px';
						} else {
							ui.handcards1Container.style.overflowX = '';
							ui.handcards1Container.style.overflowY = '';
							handNode.style.width = '100%';
						}
					},
					updateDiscard: function () {
						if (!ui.thrown)
							ui.thrown = [];

						for (var i = ui.thrown.length - 1; i >= 0; i--) {
							if (ui.thrown[i].classList.contains('drawingcard') ||
								ui.thrown[i].classList.contains('removing') ||
								ui.thrown[i].parentNode != ui.arena || ui.thrown[i].fixed) {
								ui.thrown.splice(i, 1);
							} else {
								ui.thrown[i].classList.remove('removing');
							}
						}

						if (!ui.thrown.length)
							return;

						var cards = ui.thrown;
						var bounds = AIO.boundsCaches.arena; // MARK boundsCaches
						bounds.check();

						var pw = bounds.width;
						var ph = bounds.height;
						var cw = bounds.cardWidth;
						var ch = bounds.cardHeight;
						var cs = bounds.cardScale;

						var csw = cw * cs;
						var x;
						var y = Math.round((ph - ch) / 2);

						var xMargin = csw + 2;
						var xStart = (csw - cw) / 2;
						var totalW = cards.length * csw + (cards.length - 1) * 2;
						var limitW = pw;

						if (totalW > limitW) {
							xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
						} else {
							xStart += (limitW - totalW) / 2;
						}

						var card;
						for (var i = 0; i < cards.length; i++) {
							x = Math.round(xStart + i * xMargin);
							card = cards[i];
							card.tx = x;
							card.ty = y;
							card.scaled = true;
							card.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + cs + ')';
						}
					},
					clearout: function (card) {
						if (!card)
							return;

						if (card.fixed || card.classList.contains('removing'))
							return;

						if (ui.thrown.indexOf(card) == -1) {
							ui.thrown.splice(0, 0, card);
							AIO.queueNextFrameTick(AIO.layoutDiscard, AIO); // MARK queueNextFrameTick,layoutDiscard
						}

						card.classList.add('invalided');
						setTimeout(function (card) {
							card.remove();
							AIO.queueNextFrameTick(AIO.layoutDiscard, AIO);// MARK queueNextFrameTick,layoutDiscard
						}, 2333, card);
					},
					delayClear: function () {
						var timestamp = 500;
						var nowTime = new Date().getTime();
						if (this._delayClearTimeout) {
							clearTimeout(this._delayClearTimeout);
							timestamp = nowTime - this._delayClearTimeoutTime;
							if (timestamp > 1000) {
								this._delayClearTimeout = null;
								this._delayClearTimeoutTime = null;
								ui.clear();
								return;
							}
						} else {
							this._delayClearTimeoutTime = nowTime;
						}

						this._delayClearTimeout = setTimeout(function () {
							AIO.layout._delayClearTimeout = null;
							AIO.layout._delayClearTimeoutTime = null;
							ui.clear();
						}, timestamp);
					},
					invalidate: function () {
						this.invalidateHand();
						this.invalidateDiscard();
					},
					invalidateHand: function (debugName) {
						//TODO 和上下面的有点重复，有空合并
						var timestamp = 40;
						var nowTime = new Date().getTime();
						if (this._handcardTimeout) {
							clearTimeout(this._handcardTimeout);
							timestamp = nowTime - this._handcardTimeoutTime;
							if (timestamp > 180) {
								this._handcardTimeout = null;
								this._handcardTimeoutTime = null;
								this.updateHand();
								return;
							}
						} else {
							this._handcardTimeoutTime = nowTime;
						}

						this._handcardTimeout = setTimeout(function () {
							AIO.layout._handcardTimeout = null;
							AIO.layout._handcardTimeoutTime = null;
							AIO.layout.updateHand();
						}, timestamp);
					},
					invalidateDiscard: function () {
						var timestamp = (ui.thrown && ui.thrown.length > 15) ? 80 : 40;
						var nowTime = new Date().getTime();
						if (this._discardTimeout) {
							clearTimeout(this._discardTimeout);
							timestamp = nowTime - this._discardTimeoutTime;
							if (timestamp > 180) {
								this._discardTimeout = null;
								this._discardTimeoutTime = null;
								this.updateDiscard();
								return;
							}
						} else {
							this._discardTimeoutTime = nowTime;
						}

						this._discardTimeout = setTimeout(function () {
							AIO.layout._discardTimeout = null;
							AIO.layout._discardTimeoutTime = null;
							AIO.layout.updateDiscard();
						}, timestamp);
					},
					resize: function () {
						if (AIO.isMobile()) { // MARK isMobile
							ui.arena.classList.add('AIO-mobile');
							ui.window.classList.add('AIO-mobile');
						}
						else {
							ui.arena.classList.remove('AIO-mobile');
							ui.window.classList.remove('AIO-mobile');
						}

						var set = AIO.dataset; // MARK dataset
						set.animSizeUpdated = false;
						set.bodySize.updated = false;

						var caches = AIO.boundsCaches; // MARK boundsCaches
						for (var key in caches)
							caches[key].updated = false;
						// MARK sheet
						var buttonsWindow = AIO.sheet.getStyle('#window > .dialog.popped .buttons:not(.smallzoom)');
						if (!buttonsWindow) {
							buttonsWindow = AIO.sheet.insertRule('#window > .dialog.popped .buttons:not(.smallzoom) { zoom: 1; }');
						}

						var buttonsArena = AIO.sheet.getStyle('#arena:not(.choose-character) .buttons:not(.smallzoom)');
						if (!buttonsArena) {
							buttonsArena = AIO.sheet.insertRule('#arena:not(.choose-character) .buttons:not(.smallzoom) { zoom: 1; }');
						}
						// MARK zooms,getCardBestScale,getHandCardSize
						AIO.zooms.card = AIO.getCardBestScale();
						if (ui.me) {
							var height = Math.round(AIO.getHandCardSize().height * AIO.zooms.card + 30.4) + 'px';
							ui.me.style.height = height;
						}
						if (buttonsArena) {
							buttonsArena.zoom = AIO.zooms.card;
						}
						if (buttonsWindow) {
							buttonsWindow.zoom = AIO.zooms.card;
						}

						AIO.layout.invalidate();
					},

				},
				handler: {
					handMousewheel: function (e) {
						if (!ui.handcards1Container) return console.error('ui.handcards1Container');

						var hand = ui.handcards1Container;
						if (hand.scrollNum == void 0) hand.scrollNum = 0;
						if (hand.lastFrameTime == void 0) hand.lastFrameTime = performance.now();

						function handScroll() {
							var now = performance.now();
							var delta = now - hand.lastFrameTime;
							var num = Math.round(delta / 16 * 16);
							hand.lastFrameTime = now;

							if (hand.scrollNum > 0) {
								num = Math.min(hand.scrollNum, num);
								hand.scrollNum -= num;
							} else {
								num = Math.min(-hand.scrollNum, num);
								hand.scrollNum += num;
								num = -num;
							}

							if (hand.scrollNum == 0) {
								hand.frameId = void 0;
								hand.lastFrameTime = void 0;
							} else {
								hand.frameId = requestAnimationFrame(handScroll);
								ui.handcards1Container.scrollLeft += num;
							}
						}

						if (e.wheelDelta > 0) {
							hand.scrollNum -= 84;
						} else {
							hand.scrollNum += 84;
						}

						if (hand.frameId == void 0) {
							hand.frameId = requestAnimationFrame(handScroll);
						}
					},
					touchScroll: function (e) {
						if (_status.mousedragging) return;
						if (_status.draggingtouchdialog) return;
						if (!_status.dragged) {
							if (Math.abs(e.touches[0].clientX / game.documentZoom - this.startX) > 10 ||
								Math.abs(e.touches[0].clientY / game.documentZoom - this.startY) > 10) {
								_status.dragged = true;
							}
						}
						if ((this == ui.handcards1Container || this == ui.handcards2Container) && !this.style.overflowX == 'scroll') {
							e.preventDefault();
						} else if (lib.device == 'ios' && this.scrollHeight <= this.offsetHeight + 5 && this.scrollWidth <= this.offsetWidth + 5) {
							e.preventDefault();
						} else {
							delete _status._swipeorigin;
							e.stopPropagation();
						}
					},
				},
				element: {
					base: {
						removeSelf: function (milliseconds) {
							var remove = this;
							if (milliseconds) {
								milliseconds = (typeof milliseconds == 'number') ? milliseconds : parseInt(milliseconds);
								setTimeout(function () {
									if (remove.parentNode) remove.parentNode.removeChild(remove);
								}, milliseconds);
								return;
							}

							if (remove.parentNode) remove.parentNode.removeChild(remove);
							return;
						}
					},
					create: function (className, parentNode, tagName) {
						var tag = tagName == void 0 ? 'div' : tagName;
						var element = document.createElement(tag);
						element.view = {};

						for (var key in this.base) {
							element[key] = this.base[key];
						}

						if (className)
							element.className = className;

						if (parentNode)
							parentNode.appendChild(element);

						return element;
					},
					clone: function (element) {

					},
				},
				dataset: {
					animSizeUpdated: false,
					bodySizeUpdated: false,
					bodySize: {
						height: 1,
						width: 1,
						updated: false,
					},
				},
				statics: {
					handTips: []
				},
				zooms: {
					body: 1,
					card: 1,
				},
			};

			// NOTE 立即执行函数最好放在外面，避免对象未定义
			AIO.BoundsCache = (function () {
				function BoundsCache(element, updateBefore) {
					this.element = element;
					this.updateBefore = updateBefore;
					this.updated = false;
					Object.defineProperties(this, {
						x: {
							configurable: true,
							get: function () {
								if (!this.updated) this.update();
								return this._x;
							},
							set: function (value) {
								this._x == value;
							}
						},
						y: {
							configurable: true,
							get: function () {
								if (!this.updated) this.update();
								return this._y;
							},
							set: function (value) {
								this._y == value;
							}
						},
						width: {
							configurable: true,
							get: function () {
								if (!this.updated) this.update();
								return this._width;
							},
							set: function (value) {
								this._width == value;
							}
						},
						height: {
							configurable: true,
							get: function () {
								if (!this.updated) this.update();
								return this._height;
							},
							set: function (value) {
								this._height == value;
							}
						},
					});
				};

				BoundsCache.prototype.check = function () {
					if (!this.updated)
						this.update();
				};
				BoundsCache.prototype.update = function () {
					if (this.updateBefore)
						this.updateBefore();

					var element = this.element;
					this.updated = true;
					if (element == undefined) return;
					this._x = element.offsetLeft;
					this._y = element.offsetTop;
					this._width = element.offsetWidth;
					this._height = element.offsetHeight;
				};

				return BoundsCache;
			})();
			/**
			 * NOTE boundsCaches -> BoundsCache,getCardBestScale,element.create
			 * @type {{}}
			 */
			AIO.boundsCaches = (function (boundsCaches) {
				boundsCaches.window = new AIO.BoundsCache(null, function () { // MARK BoundsCache
					this.element = ui.window;
				});
				boundsCaches.arena = new AIO.BoundsCache(null, function () { // MARK BoundsCache
					this.element = ui.arena;
					if (ui.arena == null)
						return;

					this.cardScale = AIO.getCardBestScale(); // MARK getCardBestScale
					if (this.cardWidth != null)
						return;

					var childs = ui.arena.childNodes;
					for (var i = 0; i < childs.length; i++) {
						if (childs[i].classList.contains('card')) {
							this.cardWidth = childs[i].offsetWidth;
							this.cardHeight = childs[i].offsetHeight;
							return;
						}
					}

					var card = AIO.element.create('card'); // MARK element.create
					card.style.opacity = 0;
					ui.arena.appendChild(card);
					this.cardWidth = card.offsetWidth;
					this.cardHeight = card.offsetHeight;
					card.remove();
				});
				boundsCaches.hand = new AIO.BoundsCache(null, function () { // MARK BoundsCache
					this.element = ui.me;
					if (ui.handcards1 == null)
						return;

					this.cardScale = AIO.getCardBestScale(); // MARK getCardBestScale
					if (this.cardWidth != null)
						return;

					var childs = ui.handcards1.childNodes;
					for (var i = 0; i < childs.length; i++) {
						if (childs[i].classList.contains('card')) {
							this.cardWidth = childs[i].offsetWidth;
							this.cardHeight = childs[i].offsetHeight;
							return;
						}
					}

					var card = AIO.element.create('card'); // MARK element.create
					card.style.opacity = 0;
					ui.handcards1.appendChild(card);
					this.cardWidth = card.offsetWidth;
					this.cardHeight = card.offsetHeight;
					card.remove();
				});

				return boundsCaches;
			})({});
		},
		precontent: function () {
			// 加载调试程序
			if (lib.config[`extension_${ExtensionName}_eruda`]) {
				let script = document.createElement('script');
				script.src = AssetPath + 'js/eruda.js';
				document.body.appendChild(script);
				script.onload = function () {
					eruda.init();
				};
			}
			// 确定开启环境
			if (get.mode() == 'chess' || get.mode() == 'tafang') return;
			const extension = lib.extensionMenu[`extension_${ExtensionName}`];
			if (!(extension && extension.enable && extension.enable.init)) return;
			// 生成导入模块
			window.importModule = function (importModule) {
				const version = lib.extensionPack.AllInOne.version;
				// 强制改变布局
				// if (ui.css.layout) {
				// 	if (!ui.css.layout.href || ui.css.layout.href.indexOf('long2') < 0) ui.css.layout.href = lib.assetURL + 'layout/long2/layout.css';
				// }

				importModule.init = function () {
					this.importCss(AssetPath + 'extension.css');
					this.importCss(AssetPath + 'home.css');
					this.importCss(AssetPath + 'menu.css');
					// this.importCss(AssetPath + 'layout.css');
					// this.importCss(AssetPath + 'decadeLayout.css');
					// this.importCss(AssetPath + 'card.css');
					// this.importCss(AssetPath + (lib.config.extension_AllInOne_characterStyle == 'on' ? 'equip.css' : 'equip_new.css'));
					// 当且仅当初次载入时，characterStyle == void 0
					// if (lib.config.extension_AllInOne_characterStyle != void 0) {
					// 	this.importCss(AssetPath + 'player' + parseFloat(['on', 'off', 'othersOn'].indexOf(lib.config.extension_AllInOne_characterStyle) + 1) + '.css');
					// } else {
					// 	this.importCss(AssetPath + 'player1.css');
					// }

					// this.importJs(AssetPath + 'spine.js');
					// this.importJs(AssetPath + 'component.js');
					// this.importJs(AssetPath + 'card.js');
					// this.importJs(AssetPath + 'skill.js');
					// this.importJs(AssetPath + 'content.js');
					// this.importJs(AssetPath + 'effect.js');
					// this.importJs(AssetPath + 'animation.js');
					// this.importJs(AssetPath + 'dynamicSkin.js');

					//避免提示是否下载图片和字体素材
					// if (!lib.config.asset_version) game.saveConfig('asset_version', '无');

					// 根据设置导入相应的css
					// var layoutPath = decadeUIPath + 'shoushaUI/';
					// var bool = (lib.config.extension_AllInOne_characterStyle != 'on');
					// if (!(get.mode() == 'chess' || get.mode() == 'tafang')) {
					// 	let list = ['character', 'lbtn', 'skill'];
					// 	list.forEach(pack => {
					// 		switch (pack) {
					// 			case 'character':
					// 				this.importCss(layoutPath + pack + '/' + (bool ? 'main1' : 'main2') + '.css');
					// 				break;
					// 			default:
					// 				this.importCss(layoutPath + pack + '/' + (bool ? 'main1' : 'main2') + (lib.config.touchscreen ? '' : '_window') + '.css');
					// 				break;
					// 		}
					// 		this.importJs(layoutPath + pack + '/' + (bool ? 'main1.js' : 'main2.js'));
					// 	});
					// }

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
			}({})

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
			interfaceStyle: {
				name: '界面样式',
				intro: '切换界面样式格式',
				init: 'on',
				item: {
					on: '十周年样式',
					off: '手杀样式',
				},
				onclick: function (control) {
					const origin = lib.config['extension_AllInOne_interfaceLayout'];
					game.saveConfig('extension_AllInOne_interfaceLayout', control);
					if (origin != control) {
						setTimeout(() => game.reload(), 100);
					}
				},
				update: function () {
					if (window.AIO) {
						ui.arena.dataset.characterStyle = lib.config['extension_AllInOne_interfaceLayout'];
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
			intro: "基于十周年UI<br>十周年UI原作者：短歌<br>手杀UI原名：界面美化<br>手杀UI原作者：橙续缘<br>预加载修复：诗笺",
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
