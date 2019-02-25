/*
* 小型 JQuery 库：
* --------------------------------------------------
* $(param):
*   param 是 html 标签组成的字符串 ===》 创建该标签节点
*   param 是 css 选择器字符串，获取对应的节点
*   param 是 JS原生node节点，获取对应的节点
*   param 是 本类的实例对象，返回本身
* */

(function (window, document) {
	// getElementByClassName 兼容
	if(!document.getElementsByClassName) {
		document.getElementsByClassName = function (className) {
			let elements = document.getElementsByTagName('*');
			let returnElements = [];
			let reg = new RegExp(`\\b${className}\\b`);
			[...elements].forEach((item) => {
				if(reg.test(item.className)) {
					returnElements.push(item);
				}
			});
			
			return returnElements;
		}
	}
	
	// trim() 兼容
	if(!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		}
	}
	
	// DOMReady 事件函数存储
	let _domReadyEvents = [];
	
	// 获取节点
	let _getNodes = function (param) {
		let dataType = jQ.type(param);
		let getNodeByParamType = {
			html(selector) {
				let div = document.createElement('div');
				div.innerHTML = selector;
				
				return [...div.children]
			},
			id(selector) {
				let idElement = document.getElementById(selector.slice(1));
				
				return idElement === null ? [] : [idElement];
			},
			className(selector) {
				
				return document.getElementsByClassName(selector.slice(1));
			},
			tagName(selector) {
				
				return document.getElementsByTagName(selector);
			},
			css(selector) {
				
				return document.querySelectorAll(selector);
			}
		};
		let getParamType = function (selector) {
			if(/^</.test(selector)) {
				
				return 'html';
			} else if (/[~+>,=\s]/.test(selector)) {
				
				return 'css';
			} else if (/^#/.test(selector)) {
				
				return 'id';
			} else if (/\./.test(selector)) {
				
				return 'className';
			} else if (/^[\w]+$/.test(selector)) {
				
				return 'tagName';
			}
			
		};
		
		if(dataType === 'object') {
			if(param.length) {
				return param;
			} else {
				return [ param ];
			}
			
		} else if(dataType === 'string') {
			param = param.trim();
			
			return getNodeByParamType[getParamType(param)](param);
		}
		
	};
	
	// 事件类型修饰符处理（冒泡和默认行为）
	let _modifierHandle = function (modifiers, event) {
		modifiers.forEach((item) => {
			if(item === 'stop') {
				event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
			} else if(item === 'prevent') {
				event.preventDefault ? event.preventDefault() : event.returnValue = false;
			}
		})
	};
	
	// 存储事件信息，用于事件解绑
	let _addEventFn = function (eventInfo) {
		if(eventInfo.node.events === undefined) {
			eventInfo.node.events = {
				[eventInfo.type]: [eventInfo.event]
			}
		} else if(eventInfo.node.events[eventInfo.type] instanceof  Array) {
			eventInfo.node.events[eventInfo.type].push(eventInfo.event);
		} else {
			eventInfo.node.events[eventInfo.type] = [eventInfo.event]
		}
	};
	
	// 事件解绑
	let _removeEvent = function (node, type, callback) {
		if(node.removeEventListener) {
			node.removeEventListener(type, callback);
		} else if(node.detachEvent) {
			node.detachEvent(`on${type}`, callback);
		}
	};

	// JQ 类
	class JQuery {
		constructor(param) {
			let nodes = _getNodes(param);
			let length = nodes.length;
			let historyOfNodes = null;
			
			Object.setPrototypeOf(nodes, JQuery.prototype);
			nodes.length = length;
			
			return nodes;
		}
		
		/*
		* static 方法
		* ----------------------------------------------*/
		
		// 去除字符串数组中的空值和空格值以及值两边的空格并返回一个新数组
		static removeSpace(arr) {
			let returnArr = [];
			arr.forEach((item) => {
				item = item.trim();
				if(item !== '') {
					returnArr.push(item);
				}
			});
			return returnArr;
		}
		
		/*
		* prototype 方法
		* ---------------------------------------------- */
		
		/*
		* each()：用于遍历；
		*   callback(item, index, thisArr),newThis：
		*       其参数和 Array 的 forEach() 方法参数意义相同
		* */
		each(callback, newThis) {
			for(let i = 0, len = this.length; i < len; i++) {
				let flag = callback.call(newThis || this[i], this[i], i, this);
				if(flag === false) {
					break;
				}
			}
			return this;
		}
		
		/*
		* on(): 绑定事件；
		*   eventType：表示事件类型；
		*       如，'click.stop.prevent'：
		*           事件类型写在最前面；
		*           stop 表示阻止冒泡；
		*           prevent 表示阻止默认行为；
		*           stop、prevent 的顺序随意
		*    callback: 事件处理函数
		* */
		on(eventType, callback) {
			if(eventType !== 'undefined' && callback !== 'undefined') {
				let modifiers = eventType.split(/\./);
				let type = modifiers.shift();
				
				this.each((item) => {
					let eventFn;
					
					if(type === 'mousewheel') {
						eventFn = function (event) {
							_modifierHandle(modifiers, event);
							event.wheelD = event.wheelDelta / 120 || event.detail / -3;
							callback.call(item, event);
						};
						if(item.addEventListener) {
							item.addEventListener(
								item.onmousewheel === null ? 'mousewheel' : 'DOMMouseScroll',
								eventFn,
								false
							);
						} else if(item.attachEvent) {
							item.attachEvent(`on${type}`, eventFn);
						}
					} else {
						eventFn = function (event) {
							_modifierHandle(modifiers, event);
							callback.call(item, event);
						};
						if(item.addEventListener) {
							item.addEventListener(type, eventFn, false);
						} else if(item.attachEvent) {
							item.attachEvent(`on${type}`, eventFn);
						}
					}
					eventFn.origin = callback;
					eventFn.typeOrigin = eventType;
					_addEventFn({
						node: item,
						type: type,
						event: eventFn
					});
				})
			}
			
			return this;
		}
		
		/*
		* off(): 事件解绑
		*   其参数同 on() 方法的参数相同，但 eventType 只写事件类型即可；
		*   如果指定了 callback，则只解绑 callback；
		*   如果没有指定 callback，则将该类型的所有事件全部解绑
		* */
		off(eventType, callback) {
			if(!!eventType) {
				this.each((item) => {
					if(!!item.events[eventType]) {
						let isFn = typeof callback === 'function';
						let eventFns = item.events[eventType];
						
						eventFns.forEach((fn, index) => {
							if(eventType === 'mousewheel') {
								if(isFn) {
									if(callback === fn.origin) {
										_removeEvent(item, item.onmousewheel === null ? 'mousewheel' : 'DOMMouseScroll', fn);
									}
								} else {
									_removeEvent(item, item.onmousewheel === null ? 'mousewheel' : 'DOMMouseScroll', fn);
								}
							} else {
								if(isFn) {
									if(callback === fn.origin) {
										_removeEvent(item, eventType, fn);
									}
								} else {
									_removeEvent(item, eventType, fn);
								}
							}
							eventFns.splice(index, 1);
						})
					}
				})
			}
			
			return this;
		}
		
		/*
		* on(): 绑定一次性事件
		*   参数同 on() 方法的参数意义相同；
		* */
		one(eventType, callback) {
			if(eventType !== 'undefined' && callback !== 'undefined') {
				let modifiers = eventType.split(/\./);
				let type = modifiers.shift();
				
				this.each((item) => {
					let eventFn;
					
					if(type === 'mousewheel') {
						eventFn = function (event) {
							_modifierHandle(modifiers, event);
							event.wheelD = event.wheelDelta / 120 || event.detail / -3;
							callback.call(item, event);
							_removeEvent(item, type, eventFn);
						};
						if(item.addEventListener) {
							item.addEventListener(
								item.onmousewheel === null ? 'mousewheel' : 'DOMMouseScroll',
								eventFn,
								false
							);
						} else if(item.attachEvent) {
							item.attachEvent(`on${type}`, eventFn);
						}
					} else {
						eventFn = function (event) {
							_modifierHandle(modifiers, event);
							callback.call(item, event);
							_removeEvent(item, type, eventFn);
						};
						if(item.addEventListener) {
							item.addEventListener(type, eventFn, false);
						} else if(item.attachEvent) {
							item.attachEvent(`on${type}`, eventFn);
						}
					}
				})
			}
			
			return this;
		}
		
		/*
		* val(): 获取或设置 value 值；
		*   如果没有传递参数，则是获取第一个对象的 value 值；
		*   如果传递了参数，则是设置所有对象的 value 值；
		*   通常只有表单元素才有 value 值；
		* */
		val(setValue) {
			if(setValue === undefined) {
				let returnValue;
				
				try {
					returnValue = this[0].value;
				} catch (error) {
					throw new Error('只有表单对象才有 value 值!');
				}
				
				return returnValue;
			} else {
				this.each((item) => {
					item.value = setValue;
				});
				
				return this;
			}
		}
		
		/*
		* html(): 获取或设置 innerHTML；
		*   传参以不传参，意义同 val()
		* */
		html(setHtml) {
			if(setHtml === undefined) {
				let returnHtml;
				
				try {
					returnHtml = this[0].innerHTML;
				} catch (error) {
					throw new Error('不存在innerHTML!');
				}
				
				return returnHtml;
			} else {
				this.each((item) => {
					item.innerHTML = setHtml;
				});
				
				return this;
			}
		}
		
		/*
		* text(): 获取或设置 innerText；
		*   传参以不传参，意义同 val()
		* */
		text(setText) {
			if(setText === undefined) {
				let returnText;
				
				try {
					returnText = this[0].innerText;
				} catch (error) {
					throw new Error('不存在innerText!');
				}
				
				return returnText;
			} else {
				this.each((item) => {
					item.innerText = setText;
				});
				
				return this;
			}
		}
		
		/*
		* eq(): 获取对应下标的对象并返回；
		*   默认获取第一个对象；
		*   -1 表示获取最后一个；
		*   超过对象长度，则对它取余再获取；
		* */
		eq(index = 0) {
			let len = this.length;
			
			index %= len;
			if(index < 0) {
				index += len;
			}
			
			let returnNode = new JQuery(this[index]);
			returnNode.historyOfNodes = new JQuery(this);
			
			return returnNode;
		}
		
		/*
		* 在链式调用中，多次获取了对象（如调用了 eq() 方法），
		* back() 方法返回前一次获取的对象集合
		* */
		back() {
			let prev = this.historyOfNodes[0];
			this.historyOfNodes = this;
			
			return prev;
		}
		
		/*
		* addClass(): 添加类名;
		*   可以 name1, name2, ……，的形式同时添加多个类名
		* */
		addClass(...nameList) {
			if(nameList.length > 0) {
				this.each((item) => {
					let currentNames = new Set(JQuery.removeSpace(item.className.split(/\s+/g)).concat(JQuery.removeSpace(nameList)));
					item.className = [...currentNames].join(' ');
				});
			}
			
			return this;
		}
		
		/*
		* removeClass(): 移出类名；
		*   可以 name1, name2, ……，的形式同时移除多个类名
		* */
		removeClass(...nameList) {
			if(nameList.length > 0) {
				this.each((item) => {
					let names = JQuery.removeSpace(item.className.split(/\s+/g));
					names.forEach((name, index) => {
						JQuery.removeSpace(nameList).forEach((removeName) => {
							if(name === removeName) {
								names.splice(index, 1);
							}
						})
					});
					item.className = names.join(' ');
				});
			}
			
			return this;
		}
		
		/*
		* hasClass(): 判断第一个对象是否含有指定的 class 类名；
		*   返回布尔值
		* */
		hasClass(name) {
			let reg = new RegExp(`\\b${name}\\b`);
			
			return reg.test(this[0].className);
		}
		
		/*
		* toggle(): 对所有对象，
		*   如果有指定类名则移除该类名，
		*   如果没有则添加该类名
		* */
		toggle(name) {
			this.each((item) => {
				let that = new JQuery(item);
				
				if(that.hasClass(name)) {
					that.removeClass(name);
				} else {
					that.addClass(name);
				}
			});
			
			return this
		}
		
		/*
		* A.appendTo(B): 添加节点，将 A 添加到 B 上
		*   如果 A 是已存在于文档上的，则将 A 添加到 B 的第一个对象上
		*   如果 A 不存在于文档上，则将 A 一次添加到 B 的所有对象上
		*   B 可能是: '.box' 类的 css 选择器 / js 原生节点 / 该类生成的对象，
		*     但，最后都会转为该类的实例对象（类数组）
		* */
		appendTo(nodes) { //
			if(!nodes) return;
			
			let target;
			let fragment = document.createDocumentFragment();
			
			if(nodes instanceof JQuery) {
				target = nodes;
			} else {
				target = new JQuery(nodes);
			}
			
			if(this[0].isConnected) {
				let last = this.length - 1;
				
				for(let i = last; i >= 0; i--) {
					fragment.appendChild(this[i])
				}
				target[0].appendChild(fragment);
			} else {
				target.each((item) => {
					this.each((node) => {
						let copyNode = node.cloneNode(true);
						let packCopyNode = new JQuery(copyNode);
						let nodeEvents = node.events;
						
						if(!!nodeEvents) {
							for(let eventType in nodeEvents) {
								let eventFns= nodeEvents[eventType];
								eventFns.forEach((eventFn) => {
									packCopyNode.on(eventFn.typeOrigin, eventFn.origin);
								})
							}
						}
						fragment.appendChild(copyNode);
					});
					
					item.appendChild(fragment);
				}, this);
			}
			
			return this;
		}
		
		/*
		* A.append(B): 与 appendTo() 相反，这是讲 B 添加到 A 上；
		*   其它的都与 appendTo() 一致；
		* */
		append(nodes) { // nodes: '.box' / js node 节点 / 该类生成的对象 / '<div>……</div>'
			if(!nodes) return;
			
			let packNodes;
			
			if(nodes instanceof JQuery) {
				packNodes = nodes;
			} else {
				packNodes = new JQuery(nodes);
			}
			packNodes.appendTo(this);
			
			return this;
		}
		
		/*
		* remove(): 移除子节点；
		*   不传参，移除所有子节点；
		*   参数：css 选择器（字符串）/ 原生node对象 / 原生node 集合 / 本类实例
		* */
		remove(param) {
			let paramType = jQ.type(param);
			if(paramType === 'undefined') {
				this.each((parent) => {
					parent.innerHTML = '';
				})
			} else {
				let removenodes = function (parents, sons) {
					parents.each((parent) => {
						if(sons.length >= 0) {
							for(let i = sons.length - 1; i >= 0; i--) {
								sons[i].parentNode === parent && parent.removeChild(sons[i]);
							}
						} else {
							sons.parentNode === parent && parent.removeChild(sons);
						}
						
					})
				};
				
				if(paramType === 'string') {
					removenodes(this, new JQuery(param));
					
				} else {
					removenodes(this, param);
				}
			}
			
			return this;
		}
		
		/*
		* css(): 操作 css
		*   参数是 name: 获取 对应值
		*   参数 是 name, value： 设置对应值
		*   参数是 { name1: value1, name2: value2 } ：同时设置多个值
		* */
		css(property, value) {
			if(!property) return this;
			
			let propertyType = jQ.type(property);
			let unit = '';
			
			if(propertyType === 'string') {
				if(!!value) {
					if(/width|height|top|right|bottom|left|margin|padding/i.test(property)) {
						!isNaN(value * 1) && (unit = 'px');
					}
					this.each((item) => {
						item.style[property] = value + unit;
					})
				} else {
					if(window.getComputedStyle) {
						return getComputedStyle(this[0])[property];
					} else {
						return this[0].currentStyle[property];
					}
				}
			} else if(propertyType === 'object') {
				for(let key in property) {
					this.css(key, property[key]);
				}
			}
			
			return this;
		}
		
		/*
		* attr(): 操作属性，包括合法和不合法属性；
		*   但是不能准确操作属性值为 Boolean 的属性，
		*     因为该方法总是把属性值当做字符串
		*       要准确操作合法属性，要用 prop() 方法
		* */
		attr(property, value) {
			if(!property) return this;
			
			let propertyType = jQ.type(property);
			
			if(propertyType === 'string') {
				if(value === undefined) {
					return this[0].getAttribute(property);
				} else {
					this.each((item) => {
						item.setAttribute(property, value);
					})
				}
			} else if(propertyType === 'object') {
				for(let key in property) {
					this.attr(key, property[key]);
				}
			}
			
			return this;
		}
		
		/*
		* prop(): 操作合法属性
		* */
		prop(property, value) {
			console.log(property)
			if(!property) return this;
			
			let propertyType = jQ.type(property);
			
			if(propertyType === 'string') {
				if(value === undefined) {
					return this[0][property];
				} else {
					if(property === 'class') {
						property = 'className';
					}
					this.each((item) => {
						item[property] = value;
					})
				}
			} else if(propertyType === 'object') {
				for(let key in property) {
					this.prop(key, property[key]);
				}
			}
			
			return this;
		}
		
		/*
		* removeAttr(): 移除所有对象的指定属性
		*   可以 attr1, attr2, ……，的形式同时移除多个属性
		* */
		removeAttr(...attrs) {
			if(attrs.length > 0) {
				this.each((item) => {
					JQuery.removeSpace(attrs).forEach((attr) => {
						item.removeAttribute(attr);
					})
				})
			}
			
			return this;
		}
		/*
		* A.index(B): 返回指定子元素在它父元素的所有子元素中的下标
		*  如果 不存在参数 B，则返回 A 在它父元素的所有子元素中的下标
		*  如果 存在参数 B，则
		*     A 和 B 如果是集合，则取第一个元素
		*     B 的取值： css 选择器、原生节点对象或对象集合、该类实例
		*  不存在该子元素返回 -1
		* */
		index(param) {
			let index = -1;
			let comparison;
			let paramType = jQ.type(param);
			
			if(paramType === 'undefined') {
				comparison = this[0];
				let group = comparison.parentNode.children;
				[...group].forEach((item, i) => {
					if(item === comparison) {
						index = i;
					}
				})
			} else {
				if(paramType === 'string') {
					comparison = new JQuery(param);
				}
				if(comparison.length) {
					comparison = comparison[0];
				} else {
					comparison = param;
				}
				this.each((item, i) => {
					if(item === comparison) {
						index = i;
					}
				})
			}
			
			return index;
		}
		
	}
	
	function jQ(param) {
		if(typeof param === 'function') {
			_domReadyEvents.push(param);
		} else {
			
			return new JQuery(param)
		}
	}
	
	jQ.type = function (data) {
		let _type = {
			'[object Null]': 'null',
			'[object Undefined]': 'undefined',
			'[object Number]': 'number',
			'[object Boolean]': 'boolean',
			'[object String]': 'string',
			'[object Array]': 'array',
			'[object Object]': 'object',
			'[object Function]': 'function',
			'[object RegExp]': 'regExp',
			'[object Math]': 'math',
			'[object Date]': 'date',
			'[object Arguments]': 'arguments',
			'[object Error]': 'error'
		};
		
		return _type[Object.prototype.toString.call(data)] || 'object';
	};
	
	// DOMReady
	{
		let init = false;
		let done = function () {
			if(!init) {
				init = true;
				_domReadyEvents.forEach((item) => {
					item(jQ);
				});
				_domReadyEvents = [];
			}
		};
		
		jQ(document).one('DOMContentLoaded', done);
		
		// IE 兼容
		try {
			document.documentElement.doScroll('left');
		} catch (error) {
			setTimeout(done);
		}
		
		// 多重保障监听保障，但 init 保证 done() 只执行一次
		document.onreadystatechange = function () {
			if(document.readyState === 'complete') {
				done();
				document.onreadystatechange = null;
			}
		};
		
		window.onload = function () {
			done();
			window.onload = null;
		};
	}
	
	// nick
	{
		jQ('script').each((item) => {
			let nick = item.getAttribute('nick');
			
			if(!!nick) {
				window[nick] = jQ;
			}
		});
	}
	
	window.$ = jQ;
})(window, document);