

// Stones //

function Stone(x,y,color) {
	this.x = x;
	this.y = y;
	this.color = color; // color should be 'B' or 'W'
}

Stone.prototype.draw = function(ctx, square_size) {
	ctx.beginPath();
	ctx.arc(this.x*square_size,this.y*square_size,square_size/2-1,0,2*Math.PI);
	if (this.color == 'B') {
		var grd=ctx.createRadialGradient(this.x*square_size-2,this.y*square_size+2,1,this.x*square_size,this.y*square_size,square_size/2);
		grd.addColorStop(0,"#353B43");
		grd.addColorStop(1,"Black");
		ctx.fillStyle=grd;
	}
	if (this.color == 'W') {
		var grd=ctx.createRadialGradient(this.x*square_size-2,this.y*square_size+2,1,this.x*square_size,this.y*square_size,square_size/2);
		grd.addColorStop(0,"White");
		grd.addColorStop(1,"#D0DCEB");
		ctx.fillStyle=grd;
	}
	ctx.fill();
}

Stone.prototype.is_neighbor = function(stone) {
	var dst = (this.x - stone.x)*(this.x - stone.x) + (this.y - stone.y)*(this.y - stone.y);
	return dst == 1;
}


// Goban //

function Goban(canvas, size) {
	this.canvas = canvas;
	this.size = size || 19;
	this.sizeSquare = this.compute_size_square()
	this.stones = [];
	this.capturedB = 0;
	this.capturedW = 0;
	this.koForbiddenMove = null;
	this.nextMoveColor = 'B';
	this.labels = {};
	this.decorations = {};

	this.take_care_mouse_coords();

}

Goban.prototype.take_care_mouse_coords = function() {
	// This complicates things a little but but fixes mouse co-ordinate problems
	// when there's a border or padding. See getMouse for more detail
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
	if (document.defaultView && document.defaultView.getComputedStyle) {
		this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingLeft'], 10) || 0;
		this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingTop'], 10) || 0;
		this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderLeftWidth'], 10) || 0;
		this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderTopWidth'], 10) || 0;
	}
	// Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
	// They will mess up mouse coordinates and this fixes that
	var html = document.body.parentNode;
	this.htmlTop = html.offsetTop;
	this.htmlLeft = html.offsetLeft;
}

Goban.prototype.compute_size_square = function() {
	var size_square_x = this.canvas.width / (this.size+1);
	var size_square_y = this.canvas.height / (this.size+1);
	return Math.min(size_square_x, size_square_y);
}

Goban.prototype.get_mouse_pos = function(e) {
	var element = this.canvas, offsetX = 0, offsetY = 0;
	// Compute the total offset
	if (element.offsetParent !== undefined) {
		do {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
		} while ((element = element.offsetParent));
	}
	// Add padding and border style widths to offset
	// Also add the <html> offsets in case there's a position:fixed bar
	offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
	offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

	var mx = e.pageX - offsetX;
	var my = e.pageY - offsetY;
	var x_coord = Math.round((mx/this.canvas.width) * (this.size + 1));
	var y_coord = Math.round((my/this.canvas.height) * (this.size + 1));
	return {x:x_coord, y:y_coord};
}

Goban.prototype.draw = function() {
	var ctx = this.canvas.getContext("2d");
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	ctx.fillStyle="#FFB060";
	ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
	// Draw the goban lines
	for (var i=1;i<this.size+1;i++)
	{
		ctx.lineWidth="1";
		ctx.strokeStyle="black";
		ctx.beginPath();
		ctx.moveTo(this.sizeSquare*i,this.sizeSquare);
		ctx.lineTo(this.sizeSquare*i, this.sizeSquare*this.size);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(this.sizeSquare, this.sizeSquare*i);
		ctx.lineTo(this.sizeSquare*this.size, this.sizeSquare*i);
		ctx.stroke();
	}
	if (this.size == 19){
 		for (var i=0;i<3;i++)
		{
			for (var j=0;j<3;j++)
			{
				ctx.beginPath();
				ctx.arc((4+i*6)*this.sizeSquare,(4+j*6)*this.sizeSquare,5,0,2*Math.PI);
				ctx.fillStyle="black";
				ctx.fill();
			}
		}
	}
	// Coordinates
	for (var i=1;i<this.size+1;i++) {
		ctx.font = "10px Arial";
		ctx.fillStyle='Black';
		ctx.textAlign="center";
		x = this.sizeSquare*.3;
		y = this.sizeSquare*(this.size-i+1);
		ctx.fillText(i,x,y+3);
		y = this.sizeSquare*(this.size+.7);
		x = this.sizeSquare*(i);
		ctx.textAlign="center";
		ctx.fillText(String.fromCharCode(i+64),x,y+3);
	}

	// Draw the stones
	for (var i=0; i<this.stones.length; i++)
	{
		this.stones[i].draw(ctx, this.sizeSquare);
	}
	// ko situation
	if (this.koForbiddenMove != null) {
		var ko_x = this.koForbiddenMove[0];
		var ko_y = this.koForbiddenMove[1];
		ctx.beginPath();
		ctx.lineWidth="5";
		ctx.strokeStyle="red";
		ctx.moveTo(this.sizeSquare*(ko_x-.3),this.sizeSquare*(ko_y-.3));
		ctx.lineTo(this.sizeSquare*(ko_x+.3), this.sizeSquare*(ko_y+.3));
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(this.sizeSquare*(ko_x-.3),this.sizeSquare*(ko_y+.3));
		ctx.lineTo(this.sizeSquare*(ko_x+.3), this.sizeSquare*(ko_y-.3));
		ctx.stroke();
	}
	// labels
	for (var label_pos in this.labels) {
		var pos = label_pos.split(',');
		this.draw_decoration(ctx, [pos[0], pos[1]], this.labels[label_pos]);
	}
	// decorations
	for (var deco_type in this.decorations) {
		for (var i=0; i<this.decorations[deco_type].length; i++){
			this.draw_decoration(ctx, this.decorations[deco_type][i], deco_type);
		}
	}
}

Goban.prototype.draw_decoration = function(ctx, deco_pos, to_draw) {
	var coords_deco = [this.sizeSquare*deco_pos[0], this.sizeSquare*deco_pos[1]];
	// test if drawing on a stone
	var stone_there = '';
	for (var i=0; i<this.stones.length; i++){
		var stone = this.stones[i];
		if ((stone.x == deco_pos[0]) && (stone.y == deco_pos[1])){
			stone_there = stone.color;
		}
	}
	if (stone_there == ''){
// 		 clear a rectangle
		ctx.fillStyle="#FFB060";
		ctx.fillRect(coords_deco[0]-this.sizeSquare/2-1.,coords_deco[1]-this.sizeSquare/2.-1,this.sizeSquare+2,this.sizeSquare+2);
	}
	var deco_color = "black";
	if (stone_there == 'B'){
		deco_color = "white";
	}
	//
	var x = coords_deco[0];
	var y = coords_deco[1];
	var d = this.sizeSquare/2. - 3;
	if (to_draw == 'circles'){
		ctx.beginPath();
		ctx.lineWidth="2";
		ctx.strokeStyle=deco_color;
		ctx.arc(x,y,d/2.,0,2*Math.PI);
		ctx.stroke();
	}
	else if (to_draw == 'triangles'){
		ctx.beginPath();
		ctx.lineWidth="2";
		ctx.strokeStyle=deco_color;
		ctx.moveTo(x,y-d);
		ctx.lineTo(x-Math.sqrt(3)*d/2.+1.,y+d/2.);
		ctx.lineTo(x+Math.sqrt(3)*d/2.-1,y+d/2.);
		ctx.lineTo(x,y-d);
		ctx.stroke();
	}
	else if (to_draw == 'squares'){
		ctx.beginPath();
		ctx.lineWidth="2";
		ctx.strokeStyle=deco_color;
		ctx.moveTo(x-d/1.5,y+d/1.5);
		ctx.lineTo(x+d/1.5,y+d/1.5);
		ctx.lineTo(x+d/1.5,y-d/1.5);
		ctx.lineTo(x-d/1.5,y-d/1.5);
		ctx.lineTo(x-d/1.5,y+d/1.5);
		ctx.stroke();
	}
	else if (to_draw == 'good_moves'){
		ctx.beginPath();
		ctx.arc(x,y,d/2.,0,2*Math.PI);
		ctx.fillStyle="green";
		ctx.fill();
	}
	else if (to_draw == 'bad_moves'){
		ctx.beginPath();
		ctx.arc(x,y,d/2.,0,2*Math.PI);
		ctx.fillStyle="red";
		ctx.fill();
	}
	else {
		ctx.font = "16px Arial";
		ctx.fillStyle=deco_color;
		ctx.textAlign="center";
		ctx.fillText(to_draw,x,y+6);
	}
}

Goban.prototype.add_stone = function(x,y,color) {
	var stone = new Stone(x,y,color);
	if (this.test_pos_free(x,y)) {this.stones.push(stone);}
// 	else {alert('Pos not free');}
}

Goban.prototype.test_pos_free = function(x,y) {
	if (x<1 || y < 1 || x>this.size || y>this.size) return false;
	for (var i=0; i<this.stones.length; i++)
	{
		if (this.stones[i].x == x && this.stones[i].y == y) return false;
	}
	return true;
}

Goban.prototype.get_stone_neighbors = function(stone) {
	var res = [];
	for (var i=0; i<this.stones.length; i++)
	{
		if (this.stones[i].is_neighbor(stone)) res.push(this.stones[i]);
	}
	return res;
}

Goban.prototype.get_adjacent_stones = function(x,y) {
	var res = [];
	for (var i=0; i<this.stones.length; i++)
	{
		if (Math.abs(x-this.stones[i].x)==1 && Math.abs(y-this.stones[i].y)==0) res.push(this.stones[i]);
		if (Math.abs(x-this.stones[i].x)==0 && Math.abs(y-this.stones[i].y)==1) res.push(this.stones[i]);
	}
	return res;
}

Goban.prototype.get_adjacent_free_pos = function(x,y) {
	var res = [];
	if (this.test_pos_free(x+1,y)) res.push((x+1,y));
	if (this.test_pos_free(x-1,y)) res.push((x-1,y));
	if (this.test_pos_free(x,y+1)) res.push((x+1,y));
	if (this.test_pos_free(x,y-1)) res.push((x+1,y));
	return res;
}

Goban.prototype.get_stone_groups = function() {
	var remaining_stones = this.stones.slice(0);
	var res = [];
	while (remaining_stones.length > 0){
		var seed_stone = remaining_stones[0];
		remaining_stones.splice(0, 1);
		var new_group = [seed_stone];
        var stones_to_test = [seed_stone];
        while (stones_to_test.length > 0){
        	var test_stone = stones_to_test[0];
			stones_to_test.splice(0, 1);
			var neighbors = this.get_stone_neighbors(test_stone);
			for (var i=0; i<neighbors.length; i++)
			{
				var neighbor_stone = neighbors[i];
				if (neighbor_stone.color == test_stone.color && new_group.indexOf(neighbor_stone) == -1){
					new_group.push(neighbor_stone);
					stones_to_test.push(neighbor_stone);
					remaining_stones.splice(remaining_stones.indexOf(neighbor_stone), 1);
				}
			}
		}
		res.push(new_group);
	}
	return res;
}

Goban.prototype.get_single_stone_group = function(first_stone) {
	var res = [];
	var stones_to_explore = [first_stone];
	while (stones_to_explore.length > 0) {
		var seed_stone = stones_to_explore[0];
		stones_to_explore.splice(0, 1);
		res.push(seed_stone);
		var neighbors = this.get_stone_neighbors(seed_stone);
		for (var i=0; i<neighbors.length; i++) {
			var neighbor_stone = neighbors[i];
			if (neighbor_stone.color == first_stone.color && res.indexOf(neighbor_stone) == -1) {
				stones_to_explore.push(neighbor_stone);
			}
		}
	}
	return res;
}

Goban.prototype.get_set_liberties = function(group) {
	var set_liberties = {};
	for (var i=0; i<group.length; i++) {
		var stone = group[i];
		if (this.test_pos_free(stone.x+1, stone.y)) set_liberties[[stone.x+1, stone.y]] = true;
		if (this.test_pos_free(stone.x-1, stone.y)) set_liberties[[stone.x-1, stone.y]] = true;
		if (this.test_pos_free(stone.x, stone.y+1)) set_liberties[[stone.x, stone.y+1]] = true;
		if (this.test_pos_free(stone.x, stone.y-1)) set_liberties[[stone.x, stone.y-1]] = true;
	}
	return set_liberties;
}

Goban.prototype.test_liberties = function(group) {
	for (var i=0; i<group.length; i++) {
		var stone = group[i];
		if (this.test_pos_free(stone.x+1, stone.y)) return true;
		if (this.test_pos_free(stone.x-1, stone.y)) return true;
		if (this.test_pos_free(stone.x, stone.y+1)) return true;
		if (this.test_pos_free(stone.x, stone.y-1)) return true;
	}
	return false;
}

Goban.prototype.test_suicide_move = function(x,y) {
	var neighbor_stones = this.get_adjacent_stones(x, y);
	var neighbor_friend_groups = [];
	var neighbor_foes_groups = [];
	for (var i=0; i<neighbor_stones.length; i++) {
		var stone = neighbor_stones[i];
		if (stone.color == this.nextMoveColor) {
			neighbor_friend_groups.push(this.get_single_stone_group(stone));
		}
		else {
			neighbor_foes_groups.push(this.get_single_stone_group(stone));
		}
	}
	if (this.get_adjacent_free_pos(x,y).length == 0) {
		for (var i=0; i<neighbor_foes_groups.length; i++) {
			var group = neighbor_foes_groups[i];
			if (Object.keys(this.get_set_liberties(group)).length == 1) return false;
		}
		if (neighbor_friend_groups.length == 0) return true;
		else {
			var set_liberties = {};
			for (var j=0; j<neighbor_friend_groups.length; j++){
				var group = neighbor_friend_groups[j];
				var temp_set_liberties = this.get_set_liberties(group);
				for (var lib in temp_set_liberties){
					set_liberties[lib] = true;
				}
			}
			return (Object.keys(set_liberties).length == 1);
		}
	}
	else return false;
}

Goban.prototype.is_allowed_move = function(x,y) {
	var possible_move = true;
	if (!(this.test_pos_free(x,y))){
		possible_move = false;
	}
	if (this.test_suicide_move(x,y)){
		possible_move = false;
	}
	if (this.koForbiddenMove != null && this.koForbiddenMove[0] == x && this.koForbiddenMove[1] == y){
		possible_move = false;
	}
	return possible_move;
}

Goban.prototype.change_next_move_color = function() {
	if (this.nextMoveColor == 'B') this.nextMoveColor = 'W';
	else this.nextMoveColor = 'B';
}

Goban.prototype.remove_stones = function(group) {
	for (var i=0; i<group.length; i++) {
		var stone = group[i];
		this.stones.splice(this.stones.indexOf(stone), 1);
		if (stone.color == 'B') this.capturedB += 1;
		else if (stone.color == 'W') this.capturedW += 1;
	}
}

Goban.prototype.delete_stone_at_position = function(x,y) {
	var stone_to_delete = null;
	for (var i=0; i<this.stones.length; i++) {
		var stone = this.stones[i];
		if ((stone.x==x) && (stone.y==y)) {stone_to_delete=stone;}
	}
	if (stone_to_delete != null) {this.stones.splice(this.stones.indexOf(stone_to_delete), 1);}
}

Goban.prototype.new_move = function(x,y) { // return the captured stones and the ko position if any
	var captured = [];
	if (this.is_allowed_move(x,y)) {
		this.add_stone(x,y,this.nextMoveColor);
		this.change_next_move_color();
		// remove potential prisonners
		var groups = this.get_stone_groups();
		for (var i=0; i<groups.length; i++) {
			var group = groups[i];
			for (var j=0; j<group.length; j++) {
				var stone = group[j];
				if (stone.x==x && stone.y == y) var modified_group = group;
			}
		}
		groups.splice(groups.indexOf(modified_group), 1);
		for (var i=0; i<groups.length; i++) {
			var group = groups[i];
			if (!(this.test_liberties(group))) {
				this.remove_stones(group);
				for (var j=0; j<group.length; j++) {
					captured.push(group[j]);
				}
			}
		}
		// test ko situation
		if (captured.length == 1 && this.get_adjacent_free_pos(x,y).length == 1) {
			var neighbor_stones = this.get_adjacent_stones(x,y);
			var new_stone_single_and_in_atari = true;
			for (var i=0; i<neighbor_stones.length; i++) {
				if (neighbor_stones[i].color != this.nextMoveColor) new_stone_single_and_in_atari=false;
			}
			if (new_stone_single_and_in_atari) {
				this.koForbiddenMove = [captured[0].x, captured[0].y];
			}
		}
		else this.koForbiddenMove = null;
	}
	var res = {};
	res['captured'] = captured;
	res['ko'] = this.koForbiddenMove;
	return res;
}






