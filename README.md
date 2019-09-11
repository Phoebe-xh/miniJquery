# miniJquery
封装的一个 mini 版 jQuery，包含常用的 DOM 操作等 API，也做了一定的兼容。

## usage：基本上同 jQuery
### 1、静态方法

```
type(param)  // 返回param的数据类型：null、undefined、number、boolean、string、array、object、function、regExp、math、date、arguments、error
```

# 2、原型方法

```
each(cb, newThis) // 遍历，cb(item, index, thisArr) cb() 显示返回 false，可以打断遍历

on(eventType, cb)  // 绑定事件，可使用修饰符，如：click.stop.prevent ，stop、prevent 顺序任意
off(eventType, cb)  // 事件解绑，如果省略 cb，则该事件的 cb 全部解绑，否则只解绑该 cb
one(eventType, cb)  // 一次性事件，用法同 on()

val()  // 表单，获取或设置 value 值
html()  // 获取或设置 innerHTML
text()  // innerText

eq()  // 获取对应下标的jQuery对象并返：默认获取第一个对象，-1 表示获取最后一个，超过对象长度，则对它取余再获取
back()  // 在链式调用中，多次获取了对象（如调用了 eq() 方法）,back() 方法返回前一次获取的对象集合

addClass(...classNames)  // 添加（多个）类名
removeClass(...classNames)  // 移出（多个）类名
hasClass()  // 判断(第一个对象)是否含有指定的 class 类名
toggle()
css()  // 获取或设置 css：参数是 name: 获取 对应值；参数 是 name, value： 设置对应值；参数是 { name1: value1, name2: value2 } ：同时设置多个值

attr()  // 操作属性，包括合法和不合法属性, 但是不能准确操作属性值为 Boolean 的属性, 因为该方法总是把属性值当做字符串
prop()  // 操作合法属性，包括 Boolean 类型的合法属性
removeAttr()  // 不传参移除所有对象的指定属性；attr1, attr2, ……，的形式同时移除多个属性

index()  // A.index(B) 返回 A 的下标

appendTo()  // A.appendTo(B): 添加节点，将 A 添加到 B 上,如果 A 是已存在于文档上的，则将 A 添加到 B 的第一个对象上, 如果 A 不存在于文档上，则将 A 依次添加到 B 的所有对象上, B 可能是: '.box' 类的 css 选择器 / js 原生节点 / 该类生成的对象
append()  // A.append(B): 与 appendTo() 相反，这是讲 B 添加到 A 上, 用法同 appendTo()
remove()  // 移除子节点，不传参，移除所有子节点，参数可以是 css 选择器（字符串）/ 原生node对象 / 原生node 集合 / jQuery实例对象

```
