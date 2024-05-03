export function splashCreate(lib, game, ui, get, ai, _status) {
	var timer, openNum = 0;
	timer = setInterval(splashShow, 17);

	function splashShow() {
		openNum++;
		if (openNum > 50) clearInterval(timer);

		let splash = document.getElementById("splash");
		if (splash) {
			splash.style.display = "none";

			clearInterval(timer);
			//播放音乐
			let BGMusic = document.createElement('audio');
			BGMusic.src = AssetPath + `/audio/splashBG.mp3`;
			BGMusic.autoplay = true;
			BGMusic.loop = true;
			BGMusic.play();

			let SubMenuCreate = function (modeName, modeList) {
				splashBG.style.display = 'none';
				topBar.style.display = 'none';
				bottomBar.style.display = 'none';

				let subMenu = ui.create.div('.subMenu', splashContainer);
				let modeListBox = ui.create.div('.modeListBox', subMenu);

				//返回按钮
				var title = ui.create.div('.title', subMenu);
				var info = ui.create.div('.splash-info', modeName, title);
				var backBtn = ui.create.div('.splash-backBtn', title);

				backBtn.onclick = function () {

					splashBG.style.display = 'block';
					topBar.style.display = 'block';
					bottomBar.style.display = 'block';

					subMenu.remove();
				}

				let selectMode;
				for (let i of modeList.list) {
					let mode = ui.create.div('.mode', i, modeListBox);
					mode.onclick = function () {
						let active = modeListBox.querySelectorAll('.mode.active');
						for (let i of active) {
							i.classList.remove("active");
						}
						mode.classList.add("active");
						selectMode = i;
					}
				}
				// 设置默认
				selectMode = modeList.list[0];
				modeListBox.firstChild.classList.add("active");
				//开战按钮，通过调用原来的点击菜单函数实现
				let start = ui.create.div('.startBtn', subMenu);
				start.onclick = function () {
					_status.touchconfirmed = false;
					for(let i of modeList.list){
						if(selectMode == i){
							modeList[i]();
						}
					}
					_status.touchconfirmed = false;
					setTimeout(() => { splashContainer.remove(); }, 700);
				}
			}

			//顶部栏
			let splashContainer = ui.create.div('.splashContainer', document.body);
			let topBar = ui.create.div('.splash-topBar', splashContainer);
			let logo = ui.create.div('.splash-logo', topBar);

			//大背景
			let splashBG = ui.create.div('.splashBG', splashContainer);
			//主菜单
			// MenuContainer用于保持比例
			let MenuContainer = ui.create.div('.MenuContainer', splashBG);
			let mainMenu = ui.create.div('.splashMenu', MenuContainer);

			//底部栏
			let bottomBar = ui.create.div('.splash-bottomBar', splashContainer);
			let fctList = ui.create.div('.splash-fctList', bottomBar);

			let settingBtn = ui.create.div('.splash-settingBtn', fctList);
			let characterBtn = ui.create.div('.splash-characterBtn', fctList);
			let skinBtn = ui.create.div('.splash-skinBtn', fctList);
			let rankBtn = ui.create.div('.splash-rankBtn', fctList);

			//模式
			let modes = document.querySelectorAll('.splashtext');
			let modeObj = {};
			for (let i = 0; i < modes.length; i++) {
				modeObj[modes[i].innerHTML.replaceAll('<br>', '')] = i;
			}
			//经典身份
			let modeList = {
				list :['军争5','军争8'],
				'军争5':function () {
					game.saveConfig('player_number', 5, 'identity'); modes[modeObj['身份']].click();
				},
				'军争8':function () {
					game.saveConfig('player_number', 8, 'identity'); modes[modeObj['身份']].click();
				}
			}
			let classicIdentity = ui.create.div('.classicIdentity', mainMenu,);
			classicIdentity.onclick = function () {
				SubMenuCreate('经典模式', modeList)
			};
			//国战对决
			let nationalWar = ui.create.div('.nationalWar', mainMenu);
			//双人对决
			let campConfrontation = ui.create.div('.campConfrontation', mainMenu);
			//斗地主
			let againstLandlord = ui.create.div('.againstLandlord', mainMenu);

			//斗地主
			// let doudizhu = ui.create.div('.doudizhu', mainMenu, function () {
			// 	mainMenu.style.display = 'none';
			// 	let subMenu = ui.create.div('.kdiv2', mainBg);
			// 	let box = ui.create.div('.dz-bg2', subMenu);
			// 	let modeBg = ui.create.div('.modebg', box);
			// 	let modeBoxs = ui.create.div('.mode-boxs', subMenu);
			// 	//返回按钮
			// 	ui.create.div('.dz-returnBtn', subMenu, function () {
			// 		mainMenu.style.display = 'inline-block';
			// 		subMenu.delete();
			// 	});
			// 	let modeList = ['休闲', '欢乐', '开黑', '兵临'];
			// 	let selectMode;
			// 	for (let i of modeList) {
			// 		let mode = ui.create.div('.dz-modeBtn', i, modeBoxs, function () {
			// 			qiehuanF(this, modeBoxs, '.dz-modeBtn.active');
			// 			selectMode = i;
			// 			game.saveExtensionConfig('斗转星移', 'exModeConfig_dou', i);
			// 		});
			// 		if (lib.config[`${dzxy.dz}exModeConfig_dou`] == i) {
			// 			mode.classList.add('active');
			// 			selectMode = i;
			// 		}
			// 	}
			// 	//开战
			// 	let kaizhan = ui.create.div('.kaizhan', box, function () {
			// 		_status.touchconfirmed = false;
			// 		switch (selectMode) {
			// 			case '休闲': selectMode = 'normal'; break;
			// 			case '欢乐': selectMode = 'huanle'; break;
			// 			case '开黑': selectMode = 'kaihei'; break;
			// 			case '兵临': selectMode = 'binglin'; break;
			// 		}
			// 		game.saveConfig('doudizhu_mode', selectMode, 'doudizhu');
			// 		modes[modeObj['斗地主']].click()
			// 		_status.touchconfirmed = true;
			// 		setTimeout(() => { mainBg.delete() }, 700);
			// 		BGMusic.pause();
			// 	});
			// });

		}
	}
}
