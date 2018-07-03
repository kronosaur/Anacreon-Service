//	navbarui.js
//
//	Nav Bar functions
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

//	NavBar ---------------------------------------------------------------------
//
//	MEMBER FUNCTIONS
//
//	destroy ()
//		Call when done.
//
//	MEMBER VARIABLES
//
//	activeRegions: This is an array of objects describing an active region.
//	canvas: The JQuery canvas object
//	ctx: Canvas context
//	cxWidth, cyHeight: Dimensions of canvas
//	isInvalid: If true, then we need to redraw

function NavBar (canvas)
	{
	//	Initialize our basic members
	
	this.canvas = canvas;
	this.ctx = canvas[0].getContext("2d");
	this.cxWidth = canvas.width();
	this.cyHeight = canvas.height();

	this.isInvalid = true;

	//	Generate a list of hot regions on the nav bar.

	this.activeRegions = [];
	this.createZoomControls();
	this.createConfigControls();
	this.createHelpControls();

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
	}

NavBar.prototype.createConfigControls = function ()
	{
	//	Snapshot

	this.activeRegions.push(new NavBarIconButton({
		xPos: 307,
		yPos: 1,
		cxWidth: 31,
		cyHeight: 31,
		label: "snapshotMap",

		onDrawIcon: NavBarIconButton.prototype.onDrawIconMap,
		onClick: (function ()
			{
			var img = $Map.snapshot();
			window.open(img,"","width=700, height=700");
			}),
		}));

	//	UI Settings

	this.activeRegions.push(new NavBarIconButton({
		xPos: 342,
		yPos: 1,
		cxWidth: 31,
		cyHeight: 31,
		label: "uiSettings",

		onDrawIcon: NavBarIconButton.prototype.onDrawIconMap,
		onClick: (function ()
			{
			uiSettingsDialog();
			}),
		}));
	}

NavBar.prototype.createHelpControls = function ()
	{
	}

NavBar.prototype.createZoomControls = function ()
	{
	//	Zoom to galaxy scale

	this.activeRegions.push(new NavBarIconButton({
		xPos: 699,
		yPos: 1,
		cxWidth: 31,
		cyHeight: 31,
		label: "zoomToDefault",

		onDrawIcon: NavBarIconButton.prototype.onDrawIconMap,
		onClick: (function ()
			{
			$Map.cmdZoomToDefault();
			}),
		}));

	//	Zoom out

	this.activeRegions.push(new NavBarIconButton({
		xPos: 734,
		yPos: 1,
		cxWidth: 31,
		cyHeight: 31,
		label: "-",

		onDrawIcon: NavBarIconButton.prototype.onDrawIconText,
		onClick: (function ()
			{
			$Map.cmdZoomOut();
			}),
		}));

	//	Zoom in

	this.activeRegions.push(new NavBarIconButton({
		xPos: 929,
		yPos: 1,
		cxWidth: 31,
		cyHeight: 31,
		label: "+",

		onDrawIcon: NavBarIconButton.prototype.onDrawIconText,
		onClick: (function ()
			{
			$Map.cmdZoomIn();
			}),
		}));

	//	Zoom to orbital scale

	this.activeRegions.push(new NavBarIconButton({
		xPos: 964,
		yPos: 1,
		cxWidth: 31,
		cyHeight: 31,
		label: "zoomToTactical",

		onDrawIcon: NavBarIconButton.prototype.onDrawIconMap,
		onClick: (function ()
			{
			$Map.cmdZoomToTactical();
			}),
		}));

	//	Map Style

	this.activeRegions.push(new NavBarIconButton({
		xPos: 804,
		yPos: 1,
		cxWidth: 86,
		cyHeight: 31,
		label: DISPLAY_MODE[$Map.displayMode].label,

		data: this,
		onDrawIcon: NavBarIconButton.prototype.onDrawText,
		onClick: (function (navBar)
			{
			var NavBarPos = navBar.canvas.offset();

			$Map.cmdDisplayMenu(NavBarPos.left + 804, NavBarPos.top + 32);
			}),
		onRefresh: (function (desc) {
			desc.label = DISPLAY_MODE[$Map.displayMode].label;
			}),
		}));
	}

NavBar.prototype.destroy = function ()
	{
	this.canvas.off("mousedown");
	this.canvas.off("mousemove");
	
	if (this.animationInterval)
		clearInterval(this.animationInterval);
		
	return null;
	}

NavBar.prototype.drawClock = function (ctx, clear)
	{
	var xPos = this.cxWidth / 2;
	var yPos = 40;

	//	Clear, if necessary

	if (clear)
		this.ctx.clearRect(xPos - 100, yPos - 12, 200, 24);

	//	Draw the center timer

	var radius = 8;
	var complete = $Anacreon.percentComplete($Anacreon.update + 1, 1);
	InfoPaneHelper.paintProgress(ctx, xPos, yPos, complete, radius, $Style.tileTextNormal);

	//	Draw the date time

	var dateTime = $Anacreon.getDateTime();
	var month = dateTime.month.toString();
	if (month.length < 2)
		month = "0" + month;

	var day = dateTime.day.toString();
	if (day.length < 2)
		day = "0" + day;

	ctx.fillStyle = $Style.tileTextNormal;
	ctx.font = $Style.tileFontLargeBold;
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	ctx.fillText(dateTime.year, xPos - 22, yPos);

	ctx.textAlign = "left";
	ctx.fillText(month + "\u00b7" + day, xPos + 22, yPos);
	}

NavBar.prototype.drawFunds = function (ctx)
	{
	var sovereign = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];
	if (sovereign == null)
		return;

	//	For now we only handle one currency. [This is an array of number pairs;
	//	the first number is a currency type; the second is the value.]

	var funds;
	if (sovereign.funds && sovereign.funds.length > 0)
		funds = $Anacreon.formatNumberAsInteger(sovereign.funds[1]);
	else
		funds = "0";

	//	Draw it

	var xPos = 190;
	var yPos = 0;

	ctx.fillStyle = $Style.tileTextNormal;
	ctx.textAlign = "right";
	ctx.textBaseline = "top";

	//	Draw the currency label

	ctx.font = $Style.tileFontSmall;
	ctx.fillText("aes", xPos, yPos);
	yPos += $Style.tileFontSmallHeight;

	//	Draw the currency value

	ctx.font = $Style.tileFontLargeBold;
	ctx.fillStyle = $Style.tileTextHighlight;
	ctx.fillText(funds, xPos, yPos);
	}

NavBar.prototype.drawNameAndTime = function (ctx)
	{
	var sovereign = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];
	if (sovereign == null)
		return;

	//	Draw the name of the empire

	var xPos = this.cxWidth / 2;
	var yPos = 4;

	ctx.fillStyle = $Style.tileTextHighlight;
	ctx.font = $Style.tileFontExtraLargeBold;
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.fillText(sovereign.name, xPos, yPos);

	//	Draw the clock

	this.drawClock(ctx);
	}

NavBar.prototype.drawScale = function (ctx)
	{
	//	Compute the size of the scale in pixels
		
	var scaleLY = ZOOM_LEVELS[$Map.zoomLevel][3];
	var cxScale = scaleLY * ZOOM_LEVELS[$Map.zoomLevel][2];
	var cxHalfSpacing = 3;
		
	//	Position

	var x = 812;
	var y = 36;
	var cxWidth = 182;
	var cyHeight = 20;

	var cyScale = 6;
	var cyHalfScale = cyScale / 2;
	var xScale = x + cxHalfSpacing;
	var yScale = y + cyHalfScale + (cyHeight - cyScale) / 2;
		
	//	Draw
		
	ctx.beginPath();
	ctx.moveTo(xScale, yScale);
	ctx.lineTo(xScale + cxScale, yScale);
	ctx.moveTo(xScale, yScale - cyHalfScale);
	ctx.lineTo(xScale, yScale + cyHalfScale);
	ctx.moveTo(xScale + cxScale, yScale - cyHalfScale);
	ctx.lineTo(xScale + cxScale, yScale + cyHalfScale);

	ctx.strokeStyle = $Style.dlgHighlightText;
	ctx.lineWidth = 1.5;
	ctx.lineCap = "square";
	ctx.stroke();

	//	Text

	var label = ZOOM_LEVELS[$Map.zoomLevel][4];
		
	ctx.font = $Style.tileFontMedium;
//	var cxText = ctx.measureText(label).width;
//	var cxClear = cxText + 10;
//	ctx.clearRect(x + (cxWidth - cxClear) / 2, y, cxClear, cyHeight);

	ctx.textBaseline = "middle";
	ctx.textAlign = "right";

	ctx.fillStyle = $Style.tileTextNormal;
	ctx.fillText(label, x - cxHalfSpacing, y + (cyHeight / 2));
	}

NavBar.prototype.findTileAtPos = function (x, y)
	{
	var i;
	
	for (i = 0; i < this.activeRegions.length; i++)
		{
		var theTile = this.activeRegions[i];
		if (x >= theTile.xPos 
				&& y >= theTile.yPos
				&& x < theTile.xPos + theTile.cxWidth
				&& y < theTile.yPos + theTile.cyHeight)
			return theTile;
		}
		
	return null;
	}

NavBar.prototype.invalidate = function ()
	{
	this.isInvalid = true;
	}

NavBar.prototype.onAnimate = function ()
	{
	if (this.isInvalid)
		{
		this.ctx.clearRect(0, 0, this.cxWidth, this.cyHeight);
		this.onDraw();
		this.isInvalid = false;
		}

	//	We always draw the clock animation

	else
		this.drawClock(this.ctx, true);
	}
	
NavBar.prototype.onDraw = function ()
	{
	var i;

	this.ctx.save();

	//	Draw various elements

	this.drawFunds(this.ctx);
	this.drawNameAndTime(this.ctx);
	this.drawScale(this.ctx);

	//	Draw all the active zones

	for (i = 0; i < this.activeRegions.length; i++)
		{
		var region = this.activeRegions[i];
		var isHovering = (region == this.hoverTile);

		region.onDraw(this.ctx, isHovering);
		}

	this.ctx.restore();
	}

NavBar.prototype.onMouseDown = function (x, y)
	{
	var theTile = this.findTileAtPos(x, y);
	if (theTile && theTile.onClick)
		theTile.onClick(theTile.data);
	}

NavBar.prototype.onMouseMove = function (x, y)
	{
	//	Are we hovering over an active tile?
	
	var newHoverTile = this.findTileAtPos(x, y);
	if (newHoverTile && newHoverTile.onClick == null)
		newHoverTile = null;
		
	//	Switch
	
	if (this.hoverTile != newHoverTile)
		{
		this.hoverTile = newHoverTile;
		this.isInvalid = true;
		}
	}

NavBar.prototype.refresh = function ()
	{
	var i;

	for (i = 0; i < this.activeRegions.length; i++)
		{
		var region = this.activeRegions[i];
		if (region.onRefresh)
			region.onRefresh(region);
		}
	}

//	NavBarIconButton -----------------------------------------------------------

function NavBarIconButton (desc)
	{
	this.xPos = desc.xPos;
	this.yPos = desc.yPos;
	this.cxWidth = desc.cxWidth;
	this.cyHeight = desc.cyHeight;

	//	Painting

	this.onDrawBackground = (desc.onDrawBackground ? desc.onDrawBackground : NavBarIconButton.prototype.onDrawBackgroundSquare);
	this.onDrawIcon = (desc.onDrawIcon ? desc.onDrawIcon : NavBarIconButton.prototype.onDrawIconText);

	this.label = desc.label;

	//	Actions

	this.onClick = desc.onClick;
	this.data = desc.data;

	this.onRefresh = desc.onRefresh;
	}

NavBarIconButton.prototype.onDraw = function (ctx, isHovering)
	{
	this.onDrawBackground(ctx, isHovering);
	this.onDrawIcon(ctx, isHovering);
	}

NavBarIconButton.prototype.onDrawBackgroundSquare = function (ctx, isHovering)
	{
	ctx.fillStyle = $Style.navBarButton;
	if (!isHovering)
		ctx.globalAlpha = 0.25;
	ctx.fillRect(this.xPos, this.yPos, this.cxWidth, this.cyHeight);
	ctx.globalAlpha = 1;
	}

NavBarIconButton.prototype.onDrawIconMap = function (ctx, isHovering)
	{
	var iconSize = $Map.getIconSize(this.label);
	if (iconSize == null)
		return;

	var x = Math.floor(this.xPos + (this.cxWidth - iconSize.width) / 2);
	var y = Math.floor(this.yPos + (this.cyHeight - iconSize.height) / 2);

	$Map.drawIcon(ctx, this.label, x, y);
	}

NavBarIconButton.prototype.onDrawIconText = function (ctx, isHovering)
	{
	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.font = $Style.tileFontExtraLargeBold;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";

	var xText = this.xPos + (this.cxWidth / 2);
	var yText = this.yPos + (this.cyHeight / 2);

	ctx.fillText(this.label, xText, yText);
	}

NavBarIconButton.prototype.onDrawText = function (ctx, isHovering)
	{
	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.font = $Style.tileFontLargeBold;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";

	var xText = this.xPos + (this.cxWidth / 2);
	var yText = this.yPos + (this.cyHeight / 2);

	ctx.fillText(this.label, xText, yText);
	}

