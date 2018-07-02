//	fleetobj.js
//
//	Implements FleetObject class
//	Copyright (c) 2014 Kronosaur Productions, LLC. All Rights Reserved.
//
//  FIELDS
//
//  id: The numeric ID of the object.
//
//	class: "fleet"
//  ftlType: One of:
//      explorer: Explorer jumpfleet, does not require jump beacons
//      jump: Jumpfleet, requires jump beacons
//      ramjet: Ramjet fleet, only travel in nebula
//      warp: Warp fleet, cannot enter nebulae

var $Fleet = {
	jumpBeaconCutout: null,
	};

function FleetObject (serverObj)
	{
	$.extend(this, serverObj);
	
	this.kind = "spaceObject";

	var forces = this.getForceComposition();
	if (forces.spaceForceType)
		{
		this.icon = forces.spaceForceType.imageSmall;
		}
	}

FleetObject.prototype.calcDistanceTo = function (obj)
	{
	var xDist = this.pos[0] - obj.pos[0];
	var yDist = this.pos[1] - obj.pos[1];
	return Math.sqrt(xDist * xDist + yDist * yDist);
	}

FleetObject.prototype.canBeAttackedByLAMs = function ()
	{
	var i;

	if (this.canBeAttackedByLAMsFlag == null)
		{
		//	If this is an enemy fleet then we look for any of our LAM sites

		if (this.sovereignID != $Anacreon.userInfo.sovereignID)
			{
			var LAMSites = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].getLAMSites();
			for (i = 0; i < LAMSites.length; i++)
				{
				var obj = LAMSites[i];

				//	If we're in range, and the site has LAMs then this fleet 
				//	can be attacked.

				if (obj.hasLAMs() && this.calcDistanceTo(obj) < obj.getLAMRange())
					{
					this.canBeAttackedByLAMsFlag = true;
					return true;
					}
				}

			//	Otherwise, out of range

			this.canBeAttackedByLAMsFlag = false;
			}

		//	LATER: For friendly fleets we want to see if the fleet is in
		//	range of any known enemy LAM sites. For now, we don't deal with
		//	it.

		else
			this.canBeAttackedByLAMsFlag = false;
		}

	return this.canBeAttackedByLAMsFlag;
	}

FleetObject.prototype.canBeRenamed = function ()
	{
	return (this.sovereignID == $Anacreon.userInfo.sovereignID);
	}

FleetObject.prototype.canTravelTo = function (destObj)
	{
	return (destObj["class"] == "world");
	}

FleetObject.prototype.drawIcon = function (ctx, x, y, iconSize, isFriendly)
	{
	//	Color based on friendly vs. enemy

	if (isFriendly)
		ctx.fillStyle = $Style.mapFriendlyFleet;
	else
		ctx.fillStyle = $Style.mapEnemyUnit;

	//	If the size is big enough, then paint an image

	if ($Map.showFleetIcons && isFriendly && $Map.maxWorldRadius >= 7 && this.icon)
		{
		var iconWidth = 4.5 * $Map.maxWorldRadius;
		var iconHeight = 3 * $Map.maxWorldRadius;

		ctx.shadowBlur = 15;
		ctx.shadowColor = "#000000";

		CanvasUtil.drawImage(ctx, x - (iconWidth / 2), y - (iconHeight / 2), iconWidth, iconHeight, this.icon);

		ctx.shadowBlur = 0;
		}

	//	Different icons depending on slow vs. fast fleet
	//	ftlSpeed can be null if we don't have full information on the fleet
	//	(e.g., we don't know its composition.)

	else if (this.ftlType == "warp")
		{
		var width = 3 * iconSize;
		var height = 2 * iconSize;
		var fins = iconSize / 2;
		var halfWidth = width / 2;
		var halfHeight = height / 2;
		var bodyHeight = height - 2 * fins;
		var halfBodyHeight = bodyHeight / 2;

		ctx.beginPath();

		if (isFriendly)
			{
			ctx.moveTo(x - halfWidth, y - halfBodyHeight);
			ctx.lineTo(x + halfWidth - fins, y - halfBodyHeight);
			ctx.lineTo(x + halfWidth - fins, y - halfHeight);
			ctx.lineTo(x + halfWidth, y - halfHeight);
			ctx.lineTo(x + halfWidth, y + halfHeight);
			ctx.lineTo(x + halfWidth - fins, y + halfHeight);
			ctx.lineTo(x + halfWidth - fins, y + halfBodyHeight);
			ctx.lineTo(x - halfWidth, y + halfBodyHeight);
			}
		else
			{
			ctx.moveTo(x + halfWidth, y - halfBodyHeight);
			ctx.lineTo(x - halfWidth + fins, y - halfBodyHeight);
			ctx.lineTo(x - halfWidth + fins, y - halfHeight);
			ctx.lineTo(x - halfWidth, y - halfHeight);
			ctx.lineTo(x - halfWidth, y + halfHeight);
			ctx.lineTo(x - halfWidth + fins, y + halfHeight);
			ctx.lineTo(x - halfWidth + fins, y + halfBodyHeight);
			ctx.lineTo(x + halfWidth, y + halfBodyHeight);
			}

		ctx.closePath();
		ctx.fill();
		}
	else if (this.ftlType == "ramjet")
		{
		var width = 3 * iconSize;
		var height = 2 * iconSize;
		var bulgeHeight = iconSize / 2;
		var bulgeWidth = iconSize;
		var halfWidth = width / 2;
		var halfHeight = height / 2;
		var bodyHeight = height - 2 * bulgeHeight;
		var halfBodyHeight = bodyHeight / 2;

		ctx.beginPath();

		if (isFriendly)
			{
			ctx.moveTo(x - halfWidth, y - halfBodyHeight);
			ctx.lineTo(x - halfWidth + bulgeWidth, y - halfHeight);
			ctx.lineTo(x + halfWidth, y - halfBodyHeight);
			ctx.lineTo(x + halfWidth, y + halfBodyHeight);
			ctx.lineTo(x - halfWidth + bulgeWidth, y + halfHeight);
			ctx.lineTo(x - halfWidth, y + halfBodyHeight);
			}
		else
			{
			ctx.moveTo(x + halfWidth, y - halfBodyHeight);
			ctx.lineTo(x + halfWidth - bulgeWidth, y - halfHeight);
			ctx.lineTo(x - halfWidth, y - halfBodyHeight);
			ctx.lineTo(x - halfWidth, y + halfBodyHeight);
			ctx.lineTo(x + halfWidth - bulgeWidth, y + halfHeight);
			ctx.lineTo(x + halfWidth, y + halfBodyHeight);
			}

		ctx.closePath();
		ctx.fill();
		}
	else
		{
		ctx.beginPath();

		if (isFriendly)
			{
			ctx.moveTo(x - iconSize, y);
			ctx.lineTo(x + iconSize, y - iconSize);
			ctx.lineTo(x + iconSize, y + iconSize);
			}
		else
			{
			ctx.moveTo(x + iconSize, y);
			ctx.lineTo(x - iconSize, y - iconSize);
			ctx.lineTo(x - iconSize, y + iconSize);
			}

		ctx.closePath();
		ctx.fill();
		}
	}

FleetObject.prototype.drawGalacticMap = function (ctx, mapMetrics, x, y, pixelsPerUnit, isSelected, uiMode)
	{
	var i;

	var isFriendly = (this.sovereignID == $Anacreon.userInfo.sovereignID);

	//	Figure out some settings based on the uiMode.

	var drawFleet;
	switch (uiMode)
		{
		case UI_MODE_LAM_TARGET:
			drawFleet = (!isFriendly && $Map.objSelected.canAttackWithLAMs(this));
			break;

		default:
			drawFleet = (uiMode == null || isSelected);
		}

	//	Draw

	if (drawFleet)
		{
		var ftlSpeed = this.getFTLSpeed();

		//	If we're selected, draw the fleet path

		if (isSelected && this.dest)
			{
			var pathStyle = (isFriendly ? $Style.mapFriendlyPath : $Style.mapEnemyPath);

			var anchorObj = (this.anchorObjID ? $Anacreon.objList[this.anchorObjID] : null);
			var posXY = (anchorObj ? $GalacticMap.toMapXY(mapMetrics, anchorObj.pos[0], anchorObj.pos[1]) : { x:x, y:y });
			var destXY = $GalacticMap.toMapXY(mapMetrics, this.dest[0], this.dest[1]);

			//	If we have a path, draw it.

			var timeLeft = this.eta - $Anacreon.update;
			if (this.path)
				{
				var totalPathLength = 0;
				var lastPosXY = posXY;
				var waypointLength = [];
				var waypointXY = [];

				//	Paint the line

				ctx.beginPath();
				ctx.moveTo(posXY.x, posXY.y);

				for (i = 0; i < this.path.length; i += 2)
					{
					var pointXY = $GalacticMap.toMapXY(mapMetrics, this.path[i], this.path[i + 1]);
					ctx.lineTo(pointXY.x, pointXY.y);

					//	Compute path length at each waypoint

					totalPathLength += Math.sqrt(Math.pow(lastPosXY.x - pointXY.x, 2) + Math.pow(lastPosXY.y - pointXY.y, 2));
					waypointXY[i] = pointXY;
					waypointLength[i] = totalPathLength;
					lastPosXY = pointXY;
					}

				ctx.lineTo(destXY.x, destXY.y);
				ctx.strokeStyle = pathStyle;
				ctx.lineWidth = $Map.pathWidth;
				ctx.stroke();

				totalPathLength += Math.sqrt(Math.pow(lastPosXY.x - destXY.x, 2) + Math.pow(lastPosXY.y - destXY.y, 2));

				//	Figure out the mid point, in case we need to paint an ETA box

				var midPathLength = totalPathLength / 2;
				var midPathXY = null;
				var midSegmentStartXY = null;
				var midSegmentEndXY = null;
				var midSegmentOffset = 0;

				//	Paint all the waypoints on top

				var radius = $Map.pathWidth * 1.35;
				ctx.fillStyle = pathStyle;

				for (i = 0; i < this.path.length; i += 2)
					{
					ctx.beginPath();
					ctx.arc(waypointXY[i].x, waypointXY[i].y, radius, 0, 2 * Math.PI, false);
					ctx.fill();

					if (midSegmentStartXY == null && waypointLength[i] >= midPathLength)
						{
						var prevLength = (i == 0 ? 0 : waypointLength[i - 2]);
						var prevXY = (i == 0 ? posXY : waypointXY[i - 2]);
						var midSegmentLength = waypointLength[i] - prevLength;

						midSegmentStartXY = (i == 0 ? posXY : waypointXY[i - 2]);
						midSegmentEndXY = waypointXY[i];
						midSegmentOffset = (midPathLength - prevLength) / midSegmentLength;
						}
					}

				if (midSegmentStartXY == null)
					{
					midSegmentStartXY = waypointXY[i - 2];
					midSegmentEndXY = destXY;
					midSegmentOffset = (midPathLength - waypointLength[i - 2]) / (totalPathLength - waypointLength[i - 2]);
					}

				//	Paint the ETA box, if necessary

				if (timeLeft > 10)
					{
					var xETA = midSegmentStartXY.x + midSegmentOffset * (midSegmentEndXY.x - midSegmentStartXY.x);
					var yETA = midSegmentStartXY.y + midSegmentOffset * (midSegmentEndXY.y - midSegmentStartXY.y);

					ctx.strokeStyle = pathStyle;
					ctx.fillStyle = pathStyle;
					MapHelper.paintTimeLeftBox(ctx, xETA, yETA, timeLeft);
					}
				}

			//	Otherwise we just paint a straight line

			else
				{
				//	Paint the path as a line

				ctx.beginPath();
				ctx.moveTo(posXY.x, posXY.y);
				ctx.lineTo(destXY.x, destXY.y);

				ctx.strokeStyle = pathStyle;
				ctx.lineWidth = $Map.pathWidth;
				ctx.stroke();

				//	Paint the ETA, if more than one watch

				if (timeLeft > 1)
					{
					var xETA = posXY.x + (destXY.x - posXY.x) / 2;
					var yETA = posXY.y + (destXY.y - posXY.y) / 2;

					ctx.strokeStyle = pathStyle;
					ctx.fillStyle = pathStyle;
					MapHelper.paintTimeLeftBox(ctx, xETA, yETA, timeLeft);
					}
				}
			}

		//	If we're in dest selection mode then draw the current selection

		if (uiMode == UI_MODE_FLEET_DESTINATION)
			{
			if ($Map.newFleetDest)
				{
				var anchorObj = (this.anchorObjID ? $Anacreon.objList[this.anchorObjID] : null);
				var posXY = (anchorObj ? $GalacticMap.toMapXY(mapMetrics, anchorObj.pos[0], anchorObj.pos[1]) : { x:x, y:y });
				var destXY = $GalacticMap.toMapXY(mapMetrics, $Map.newFleetDest.pos[0], $Map.newFleetDest.pos[1]);

				//	Compute the time to destination (in watches)

				var now = new Date();
				var fracLeft = Math.max(0, ($Anacreon.nextWatchTime.getTime() - now.getTime()) / 60000.0);
				var distLY = this.calcDistanceTo($Map.newFleetDest);
				var timeToDest = (ftlSpeed > 0 ? Math.ceil((distLY / ftlSpeed) + (1 - fracLeft)) : 0);

				//	Paint path

				ctx.beginPath();
				ctx.moveTo(posXY.x, posXY.y);
				ctx.lineTo(destXY.x, destXY.y);

				ctx.strokeStyle = $Style.mapActionPath;
				ctx.lineWidth = $Map.pathWidth;
				ctx.stroke();

				//	Paint

				var xETA = posXY.x + (destXY.x - posXY.x) / 2;
				var yETA = posXY.y + (destXY.y - posXY.y) / 2;

				ctx.fillStyle = $Style.mapActionPath;
				MapHelper.paintTimeLeftBox(ctx, xETA, yETA, timeToDest);
				}
			}

		//	Draw the fleet icon

		var iconSize = Math.max(3, $Map.maxWorldRadius * this.getSizeAdj());
		this.drawIcon(ctx, x, y, iconSize, isFriendly);
		}
	}

FleetObject.prototype.drawJumpBeconRange = function (ctx, mapMetrics, color)
	{
	var i;
	var Beacons = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].getJumpBeacons();
	if (Beacons.length > 0)
		{
		ctx.beginPath();

		for (i = 0; i < Beacons.length; i++)
			{
			var obj = Beacons[i];
			var range = mapMetrics.pixelsPerUnit * obj.getJumpBeaconRange();

			ctx.moveTo(obj.mapPosX, obj.mapPosY);
			ctx.arc(obj.mapPosX, obj.mapPosY, range, 0, 2 * Math.PI, false);
			}

		ctx.fillStyle = color;
		ctx.fill();
		}
	}

FleetObject.prototype.drawJumpBeconCutOut = function (ctx, mapMetrics, color)
	{
	var i;
	var Beacons = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].getJumpBeacons();
	if (Beacons.length > 0)
		{
		//	Create an off-screen canvas the size of the screen and cache it.

		if ($Fleet.jumpBeaconCutout == null
				|| $Fleet.jumpBeaconCutoutWidth != $Map.canvasWidth
				|| $Fleet.jumpBeaconCutoutHeight != $Map.canvasHeight)
			{
			$Fleet.jumpBeaconCutout = $("<canvas width='" + $Map.canvasWidth + "' height='" + $Map.canvasHeight + "'>")[0];
			$Fleet.jumpBeaconCutoutWidth = $Map.canvasWidth;
			$Fleet.jumpBeaconCutoutHeight = $Map.canvasHeight;
			}

		var offscreenCtx = $Fleet.jumpBeaconCutout.getContext("2d");
		offscreenCtx.clearRect(0, 0, $Map.canvasWidth, $Map.canvasHeight);
		offscreenCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
		offscreenCtx.fillRect(0, 0, $Map.canvasWidth, $Map.canvasHeight);

		//	Define a path for the area covered by all beacons

		offscreenCtx.beginPath();

		for (i = 0; i < Beacons.length; i++)
			{
			var obj = Beacons[i];
			var range = mapMetrics.pixelsPerUnit * obj.getJumpBeaconRange();

			offscreenCtx.moveTo(obj.mapPosX, obj.mapPosY);
			offscreenCtx.arc(obj.mapPosX, obj.mapPosY, range, 0, 2 * Math.PI, false);
			}

		//	Clip to this path

		offscreenCtx.save();
		offscreenCtx.clip();

		//	Erase

		offscreenCtx.clearRect(0, 0, $Map.canvasWidth, $Map.canvasHeight);
		offscreenCtx.restore();

		//	Draw

		ctx.drawImage($Fleet.jumpBeaconCutout, 0, 0);
		}
	}

FleetObject.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	/*

	//	If this is an enemy fleet, then paint range circles for all LAM sites

	if (uiMode == null 
			&& this.sovereignID != $Anacreon.userInfo.sovereignID)
		{
		var LAMSites = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID].getLAMSites();
		for (i = 0; i < LAMSites.length; i++)
			{
			var obj = LAMSites[i];
			var range = mapMetrics.pixelsPerUnit * obj.getLAMRange();

			ctx.beginPath();
			ctx.arc(obj.mapPosX, obj.mapPosY, range, 0, 2 * Math.PI, false);
			ctx.fillStyle = $Style.mapFriendlyLAMRange;
			ctx.fill();
			}
		}
	*/
	}

FleetObject.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	var i;

	switch (uiMode)
		{
		//	If we're setting the destination for one of our jumpfleets, then draw
		//	the range of all jump beacons.

		case UI_MODE_FLEET_DESTINATION:
			{
			if (this.ftlType == "jump")
				this.drawJumpBeconCutOut(ctx, mapMetrics, $Style.mapJumpBeaconRange);
			break;
			}

		default:
			{
			//	If we're in normal mode and a jumpfleet is selected, show the
			//	jump beacon range (but in a lighter color).

			if (uiMode == null
					&& this.sovereignID == $Anacreon.userInfo.sovereignID
					&& this.ftlType == "jump")
				this.drawJumpBeconCutOut(ctx, mapMetrics, $Style.mapJumpBeaconRange);
			break;
			}
		}
	}

FleetObject.prototype.drawGalacticMapSelection = function (ctx)
	{
	MapHelper.paintGalacticMapSelection(ctx, this.mapPosX, this.mapPosY, null);
	}

FleetObject.prototype.drawHistoryPane = function (ctx, mapMetrics, x, y, pixelsPerUnit, isSelected, isFaded, isHovering)
	{
	MapHelper.paintGalacticMapSidePane(ctx,
			this,
			((this.history && this.history.length > 0) ? this.history[this.history.length - 1].text : ""),
			null,
			"Close",
			isHovering);
	}
	
FleetObject.prototype.drawPlanetaryMap = function (ctx, x, y, pixelsPerUnit)
	{
	var isFriendly = (this.sovereignID == $Anacreon.userInfo.sovereignID);

	//	Draw the fleet icon

	ctx.beginPath();
	if (isFriendly)
		ctx.fillStyle = $Style.mapFriendlyUnit;
	else
		ctx.fillStyle = $Style.mapEnemyUnit;

	if (isFriendly)
		{
		ctx.moveTo(x - 5, y);
		ctx.lineTo(x + 5, y - 5);
		ctx.lineTo(x + 5, y + 5);
		}
	else
		{
		ctx.moveTo(x + 5, y);
		ctx.lineTo(x - 5, y - 5);
		ctx.lineTo(x - 5, y + 5);
		}

	ctx.closePath();
	ctx.fill();
	}

FleetObject.prototype.getCargoSpace = function ()
	{
	var resources = this.resources;
	if (resources == null)
		return 0.0;

	var cargoSpace = 0.0;
	
	for (var i = 0; i < resources.length; i += 2)
		{
		var typeID = resources[i];
		var resType = $Anacreon.designTypes[typeID];
		var count = resources[i + 1];

		//	Compute cargo space available.

		if (resType.cargoSpace)
			cargoSpace += (resType.cargoSpace * count);
		else if (resType.isCargo)
			cargoSpace -= (resType.mass * count);
		}

	return cargoSpace;
	}

FleetObject.prototype.getDefaultSourceObj = function ()
	{
	var i;

	//	If we are at a friendly world, then that's our source

	var anchorObj = (this.anchorObjID ? $Anacreon.objList[this.anchorObjID] : null);
	if (anchorObj 
			&& anchorObj.sovereignID == this.sovereignID)
		return anchorObj;

	//	Otherwise, look for other fleets here.

	if (anchorObj && anchorObj.nearObjs)
		{
		for (i = 0; i < anchorObjs.nearObjs.length; i++)
			{
			var nearObj = $Anacreon.objList[anchorObj.nearObjs[i]];
			if (nearObj 
					&& nearObj.id != this.id
					&& nearObj.sovereignID == this.sovereignID)
				return nearObj;
			}
		}

	//	Otherwise, no source object

	return null;
	}
	
FleetObject.prototype.getForceComposition = function ()
	{
	if (this.composition == null)
		this.composition = SpaceObject.calcForceComposition(this.resources);

	return this.composition;
	}

FleetObject.prototype.getFTLSpeed = function ()
	{
	if (this.FTL == null)
		this.FTL = (this.resources != null ? SpaceObject.calcFTLSpeed(this.resources) : null);

	return this.FTL;
	}

FleetObject.prototype.getInfoPanes = function () 
	{
	return [
		{	tabLabel: "Overview",
			
			paneDesc: {
				cxStdTile: 856,
				cyStdTile: 44,
				
				onGetTileList: (function (canvasGrid, data)
					{
					var tileList = [];
					var obj = data.obj.getSpaceObject();

					tileList.push({
						cyTile: 160,
						data: { obj: obj },
						onPaint: InfoPaneHelper.paintFleetTile
						});

					return tileList;
					}),
				},
			
			getCommandList: (function (objSelected)
				{
				var commandList = [];
				var obj = objSelected.getSpaceObject();
				
				var atDest = (obj.dest == null);
				var inCombat = (obj.battlePlan != null);
				var isForeign = (obj.sovereignID != $Anacreon.userInfo.sovereignID);
				var anchorObj = $Anacreon.objList[obj.anchorObjID];
				var anchorIsForeign = (anchorObj != null && anchorObj.sovereignID != $Anacreon.userInfo.sovereignID);
				var anchorSovereign = (anchorObj != null ? $Anacreon.sovereignList[anchorObj.sovereignID] : null);
				
				//	Set destination

				if (!isForeign
						&& !inCombat
						&& $Map.uiMode == null)
					{
					commandList.push({
						label: "Destination",
						data: { obj: objSelected },
						onCommand: (function (e)
							{
							$Map.uiMode = UI_MODE_FLEET_DESTINATION;
							$Map.newFleetDest = null;
							$Map.refreshSelectionView();
							})
						});
					}

				//	Transfer

				var sourceList;
				if (!isForeign
						&& !inCombat
						&& atDest
						&& anchorObj != null
						&& (sourceList = obj.getSourceObjList())
						&& sourceList.length > 0
						&& $Map.uiMode == null)
					commandList.push({
						label: "Transfer",
						data: { 
							sourceList: sourceList,
							destObj: obj
							},
						onCommand: (function (e)
							{
							if (e.data.sourceList.length == 1)
								fleetDeployDialog(e.data.sourceList[0], e.data.destObj);
							else
								fleetTransferSourceDialog(e.data.destObj, e.data.sourceList);
							})
						});
				
				//	Deploy
				
				if (!isForeign 
						&& !inCombat
						&& atDest
						&& anchorObj != null
						&& $Map.uiMode == null)
					commandList.push({
						label: "Deploy",
						data: { obj: objSelected },
						onCommand: (function (e)
							{
							var obj = e.data.obj.getSpaceObject();
							fleetDeployDialog(obj, { resources: [] } );
							})
						});
				/*
				//	Attack with LAMs

				if (isForeign
						&& $Map.uiMode == null
						&& obj.canBeAttackedByLAMs())
					{
					commandList.push({
						label: "Attack",
						data: { obj: objSelected },
						onCommand: (function (e)
							{
							var obj = e.data.obj.getSpaceObject();
							fleetAttackWithLAMs(obj);
							})
						});
					}
				*/

				//	Sell

				if (!isForeign
						&& !inCombat
						&& atDest
						&& anchorObj != null
						&& anchorObj.isTradingHub()
						&& anchorSovereign.hasBureauOfTrade()
						&& $Map.uiMode == null)
					commandList.push({
						label: "Sell",
						data: { obj:objSelected, buyerObj:anchorObj },
						onCommand: (function (e)
							{
							var obj = e.data.obj.getSpaceObject();
							var buyerObj = e.data.buyerObj;
							fleetSellDialog(obj, buyerObj);
							})
						});
					
				//	Cancel

				if (!isForeign
						&& $Map.uiMode != null)
					{
					commandList.push({
						label: "Cancel",
						data: { obj: objSelected },
						onCommand: (function (e)
							{
							$Map.uiMode = null;
							$Map.refreshSelectionView();
							})
						});
					}

				return commandList;
				}),
			}
		];
	}

FleetObject.prototype.getSizeAdj = function ()
	{
	if (this.mapSizeAdj == null)
		{
		//	Size of fleet depends on its composition

		var comp = this.getForceComposition();
		var minAdj = 0.2;
		var maxForces = (this.getFTLSpeed() > 5.0 ? 250000 : 2500000);

		if (comp.spaceForces >= maxForces)
			this.mapSizeAdj = 1.0;
		else
			this.mapSizeAdj = Math.max(minAdj, Math.sqrt(comp.spaceForces/maxForces));
		}

	return this.mapSizeAdj;
	}
	
FleetObject.prototype.getSourceObjList = function ()
	{
	var i;
	var list = [];

	//	If we are at a friendly world, then that's the first source

	var anchorObj = (this.anchorObjID ? $Anacreon.objList[this.anchorObjID] : null);
	if (anchorObj 
			&& anchorObj.sovereignID == this.sovereignID)
		list.push(anchorObj);

	//	Now look for other fleets here.

	if (anchorObj && anchorObj.nearObjIDs)
		{
		for (i = 0; i < anchorObj.nearObjIDs.length; i++)
			{
			var nearObj = $Anacreon.objList[anchorObj.nearObjIDs[i]];
			if (nearObj 
					&& nearObj.id != this.id
					&& nearObj.sovereignID == this.sovereignID)
				list.push(nearObj);
			}
		}

	//	Return the list

	return list;
	}
	
FleetObject.prototype.getSpaceBackgroundImage = function ()
	{
	var region = (this.region ? $Anacreon.regionList[this.region] : null);
	var regionType = (region ? $Anacreon.designTypes[region.type] : null);
	return (regionType ? regionType.backgroundImageTactical : $Anacreon.defaultSpaceRegion.backgroundImageTactical);
	}
	
FleetObject.prototype.getSpaceObject = function ()
	{
	return this;
	}

FleetObject.prototype.getSpaceObjectID = function ()
	{
	return this.id;
	}

FleetObject.prototype.refreshSelection = function ()
	{
	return $Anacreon.objList[this.id];
	}
