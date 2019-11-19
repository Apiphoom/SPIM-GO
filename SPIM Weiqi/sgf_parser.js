


function get_first_node(node_string) {
	var dic_prop = parse_single_node(node_string)[0];
	var first_node = node_from_dic(dic_prop, null);
	var size;
	if ('SZ' in dic_prop) {size = parseInt(dic_prop['SZ'][0]);}
    else {size = 19;}
	var game_tree = new GameTree(first_node, size);
	return game_tree;
}


function node_from_dic(dic_prop, father_node) {
	var addB = [];
	var addW = [];
	var move = null;
	var moveColor = null;
	var labels = {};
	var comment = '';
	var triangles = [];
	var circles = [];
	var squares = [];
	var is_winning_node = false;
	var is_loosing_node = false;
	var is_color_locked = false;
	//
	if ('AB' in dic_prop) {
		for (var i=0; i<dic_prop['AB'].length; i++) {
			addB.push([dic_prop['AB'][i][0].charCodeAt()-96,dic_prop['AB'][i][1].charCodeAt()-96]);
		}
	}
	if ('AW' in dic_prop) {
		for (var i=0; i<dic_prop['AW'].length; i++) {
			addW.push([dic_prop['AW'][i][0].charCodeAt()-96,dic_prop['AW'][i][1].charCodeAt()-96]);
		}
	}
	if ('B' in dic_prop) {
		move = [dic_prop['B'][0][0].charCodeAt()-96,dic_prop['B'][0][1].charCodeAt()-96];
		moveColor = 'B';
	}
	if ('W' in dic_prop) {
		move = [dic_prop['W'][0][0].charCodeAt()-96,dic_prop['W'][0][1].charCodeAt()-96];
		moveColor = 'W';
	}
	if ('LB' in dic_prop) {
		for (var i=0; i<dic_prop['LB'].length; i++) {
			labels[[dic_prop['LB'][i][0].charCodeAt()-96,dic_prop['LB'][i][1].charCodeAt()-96]] = dic_prop['LB'][i].slice(3);
		}
	}
	if ('TR' in dic_prop) {
		for (var i=0; i<dic_prop['TR'].length; i++) {
			triangles.push([dic_prop['TR'][i][0].charCodeAt()-96,dic_prop['TR'][i][1].charCodeAt()-96]);
		}
	}
	if ('CR' in dic_prop) {
		for (var i=0; i<dic_prop['CR'].length; i++) {
			circles.push([dic_prop['CR'][i][0].charCodeAt()-96,dic_prop['CR'][i][1].charCodeAt()-96]);
		}
	}
	if ('SQ' in dic_prop) {
		for (var i=0; i<dic_prop['SQ'].length; i++) {
			squares.push([dic_prop['SQ'][i][0].charCodeAt()-96,dic_prop['SQ'][i][1].charCodeAt()-96]);
		}
	}
	if ('C' in dic_prop) {
		comment = dic_prop['C'][0];
		//
		var i_v = comment.indexOf('#V');
		if (i_v > -1) {
			is_winning_node = true;
			comment = comment.replace('#V', '');
		}
		//
		var i_w = comment.indexOf('#W');
		if (i_w > -1) {
			is_loosing_node = true;
			comment = comment.replace('#W', '');
		}
		//
		var i_c = comment.indexOf('#C');
		if (i_c > -1) {
			is_color_locked = true;
			comment = comment.replace('#C', '');
		}
	}
	//
	return new Node(father_node, addB, addW, move, moveColor, labels, comment, triangles, circles, squares, is_winning_node, is_loosing_node, is_color_locked);
}



function parse_single_node(node_string) {
	var dic_prop = {};
	var open_bra = 0;
	var closed_bra = 0;
	var buf = node_string;
	var code;
	while (buf.length > 0) {
		if (buf[0] == '(') {
			open_bra = open_bra + 1;
			buf = buf.slice(1);
		}
		else if (buf[0] == ')') {
			closed_bra = closed_bra + 1;
			buf = buf.slice(1);
		}
		else if (buf[0] == buf[0].toUpperCase() && buf[0].toLowerCase() != buf[0].toUpperCase()) {
			if (buf[1] == buf[1].toUpperCase() && buf[1].toLowerCase() != buf[1].toUpperCase()) {
				code = buf.slice(0,2);
				buf = buf.slice(2);
			}
			else {
				code = buf.slice(0,1);
				buf = buf.slice(1);
			}
			var args_and_buf = read_args(buf);
			var args = args_and_buf[0];
			buf = args_and_buf[1];
			if (code in dic_prop) {
				dic_prop[code].push(args);
			}
			else {
				dic_prop[code] = args;
			}
		}
		else {buf = buf.slice(1);}
	}
	return [dic_prop, open_bra, closed_bra];
}


function read_args(string_to_read) {
	var args = [];
	var buf = string_to_read;
	if (buf[0] != '[') return args;
	else {
		while(true) {
			var end_args = buf.indexOf(']');
			args.push(buf.slice(1,end_args));
			buf = buf.slice(end_args+1);
			if (buf.length == 0 || buf[0] != '[') return [args, buf];
		}
	}
}



function GameTree(first_node, size) {
	this.first = first_node;
	this.size=size || 19;
}

GameTree.prototype.display = function() {
	return this.first.display_with_sons(0);
}

GameTree.prototype.invert_colors = function() {
	this.first.invert_colors();
}

GameTree.prototype.diag_invert = function() {
	function basic_diag_invert(pair) {return [pair[1], pair[0]];}
	this.first.invert(basic_diag_invert);
}

GameTree.prototype.vert_invert = function(size) {
	function basic_vert_invert(pair) {return [pair[0], 1+size-pair[1]];}
	this.first.invert(basic_vert_invert);
}

GameTree.prototype.horiz_invert = function(size) {
	function basic_horiz_invert(pair) {return [1+size-pair[0], pair[1]];}
	this.first.invert(basic_horiz_invert);
}



function Node(father, addB, addW, move, moveColor, labels, comment, triangles, circles, squares, is_winning_node, is_loosing_node, is_color_locked){
	this.father = father || null;
	this.sons = [];
	this.addB = addB || [];
	this.addW = addW || [];
	this.move = move || null;
	this.moveColor = moveColor || null;
	this.labels = labels || {};
	this.comment = comment || '';
	this.triangles = triangles || [];
	this.circles = circles || [];
	this.squares = squares || [];
	this.is_winning_node = is_winning_node || false;
	this.is_loosing_node = is_loosing_node || false;
	this.is_color_locked = is_color_locked || false;
//
	this.capturedStones = [];
	this.koPosition = null;
// 	this.nextMoveColor = 'B';
}

Node.prototype.display_with_sons = function(increment) {
	var res = Array(increment+1).join(' ') + this.moveColor + ' ' + this.move + '\n ';
	for (var i=0; i<this.sons.length; i++) {
		res = res + this.sons[i].display_with_sons(increment+1);
	}
	return res;
}

Node.prototype.has_winning_son = function(ctr) {
	var new_ctr = ctr;
	if (this.is_winning_node) {new_ctr += 1;}
	for (var i=0; i<this.sons.length; i++) {new_ctr += this.sons[i].has_winning_son(new_ctr);}
	return new_ctr;
}

Node.prototype.invert_colors = function() {
	if (this.moveColor == 'B') {this.moveColor = 'W';}
	else if (this.moveColor == 'W') {this.moveColor = 'B';}
	var temp_addW = this.addB.slice(0);
	this.addB = this.addW.slice(0);
	this.addW = temp_addW;
	if (this.comment.length>0) {
		var new_comment = this.comment.replace(/Noir/g, 'Smabaradjan');
		new_comment = new_comment.replace(/Blanc/g, 'Noir');
		new_comment = new_comment.replace(/Smabaradjan/g, 'Blanc');
		new_comment = new_comment.replace(/noir/g, 'smabaradjan');
		new_comment = new_comment.replace(/blanc/g, 'noir');
		new_comment = new_comment.replace(/smabaradjan/g, 'blanc');
		new_comment = new_comment.replace(/black/g, 'smabaradjin');
		new_comment = new_comment.replace(/white/g, 'black');
		new_comment = new_comment.replace(/smabaradjin/g, 'white');
		new_comment = new_comment.replace(/Black/g, 'Smabaradjin');
		new_comment = new_comment.replace(/White/g, 'Black');
		new_comment = new_comment.replace(/Smabaradjin/g, 'White');
		this.comment = new_comment;
	}
	for (var i=0; i<this.sons.length; i++) {
		this.sons[i].invert_colors();
	}
}

Node.prototype.invert = function(basic_invert_function) {
	if (this.move != null) {this.move = basic_invert_function(this.move);}
	if (this.addB.length>0){
		var new_addB = [];
		for (var i=0; i<this.addB.length; i++) {new_addB.push(basic_invert_function(this.addB[i]));}
		this.addB = new_addB;
	}
	if (this.addW.length>0){
		var new_addW = [];
		for (var i=0; i<this.addW.length; i++) {new_addW.push(basic_invert_function(this.addW[i]));}
		this.addW = new_addW;
	}
	var new_labels = {};
	for (var lab in this.labels){
		new_labels[basic_invert_function(lab.split(','))] = this.labels[lab];
	}
	this.labels = new_labels;
	if (this.triangles.length>0){
		var new_triangles = [];
		for (var i=0; i<this.triangles.length; i++){new_triangles.push(basic_invert_function(this.triangles[i]));}
		this.triangles = new_triangles;
	}
	if (this.circles.length>0){
		var new_circles = [];
		for (var i=0; i<this.circles.length; i++){new_circles.push(basic_invert_function(this.circles[i]));}
		this.circles = new_circles;
	}
	if (this.squares.length>0){
		var new_squares = [];
		for (var i=0; i<this.squares.length; i++){new_squares.push(basic_invert_function(this.squares[i]));}
		this.squares = new_squares;
	}
	for (var i=0; i<this.sons.length; i++){
		this.sons[i].invert(basic_invert_function);
	}
}




