//	galacticmap.js
//
//	Implements UI for galactic map
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

var $GalacticMap = {
	};

$GalacticMap.drawDebugNavGraph = function (mapMetrics, navGraph)
	{
	var i;

	ctx.strokeStyle = "#ffffff";
	for (i = 0; i < navGraph.length; i++)
		{
		var line = navGraph[i];
		var from = $GalacticMap.toMapXY(mapMetrics, line[0], line[1]);
		var to = $GalacticMap.toMapXY(mapMetrics, line[2], line[3]);

		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		ctx.stroke();
		}
	}

$GalacticMap.drawExploredRegion = function (mapMetrics, explorationGrid)
	{
	var i;

	if (explorationGrid)
		{
		if (explorationGrid.exploredOutline)
			{
			//	Generate a clipping path for the area that we've explored

			ctx.save();
			ctx.beginPath();

			for (i = 0; i < explorationGrid.exploredOutline.length; i++)
				{
				var j;
				var poly = explorationGrid.exploredOutline[i];

				var point = $GalacticMap.toMapXY(mapMetrics, poly[0], poly[1]);
				ctx.moveTo(point.x, point.y);

				for (j = 2; j < poly.length; j += 2)
					{
					point = $GalacticMap.toMapXY(mapMetrics, poly[j], poly[j + 1]);
					ctx.lineTo(point.x, point.y);
					}

				ctx.closePath();
				}

			ctx.clip();

			//	Figure out what image to use

			var imageDesc = null;
			if (mapMetrics.pixelsPerUnit < 4)
				imageDesc = $Anacreon.defaultSpaceRegion.backgroundImageLowDetail;

			if (imageDesc == null)
				imageDesc = $Anacreon.defaultSpaceRegion.backgroundImage;

			//	If we've got an image, then we paint it

			if (imageDesc)
				{
				var scale = Math.pow(2, 0.1 * ((Math.log(mapMetrics.pixelsPerUnit) / Math.log(2)) - 2));
				$Map.drawBackground(ctx, imageDesc, scale, $Map.viewportX, $Map.viewportY);
				}

			//	Otherwise we fill with a solid color

			else
				{
				ctx.fillStyle = $Anacreon.color($Anacreon.defaultSpaceRegion.backgroundColor);
				ctx.fillRect(0, 0, $Map.canvasWidth, $Map.canvasHeight);
				}

			//	Done

			ctx.restore();
			}
		}
	}
	
$GalacticMap.drawImportLines = function (drawDesc, obj, objSelected, highlightSelected, lineSelected)
	{
	var i;
	var inMap = obj.inMap;
	
	var xDest = obj.mapPosX;
	var yDest = obj.mapPosY;

	for (i = 0; i < obj.tradeRoutes.length; i++)
		{
		var tradeRoute = obj.tradeRoutes[i];
		
		if (!tradeRoute["return"])
			{
			var sourceObj = $Anacreon.objList[tradeRoute.partnerObjID];
			if (sourceObj == null || (!sourceObj.inMap && !inMap))
				continue;

			var isSelected = (obj.id == objSelected || sourceObj.id == objSelected);
			var isFriendly = (obj.sovereignID == $Anacreon.userInfo.sovereignID) || (sourceObj.sovereignID == $Anacreon.userInfo.sovereignID);
			var showCenterPoint = (isFriendly && drawDesc.showArrows && $Map.uiMode == null);
			var defaultLineColor = (isFriendly ? (drawDesc.onlyIfSelected ? $Style.mapSelectedTradeLine : $Style.mapFriendlyTradeLine) : $Style.mapEnemyTradeLine);
			var tradeArrowColor = (drawDesc.onlyIfSelected ? $Style.mapSelectedTradeLineArrow : $Style.mapTradeLineArrow);

			//	If we're only drawing lines for a single object, then check here

			if (drawDesc.onlyIfSelected && !isSelected)
				continue;

			//	If we highlight selected, then set the style

			else if (highlightSelected)
				{
				if (obj.id == highlightSelected || sourceObj.id == highlightSelected)
					{
					ctx.strokeStyle = $Style.mapSelectedTradeLine;
					tradeArrowColor = $Style.mapSelectedTradeLineArrow;
					}
				else
					ctx.strokeStyle = defaultLineColor;
				}

			//	If a special line is selected, then highlight it

			else if (lineSelected)
				{
				if (obj.id == lineSelected.objID
						&& tradeRoute.partnerObjID == lineSelected.partnerObjID)
					{
					ctx.strokeStyle = $Style.mapSelectedTradeLine;
					tradeArrowColor = $Style.mapSelectedTradeLineArrow;
					}
				else
					ctx.strokeStyle = defaultLineColor;
				}
			else
				ctx.strokeStyle = defaultLineColor;

			//	Draw
		
			ctx.beginPath();
			ctx.moveTo(xDest, yDest);
			ctx.lineTo(sourceObj.mapPosX, sourceObj.mapPosY);
			ctx.stroke();

			if (drawDesc.showArrows
					&& (!drawDesc.showArrowsOnlyIfSelected || isSelected))
				{
				//	Color

				ctx.fillStyle = tradeArrowColor;

				//	Compute the direction from our object to the partner

				var xToPartner = sourceObj.mapPosX - xDest;
				var yToPartner = sourceObj.mapPosY - yDest;
				var angleToPartner = Math.atan2(yToPartner, xToPartner);

				//	Compute the center point

				var xLineCenter = xDest + (xToPartner / 2);
				var yLineCenter = yDest + (yToPartner / 2);

				//	If we import from the partner object, then draw an arrow

				if (tradeRoute.imports != null || tradeRoute.importTech != null)
					$GalacticMap.drawTradeArrow(xLineCenter, yLineCenter, angleToPartner + Math.PI);

				//	If we export to the partner object, then draw an arrow

				if (tradeRoute.exports != null || tradeRoute.exportTech != null)
					$GalacticMap.drawTradeArrow(xLineCenter, yLineCenter, angleToPartner);

				//	Draw an affordance at the center of the trade line

				if (showCenterPoint)
					{
					ctx.beginPath();
					ctx.arc(xLineCenter, yLineCenter, drawDesc.centerDotRadius, 0, 2 * Math.PI, false);
					ctx.fill();
					}
				}
			}
		}
	};

$GalacticMap.drawRegion = function (mapMetrics, region)
	{
	var i, j, k;

	var regionType = $Anacreon.designTypes[region.type];
	if (regionType == null)
		return;

	ctx.save();
	ctx.beginPath();

	//	Loop over all shapes in the region

	for (j = 0; j < region.shape.length; j++)
		{
		var outline = region.shape[j].outline;

		//	Create a path for the region

		var xy = $GalacticMap.toMapXY(mapMetrics, outline[0], outline[1]);
		ctx.moveTo(xy.x, xy.y);

		for (i = 2; i < outline.length; i += 2)
			{
			xy = $GalacticMap.toMapXY(mapMetrics, outline[i], outline[i + 1]);
			ctx.lineTo(xy.x, xy.y);
			}

		ctx.closePath();

		//	Add any holes as new paths

		var holes = region.shape[j].holes;
		if (holes)
			{
			for (k = 0; k < holes.length; k++)
				{
				var holeOutline = holes[k];

				xy = $GalacticMap.toMapXY(mapMetrics, holeOutline[0], holeOutline[1]);
				ctx.moveTo(xy.x, xy.y);

				for (i = 2; i < holeOutline.length; i += 2)
					{
					xy = $GalacticMap.toMapXY(mapMetrics, holeOutline[i], holeOutline[i + 1]);
					ctx.lineTo(xy.x, xy.y);
					}

				ctx.closePath();
				}
			}
		}

	//	Clip to the path and fill

	ctx.clip();

	//	If the region uses an image, then draw the image through the clipping 
	//	region.

	var imageDesc = regionType.backgroundImage;
	var imageType = (imageDesc ? $Anacreon.designTypes[imageDesc[0]] : null);
	if (imageDesc)
		{
		}

	//	Otherwise, fill with a color

	else
		{
		ctx.fillStyle = $Anacreon.color(regionType.backgroundColor);
		ctx.fill();
		}

	//	Done

	ctx.restore();
	};

$GalacticMap.drawSovereignName = function (mapMetrics, sovereign, options)
	{
	var capital = (sovereign.capitalID ? $Anacreon.objList[sovereign.capitalID] : null);
	if (capital == null)
		return;

	if (options == null)
		options = { };
		
	//	Compute the size of the name based on the size of the sovereign

	var start = 6;
	var scale = 5;
	var fontSize = Math.floor(Math.min(Math.max(12, mapMetrics.pixelsPerUnit * (scale * (Math.log(sovereign.stats.population) - start))), 100));

	ctx.font = fontSize + "pt SansationBold, Verdana, sans-serif";
	ctx.fillStyle = $Style.tileTextHighlight;
	var cxText = ctx.measureText(sovereign.name).width;

	//	Position the text centered under the capital

	ctx.textAlign = "left";
	ctx.textBaseline = "top";

	var x = capital.mapPosX - (cxText / 2);
	var y = capital.mapPosY + 20;

	//	Adjust position to fit in map

	if (!options.clipToMap)
		{
		if (x < 0)
			x = 0;
		else if (x + cxText > $Map.canvasWidth)
			x = $Map.canvasWidth - cxText;
		}

	//	Draw

	ctx.globalAlpha = 0.35;
	ctx.fillText(sovereign.name, x, y);
	ctx.globalAlpha = 1.0;
	}
	
$GalacticMap.drawTerritory = function (mapMetrics, territory, style)

//	style: The style to draw the territory. One of the following:
//
//		friendlyBounds: Friendly empire boundary
//		friendlyAdmin: Friendly administrative boundary
//		enemyBounds: Enemy empire boundary
//		enemyBoundsHighlight: Enemy empire boundary
//		enemyBoundsFaded: Faded boundaries (when an empire is selected)

	{
	var i, j;

	if (style == "friendlyBounds")
		{
		ctx.strokeStyle = $Style.mapFriendlyTerritory;
		ctx.lineWidth = 2 * mapMetrics.adjWorldSize;
		}
	else if (style == "friendlyAdmin")
		{
		ctx.strokeStyle = $Style.mapFriendlyTerritory;
		ctx.lineWidth = mapMetrics.adjWorldSize;
		}
	else if (style == "enemyBounds")
		{
		ctx.strokeStyle = $Style.mapEnemyTerritory;
		ctx.lineWidth = 2 * mapMetrics.adjWorldSize;
		}
	else if (style == "enemyBoundsHighlight")
		{
		ctx.strokeStyle = $Style.mapEnemyTerritoryHighlight;
		ctx.lineWidth = 2 * mapMetrics.adjWorldSize;
		}
	else if (style == "enemyBoundsFaded")
		{
		ctx.strokeStyle = $Style.mapEnemyTerritory;
		ctx.lineWidth = 2 * mapMetrics.adjWorldSize;
		ctx.globalAlpha = 0.5;
		}
		
	for (i = 0; i < territory.length; i++)
		{
		//	Note: We still can't put all the arcs into a single outline
		//	because we can't tell when an outline group beings and ends.

		ctx.beginPath();

		var circle = territory[i];
		
		var center = $GalacticMap.toMapXY(mapMetrics, circle[0], circle[1]);
		var radius = $GalacticMap.toMapLength(mapMetrics, circle[2]);
		
		if (circle.length == 3)
			ctx.arc(center.x, center.y, radius, 0.0, 2 * Math.PI, true);
		else
			{
			var startAngle = (2 * Math.PI - circle[3]);
			var endAngle = (2 * Math.PI - circle[4]);
				
			ctx.arc(center.x, center.y, radius, startAngle, endAngle, true);
			}

		ctx.stroke();
		}

	ctx.globalAlpha = 1.0;
	}
	
$GalacticMap.drawTradeArrow = function (x, y, direction)
	{
	//var arrowHalfWidth = $Map.maxWorldRadius / 4;
	var arrowHalfWidth = Math.max(1, ($Map.maxWorldRadius / 3)) / 2.0;
	var arrowLength = arrowHalfWidth * 8;
	var arrowHeadHalfWidth = arrowHalfWidth * 3;
	var arrowHeadLength = arrowLength + arrowHeadHalfWidth * 2;

	//	Transform so that the center is at 0,0 and we rotate along the shape
	//	direction.
	
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(direction);

	//	Draw an arrow

	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, arrowHalfWidth);
	ctx.lineTo(arrowLength, arrowHalfWidth);
	ctx.lineTo(arrowLength, arrowHeadHalfWidth);
	ctx.lineTo(arrowHeadLength, 0);
	ctx.lineTo(arrowLength, -arrowHeadHalfWidth);
	ctx.lineTo(arrowLength, -arrowHalfWidth);
	ctx.lineTo(0, -arrowHalfWidth);
	ctx.closePath();
	ctx.fill();

	//	Done

	ctx.restore();
	}

$GalacticMap.findBattlePane = function (xPos, yPos)
	{
	var i;

	if ($GalacticMap.battlePanes == null)
		return null;

	for (i = 0; i < $GalacticMap.battlePanes.length; i++)
		{
		var obj = $GalacticMap.battlePanes[i];
		if (obj.hitTestBattlePane(xPos, yPos))
			return obj;
		}

	return null;
	}

$GalacticMap.hitTestPanes = function (xPos, yPos)
	{
	var i;
	var newHitTest = null;

	//	Hit test battle panes

	if ($GalacticMap.battlePanes != null)
		{
		for (i = 0; i < $GalacticMap.battlePanes.length; i++)
			{
			var obj = $GalacticMap.battlePanes[i];
			if (MapHelper.hitTestGalacticMapSidePane(xPos, yPos, obj))
				{
				newHitTest = {
					obj: obj,
					hoverType: "battlePane",
					};
				break;
				}
			}
		}

	//	If not found, hit test history panes

	if (newHitTest == null && $GalacticMap.historyPanes != null)
		{
		for (i = 0; i < $GalacticMap.historyPanes.length; i++)
			{
			var obj = $GalacticMap.historyPanes[i];
			if (MapHelper.hitTestGalacticMapSidePane(xPos, yPos, obj))
				{
				newHitTest = {
					obj: obj,
					hoverType: "historyPane",
					};
				break;
				}
			}
		}

	//	If this is the same as the current hover, then just return that

	if (newHitTest != null && $GalacticMap.hover != null
			&& $GalacticMap.hover.obj == newHitTest.obj
			&& $GalacticMap.hover.hoverType == newHitTest.hoverType)
		return $GalacticMap.hover;

	return newHitTest;
	}

$GalacticMap.onDraw = function (mapMetrics)
	{
	var i;
	
	var objList = $Map.objsInView;
	if (objList == null)
		return;

	var objSelectedID = (($Map.objSelected != null && $Map.uiMode != UI_MODE_SNAPSHOT) ? $Map.objSelected.getSpaceObjectID() : 0);
	var pixelsPerUnit = mapMetrics.pixelsPerUnit;
	var xMapCenter = $Map.viewportX;
	var yMapCenter = $Map.viewportY;
	var xViewCenter = $Map.canvasCenterX;
	var yViewCenter = $Map.canvasCenterY;

	//	Options

	var setDestination = ($Map.uiMode == UI_MODE_FLEET_DESTINATION);
	var snapshot = ($Map.uiMode == UI_MODE_SNAPSHOT);
	
	//	Paint grid

	//	Draw the explored regions of the galaxy

	$GalacticMap.drawExploredRegion(mapMetrics, $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].explorationGrid);

	//	Draw the space regions (e.g., nebulae)

	for (i in $Anacreon.regionList)
		$GalacticMap.drawRegion(mapMetrics, $Anacreon.regionList[i]);

	//	Give the selected object a chance to paint some background stuff

	if ($Map.objSelected)
		$Map.objSelected.drawGalacticMapBackground(ctx, mapMetrics, $Map.uiMode);

	//	Paint sovereign territory
	
	var highlightEmpireID = (($Map.objSelected != null 
			&& $Map.objSelected.isWorld 
			&& $Map.objSelected.sovereignID != $Anacreon.userInfo.sovereignID
			&& $Map.objSelected.sovereignID != $Anacreon.independentID) ? $Map.objSelected.sovereignID : null);
	for (i in $Anacreon.sovereignList)
		{
		var sovereign = $Anacreon.sovereignList[i];
		if (sovereign)
			{
			//	Paint administrative boundary

			if (sovereign.adminRange)
				$GalacticMap.drawTerritory(mapMetrics, sovereign.adminRange, "friendlyAdmin");

			//	Paint empire boundary

			var style;
			if (sovereign.id == $Anacreon.userInfo.sovereignID)
				style = "friendlyBounds";
			else if (highlightEmpireID)
				{
				if (highlightEmpireID == sovereign.id)
					style = "enemyBoundsHighlight";
				else
					style = "enemyBoundsFaded";
				}
			else
				style = "enemyBounds";

			if (sovereign.territory)
				$GalacticMap.drawTerritory(mapMetrics, sovereign.territory, style);
			}
		}

	//	Paint sovereign names

	if (snapshot || mapMetrics.pixelsPerUnit <= 1.0)
		{
		var options = { clipToMap:!snapshot };

		for (i = 0; i < $Anacreon.sovereignList.length; i++)
			{
			var sovereign = $Anacreon.sovereignList[i];
			if (sovereign)
				{
				if (sovereign.territory)
					$GalacticMap.drawSovereignName(mapMetrics, sovereign, options);
				}
			}
		}

	//	Paint trade lines
	
	var total = objList.length;
	var highlightSelected = (($Map.uiMode == null && $Map.objSelected && $Map.objSelected.sovereignID == $Anacreon.userInfo.sovereignID) ? objSelectedID : null);
	var lineSelected = ($Map.objSelected && $Map.objSelected.kind == "tradeRoute" ? { objID: $Map.objSelected.obj.id, partnerObjID: $Map.objSelected.partnerObj.id } : null);

	var routeDrawDesc = {
		centerDotRadius: $Map.maxWorldRadius / 2,
		lineWidth: (snapshot ? Math.max(1, ($Map.maxWorldRadius / 2)) : Math.max(1, ($Map.maxWorldRadius / 3))),
		onlyIfSelected: ($Map.uiMode == UI_MODE_TRADE_TARGET || $Map.uiMode == UI_MODE_EXPORT_TARGET || $Map.uiMode == UI_MODE_TRADE_TARGET_OUT_OF_RANGE),
		showArrows: (snapshot ? false : ($Map.maxWorldRadius > 4)),
		showArrowsOnlyIfSelected: ($Map.maxWorldRadius <= 6),
		showArrowsFaded: ($Map.maxWorldRadius <= 6),
		};

	ctx.fillStyle = $Style.mapTradeLineArrow;
	ctx.lineWidth = routeDrawDesc.lineWidth;
	ctx.lineCap = "butt";

	if (mapMetrics.pixelsPerUnit > 0.25)
		{
		for (i = 0; i < total; i++)
			{
			var obj = objList[i];
			if (obj.tradeRoutes != null)
				$GalacticMap.drawImportLines(routeDrawDesc, obj, objSelectedID, highlightSelected, lineSelected);
			}
		}

	//	Paint all objects
	
	var battlePanes = [];
	var historyPanes = [];
	var objSelected = null;
	for (i = 0; i < total; i++)
		{
		var obj = objList[i];
		var objIsSelected = (objSelectedID == obj.id);

        //  If we're not visible on the map, then skip

        if (!obj.inMap && !objIsSelected)
            continue;

		//	Draw
		
		obj.drawGalacticMap(ctx, mapMetrics, obj.mapPosX, obj.mapPosY, mapMetrics.pixelsPerUnit, objIsSelected, $Map.uiMode);

		//	If this object shows a battle pane, then remember it.

		if (obj.battlePlan 
				&& obj.battlePlan.sovereignID == $Anacreon.userInfo.sovereignID
				&& obj["class"] == "world")
			battlePanes.push(obj);
		else if (obj.history && obj.history.length > 0)
			historyPanes.push(obj);
		}

	//	Give the selected object a chance to paint some foreground stuff

	if ($Map.objSelected)
		$Map.objSelected.drawGalacticMapForeground(ctx, mapMetrics, $Map.uiMode);

	//	These are UI elements on top of the map

	if (!snapshot)
		{
		//	Debug nav graph

		if ($Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].debugNavGraph)
			$GalacticMap.drawDebugNavGraph(mapMetrics, $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].debugNavGraph);

		//	Draw all battle panes

		for (i = 0; i < battlePanes.length; i++)
			{
			var obj = battlePanes[i];
			var isHovering = ($GalacticMap.hover && $GalacticMap.hover.hoverType == "battlePane" && $GalacticMap.hover.obj.id == obj.id);
			obj.drawBattlePane(ctx, mapMetrics, obj.mapPosX, obj.mapPosY, mapMetrics.pixelsPerUnit, (objSelectedID == obj.id), false, isHovering);
			}

		//	Draw all history panes

		for (i = 0; i < historyPanes.length; i++)
			{
			var obj = historyPanes[i];
			var isHovering = ($GalacticMap.hover && $GalacticMap.hover.hoverType == "historyPane" && $GalacticMap.hover.obj.id == obj.id);
			obj.drawHistoryPane(ctx, mapMetrics, obj.mapPosX, obj.mapPosY, mapMetrics.pixelsPerUnit, (objSelectedID == obj.id), false, isHovering);
			}

		//	Remember panes so we can click on them

		$GalacticMap.historyPanes = historyPanes;
		$GalacticMap.battlePanes = battlePanes;
		
		//	Draw selection

		if ($Map.objSelected)
			$Map.objSelected.drawGalacticMapSelection(ctx);
	
		//	Draw debug info

		$Map.drawAIDebug(ctx);
		}
	
	//	Update pan/zoom animation
	
	if ($Map.updatePanZoomAnimation())
		$Map.initMapView($Map.curMetrics);
	}
	
$GalacticMap.onMouseDown = function (e)
	{
	//	Left-click selects the object
	
	if (e.which == 1)
		{
		var obj;
		var hitTest;

		//	See if we've clicked on a battle pane, which takes precedence
		//	over other objects.

		if ((hitTest = $GalacticMap.hitTestPanes(e.pageX, e.pageY)) != null)
			{
			if ($Map.uiMode != null)
				;
			else if (hitTest.hoverType == "battlePane")
				{
				$Map.selectObjectByID(hitTest.obj.id);
				$Map.cmdZoomToTactical();
				}
			else if (hitTest.hoverType == "historyPane")
				{
				//	Remove from object

				var oldEntry = hitTest.obj.history.pop();

				//	Mark read

				setHistoryRead(oldEntry.id);

				//	Refresh

				$Map.initMapView($Map.curMetrics);
				}
			}

		//	Find nearest object to the click position (within 10 pixels)
		
		else if ((obj = $Map.findObjInView(e.pageX, e.pageY)) != null)
			{
			switch ($Map.uiMode)
				{
				case UI_MODE_EXPORT_TARGET:
					if ($Map.objSelected.canExportTo(obj))
						{
						worldAddTradeRoute($Map.objSelected, obj);
						$Map.uiMode = null;
						}
					break;

				case UI_MODE_LAM_TARGET:
					if ($Map.objSelected.canAttackWithLAMs(obj))
						{
						worldLaunchLAMs($Map.objSelected, obj);
						$Map.uiMode = null;
						}
					break;

				case UI_MODE_TRADE_TARGET:
					if ($Map.objSelected.canImportFrom(obj))
						{
						worldAddTradeRoute($Map.objSelected, obj);
						$Map.uiMode = null;
						}
					break;

				case UI_MODE_FLEET_DESTINATION:
					if ($Map.objSelected.canTravelTo(obj))
						{
						fleetSetDestination($Map.objSelected, obj);
						$Map.uiMode = null;
						}
					break;

				case UI_MODE_LAM_TARGET_OUT_OF_RANGE:
				case UI_MODE_TRADE_TARGET_OUT_OF_RANGE:
					break;

				default:
					$Map.selectObject(obj);
			
					//	Pan to selected object
			
					if (e.ctrlKey)
						$Map.cmdPanTo(obj.pos[0], obj.pos[1]);
					break;
				}

			$GalacticMap.panningAnchor = null;
			}

		//	Otherwise, see if we've clicked on a trade route

		else if ((obj = $Map.findTradeRouteInView(e.pageX, e.pageY)) != null)
			{
			if ($Map.uiMode != null)
				;
			else
				{
				$Map.selectObject(obj);
				$GalacticMap.panningAnchor = null;
				}
			}

		//	Else we're trying to pan

		else
			{
			$GalacticMap.panningAnchor = {
				x: $Map.viewportX,
				y: $Map.viewportY
				};

			$GalacticMap.panningAnchorX = e.pageX;
			$GalacticMap.panningAnchorY = e.pageY;
			}
		}
	}

$GalacticMap.onMouseUp = function (e)
	{
	$GalacticMap.panningAnchor = null;
	}

$GalacticMap.onMove = function (e, mapMetrics)
	{
	var i;

	if ($GalacticMap.panningAnchor)
		{
		//	Offset from panning anchor

		var xOffset = e.pageX - $GalacticMap.panningAnchorX;
		var yOffset = e.pageY - $GalacticMap.panningAnchorY;

		//	Pan map

		$Map.desiredViewportX = $GalacticMap.panningAnchor.x - (xOffset / mapMetrics.pixelsPerUnit);
		$Map.desiredViewportY = $GalacticMap.panningAnchor.y + (yOffset / mapMetrics.pixelsPerUnit);
		$Map.initMapView($Map.curMetrics);
		}

	//	If we're setting a fleet destination

	else if ($Map.uiMode == UI_MODE_FLEET_DESTINATION)
		{
		var newFleetDest = $Map.findObjInView(e.pageX, e.pageY);
		if (newFleetDest != null && !$Map.objSelected.canTravelTo(newFleetDest))
			newFleetDest = null;

		if (newFleetDest != $Map.newFleetDest)
			{
			$Map.newFleetDest = newFleetDest;
			$Map.invalidate("mapOnly");
			}
		}

	//	See if we are hovering over a pane

	else
		{
		var newHover = $GalacticMap.hitTestPanes(e.pageX, e.pageY);

		if (newHover != $GalacticMap.hover)
			{
			$GalacticMap.hover = newHover;
			$Map.initMapView($Map.curMetrics);
			}
		}
	}

$GalacticMap.onSelectionChanged = function (newSel)
	{
	}

$GalacticMap.onUpdate = function ()
	{
	}

$GalacticMap.toGalacticXY = function (xMap, yMap)
	{
	var pixelsPerUnit = $Map.curMetrics.pixelsPerUnit;

	return {
		x: $Map.viewportX + ((xMap - $Map.canvasCenterX) / pixelsPerUnit),
		y: $Map.viewportY - ((yMap - $Map.canvasCenterY) / pixelsPerUnit)
		};
	}
	
$GalacticMap.toMapLength = function (mapMetrics, x)
	{
	return mapMetrics.pixelsPerUnit * x;
	}
	
$GalacticMap.toMapXY = function (mapMetrics, xGalactic, yGalactic)
	{
	var pixelsPerUnit = mapMetrics.pixelsPerUnit;

	return {
		x: $Map.canvasCenterX + pixelsPerUnit * (xGalactic - $Map.viewportX),
		y: $Map.canvasCenterY - pixelsPerUnit * (yGalactic - $Map.viewportY)
		};
	}
