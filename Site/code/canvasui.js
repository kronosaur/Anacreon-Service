//	canvasui.js
//
//	Core functions and definitions.
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.
//
//	VERSION
//
//	1:	Initial implementation

//	CanvasContainer ------------------------------------------------------------
//
//	USAGE
//
//	1.	Create a CanvasContainer object, passing the JQuery canvas object and
//		the descriptor and data.
//	2.	Call destroy on the canvasContainer object when done.
//
//	DESCRIPTOR
//
//	content: An array of control descriptors. Each control descriptor must have
//		the following interface:
//
//		xPos, yPos: Position of control relative to container
//		cxWidth, cyHeight: Width and height of control.
//
//		onDraw (ctx, x, y, isHovering): Draw the control at the given position.
//		onMouseDown (e, x, y): Mouse click at x, y (relative to control)
//	
//	xPos, yPos: Position of the container relative to the canvas.
//	cxWidth, cyHeight: Width and height of container.
//
//	MEMBER FUNCTIONS
//
//	MEMBER VARIABLES
//
//	animationInterval: Animation
//	canvas: JQuery canvas object
//	content: List of controls objects
//	ctx: Canvas drawing context
//	xPos, yPos: Position of the container relative to the canvas.
//	cxWidth, cyHeight: Width and height of container.

function CanvasContainer (canvas, desc)
	{
	var i;
	
	//	Initialize our basic members
	
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	this.xPos = desc.xPos;
	this.yPos = desc.yPos;
	this.cxWidth = desc.cxWidth;
	this.cyHeight = desc.cyHeight;
	this.content = desc.content;

	//	Animation

	this.isInvalid = true;
	this.animationInterval = setInterval(
		(function (theCtrl)
			{
			return (function ()
				{
				theCtrl.handleAnimate();
				});
			})(this),
		1000 / 30);

	//	Add listeners to track mouse input
	
	this.canvas.on("mousedown", { canvasCtrl: this },
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;
			
			//	Handle it
			
			e.data.canvasCtrl.handleMouseDown(e, x, y);
			})
		);
		
	this.canvas.on("mousemove", { canvasCtrl: this },
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;
			
			//	Handle it
			
			e.data.canvasCtrl.handleMouseMove(e, x, y);
			})
		);
	}

CanvasContainer.prototype.destroy = function ()
	{
	this.canvas.off("mousedown");
	this.canvas.off("mousemove");
	
	if (this.animationInterval)
		clearInterval(this.animationInterval);

	return null;
	}

CanvasContainer.prototype.draw = function ()
	{
	var i;

	this.ctx.save();

	var x = this.xPos;
	var y = this.yPos;

	for (i = 0; i < this.content.length; i++)
		{
		var theCtrl = this.content[i];
		var isHovering = (theCtrl == this.hoverCtrl);

		theCtrl.onDraw(this.ctx, x + theCtrl.xPos, y + theCtrl.yPos, isHovering);
		}

	this.ctx.restore();
	}

CanvasContainer.prototype.findControlAtPos = function (x, y)
	{
	var i;
	
	for (i = 0; i < this.content.length; i++)
		{
		var theCtrl = this.content[i];
		if (x >= theCtrl.xPos 
				&& y >= theCtrl.yPos
				&& x < theCtrl.xPos + theCtrl.cxWidth
				&& y < theCtrl.yPos + theCtrl.cyHeight)
			return theCtrl;
		}
		
	return null;
	}
	
CanvasContainer.prototype.handleAnimate = function ()
	{
	if (this.isInvalid)
		{
		this.ctx.clearRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
		this.draw();

		this.isInvalid = false;
		}
	}
	
CanvasContainer.prototype.handleMouseDown = function (e, xMouse, yMouse)
	{
	var theCtrl = this.findControlAtPos(xMouse, yMouse);
	if (theCtrl && theCtrl.onMouseDown)
		theCtrl.onMouseDown(e, (xMouse - theCtrl.xPos), (yMouse - theCtrl.yPos));
	}
	
CanvasContainer.prototype.handleMouseMove = function (e, xMouse, yMouse)
	{
	//	Are we hovering over an active tile?
	
	var newHoverCtrl = this.findControlAtPos(xMouse, yMouse);

	//	Switch
	
	if (this.hoverCtrl != newHoverCtrl)
		{
		this.hoverCtrl = newHoverCtrl;
		this.ctx.clearRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
		this.draw();
		}
	}

//	CanvasEdit -----------------------------------------------------------------
//
//	DESCRIPTOR
//
//	cxWidth: The width of the edit control
//	cyHeight: The height of the edit control
//	xPos: The position of the control relative to the origin
//	yPos: The position of the control relative to the origin
//
//	text: Current text.
//	textAlign: Text alignment
//	textColor: Color to use to draw text
//	textFont: Font to use to draw text
//
//	inputCtrl: Input element
//	editLabel: The label to use to edit
//	readOnly: If TRUE, cannot edit
//
//	onChanged (newText, data)

function CanvasEdit (canvas, desc, data)
	{
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	this.data = data;

	this.text = desc.text;
	this.textAlign = desc.textAlign;
	this.textColor = desc.textColor;
	this.textFont = desc.textFont;

	this.inputCtrl = desc.inputCtrl;
	this.editLabel = (desc.editLabel ? desc.editLabel : "edit");
	this.readOnly = desc.readOnly;

	this.onChanged = desc.onChanged;

	//	Measure the text so we can compute some metrics

	this.ctx.save();
	this.ctx.font = this.textFont;
	var cxText = this.ctx.measureText(this.text).width;

	this.ctx.font = $Style.tileFontSmall;
	var cxLabel = this.ctx.measureText(this.editLabel).width;
	var cxSave = this.ctx.measureText("save").width;
	var cxCancel = this.ctx.measureText("cancel").width;
	this.ctx.restore();

	var cxPadding = 4;
	var cyPadding = 0;

	//	Compute the position of the text and the hover box

	if (this.textAlign == "center")
		{
		this.xText = desc.xPos + (desc.cxWidth / 2);
		this.yText = desc.yPos;

		this.xHover = this.xText - ((cxText / 2) + cxPadding);
		}
	else if (this.textAlign == "right")
		{
		this.xText = desc.xPos + desc.cxWidth;
		this.yText = desc.yPos;

		this.xHover = this.xText - (cxText + cxPadding);
		}
	else
		{
		this.xText = desc.xPos;
		this.yText = desc.yPos;

		this.xHover = this.xText - cxPadding;
		}

	this.yHover = this.yText - cyPadding;
	this.cxHover = cxPadding + cxText + cxPadding + cxLabel + cxPadding;
	this.cyHover = cyPadding + desc.cyHeight + cyPadding;

	this.xLabel = this.xHover + cxPadding + cxText + cxPadding;
	this.yLabel = this.yText;

	//	Compute the position of the edit control

	this.xInput = desc.xPos - 2;
	this.yInput = desc.yPos - 2;
	this.cxInput = desc.cxWidth + 4;
	this.cyInput = desc.cyHeight + 4;

	//	Compute position of save/cancel buttons

	this.xSave = this.xInput + this.cxInput;
	this.ySave = this.yText;
	this.cxSave = cxSave;
	this.cySave = this.cyHover;

	this.xCancel = this.xSave + cxSave + 10;
	this.yCancel = this.yText
	this.cxCancel = cxCancel;
	this.cyCancel = this.cyHover;

	//	State

	this.state = null;
	this.isInvalid = true;
	}

CanvasEdit.prototype.cancelModal = function ()
	{
	if (this.state == "edit")
		this.exitEditMode();
	}

CanvasEdit.prototype.destroy = function ()
	{
	this.cancelModal();
	this.erase(this.ctx);
	return null;
	}
	
CanvasEdit.prototype.draw = function (ctx)
	{
	//	If in edit mode, we paint the save/cancel buttons

	if (this.state == "edit")
		{
		ctx.fillStyle = $Style.tileHoverBackground;

		if (this.hover == "save")
			ctx.fillRect(this.xSave, this.ySave, this.cxSave, this.cySave);
		else if (this.hover == "cancel")
			ctx.fillRect(this.xCancel, this.yCancel, this.cxCancel, this.cyCancel);

		//	Paint labels

		ctx.font = $Style.tileFontSmall;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";

		ctx.fillText("save", this.xSave, this.ySave);
		ctx.fillText("cancel", this.xCancel, this.yCancel);
		}

	//	Otherwise, normal mode.

	else
		{
		//	Paint hover

		if (this.hover == "edit")
			{
			ctx.fillStyle = $Style.tileHoverBackground;
			ctx.fillRect(this.xHover, this.yHover, this.cxHover, this.cyHover);

			ctx.font = $Style.tileFontSmall;
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.textBaseline = "top";
			ctx.textAlign = "left";
			ctx.fillText(this.editLabel, this.xLabel, this.yLabel);
			}

		//	Paint text

		ctx.font = this.textFont;
		ctx.fillStyle = this.textColor;
		ctx.textAlign = this.textAlign;
		ctx.textBaseline = "top";

		ctx.fillText(this.text, this.xText, this.yText);
		ctx.textAlign = "left";
		}
	}

CanvasEdit.prototype.enterEditMode = function ()
	{
	this.erase(this.ctx);

	$UI.enterModal();

	this.state = "edit";

	this.inputCtrl.show();
	this.inputCtrl.css("left", this.xInput + "px");
	this.inputCtrl.css("top", this.yInput + "px");
	this.inputCtrl.css("width", this.cxInput + "px");
	this.inputCtrl.css("height", this.cyInput + "px");
	this.inputCtrl.css("textAlign", this.textAlign);
	this.inputCtrl.css("color", this.textColor);
	this.inputCtrl.css("font", this.textFont);

	//	Needed because Sansation font has a bug in it.
	this.inputCtrl.css("font-variant-ligatures", "none");

	this.inputCtrl.val(this.text);
	this.inputCtrl.focus();

	//	Hook up keyboard UI

	$UI.keydown((function (e)
		{
		var ctrl = e.data.canvasCtrl;
		switch (e.which)
			{
			case KEY_ESCAPE:
				ctrl.exitEditMode();
				break;

			case KEY_ENTER:
				ctrl.exitEditMode(true);
				break;
			}
		}),
		{ canvasCtrl: this }
		);

	//	Redraw

	this.hover = null;
	this.draw(this.ctx);
	}

CanvasEdit.prototype.erase = function (ctx)
	{
	ctx.clearRect(this.xHover, this.yHover, this.xCancel - this.xHover + this.cxCancel, this.cyHover);
	}

CanvasEdit.prototype.exitEditMode = function (save)
	{
	this.state = null;
	if (save)
		this.text = this.inputCtrl.val();

	this.inputCtrl.hide();

	$UI.exitModal();

	this.hover = null;
	this.erase(this.ctx);
	this.draw(this.ctx);

	//	If saving, fire event

	if (save && this.onChanged)
		this.onChanged(this.text, this.data);
	}

CanvasEdit.prototype.hitTest = function (xPos, yPos)
	{
	if (this.state == "edit")
		{
		if (xPos >= this.xSave && xPos < this.xSave + this.cxSave
				&& yPos >= this.ySave && yPos < this.ySave + this.cySave)
			return "save";
		else if (xPos >= this.xCancel && xPos < this.xCancel + this.cxCancel
				&& yPos >= this.yCancel && yPos < this.yCancel + this.cyCancel)
			return "cancel";
		else
			return null;
		}
	else
		{
		if (xPos >= this.xHover && xPos < this.xHover + this.cxHover
				&& yPos >= this.yHover && yPos < this.yHover + this.cyHover)
			return "edit";
		else
			return null;
		}
	}

CanvasEdit.prototype.inModal = function ()
	{
	return (this.state != null);
	}

CanvasEdit.prototype.onMouseDown = function (xPos, yPos)
	{
	if (this.readOnly)
		return;

	var hitTest = this.hitTest(xPos, yPos);
	if (hitTest == "edit")
		this.enterEditMode();
	else if (hitTest == "save")
		this.exitEditMode(true);
	else if (hitTest == "cancel")
		this.exitEditMode();
	}

CanvasEdit.prototype.onMouseMove = function (xPos, yPos)
	{
	if (this.readOnly)
		return;

	//	See if we are hovering over something

	var newHover = this.hitTest(xPos, yPos);
	if (newHover != this.hover)
		{
		this.hover = newHover;
		this.erase(this.ctx);
		this.draw(this.ctx);
		}
	}

//	CanvasGrid -----------------------------------------------------------------
//
//	USAGE
//
//	1.	Create a CanvasGrid object passing the JQuery canvas object and the 
//		canvas descriptor and data.
//	2.	Call destroy on the canvasGrid objects when done.
//
//	DESCRIPTOR
//
//	cxStdTile: Width of a standard tile.
//	cyStdTile: The height of a standard tile (we always align tiles on this 
//		boundary).
//
//	onGetTileList(canvasGrid, data): This function should return an array of
//		tile descriptors. Each tile descriptor is a structure with the following
//		fields:
//
//		animate: If true, we repaint this tile.
//		cyTile: The height of the tile (if null, we use a standard tile).
//		data: This item is passed to any functions defined here.
//		id: An ID for the tile.
//		onClick(canvasGrid, id, data): If not null this is a function to call if
//			the user clicks on the tile.
//		onPaint(ctx, x, y, cxWidth, cyHeight, data): A function to paint the 
//			tile contents. This paints on top of the tile background (which is 
//			painted by CanvasGrid).
//
//	noEvents: Do not register events; instead, caller will call
//		onMouseDown, onMouseMove, etc.
//
//	xPos: The position of the control on the canvas
//	yPos: The position of the control on the canvas
//	cxWidth: Width of control
//	cyHeight: Height of control
//
//	uiState: Saved ui state.
//
//	MEMBER FUNCTIONS
//
//	destroy ()
//
//	MEMBER VARIABLES
//
//	cxStdTile: Width of a standard tile.
//	cyStdTile: Height of a standard tile.
//	hoverTile: If not null, we are hovering over this tile.
//	tileList: Array of CanvasGridTile objects. [See below]

function CanvasGrid (canvas, desc, data)
	{
	var i;
	
	//	Initialize our basic members
	
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	
	this.cxStdTile = (desc.cxStdTile != null ? desc.cxStdTile : 180);
	this.cyStdTile = (desc.cyStdTile != null ? desc.cyStdTile : 42);
	this.xPos = (desc.xPos != null ? desc.xPos : 0);
	this.yPos = (desc.yPos != null ? desc.yPos : 0);
	this.cxWidth = (desc.cxWidth != null ? desc.cxWidth : canvas.width() - this.xPos);
	this.cyHeight = (desc.cyHeight != null ? desc.cyHeight : canvas.height() - this.yPos);
	this.noEvents = desc.noEvents;
	
	this.data = data;
	
	//	Some basic metrics
	
	this.cxInterTile = 1;
	this.cyInterTile = 1;
	
	//	Compute max width and height of the grid
	
	var cxGrid = this.cxWidth;
	var cyGrid = this.cyHeight;
	
	//	Initialize the tile list
	
	this.tileList = [];
	this.animationNeeded = false;
	var theList = desc.onGetTileList(this, this.data);
	var xCur = 0;
	var yCur = 0;
    var cxCol = 0;
	for (i = 0; i < theList.length; i++)
		{
		//	Compute the height of this tile.
		
		var height = Math.ceil(theList[i].cyTile / this.cyStdTile);
        var cxTile = (theList[i].cxTile ? theList[i].cxTile : this.cxStdTile);
		var cyTile = height * this.cyStdTile + (height - 1) * this.cyInterTile;
		
		//	Compute the position of this tile. If we fit in this column, then
		//	we are OK. Otherwise, we advance to the next column.
		
		if (cxCol > 0 && yCur > 0 && yCur + cyTile > cyGrid)
			{
			yCur = 0;
			xCur += cxCol + this.cxInterTile;
            cxCol = 0;
			}

        //  Compute the width of the column

        cxCol = Math.max(cxCol, cxTile);
		
		//	Add the tile.
		
		this.tileList.push(new CanvasGridTile(this.xPos + xCur, this.yPos + yCur, cxTile, cyTile, theList[i]));
		
		//	Do we need animation
		
		if (theList[i].animate)
			this.animationNeeded = true;
		
		//	Next
		
		yCur += cyTile + this.cyInterTile;
		}

	//	Compute the total size of the tile set and see if we need scroll bars

	this.cxTileSet = xCur + cxCol;
	if (this.cxTileSet > this.cxWidth)
		{
		this.cxScrollBar = 30;
		this.xMaxScrollPos = this.cxTileSet - this.cxWidth;
		this.xScrollPos = (desc.uiState ? Math.min(desc.uiState.xScrollPos, this.xMaxScrollPos) : 0);
		this.xDesiredScrollPos = this.xScrollPos;
		this.cxClipStart = (this.xScrollPos == 0 ? 0 : this.cxScrollBar);
		this.cxClipEnd = (this.xScrollPos == this.xMaxScrollPos ? this.cxWidth : this.cxWidth - this.cxScrollBar);
		}
	else
		{
		this.xScrollPos = 0;
		this.xDesiredScrollPos = 0;
		this.xMaxScrollPos = 0;
		}
		
	//	Animation

	this.isInvalid = true;
	
	if (this.animationNeeded || this.cxTileSet > this.cxWidth)
		this.animationInterval = setInterval(
			(function (theCtrl)
				{
				return (function ()
					{
					theCtrl.onAnimate();
					});
				})(this),
			1000 / 30);
		

	//	Register for events

	if (!this.noEvents)	
		{
		this.canvas.on("mousedown", { canvasCtrl: this },
			(function (e)
				{
				//	Convert coordinate to canvas-relative
			
				var canvasOffset = e.data.canvasCtrl.canvas.offset();
				var x = e.pageX - canvasOffset.left;
				var y = e.pageY - canvasOffset.top;
			
				//	Handle it
			
				e.data.canvasCtrl.onMouseDown(x, y);
				})
			);
		
		this.canvas.on("mousemove", { canvasCtrl: this },
			(function (e)
				{
				//	Convert coordinate to canvas-relative
			
				var canvasOffset = e.data.canvasCtrl.canvas.offset();
				var x = e.pageX - canvasOffset.left;
				var y = e.pageY - canvasOffset.top;
			
				//	Handle it
			
				e.data.canvasCtrl.onMouseMove(x, y);
				})
			);
		}
		
	//	Draw all the tiles
	
	this.draw();
	}
	
CanvasGrid.prototype.destroy = function ()
	{
	if (!this.noEvents)
		{
		this.canvas.off("mousedown");
		this.canvas.off("mousemove");
		}
	
	if (this.animationInterval)
		clearInterval(this.animationInterval);
		
	return null;
	}
	
CanvasGrid.prototype.draw = function ()
	{
	var i;

	//	If necessary, clip

	if (this.cxClipStart != null)
		{
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(this.xPos + this.cxClipStart, this.yPos, this.cxClipEnd - this.cxClipStart, this.cyHeight);
		this.ctx.clip();
		}
	
	for (i = 0; i < this.tileList.length; i++)
		{
		var theTile = this.tileList[i];
		
		//	Draw tile background
		
		if (theTile == this.hoverTile)
			this.ctx.fillStyle = $Style.tileHoverBackground;
		else
			this.ctx.fillStyle = $Style.tileNormalBackground;

		var xOldPos = theTile.xPos;
		theTile.xPos -= this.xScrollPos;
		
		this.ctx.globalAlpha = 0.5;
		this.ctx.fillRect(theTile.xPos, theTile.yPos, theTile.cxWidth, theTile.cyHeight);
		this.ctx.globalAlpha = 1.0;
		
		//	Draw tile contents
		
		theTile.draw(this.ctx);
		theTile.xPos = xOldPos;
		}

	//	Restore

	if (this.cxClipStart != null)
		{
		this.ctx.restore();

		this.ctx.fillStyle = $Style.tileTextNormal;
		if (this.cxClipStart != 0)
			this.ctx.fillRect(this.xPos + this.cxClipStart - 1, this.yPos, 1, this.cyHeight);

		if (this.cxClipEnd != this.cxWidth)
			this.ctx.fillRect(this.xPos + this.cxClipEnd, this.yPos, 1, this.cyHeight);
		}

	//	Draw the left arrow

	if (this.xDesiredScrollPos > 0)
		{
		var xArrow = this.xPos + this.cxClipStart - (this.cxScrollBar / 2);
		var yArrow = this.yPos + (this.cyHeight / 2);

		CanvasUtil.drawScrollArrowLeft(this.ctx, xArrow, yArrow, this.hoverTile == "left");
		}

	//	Draw the right arrow

	if (this.xDesiredScrollPos < this.xMaxScrollPos)
		{
		var xArrow = this.xPos + this.cxClipEnd + (this.cxScrollBar / 2);
		var yArrow = this.yPos + (this.cyHeight / 2);

		CanvasUtil.drawScrollArrowRight(this.ctx, xArrow, yArrow, this.hoverTile == "right");
		}
	}
	
CanvasGrid.prototype.findTileAtPos = function (xPos, yPos)
	{
	var i;
	
	for (i = 0; i < this.tileList.length; i++)
		{
		var theTile = this.tileList[i];
		if (xPos >= theTile.xPos 
				&& yPos >= theTile.yPos
				&& xPos < theTile.xPos + theTile.cxWidth
				&& yPos < theTile.yPos + theTile.cyHeight)
			return theTile;
		}
		
	return null;
	}
	
CanvasGrid.prototype.hitTestLeftArrow = function (x, y)
	{
	return (this.xDesiredScrollPos > 0 && x >= this.xPos && x < this.xPos + this.cxScrollBar && y >= this.yPos && y < this.yPos + this.cyHeight);
	}

CanvasGrid.prototype.hitTestRightArrow = function (x, y)
	{
	return (this.xDesiredScrollPos < this.xMaxScrollPos && x >= this.xPos + this.cxClipEnd && x < this.xPos + this.cxWidth && y >= this.yPos && y < this.yPos + this.cyHeight);
	}

CanvasGrid.prototype.onAnimate = function ()
	{
	if (this.isInvalid || this.animationNeeded)
		{
		this.ctx.clearRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
		this.draw();

		//	Update scroll position, if necessary

		if (this.xDesiredScrollPos != this.xScrollPos)
			{
			var diff = Math.floor((this.xDesiredScrollPos - this.xScrollPos) / 2);
			if (diff == 0)
				this.xScrollPos = this.xDesiredScrollPos;
			else
				this.xScrollPos += diff;
			}
		else
			this.isInvalid = false;
		}
	}
	
CanvasGrid.prototype.onMouseDown = function (xMouse, yMouse)
	{
	if (this.hitTestLeftArrow(xMouse, yMouse))
		{
		this.scrollLeft();
		}
	else if (this.hitTestRightArrow(xMouse, yMouse))
		{
		this.scrollRight();
		}
	else
		{
		var theTile = this.findTileAtPos(xMouse + this.xScrollPos, yMouse);
		if (theTile && theTile.onClick)
			theTile.onClick(this, theTile.id, theTile.data);
		}
	}
	
CanvasGrid.prototype.onMouseMove = function (xMouse, yMouse)
	{
	var newHoverTile;

	if (this.hitTestLeftArrow(xMouse, yMouse))
		newHoverTile = "left";
	else if (this.hitTestRightArrow(xMouse, yMouse))
		newHoverTile = "right";
	else
		{
		newHoverTile = this.findTileAtPos(xMouse + this.xScrollPos, yMouse);

		//	Are we hovering over an active tile?
	
		if (newHoverTile && newHoverTile.onClick == null)
			newHoverTile = null;
		}
		
	//	Switch
	
	if (this.hoverTile != newHoverTile)
		{
		this.hoverTile = newHoverTile;
		this.ctx.clearRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
		this.draw();
		}
	}

CanvasGrid.prototype.onMouseWheel = function (xMouse, yMouse, delta)
	{
	var i;

	if (delta < 0)
		{
		for (i = 0; i < -delta; i++)
			this.scrollRight();
		}
	else
		{
		for (i = 0; i < delta; i++)
			this.scrollLeft();
		}
	}

CanvasGrid.prototype.saveUIState = function ()
	{
	return {
		xScrollPos: this.xScrollPos,
		};
	}

CanvasGrid.prototype.scrollLeft = function ()
	{
	var cxCol = this.cxStdTile + this.cxInterTile;
	var colNumber = Math.ceil((this.xDesiredScrollPos + this.cxClipStart) / cxCol);
	var newScrollPos = ((colNumber - 1) * cxCol) - this.cxClipStart;

	//	Scroll

	this.xDesiredScrollPos = newScrollPos;
	if (this.xDesiredScrollPos <= 0)
		{
		this.xDesiredScrollPos = 0;
		this.cxClipStart = 0;
		}

	this.cxClipEnd = this.cxWidth - this.cxScrollBar;
	this.isInvalid = true;
	}

CanvasGrid.prototype.scrollRight = function ()
	{
	var cxCol = this.cxStdTile + this.cxInterTile;
	var colNumber = Math.floor((this.xDesiredScrollPos + this.cxClipEnd) / cxCol);
	var newScrollPos = ((colNumber + 1) * cxCol) - this.cxClipEnd;

	//	Scroll

	this.xDesiredScrollPos = newScrollPos;
	if (this.xDesiredScrollPos >= this.xMaxScrollPos)
		{
		this.xDesiredScrollPos = this.xMaxScrollPos;
		this.cxClipEnd = this.cxWidth;
		}

	this.cxClipStart = this.cxScrollBar;
	this.isInvalid = true;
	}
	
//	CanvasGridTile -------------------------------------------------------------
//
//	MEMBER VARIABLES
//
//	cxWidth: The width of the tile
//	cyHeight: The height of the tile
//	data: This item is passed to any functions defined here.
//	id: An ID for the tile.
//
//	painter: A painter to paint the tile contents. This paints on top of the
//		tile background (which is painted by CanvasGrid).
//
//	onClick(canvasGrid, id, data): If not null this is a function to call if
//		the user clicks on the tile.
//
//	xPos: The position of the tile relative to the canvas
//	yPos: The position of the tile relative to the canvas
	
function CanvasGridTile (x, y, cxTile, cyTile, desc)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxTile;
	this.cyHeight = cyTile;
	
	this.data = desc.data;
	this.id = desc.id;
	this.onClick = desc.onClick;
	this.onPaint = desc.onPaint;
	}

CanvasGridTile.prototype.draw = function (ctx)
	{
	this.onPaint(ctx, this.xPos, this.yPos, this.cxWidth, this.cyHeight, this.data);
	}

//	CanvasLongList -------------------------------------------------------------
//
//	USAGE
//
//	1.	Create a CanvasLongList object passing the JQuery canvas object and the 
//		descriptor and data.
//	2.	Call destroy on the canvasLongList objects when done.
//
//	DESCRIPTOR
//
//	content: An array of tile descriptors. Each tile descriptor is a structure
//		with the following fields:
//
//		data: Opaque data for the tile.
//		id: An ID for the tile.
//		image: An image for the tile.
//		label: A label for the tile.
//	
//	cxTile: width of tile (defaults to 128)
//	cyTile: height of tile (defaults to 96)
//	cxWidth: Width of canvas (defaults to canvas size)
//	cyHeight: Height of canvas (defaults to tile height)
//
//	onCreateTile (x, y, width, height, desc) : If non-null this is a function
//		that will create a tile object.
//
//	onSelectionChanged (newSelectionID)
//
//	xPos: The position of the control on the canvas
//	yPos: The position of the control on the canvas
//
//	MEMBER VARIABLES
//
//	animationInterval: Animation interval ID.
//	canvas: The JQuery canvas object
//	ctx: The canvas 2D context
//	cxScrollArrow: Width of scroll arrows
//	cxTile, cyTile: Size of a tile
//	cxWidth, cyHeight: The width and height that we control
//	data: Opaque data passed in at create-time
//	onCreateTile: See above.
//	xPos, yPos: The position on the canvas that we control
//	selectionIndex: Current selection index (-1 if no selection)
//	xViewport, yViewport: Position of the viewport (relative to canvas)
//	cxViewport, cyViewport: The size of the viewport
//	xScrollPos: Horizontal scroll position

function CanvasLongList (canvas, desc, data)
	{
	var i;
	
	//	Initialize our basic members
	
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	this.xPos = (desc.xPos != null ? desc.xPos : 0);
	this.yPos = (desc.yPos != null ? desc.yPos : 0);
	this.data = data;
	this.cxTile = (desc.cxTile ? desc.cxTile : 96);
	this.cyTile = (desc.cyTile ? desc.cyTile : 96);
	this.cxWidth = (desc.cxWidth != null ? desc.cxWidth : canvas.width() - this.xPos);
	this.cyHeight = (desc.cyHeight != null ? desc.cyHeight: this.cyTile);

	//	Basic functions

	this.onCreateTile = (desc.onCreateTile ? desc.onCreateTile :
		(function (x, y, cxTile, cyTile, desc)
			{
			return new CanvasLongListTile(x, y, cxTile, cyTile, desc);
			})
		);

	this.onSelectionChanged = desc.onSelectionChanged;

	//	Compute some metrics

	this.cxScrollArrow = 20;
	this.xScrollPos = 0;
	this.xDesiredScrollPos = 0;

	//	Figure out how many tiles fit

	this.tilesInViewport = Math.max(1, Math.floor((this.cxWidth - (2 * this.cxScrollArrow)) / this.cxTile));

	//	If we don't need to scroll, then resize the viewport so it just holds
	//	the required tiles.

	if (this.tilesInViewport > desc.content.length)
		this.cxViewport = Math.max(1, desc.content.length) * this.cxTile;
	else
		this.cxViewport = this.tilesInViewport * this.cxTile;
		
	//	Center the viewport in our control area

	this.xViewport = this.xPos + (this.cxWidth - this.cxViewport) / 2;
	this.yViewport = this.yPos;
	this.cyViewport = this.cyHeight;

	//	If necessary, sort the tile list first

	if (desc.sortList)
		{
		desc.content.sort(function (a, b) {
			//	Sort by name

			if (a.label.toLowerCase() < b.label.toLowerCase())
				return -1;
			else if (a.label.toLowerCase() > b.label.toLowerCase())
				return 1;
			else
				return 0;
			});
		}

	//	Generate the tile list on a virtual surface

	this.tileList = [];
	var x = 0;
	var y = 0;
	for (i = 0; i < desc.content.length; i++)
		{
		this.tileList.push(
			this.onCreateTile(x, y, this.cxTile, this.cyTile, desc.content[i])
			);
		x += this.cxTile;
		}

	var lastTile = (this.tileList.length > 0 ? this.tileList[this.tileList.length - 1] : null);
	this.xMaxScrollPos = (lastTile ? Math.max(0, lastTile.xPos + lastTile.cxWidth - this.cxViewport) : 0);

	//	Selection

	this.selectionIndex = (lastTile ? 0 : -1);
	
	//	Animation
	
	this.animationInterval = setInterval(
		(function (theCtrl)
			{
			return (function ()
				{
				theCtrl.onAnimate();
				});
			})(this),
		1000 / 30);
		
	//	Add listeners to track mouse input
	
	this.canvas.on("mousedown", { canvasCtrl: this },
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;
			
			//	Handle it
			
			e.preventDefault();
			e.data.canvasCtrl.onMouseDown(x, y);
			})
		);
		
	this.canvas.on("mousemove", { canvasCtrl: this },
		(function (e)
			{
			//	Convert coordinate to canvas-relative
			
			var canvasOffset = e.data.canvasCtrl.canvas.offset();
			var x = e.pageX - canvasOffset.left;
			var y = e.pageY - canvasOffset.top;
			
			//	Handle it
			
			e.data.canvasCtrl.onMouseMove(x, y);
			})
		);

	this.canvas.on("dblclick", { canvasCtrl: this },
		(function (e)
			{
			//	Double click should not select text.
			e.preventDefault();
			})
		);
		
	//	Draw all the tiles
	
	this.draw();
	}

CanvasLongList.prototype.destroy = function ()
	{
	this.canvas.off("dblclick");
	this.canvas.off("mousedown");
	this.canvas.off("mousemove");
	
	if (this.animationInterval)
		clearInterval(this.animationInterval);
		
	return null;
	}

CanvasLongList.prototype.draw = function ()
	{
	var i;

	this.ctx.save();

	//	Draw the control background

	this.ctx.fillStyle = "#000000";
	this.ctx.globalAlpha = 0.25;
	this.ctx.fillRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
	this.ctx.globalAlpha = 1;

	//	Draw the left arrow

	var arrowSize = 10;
	if (this.selectionIndex > 0)
		{
		var xArrow = this.xViewport - (2 * arrowSize);
		var yArrow = this.yPos + (this.cyHeight / 2);

		CanvasUtil.drawScrollArrowLeft(this.ctx, xArrow, yArrow, this.hover == "left");
		}

	//	Draw the right arrow

	if (this.selectionIndex + 1 < this.tileList.length)
		{
		var xArrow = this.xViewport + this.cxViewport + (2 * arrowSize);
		var yArrow = this.yPos + (this.cyHeight / 2);

		CanvasUtil.drawScrollArrowRight(this.ctx, xArrow, yArrow, this.hover == "right");
		}

	//	Clip to viewport

	this.ctx.beginPath();
	this.ctx.rect(this.xViewport, this.yViewport, this.cxViewport, this.cyViewport);
	this.ctx.clip();

	var xStart = this.xViewport - this.xScrollPos;
	var yStart = this.yViewport;
	for (i = 0; i < this.tileList.length; i++)
		{
		var theTile = this.tileList[i];
		var x = xStart + theTile.xPos;
		var y = yStart;

		var isSelected = (i == this.selectionIndex);

		if (x + this.cxTile > this.xViewport && x < this.xViewport + this.cxViewport)
			theTile.draw(this.ctx, x, y, isSelected);
		}

	this.ctx.restore();
	}

CanvasLongList.prototype.getSelection = function ()
	{
	return (this.selectionIndex != -1 ? this.tileList[this.selectionIndex] : null);
	}

CanvasLongList.prototype.getSelectionID = function ()
	{
	return (this.selectionIndex != -1 ? this.tileList[this.selectionIndex].id : null);
	}

CanvasLongList.prototype.hitTestLeftArrow = function (x, y)
	{
	return (x >= this.xPos && x < this.xViewport && y >= this.yPos && y < this.yPos + this.cyHeight);
	}

CanvasLongList.prototype.hitTestRightArrow = function (x, y)
	{
	return (x >= this.xViewport + this.cxViewport && x < this.xPos + this.cxWidth && y >= this.yPos && y < this.yPos + this.cyHeight);
	}

CanvasLongList.prototype.hitTestTile = function (x, y)
	{
	var i;

	var xStart = this.xViewport - this.xScrollPos;
	for (i = 0; i < this.tileList.length; i++)
		{
		var theTile = this.tileList[i];
		var xTile = xStart + theTile.xPos;
		var yTile = this.yViewport;

		if (x >= xTile && x < xTile + theTile.cxWidth
				&& y >= yTile && y < yTile + theTile.cyHeight)
			return i;
		}

	return null;
	}
	
CanvasLongList.prototype.onAnimate = function ()
	{
	this.ctx.clearRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
	this.draw();

	if (this.xScrollPos != this.xDesiredScrollPos)
		{
		var delta = Math.floor((this.xDesiredScrollPos - this.xScrollPos) / 3);
		if (delta == 0)
			this.xScrollPos = this.xDesiredScrollPos;
		else
			this.xScrollPos += delta;
		}
	}
	
CanvasLongList.prototype.onMouseDown = function (xMouse, yMouse)
	{
	//	See if we click on the arrows

	if (this.hitTestLeftArrow(xMouse, yMouse))
		{
		this.selectPrev();
		}
	else if (this.hitTestRightArrow(xMouse, yMouse))
		{
		this.selectNext();
		}

	//	See if we click on a tile

	else
		{
		var tileIndex = this.hitTestTile(xMouse, yMouse);
		if (tileIndex != null)
			{
			this.select(tileIndex);

			if (this.onSelectionChanged)
				this.onSelectionChanged(this.getSelectionID());
			}
		}
	}

CanvasLongList.prototype.onMouseMove = function (xMouse, yMouse)
	{
	if (this.hitTestLeftArrow(xMouse, yMouse))
		this.hover = "left";
	else if (this.hitTestRightArrow(xMouse, yMouse))
		this.hover = "right";
	else
		this.hover = null;
	}

CanvasLongList.prototype.select = function (selectionIndex)
	{
	if (selectionIndex != this.selectionIndex)
		{
		this.selectionIndex = selectionIndex;

		this.ctx.clearRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
		this.draw();

		//	Try to keep selection centered in viewport

		var theTile = this.tileList[this.selectionIndex];
		this.xDesiredScrollPos = Math.min(
				Math.max(0, (theTile.xPos + theTile.cxWidth / 2) - (this.cxViewport / 2)),
				this.xMaxScrollPos);
		}
	}

CanvasLongList.prototype.selectByID = function (id)
	{
	var i;

	for (i = 0; i < this.tileList.length; i++)
		if (id == this.tileList[i].id)
			{
			this.select(i);
			break;
			}
	}

CanvasLongList.prototype.selectNext = function ()
	{
	if (this.selectionIndex + 1 < this.tileList.length)
		{
		this.select(this.selectionIndex + 1);

		if (this.onSelectionChanged)
			this.onSelectionChanged(this.getSelectionID());
		}
	}

CanvasLongList.prototype.selectPrev = function ()
	{
	if (this.selectionIndex > 0)
		{
		this.select(this.selectionIndex - 1);

		if (this.onSelectionChanged)
			this.onSelectionChanged(this.getSelectionID());
		}
	}

//	CanvasLongListTile ---------------------------------------------------------
//
//	MEMBER VARIABLES
//
//	cxWidth: The width of the tile
//	cyHeight: The height of the tile
//	data: This item is passed to any functions defined here.
//	id: An ID for the tile.
//	image: Image for the tile.
//	label: Label for the tile.
//	xPos: The position of the tile relative to the origin
//	yPos: The position of the tile relative to the origin
	
function CanvasLongListTile (x, y, cxTile, cyTile, desc)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxTile;
	this.cyHeight = cyTile;
	this.id = desc.id;
	this.image = desc.image;
	this.cxImage = 48;
	this.cyImage = 48;
	this.cxInner = 4;
	this.cyInner = 4;
	this.label = desc.label;
	this.data = desc.data;
	}

CanvasLongListTile.prototype.draw = function (ctx, x, y, isSelected)
	{
	//	Selection

	if (isSelected)
		{
		ctx.fillStyle = $Style.dlgSelectBackground;
		ctx.fillRect(x, y, this.cxWidth, this.cyHeight);
		}

	//	Paint the image

	var xImage = x + (this.cxWidth - this.cxImage) / 2;
	var yImage = y + this.cyInner;
	CanvasUtil.drawImage(ctx, xImage, yImage, this.cxImage, this.cyImage, this.image);

	//	Paint the label

	var xText = x + this.cxWidth / 2;
	var yText = yImage + this.cyImage;
	var cxText = this.cxWidth - 2 * this.cxInner;
	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.font = $Style.tileFontSmall;
	ctx.textBaseline = "top";
	ctx.textAlign = "center";
	$UI.drawText(ctx, xText, yText, cxText, $Style.tileFontSmallHeight, this.label);

	ctx.textAlign = "left";
	}

//	CanvasMessageBar -----------------------------------------------------------
//
//	DESCRIPTOR
//
//	xPos, yPos: Position of the container relative to the canvas.
//	cxWidth, cyHeight: Width and height of container.
//	title: Large message
//
//	buttonLabel: Label for button
//	buttonAction: Function to execute when button is pressed (may be null if no
//		button.
//
//	MEMBER FUNCTIONS
//
//	onDraw (ctx)
//	onMouseDown (e)

function CanvasMessageBar (canvas, desc)
	{
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	this.xPos = desc.xPos;
	this.yPos = desc.yPos;
	this.cxWidth = desc.cxWidth;
	this.cyHeight = desc.cyHeight;

	this.title = desc.title;

	this.buttonLabel = desc.buttonLabel;
	this.buttonAction = desc.buttonAction;

	this.xText = this.xPos + 20;
	this.yText = this.yPos + (desc.cyHeight - $Style.tileFontExtraLargeHeight) / 2;

	this.buttonImage = $("#idMediumButton136Yellow")[0];
	this.cxButton = 136;
	this.cyButton = 48;
	this.xButton = this.xPos + this.cxWidth - (this.cxButton + 20);
	this.yButton = this.yPos + (desc.cyHeight - this.cyButton) / 2;
	}

CanvasMessageBar.prototype.hitTest = function (x, y)
	{
	return (x >= this.xPos && x < this.xPos + this.cxWidth
			&& y >= this.yPos && y < this.yPos + this.cyHeight);
	}

CanvasMessageBar.prototype.onDraw = function ()
	{
	if (this.title == null)
		return;

	//	Draw the background

	this.ctx.fillStyle = $Style.tileNormalBackground;
	this.ctx.fillRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);

	//	Draw the text

	this.ctx.font = $Style.tileFontExtraLargeBold;
	this.ctx.fillStyle = $Style.tileTextHighlight;
	this.ctx.textBaseline = "top";
	this.ctx.textAlign = "left";
	this.ctx.fillText(this.title, this.xText, this.yText);

	//	Draw the action button

	InfoPaneHelper.paintButton(this.ctx, this.buttonImage, this.buttonLabel, this.xButton, this.yButton, this.cxButton, this.cyButton);
	}

CanvasMessageBar.prototype.onMouseDown = function (e)
	{
	if (this.buttonLabel == null)
		return;

	var xPos = e.pageX;
	var yPos = e.pageY;

	if (xPos >= this.xButton
			&& xPos < this.xButton + this.cxButton
			&& yPos >= this.yButton
			&& yPos < this.yButton + this.cyButton)
		this.buttonAction(e);
	}

CanvasMessageBar.prototype.onMouseMove = function (e)
	{
	if (this.buttonLabel == null)
		return;

	var xPos = e.pageX;
	var yPos = e.pageY;

	if (xPos >= this.xButton
			&& xPos < this.xButton + this.cxButton
			&& yPos >= this.yButton
			&& yPos < this.yButton + this.cyButton)
		this.canvas.css("cursor", "pointer");
	else
		this.canvas.css("cursor", "auto");
	}

CanvasMessageBar.prototype.onMouseUp = function (e)
	{
	if (this.buttonLabel == null)
		return;
	}

CanvasMessageBar.prototype.onMouseWheel = function (e)
	{
	}

//	CanvasUtil -----------------------------------------------------------------

var CanvasUtil = { };

CanvasUtil.drawScrollArrowLeft = function (ctx, x, y, isHovering)
	{
	var arrowSize = 10;

	ctx.beginPath();
	ctx.moveTo(x - arrowSize, y);
	ctx.lineTo(x + arrowSize, y + 2 * arrowSize);
	ctx.lineTo(x + arrowSize, y - 2 * arrowSize);
	ctx.closePath();

	ctx.globalAlpha = (isHovering ? 1 : 0.5);
	ctx.fillStyle = $Style.tileTextHighlight;
	ctx.fill();
	ctx.globalAlpha = 1.0;
	}

CanvasUtil.drawScrollArrowRight = function (ctx, x, y, isHovering)
	{
	var arrowSize = 10;

	ctx.beginPath();
	ctx.moveTo(x + arrowSize, y);
	ctx.lineTo(x - arrowSize, y + 2 * arrowSize);
	ctx.lineTo(x - arrowSize, y - 2 * arrowSize);
	ctx.closePath();

	ctx.globalAlpha = (isHovering ? 1 : 0.5);
	ctx.fillStyle = $Style.tileTextHighlight;
	ctx.fill();
	ctx.globalAlpha = 1.0;
	}

CanvasUtil.drawImage = function (ctx, x, y, cxWidth, cyHeight, imageDesc)
	{
	var imageType;

	if (imageDesc
			&& (imageType = $Anacreon.designTypes[imageDesc[0]]))
		{
		var destHeight = cyHeight;
		var destWidth = destHeight * imageDesc[3] / imageDesc[4];
		var destX = 0.5 * (cxWidth - destWidth);

		ctx.drawImage(imageType.imageElement,
				imageDesc[1],
				imageDesc[2],
				imageDesc[3],
				imageDesc[4],
				x + destX,
				y,
				destWidth,
				destHeight);
		}
	else
		{
		ctx.fillStyle = "#404040";
		ctx.fillRect(x, y, cxWidth, cyHeight);
		}
	}