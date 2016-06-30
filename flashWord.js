/**
 * Created by jiajunhe on 2016/6/29.
 */
define(function (require, exports, module) {
	/*
	 * 飞屏模块, 面对webkit内核浏览器
	 * */
	'use strict';
	require('libs/jquery');

	var renderCount = 0;

	var fixCss = (function () {
		var fixObj = {};
		var isWebkitStyle = document.body.style.webkitTransform !== undefined;
		if(isWebkitStyle){
			fixObj.animation = '-webkit-animation';
			fixObj.animationend = 'webkitAnimationEnd';
			fixObj.transform = '-webkit-transform';
		}
		return function (attr) {
			var fixedAttr = fixObj[attr];
			return fixedAttr ? fixedAttr : attr;
		}
	}());

	function eachKeys(obj, func){
		Object.keys(obj).forEach(function (key, index) {
			func.call(this, key, obj[key], index);
		});
	}

	var flashWord = function (options) {
		this.init(options);
		return this;
	};

	flashWord.prototype = {
		_$container:null,
		_msgList: null,
		_defaultConfig:{
			view: 'body'
		},
		_count:0,
		_className: 'flashWord',
		_staticConfig:{
			maxMsgLen:6,
			maxDisplayMsgLen:5,
			displayDuration:2000,
			animationName:'toLine',
			slideInDuration:800,
			css:{
				container:{
					width: '300px',
					height: '300px',
					position: 'fixed',
					left:'300px',
					top:'200px',
					'will-change':'all',
					'z-index': '999'
				},
				msg:{
					position: 'absolute',
					left: '0',
					bottom: '0',
					width: '100%',
					'will-change':'all',
					'font-size': '24px',
					'line-height': '30px',
					height: '30px',
					transform: 'translate3d(0, 0, 0)',
					'-webkit-transform': 'translate3d(0, 0, 0)',
					display: 'none'
				}
			},
			displayOptions:{ // 动画效果配置
				showUp:{
					'0%': {
						opacity: 0,
						transform: 'translate3d(100%, 0, 0)'
					},
					'70%': {
						opacity: 0.7,
						transform: 'translate3d(-10%, 0, 0)'
					},
					'100%': {
						opacity: 1,
						transform: 'translate3d(0, 0, 0)'
					}
				},
				queue: function (index, isFadeOut) {
					return {
						'0%': {
							opacity: 1,
							transform: 'translate3d(0, -' + (index -1) + '00%, 0)'
						},
						'100%': {
							opacity: isFadeOut ? 0 : 1,
							transform: 'translate3d(0, -' + index + '00%, 0)'
						}
					};
				}
			}
		},
		_msgCount:0,
		_timeoutFunc:null,
		_isEmitting:false,
		init: function (options) {
			this._msgList = [];
			this._options = $.extend(true, {}, this._defaultConfig, options);
			this._renderBasicCss();
			this._addFrame();
			this._renderContainer();
		},
		// 预先把基本的ul/li样式都生成到页面里
		_renderBasicCss: function () {
			if(!this._options.css){
				this._options.css = {};
				this._className = this._className + (renderCount++); // 独特className
				this._options.css['.' + this._className] = this._staticConfig.css.container;
				this._options.css['.' + this._className + ' li'] = this._staticConfig.css.msg;
			}
			this._addCssRule(this._options.css);
		},
		_addFrame: function () {
			var config = this._staticConfig;
			var cssRules = {}; // css of animation
			var keyFrames = {};// css of keyFrames
			for(var i = 1; i <= config.maxDisplayMsgLen; i++){
				// 一个排队位置的dom对应一个css的animation选择器.
				var animationName = config.animationName + i;
				// animation
				cssRules['.'+ this._className +' li:nth-child(' + i + ')'] = {
					display: 'block',
					animation: animationName + ' ' + config.slideInDuration/1000 + 's ease-out forwards'
				};
				// keyFrames
				var isFirst = i === 1;
				var isLast = i === config.maxDisplayMsgLen;
				if(isFirst){ // 入场效果
					keyFrames[animationName] = this._staticConfig.displayOptions.showUp;
				} else { // 排队效果
					keyFrames[animationName] = this._staticConfig.displayOptions.queue(i-1, isLast);
				}
			}
			this._addCssRule(cssRules);
			this._addCssRule(keyFrames, true);
		},
		_renderContainer: function () {
			$(this._options.view).append(
				this._$container = $('<ul>', {class: this._className})
			);
		},
		_emit: function () {
			var _this= this;
			this._isEmitting = true;
			this._msgCount++;

			clearTimeout(_this._timeoutFunc);

			_this._$container.show();

			var msg = this._msgList.pop(), $msg = $(msg);
			if(!$msg[0] || $msg[0].tagName.toUpperCase() !== 'LI'){
				$msg =  $('<li>').append(msg);
			}

			$msg
				.one(fixCss(animationend), function () {
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
		_addCssRule : function(obj, isKeyframes){
			// 参数obj示范: {'.con':{width:'200px'}, '.ton':{}}
			var styleTag = document.createElement('style');
			styleTag.rel = 'stylesheet';
			styleTag.type = 'text/css';
			document.getElementsByTagName('head')[0].appendChild(styleTag);
			var styles = styleTag.sheet;
			// todo 处理兼容问题

			function getCssRule(selector, cssRuleObj){
				var cssRule = '';
				eachKeys(cssRuleObj, function (attr, value) {
					cssRule += fixCss(attr) + ':' + value + ';';
				});
				return selector + '{' + cssRule + '}';
			}

			eachKeys(obj, function (selector, cssRule) {
				var r1, r2, frameR, keyFrameName, frames;
				if(isKeyframes){
					keyFrameName = selector;
					frames = cssRule;
					r1 = '@keyframes ' + keyFrameName + '{}';
					r2 = '@-webkit-keyframes ' + keyFrameName + '{}';
				}else{
					r1 = r2 = getCssRule(selector, cssRule);
				}
				try {
					frameR = styles.insertRule(r1, styles.cssRules.length);
				} catch(e) {
					if(e.name == 'SYNTAX_ERR' || e.name == 'SyntaxError') {
						frameR = styles.insertRule(r2, styles.cssRules.length);
					}
					else {
						throw e;
					}
				}
				if(isKeyframes){
					var original = styles.cssRules[frameR];
					// 遍历参数2frames对象里的属性, 来添加到keyframes里
					eachKeys(frames, function (text, css) {
						var cssRule = text + " {";
						eachKeys(css, function (k, s) {
							cssRule += fixCss(k) + ':' + s + ';';
						});
						cssRule += "}";
						if('appendRule' in original) {
							original.appendRule(cssRule);
						}
						else {
							original.insertRule(cssRule);
						}
					});
				}
			});
		},

		/**
		 * @desc 发送飞屏内容的方法
		 * @func display
		 */
		display: function (msg) {
			this._msgList.push(msg);
			if(!this._isEmitting){
				this._emit();
			}
		}
	};
	module.exports = flashWord;
});