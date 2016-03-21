(function(){
var field_game,field_msg,field_mines,field_parent,
		field_level,field_time,btn_restart,unit_size,
		sym_mine='&lowast;',sym_nil='&nbsp;',sym_wrong='&times;',
		levels=[
			// {name:'初级',width:10,height:10,mines:10},
			{name:'中级',width:16,height:16,mines:40},
			// {name:'高级',width:30,height:16,mines:99},
		],blanks=-1,items,level_data,data,total,level,mines,timer;
function init(){
	field_parent=document.getElementById('mine');
	unit_size=Number(field_parent.getAttribute('data-unit-size'))||21;
	var $=field_parent.querySelector.bind(field_parent),i=0,
			b=document.createElement('style');
	b.innerHTML='#game span{width:'+unit_size+'px;height:'+unit_size+'px;line-height:'+unit_size+'px;}';
	document.head.appendChild(b);
	field_parent.innerHTML='\
<label>剩余地雷：<span id=mines>10</span></label>\
<label>已用时间：<span id=time>0</span>s</label>\
<label>级别：<select id=level></select><button id=new>重新开始</button></label>\
<div id=msg></div>\
<div id=game></div>';
	field_game=$('#game');
	field_msg=$('#msg');
	field_mines=$('#mines');
	field_level=$('#level');
	field_time=$('#time');
	btn_restart=$('#new'),
	b=[];
	levels.forEach(function(j){b.push('<option value='+(i++)+'>'+j.name+'</option>');});
	field_level.innerHTML=b.join('');field_level.value=0;
	btn_restart.onclick=field_level.onchange=restart;
	field_game.onclick=field_game.oncontextmenu=function(e){
		e.preventDefault();
		if(blanks) {
			var i=items.indexOf(e.target);
			if(i>=0) click(i,e.type);
		}
	};
	restart();
}
function getPos(i){
	// 返回第i个格子的坐标
	var p={};
	p.top=2+Math.floor(i/level_data.width)*(unit_size+4);
	p.left=2+i%level_data.width*(unit_size+4);
	return p;
}
function getSurroundings(o,includeSelf) {
	// 返回第i个格子周围一圈的格子序号
	// includeSelf表示是否返回自己
	function getRowItems(i) {
		// 返回以i为中心的i所在行的3个序号
		if(i!=o||includeSelf) s.push(i);
		if(i%width) s.push(i-1);
		if((i+1)%width) s.push(i+1);
	}
	var s=[],width=level_data.width;
	if(o>=width) getRowItems(o-width);
	getRowItems(o);
	if(o+width<total) getRowItems(o+width);
	return s;
}
function newGame(current){
	blanks=total-level_data.mines;
	data=[];
	// 以所选格子为中心的3*3的范围内都不能有雷
	var remain_mines=level_data.mines,
			remain_cells=total-9,
			row=Math.floor(current/level_data.width),
			col=current%level_data.width,
			i,item,exclude;
	// 如果所选格子靠边或靠角则需要排除的格子会少一些
	// 用i来计数，靠2条边即靠角
	i=0;
	if(!row||row==level_data.height-1) i++;
	if(!col||col==level_data.width-1) i++;
	if(i--) {
		// 靠一条边时，有3个被排除的格子不存在，加回来
		remain_cells+=3;
		if(i) {
			// 靠角时，有5个格子不存在，则再加个2
			remain_cells+=2;
		}
	}
	// 生成雷的分布表
	for(i=0;i<total;i++) {
		// 相隔一行一列以内则排除
		exclude=Math.abs(Math.floor(i/level_data.width)-row)<=1
					&&Math.abs(i%level_data.width-col)<=1;
		item={
			mine:!exclude&&remain_mines/remain_cells>Math.random(),
			num:0,
		};
		data.push(item);
		if(item.mine) remain_mines--;
		if(!exclude) remain_cells--;
	}
	// 更新所有格子中的数字
	for(i=0;i<total;i++) if(data[i].mine)
		getSurroundings(i).forEach(function(i){data[i].num++;});
	field_msg.innerHTML='开始了，小心一点！';count(1);
}
function restart(e){
	var b=[],i,j;
	level=field_level.value;
	level_data=levels[level];
	total=level_data.width*level_data.height;
	// 生成游戏界面
	j='<span>'+sym_nil+'</span>';
	for(i=0;i<total;i++) b.push(j);
	field_game.innerHTML=b.join('');
	field_game.style.maxWidth=(unit_size+4)*level_data.width+4+'px';
	field_game.style.height=(unit_size+4)*level_data.height+4+'px';
	items=[];
	for(i=0;i<total;i++) {
		b=field_game.childNodes[i];
		j=getPos(i);
		b.style.top=j.top+'px';
		b.style.left=j.left+'px';
		items.push(b);
	}
	field_mines.innerHTML=mines=level_data.mines;
	field_msg.innerHTML='准备开始吧...';
	// blanks=-1 表示游戏尚未开始
	blanks=-1;
	count(-1);
}
function count(f){
	// f<0 清零
	// f>0 开始计时
	// !f  停止计时
	if(timer) {
		clearInterval(timer);
		timer=null;
	}
	var time;
	if(f<0) field_time.innerHTML=time=0;
	else if(f) {
		time=0;
		timer=setInterval(function(){
			field_time.innerHTML=++time;
		},1000);
	}
}
function validate(i){
	var wrong=0,r=0;
	if(data[i].open) {
		r=getSurroundings(i).every(function(i){
			if(!data[i].mine&&data[i].marked)	// 标错雷了
				wrong=1;
			return !data[i].mine^data[i].marked;
		});
		if(wrong) lose(-1);
	}
	return r;
}
function spread(i){
	// 第i个格子为空，则翻开周围的格子
	getSurroundings(i).forEach(open);
}
function spark(i){
	// 第i个格子为数字，且周围有未标记的雷，则闪烁一下
	function work() {
		getSurroundings(i).forEach(function(i){
			if(!data[i].open&&!data[i].marked)
				items[i].classList.toggle('spark');
		});
	}
	work();setTimeout(work, 200);
}
function open(i){
	if(!data[i].open&&!data[i].marked) {
		if(data[i].mine)
			// 点中雷了！
			lose(i);
		else {
			// 翻开一个格子
			items[i].className='open';
			data[i].open=1;blanks--;
			if(data[i].num)
				// 如果有数字则显示数字
				items[i].innerHTML=data[i].num;
			else
				// 否则翻开周围的格子
				spread(i);
			if(!blanks) {
				// 剩余空格数为0了，游戏结束
				field_msg.innerHTML='你赢了！';
				// 将所有没标出的雷标记出来
				for(i=0;i<total;i++)
					if(data[i].mine&&!data[i].marked) items[i].innerHTML=sym_mine;
				count();field_mines.innerHTML=0;
			}
		}
	}
}
function click(i,e){
	switch(e) {
	case 'click':
		if(blanks<0) newGame(i);
		if(data[i].open) {
			if(validate(i)) spread(i);
			else spark(i);
		} else open(i);
		break;
	case 'contextmenu':
		if(!data[i].open) {
			if(data[i].marked=!data[i].marked) {
				items[i].innerHTML=sym_mine;
				field_mines.innerHTML=--mines;
			} else {
				items[i].innerHTML=sym_nil;
				field_mines.innerHTML=++mines;
			}
		}
		break;
	}
}
function lose(e){
	var i;
	if(e>=0) {	// 点中雷了
		i=items[e];i.className='wrong';i.innerHTML=sym_wrong;
	}
	blanks=0;field_msg.innerHTML='你输了！';count();
	for(i=0;i<total;i++)
		if(!data[i].mine&&data[i].marked) {
			// 标错雷了
			items[i].className='wrong';items[i].innerHTML=sym_wrong;
		} else if(data[i].mine&&!data[i].marked)
			// 未标记的雷
			items[i].innerHTML=sym_mine;
}
init();
})();
