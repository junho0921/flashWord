/**
 * Created by jiajunhe on 2016/6/29.
 */
define(function (require, exports, module) {
	/*
	 * 飞屏模块, 面对webkit内核浏览器
	 * 使用注意
	 * 1, options.css的格式必须是有options.css.container, options.css.msg
	 * */
	'use strict';
	require('libs/jquery');

	var renderCount = 0, fixCss, itemH, listAry = [];

	var flashWord = function (options) {
		this.init(options);
		return this;
	};

	flashWord.prototype = {
		_$container:null,
		_msgList: null,
		_defaultConfig:{
			view: 'body',
			className: '',
			css:{
				container:{
					height: '357px',
					left: '278px',
					top: '28px',
					width: '300px',
					position: 'fixed',
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
					transform: 'translate3d(0, 0, 0)',
					padding: '5px 10px',
					display:'none',
					'word-break': 'break-all',
					transition: 'all 0.2s ease'
				}
			}
		},
		_count:0,
		_className: '.flashWord',
		_staticConfig:{
			maxMsgLen:6,
			displayDuration:5000,
			slideInDuration:800,
			msgMode:{ // 字体颜色
				0:{ // 普通
					color: '#fff',
					'text-shadow':'0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #FF1177, 0 0 35px #FF1177, 0 0 40px #FF1177, 0 0 50px #FF1177, 0 0 75px #FF1177'
				},
				1:{ // vip
					color: '#fff',
					'text-shadow':'0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #FF9900, 0 0 35px #FF9900, 0 0 40px #FF9900, 0 0 50px #FF9900, 0 0 75px #FF9900'
				},
				2:{ // 白金vip
					color: '#fff',
					'text-shadow': '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #ff00de, 0 0 35px #ff00de, 0 0 40px #ff00de, 0 0 50px #ff00de, 0 0 75px #ff00de'
				}
			},
			displayOptions:{ // 动画效果配置
				showUp:{ // 进场效果
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
							transform: 'translate3d(0, -' + (index -1)*itemH + 'px, 0)'
						},
						'100%': {
							opacity: isFadeOut ? 0 : 1,
							transform: 'translate3d(0, -' + index*itemH + 'px, 0)'
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
			this._renderContainer();
			this._getsingeH();
			this._addFrame();
		},
		_getsingeH: function () {
			var $li = $('<li>').text('.').appendTo(this._$container);
			itemH = $li.height();
			$li.remove();
		},
		// 预先把基本的ul/li样式都生成到页面里
		_renderBasicCss: function () {
			var opt = this._options, basicCss = {};
			this._className = !!opt.className ? opt.className : this._className + (renderCount++);// 独特className
			basicCss[this._className] = opt.css.container;
			basicCss[this._className + ' li'] = opt.css.msg;
			basicCss[this._className + ' li'].transition = 'all ' + this._staticConfig.slideInDuration/1000 + 's ease';
			basicCss[this._className + ' li.msgMode0 > *'] = this._staticConfig.msgMode[0];
			basicCss[this._className + ' li.msgMode1 > *'] = this._staticConfig.msgMode[1];
			basicCss[this._className + ' li.msgMode2 > *'] = this._staticConfig.msgMode[2];
			_addCssRule(basicCss);
		},
		_addFrame: function () {
			var selector = this._className + ' li',
				len = this._staticConfig.maxMsgLen,
				animationConfig = this._staticConfig.slideInDuration/1000 + 's ease-out forwards',// 限定了?
				showUp = this._staticConfig.displayOptions.showUp,
				queue = this._staticConfig.displayOptions.queue;

			var listAnimationObj = {};

			for(var index = 1; index <= len; index++){ // 尝试过做成listRender的通用方法, 但没有成效, 因为都没有通用的效果.
				var elem, frameRule;
				elem = selector + ':nth-child(' + index + ')' ;
				var elemObj = listAnimationObj[elem] = {};
				var keyframeName = 'randomName' + index;
				var elemAnimateConfig = keyframeName + ' ' + animationConfig + '; display:block';

				var isFirst = index === 1, isLast = index === len;
				if (isFirst) { // 入场效果
					frameRule = showUp;
				} else{ // 排队效果
					frameRule = queue(index - 1, isLast);
				}
				elemObj[elemAnimateConfig] = frameRule;
			}

			renderCss(listAnimationObj);
		},
		_renderContainer: function () {
			$(this._options.view).append(
				this._$container = $('<ul>', {class: this._className.split('.').join(' ')})
			);
		},
		_emit: function () {
			var _this= this;
			this._isEmitting = true;
			this._msgCount++;

			var $item = _this._$container.find('li');

			clearTimeout(_this._timeoutFunc);

			_this._$container.show();

			var msgObj = this._msgList.pop(), $msg = $(msgObj.content);
			if(!$msg[0] || $msg[0].tagName.toUpperCase() !== 'LI'){
				$msg =  $('<li>').append(msgObj.content);
			}

			$msg
				.addClass('msgMode' + msgObj.vipMode)
				.one(fixCss('animationend'), function () {
					if(_this._msgCount > _this._staticConfig.maxMsgLen){
						_this._$container.find('li').last().remove();
						listAry.pop();
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

			var newH = $msg.height();
			var overH = newH - itemH;
			if(Math.abs(overH) > 3) {
				listAry.forEach(function (obj) {
					obj[0] = obj[0] + overH;
					obj[1].css('bottom', obj[0] + 'px');
					console.log('foreach 2  sh = ', overH);
				});
			}
			listAry.unshift([0, $msg]);
		},

		/**
		 * @desc 发送飞屏内容的方法
		 * @func display
		 */
		display: function (msg, vipMode) {
			this._msgList.push({
				content: msg,
				vipMode: vipMode
			});
			if(!this._isEmitting){
				this._emit();
			}
		}
	};

	// 方法:
	fixCss = (function () {
		var fixObj = {};
		var isWebkitStyle = document.body.style.webkitTransform !== undefined;
		if(isWebkitStyle){
			fixObj.animation = '-webkit-animation';
			fixObj.animationend = 'webkitAnimationEnd';
			fixObj.transform = '-webkit-transform';
			fixObj['@keyframes'] = '@-webkit-keyframes';
		}
		return function (attr) {
			var fixedAttr = fixObj[attr];
			return fixedAttr ? fixedAttr : attr;
		};
	}());

	function eachKeys(obj, func){
		Object.keys(obj).forEach(function (key, index) {
			func.call(this, key, obj[key], index);
		});
	}

	// 入口api, 为keyframe动画提供便利的入口
	function renderCss (cssObj){
		// 格式限制 // toFix 格式拓展
		var firstChild, isCssObjGrandchildObj, isKeyframes;// isKeyframes的判断不准确
		if(!$.isPlainObject(cssObj)){return false;}
		if(!$.isPlainObject(firstChild = cssObj[Object.keys(cssObj)[0]])) {return false;}
		isCssObjGrandchildObj = $.isPlainObject(firstChild[Object.keys(firstChild)[0]]);
		isKeyframes = isCssObjGrandchildObj;
		if(isKeyframes){ // isKeyframes: 需要进行解析, 整理出animation对象与keyframe的对象, 分别添加到style
			var animationObj = {};
			var keyframesObj = {};

			eachKeys(cssObj, function (selector, value) {
				eachKeys(value, function (animationRule, keyframeRule) {
					var rules = animationRule.split(';');
					animationRule = rules.shift();// 所以必须动画属性在前头
					animationObj[selector] = {
						animation: animationRule
					};
					rules.forEach(function (rule) {
						rule = $.trim(rule).split(':');
						animationObj[selector][rule[0]] = rule[1];
					});
					var keyframeName = $.trim(animationRule).split(' ')[0];
					keyframesObj[keyframeName] = keyframeRule;
				});
			});
			_addCssRule(animationObj);
			_addCssRule(keyframesObj, true);
		}else{
			_addCssRule(cssObj);
		}
	}
	// 基本方法, 接受的参数都是按照css规范, 第一层属性名必须是选择器, 其值是css规则内容.
	function _addCssRule (obj, isKeyframes){
		var $tyle = $('<style>', {rel:'stylesheet', type:'text/css'}).appendTo($('head'));
		var styles = $tyle[0].sheet;

		function getCssRule(selector, cssRuleObj){
			var cssRule = '';
			eachKeys(cssRuleObj, function (attr, value) {
				cssRule += fixCss(attr) + ':' + value + ';';
			});
			return selector + '{' + cssRule + '}';
		}

		eachKeys(obj, function (selector, cssRule) {
			var r1, frameR, keyFrameName, frames;
			if(isKeyframes){
				keyFrameName = selector;
				frames = cssRule;
				r1 = fixCss('@keyframes') + ' ' + keyFrameName + '{}';
			}else{
				r1 = getCssRule(selector, cssRule);
			}
			try {
				frameR = styles.insertRule(r1, styles.cssRules.length);
			} catch(e) {
				throw e;
			}
			if(isKeyframes){
				var original = styles.cssRules[frameR];
				// 遍历参数2frames对象里的属性, 来添加到keyframes里
				eachKeys(frames, function (text, css) {
					var cssRule = getCssRule(text, css);
					if('appendRule' in original) {
						original.appendRule(cssRule);
					} else {
						original.insertRule(cssRule);
					}
				});
			}
		});
	}

	module.exports = flashWord;
});