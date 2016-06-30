/**
 * Created by jiajunhe on 2016/6/29.
 */
define(function (require, exports, module) {
	/*
	 * 飞屏模块, 面对webkit内核浏览器
	 * */
	'use strict';
	require('jquery');

	var isWebkitStyle = document.body.style.webkitTransform !== undefined;
	var animationType = isWebkitStyle ?'-webkit-animation': 'animation';
	var animationEndType = isWebkitStyle ?'webkitAnimationEnd': 'animationend';

	var flashWord = function (options) {
		this.init(options);
		return this;
	};

	flashWord.prototype = {
		_$container:null,
		_msgList: null,
		_defaultConfig:{
			view: 'body',
			css:{
				container:{
					width: '300px',
					height: '300px',
					position: 'fixed',
					left:'300px',
					top:'200px',
					'z-index': '999'
				},
				msg:{
					position: 'absolute',
					left: '0',
					bottom: '0',
					width: '100%',
					'font-size': '24px',
					'line-height': '30px',
					height: '30px',
					transform: 'translate3d(0, 0, 0)',
					'-webkit-transform': 'translate3d(0, 0, 0)',
					display: 'none'
				}
			}
		},
		_count:0,
		_staticConfig:{
			maxMsgLen:6,
			maxDisplayMsgLen:5,
			displayDuration:2000,
			animationName:'toLine',
			className: 'flashWord',
			slideInDurationslideInDuration:1000,
			displayOptions:{
				rtl:{
					//todo 效果
				}
			}
		},
		_msgCount:0,
		_timeoutFunc:null,
		_isEmitting:false,
		init: function (options) {
			this._msgList = [];
			this._options = $.extend(true, {}, this._defaultConfig, options);
			this._staticConfig.className = this._staticConfig.className + (this._count++); // 独特className
			this._cssAdjust();
			this._addFrame();
			this._renderContainer();
		},
		_addFrame: function () {
			var config = this._staticConfig;
			var cssRules = [];
			var keyFrames = {};
			for(var i = 0; i < config.maxDisplayMsgLen; i++){
				var idx = (i + 1) + '';
				var str =
					'.'+ this._staticConfig.className + ' li:nth-child(' + idx +
					'){ display: block; ' +
					animationType  +
					': ' +
					config.animationName + idx +
					' ' +
					config.slideInDuration/1000 +
					's ease-out forwards;}';
				cssRules.push(str);

				if(i === 0){ //入场效果
					keyFrames[config.animationName + idx] = {
						'0%': {
							opacity: 0,
							transform: 'translate3d(100%, 0, 0)'
						},
						'100%': {
							opacity: 1,
							transform: 'translate3d(0, 0, 0)'
						}
					};
				} else if(i === config.maxDisplayMsgLen -1){ // 退场效果
					keyFrames[config.animationName + idx] = {
						'0%': {
							opacity: 1,
							transform: 'translate3d(0, -' + (i -1) + '00%, 0)'
						},
						'100%': {
							opacity: 0,
							transform: 'translate3d(0, -' + i + '00%, 0)'
						}
					};
				} else { // 提升效果
					keyFrames[config.animationName + idx] = {
						'0%': {
							transform: 'translate3d(0, -' + (i -1) + '00%, 0)'
						},
						'100%': {
							transform: 'translate3d(0, -' + i + '00%, 0)'
						}
					};
				}
			}
			this._addCssRule(cssRules);
			this._addCssRule(keyFrames, true);
		},
		_renderContainer: function () {
			$(this._options.view).append(
				this._$container = $('<ul>', {class: this._staticConfig.className})
			);
		},
		_cssAdjust: function () {
			function getCssRule(className, cssObj){
				var cssRule = '';
				Object.keys(cssObj).forEach(function (attr) {
					cssRule += attr + ':' + cssObj[attr] + ';';
				});
				return '.' + className + '{' + cssRule + '}';
			}

			this._addCssRule([
				getCssRule(this._staticConfig.className + ' li', this._options.css.msg),
				getCssRule(this._staticConfig.className, this._options.css.container)
			]);
		},
		send: function (msg) {
			this._msgList.push(msg);
			if(!this._isEmitting){
				this._emit();
			}
		},
		_emit: function () {
			var _this= this;
			this._isEmitting = true;
			clearTimeout(_this._timeoutFunc);

			_this._$container.show();

			var msg = this._msgList.pop(), $msg = $(msg);
			if(!$msg[0] || $msg[0].tagName.toUpperCase() !== 'LI'){  console.warn('不是记得等等的');
				$msg =  $('<li>').append(msg);
			}

			this._msgCount++;

			$msg
				.one(animationEndType, function () {
					//console.warn('发送  '+msg +'  完毕', _this._msgList);
					if(_this._msgCount > _this._staticConfig.maxMsgLen){
						_this._$container.find('li').last().remove();
						_this._msgCount--;
					}

					if(_this._msgList.length){
						_this._emit();
					}else{
						_this._isEmitting = false;
						_this._timeoutFunc = setTimeout(function () {
							_this._$container.fadeOut(function () {
								_this._msgCount = 0;
								_this._$container.find('li').remove();
							});
						}, _this._staticConfig.displayDuration);
					}
				})
				.prependTo(this._$container);
		},
		_addCssRule : function(cssRules, isKeyframes){
			var styleTag = document.createElement('style');
			styleTag.rel = 'stylesheet';
			styleTag.type = 'text/css';
			document.getElementsByTagName('head')[0].appendChild(styleTag);
			var styles = styleTag.sheet;

			var keys = Object.keys(cssRules);
			keys.forEach(function (key) {
				var r1, r2, idx;
				if(isKeyframes){
					r1 = '@keyframes ' + key + '{}';
					r2 = '@-webkit-keyframes ' + key + '{}';
				}else{
					r1 = r2 = cssRules[key];
				}
				try {
					idx = styles.insertRule(r1, styles.cssRules.length);
				}
				catch(e) {
					if(e.name == 'SYNTAX_ERR' || e.name == 'SyntaxError') {
						idx = styles.insertRule(r2, styles.cssRules.length);
					}
					else {
						throw e;
					}
				}
				if(isKeyframes){
					var frames = cssRules[key];
					var original = styles.cssRules[idx];
					// 遍历参数2frames对象里的属性, 来添加到keyframes里
					for(var text in frames) {
						var  css = frames[text];

						var cssRule = text + " {";

						for(var k in css) {
							var pre = '';
							if(isWebkitStyle && k === 'transform'){
								pre = '-webkit-';
							}
							cssRule += pre + k + ':' + css[k] + ';';
						}
						cssRule += "}";
						if('appendRule' in original) {
							original.appendRule(cssRule);
						}
						else {
							original.insertRule(cssRule);
						}
					}
				}
			});
		}
	};
	module.exports = flashWord;
});