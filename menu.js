importModule.import(function (lib, game, ui, get, ai, _status) {
	lib.arenaReady.push(function () {
		// 游戏右上角添加功能按钮
		var menuBtn = ui.create.node('div');
		menuBtn.style.cssText = "display: block;--w: 56px;--h: calc(var(--w) * 74/71);width: var(--w);height: var(--h);position: absolute;bottom: calc(100% - 69px);left: calc(100% - 112.5px);background-color: transparent;z-index:1"
		menuBtn.style.backgroundImage = "url(" + AssetPath + "image/menu/menuBtn.png)";
		menuBtn.style.backgroundSize = "100%"
		menuBtn.onclick = function () {
			game.playAudio("../"+ AssetPath + 'audio/click.mp3');
			var popuperContainer = ui.create.div('.popup-container', { background: "rgb(0,0,0,0)" }, ui.window);
			popuperContainer.addEventListener('click', event => {
				game.playAudio("../"+ AssetPath + 'audio/back.mp3');
				event.stopPropagation();
				popuperContainer.delete(200);
			});

			var menuBtn_active = ui.create.div('.menuBtn_active', popuperContainer);

			var settingBtn = ui.create.div('.settingBtn', popuperContainer);
			settingBtn.addEventListener('click', event => {
				game.playAudio("../"+ AssetPath + 'audio/button.mp3');

				if (!ui.click.configMenu) return;
				game.closePopped();
				game.pause2();
				ui.click.configMenu();
				ui.system1.classList.remove('shown');
				ui.system2.classList.remove('shown');
			});

			var leaveBtn = ui.create.div('.leaveBtn', popuperContainer);
			leaveBtn.addEventListener('click', event => {
				game.playAudio("../"+ AssetPath + 'audio/button.mp3');
				window.location.reload();
			});

			var bgBtn = ui.create.div('.bgBtn', popuperContainer);
			bgBtn.addEventListener('click', event => {
				game.playAudio("../"+ AssetPath + 'audio/button.mp3');
				//换背景
				var Backgrounds = ["人间安乐", "兵临城下", "兵荒马乱", "三国开黑节", "华灯初上", "天书乱斗", "朝堂之上", "校园行", "桃园风格", "汉室当兴", "游卡桌游", "十周年"];

				ui.background.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/background/" + Backgrounds.randomGet() + ".jpg");

			});

			var surrenderBtn = ui.create.div('.surrenderBtn', popuperContainer);
			surrenderBtn.addEventListener('click', event => {
				game.playAudio("../"+ AssetPath + 'audio/button.mp3');
				game.over();
			});

			var autoBtn = ui.create.div('.autoBtn', popuperContainer);
			autoBtn.addEventListener('click', event => {
				game.playAudio("../"+ AssetPath + 'audio/button.mp3');
				ui.click.auto();
			});

		}
		document.body.appendChild(menuBtn);
	})
})
