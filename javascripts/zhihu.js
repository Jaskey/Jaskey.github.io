var zhihu = (function(){
    
  function render(target, obj){
    var i = 0, html = [], $t = $(target);
	  html.push('<div class="header-main">');
    html.push('    <div class="top">');
    html.push('      <span class="name">Jaskey Lam</span>');
    html.push('       <span class="bio">站在风口，只有猪才能飞起来</span>');
    html.push('     </div>');
       
    html.push('     <div class="body">');
    html.push('       <div class="pic"></div>');
    html.push('     </div>');
    html.push('</div>');

    html.push('  <div class="header-desc">');
    html.push('    <span>你所有的问题</span> ');
    html.push('  </div>');


    html.push('  <div class = "accheviement">');
    html.push('    <span class="user-agree">5599赞同</span>');
    html.push('    <span class="user-thank">1132感谢</span>');
    html.push('  </div>');

    $t.html(html.join(''));

    $.ajax({
  //      dataType: 'jsonp',
        url:'http://www.zhihu.com/people/linjunjie1103',
        success:function(data){
          console.log(data);
        }
    });

  }

  return {
    showProfile: function(options){
          render(options.target);
        }
    };
})();
