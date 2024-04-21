importModule.import(function (lib, game, ui, get, ai, _status) {
	// 保存原有的指示线
	game.originLineXy = game.linexy;
	// 玉龙指示线
	game.jadeDragonLineXy = function(path){
		var from=[path[0],path[1]];
		var to=[path[2],path[3]];
		if(game.chess){
			game.zsPlayLineAnimation('jadeDragonLineXy',ui.chess,1400,[from,to]);
		}else{
			game.zsPlayLineAnimation('jadeDragonLineXy',ui.arena,1400,[from,to]);
		}
	};
	// 经典指示线
	game.classicLineXy = function(path){
		var from=[path[0],path[1]];
		var to=[path[2],path[3]];
		if(game.chess){
			game.zsPlayLineAnimation('classicLineXy',ui.chess,1400,[from,to]);
		}else{
			game.zsPlayLineAnimation('classicLineXy',ui.arena,1400,[from,to]);
		}
	};
	// 暴击指示线
	game.criticalHitsLineXy = function(path){
		var from=[path[0],path[1]];
		var to=[path[2],path[3]];
		if(game.chess){
			game.zsPlayLineAnimation('criticalHitsLineXy',ui.chess,1400,[from,to]);
		}else{
			game.zsPlayLineAnimation('criticalHitsLineXy',ui.arena,1400,[from,to]);
		}
	};

	game.zsPlayLineAnimation = function (name, node, time, points) {
		var src= AssetPath + 'image/indicatorLine/' + name + '.png';
		// 加入暂停，防止出牌太快
		if (time <= 100000) {
			if (!_status.paused2 && !_status.nopause) {
				_status.indicatorPause = true;
				game.pause2();
			}
			if (_status.indicatorPauseCount == undefined) _status.indicatorPauseCount = 0;
			_status.indicatorPauseCount++;
		}

		var div = ui.create.div();
		if (node == undefined || node == false) {
			ui.window.appendChild(div);
		} else {
			node.appendChild(div);
		}
		// 设定样式
		div.style.width = "256px";
		div.style.height = "81px";
		div.style.backgroundSize = "100% 100%";
		div.style.opacity = 1;
		div.style.zIndex = 1001;
		div.style.borderRadius = '5px';
		div.style['pointer-events'] = 'none';

		if (points == undefined){
			div.style.top = 'calc(50% - ' + (div.offsetHeight / 2) + 'px)';
			div.style.left = 'calc(50% - ' + (div.offsetWidth / 2) + 'px)';
		}
		else {
			div.style.top = (points[0][1] - div.offsetHeight / 2) + 'px';
			div.style.left = (points[0][0]) + 'px';

			var timeS = ((time - 450) / 1000) / 2;

			var getAngle = function (x1, y1, x2, y2, bool) {
				var x = x1 - x2;
				var y = y1 - y2;
				var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
				var cos = y / z;
				var radina = Math.acos(cos);
				var angle = 180 / (Math.PI / radina);
				if (x2 > x1 && y2 === y1) angle = 0;
				if (x2 > x1 && y2 < y1) angle = angle - 90;
				if (x2 === x1 && y1 > y2) angle = -90;
				if (x2 < x1 && y2 < y1) angle = 270 - angle;
				if (x2 < x1 && y2 === y1) angle = 180;
				if (x2 < x1 && y2 > y1) angle = 270 - angle;
				if (x2 === x1 && y2 > y1) angle = 90;
				if (x2 > x1 && y2 > y1) angle = angle - 90;
				if (bool == true && angle > 90) angle -= 180;
				return angle;
			};

			var p1 = points[0];
			var p2 = points[1];
			var x0 = p1[0];
			var y0 = p1[1];
			var x1 = p2[0];
			var y1 = p2[1];

			div.style.transition = 'all 0s';
			div.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1, true) + 'deg)' + (x0 > x1 ? '' : ' rotateY(180deg)');
			div.style['transform-origin'] = '0 50%';

			var div2 = ui.create.div();
			div2.style.zIndex = 1000;
			div2.style['pointer-events'] = 'none';
			div2.style.height = '30px';
			div2.style.width = (Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2) + 'px';
			div2.style.left = (x0) + 'px';
			div2.style.top = (y0 - 30) + 'px';
			div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) scaleX(0)';
			div2.style['transform-origin'] = '0 50%';
			div2.style.transition = 'all ' + (timeS * 4 / 3) + 's';

			div2.style.backgroundSize = '100% 100%';
			div2.style.opacity = '1';
			div2.style.backgroundImage = "url(" + src + ")";

			setTimeout(function () {
				div.style.transition = 'all ' + (timeS * 4 / 3) + 's';
				div.style.transform += ' translateX(' + (-(Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2)) + 'px)';
				div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) scaleX(1)';
			}, 50);

			setTimeout(function () {
				div2.style.transition = 'all ' + (timeS * 2 / 3) + 's';
				div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) translateX(' +
					(Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2 -
						Math.pow(Math.pow(div.offsetHeight / 2, 2) + Math.pow(div.offsetWidth / 2, 2), 0.1)) + 'px) scaleX(0.01)';
			}, 50 + timeS * 4 / 3 * 1000);

			node.appendChild(div2);
		}

		if (div2 != undefined) {
			setTimeout(function () {
				div2.hide();
			}, time - 350);
			setTimeout(function () {
				div.hide();
			}, time - 400);
		} else {
			setTimeout(function () {
				div.hide();
			}, time - 350);
		}

		setTimeout(function () {

			if (node == undefined || node == false) {
				ui.window.removeChild(div);
			} else {
				node.removeChild(div);
			}
			if( div2 != undefined) node.removeChild(div2);
			if (time <= 100000) {
				_status.indicatorPauseCount--;
				if (_status.indicatorPause == true && _status.indicatorPauseCount == 0) {
					delete _status.indicatorPause;
					game.resume2();
				}
			}

		}, time);

	};

	if (AIO.config.criticalHitsEffect){
		lib.skill._player_criticalHitsEffect = {
			trigger: {
				source: 'damageBegin4'
			},
			charlotte: true,
			forced: true,
			content: function () {
				'step 0'
				if (trigger.num > 1) {
					game.linexy = game.criticalHitsLineXy;
					player.line(trigger.player);
				}
				'step 1'
				game.linexy = game[lib.config['extension_AIO_indicatorEffect']+'LineXy'];
			},
		}
	}

	game.linexy = game[lib.config['extension_AIO_indicatorEffect']+'LineXy'];
})
