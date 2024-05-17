importModule.import(function (lib, game, ui, get, ai, _status) {
	let createArenaFunction = ui.create.arena;
	ui.create.arena = function () {
		ui.updatez();
		let result = createArenaFunction.apply(this, arguments);
		ui.arena.classList.remove('slim_player');
		ui.arena.classList.remove('uslim_player');
		ui.arena.classList.remove('mslim_player');
		ui.arena.classList.remove('lslim_player');
		ui.arena.classList.remove('oldlayout');
		ui.arena.classList.remove('mobile');
		ui.arena.classList.add('AIO');
		ui.control.id = 'AIO-control';

		AIO.config.update();
		return result;
	}
	ui.create.me = function (hasme) {
		ui.arena.dataset.layout = game.layout;

		ui.mebg = ui.create.div('#mebg', ui.arena);
		ui.me = ui.create.div('.hand-wrap', ui.arena);
		ui.handcards1Container = decadeUI.element.create('hand-cards', ui.me);
		ui.handcards1Container.onmousewheel = decadeUI.handler.handMousewheel;

		ui.handcards2Container = ui.create.div('#handcards2');
		ui.arena.classList.remove('nome');

		var equipSolts = ui.equipSolts = decadeUI.element.create('equips-wrap');
		equipSolts.back = decadeUI.element.create('equips-back', equipSolts);
		/*
		decadeUI.element.create('icon icon-treasure', decadeUI.element.create('equip0', equipSolts.back));
		decadeUI.element.create('icon icon-saber', decadeUI.element.create('equip1', equipSolts.back));
		decadeUI.element.create('icon icon-shield', decadeUI.element.create('equip2', equipSolts.back));
		decadeUI.element.create('icon icon-mount', decadeUI.element.create('equip3', equipSolts.back));
		decadeUI.element.create('icon icon-mount', decadeUI.element.create('equip4', equipSolts.back));
		*/
		for (var repetition = 0; repetition < 5; repetition++) {
			var ediv = decadeUI.element.create(null, equipSolts.back);
			ediv.dataset.type = repetition;
		}

		ui.arena.insertBefore(equipSolts, ui.me);
		decadeUI.bodySensor.addListener(decadeUI.layout.resize);
		decadeUI.layout.resize();

		ui.handcards1Container.ontouchstart = ui.click.touchStart;
		ui.handcards2Container.ontouchstart = ui.click.touchStart;
		ui.handcards1Container.ontouchmove = ui.click.touchScroll;
		ui.handcards2Container.ontouchmove = ui.click.touchScroll;
		ui.handcards1Container.style.WebkitOverflowScrolling = 'touch';
		ui.handcards2Container.style.WebkitOverflowScrolling = 'touch';

		if (hasme && game.me) {
			ui.handcards1 = game.me.node.handcards1;
			ui.handcards2 = game.me.node.handcards2;
			ui.handcards1Container.appendChild(ui.handcards1);
			ui.handcards2Container.appendChild(ui.handcards2);
		}
		else if (game.players.length) {
			game.me = game.players[0];
			ui.handcards1 = game.me.node.handcards1;
			ui.handcards2 = game.me.node.handcards2;
			ui.handcards1Container.appendChild(ui.handcards1);
			ui.handcards2Container.appendChild(ui.handcards2);
		}

		/*-----------------分割线-----------------*/
		if (lib.config.extension_十周年UI_aloneEquip) {
			if (game.me) {
				equipSolts.me = game.me;
				equipSolts.equips = game.me.node.equips;
				equipSolts.appendChild(game.me.node.equips);
			}
		}

	};
})
