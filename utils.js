var utils;
(function(utils){
	/**
	 * 节流函数在一定时间间隔内只允许函数被调用一次，以减少函数被频繁调用的情况
	 * @param func 传入函数
	 * @param timeout 时间间隔
	 * @param context 上下文
	 * @returns {(function(): void)|*}
	 */
	utils.throttle = function (func, timeout, context) {
		var args;
		var timer;
		var previous;
		return function () {
			if (timer) clearTimeout(timer);
			if (previous == null) previous = performance.now();
			args = arguments;

			var timestamp = performance.now() - previous;
			if (timestamp >= timeout) {
				timer = null;
				previous = null;
				func.apply(context, args);
			} else {
				timer = setTimeout(function() {
					timer = null;
					previous = null;
					func.apply(context, args);
				}, timeout - timestamp);
			}
		}
	};
	/**
	 *  插值函数
	 * @param min 最大值
	 * @param max 最小值
	 * @param fraction 比例
	 * @returns {*}
	 */
	utils.lerp = function(min, max, fraction){
		return (max - min) * fraction + min;
	};

	/**
	 * 计算缓动效果
	 * @param fraction 缓动的百分比
	 * @returns {*}
	 */
	utils.ease = function(fraction){
		if (!utils.b3ease) utils.b3ease = new utils.CubicBezierEase(0.25, 0.1, 0.25, 1);
		return utils.b3ease.ease(fraction);
	};
	/**
	 * 实现了一个三次贝塞尔曲线的缓动函数，可以用于在动画中实现平滑的缓动效果
	 * @type {CubicBezierEase}
	 */
	utils.CubicBezierEase = (function(){
		/**
		 * 根据控制点计算贝塞尔曲线系数
		 * @param p1x
		 * @param p1y
		 * @param p2x
		 * @param p2y
		 * @constructor
		 */
		function CubicBezierEase (p1x, p1y, p2x, p2y) {
			this.cX = 3 * p1x;
			this.bX = 3 * (p2x - p1x) - this.cX;
			this.aX = 1 - this.cX - this.bX;

			this.cY = 3 * p1y;
			this.bY = 3 * (p2y - p1y) - this.cY;
			this.aY = 1 - this.cY - this.bY;
		}
		/**
		 * 计算给定参数t(0到1之间的值)时贝塞尔曲线在x轴上的值
		 * @param t
		 * @returns {number}
		 */
		CubicBezierEase.prototype.getX = function (t) {
			return t * (this.cX + t * (this.bX + t * this.aX));
		};
		/**
		 * 计算给定参数t时贝塞尔曲线在x轴上的导数值
		 * @param t
		 * @returns {*}
		 */
		CubicBezierEase.prototype.getXDerivative = function (t) {
			return this.cX + t * (2 * this.bX + 3 * this.aX * t);
		};
		/**
		 * 根据给定的x值，计算对应的y值
		 * @param x
		 * @returns {number}
		 */
		CubicBezierEase.prototype.ease = function (x) {
			var prev,
				t = x;
			do {
				prev = t;
				t = t - ((this.getX(t) - x) / this.getXDerivative(t));
			} while (Math.abs(t - prev) > 1e-4);


			return t * (this.cY + t * (this.bY + t * this.aY));
		};
		return CubicBezierEase;
	})();

	/**
	 * 用于观察元素的大小变化，并在变化时执行回调函数
	 * @type {null|(function(*, *): void)}
	 */
	utils.observeSize = (function(){
		if (!self.ResizeObserver) return null;

		var observer = new ResizeObserver(function(entries){
			var rect;
			var callback;
			for (var i = 0; i < entries.length; i++) {
				callback = observer.callbacks[entries[i].target.observeId];
				if (callback == null)
					continue;

				rect = entries[i].contentRect;
				callback({width: rect.width, height: rect.height});
			}
		});

		observer.observeId = 0;
		observer.callbacks = {};
		return function (target, callback) {
			var obs = observer;
			target.observeId = obs.observeId++;
			obs.observe(target);
			obs.callbacks[target.observeId] = callback;
		}
	})();
	/**
	 * 在指定的时间段内对数值进行插值(平滑)，并获取当前插值状态
	 * @type {TimeStep}
	 */
	utils.TimeStep = (function(){
		function TimeStep (initParam) {
			this.start = initParam.start;
			this.current = initParam.start;
			this.end = initParam.end;
			this.time = 0;
			this.percent = 0;
			this.duration = initParam.duration;
			this.completed = false;
		}

		TimeStep.prototype.update = function (delta) {
			this.time += delta;
			this.percent = utils.ease(Math.min(this.time / this.duration, 1));

			var start, end;
			var isArray = false;
			if (Array.isArray(this.start)) {
				isArray = true;
				start = this.start;
			} else {
				start = [this.start, 0];
			}

			if (Array.isArray(this.end)) {
				isArray = true;
				end = this.end;
			} else {
				end = [this.end, 0];
			}

			if (isArray) {
				this.current = [utils.lerp(start[0], end[0], this.percent), utils.lerp(start[1], end[1], this.percent)];
			} else {
				this.current = utils.lerp(start[0], end[0], this.percent);
			}

			if (this.time >= this.duration) this.completed = true;
		};

		return TimeStep;
	})();
})(utils || (utils = {}));
