//	trantor.js
//
//	Implements UI for Anacreon 3
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

var theCanvas;
var ctx;
var $Map = {
	//	Specialization
	//
	//	mapView: Object implementing map view.
	//
	//	UI settings
	//
	//	curMetrics: Current map metrics
	//		adjWorldSize: Factor to increase/decrease size of worlds
	//		pixelsPerUnit: Pixels per unit (cached from ZOOM_LEVELS).
	//	desiredPixelsPerUnit: Pixels per unit (set when zooming)
	//	desiredZoomLevel: Index into ZOOM_LEVELS
	//	objPlanetaryCenter: If in planetary scale, this is the central object.
	//	objPlanetaryCenterID: ID of planetary center.
	//	objSelected: Selected object.
	//	uiMode: Current map mode. One of the following:
	//		null: Normal map mode
	//		UI_MODE_EXPORT_TARGET: Pick a foreign trade hub to sell to
	//		UI_MODE_FLEET_DESTINATION: Pick a fleet destination
	//		UI_MODE_LAM_TARGET: Pick a fleet/world to attack with LAMs from
	//			selected object.
	//		UI_MODE_LAM_TARGET_OUT_OF_RANGE: Selected object is out of admin
	//			range.
	//		UI_MODE_SNAPSHOT: Snapshot of map
	//		UI_MODE_TRADE_TARGET: Pick a world to trade with
	//		UI_MODE_TRADE_TARGET_OUT_OF_RANGE: Selected object is out of admin
	//			range.
	//	viewportX: center of viewport (x) (in game coordinates)
	//	viewportY: center of viewport (y) (in game coordinates)
	//	xyCenter: Center of map (in game coordinates)
	//	zoomLevel: Index into ZOOM_LEVELS array
	//	
	//	Initialized in refreshFullMap
	//
	//	canvasCenterX: Center of viewport in canvas coordinate
	//	canvasCenterY: Center of viewport in canvas coordinate
    //	canvasHeight: Height of canvas (pixels)
	//	canvasWidth: Width of canvas (pixels)
	//
	//	Initialized in initMapView
	//
	//	objsInView: List of objects in view with map information
	//
	//	Used by tactical view
	//
	//	nextTacticalTime: Time when we should next request a tactical list.
	//	nextTacticalObjects: List of tactical objects for next round (indexed by id)
	//	tacticalFrame: Frame number that we're currently displaying (0-29)
	//	tacticalObjects: List of all tactical objects (indexed by id).
	//	tacticalSelected: Tactical object selected.
	//	tacticalSelectedID: ID of tactical object selected.
	//	waitingForTactical: If TRUE we're waiting for /api/getTactical to return.
	//
	//	SELECTED OBJECT
	//
	//	The selected object ($Map.objSelected) must have the following
	//	properties:
	//
	//	class: One of the following:
	//		"buildData": A BuildDataSelection object
	//		"fleet": A FleetObject
	//		"ground": A GroundTactical object
	//		"planet": A PlanetTactical object
	//		"squadron": A SquadronTactical object
	//		"world": A WorldObject
	//	id: This is a unique ID within the kind.
	//	kind: One of the following:
	//		"spaceObject": FleetObject, WorldObject
	//		"spaceObjectPart": A piece of a space object, such as industry.
	//		"tactical": GroundTactical, PlanetTactical, SquadronTactical
	//		"tradeRoute": A trade route between two worlds
	//	name: The name of the object
	//
	//	canBeRenamed (): Returns TRUE if object can be renamed.
	//	
	//	drawGalacticMap (ctx, x, y, pixelsPerUnit, isSelected, isFaded)
	//		Draws the object on the galactic map. Required only for objects
	//		that show up on galactic map.
	//
	//	drawGalacticMapBackground (ctx, mapMetrics, uiMode)
	//		Draw any background when the object is selected.
	//
	//	drawGalacticMapSelection (ctx) :
	//		Draw a selection when the object is selected.
	//
	//	getInfoPanes (): Returns a list of info panes
	//	getSpaceObject (): Returns the space object that we are a part of
	//	getSpaceObjectID (): Returns the ID of the space object that we are
	//		part of (or null).

    //  Include objects if inside these margins

	mapMarginX: 100,
    mapMarginY: 100,

	//	List of effects

	effects: [],

	//	Options

	showFleetIcons: true,
	};
	
var FRAMES_PER_SECOND =	30;
	
var LEGEND_COLOR = "#ffffff";
var SCALE_LEGEND_OFFSET_LEFT = 100;
var SCALE_LEGEND_OFFSET_BOTTOM = 100;
var SCALE_LEGEND_TICK_HEIGHT = 5;
var SCALE_LEGEND_LINE_WIDTH = 2;

var MAP_ICONS = {
						//	0. xSrc		1. ySrc		2. cxWidth	3. cyHeight
	snapshotMap:		[	0,			20,			30,			30,	],
	uiSettings:			[	30,			20,			30,			30, ],
	zoomToDefault:		[	0,			0,			20,			20,	],
	zoomToTactical:		[	20,			0,			20,			20,	],
	};

var TECH_LEVEL_ICONS = [
		//	0. xSrc		1. ySrc
		[	96,			0,	],		//	pre-industrial
		[	0,			48,	],		//	industrial
		[	48,			48,	],		//	atomic
		[	96,			48, ],		//	digital
		[	0,			96,	],		//	spacefaring
		[	48,			96,	],		//	fusion
		[	96,			96,	],		//	biotech
		[	0,			144,],		//	antimatter
		[	48,			144,],		//	quantum
		[	96,			144,],		//	post-industrial
	];

var ZOOM_LEVELS = [
	//	0. Name				1. Scale		2. Pixels/unit		3. Legend (length, text)			5. World size
	[	"Planetary +12",	"tactical",		40960.0,			0.002,		"2 kilometers",			0,	],
	[	"Planetary +11",	"tactical",		20480.0,			0.005,		"5 kilometers",		0,	],
	[	"Planetary +10",	"tactical",		10240.0,			0.015,		"15 kilometers",		0,	],
	[	"Planetary +9",		"tactical",		5120.0,				0.025,		"25 kilometers",		0,	],
	[	"Planetary +8",		"tactical",		2560.0,				0.05,		"50 kilometers",		0,	],
	[	"Planetary +7",		"tactical",		1280.0,				0.1,		"100 kilometers",		0,	],
	[	"Planetary +6",		"tactical",		640.0,				0.15,		"150 kilometers",		0,	],
	[	"Planetary +5",		"tactical",		320.0,				0.25,		"250 kilometers",		0,	],
	[	"Planetary +4",		"tactical",		160.0,				0.5,		"500 kilometers",		0,	],
	[	"Planetary +3",		"tactical",		80.0,				1.0,		"1 megameter",			0,	],
	[	"Planetary +2",		"tactical",		40.0,				3.0,		"3 megameters",			0,	],
	[	"Planetary +1",		"tactical",		20.0,				5.0,		"5 megameters",			0,	],
	[	"Planetary",		"tactical",		10.0,				15.0,		"15 megameters",		0,	],
	[	"Planetary -1",		"tactical",		5.0,				25.0,		"25 megameters",		0,	],
	[	"Planetary -2",		"tactical",		2.5,				50.0,		"50 megameters",		0,	],
	[	"Planetary -3",		"tactical",		1.25,				100.0,		"100 megameters",		0,	],
	[	"Planetary -4",		"tactical",		0.625,				200.0,		"200 megameters",		0,	],
	[	"Planetary -5",		"tactical",		0.3125,				299.792,	"1 light-second",		0,	],
	[	"Planetary -6",		"planetary",	0.15625,			899.376,	"3 light-seconds",		0.234375,	],
	[	"Planetary -7",		"planetary",	0.078125,			1498.96,	"5 light-seconds",		0.234375,	],
	[	"Planetary -8",		"planetary",	0.0390625,			4496.88,	"15 light-seconds",		0.234375,	],
	[	"Planetary -9",		"planetary",	0.01953125,			8993.76,	"30 light-seconds",		0.234375,	],
	[	"Planetary -10",	"planetary",	0.009765625,		17987.52,	"1 light-minute",		0.234375,	],
	[	"Planetary -11",	"planetary",	0.0048828125,		35975.04,	"2 light-minutes",		0.234375,	],
	[	"Planetary -12",	"planetary",	0.00244140625,		71950.08,	"4 light-minutes",		0.234375,	],
	[	"Planetary -13",	"planetary",	0.001220703125,		89937.6,	"5 light-minutes",		0.234375,	],
	[	"Planetary -14",	"planetary",	0.0006103515625,	179875.2,	"10 light-minutes",		0.234375,	],
	[	"Planetary -15",	"planetary",	0.00030517578125,	539625.6,	"30 light-minutes",		0.234375,	],
	[	"Planetary -16",	"planetary",	0.000152587890625,	1079251.2,	"1 light-hour",		0.234375,	],
	[	"Planetary -17",	"planetary",	0.0000762939453125,	2158502.4,	"2 light-hours",		0.234375,	],
	[	"Planetary -18",	"planetary",	0.00003814697265625,3237753.6,	"3 light-hours",		0.234375,	],
	[	"Planetary -19",	"planetary",	0.00001907348632813,5396256.0,	"5 light-hours",		0.234375,	],
	[	"Planetary -20",	"planetary",	0.00000953674316406,10792512.0,	"10 light-hours",		0.234375,	],
	[	"Planetary -21",	"planetary",	0.00000476837158203,25902028.8,	"1 light-day",		0.234375,	],
	[	"Planetary -22",	"planetary",	0.00000238418579102,51804057.6,	"2 light-days",		0.234375,	],
	[	"Planetary -23",	"planetary",	0.00000119209289551,129510144.0,"5 light-days",		0.234375,	],
		
	[	"Stellar +8",		"galactic",		1024.0,				0.1,		"0.1 light-years",		0.234375,	],
	[	"Stellar +7",		"galactic",		512.0,				0.25,		"0.25 light-years",		0.234375,	],
	[	"Stellar +6",		"galactic",		256.0,				0.5,		"0.5 light-years",			0.234375,	],
	[	"Stellar +5",		"galactic",		128.0,				1,			"1 light-year",			0.234375,	],
	[	"Stellar +4",		"galactic",		64.0,				2,			"2 light-years",		0.390625,	],
	[	"Stellar +3",		"galactic",		32.0,				5,			"5 light-years",		0.625,	],
	[	"Stellar +2",		"galactic",		16.0,				10,			"10 light-years",		0.9375,	],
	[	"Stellar +1",		"galactic",		8.0,				20,			"20 light-years",		1.25,	],
	[	"Stellar",			"galactic",		4.0,				25,			"25 light-years",		2,	],
	[	"Stellar -1",		"galactic",		2.0,				50,			"50 light-years",		3,	],
	[	"Stellar -2",		"galactic",		1.0,				150,		"150 light-years",		5,	],
	[	"Stellar -3",		"galactic",		0.5,				250,		"250 light-years",		8,	],
	[	"Stellar -4",		"galactic",		0.25,				500,		"500 light-years",		12,	],
	[	"Stellar -5",		"galactic",		0.125,				1000,		"1,000 light-years",	24,	],
	[	"Stellar -6",		"galactic",		0.0625,				2000,		"2,000 light-years",	32,	],
	[	"Stellar -7",		"galactic",		0.03125,			5000,		"5,000 light-years",	64,	],
	[	"Stellar -8",		"galactic",		0.015625,			10000,		"10,000 light-years",	64,	],
	[	"Stellar -9",		"galactic",		0.0078125,			20000,		"20,000 light-years",	128,	],
	];
		
var DEFAULT_ZOOM_LEVEL = 44;
var TACTICAL_ZOOM_LEVEL = 12;
var PLANETARY_ZOOM_LEVEL = 39;
	
var SELECTION_LINE_WIDTH = 2;
var SELECTION_RADIUS = 15;

var UI_MODE_EXPORT_TARGET = 1;
var UI_MODE_FLEET_DESTINATION = 2;
var UI_MODE_LAM_TARGET = 3;
var UI_MODE_LAM_TARGET_OUT_OF_RANGE = 4;
var UI_MODE_TRADE_TARGET = 5;
var UI_MODE_TRADE_TARGET_OUT_OF_RANGE = 6;
var UI_MODE_SNAPSHOT = 7;

$Map.addEffect = function (effectObj)
	{
	$Map.effects.push(effectObj);
	$Map.invalidate("mapOnly");
	}

$Map.addMessageBar = function (desc)
	{
	desc.cxWidth = 800;
	desc.cyHeight = 64;
	desc.xPos = (theCanvas.width() - desc.cxWidth) / 2;
	desc.yPos = 60;

	$Map.messageBar = new CanvasMessageBar(theCanvas, desc);
	}

$Map.animateLoading = function ()
	{
	var i;

	var cxWidth = theCanvas.width();
	var cyHeight = theCanvas.height();
	ctx.clearRect(0, 0, cxWidth, cyHeight);

	var xCenter = cxWidth / 2;
	var yCenter = cyHeight / 2;

	//	Generate some random rings

	if ($Map.rings == null)
		{
		$Map.rings = [];

		var ringCount = 5;
		var radius = 20;
		var ringSpacing = 3;
		for (i = 0; i < ringCount; i++)
			{
			var ringWidth = 10 + 20 * Math.random();
			$Map.rings.push({
				angle: 2 * Math.PI * Math.random(),
				arc: (Math.PI / 2) + (Math.PI * Math.random()),
				speed: (1 + 5 * Math.random()) / 50,
				radius: radius,
				width: ringWidth,
				});

			radius += ringWidth + ringSpacing;
			}

		$Map.tick = 0;
		}

	//	Paint the rings

	ctx.fillStyle = $Style.tileAccentBackground;

	for (i = 0; i < $Map.rings.length; i++)
		{
		var ring = $Map.rings[i];

		var angle = ring.angle + (ring.speed * $Map.tick);

		ctx.beginPath();
		ctx.arc(xCenter,
				yCenter,
				ring.radius,
				angle,
				angle + ring.arc,
				false);

		ctx.arc(xCenter,
				yCenter,
				ring.radius + ring.width,
				angle + ring.arc,
				angle,
				true);
		ctx.closePath();

		ctx.fill();
		}

	//	Text

	ctx.fillStyle = "#606060";
	ctx.font = "20pt SansationBold, Verdana, sans-serif";
	ctx.textAlign = "center";
	ctx.fillText("Loading", xCenter, yCenter + 200);
	ctx.textAling = "left";

	//	Next

	$Map.tick++;
	}

$Map.cmdZoomIn = function ()
	{
	if ($Map.zoomLevel > 0 && $Anacreon.objList.length > 0)
		{
		$Map.desiredZoomLevel = $Map.zoomLevel - 1;
		$Map.invalidate();
		}
	}

$Map.cmdPanTo = function (xGalactic, yGalactic)
	{
	$Map.desiredViewportX = xGalactic;
	$Map.desiredViewportY = yGalactic;
	$Map.initMapView($Map.curMetrics);
	}

$Map.cmdZoomOut = function ()
	{
	if ($Map.zoomLevel < (ZOOM_LEVELS.length - 1) && $Anacreon.objList.length > 0)
		{
		$Map.desiredZoomLevel = $Map.zoomLevel + 1;
		$Map.invalidate();
		}
	}

$Map.cmdZoomTo = function (zoomLevel)
	{
	if ($Map.zoomLevel != zoomLevel)
		{
		//	If we're zooming to planetary scale then we center on the
		//	selection.

		var obj;
		if (zoomLevel < $Map.zoomLevel 
				&& $Map.zoomLevel > PLANETARY_ZOOM_LEVEL
				&& zoomLevel <= PLANETARY_ZOOM_LEVEL
				&& $Map.objSelected
				&& (obj = $Map.objSelected.getSpaceObject()))
			{
			$Map.cmdPanTo(obj.pos[0], obj.pos[1]);
			}

		//	Zoom

		$Map.desiredZoomLevel = zoomLevel;
		$Map.invalidate();
		}
	}

$Map.cmdZoomToDefault = function ()
	{
	$Map.cmdZoomTo(DEFAULT_ZOOM_LEVEL);
	}

$Map.cmdZoomToTactical = function ()
	{
	$Map.cmdZoomTo(TACTICAL_ZOOM_LEVEL);
	}

$Map.drawAIDebug = function (ctx)
	{
	var debugInfo = $Map.aiDebug
	if (debugInfo && debugInfo.length > 0)
		{
		var x = 0;
		var y = 100;
		var j;
		
		for (i = 0; i < debugInfo.length; i++)
			{
			var entry = debugInfo[i];
			var desc = entry.type;
			
			if (entry.data)
				desc = desc + " " + entry.data;
			
			if (entry.agents)
				{
				desc = desc + " assigned: ";
				
				for (j = 0; j < entry.agents.length; j++)
					desc = desc + entry.agents[j] + " ";
				}
			else
				desc = desc + " open";
			
			ctx.font = "8pt Verdana, sans-serif";
			ctx.fillStyle = "#c0c0c0";
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
		
			ctx.fillText(desc, x, y);
			
			y += 11;
			}
		}
	}

$Map.drawBackground = function (ctx, imageDesc, scale, posX, posY)
	{
	var imageType = $Anacreon.designTypes[imageDesc[0]];
	if (imageType == null)
		return;

	var imageX = imageDesc[1];
	var imageY = imageDesc[2];
	var imageWidth = imageDesc[3];
	var imageHeight = imageDesc[4];

	var destWidth = Math.floor(imageWidth * scale);
	var destHeight = Math.floor(imageHeight * scale);

	var offsetX = ((scale * 0.5 * posX) - (($Map.canvasWidth - 3 * destWidth) / 2)) % destWidth;
	if (offsetX < 0)
		offsetX += destWidth;
	var offsetY = ((scale * 0.5 * -posY) - (($Map.canvasHeight - 3 * destHeight) / 2)) % destHeight;
	if (offsetY < 0)
		offsetY += destHeight;

	$UI.drawTiledImage(ctx,
			imageType.imageElement,
			-offsetX,
			-offsetY,
			$Map.canvasWidth + offsetX,
			$Map.canvasHeight + offsetY,
			imageX,
			imageY,
			imageWidth,
			imageHeight,
			destWidth,
			destHeight);
	}

$Map.drawIcon = function (ctx, icon, x, y)
	{
	var imageInfo = MAP_ICONS[icon];
	if (imageInfo)
		ctx.drawImage($Map.icons, 
				imageInfo[0],
				imageInfo[1],
				imageInfo[2],
				imageInfo[3],
				x,
				y,
				imageInfo[2],
				imageInfo[3]);
	}

$Map.getIconSize = function (icon)
	{
	var imageInfo = MAP_ICONS[icon];
	if (imageInfo)
		return { width: imageInfo[2], height: imageInfo[3] };
	else
		return null;
	}
	
$Map.findObjInView = function (x, y)
	{
	var i;
	var objList = $Map.objsInView;
	var total = objList.length;		
		
	//	Find nearest object to the click position (within 10 pixels)
		
	var clickBox = 10;
	var bestDist2 = 4 * clickBox * clickBox;
	var bestObj = null;
	for (i = 0; i < total; i++)
		{
		var obj = objList[i];
			
		var xDiff = obj.mapPosX - x;
		var yDiff = obj.mapPosY - y;
			
		if (xDiff <= clickBox && xDiff >= -clickBox && yDiff <= clickBox && yDiff >= -clickBox)
			{
			var dist2 = xDiff * xDiff + yDiff * yDiff;
			if (dist2 < bestDist2)
				{
				bestObj = objList[i];
				bestDist2 = dist2;
				}
			}
		}
			
	return bestObj;
	}

$Map.findTradeRouteInView = function (x, y)
	{
	var i, j;
	var objList = $Map.objsInView;
	var total = objList.length;
		
	//	Find nearest object to the click position (within 10 pixels)
		
	var clickBox = 10;
	var bestDist2 = 4 * clickBox * clickBox;
	var bestObj = null;
	var bestRoute = 0;
	for (i = 0; i < total; i++)
		{
		var obj = objList[i];
		var tradeRouteList = obj.tradeRoutes;

		if (tradeRouteList != null)
			{
			var xDest = obj.mapPosX;
			var yDest = obj.mapPosY;

			for (j = 0; j < tradeRouteList.length; j++)
				{
				var tradeRoute = tradeRouteList[j];
				if (!tradeRoute["return"])
					{
					var sourceObj = $Anacreon.objList[tradeRoute.partnerObjID];
					if (sourceObj == null || sourceObj.sovereignID != $Anacreon.userInfo.sovereignID)
						continue;

					//	Compute the center of the trade route

					var xToPartner = sourceObj.mapPosX - xDest;
					var yToPartner = sourceObj.mapPosY - yDest;
					var xLineCenter = xDest + (xToPartner / 2);
					var yLineCenter = yDest + (yToPartner / 2);

					//	See how close we clicked

					var xDiff = xLineCenter - x;
					var yDiff = yLineCenter - y;
			
					if (xDiff <= clickBox && xDiff >= -clickBox && yDiff <= clickBox && yDiff >= -clickBox)
						{
						var dist2 = xDiff * xDiff + yDiff * yDiff;
						if (dist2 < bestDist2)
							{
							bestObj = obj;
							bestDist2 = dist2;
							bestRoute = tradeRoute;
							}
						}
					}
				}
			}
		}

	if (bestObj == null)
		return null;

	return new TradeRouteObject(bestObj, bestRoute);
	}

$Map.getViewPos = function (x, y)
	{
	var pixelsPerUnit = $Map.curMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
	var xViewCenter = $Map.canvasCenterX;
	var yViewCenter = $Map.canvasCenterY;

	return [xViewCenter + pixelsPerUnit * (x - xMapCenter),
			yViewCenter - pixelsPerUnit * (y - yMapCenter)];
	}

$Map.initMapView = function (mapMetrics)
	{
	var i;
	var j;
		
	//	This function generates a list of all objects to be drawn on the
	//	map. We also add paint information to each object.
		
	$Map.objsInView = [];
		
	//	Start by computing some map metrics.
		
	var objList = $Anacreon.objList;
	if (objList == null)
		return;

	var pixelsPerUnit = mapMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
	var xViewCenter = $Map.canvasCenterX;
	var yViewCenter = $Map.canvasCenterY;

	//	At stellar scale we show star systems
		
	if (ZOOM_LEVELS[$Map.zoomLevel][1] == "galactic")
		{
		$Map.maxWorldRadius = mapMetrics.adjWorldSize * WorldObject.prototype.getMaxRadius(pixelsPerUnit);
		$Map.pathWidth = Math.max(1, Math.min(Math.round($Map.maxWorldRadius / 3), 10));
			
		var maxFleetSize = 4.5 * Math.max(3, $Map.maxWorldRadius);
		var fleetRadiusOffset = (0.5 * $Map.maxWorldRadius) + (0.5 * maxFleetSize);
			
		//	Loop over all objects.
			
		for (i in objList)
			{
			var obj = objList[i];
			if (obj == null || obj.anchorObjID != null)
				continue;
					
			//	Compute the position of the object on the map
				
			var xObj = obj.pos[0];
			var yObj = obj.pos[1];
				
			obj.mapPosX = xViewCenter + pixelsPerUnit * (xObj - xMapCenter);
			obj.mapPosY = yViewCenter - pixelsPerUnit * (yObj - yMapCenter);

            //  Mark the object if it is inbounds (inside the map)

            obj.inMap = (obj.mapPosX + $Map.mapMarginX >= 0 && obj.mapPosX - $Map.mapMarginX < $Map.canvasWidth
                    && obj.mapPosY + $Map.mapMarginY >= 0 && obj.mapPosY - $Map.mapMarginY < $Map.canvasHeight);
				
			//	Add the object to the map view, if visible.
			
			if (obj["class"] != "fleet" || $Map.maxWorldRadius > 1 || $Map.objSelected == obj)
				$Map.objsInView.push(obj);
				
			//	If this is a world with nearby objects then we need to handle
			//	those too.
			//
			//	NOTE: Don't bother if we've zoomed out too much
				
			if (obj.nearObjIDs != null)
				{
				var nearObjCount = obj.nearObjIDs.length;
				var friendlyIndex = 0;
				var enemyIndex = 0;
				var friendlyStart = 0;
				var enemyStart = Math.PI;
				var angleInc = (nearObjCount > 0 ? Math.min(30 * Math.PI / 180.0, Math.PI / (3 * nearObjCount)) : 0);

				for (j = 0; j < nearObjCount; j++)
					{
					var fleetObj = objList[obj.nearObjIDs[j]];
					if (fleetObj != null && ($Map.maxWorldRadius > 1 || $Map.objSelected == fleetObj))
						{
						var isFriendly = (fleetObj.sovereignID == $Anacreon.userInfo.sovereignID);

						//	Generate a position around the world
							
						var fleetAngle;
						if (isFriendly)
							{
							if (friendlyIndex == 0)
								fleetAngle = friendlyStart;
							else if (friendlyIndex % 2)
								fleetAngle = friendlyStart + (Math.floor(friendlyIndex / 2) + 1) * angleInc;
							else
								fleetAngle = friendlyStart - Math.floor(friendlyIndex / 2) * angleInc;

							friendlyIndex++;
							}
						else
							{
							if (enemyIndex == 0)
								fleetAngle = enemyStart;
							else if (enemyIndex % 2)
								fleetAngle = enemyStart - (Math.floor(enemyIndex / 2) + 1) * angleInc;
							else
								fleetAngle = enemyStart + Math.floor(enemyIndex / 2) * angleInc;

							enemyIndex++;
							}
							
						//	The radius at which we place the fleet depends on 
						//	the size of the world.

						var fleetRadius = Math.max(8, ($Map.maxWorldRadius * obj.getSizeAdj()) + fleetRadiusOffset);
							
						//	Convert to Cartessian
							
						fleetObj.mapPosAngle = fleetAngle;
						fleetObj.mapPosX = obj.mapPosX + fleetRadius * Math.cos(fleetAngle);
						fleetObj.mapPosY = obj.mapPosY + fleetRadius * Math.sin(fleetAngle);
                        fleetObj.inMap = true;
							
						//	Add the fleet to the view
						
						$Map.objsInView.push(fleetObj);
						}
					}
				}
			}
		}
			
	//	At tactical scale we show combat groups in a single system.
		
	else
		{
		var objCenter = $Anacreon.objList[$Map.objPlanetaryCenterID];
		if (objCenter != null)
			{
			objCenter.mapPosX = xViewCenter;
			objCenter.mapPosY = yViewCenter;
				
			$Map.objsInView.push(objCenter);
			}
		}

	//	Readraw map

	$Map.invalidate();
	}
		
$Map.invalidate = function (mapOnly)
	{
	$Map.isInvalid = true;

	if (!mapOnly && $Map.navBar)
		$Map.navBar.invalidate();
	}

$Map.onMouseDown = function (e)
	{
	var messageBar = $Map.messageBar;

	//	If we're on the message bar, then let it handle it

	if (messageBar 
			&& e.pageX >= messageBar.xPos
			&& e.pageX < messageBar.xPos + messageBar.cxWidth
			&& e.pageY >= messageBar.yPos
			&& e.pageY < messageBar.yPos + messageBar.cyHeight)
		messageBar.onMouseDown(e);

	//	Otherwise, let the view handle it

	else
		$Map.mapView.onMouseDown(e, $Map.curMetrics);

	//	Prevent a click

	e.preventDefault();
	}

$Map.onMouseMove = function (e)
	{
	var messageBar = $Map.messageBar;

	//	If we're on the message bar, then let it handle it

	if (messageBar 
			&& e.pageX >= messageBar.xPos
			&& e.pageX < messageBar.xPos + messageBar.cxWidth
			&& e.pageY >= messageBar.yPos
			&& e.pageY < messageBar.yPos + messageBar.cyHeight)
		messageBar.onMouseMove(e);

	//	Otherwise, let the view handle it

	else
		$Map.mapView.onMove(e, $Map.curMetrics);
	}

$Map.onMouseUp = function (e)
	{
	var messageBar = $Map.messageBar;

	//	If we're on the message bar, then let it handle it

	if (messageBar 
			&& e.pageX >= messageBar.xPos
			&& e.pageX < messageBar.xPos + messageBar.cxWidth
			&& e.pageY >= messageBar.yPos
			&& e.pageY < messageBar.yPos + messageBar.cyHeight)
		messageBar.onMouseUp(e);

	//	Otherwise, let the view handle it

	else
		$Map.mapView.onMouseUp(e, $Map.curMetrics);
	}

$Map.refreshSelectionView = function (paneToSelect, newSelection)
	{
	var i;
		
	//	Refresh the selection so we get the latest object

	if ($Map.objSelected != null)
		$Map.objSelected = $Map.objSelected.refreshSelection();

	var obj = $Map.objSelected;

	//	Update the planetary center, if necessary

	if ($Map.objPlanetaryCenter)
		$Map.objPlanetaryCenter = $Anacreon.objList[$Map.objPlanetaryCenter.id];

	//	Debug info

	/*
	var sovereign = null;
	if (obj && obj.aiDebug)
		{
		$Map.aiDebug = [];
		var blackBoard = obj.aiDebug.blackBoard;

		for (i = 0; i < blackBoard.length; i++)
			$Map.aiDebug.push(blackBoard[i]);
		}
	*/

	//	Initialize the info pane (if it exists)

	if ($Map.infoPane)
		$Map.infoPane.init($Map.objSelected, paneToSelect, newSelection);

	//	Repaint

	$Map.invalidate();
	}
		
$Map.selectObject = function (obj, paneToSelect)
	{
	//	If selection has not changed, then nothing to do.
		
	if ($Map.objSelected == obj 
			&& (paneToSelect == null || paneToSelect == $Map.infoPane.infoPaneSelected))
		return;
			
	//	Set selection
		
	$Map.objSelected = obj;

	//	Update UI.

	$Map.refreshSelectionView(paneToSelect, true);
	$Map.mapView.onSelectionChanged(obj);
	}

$Map.selectObjectByID = function (id, paneToSelect)
	{
	var objList = $Anacreon.objList;
	if (objList != null)
		$Map.selectObject(objList[id], paneToSelect);
	}

$Map.snapshot = function ()
	{
	//	Metrics

	var cxDest = 6200;
	var cyDest = 6200;
	var cxEdge = 150;
	var cyEdge = 150;

	//	Get the canvas that we want to use

	var mapCanvas = $("#uiMapSnapshot");
	mapCanvas.attr("width", cxDest);
	mapCanvas.attr("height", cyDest);

	//	Because we use so many global variables (Bad programmer! No cookie!) we need
	//	to save some state here.

	var oldCtx = ctx;
	var oldViewportX = $Map.viewportX;
	var oldViewportY = $Map.viewportY;
	var oldUIMode = $Map.uiMode;

	//	Set to cover entire map. We compute a resolution that allows us to fit
	//	the entire map in the image (with some edges).

	$Map.viewportX = 0;
	$Map.viewportY = 0;
	$Map.uiMode = UI_MODE_SNAPSHOT;

	var maxSize = Math.max(Math.max($Anacreon.scenarioInfo.mapSize[0], $Anacreon.scenarioInfo.mapSize[1]), 500);

	var mapMetrics = $.extend({}, $Map.curMetrics);
	mapMetrics.adjWorldSize = 1.1;
	mapMetrics.pixelsPerUnit = (cxDest - 2 * cxEdge) / maxSize;

	//	Set the viewport based on the size of the window

	$Map.canvasWidth = cxDest;
	$Map.canvasHeight = cyDest;
	$Map.canvasCenterX = cxDest / 2;
	$Map.canvasCenterY = cyDest / 2;
		
	//	Draw the map so that we have something
		
	ctx = mapCanvas[0].getContext("2d");
	ctx.fillStyle = "#151519";
	ctx.fillRect(0, 0, cxDest, cyDest);
	$Map.initMapView(mapMetrics);
	$Map.mapView.onDraw(mapMetrics);

	//	Return the bits

	var snapshotData = $UI.canvasToURL(mapCanvas[0]);

	//	Restore everything

	ctx = oldCtx;
	$Map.viewportX = oldViewportX;
	$Map.viewportY = oldViewportY;
	$Map.uiMode = oldUIMode;
	refreshFullMap();

	//	Done

	return snapshotData;
	}
		
$Map.switchScale = function (oldScale, newScale)
	{
	function initScaleMegameters ()
		{
		$Map.objPlanetaryCenter = $Anacreon.objFindNearest($Map.viewportX, $Map.viewportY);
		$Map.objPlanetaryCenterID = $Map.objPlanetaryCenter.id;
			
		//	Convert viewport center to be relative to planetary center
		//	(and convert units to megameters).
			
		var xDiffLY = $Map.viewportX - $Map.objPlanetaryCenter.pos[0];
		var yDiffLY = $Map.viewportY - $Map.objPlanetaryCenter.pos[1];
			
		$Map.viewportX = MEGAMETERS_PER_LIGHTYEAR * xDiffLY;
		$Map.viewportY = MEGAMETERS_PER_LIGHTYEAR * yDiffLY;
			
		$Map.desiredViewportX = $Map.viewportX;
		$Map.desiredViewportY = $Map.viewportY;
			
		$Map.curMetrics.pixelsPerUnit = $Map.curMetrics.pixelsPerUnit / MEGAMETERS_PER_LIGHTYEAR;

		//	Initialize tactical object update

		$Map.nextTacticalTime = new Date();
		$TacticalMap.reset();
		$Map.waitingForTactical = false;
		}

	function initScaleLightYears ()
		{
		$Map.viewportX = $Map.objPlanetaryCenter.pos[0] + $Map.viewportX / MEGAMETERS_PER_LIGHTYEAR;
		$Map.viewportY = $Map.objPlanetaryCenter.pos[1] + $Map.viewportY / MEGAMETERS_PER_LIGHTYEAR;
			
		$Map.desiredViewportX = $Map.viewportX;
		$Map.desiredViewportY = $Map.viewportY;
			
		$Map.curMetrics.pixelsPerUnit = $Map.curMetrics.pixelsPerUnit * MEGAMETERS_PER_LIGHTYEAR;
			
		$Map.objPlanetaryCenter = null;
		$Map.objPlanetaryCenterID = 0;
			
		//	No longer need to update tactical objects
			
		$Map.nextTacticalTime = null;
		$TacticalMap.reset();
		$Map.waitingForTactical = false;
		}

	var changedScale = false;
	if (oldScale == newScale)
		{
		//	Nothing to do
		}
	else if (newScale == "tactical")
		{
		if (oldScale == "galactic")
			{
			initScaleMegameters();
			changedScale = true;
			}
			
		$Map.mapView = $TacticalMap;
		}
	else if (newScale == "planetary")
		{
		if (oldScale == "galactic")
			{
			initScaleMegameters();
			changedScale = true;
			}

		$Map.mapView = $PlanetaryMap;
		}
	else if (newScale == "galactic")
		{
		if (oldScale != null)
			{
			initScaleLightYears();
			changedScale = true;
			}

		$Map.mapView = $GalacticMap;
		}

	//	Done

	return changedScale;
	}
		
$Map.updatePanZoomAnimation = function ()
	{
	var invalidateMap = false;
		
	var pixelsPerUnit = $Map.curMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
		
	//	Zoom paning
		
	var isPanning = false;
	if (xMapCenter != $Map.desiredViewportX || yMapCenter != $Map.desiredViewportY)
		{
		var diffX = $Map.desiredViewportX - xMapCenter;
		var diffY = $Map.desiredViewportY - yMapCenter;
		var tolerance = 1.0 / pixelsPerUnit;
		if (Math.abs(diffX) < tolerance && Math.abs(diffY) < tolerance)
			{
			$Map.viewportX = $Map.desiredViewportX;
			$Map.viewportY = $Map.desiredViewportY;
			}
		else
			{
			$Map.viewportX = xMapCenter + (diffX / 2.0);
			$Map.viewportY = yMapCenter + (diffY / 2.0);
			isPanning = true;
			}
				
		invalidateMap = true;
		}
		
	//	Zoom animation

	if ($Map.zoomLevel != $Map.desiredZoomLevel && !isPanning)
		{
		var diff = ($Map.desiredZoomLevel > $Map.zoomLevel ? 1 : -1);

		var oldScale = ZOOM_LEVELS[$Map.zoomLevel][1];
		var newScale = ZOOM_LEVELS[$Map.zoomLevel + diff][1];

		$Map.curMetrics.pixelsPerUnit = ZOOM_LEVELS[$Map.zoomLevel][2];
		$Map.zoomLevel += diff;
		$Map.desiredPixelsPerUnit = ZOOM_LEVELS[$Map.zoomLevel][2];

		if ($Map.switchScale(oldScale, newScale))
			{
			//	If we switched scales then we need to adjust the current
			//	pixels per unit (since it is on a different scale).

			if (diff == 1)
				$Map.curMetrics.pixelsPerUnit = 2 * $Map.desiredPixelsPerUnit;
			else
				$Map.curMetrics.pixelsPerUnit = 0.5 * $Map.desiredPixelsPerUnit;
			}

		$Map.initMapView($Map.curMetrics);

		invalidateMap = true;
		}
	else if (pixelsPerUnit != $Map.desiredPixelsPerUnit)
		{
		var diff = $Map.desiredPixelsPerUnit - pixelsPerUnit;
		if (Math.abs(diff) < ($Map.desiredPixelsPerUnit / 20.0))
			$Map.curMetrics.pixelsPerUnit = $Map.desiredPixelsPerUnit;
		else
			$Map.curMetrics.pixelsPerUnit = pixelsPerUnit + (diff / 2.0);
				
		invalidateMap = true;
		}
			
	return invalidateMap;
	}
	
function onAnimate ()
	{
	//	Redraw

	if ($Map.isInvalid)
		{
		//	We reset the variable here because onDraw might invalidate
		//	(e.g., if we're zooming).

		$Map.isInvalid = false;
		ctx.clearRect(0, 0, theCanvas.width(), theCanvas.height());

		//	If we got an error on update then we just display that

		if ($Map.updateError)
			{
			//	NOTE: At this point our custom fonts are not loaded yet.
			ctx.font = "20pt Tahoma";
			//ctx.font = $Style.tileFontExtraLargeBold;
			ctx.fillStyle = $Style.tileTextHighlight;
			ctx.textAlign = "center";
			ctx.fillText("ERROR: " + $Map.updateError, theCanvas.width() / 2, theCanvas.height() / 2);
			return;
			}

		//	Initialize some options

		$Map.curMetrics.showManeuveringTrails = !$Anacreon.userInfo.uiOptions.noManeuveringTrails;
		
		//	Allow our specialization to draw
		
		$Map.mapView.onDraw($Map.curMetrics);

		//	Draw effects on top

		for (i = 0; i < $Map.effects.length; i++)
			$Map.effects[i].onDraw(ctx, $Map.curMetrics);

		//	Draw the notification pane (on top)

		if ($Map.messageBar)
			$Map.messageBar.onDraw();
		}
	else if ($Map.updateError)
		return;

	$Map.mapView.onUpdate();

	//	Update effects

	for (i = 0; i < $Map.effects.length; i++)
		{
		if (!$Map.effects[i].onUpdate())
			{
			$Map.effects.splice(i, 1);
			$Map.invalidate("mapOnly");
			i--;
			}
		}
		
	//	See if we need to update tactical
		
	var now = new Date();
	if ($Map.nextTacticalTime != null && !$Map.waitingForTactical && now > $Map.nextTacticalTime)
		{
		$Map.waitingForTactical = true;
		$Map.nextTacticalTime.setTime($Map.nextTacticalTime.getTime() + 1000);

		var request = {
	        authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			objID: $Map.objPlanetaryCenterID
			};
		
		$.ajax({
		    url: "/api/getTactical",
		    type: "POST",
		    data: JSON.stringify(request),
		    contentType: "application/json",
		    dataType: "json",
            timeout: 30000,

		    success: (function (data) {
				$Map.waitingForTactical = false;

				if ($Hexarc.isError(data))
					$Map.updateError = $Hexarc.getErrorMessage(data);
				else
					$TacticalMap.initTactical(data);
		        }),

		    error: (function (jqXHR, textStatus, errorThrown) {
				$Map.waitingForTactical = false;
                $Map.updateError = textStatus;
	    	    })
    		});
		}
			
	//	See if we need to update the full galaxy
		
	if (!$Anacreon.waitingForUpdate && now > $Anacreon.nextUpdateTime)
		{
		$Anacreon.waitingForUpdate = true;

		var request = {
            authToken: $UserInfo.authToken, 
			gameID: $Anacreon.gameID,
			sovereignID: $Anacreon.userInfo.sovereignID,
			sequence: $Anacreon.seq
			};
		
		$.ajax({
		    url: "/api/getObjects",
		    type: "POST",
		    data: JSON.stringify(request),
		    contentType: "application/json",
		    dataType: "json",
            timeout: 60000,

		    success: (function (data) {
                $Anacreon.waitingForUpdate = false;

    			if ($Hexarc.isError(data))
                    $Map.updateError = $Hexarc.getErrorMessage(data);
                else
					{
					$Anacreon.processUpdate(data);
					$Map.initMapView($Map.curMetrics);
					$Map.refreshSelectionView();
					}
		        }),

		    error: (function (jqXHR, textStatus, errorThrown) {
		        $Anacreon.waitingForUpdate = false;
                $Map.updateError = textStatus;
	    	    })
    		});
		}
	}
		
function onKeypress (e)
	{
	if ($Map.infoPane && $Map.infoPane.inModal())
		return;

	switch (e.which)
		{
		case KEY_MINUS:
		case KEY_KEYPAD_MINUS:
			{
			$Map.cmdZoomOut();
			break;
			}
				
		case KEY_PLUS:
		case KEY_KEYPAD_PLUS:
		case KEY_EQUALS:
			{
			$Map.cmdZoomIn();
			break;
			}
		}
	}

function onRightClickMap (e)
	{
	var objSelected = $Map.objSelected;
	var destObj = $Map.findObjInView(e.pageX, e.pageY);
		
	//	If we have one of our fleets selected then this changes their
	//	destination.
		
	if (objSelected != null 
			&& destObj != null
			&& objSelected["class"] == "fleet"
			&& destObj["class"] == "world"
			&& objSelected.sovereignID == $Anacreon.userInfo.sovereignID
			&& !$Anacreon.waitingForUpdate)
		{
		fleetSetDestination(objSelected, destObj);
		}
			
	//	If we have a world selected, then clicking on another world adds
	//	an trade import route.
		
	else if (objSelected != null
			&& destObj != null
			&& objSelected["class"] == "world"
			&& objSelected.sovereignID == $Anacreon.userInfo.sovereignID
			&& objSelected != destObj
			&& destObj["class"] == "world"
			&& destObj.sovereignID == $Anacreon.userInfo.sovereignID)
		{
		worldAddTradeRoute(objSelected, destObj);
		}
		
	//	Do not show popup menu
	e.preventDefault();
	}
		
function refreshFullMap ()
	{
	//	Center the selection pane

	var selPane = $("#uiBottomFrame");
	var dlgTop = ($(window).height() - selPane.height());
	var dlgLeft = ($(window).width() - selPane.width()) / 2;
	selPane.css({top:dlgTop, left:dlgLeft});

	//	Make sure the canvas is sized properly
		
	theCanvas.attr("width", $(window)[0].innerWidth);
	theCanvas.attr("height", $(window)[0].innerHeight);

	//	Set the viewport based on the size of the window

	$Map.canvasWidth = theCanvas.width();
	$Map.canvasHeight = theCanvas.height();
	$Map.canvasCenterX = $Map.canvasWidth / 2;
	$Map.canvasCenterY = 64 + ($Map.canvasHeight - (64 + selPane.height())) / 2;
		
	//	Draw the (stale) mape so that we have something
		
	$Map.initMapView($Map.curMetrics);
	$Map.mapView.onDraw($Map.curMetrics);
	}

//	Map Effects ----------------------------------------------------------------

function TextMapEffect (anchorX, anchorY, text, options)
	{
	this.anchorX = anchorX;
	this.anchorY = anchorY;
	this.text = text;
	this.options = options;

	this.lifetime = 120;
	this.blinkTime = 10;
	this.fadeTime = 30;
	this.lifeLeft = this.lifetime;
	}

TextMapEffect.prototype.onDraw = function (ctx, mapMetrics)
	{
	//	Figure out the anchor position in pixels

	var pos = $GalacticMap.toMapXY(mapMetrics, this.anchorX, this.anchorY);
	var x = pos.x;
	var y = pos.y + $Style.tileFontExtraLargeHeight;

	//	Initialize

	ctx.font = $Style.tileFontExtraLarge;
	ctx.textAlign = "center";
	ctx.textBaseline = "top";

	//	Fade as at the end

	ctx.globalAlpha = (this.lifeLeft >= this.fadeTime ? 1.0 : this.lifeLeft / this.fadeTime);

	//	Draw a box behind the text

	var cyMargin = 8;
	var cxText = ctx.measureText(this.text).width;
	var cxHalfText = 0.5 * cxText;
	var cyText = $Style.tileFontExtraLargeHeight + (2 * cyMargin);
	var cxAngle = cyText * 0.577350;	//	1/tan(60)

	ctx.beginPath();
	ctx.moveTo(x - cxHalfText, y);
	ctx.lineTo(x + cxHalfText + cxAngle, y);
	ctx.lineTo(x + cxHalfText, y + cyText);
	ctx.lineTo(x - cxHalfText - cxAngle, y + cyText);
	ctx.closePath();

	ctx.fillStyle = "rgba(0,0,0,0.5)";
	ctx.fill();

	//	Draw text

	if ((this.lifetime - this.lifeLeft) < this.blinkTime)
		{
		switch (this.lifeLeft % 2)
			{
			case 0:
				ctx.fillStyle = "#000000";
				break;

			case 1:
				ctx.fillStyle = "#ffffff";
				break;
			}
		}
	else
		ctx.fillStyle = $Style.mapWarningText;

	ctx.fillText(this.text, x, y + cyMargin);

	ctx.globalAlpha = 1.0;
	}

TextMapEffect.prototype.onUpdate = function ()
	{
	if (--this.lifeLeft == 0)
		return false;

	if ((this.lifetime - this.lifeLeft) < (this.blinkTime + 2)
			|| this.lifeLeft < this.fadeTime)
		$Map.invalidate("mapOnly");

	return true;
	}

//	Main -----------------------------------------------------------------------
		
$(document).ready(function () {
	//	Store the canvas and ctx in global.
	//
	//	canvas is a JQuery object so we use array subscript to get to the
	//	raw DOM node.
		
	theCanvas = $("#uiMap");
	ctx = theCanvas[0].getContext("2d");

	//	Make sure the canvas is sized properly
		
	theCanvas.attr("width", $(window)[0].innerWidth);
	theCanvas.attr("height", $(window)[0].innerHeight);

	//	If not signed in, then just say so

	if ($UserInfo == null)
		{
		//	NOTE: At this point our custom fonts are not loaded yet.
		ctx.font = "20pt Tahoma";
		//ctx.font = $Style.tileFontExtraLargeBold;
		ctx.fillStyle = $Style.tileTextHighlight;
		ctx.textAlign = "center";
		ctx.fillText("Please sign in", theCanvas.width() / 2, theCanvas.height() / 2);
		return;
		}

	//	Loading animation

	var loadingAnimation = setInterval($Map.animateLoading, 1000 / FRAMES_PER_SECOND);

    //  Set up some defaults for ajax

	$.ajaxSetup({
        timeout: 30000
	    });
		
	//	Initialize
		
	$Anacreon.initSession(function () {

		//	Done animating

		clearInterval(loadingAnimation);

		//	Initialize some stuff
		
		$Map.curMetrics = {};

		//	If we have an error during load then we just display it on the map

		if ($Map.updateError)
			{
			$Map.invalidate();
			$(window).resize(function () { $Map.invalidate(); });
			setInterval(onAnimate, 1000 / FRAMES_PER_SECOND);
			return;
			}

		//	Center on the capital

		var capitalObj = $Anacreon.objList[$Anacreon.userInfo.capitalObjID];
		if (capitalObj)
			{
			$Map.viewportX = capitalObj.pos[0];
			$Map.viewportY = capitalObj.pos[1];
			}
		else
			{
			$Map.xyCenter = $Anacreon.userInfo.mapBookmarks[0];
			$Map.viewportX = $Map.xyCenter[0];
			$Map.viewportY = $Map.xyCenter[1];
			}

		//	Initialize map

		$Map.desiredViewportX = $Map.viewportX;
		$Map.desiredViewportY = $Map.viewportY;
		$Map.zoomLevel = DEFAULT_ZOOM_LEVEL;
		$Map.curMetrics.adjWorldSize = 1.0;
		$Map.curMetrics.pixelsPerUnit = ZOOM_LEVELS[$Map.zoomLevel][2];
		$Map.desiredZoomLevel = $Map.zoomLevel;
		$Map.desiredPixelsPerUnit = $Map.curMetrics.pixelsPerUnit;
		$Map.switchScale(null, "galactic");

		$Map.icons = $("#idMapIcons")[0];
		$Map.techLevelIcons = $("#idTechLevelIcons")[0];

		//	Register appropriate events
			
		$UI.keypress(onKeypress);
		$("#uiMap").on("mousedown", $Map.onMouseDown);
		$("#uiMap").on("mousemove", $Map.onMouseMove);
		$("#uiMap").on("mouseup", $Map.onMouseUp);
		$("#uiMap").on("contextmenu", onRightClickMap);
		$(window).resize(refreshFullMap);

		//	Draw the map
			
		refreshFullMap();

		//	Show the panes

		$("#uiNav").show();
		$("#uiBottomFrame").show();

		//	Initialize nav bar (This has to go after we show the panes because
		//	it computes some metrics that are only valid if visible.)

		$Map.navBar = new NavBar($("#uiNavCanvas"));
		$Map.infoPane = new InfoPane($("#uiInfoPaneCanvas"));

		//	Set the selection now that we have the pane initialized

		$Map.selectObjectByID($Anacreon.userInfo.capitalObjID);
		if ($Map.objSelected == null)
			$Map.refreshSelectionView();

		//	Start animation
			
		setInterval(onAnimate, 1000 / FRAMES_PER_SECOND);
		});
	});
