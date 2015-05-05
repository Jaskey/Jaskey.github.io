---
layout: post
title: "JavaScript实现私有方法"
date: 2015-03-04 15:06:11 +0800
comments: true
categories: javascript
---

JavaScript的所有成员（属性+方法）都是公有的，但是我们有方法模拟出类似于OOP一样的私有方法。

以下使用例子`Person`，假如我们需要一个`toStr`的私有方法，只能在Person内部才能访问。
其中`printInfo`方法为公有，将使用到`toStr`方法和其他私有方法。

## 1.在构造函数中定义私有方法 ##

	//构造函数
    function Person(name,age){
    	this.name = name;
    	this.age = age;
    
    	//直接在constructor中定义私有方法
    	function privateMethod(){
        	console.log("in private method");
    	}
		//使用var在构造函数定义私有方法
    	var toStr = function(){
    		return this.name + ' is ' + this.age;
    	}

		//公有方法
    	this.printInfo = function(){
    		console.log(toStr());
			privateMethod();
    	}
    }
    //test case
    var p = new Person('Jaskey',24);
    p.printInfo();//两个私有方法能访问，但是toStr字段访问有问题.本机测试显示：  is undefined
    p.toStr();//p.toStr is not a function


以上方法，我们的确构造了两个私有的方法`toStr`和`privateMethod`且在外部不能访问而内部可以访问。

但从打印的结果显示`toStr`并不能正确的访问到`Person`对象中的`name`和`age`。**原因是当`printInfo`方法调用`toStr`时，`toStr`被当成了函数调用，所以`this`的scope被绑定到了全局（浏览器中即window）。**

要解决这个问题，我们必须要让`toStr`调用时，`this`绑定到`Person`的对象中，所以调用`toStr`时，可使用`call`或者`apply`方法调用。如：`toStr.call(this)`。

修改版本：

	function Person(name,age){
    	this.name = name;
    	this.age = age;

    	//直接在constructor中定义私有函数
    	function privateMethod(){
        	console.log("in private method");
    	}
    	//使用var定义私有函数
    	var toStr = function(){
        	return this.name + ' is ' + this.age;
    	}
    
    	this.printInfo = function(){
        	console.log(toStr.call(this));//把this绑定到当前的对象
        	privateMethod.call(this);//为了统一，把privateMethod的this都绑定到正确的scope
    	}
	}


### 问题： ###

使用这种在构造函数中定义私有方法的方式，有两个问题：

1.构造函数中的私有方法并不属于prototype，所以prototype的方法不可以访问这样的方法：

	Person.prototype.myPublicMethod=function(){
	    toStr();//toStr is not defined
	}

2.内存消耗。每一次new一个`Person`对象时,每个函数都会重新创建一份,而我们更希望是share同一个函数对象。



## 2.使用Module Pattern实现  ##

*Douglas Crockford* 有一个模式叫**“Module Pattern”**, 可以使用闭包的方法解决实现私有方法的问题，并且可读性非常高。

使用这个方法，我们自己构造一个Person的原型对象，利用一个闭包，则让其能访问外部的私有方法。

同理，由于需要绑定正确的this作用域，我们使用`call`方法调用
	
	//构建一个原型对象
	Person.prototype = (function(){
	    /******私有方法定义*****/

		//通过var定义
	    var toStr = function(){
	        return this.name + " is " + this.age
	    }
	
		//直接定义
	    function privateMethod(){
	        console.log("in private method");
	    }
	
	
	    return {//返回的这个函数会返回一个原型对象
	        constructor:Person,//把原型的constructor属性设置到正确的构造函数
	        
	        /*******公有方法*******/
	        printInfo:function(){
	            console.log("printing info:",toStr.call(this));
	        },
	
	        publicMethod:function(){
	            privateMethod.call(this);
	        }
	    }
	
	})();//注意这里的括号表示立刻执行此匿名函数，返回原型对象


	//test case
	var p = new Person('Jaskey',24);
	p.printInfo();//printing info: Jaskey is 24
	p.publicMethod();// in private method
	p.toStr();//"undefined is not a function"


通过返回一个新的原型对象，该原型对象可以访问到私有的方法，而且可读性非常高,私有的方法放到原型外面，原型里面的方法都是公有方法。

## 定义一个调用方法以正确this调用所有私有方法 ##

像这样每次的私有方法调用，都需要重新绑定this的scope，非常繁琐。能不能把这个操作封装起来呢？
答案是有的，我们可以定义一个`_`方法，该方法接受一个函数指针，然后返回另外一个this绑定到当前对象的函数，以便正确调用:

        //返回一个函数，该函数的this绑定到当前对象
        _:function(fun){
            var that = this;//保存当前对象作用域
            return function(){//返回一个函数，该函数会调用目标函数，但this绑定到that作用域
                return fun.apply(that,arguments);//记得return
            }
        }


以第二个闭包的方法为例，最后的`Person`版本如下:

    function Person(name,age){
    	this.name = name;
    	this.age = age;    
	}
    
    
    Person.prototype = (function(){
    /******私有方法定义*****/
    	var toStr = function(){
    		return this.name + " is " + this.age;
    	}
    
    function privateMethod(param){
    	console.log("in privateMethod param = ",param);
    	this.publicMethod2();
    }
    
    return {//返回一个原型对象
    	constructor:Person,//把原型的constructor属性设置到正确的构造函数
    
    	/*******公有方法*******/
    	printInfo:function(){
    		console.log("-------printing info-------");
    		console.log("printing info:",this._(toStr));
    		this._(privateMethod)('param from printInfo')
    		console.log("-------end of printing info-------");
    	},
    
    	publicMethod:function(){
    		console.log("-------public Method-------");
    		this._(privateMethod)('param from pubicMethod');
    		console.log("-------end of Public Method-------");
    	},
    	publicMethod2:function(){
    		console.log('in publicMethod2');
    	},
    
    	//返回一个函数，该函数的this绑定到当前对象
    	_:function(fun){
    		var that = this;
    		return function(){
    			return fun.apply(that,arguments);//注意return
    		}
    	}
    }
    
    })();//立刻执行
    
    //test case:
    var p = new Person('Jaskey',24);
    p.printInfo();
    p.publicMethod();
    //p._(toStr)();//toStr is not defined
    

