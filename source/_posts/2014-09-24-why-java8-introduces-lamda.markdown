---
layout: post
title: "为什么java8引进了Lambda表达式"
date: 2014-09-24 18:58:45 +0800
comments: true
categories: stackovergiant java lambda
---


我们借用官方文档的例子：http://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html#approach1

看看Lambda 怎么样让我们的代码更具有可读性，而且更为简洁。

我们假如需要输出一个人的信息，我们可能有以下的类
	
	
	public static void printPersons(
	    List<Person> roster, CheckPerson tester) {
	    for (Person p : roster) {
	        if (tester.test(p)) {
	            p.printPerson();
	        }
	    }
	} 



	interface CheckPerson {//接口，用于对于Person对象的验证
	    boolean test(Person p);
	}



	class CheckPersonEligibleForSelectiveService implements CheckPerson {具体的CheckPerson实现 
	    public boolean test(Person p) {
	        return p.gender == Person.Sex.MALE &&
	            p.getAge() >= 18 &&
	            p.getAge() <= 25;
	    }
	}


然后当我们调用的时候，我们会写：

	printPersons(roster, new CheckPersonEligibleForSelectiveService());


显然，`Person`的确是一个重要的对象，但是`CheckPerson` 和 `CheckPersonEligibleForSelectiveService`呢？ 是不是一定需要一个新建一个对象来只调用一次他的方法？其实，我们只是需要这样做（面向对象中，必须要有一个类，然后新建他的实例（非静态的话），才能调用他的方法），所以才这样做。

那假如封装的只是一个函数，然后我们可以简单的传递这样一个函数就能做到这些的话，是不是就很好了呢？这样的话，我们就不需要又创建一个实现类，又自己说动新建一个对象来仅仅只是调用一个函数了。

这时候，我们就需要Lambda了。


	printPersons(
	    roster,
	    (Person p) -> p.getGender() == Person.Sex.MALE
	        && p.getAge() >= 18
	        && p.getAge() <= 25
	);


这样的代码极为的简洁而且具有可读性。而且，我们不需要手动去新建一个`CheckPersonEligibleForSelectiveService`实现类，而且也不需要手动去新建这样的对象，lambda都帮我们做好了。

当然，我们原本也可以使用匿名类去解决这个问题


	printPersons(
	    roster,
	    new CheckPerson() {
	        public boolean test(Person p) {
	            return p.getGender() == Person.Sex.MALE
	                && p.getAge() >= 18
	                && p.getAge() <= 25;
	        }
	    }
	);



但，我们问问自己，我们真的有必要创建一个对象就仅仅为了去做Person验证吗？这样非常的反直觉。

如果我们需要的仅仅是一个函数而不是一整个对象，那么我们就应该关注在这个函数本身，而不是为了这个函数而衍生出一个类，一个对象。



更多本问题讨论请参考：http://stackoverflow.com/questions/23097484/why-lamda-expression-are-introduced-in-java8