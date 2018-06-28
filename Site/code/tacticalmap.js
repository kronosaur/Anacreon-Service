//	tacticalmap.js
//
//	Implements UI for tactical map
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

var CONTROL_LIST_ICON_WIDTH = 15;

var $TacticalMap = {

	//	UI modes:
	//
	//	null: normal
	//	"selectOrbit": Allows user to select a new orbit.
	//	"selectTarget": Allows user to select an enemy group.

	uiMode: null,

	//	Group selection list

	groundGroupList: null,
	orbitingGroupList: null,
	};

$TacticalMap.drawGroupList = function (groupList)
	{
	if (groupList == null || groupList.content == null)
		return;

	var i;
	var content = groupList.content;
	var selectTargetObj = ($TacticalMap.uiMode == "selectTarget" ? $TacticalMap.getSelectedTacticalGroup() : null);

	for (i = 0; i < content.length; i++)
		{
		var theCtrl = content[i];
		var isHover = (theCtrl == $TacticalMap.hoverCtrl);

		var isFaded;
		if (selectTargetObj)
			isFaded = !selectTargetObj.isValidTarget(theCtrl.tacticalObj);
		else
			isFaded = false;

		theCtrl.onDraw(ctx, theCtrl.xPos, theCtrl.yPos, isHover, isFaded);
		}
	}

$TacticalMap.getSelectedTacticalGroup = function ()
	{
	return (($Map.objSelected && $Map.objSelected.kind == "tactical") ? $Map.objSelected : null);
	}

$TacticalMap.getSpaceObject = function (tacticalObj)
	{
	if (tacticalObj.objClass == "siege")
		return $Anacreon.siegeList[tacticalObj.objID];
	else
		return $Anacreon.objList[tacticalObj.objID];
	}

$TacticalMap.findControlAtPos = function (groupList, xPos, yPos)
	{
	var i;
	var content = (groupList ? groupList.content : null);
	if (content == null)
		return null;

	for (i = 0; i < content.length; i++)
		{
		var theCtrl = content[i];
		if (xPos >= theCtrl.xPos 
				&& xPos < theCtrl.xPos + theCtrl.cxWidth
				&& yPos >= theCtrl.yPos
				&& yPos < theCtrl.yPos + theCtrl.cyHeight)
			return theCtrl;
		}

	return null;
	}

$TacticalMap.initGroupLists = function ()
	{
	var i, j;

	//	Sort all the tactical groups into various categories.

	var planetObj = $Map.objPlanetaryCenter;
	var catList = [];
	var tacticalList = $Map.tacticalObjects;
	for (i = 0; i < tacticalList.length; i++)
		{
		var tactical = tacticalList[i];
		if (tactical == null)
			continue;
			
		var tacticalClass = tactical["class"];
		var unitType = $Anacreon.designTypes[tactical.unitTypeID];
		
		if (tacticalClass == "squadron" || tacticalClass == "ground" || tacticalClass == "circular")
			{
			var obj = tactical.getSpaceObject();

			var category;
			if (tacticalClass == "ground" || (tacticalClass == "squadron" && !tactical.inSpace))
				category = "groundForce";
			else if (unitType.category == "fixedUnit" || unitType.category == "LAMUnit")
				category = "groundDefense";
			else
				category = "orbiting";

			//	Look for the appropriate category for this object.

			var theCat = null;
			for (j = 0; j < catList.length; j++)
				{
				if (catList[j].obj.id == obj.id && catList[j].category == category)
					{
					theCat = catList[j];
					break;
					}
				}

			//	If not found then we need to add a category

			if (theCat == null)
				{
				theCat = {
					obj: obj,
					category: category,
					isForeign: (obj.sovereignID != $Anacreon.userInfo.sovereignID),
					groups: [ ],
					};

				catList.push(theCat);
				}

			//	Add to the category list

			theCat.groups.push(tactical);
			}
		}

	//	Now sort all the lists within each category

	for (i = 0; i < catList.length; i++)
		{
		catList[i].groups.sort(function (a, b) {

			//	Sort by unit type (in case we have transports on the ground, we
			//	show infantry first).

			var aUnitType = $Anacreon.designTypes[a.unitTypeID];
			var bUnitType = $Anacreon.designTypes[b.unitTypeID];

			if (aUnitType.category == "groundUnit" && bUnitType.category != "groundUnit")
				return -1;
			else if (aUnitType.category != "groundUnit" && bUnitType.category == "groundUnit")
				return 1;

			//	Then by name
			
			else if (aUnitType.nameDesc < bUnitType.nameDesc)
				return -1;
			else if (aUnitType.nameDesc > bUnitType.nameDesc)
				return 1;
				
			//	For tacticals with the same unit type, we sort by ID.
			
			else
				{
				if (a.id < b.id)
					return -1;
				else if (a.id > b.id)
					return 1;
				else
					return 0;
				}
			});
		}

	//	Now sort the categories

	catList.sort(function (a, b) {

		//	Our groups always go first

		if (!a.isForeign && b.isForeign)
			return -1;
		else if (a.isForeign && !b.isForeign)
			return 1;

		//	Fleets go first

		else if (a.obj["class"] == "fleet" && b.obj["class"] != "fleet")
			return -1;
		else if (a.obj["class"] != "fleet" && b.obj["class"] == "fleet")
			return 1;

		//	Ground forces go before defenses

		else if (a.category == "groundForce" && b.category != "groundForce")
			return -1;
		else if (a.category != "groundForce" && b.category == "groundForce")
			return 1;

		//	Else by object id

		else if (a.obj.id < b.obj.id)
			return -1;
		else if (a.obj.id > b.obj.id)
			return 1;
		else
			return 0;
		});

	//	Compute some metrics

	var x, y;
	var cxTile = 80;
	var cyTile = 64;
	var cyStatusTile = 128;
	var cxSpacing = 1;
	var cySpacing = 1;
	var colCount = (tacticalList.length > 25 ? 4 : 3);
	var cxPane = (colCount * cxTile) + (colCount - 1) * cxSpacing;
	var cxPaneLeftSpacing = 20;
	var cxPaneRightSpacing = 20;

	//	Create the list of all orbiting groups

	x = theCanvas.width() - (cxPane + cxPaneRightSpacing);
	y = 200 - (cyStatusTile + cySpacing);

	$TacticalMap.orbitingGroupList = {
		content: [],

		xPos: x,
		yPos: y,
		cxWidth: cxPane,
		cyHeight: theCanvas.height() - y,
		};

	var newList = $TacticalMap.orbitingGroupList.content;

	//	Add the top tile showing the progress of the entire battle

	if (planetObj
			&& ((planetObj.battlePlan && planetObj.battlePlan.objective)
				|| (planetObj.hasAttackers() && planetObj.getTargetsToAttack())))
		{
		newList.push(new TacticalStatusTile(x, y, cxPane, cyStatusTile));
		y += cyStatusTile + cySpacing;
		}

	//	Now add all orbiting categories

	for (i = 0; i < catList.length; i++)
		{
		var theCat = catList[i];
		if (theCat.category == "orbiting")
			{
			//	Add a header

			newList.push(new TacticalHeaderTile(x, y, cxPane, cyTile / 2, theCat.obj));
			y += (cyTile / 2) + cySpacing;
			
			//	Now add all the groups

			for (j = 0; j < theCat.groups.length; j++)
				{
				var col = j % colCount;
				if (j != 0 && col == 0)
					y += cyTile + cySpacing;

				newList.push(new TacticalGroupTile(x + (col * (cxTile + cySpacing)), y, cxTile, cyTile, theCat.groups[j]));
				}

			y += cyTile + cySpacing + (cyTile / 2);
			}
		}

	//	Create the list of all ground on the planet

	x = cxPaneLeftSpacing;
	y = 200;

	$TacticalMap.groundGroupList = {
		content: [],

		xPos: x,
		yPos: y,
		cxWidth: cxPane,
		cyHeight: theCanvas.height() - y,
		};

	newList = $TacticalMap.groundGroupList.content;

	//	Now add all ground categories

	for (i = 0; i < catList.length; i++)
		{
		var theCat = catList[i];
		if (theCat.category != "orbiting")
			{
			//	Add a header

			newList.push(new TacticalHeaderTile(x, y, cxPane, cyTile / 2, theCat.obj));
			y += (cyTile / 2) + cySpacing;
			
			//	Now add all the groups

			for (j = 0; j < theCat.groups.length; j++)
				{
				var col = j % colCount;
				if (j != 0 && col == 0)
					y += cyTile + cySpacing;

				newList.push(new TacticalGroupTile(x + (col * (cxTile + cySpacing)), y, cxTile, cyTile, theCat.groups[j]));
				}

			y += cyTile + cySpacing + (cyTile / 2);
			}
		}
	}

$TacticalMap.initTactical = function (data)
	{
	$Map.waitingForTactical = false;
	if (data == null)
		{
		$Map.nextTacticalObjects = [];
		$Map.aiDebug = [];
		return;
		}

	var total = data.length;
	
	//	Store the data in a new variable; we don't flip to tacticalObjects
	//	until we need it (until we run out of frames).
	
	$Map.nextTacticalObjects = [];
	$Map.aiDebug = [];
	var i, j;
	for (i = 0; i < total; i++)
		{
		var serverObj = data[i];
		var tacticalClass = serverObj["class"];
		
		//	Update the appropriate structure based on the object class
		
		if (tacticalClass == "aiDebug")
			{
			for (j = 0; j < serverObj.blackBoard.length; j++)
				$Map.aiDebug.push(serverObj.blackBoard[j]);
			}
		else if (tacticalClass == "battlePlan")
			{
			if ($Map.objPlanetaryCenter)
				$Map.objPlanetaryCenter.battlePlan = serverObj;
			}
		else if (tacticalClass == "circular")
			{
			if ($TacticalMap.getSpaceObject(serverObj) == null)
				continue;

			var tactical = new CircularTactical(serverObj);
			$Map.nextTacticalObjects[serverObj.id] = tactical;
			}
		else if (tacticalClass == "events")
			{
			$Map.nextEventsList = serverObj.events;
			}
		else if (tacticalClass == "ground")
			{
			if ($TacticalMap.getSpaceObject(serverObj) == null)
				continue;

			var tactical = new GroundTactical(serverObj);
			$Map.nextTacticalObjects[serverObj.id] = tactical;
			}
		else if (tacticalClass == "missiles")
			{
			$Map.nextMissilesList = serverObj.missiles;
			}
		else if (tacticalClass == "planet")
			{
			var tactical = new PlanetTactical(serverObj);
			$Map.nextTacticalObjects[tactical.id] = tactical;
			}
		else if (tacticalClass == "squadron")
			{
			if ($TacticalMap.getSpaceObject(serverObj) == null)
				continue;

			var tactical = new SquadronTactical(serverObj);
			$Map.nextTacticalObjects[tactical.id] = tactical;
			}
		else if (tacticalClass == "tactical")
			{
			$TacticalMap.minOrbit = serverObj.minOrbit;
			$TacticalMap.maxOrbit = serverObj.maxOrbit;
			}
		else if (tacticalClass == "update")
			{
			if (serverObj.sequence > $Anacreon.seq
					&& !$Anacreon.waitingForUpdate)
				$Anacreon.nextUpdateTime = new Date();
			}
		}
	}
		
$TacticalMap.onDraw = function (mapMetrics)
	{
	var i;
	var obj = $Map.objPlanetaryCenter;
	
	//	Paint the tactical view.
	
	var tacticalList = $Map.tacticalObjects;
	var total = tacticalList.length;
	
	var pixelsPerUnit = mapMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
	var xViewCenter = $Map.canvasCenterX;
	var yViewCenter = $Map.canvasCenterY;
	var frame = $Map.tacticalFrame;
	var tacticalSelectedID = (($Map.objSelected && $Map.objSelected.kind == "tactical") ? $Map.objSelected.id : null);

	//	Fill the background

	var imageDesc = (obj ? obj.getSpaceBackgroundImage() : $Anacreon.defaultSpaceRegion.backgroundImageTactical);
	if (imageDesc)
		{
		var scale = Math.pow(2, 0.1 * ((Math.log(mapMetrics.pixelsPerUnit) / Math.log(2)) - 2));
		$Map.drawBackground(ctx, imageDesc, scale, obj.pos[0], obj.pos[1]);
		}
	else
		{
		ctx.fillStyle = $Anacreon.color($Anacreon.defaultSpaceRegion.backgroundColor);
		ctx.fillRect(0, 0, $Map.canvasWidth, $Map.canvasHeight);
		}

	//	If we have no objects to draw and the center is a fleet, then just draw it

	if (total == 0 && obj)
		{
		obj.drawPlanetaryMap(ctx, xViewCenter, yViewCenter, pixelsPerUnit);
		return;
		}

	//	Paint orbit selection range

	if ($TacticalMap.uiMode == "selectOrbit")
		{
		var center = $Map.getViewPos(0, 0);
		var minRadius = pixelsPerUnit * $TacticalMap.minOrbit;
		var maxRadius = Math.min($Map.canvasCenterX, pixelsPerUnit * $TacticalMap.maxOrbit);

		ctx.beginPath();
		ctx.arc(center[0], center[1], maxRadius, 0, 2 * Math.PI, false);
		ctx.arc(center[0], center[1], minRadius, 0, 2 * Math.PI, true);
		ctx.fillStyle = $Style.mapSafeOrbit;
		ctx.fill();
		}

	//	Paint all tactical objects
	
	for (i = 0; i < total; i++)
		{
		var tactical = tacticalList[i];
		if (tactical == null)
			continue;

		var tacticalClass = tactical["class"];
		var isSelected = (tacticalSelectedID == tactical.id);
		
		tactical.draw(ctx, mapMetrics, frame, isSelected);
		}
		
	//	Paint all missiles
	
	if ($Map.missilesList)
		{
		for (i = 0; i < $Map.missilesList.length; i += 2)
			{
			var pos = $Map.missilesList[i];
			var frameIndex = frame * 2;
			
			if (pos[frameIndex] != null)
				{
				var xPos = xViewCenter + pixelsPerUnit * (pos[frameIndex] - xMapCenter);
				var	yPos = yViewCenter - pixelsPerUnit * (pos[frameIndex + 1] - yMapCenter);
				
				ctx.fillStyle = "#ffff80";
				ctx.fillRect(xPos, yPos, 2, 2);
				}
			}
		}
		
	//	Paint all effects
	
	var eventsList = ($Map.eventsList != null ? $Map.eventsList[frame] : null);
	if (eventsList)
		{
		for (i = 0; i < eventsList.length; i++)
			{
			if (eventsList[i].type == "beam")
				{
				var posSrc = eventsList[i].sourcePos;
				var posDst = eventsList[i].destPos;
				
				var xSrc = xViewCenter + pixelsPerUnit * (posSrc[0] - xMapCenter);
				var ySrc = yViewCenter - pixelsPerUnit * (posSrc[1] - yMapCenter);
				
				var xDst = xViewCenter + pixelsPerUnit * (posDst[0] - xMapCenter);
				var yDst = yViewCenter - pixelsPerUnit * (posDst[1] - yMapCenter);
				
				ctx.beginPath();
				ctx.moveTo(xSrc, ySrc);
				ctx.lineTo(xDst, yDst);
				
				ctx.strokeStyle = eventsList[i].color;
				ctx.globalAlpha = eventsList[i].opacity;
				ctx.stroke();
				ctx.globalAlpha = 1.0;
				}
			else if (eventsList[i].type == "fireball")
				{
				var posSrc = eventsList[i].sourcePos;
				
				var xSrc = xViewCenter + pixelsPerUnit * (posSrc[0] - xMapCenter);
				var ySrc = yViewCenter - pixelsPerUnit * (posSrc[1] - yMapCenter);
				
				var radius = pixelsPerUnit * eventsList[i].radius;
				
				ctx.beginPath();
				ctx.fillStyle = eventsList[i].color;
				ctx.arc(xSrc, ySrc, radius, 0, 2 * Math.PI, false);
				ctx.fill();
				}
			else if (eventsList[i].type == "flash")
				{
				var posSrc = eventsList[i].sourcePos;
				
				var xSrc = xViewCenter + pixelsPerUnit * (posSrc[0] - xMapCenter);
				var ySrc = yViewCenter - pixelsPerUnit * (posSrc[1] - yMapCenter);
				
				var radius = pixelsPerUnit * eventsList[i].radius;

				var grd = ctx.createRadialGradient(xSrc, ySrc, 0, xSrc, ySrc, radius);
				grd.addColorStop(0, "rgba(224, 224, 255, 1.0)");
				grd.addColorStop(1, "rgba(224, 224, 255, 0.0)");
				
				ctx.beginPath();
				ctx.fillStyle = grd;
				ctx.arc(xSrc, ySrc, radius, 0, 2 * Math.PI, false);
				ctx.fill();
				}
			}
		}
		
	//	Paint orbit selection

	if ($TacticalMap.uiMode == "selectOrbit")
		{
		//	Paint the current orbit

		if ($TacticalMap.selectOrbitRadius)
			{
			var center = $Map.getViewPos(0, 0);
			var radius = pixelsPerUnit * $TacticalMap.selectOrbitRadius;
		
			ctx.beginPath();
			ctx.strokeStyle = "#d9d9ff";
			ctx.lineWidth = 1;
			ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI, false);
			ctx.stroke();
			}
		}

	//	Paint the control list

	$TacticalMap.drawGroupList($TacticalMap.orbitingGroupList);
	$TacticalMap.drawGroupList($TacticalMap.groundGroupList);
	
	//	Draw debug info

	if ($Anacreon.debugMode)
		$Map.drawAIDebug(ctx);
	
	//	Update pan/zoom animation
	
	$Map.updatePanZoomAnimation();
	}

$TacticalMap.onMouseDown = function (e)
	{
	var i;

	//	Orbit select mode

	if ($TacticalMap.uiMode == "selectOrbit")
		{
		//	Order a change in orbit

		$TacticalMap.orderSetOrbit($Map.objSelected, $TacticalMap.selectOrbitRadius);

		//	Back to normal UI

		$TacticalMap.uiMode = null;
		$Map.refreshSelectionView();
		}
	
	//	Normal more
	
	else
		{
		if (e.which == 1)
			{
			//	See if we click on a control list entry

			var theCtrl = $TacticalMap.findControlAtPos($TacticalMap.groundGroupList, e.pageX, e.pageY);
			if (theCtrl == null)
				theCtrl = $TacticalMap.findControlAtPos($TacticalMap.orbitingGroupList, e.pageX, e.pageY);

			//	Handle it

			if (theCtrl == null)
				;

			//	If we are selecting a target, then use that

			else if ($TacticalMap.uiMode == "selectTarget")
				{
				var selectTargetObj = $TacticalMap.getSelectedTacticalGroup();
				if (selectTargetObj && selectTargetObj.isValidTarget(theCtrl.tacticalObj))
					{
					//	Set the target

					$TacticalMap.orderSetTarget($Map.objSelected, theCtrl.tacticalObj);

					//	Back to normal UI

					$TacticalMap.uiMode = null;
					$Map.refreshSelectionView();
					}
				}

			//	Otherwise, pass to control tile

			else if (theCtrl.onMouseDown)
				theCtrl.onMouseDown(e, e.pageX, e.pageY);
			}
		}
	}
	
$TacticalMap.onMouseUp = function (e)
	{
	var i;
	
	//	Left-click selects the object
	
	if (e.which == 1)
		{
		}
	}
	
$TacticalMap.onMove = function (e, mapMetrics)
	{
	if ($TacticalMap.uiMode == "selectOrbit")
		{
		//	Compute the screen coordinates of mouse relative to the center of 
		//	the planet.

		var center = $Map.getViewPos(0, 0);
		var x = (e.pageX - center[0]);
		var y = (center[1] - e.pageY);

		//	Radius in pixels

		var radiusPixels = Math.sqrt(x * x + y * y);

		//	Radius in megameters

		$TacticalMap.selectOrbitRadius = Math.min(Math.max($TacticalMap.minOrbit, radiusPixels / mapMetrics.pixelsPerUnit), $TacticalMap.maxOrbit);
		}
	else
		{
		//	See if we are hovering over a control

		var newHover = $TacticalMap.findControlAtPos($TacticalMap.groundGroupList, e.pageX, e.pageY);
		if (newHover == null)
			newHover = $TacticalMap.findControlAtPos($TacticalMap.orbitingGroupList, e.pageX, e.pageY);

		if (newHover != $TacticalMap.hoverCtrl)
			{
			if ($TacticalMap.hoverCtrl && $TacticalMap.hoverCtrl.onMouseExit)
				$TacticalMap.hoverCtrl.onMouseExit(e);

			$TacticalMap.hoverCtrl = newHover;

			if (newHover && newHover.onMouseEnter)
				newHover.onMouseEnter(e)
			}

		if (newHover && newHover.onMouseMove)
			newHover.onMouseMove(e, e.pageX, e.pageY);
		}
	}

$TacticalMap.onSelectionChanged = function (newSel)
	{
	if ($TacticalMap.uiMode != null)
		{
		$TacticalMap.uiMode = null;
		$Map.refreshSelectionView();
		}
	}

$TacticalMap.onUpdate = function ()
	{
	var i;

	//	Update frames
	
	if ($Map.tacticalObjects.length == 0 || $Map.tacticalFrame == 29)
		{
		if ($Map.nextTacticalObjects != null)
			{
			//	Copy trails

			if (!$Anacreon.userInfo.uiOptions.noManeuveringTrails)
				{
				for (i = 0; i < $Map.nextTacticalObjects.length; i++)
					{
					var obj = $Map.nextTacticalObjects[i];
					if (obj == null)
						continue;

					var oldObj = $Map.tacticalObjects[obj.id];
					if (oldObj == null)
						continue;

					obj.trail = oldObj.trail;
					obj.trailFrame = oldObj.trailFrame;
					}
				}

			$Map.tacticalObjects = $Map.nextTacticalObjects;

			$Map.tacticalFrame = 0;
			$Map.nextTacticalObjects = null;
			
			$TacticalMap.initGroupLists();
			
			if ($Map.objSelected != null && $Map.objSelected.kind == "tactical")
				$Map.refreshSelectionView();
			
			$Map.eventsList = $Map.nextEventsList;
			$Map.missilesList = $Map.nextMissilesList;
			}
		}
	else
		$Map.tacticalFrame++;

	$Map.invalidate("mapOnly");
	}

$TacticalMap.orderLand = function (tacticalObj)
	{
	if (tacticalObj == null || tacticalObj.kind != "tactical")
		return;

	//	Order a change in orbit

	var params = {
        authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: $Map.objPlanetaryCenterID,
		tacticalID: tacticalObj.id,
		order: "land",
		};
			
	var request = $.ajax({
		url: "/api/tacticalOrder",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",
			
		success: (function (data) {
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			})
		});
	}

$TacticalMap.orderSetOrbit = function (tacticalObj, newOrbit)
	{
	if (tacticalObj == null || tacticalObj.kind != "tactical")
		return;

	//	Order a change in orbit

	var params = {
        authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: $Map.objPlanetaryCenterID,
		tacticalID: tacticalObj.id,
		order: "orbit",
		orbit: newOrbit,
		};
			
	var request = $.ajax({
		url: "/api/tacticalOrder",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",
			
		success: (function (data) {
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			})
		});
	}

$TacticalMap.orderSetTarget = function (tacticalObj, newTarget)
	{
	if (tacticalObj == null || tacticalObj.kind != "tactical")
		return;

	//	Order a change in orbit

	var params = {
        authToken: $UserInfo.authToken, 
		gameID: $Anacreon.gameID,
		sovereignID: $Anacreon.userInfo.sovereignID,
		objID: $Map.objPlanetaryCenterID,
		tacticalID: tacticalObj.id,
		order: "target",
		targetID: (newTarget ? newTarget.id : null),
		};
			
	var request = $.ajax({
		url: "/api/tacticalOrder",
		type: "POST",
		data: JSON.stringify(params),
		contentType: "application/json",
		dataType: "json",
			
		success: (function (data) {
			}),

		error: (function (jqXHR, textStatus, errorThrown) {
			})
		});
	}

$TacticalMap.reset = function ()
	{
	$Map.tacticalObjects = [];
	$Map.tacticalFrame = 0;
	$Map.nextTacticalObjects = null;
	$Map.eventsList = [];
	$Map.missilesList = [];

	if ($TacticalMap.groundGroupList)
		$TacticalMap.groundGroupList = null;

	if ($TacticalMap.orbitingGroupList)
		$TacticalMap.orbitingGroupList = null;

	$TacticalMap.uiMode = null;
	$TacticalMap.allowOrdersWhenNotInCombat = $Anacreon.debugMode;
	}

//	Control Tiles for Tactical Map ---------------------------------------------

function TacticalStatusTile (x, y, cxWidth, cyHeight)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxWidth;
	this.cyHeight = cyHeight;

	this.obj = $Map.objPlanetaryCenter;

	//	Figure out what our command is

	if (this.obj.battlePlan && this.obj.battlePlan.objective)
		{
		if (this.obj.battlePlan.sovereignID == $Anacreon.userInfo.sovereignID)
			this.command = "retreat";
		else
			this.command = null;
		}
	else if (this.obj.hasAttackers() && this.obj.getTargetsToAttack())
		this.command = "attack";
	else
		this.command = null;

	//	The lower-right has a button

	this.buttonImage = $("#idMediumButton136Yellow")[0];
	this.cxButton = 136;
	this.cyButton = 48;
	this.xButton = x + this.cxWidth - (this.cxButton + 8);
	this.yButton = y + this.cyHeight - (this.cyButton + 4);
	}

TacticalStatusTile.prototype.onDraw = function (ctx, x, y, isHovering)
	{
	ctx.fillStyle = $Style.tileNormalBackground;
	ctx.fillRect(x, y, this.cxWidth, this.cyHeight);

	//	Draw the status title

	var siege;
	var title;
	if (this.obj.battlePlan)
		{
		if (this.obj.battlePlan.objective == "invasion")
			title = "Invading " + this.obj.name;
		else if (this.obj.battlePlan.objective == "repelInvasion")
			title = "Defending " + this.obj.name;
		else if (this.obj.battlePlan.objective == "spaceSupremacy")
			title = "In Combat";
		else if (this.obj.battlePlan.objective == "retreat")
			title = "Retreating";
		else
			title = "Standing By";
		}
	else if (siege = this.obj.getSiege())
		{
		title = "Under Siege";
		}
	else
		title = "Standing By";

	var xText = this.xPos + 8;
	var yText = this.yPos + 2;
	ctx.fillStyle = $Style.dlgHighlightText;
	ctx.font = $Style.tileFontExtraLarge;
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText(title, xText, yText);
	yText += $Style.tileFontExtraLargeHeight + 4;

	//	Draw the battle plan status

	if (this.obj.battlePlan)
		{
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.font = $Style.tileFontMedium;

		$UI.drawText(ctx, xText, yText, this.cxWidth - 8, $Style.tileFontMediumHeight, this.obj.battlePlan.status);
		}
	else if (siege)
		{
		ctx.fillStyle = $Style.tileTextNormal;
		ctx.font = $Style.tileFontMedium;

		$UI.drawText(ctx, xText, yText, this.cxWidth - 8, $Style.tileFontMediumHeight, siege.getStatusText());
		}

	//	Draw the button

	if (this.command)
		{
		InfoPaneHelper.paintButton(ctx, 
				this.buttonImage, 
				(this.command == "attack" ? "Attack" : "Retreat"), 
				this.xButton, 
				this.yButton, 
				this.cxButton, 
				this.cyButton);
		}
	}

TacticalStatusTile.prototype.onMouseDown = function (e, xPos, yPos)
	{
	//	Did we click on the button?

	if (xPos >= this.xButton
			&& xPos < this.xButton + this.cxButton
			&& yPos >= this.yButton
			&& yPos < this.yButton + this.cyButton)
		{
		if (this.command == "attack")
			fleetAttackDialog($Map.objPlanetaryCenter);
		else
			fleetOrderRetreat($Map.objPlanetaryCenter);
		}
	}

TacticalStatusTile.prototype.onMouseExit = function (e)
	{
	theCanvas.css("cursor", "auto");
	}

TacticalStatusTile.prototype.onMouseMove = function (e, xPos, yPos)
	{
	if (xPos >= this.xButton
			&& xPos < this.xButton + this.cxButton
			&& yPos >= this.yButton
			&& yPos < this.yButton + this.cyButton)
		theCanvas.css("cursor", "pointer");
	else
		theCanvas.css("cursor", "auto");
	}

function TacticalHeaderTile (x, y, cxWidth, cyHeight, obj)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxWidth;
	this.cyHeight = cyHeight;

	this.obj = obj;
	this.isForeign = (obj.sovereignID != $Anacreon.userInfo.sovereignID);
	}

TacticalHeaderTile.prototype.onDraw = function (ctx, x, y, isHovering, isFaded)
	{
	ctx.fillStyle = (isFaded ? $Style.tileFadedBackground : (isHovering ? $Style.tileHoverBackground : $Style.tileNormalBackground));
	ctx.fillRect(x, y, this.cxWidth, this.cyHeight);

	ctx.font = $Style.tileFontMediumBold;
	ctx.fillStyle = (isFaded ? $Style.tileTextFaded : (this.isForeign ? $Style.mapEnemyUnit : $Style.mapFriendlyUnit));
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";
	ctx.fillText(this.obj.name, x + 8, y + (this.cyHeight - $Style.tileFontMediumHeight) / 2);
	}

TacticalHeaderTile.prototype.onMouseDown = function (e, xPos, yPos)
	{
	$Map.selectObject(this.obj);
	}

function TacticalGroupTile (x, y, cxWidth, cyHeight, tacticalObj)
	{
	this.xPos = x;
	this.yPos = y;
	this.cxWidth = cxWidth;
	this.cyHeight = cyHeight;

	this.tacticalObj = tacticalObj;
	this.obj = tacticalObj.getSpaceObject();
	this.isForeign = (this.obj.sovereignID != $Anacreon.userInfo.sovereignID);
	this.unitType = $Anacreon.designTypes[tacticalObj.unitTypeID];
	}
	
TacticalGroupTile.prototype.onDraw = function (ctx, x, y, isHovering, isFaded)
	{
	//	Paint the background

	ctx.fillStyle = (isFaded ? $Style.tileFadedBackground : (isHovering ? $Style.tileHoverBackground : $Style.tileNormalBackground));
	ctx.fillRect(x, y, this.cxWidth, this.cyHeight);

	var xPos = x + this.cxWidth / 2;
	var yPos = y + 2;

	//	Paint the image

	var cxImage = 48;
	var cyImage = 32;
	CanvasUtil.drawImage(ctx, x + (this.cxWidth - cxImage) / 2, yPos, cxImage, cyImage, this.unitType.imageSmall);
	yPos += cyImage;

	//	Paint the count

	ctx.font = $Style.tileFontMediumBold;
	ctx.fillStyle = (isFaded ? $Style.textFaded : (this.isForeign ? $Style.mapEnemyUnit : $Style.mapFriendlyUnit));
	ctx.textBaseline = "top";
	ctx.textAlign = "center";
	ctx.fillText(this.tacticalObj.unitCount, xPos, yPos);
	yPos += $Style.tileFontMediumHeight;

	//	Paint the unit name

	ctx.font = $Style.tileFontSmall;
	$UI.drawText(ctx, xPos, yPos, this.cxWidth - 4, $Style.tileFontSmallHeight, this.unitType.shortName);

	//	Draw selection, if selected

	if ($Map.objSelected
			&& $Map.objSelected.kind == "tactical" 
			&& $Map.objSelected.id == this.tacticalObj.id)
		{
		MapHelper.paintTacticalBoxSelection(ctx, x + 6, y + 6, x + this.cxWidth - 8, y + this.cyHeight - 8, this.isForeign);
		}
	}

TacticalGroupTile.prototype.onMouseDown = function (e, xPos, yPos)
	{
	$Map.selectObject(this.tacticalObj);
	}

//	CircularTactical object ----------------------------------------------------
//
//	FIELDS
//
//	class: "circular"
//	id: Tactical object ID
//	inSpace: True if object is in space (as opposed to on surface)
//	kind: "tactical"
//	objID: ID of object that we are part of
//	radius: radius of orbit
//	rotation: current rotation
//	sitePoints: array of
//		1.	angle
//		2.	count
//	sovereignID: ID of sovereign
//	speed: angular speed

function CircularTactical (serverObj)
	{
	$.extend(this, serverObj);
	
	var obj = this.getSpaceObject();
	var unitType = $Anacreon.designTypes[this.unitTypeID];

	this.name = obj.name + " " + unitType.nameDesc;
	this.kind = "tactical";
	this.unitType = unitType;
	}
	
CircularTactical.prototype.canBeRenamed = function ()
	{
	return false;
	}

CircularTactical.prototype.draw = function (ctx, mapMetrics, frame, isSelected)
	{
	var isEnemy = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	
	ctx.fillStyle = (isEnemy ? $Style.mapEnemyUnit : $Style.mapFriendlyUnit);
	
	var pixelsPerUnit = mapMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
	var xViewCenter = $Map.canvasCenterX;
	var yViewCenter = $Map.canvasCenterY;

	//	Draw all sites
	
	var radius = this.radius;
	var rotation = this.rotation + (frame * this.speed);
	for (var i = 0; i < this.sitePoints.length; i += 2)
		{
		var angle = rotation + this.sitePoints[i];
		var x = radius * Math.cos(angle);
		var y = radius * Math.sin(angle);
		
		var xPos = xViewCenter + pixelsPerUnit * (x - xMapCenter);
		var yPos = yViewCenter - pixelsPerUnit * (y - yMapCenter);
		
		var Size = this.sitePoints[i + 1];
		if (Size instanceof Array)
			Size = Size[frame];
		
		if (Size > 0)
			{
			ctx.fillRect(xPos - 1, yPos - 1, 2, 2);
			
			//	If selected, mark in some way
		
			if (isSelected)
				MapHelper.paintTacticalSelection(ctx, xPos, yPos, isEnemy);
			}
		}
		
	//	Done
	
	ctx.restore();
	}

CircularTactical.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	}

CircularTactical.prototype.drawGalacticMapSelection = function (ctx)
	{
	var obj = this.getSpaceObject();

	if (obj != null)
		MapHelper.paintGalacticMapSelection(ctx, obj.mapPosX, obj.mapPosY, null);
	}
	
CircularTactical.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	}

CircularTactical.prototype.getInfoPanes = function () 
	{
	var i;
	var paneList = [];
	var obj = this.getSpaceObject();
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	
	paneList.push({
		tabLabel: "Ground Force",
	
		paneDesc: {
			cxStdTile: 240,
			cyStdTile: 42,
			
			onGetTileList: (function (canvasGrid, data)
			
			//	data:
			//
			//		obj: The selected object.
			
				{
				var i;
				var tileList = [];
				var tacticalObj = data.obj;
				
				//	Add a large tile to show unit stats
				
				tileList.push({
					cyTile: 160,
					data: tacticalObj,
					onPaint: InfoPaneHelper.paintUnitStats
					});
					
				//	Add a large tile for close up
				
				tileList.push({
					cyTile: 160,
					data: tacticalObj,
					onPaint: InfoPaneHelper.paintTacticalCloseUp
					});
					
				//	Cargo
				
				if (tacticalObj.cargo)
					InfoPaneHelper.createResourceTiles(tileList, tacticalObj.cargo);
				
				return tileList;
				}),
			},
			
		getCommandList: (function (tacticalObj)
			{
			var commandList = [];
			var obj = tacticalObj.getSpaceObject();
			var isForeign = (tacticalObj.sovereignID != $Anacreon.userInfo.sovereignID);
			
			//	Attack target

			if (!isForeign
					&& (obj.battlePlan || $TacticalMap.allowOrdersWhenNotInCombat)
					&& $TacticalMap.uiMode == null)
				{
				commandList.push({
					label: "Target",
					data: { tacticalObj: tacticalObj },
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = "selectTarget";
						$Map.refreshSelectionView();
						})
					});
				}

			//	Cancel modes

			if ($TacticalMap.uiMode == "selectTarget")
				{
				commandList.push({
					label: "Cancel",
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			if ($TacticalMap.uiMode == "selectTarget"
					&& tacticalObj.mission == "order.destroyTarget")
				{
				commandList.push({
					label: "Disengage",
					onCommand: (function (e)
						{
						$TacticalMap.orderSetTarget(tacticalObj, null);

						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			return commandList;
			}),
		});
		
	//	Done
	
	return paneList;
	}
	
CircularTactical.prototype.getSpaceObject = function ()
	{
	return $Anacreon.objList[this.objID];
	}

CircularTactical.prototype.getSpaceObjectID = function ()
	{
	return this.objID;
	}

CircularTactical.prototype.isValidTarget = function (tacticalObj)
	{
	return (tacticalObj
			&& tacticalObj.sovereignID != $Anacreon.userInfo.sovereignID
			&& tacticalObj["class"] == "squadron"
			&& tacticalObj.inSpace);
	}

CircularTactical.prototype.refreshSelection = function ()
	{
	return $Map.tacticalObjects[this.id];
	}

//	GroundTactical object ------------------------------------------------------
//
//	FIELDS
//
//	class: "ground"
//	id: Tactical object ID
//	objID: ID of object that we are part of
//	sovereignID: ID of sovereign

function GroundTactical (serverObj)
	{
	$.extend(this, serverObj);
	
	var obj = this.getSpaceObject();
	var unitType = $Anacreon.designTypes[this.unitTypeID];

	this.name = obj.name + " " + unitType.nameDesc;
	this.kind = "tactical";
	this.unitType = unitType;
	}
	
GroundTactical.prototype.canBeRenamed = function ()
	{
	return false;
	}

GroundTactical.prototype.draw = function (ctx, mapMetrics, frame, isSelected)
	{
	}

GroundTactical.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	}

GroundTactical.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	}

GroundTactical.prototype.drawGalacticMapSelection = function (ctx)
	{
	var obj = this.getSpaceObject();

	if (obj != null)
		MapHelper.paintGalacticMapSelection(ctx, obj.mapPosX, obj.mapPosY, null);
	}
	
GroundTactical.prototype.getInfoPanes = function () 
	{
	var i;
	var paneList = [];
	var obj = this.getSpaceObject();
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	
	paneList.push({
		tabLabel: "Ground Force",
	
		paneDesc: {
			cxStdTile: 240,
			cyStdTile: 42,
			
			onGetTileList: (function (canvasGrid, data)
			
			//	data:
			//
			//		obj: The selected object.
			
				{
				var i;
				var tileList = [];
				var tacticalObj = data.obj;
				
				//	Add a large tile to show unit stats
				
				tileList.push({
					cyTile: 160,
					data: tacticalObj,
					onPaint: InfoPaneHelper.paintUnitStats
					});
					
				//	Add a large tile for close up
				
				tileList.push({
					cyTile: 160,
					data: tacticalObj,
					onPaint: InfoPaneHelper.paintTacticalCloseUp
					});
					
				//	Cargo
				
				if (tacticalObj.cargo)
					InfoPaneHelper.createResourceTiles(tileList, tacticalObj.cargo);
				
				return tileList;
				}),
			},
			
		getCommandList: (function (tacticalObj)
			{
			var commandList = [];
			var obj = tacticalObj.getSpaceObject();
			var isForeign = (tacticalObj.sovereignID != $Anacreon.userInfo.sovereignID);
			
			//	Attack target

			if (!isForeign
					&& (obj.battlePlan || $TacticalMap.allowOrdersWhenNotInCombat)
					&& $TacticalMap.uiMode == null)
				{
				commandList.push({
					label: "Target",
					data: { tacticalObj: tacticalObj },
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = "selectTarget";
						$Map.refreshSelectionView();
						})
					});
				}

			//	Cancel modes

			if ($TacticalMap.uiMode == "selectTarget")
				{
				commandList.push({
					label: "Cancel",
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			if ($TacticalMap.uiMode == "selectTarget"
					&& tacticalObj.mission == "order.destroyTarget")
				{
				commandList.push({
					label: "Disengage",
					onCommand: (function (e)
						{
						$TacticalMap.orderSetTarget(tacticalObj, null);

						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			return commandList;
			}),
		});
		
	//	Done
	
	return paneList;
	}
	
GroundTactical.prototype.getSpaceObject = function ()
	{
	if (this.objClass == "siege")
		return $Anacreon.siegeList[this.objID];
	else
		return $Anacreon.objList[this.objID];
	}

GroundTactical.prototype.getSpaceObjectID = function ()
	{
	return this.objID;
	}

GroundTactical.prototype.isValidTarget = function (tacticalObj)
	{
	return (tacticalObj
			&& tacticalObj.sovereignID != $Anacreon.userInfo.sovereignID
			&& tacticalObj["class"] == "ground");
	}

GroundTactical.prototype.refreshSelection = function ()
	{
	return $Map.tacticalObjects[this.id];
	}

//	PlanetTactical object ------------------------------------------------------
//
//	FIELDS
//
//	class: "planet"
//	id: Tactical object ID
//	objID: ID of object that we are part of
//	sovereignID: ID of sovereign

function PlanetTactical (serverObj)
	{
	$.extend(this, serverObj);
	
	var obj = this.getSpaceObject();
	
	this.name = obj.name;
	this.kind = "tactical";
	}
	
PlanetTactical.prototype.canBeRenamed = function ()
	{
	return false;
	}

PlanetTactical.prototype.draw = function (ctx, mapMetrics, frame, isSelected)
	{
	var obj = this.getSpaceObject();
	var worldClass = $Anacreon.designTypes[obj.worldClass];
	var radius = mapMetrics.pixelsPerUnit * this.radius;

	//	Compute position

	if (this.pos == null)
		return;

	var x = $Map.canvasCenterX + mapMetrics.pixelsPerUnit * (this.pos[0] - $Map.viewportX);
	var y = $Map.canvasCenterY - mapMetrics.pixelsPerUnit * (this.pos[1] - $Map.viewportY);

	//	Paint
	
	if (worldClass != null && worldClass.imageLarge != null)
		{
		var imageType = $Anacreon.designTypes[worldClass.imageLarge[0]];
		var orbitPos = obj.orbit[1];

		ctx.save();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.clip();

		ctx.drawImage(imageType.imageElement,
				worldClass.imageLarge[1],
				worldClass.imageLarge[2],
				worldClass.imageLarge[3],
				worldClass.imageLarge[4],
				x - radius,
				y - radius,
				2 * radius,
				2 * radius);

		//	Light side

		var xLight = -radius * Math.cos(orbitPos);
		var yLight = radius * Math.sin(orbitPos);
		var light = ctx.createLinearGradient(x, y, x + xLight, y + yLight);
		light.addColorStop(0, "rgba(0, 0, 0, 0.0)");
		light.addColorStop(1, "rgba(255, 255, 255, 0.4)");
		ctx.globalCompositeOperation="lighter";
		ctx.fillStyle = light;
		ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
		ctx.globalCompositeOperation="source-over";

		//	Terminator and dark side

		var terminatorWidth = radius / 5;
		var xTerm = -terminatorWidth * Math.cos(orbitPos);
		var yTerm = terminatorWidth * Math.sin(orbitPos);
		var shadow = ctx.createLinearGradient(x, y, x + xTerm, y + yTerm);
		shadow.addColorStop(0, "rgba(0, 0, 0, 0.9)");
		shadow.addColorStop(1, "rgba(0, 0, 0, 0.0)");
		ctx.fillStyle = shadow;
		ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);

		ctx.restore();
		}
	else
		{
		ctx.beginPath();
		ctx.fillStyle = "#D9D9FF";
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.fill();
		}
	}

PlanetTactical.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	}

PlanetTactical.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	}

PlanetTactical.prototype.drawGalacticMapSelection = function (ctx)
	{
	var obj = this.getSpaceObject();

	if (obj != null)
		MapHelper.paintGalacticMapSelection(ctx, obj.mapPosX, obj.mapPosY, null);
	}
	
PlanetTactical.prototype.getInfoPanes = function () 
	{
	return [
		];
	}

PlanetTactical.prototype.getSpaceObject = function ()
	{
	return $Anacreon.objList[this.objID];
	}

PlanetTactical.prototype.getSpaceObjectID = function ()
	{
	return this.objID;
	}

PlanetTactical.prototype.refreshSelection = function ()
	{
	return $Map.tacticalObjects[this.id];
	}

//	SquadronTactical object ----------------------------------------------------
//
//	FIELDS
//
//	cargo: Cargo on group
//	class: "squadron"
//	id: Tactical object ID
//	inSpace: True if squadron is on in space (as opposed to on surface)
//	objID: ID of object that we are part of
//	pos: Position of group
//	shapeCellSize: Size of each cell (megameters)
//	shapeConfig: One of:
//		"line3"
//		"sphere"
//	shapePoints: An array of cell data represented as triplets:
//		0.	X coord of cell (in cell coordinates)
//		1.	Y coord of cell (in cell coordinates)
//		2.	Cell count (either a single value or an array representing count
//			history).
//	shapeRotation: An array of rotation history.
//	sovereignID: ID of sovereign
//	status: Current status
//	unitCount: Number of units
//	unitType: Design type of units
//	unitTypeID: ID of design type
//
//	ADDITIONAL DATA
//
//	trail: An array of position pairs.
//	trailFrame: Trail up to date as of the given frame.

function SquadronTactical (serverObj)
	{
	$.extend(this, serverObj);
	
	var obj = this.getSpaceObject();
	var unitType = $Anacreon.designTypes[this.unitTypeID];
	
	this.name = obj.name + " " + unitType.nameDesc;
	this.kind = "tactical";
	this.unitType = unitType;

	this.trail = [];
	this.trailFrame = -1;
	}

SquadronTactical.prototype.canBeRenamed = function ()
	{
	return false;
	}

SquadronTactical.prototype.draw = function (ctx, mapMetrics, frame, isSelected)
	{
	var i;
	var isEnemy = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	//	Don't draw if we've landed
	
	if (!this.inSpace)
		return;

	//	Cache some values

	var pixelsPerUnit = mapMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
	var xViewCenter = $Map.canvasCenterX;
	var yViewCenter = $Map.canvasCenterY;
		
	var x;
	var y;

	//	Compute position info for the object (note that sometimes we don't
	//	have a position because the object has not yet been created this 
	//	frame).
			
	var pos = (this.pos != null && this.pos.length > 2 ? this.pos[frame] : this.pos);
	if (pos == null)
		return;

	x = xViewCenter + pixelsPerUnit * (pos[0] - xMapCenter);
	y = yViewCenter - pixelsPerUnit * (pos[1] - yMapCenter);

	//	Maneuvering trails

	if (mapMetrics.showManeuveringTrails)
		{
		//	Draw the trail, if we have it

		var xFrom = x;
		var yFrom = y;

		ctx.strokeStyle = "#a0a0a0";
		ctx.lineWidth = 1;
		var trailAlpha = 1.0;
		var discontinuityLimit = 1.2 * pixelsPerUnit;

		for (i = 0; i < this.trail.length; i += 2)
			{
			var xTo = xViewCenter + pixelsPerUnit * (this.trail[i] - xMapCenter);
			var yTo = yViewCenter - pixelsPerUnit * (this.trail[i + 1] - yMapCenter);

			if (Math.abs(xTo - xFrom) < discontinuityLimit
					&& Math.abs(yTo - yFrom) < discontinuityLimit)
				{
				ctx.beginPath();
				ctx.moveTo(xFrom, yFrom);
				ctx.lineTo(xTo, yTo);
				ctx.globalAlpha = trailAlpha;
				ctx.stroke();
				}

			//	Next

			xFrom = xTo;
			yFrom = yTo;
			trailAlpha = trailAlpha * 0.9;
			}

		ctx.globalAlpha = 1.0;

		//	Add to trail

		if (this.trailFrame != frame)
			{
			if ((frame % 10) == 0)
				{
				var newLen = this.trail.unshift(pos[0], pos[1]);

				if (newLen >= 60)
					{
					this.trail.pop();
					this.trail.pop();
					}
				}

			this.trailFrame = frame;
			}
		}

	//	If this unit is selected, draw its orbit
	
	if (isSelected && this.orbitRadius)
		{
		var radius = mapMetrics.pixelsPerUnit * this.orbitRadius;
		var center = $Map.getViewPos(0, 0);
		
		ctx.beginPath();
		ctx.strokeStyle = "#404040";
		ctx.lineWidth = 1;
		ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI, false);
		ctx.stroke();
		}

	//	Transform so that the center is at 0,0 and we rotate along the shape
	//	direction.
	
	ctx.save();
	ctx.translate(x, y);
	if (this.shapeRotation instanceof Array)
		ctx.rotate(-this.shapeRotation[frame]);
	else
		ctx.rotate(-this.shapeRotation);
	
	ctx.fillStyle = (isEnemy ? $Style.mapEnemyUnit : $Style.mapFriendlyUnit);
	
	var separation = this.shapeCellSize;
	var yAdj = separation * mapMetrics.pixelsPerUnit;
	var xAdj = yAdj * Math.cos(Math.PI / 6.0);
	var yAdjHalf = yAdj / 2.0;
	
	//	Draw all points

	var xLeft = 0;
	var xRight = 0;
	var yTop = 0;
	var yBottom = 0;
		
	for (i = 0; i < this.shapePoints.length; i += 3)
		{
		var xPos = this.shapePoints[i];
		var yPos = this.shapePoints[i + 1];
		
		if ((xPos % 2) != 0)
			{
			xPos = xAdj * xPos;
			yPos = (yAdj * yPos) - yAdjHalf;
			}
		else
			{
			xPos = xAdj * xPos;
			yPos = yAdj * yPos;
			}

		//	Compute the size (number of ship) for a cell

		var Size = this.shapePoints[i + 2];
		if (Size instanceof Array)
			Size = Size[frame];
		
		if (Size > 0)
			ctx.fillRect(xPos, yPos, 2, 2);

		//	Compute bounds

		if (xPos < xLeft)
			xLeft = xPos;
		else if (xPos > xRight)
			xRight = xPos;

		if (yPos < yTop)
			yTop = yPos;
		else if (yPos > yBottom)
			yBottom = yPos;
		}

	//	If selected, draw a selection

	if (isSelected)
		{
		MapHelper.paintTacticalBoxSelection(ctx, xLeft, yTop, xRight, yBottom, isEnemy);
		}
		
	//	Done
	
	ctx.restore();
	}

SquadronTactical.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	}

SquadronTactical.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	}

SquadronTactical.prototype.drawGalacticMapSelection = function (ctx)
	{
	var obj = this.getSpaceObject();

	if (obj != null)
		MapHelper.paintGalacticMapSelection(ctx, obj.mapPosX, obj.mapPosY, null);
	}
	
SquadronTactical.prototype.getInfoPanes = function () 
	{
	var i;
	var paneList = [];
	var obj = this.getSpaceObject();
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	
	paneList.push({
		tabLabel: "Group",
	
		paneDesc: {
			cxStdTile: 240,
			cyStdTile: 42,
			
			onGetTileList: (function (canvasGrid, data)
			
			//	data:
			//
			//		obj: The selected object.
			
				{
				var i;
				var tileList = [];
				var tacticalObj = data.obj;
				
				//	Add a large tile to show unit stats
				
				tileList.push({
					cyTile: 160,
					data: tacticalObj,
					onPaint: InfoPaneHelper.paintUnitStats
					});
					
				//	Add a large tile for close up
				
				tileList.push({
					cyTile: 160,
					data: tacticalObj,
					onPaint: InfoPaneHelper.paintTacticalCloseUp
					});
					
				//	Cargo
				
				if (tacticalObj.cargo)
					InfoPaneHelper.createResourceTiles(tileList, tacticalObj.cargo);
				
				return tileList;
				}),
			},
			
		getCommandList: (function (tacticalObj)
			{
			var commandList = [];
			var obj = tacticalObj.getSpaceObject();
			var isForeign = (tacticalObj.sovereignID != $Anacreon.userInfo.sovereignID);

			//	Attack target

			if (!isForeign
					&& (obj.battlePlan || $TacticalMap.allowOrdersWhenNotInCombat)
					&& tacticalObj.inSpace
					&& $TacticalMap.uiMode == null)
				{
				commandList.push({
					label: "Target",
					data: { tacticalObj: tacticalObj },
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = "selectTarget";
						$Map.refreshSelectionView();
						})
					});
				}

			//	Orbit

			if (!isForeign
					&& (obj.battlePlan || $TacticalMap.allowOrdersWhenNotInCombat)
					&& tacticalObj.inSpace
					&& $TacticalMap.uiMode == null)
				{
				commandList.push({
					label: "Orbit",
					data: { tacticalObj: tacticalObj },
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = "selectOrbit";
						$TacticalMap.selectOrbitRadius = null;
						$Map.refreshSelectionView();
						})
					});
				}

			//	Landing

			if (!isForeign
					&& tacticalObj.unitType.canLand
					&& (obj.battlePlan || $TacticalMap.allowOrdersWhenNotInCombat)
					&& tacticalObj.inSpace
					&& $TacticalMap.uiMode == null)
				{
				commandList.push({
					label: "Land",
					data: { tacticalObj: tacticalObj },
					onCommand: (function (e)
						{
						$TacticalMap.orderLand(tacticalObj);

						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			//	Cancel modes

			if ($TacticalMap.uiMode == "selectOrbit"
					|| $TacticalMap.uiMode == "selectTarget")
				{
				commandList.push({
					label: "Cancel",
					onCommand: (function (e)
						{
						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			if ($TacticalMap.uiMode == "selectTarget"
					&& tacticalObj.mission == "order.destroyTarget")
				{
				commandList.push({
					label: "Disengage",
					onCommand: (function (e)
						{
						$TacticalMap.orderSetTarget(tacticalObj, null);

						$TacticalMap.uiMode = null;
						$Map.refreshSelectionView();
						})
					});
				}

			return commandList;
			}),
		});
		
	//	Done
	
	return paneList;
	}
	
SquadronTactical.prototype.getSpaceObject = function ()
	{
	if (this.objClass == "siege")
		return $Anacreon.siegeList[this.objID];
	else
		return $Anacreon.objList[this.objID];
	}

SquadronTactical.prototype.getSpaceObjectID = function ()
	{
	return this.objID;
	}

SquadronTactical.prototype.isValidTarget = function (tacticalObj)
	{
	return (tacticalObj
			&& tacticalObj.sovereignID != $Anacreon.userInfo.sovereignID
			&& ((tacticalObj["class"] == "squadron" && tacticalObj.inSpace)
				|| (tacticalObj["class"] == "circular")));
	}

SquadronTactical.prototype.refreshSelection = function ()
	{
	return $Map.tacticalObjects[this.id];
	}

