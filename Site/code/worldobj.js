//	worldobj.js
//
//	Implements WorldObject class
//	Copyright (c) 2014 Kronosaur Productions, LLC. All Rights Reserved.
//
//	FIELDS
//
//	id: The numeric ID of the object.
//	name: The name of the object.
//	nearObjs: An array of object IDs of all objects near this one (i.e., all
//		objects that have this object as an anchor.)
//	pos: The position of the object. This is an array of two elements (x, y).
//	resources: The array of resources of the object. The resources are expressed
//		as pairs of elements. The first element is a resourceID; the second
//		is a count.
//	sequence: The last sequence when the object was updated.
//	sovereignID: The controlling sovereign.
//
//	baseConsumption: An array of triplets:
//		1.	resourceID being consumed
//		2.	optimal amount to consume each watch
//		3.	If non-null, actual amount consumed last watch
//	battlePlan: If not null, the battle plan.
//		enemySovereignIDs: List of sovereigns we are fighting
//		maxLosses: % of losses at which we retreat
//		objective: One of:
//			invasion
//			reinforceSiege
//			repelInvasion
//			retreat
//			spaceSupremacy
//		sovereignID: Sovereign who owns the plan
//		status: Current status
//	buildComplete: If not null this is the watch on which the world designation
//		will finish building.
//	buildTime: If not null this is the time to build the world designation
//	class: "world"
//	culture: The culture ID.
//	designation: The designation ID.
//	history: An array of history entries:
//		id: ID of of entry
//		text: Text.
//		fromID: If not null, this is the sender of this message
//	news: An array of structures:
//		text: News text.
//	population: The population of the world (in millions)
//	siegeObjID: If not null, this is the ID of the siege object on this world
//	techLevel: The tech level of the world (1-10)
//	tradeRouteMax: Max trade route distance (null = no spaceport)
//	tradeRoutes: An array of structures, as follows:
//		exports: An array with four elements:
//			1.	resourceID being exported
//			2.	% of demand to export
//			3.	optimal amount we want to export last watch
//			4.	If non-null then this is how much we actually exported
//		imports: An array with four elements:
//			1.	resourceID being imported
//			2.	% of demand to import
//			3.	amount we want to import
//			4.	If non-null then this is how much we actually imported.
//		exportTech: An array with two elements:
//			1.	Tech level to uplift to
//			2.	Tech levels used to uplif
//		importTech: An array with two elements:
//			1.	Tech level to uplift to
//			2.	Tech levels used to uplift
//			3.	Either null or:
//				"lack": No enough capacity at university world
//		partnerObjID: The object we're trading with
//		return: If true, this is the return path of another object's trade route
//	traits: An array of structures with the following fields:
//		traitID: The ID of the trait definition
//		buildComplete: If non-null this is the watch on which the trait will
//			finish building.
//
//		For traits with production:
//
//		allocation: The current allocation (in %)
//		buildData: An array representing units to build	(as triplets of elements):
//			1.	resourceID
//			2.	% allocation
//			3.	Either null or an array:
//				["improve" {traitID}]: Cannot build; need improvement {traitID}.
//				["res", {resID}]: Cannot build; must create/import {resID}.
//				["tech", {techLevel}]: Cannot build; world must be {techLevel}.
//		isFixed: If true, this is fixed industry
//		isPrimary: If true, this is primary industry
//		productionData: An array representing production/consumption. There are
//			three elements per item:
//			1.	resourceID
//			2.	optimal amount produced (+) or consumed (-) last watch
//			3.	if non-null then this is how much we actually produced
//		targetAllocation: The target allocation (in %)
//		techExportData: An array representing data about tech exports
//			1.	Total tech level capacity
//			2.	Tech levels exported
//		workUnits: The work units last watch
//		NOTE: traits exclude designation, world class, and culture
//	worldClass: The world class ID.
//
//	ADDITIONAL FIELDS
//
//	exportSet: A structure of resource types exported by this world
//	isCapital: True if this world is a capital. [Initialized in constructor]
//	mapImportance: Value from 0 to 3 indicating relative importance of world.
//		[Call getImportance.]
//	rebellion: Rebellion structure, with the following fields:
//		popularSupport: >0 = support for rebels; <0 = support for empire
//		rebelForces: Total rebel forces (best guess).
//		rebellionStart: Update on which rebellion started.
//		[Call getRebellion.]
//	rebellionChecked: If true, then rebellion is initialized.

function WorldObject (serverObj)
	{
	var i;

	$.extend(this, serverObj);

	this.kind = "spaceObject";
	this.isWorld = true;
	
	//	Some basic attributes
	
	this.isCapital = $Anacreon.designTypes[this.designation].role == "imperialCapital";

	//	Convert all trait IDs into structures

	var traits = [];
	for (i = 0; i < this.traits.length; i++)
        {
		if (typeof this.traits[i] == "number")
			traits[i] = { traitID: this.traits[i] };
		else
		    traits[i] = this.traits[i];

		//	Set some attributes while we're at it.

		if (this.buildComplete == null
				&& traits[i].buildComplete == null
				&& $Anacreon.designTypes[traits[i].traitID].isJumpBeacon)
			this.hasJumpBeacon = true;
        }

	this.traits = traits;
	}

WorldObject.prototype.addInfoPaneAbdicate = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	if (!isForeign 
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Abdicate",
			data: { obj: objSelected },
			onCommand: (function (e)
				{
				abdicateDialog();
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneAttack = function (objSelected, commandList)
	{
	if (this.hasAttackers() 
			&& this.getTargetsToAttack()
			&& this.battlePlan == null
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Attack",
			data: { obj: objSelected },
			onCommand: (function (e)
				{
				var obj = e.data.obj.getSpaceObject();
				fleetAttackDialog(obj);
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneBuild = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	if (!isForeign 
			&& this.getValidImprovementList().length > 0
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Build",
			data: { obj: objSelected },
			onCommand: (function (e)
				{
				var obj = e.data.obj.getSpaceObject();
				worldBuildImprovementDialog(obj);
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneBuy = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	var sovereign = $Anacreon.sovereignList[this.sovereignID];

	if (isForeign
			&& this.isTradingHub()
			&& this.hasAttackers()
			&& sovereign.hasBureauOfTrade()
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Buy",
			data: { obj: objSelected },
			onCommand: (function (e)
				{
				var obj = e.data.obj.getSpaceObject();
				worldBuyDialog(obj);
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneCancel = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

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
	}

WorldObject.prototype.addInfoPaneDeploy = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	if (!isForeign
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
	}

WorldObject.prototype.addInfoPaneDesignate = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	if (!isForeign 
			&& !this.isCapital
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Designate",
			data: { obj: objSelected },
			onCommand: (function (e)
				{
				var obj = e.data.obj.getSpaceObject();
				worldDesignateDialog(obj);
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneDoctrine = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	if (!isForeign
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Doctrine",
			onCommand: (function (e)
				{
				setDoctrineDialog($Anacreon.sovereignList[$Anacreon.userInfo.sovereignID]);
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneImport = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	if (!isForeign
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Import From",
			data: { obj: objSelected },
			onCommand: (function (e)
				{
				var obj = e.data.obj.getSpaceObject();
				if (obj.isInAdministrativeRange())
					$Map.uiMode = UI_MODE_TRADE_TARGET;
				else
					$Map.uiMode = UI_MODE_TRADE_TARGET_OUT_OF_RANGE;

				$Map.refreshSelectionView();
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneSendMessage = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	
	if (isForeign
			&& $Map.uiMode == null)
		{
		commandList.push({
			label: "Send Msg",
			data: { sovereignID: this.sovereignID },
			onCommand: (function (e)
				{
				sendMessageDialog(e.data.sovereignID);
				})
			});
		}
	}

WorldObject.prototype.addInfoPaneSpecial = function (objSelected, commandList)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	var sovereign = $Anacreon.sovereignList[this.sovereignID];

	//	This button is designation-specific. We only allow one of the
	//	following, which means in some cases we need alternate ways of
	//	exposing this.

	if (!isForeign && $Map.uiMode == null)
		{
		//	Export

		if (this.isTradingHub()
				&& sovereign.exportsResources())
			{
			commandList.push({
				label: "Sell To",
				data: { obj: objSelected },
				onCommand: (function (e)
					{
					var obj = e.data.obj.getSpaceObject();
					if (obj.isInAdministrativeRange())
						$Map.uiMode = UI_MODE_EXPORT_TARGET;
					else
						$Map.uiMode = UI_MODE_TRADE_TARGET_OUT_OF_RANGE;

					$Map.refreshSelectionView();
					})
				});
			}

		//	Launch LAMs

		else if (this.hasLAMs())
			{
			commandList.push({
				label: "Missiles",
				data: { obj: objSelected },
				onCommand: (function (e)
					{
					var obj = e.data.obj.getSpaceObject();
					if (obj.isInAdministrativeRange())
						$Map.uiMode = UI_MODE_LAM_TARGET;
					else
						$Map.uiMode = UI_MODE_LAM_TARGET_OUT_OF_RANGE;

					$Map.refreshSelectionView();
					})
				});
			}

		//	Import

		else
			this.addInfoPaneImport(objSelected, commandList);
		}
	}
	
WorldObject.prototype.calcDistanceTo = function (obj)
	{
	var xDist = this.pos[0] - obj.pos[0];
	var yDist = this.pos[1] - obj.pos[1];
	return Math.sqrt(xDist * xDist + yDist * yDist);
	}

WorldObject.prototype.calcExportSet = function (theResult)
	{
	var i;

	//	Initialize to the set of resources that we produce

	var industry = this.getPrimaryIndustry();
    if (industry && industry.buildData)
		{
		for (i = 0; i < industry.buildData.length; i += 3)
			{
			var resID = industry.buildData[i];
			var resType = $Anacreon.designTypes[resID];
			var alloc = industry.buildData[i + 1];
			var cannotBuild = industry.buildData[i + 2];

			//	If we can produce this resource, then add it to the set of 
			//	resources we can export.

			if (cannotBuild == null)
				theResult[resID] = true;
			}
		}

	//	If this is a trading hub, then ask our trading partners what they
	//	export and include them.

	var objDesignation = $Anacreon.designTypes[this.designation];
	if (this.isTradingHub()
			&& this.tradeRoutes != null
			&& !this.inCalcExportSet)
		{
		this.inCalcExportSet = true;

		for (i = 0; i < this.tradeRoutes.length; i++)
			{
			var tradeRoute = this.tradeRoutes[i];
			var partnerObj = $Anacreon.objList[tradeRoute.partnerObjID];
			partnerObj.calcExportSet(theResult);
			}

		this.inCalcExportSet = null;
		}
	}

WorldObject.prototype.calcExportStatus = function (obj)
	{
	//	We cannot export to non-worlds (but we don't need an error).

	if (obj == null 
			|| obj["class"] != "world")
		return { result: false };

	//	If this is our own status, then we have special code.

	if (obj.id == this.id)
		{
		//	If we're out of administrative range, then say so.

		if (!this.isInAdministrativeRange())
			return { result: false, reason: "Must be within 250 light-years of capital or sector capital" };

		//	See if there are any valid trading hubs around us that we can export to

		if (!this.hasExportTarget())
			return { result: false, reason: "No foreign trading hubs to sell resources to" };

		//	Otherwise, no message

		return { result: false };
		}

	//	If this is one of our worlds, then we can't export to it.

	if (this.sovereignID == obj.sovereignID)
		return { result: false };
		
	//	If the target is not a trading hub then we can't export to it.

	if (!obj.isTradingHub())
		return { result: false };

	//	If the sovereign will not buy from us, then we show an error.

	var objSovereign = $Anacreon.sovereignList[obj.sovereignID];
	if (!objSovereign.hasBureauOfTrade())
		return { result: false, reason: objSovereign.name + " will not buy resources from us" };

	//	Otherwise, we're OK

	return { result: true };
	}

WorldObject.prototype.calcImportStatus = function (obj)
	{
	//	We cannot import from non-worlds, but we don't need a reason.

	if (obj == null 
			|| obj["class"] != "world"
			|| this.sovereignID != obj.sovereignID)
		return { result: false };

	//	Check to see whether any object has a spaceport

	var importerHasSpaceport = (this.tradeRouteMax != null && this.tradeRouteMax > 0);

	//	If this is the importer's status, then we deal with it specially.

	if (obj.id == this.id)
		{
		//	If we're out of administrative range, then say so.

		if (!this.isInAdministrativeRange())
			return { result: false, reason: "Must be within 250 light-years of capital or sector capital" };

		//	If we don't yet have a spaceport, then say so.

		if (!importerHasSpaceport)
			return { result: false, reason: "Build spaceport to increase trading range" };

		//	Otherwise, no message

		return { result: false };
		}

	var exporterHasSpaceport = (obj.tradeRouteMax != null && obj.tradeRouteMax > 0);
	var tradeRouteMax = (this.tradeRouteMax ? this.tradeRouteMax : 0) + (obj.tradeRouteMax ? obj.tradeRouteMax : 0);

	//	Compute the distance between the two worlds.

	var dist = this.calcDistanceTo(obj);

	//	If we're more than 200 light-years away then we're never going to be
	//	able to trade, even with a spaceport.

	if (dist > 200)
		return { result: false };

	//	If neither world has a spaceport, then say so.

	if (!importerHasSpaceport && !exporterHasSpaceport)
		return { result: false, reason: "Build spaceport to trade" };

	//	If we're out of range...

	if (dist > tradeRouteMax)
		{
		//	If we don't have a spaceport, then say so

		if (!exporterHasSpaceport)
			return { result: false, reason: "Build spaceport to increase trading range" };

		//	Otherwise, its because the importer doesn't have a spaceport

		else
			return { result: false };
		}

	//	Otherwise, make sure we are in administrative range

	if (!obj.isInAdministrativeRange())
		return { result: false, reason: "Must be within 250 light-years of capital or sector capital" };

	//	Otherwise, we're OK.

	return { result: true };
	}

WorldObject.prototype.calcResourcesToSell = function (tradeRoute)
	{
	var i;

	var validResources = { };
	this.calcExportSet(validResources);

	//	Loop over all resources that we're already selling and 
	//	remove them.

	if (tradeRoute && tradeRoute.purchases)
		{
		for (i = 0; i < tradeRoute.purchases.length; i += 4)
			validResources[tradeRoute.purchases[i]] = null;
		}

	//	Generate an array of resource types

	var result = [ ];
	for (i in validResources)
		{
		var type = $Anacreon.designTypes[i];

		if (type != null 
				&& validResources[i]
				&& type["class"] == "resourceType"
				&& type.isCargo
				&& !type.isUnit
				&& !type.npeOnly)
			result.push(type);
		}

	//	Done

	if (result.length == 0)
		return null;
	else
		return result;
	}

WorldObject.prototype.canAttackWithLAMs = function (objTarget)
	{
	//	NOTE: We assume that this world has LAMs.
	//	NOTE: For now we can only attack fleets.
	return (objTarget["class"] == "fleet" && this.calcDistanceTo(objTarget) < this.getLAMRange());
	}

WorldObject.prototype.canBeAttacked = function ()
	{
	var i;

	if (this.sovereignID == $Anacreon.userInfo.sovereignID)
		return false;

	if (this.nearObjs)
		{
		for (i = 0; i < this.nearObjs.length; i++)
			if (this.nearObjs[i].sovereignID == $Anacreon.userInfo.sovereignID)
				return true;
		}

	return false;
	}

WorldObject.prototype.canBeDesignatedTo = function (type)
	{
	var i;

	if (this.techLevel < type.minTechLevel)
		return false;

	//	Check requirements

	if (type.requirements)
		{
		var allFound = true;
		for (i = 0; i < type.requirements.length; i++)
			{
			var req = this.getTrait(type.requirements[i], "includeWorldCharacteristics");
			if (!req || req.buildComplete != null)
				{
				allFound = false;
				break;
				}
			}

		if (!allFound)
			return false;
		}

	//	Check exclusions

	if (type.exclusions)
		{
		var anyFound = false;
		for (i = 0; i < type.exclusions.length; i++)
			{
			var req = this.getTrait(type.exclusions[i], "includeWorldCharacteristics");
			if (req)
				{
				anyFound = true;
				break;
				}
			}

		if (anyFound)
			return false;
		}

	//	OK

	return true;
	}

WorldObject.prototype.canBeRenamed = function ()
	{
	return (this.sovereignID == $Anacreon.userInfo.sovereignID);
	}

WorldObject.prototype.canExportTo = function (worldObj)
	{
	return this.calcExportStatus(worldObj).result;
	}

WorldObject.prototype.canImportFrom = function (worldObj)
	{
	return this.calcImportStatus(worldObj).result;
	}

WorldObject.prototype.drawBattlePane = function (ctx, mapMetrics, x, y, pixelsPerUnit, isSelected, isFaded, isHovering)
	{
	MapHelper.paintGalacticMapSidePane(ctx,
			this,
			(this.battlePlan ? this.battlePlan.status : ""),
			"zoomToTactical",
			"Zoom In",
			isHovering);
	}
	
WorldObject.prototype.drawGalacticMap = function (ctx, mapMetrics, x, y, pixelsPerUnit, isSelected, uiMode)
	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	var isIndependent = (this.sovereignID == $Anacreon.independentID);

	//	Figure out some settings based on the uiMode.

	var isDisabled;
	var statusMessage;

	switch (uiMode)
		{
		case UI_MODE_EXPORT_TARGET:
			{
			var result = $Map.objSelected.calcExportStatus(this);

			isDisabled = (!result.result && !isSelected);
			statusMessage = result.reason;
			break;
			}

		case UI_MODE_FLEET_DESTINATION:
			isDisabled = !$Map.objSelected.canTravelTo(this);
			break;

		case UI_MODE_LAM_TARGET:
			isDisabled = true;
			break;

		case UI_MODE_TRADE_TARGET:
			{
			var result = $Map.objSelected.calcImportStatus(this);

			isDisabled = (!result.result && !isSelected);
			statusMessage = result.reason;
			break;
			}

		case UI_MODE_LAM_TARGET_OUT_OF_RANGE:
		case UI_MODE_TRADE_TARGET_OUT_OF_RANGE:
			if ($Map.objSelected.id == this.id)
				{
				isDisabled = false;
				statusMessage = "Must be within 250 light-years of capital or sector capital";
				}
			else
				isDisabled = true;
			break;

		default:
			isDisabled = false;
		}

	//	Compute how big we want to show the world.
	
	var maxRadius = $Map.maxWorldRadius;

	//	The world itself has a certain size and everything else goes
	//	outside the area where the fleets go.
	
	var worldRadius = 1.5 * maxRadius * this.getSizeAdj();
	var outerRadius = worldRadius * 1.2;

	//	Compute the importance of the world (based on population, etc.)
	//
	//	There are 4 values:
	//
	//	0	Unimportant world
	//	1	Minor world
	//	2	Major world
	//	3	Key world (e.g., capital)
	
	var importance = this.getImportance();

	//	Figure out what to draw

	var newsIcon = this.getNewsStyle();
	var drawName = (!isDisabled || !isForeign)
			&& (maxRadius > 6
				|| (maxRadius > 5 && (importance > 1 || !isForeign))
				|| (maxRadius > 2 && (importance > 1 || newsIcon.style == "highlight"))
				|| isSelected
				|| this.isCapital);
	var drawDesignationIcons = drawName
			&& (maxRadius > 5)
			&& (uiMode == null || !isDisabled);
	var drawNameFaded = drawName && (maxRadius <= 6 && !isSelected && !isForeign && importance < 2);

	//	Compute some colors

	var worldStyle;
	var nameStyle;
	var designationStyle;

	if (isIndependent)
		{
		if (isDisabled)
			{
			worldStyle = $Style.mapDisabledWorldText;
			nameStyle = $Style.mapDisabledWorldText;
			}
		else
			{
			worldStyle = $Style.mapIndependentWorldText;
			nameStyle = $Style.mapIndependentWorldText;
			}

		designationStyle = $Style.mapIndependentWorldBox;
		}
	else if (isForeign)
		{
		if (isDisabled)
			{
			worldStyle = $Style.mapDisabledWorldText;
			nameStyle = $Style.mapDisabledWorldText;
			}
		else if (importance >= 2)
			{
			worldStyle = $Style.mapEnemyHighlight;
			nameStyle = $Style.mapEnemyHighlight;
			}
		else
			{
			worldStyle = $Style.mapEnemyWorld;
			nameStyle = $Style.mapEnemyWorld;
			}

		designationStyle = $Style.mapEnemyTerritory;
		}
	else if (importance >= 2)
		{
		if (isDisabled)
			{
			worldStyle = $Style.mapDisabledWorldText;
			nameStyle = $Style.mapDisabledWorldText;
			}
		else
			{
			worldStyle = $Style.mapFriendlyHighlight;
			nameStyle = (drawDesignationIcons ? $Style.mapFriendlyWorld : $Style.mapFriendlyHighlight);
			}

		designationStyle = $Style.mapFriendlyWorldBoxHighlight;
		}
	else if (drawNameFaded)
		{
		if (isDisabled)
			{
			worldStyle = $Style.mapDisabledWorldText;
			nameStyle = $Style.mapDisabledWorldText;
			}
		else
			{
			worldStyle = $Style.mapFriendlyWorld;
			nameStyle = $Style.mapFriendlyWorldFaded;
			}

		designationStyle = $Style.mapFriendlyWorldBoxFaded;
		}
	else
		{
		if (isDisabled)
			{
			worldStyle = $Style.mapDisabledWorldText;
			nameStyle = $Style.mapDisabledWorldText;
			}
		else
			{
			worldStyle = $Style.mapFriendlyWorld;
			nameStyle = $Style.mapFriendlyWorld;
			}

		designationStyle = $Style.mapFriendlyWorldBoxNormal;
		}

	//	If we're drawing the name, then compute some metrics

	var xText;
	var yText;
	var cyText;
	var fontText;
	var fontBoldText;
	var iconSize;
	var iconSpacing;

	if (drawName)
		{
		xText = x;
		yText = y + outerRadius;
		
		if (maxRadius > 18
				|| (maxRadius > 12 && importance >= 1)
				|| (maxRadius > 6 && importance >= 2))
			{
			cyText = $Style.tileFontLargeHeight;
			fontText = $Style.tileFontLarge;
			fontBoldText = $Style.tileFontExtraLargeBold;
			}
		else if (maxRadius > 12
				|| (maxRadius > 6 && importance >= 1)
				|| (importance >= 3))
			{
			cyText = $Style.tileFontMediumHeight;
			fontText = $Style.tileFontMedium;
			fontBoldText = $Style.tileFontLargeBold;
			}
		else
			{
			cyText = $Style.tileFontSmallHeight;
			fontText = $Style.tileFontSmall;
			fontBoldText = $Style.tileFontMediumBold;
			}

		//	Draw the info box background

		if (drawDesignationIcons)
			{
			iconSize = Math.min(Math.max(8, maxRadius * 3), 48);
			if (cyText < $Style.tileFontLargeHeight)
				iconSize = Math.min(cyText, iconSize);
			
			iconSpacing = iconSize / 12;

			//	Draw a background to keep everything together

			var yBoxTop = yText;
			var yBoxBottom = yText + cyText + (2 * iconSpacing) + iconSize;
			var cyCut = (yBoxBottom - yBoxTop) / 2;
			var cxCut = 0.577 * cyCut;	//	30 degrees
			var xBoxLeft = x - (4 * iconSpacing) - iconSize;
			var xBoxRight = x + (4 * iconSpacing) + iconSize;
			ctx.beginPath();
			ctx.moveTo(xBoxRight - cxCut, yBoxTop);
			ctx.lineTo(xBoxRight, yBoxTop + cyCut);
			ctx.lineTo(xBoxRight, yBoxBottom);
			ctx.lineTo(xBoxLeft, yBoxBottom);
			ctx.lineTo(xBoxLeft, yBoxTop + cyCut);
			ctx.lineTo(xBoxLeft + cxCut, yBoxTop);
			ctx.closePath();

			ctx.globalAlpha = (isIndependent ? 0.5 : 0.75);
			ctx.fillStyle = designationStyle;
			ctx.fill();
			ctx.globalAlpha = 1.0;
			}
		}

	//	Draw the world
	
	ctx.fillStyle = worldStyle;

	if (drawDesignationIcons)
		{
		var worldClass = $Anacreon.designTypes[this.worldClass];
		if (worldClass && worldClass.imageSmall)
			{
			var imageRadius = worldRadius;

			ctx.save();

			ctx.beginPath();
			ctx.arc(x, y, imageRadius, 0, 2 * Math.PI, false);
			ctx.clip();

			if (isDisabled)
				ctx.globalAlpha = 0.25;
			else if (!isForeign || isSelected)
				ctx.globalAlpha = 1.0;
			else if (!isIndependent)
				ctx.globalAlpha = 1.0;
			else
				ctx.globalAlpha = 0.5;

			worldClass.paintIconSmall(ctx,
					x - imageRadius,
					y - imageRadius,
					2 * imageRadius,
					2 * imageRadius);

			ctx.restore();
			}
		}
	else
		{
		ctx.beginPath();
		ctx.arc(x, y, worldRadius, 0, 2 * Math.PI, false);
		ctx.fill();
		}

	//	Draw the name of the world below it.
	
	if (drawName)
		{
		var drawNewsIcon = (uiMode == null
				&& newsIcon.style != "none"
				&& (maxRadius > 2 || newsIcon.style == "highlight"));

		ctx.font = fontText;
		ctx.fillStyle = nameStyle;
			
		//	Draw name
			
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText((importance == 3 ? this.name.toUpperCase() : this.name), xText, yText);
		ctx.textAlign = "left";
		
		yText += cyText;
		
		//	Draw icons for designation and tech level below the name.
		
		if (drawDesignationIcons)
			{
			//	For imperial worlds, show both designation and tech level

			if (!isIndependent)
				{
				var worldDesignation = $Anacreon.designTypes[this.designation];
				worldDesignation.paintIconSmall(ctx,
						xText + (iconSpacing / 2),
						yText + iconSpacing,
						iconSize,
						iconSize);

				InfoPaneHelper.paintTechLevelIcon(ctx,
						this.techLevel,
						xText - (iconSpacing / 2) - iconSize,
						yText + iconSpacing,
						iconSize,
						iconSize);
				}
				
			//	Otherwise, only show tech level
			
			else
				{
				InfoPaneHelper.paintTechLevelIcon(ctx,
						this.techLevel,
						xText - (iconSize / 2),
						yText + iconSpacing,
						iconSize,
						iconSize);
				}

			yText += iconSpacing + iconSize + iconSpacing;
			}

		//	Draw status message

		if (statusMessage)
			{
			ctx.textAlign = "center";
			ctx.fillStyle = "#707070";
			ctx.font = $Style.tileFontSmall;

			var cxMessage = $Style.tileFontSmallHeight * 10;
			yText += $UI.drawText(ctx, xText, yText, cxMessage, $Style.tileFontSmallHeight, statusMessage);
			}
			
		//	If this is one of our worlds, then show news
		
		if (drawNewsIcon)
			{
			var width = Math.max(cyText, 2 * maxRadius);
			var arc = 0.20 * Math.PI;
			var arcStart = 0.25 * Math.PI;
			
			var start = 2 * Math.PI - arcStart;
			var end = 2 * Math.PI - (arcStart + arc);
			
			var inner = outerRadius + 10;
			var outer = inner + width;
			
			ctx.beginPath();
			ctx.arc(x, y, outer, start, end, true);
			ctx.arc(x, y, inner, end, start, false);
			ctx.closePath();
			
			ctx.fillStyle = newsIcon.iconBackColor;
			ctx.fill();
			
			xText = x + (inner + (width / 2)) * Math.cos(arcStart + (arc / 2));
			yText = y - (inner + (width / 2)) * Math.sin(arcStart + (arc / 2));
			
			ctx.fillStyle = $Style.tileTextBright;
			ctx.font = fontBoldText;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText("!", xText, yText);
			ctx.textAlign = "left";
			}
		}
	}
	
WorldObject.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	switch (uiMode)
		{
		case UI_MODE_LAM_TARGET:
			{
			var range = mapMetrics.pixelsPerUnit * this.getLAMRange();

			ctx.beginPath();
			ctx.arc(this.mapPosX, this.mapPosY, range, 0, 2 * Math.PI, false);
			ctx.fillStyle = $Style.mapSafeOrbit;
			ctx.fill();

			break;
			}

		case UI_MODE_EXPORT_TARGET:
		case UI_MODE_TRADE_TARGET:
			{
			var importerHasSpaceport = (this.tradeRouteMax != null && this.tradeRouteMax > 0);
			var range = mapMetrics.pixelsPerUnit * (importerHasSpaceport ? 200 : 100);

			ctx.beginPath();
			ctx.arc(this.mapPosX, this.mapPosY, range, 0, 2 * Math.PI, false);
			ctx.fillStyle = $Style.mapSafeOrbit;
			ctx.fill();

			break;
			}
		}
	}

WorldObject.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	}

WorldObject.prototype.drawGalacticMapSelection = function (ctx)
	{
	MapHelper.paintGalacticMapSelection(ctx, this.mapPosX, this.mapPosY, null);
	}
	
WorldObject.prototype.drawHistoryPane = function (ctx, mapMetrics, x, y, pixelsPerUnit, isSelected, isFaded, isHovering)
	{
	MapHelper.paintGalacticMapSidePane(ctx,
			this,
			((this.history && this.history.length > 0) ? this.history[this.history.length - 1].text : ""),
			null,
			"Close",
			isHovering);
	}
	
WorldObject.prototype.drawPlanetaryMap = function (ctx, x, y, pixelsPerUnit)
	{
	var i;

	//	Generate a solar system for the planet

	var orbitRadius = this.orbit[0] * MEGAMETERS_PER_AU;
	var orbitPos = this.orbit[1];

	//	Draw the star

	if (orbitRadius * pixelsPerUnit < 2 * $Map.canvasWidth)
		{
		//	Compute the position of the star (relative to the planet, which is 
		//	centered).

		var xStar = x + (pixelsPerUnit * orbitRadius * Math.cos(orbitPos + Math.PI));
		var yStar = y - (pixelsPerUnit * orbitRadius * Math.sin(orbitPos + Math.PI));

		//	Compute the size of the rays

		var raySize = Math.max(10, pixelsPerUnit * 20000 / Math.sqrt(pixelsPerUnit / 0.001220703125));
		var rayWidth = raySize / 20;

		//	Draw the star 

		var rayCount = 6;
		var angle = 0;
		var angleInc = 2 * Math.PI / rayCount;
		for (i = 0; i < rayCount; i++)
			{
			var xWidth = rayWidth * Math.cos(angle);
			var yWidth = rayWidth * Math.sin(angle);
			var rayLength = raySize * (1.5 - Math.random());
			var xLength = rayLength * Math.cos(angle + Math.PI / 2);
			var yLength = rayLength * Math.sin(angle + Math.PI / 2);

			ctx.beginPath();
			ctx.moveTo(xStar + xWidth, yStar - yWidth);
			ctx.lineTo(xStar + xLength, yStar - yLength);
			ctx.lineTo(xStar - xWidth, yStar + yWidth);
			ctx.lineTo(xStar - xLength, yStar + yLength);
			ctx.closePath();

			ctx.fillStyle = "#ffffff";
			ctx.fill();

			angle += angleInc;
			}

		//	Draw the planet orbit

		ctx.beginPath();
		ctx.strokeStyle = "#d9d9ff";
		ctx.arc(xStar, yStar, orbitRadius * pixelsPerUnit, 0, 2 * Math.PI, false);
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.5;
		ctx.stroke();
		ctx.globalAlpha = 1;
		}

	//	Draw the planet

	var radius = Math.max(1, 6.353 * pixelsPerUnit);

	ctx.beginPath();
	ctx.fillStyle = "#ffffff";
	ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
	ctx.fill();
	}

WorldObject.prototype.getForceComposition = function ()
	{
	return SpaceObject.calcForceComposition(this.resources);
	}

WorldObject.prototype.getImportance = function ()
	{
	if (this.mapImportance)
		return this.mapImportance;

	var designationType = $Anacreon.designTypes[this.designation];
	
	//	There are 4 values:
	//
	//	0	Unimportant world
	//	1	Minor world
	//	2	Major world
	//	3	Key world (e.g., capital)
	
	//	Capitals are key worlds
	
	if (designationType.role == "imperialCapital")
		this.mapImportance = 3;
		
	//	Major worlds are shipyards, academies, etc.
	
	else if (designationType.role == "academy"
			|| designationType.role == "citadel"
			|| designationType.role == "foundation"
			|| designationType.role == "sectorCapital"
			|| designationType.role == "shipyard"
			|| designationType.role == "tradingHub")
		this.mapImportance = 2;
		
	//	Minor worlds have populations >= 6 billion or tech >= 5
	
	else if (this.population >= 6000
			|| this.techLevel >= 5)
		this.mapImportance = 1;
	
	//	Otherwise, unimportant world
	
	else
		this.mapImportance = 0;

	return this.mapImportance;
	}

WorldObject.prototype.getInfoPanes = function (industryPane)
	{
	var i;
	var paneList = [];
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);
	var sovereign = $Anacreon.sovereignList[this.sovereignID];
	var showNews = this.getNewsStyle();
	
	//	We always have an overview:
	
	paneList.push({
		tabLabel: "Overview",
	
		paneDesc: {
			cxStdTile: 856,
			cyStdTile: 44,
			
			onGetTileList: (function (canvasGrid, data)
			
			//	data:
			//
			//		obj: The selected object. May by either WorldObject or
			//			space object part.
			
				{
				var i;
				var tileList = [];
				var obj = data.obj.getSpaceObject();
				
				tileList.push({
					cyTile: 160,
					data: { obj: obj },
					onPaint: InfoPaneHelper.paintWorldTile
					});
				
				return tileList;
				}),
			},
			
		getCommandList: (function (objSelected)
			{
			var commandList = [];
			var obj = objSelected.getSpaceObject();

			obj.addInfoPaneBuy(objSelected, commandList);
			obj.addInfoPaneAttack(objSelected, commandList);
			obj.addInfoPaneDesignate(objSelected, commandList);
			obj.addInfoPaneDeploy(objSelected, commandList);
			obj.addInfoPaneSpecial(objSelected, commandList);
			obj.addInfoPaneCancel(objSelected, commandList);

			return commandList;
			}),
		});
		
	//	We always show structures
	
	paneList.push({
		tabLabel: "Structures",
		tileWidth: 160,
		
		paneDesc: {
			cxStdTile: 142,
			cyStdTile: 44,
			
			onGetTileList: (function (canvasGrid, data)
				{
				var i;
				var tileList = [];
				var obj = data.obj.getSpaceObject();
				
				var isForeign = (obj.sovereignID != $Anacreon.userInfo.sovereignID);
            	var designationType = $Anacreon.designTypes[obj.designation];
					
				//	One tile per industry
				
				for (i = 0; i < obj.traits.length; i++)
					{
					var industry = obj.traits[i];
					var industryType = $Anacreon.designTypes[industry.traitID];
					
					if (industryType.category != "improvement" && industryType.category != "industry")
						continue;
					
					//	For foreign worlds we only show the industry name
					
					if (isForeign && industry.buildData == null)
						{
						tileList.push({
							cyTile: 80,
							data: {
								obj: obj,
								industry: industry,
								},
							onPaint: InfoPaneHelper.paintStructureTile,
							});
						}
					
					//	For our worlds we show everything
					
					else
						{
						//	Skip any industry at 0 allocation
						
						if (industryType.category == "industry"
								&& industry.buildComplete == null
								&& industry.targetAllocation == 0)
							continue;
						
						//	Add a tile
						
						var theTile = {
							animate: (industry.buildComplete != null),
							cyTile: 80,
							data: {
								obj: obj,
								industry: industry,
								},
							onPaint: InfoPaneHelper.paintStructureTile,
							};
							
						//	If this is a spaceport then we add the import data
						
						if (industryType.role == "spaceport" && obj.tradeRoutes != null && industry.buildComplete == null)
							{
							var j, k;
							
							var tradeData = [];
							var exportByResource = { };
							
							for (j = 0; j < obj.tradeRoutes.length; j++)
								{
								var tradeRoute = obj.tradeRoutes[j];
								
								//	For imports we have one triplet per resource
							
								if (tradeRoute.imports)
									{
									for (k = 0; k < tradeRoute.imports.length; k += 4)
										{
										tradeData.push(tradeRoute.imports[k]);
										tradeData.push(tradeRoute.imports[k + 2]);
										tradeData.push(tradeRoute.imports[k + 3]);
										}
									}
									
								//	For exports we have one triplet per destination 
								//	per triplet, so we need to normalize to resources
								
								if (tradeRoute.exports)
									{
									for (k = 0; k < tradeRoute.exports.length; k += 4)
										{
										var prop = tradeRoute.exports[k];
									
										if (exportByResource[prop] == null)
											exportByResource[prop] = { id: tradeRoute.exports[k], value: -tradeRoute.exports[k + 2] };
										else
											exportByResource[prop].value += -tradeRoute.exports[k + 2];
										}
									}
								}
								
							for (var prop in exportByResource)
								{
								tradeData.push(exportByResource[prop].id);
								tradeData.push(exportByResource[prop].value);
								tradeData.push(null);
								}
								
							if (tradeData.length > 0)
								{
								theTile.data.industry = {
									traitID: industry.traitID,
									workUnits: industry.workUnits,
									allocation: industry.allocation,
									targetAllocation: industry.targetAllocation,
									productionData: tradeData
									};
									
								theTile.cyTile = 80;
								}
							}
							
						//	Click to get more info
						
						theTile.onClick = InfoPaneHelper.clickIndustryData;
							
						//	Add it
							
						tileList.push(theTile);
						}
					}
					
				//	Sort the tile list appropriately
				
				tileList.sort(function (a, b)
					{
					//	Primary industry always goes first
					
					if (designationType.primaryIndustry == a.data.industry.traitID)
						return -1;
					else if (designationType.primaryIndustry == b.data.industry.traitID)
						return 1;
						
					//	Larger tiles go first
					
					if (a.cyTile > b.cyTile)
						return -1;
					else if (a.cyTile < b.cyTile)
						return 1;
						
					//	Production traits go first
					
					if (a.data.industry.productionData != null && b.data.industry.productionData == null)
						return -1;
					else if (a.data.industry.productionData == null && b.data.industry.productionData != null)
						return 1;
						
					//	By industry name
					
					var aName = $Anacreon.designTypes[a.data.industry.traitID].nameDesc.toLowerCase();
					var bName = $Anacreon.designTypes[b.data.industry.traitID].nameDesc.toLowerCase();
					if (aName < bName)
						return -1;
					else if (aName > bName)
						return 1;
					
					//	No difference
					
					return 0;
					});
					
				return tileList;
				}),
			},
		
		getCommandList: (function (objSelected)
			{
			var commandList = [];
			var obj = objSelected.getSpaceObject();

			obj.addInfoPaneBuild(objSelected, commandList);
			obj.addInfoPaneImport(objSelected, commandList);
			obj.addInfoPaneCancel(objSelected, commandList);
					
			return commandList;
			}),
		});

	//	Add a tab for production

	if (!isForeign)
		{
		paneList.push({
			tabLabel: "Production",

			paneDesc: {
				cxStdTile: 142,
				cyStdTile: 44,

				onGetTileList: (function (canvasGrid, data)
					{
					var i;
					var tileList = [];
					var obj = data.obj.getSpaceObject();

					//	Start by getting production data, which is an array of
					//	structures, each one corresponding to a resource.

					var prodData = obj.getProductionData();
					for (i = 0; i < prodData.length; i++)
						{
						var resData = prodData[i];
						var lines = (resData.producedOptimal > 0 ? 1 : 0)
								+ (resData.consumedOptimal > 0 ? 1 : 0)
								+ (resData.importedOptimal > 0 ? 1 : 0)
								+ (resData.exportedOptimal > 0 ? 1 : 0)
								+ 1;

						tileList.push({
							cyTile: 40 + lines * $Style.tileFontSmallHeight,
							data: {
								obj: obj,
								resData: resData,
								},
							onPaint: InfoPaneHelper.paintResourceProductionTile,
							});
						}

					return tileList;
					}),
				},

			getCommandList: (function (objSelected)
				{
				var commandList = [];
				var obj = objSelected.getSpaceObject();

				obj.addInfoPaneCancel(objSelected, commandList);
						
				return commandList;
				}),
			});
		}

	//	Add a tab for primary industry (if we have one)

	var primaryIndustry = this.getPrimaryIndustry();
	if (!isForeign && primaryIndustry != null && industryPane == null)
		{
        var industryType = $Anacreon.designTypes[primaryIndustry.traitID];

		paneList.push({
			tabLabel: $Language.capitalizeTitle(industryType.nameDesc),
			
			paneDesc: {
				cxStdTile: 120,
				cyStdTile: 42,
			
				onGetTileList: (function (canvasGrid, data)

				//	data:
				//
				//		obj: The selected object.
			
					{
					var tileList = [];
					var obj = data.obj.getSpaceObject();
					var industry = obj.getPrimaryIndustry();
					if (industry == null)
						return tileList;

					InfoPaneHelper.createIndustryInfoTiles(tileList, obj, industry);

					return tileList;
					}),
				},
			
			getCommandList: (function (objSelected)
				{
				var commandList = [];
				var obj = objSelected.getSpaceObject();

				obj.addInfoPaneCancel(objSelected, commandList);
						
				return commandList;
				}),
			});
		}
	else if (industryPane)
		{
		paneList.push(industryPane);
		}

	//	If this is an imperial capital, then add a tab for the empire

	if ((this.isCapital && sovereign)
			|| (sovereign && $Anacreon.objList[sovereign.capitalID] && $Anacreon.objList[sovereign.capitalID].sovereignID != sovereign.id && !isForeign))
		{
		paneList.push({
			tabLabel: "Empire",

			paneDesc: {
				cxStdTile: 180,
				cyStdTile: 42,
			
				onGetTileList: (function (canvasGrid, data)
			
				//	data:
				//
				//		obj: The selected object. May by either WorldObject or
				//			space object part.
			
					{
					var i;
					var tileList = [];
					var obj = data.obj.getSpaceObject();
					var sovereign = $Anacreon.sovereignList[obj.sovereignID];
				
					tileList.push({
						cyTile: 160,
						data: { sovereign: sovereign },
						onPaint: InfoPaneHelper.paintSovereignStatsTile
						});
				
					//	Resources
				
					if (sovereign.stats.resources)
						InfoPaneHelper.createResourceTiles(tileList, $Anacreon.sortResourceArray(sovereign.stats.resources));

					return tileList;
					}),
				},

			getCommandList: (function (objSelected)
				{
				var commandList = [];
				var obj = objSelected.getSpaceObject();

				obj.addInfoPaneDoctrine(objSelected, commandList);
				obj.addInfoPaneSendMessage(objSelected, commandList);
				obj.addInfoPaneAbdicate(objSelected, commandList);
				obj.addInfoPaneCancel(objSelected, commandList);

				return commandList;
				}),
			});
		}

	//	Add a tab for news, if we've got it.
	
	if (showNews.style != "none")
		{
		paneList.push({
			tabLabel: "News",
		
			paneDesc: {
				cxStdTile: 425,
				cyStdTile: 28,
				
				onGetTileList: (function (canvasGrid, data)
				
				//	data:
				//
				//		obj: The selected object. May by either WorldObject or
				//			space object part.
				
					{
					var i;
					var tileList = [];
					var obj = data.obj.getSpaceObject();
					var news = obj.news;
					
					//	Set the contex so that we can measure text.
					
					canvasGrid.ctx.font = $Style.tileFontMedium;

					//	If necessary, add siege tile

					var siege = obj.getSiege();
					if (siege)
						tileList.push({
							cyTile: 84,
							data: { obj:obj, siege:siege },
							onPaint: InfoPaneHelper.paintSiegeInfo,
							});

					//	If necessary, add rebellion tile

					var rebellion = obj.getRebellion();
					if (rebellion)
						tileList.push({
							cyTile: 84,
							data: { obj: obj, rebellion: rebellion },
							onPaint: InfoPaneHelper.paintRebellionInfo,
							});
					
					//	Loop over all news items and add each one as a tile.

					if (news)
						{
						for (i = 0; i < news.length; i++)
							{
							//	Compute the amount of text that we have.

							var cyHeight = $UI.drawTextMeasure(canvasGrid.ctx, 390, $Style.tileFontMediumHeight, news[i].text).height;

							//	Add the tile

							tileList.push({
								cyTile: cyHeight,
								data: { obj: obj, entry: news[i] },
								onPaint: InfoPaneHelper.paintNewsTile,
								});
							}
						}
					
					return tileList;
					}),
				},
				
			getCommandList: (function (objSelected)
				{
				var commandList = [];
				var obj = objSelected.getSpaceObject();

				obj.addInfoPaneCancel(objSelected, commandList);
						
				return commandList;
				}),
			});
		}

	//	Done
	
	return paneList;
	}

WorldObject.prototype.getJumpBeaconRange = function ()
	{
	return 250.0;
	}

WorldObject.prototype.getLAMRange = function ()
	{
	return 100.0;
	}
	
WorldObject.prototype.getMaxRadius = function (pixelsPerUnit)
	{
	var maxRadius = Math.pow(Math.log(64 * pixelsPerUnit) / 2.772589, 3);
	if (maxRadius > 30) maxRadius = 30;
	if (maxRadius < 1) maxRadius = 1;
	return maxRadius;
	}

WorldObject.prototype.getNewsStyle = function ()

//	If there is no news, we return style = "none". Otherwise, we return an Object with
//	the following fields:
//
//	iconBackColor: The background color for the news icon
//	style: Either "normal" or "highlight" or "none". Highlight means that we show 
//		the news icon even when the map is zoomed out.

	{
	var isForeign = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	//	If we have a siege object, then we always show news, even if the world
	//	does not belong to us.

	var siege;
	if (siege = this.getSiege())
		{
		//	If our world is being sieged, then this is a warning icon

		if (!isForeign)
			return { style:"highlight", iconBackColor:$Style.tileErrorBackground };

		//	If we're the ones sieging, then we show a highlight

		else if (siege.sovereignID == $Anacreon.userInfo.sovereignID)
			return { style:"highlight", iconBackColor:$Style.tileHighlightBackground };

		//	Otherwise, we pick a neutral icon

		else
			return { style:"normal", iconBackColor:$Style.tileHoverBackground };
		}

	//	If there's a rebellion, then we show a warning icon

	else if (this.getRebellion())
		{
		if (!isForeign)
			return { style:"highlight", iconBackColor:$Style.tileErrorBackground };
		else
			return { style:"normal", iconBackColor:$Style.tileHoverBackground };
		}

	//	Otherwise, if we have normal news

	else if (this.news && !isForeign)
		return { style:"normal", iconBackColor:$Style.tileNormalBackground };

	//	Otherwise, no news

	else
		return { style:"none", };
	}

WorldObject.prototype.getPrimaryIndustry = function ()
	{
	var i;

	var designationType = $Anacreon.designTypes[this.designation];
	var primaryIndustry = (designationType ? designationType.primaryIndustry : null);
	if (primaryIndustry == null)
		return null;

	for (i = 0; i < this.traits.length; i++)
		{
		if (this.traits[i].traitID == primaryIndustry)
			return this.traits[i];
		}

	return null;
	}

WorldObject.prototype.getProductionData = function ()

//	Returns an array of structures as follows:
//
//	resType: The resource type
//	produced: The total amount produced on the world
//	consumed: The total amount consumed on the world
//	exported: The total amount exported
//	imported: The total amount imported
//	available: The total amount available on the world.
//	producedOptimal: This is how much we could produce (if we
//			had enough inputs).
//	consumedOptimal: This is how much we could consume.
//	exportedOptimal: This is how much we would like to export.
//	importedOptimal: This is how much we would like to have
//			imported.

	{
	var result = { };

	function getEntry (resID)
		{
		if (result[resID] == null)
			{
			result[resID] = {
				resType: $Anacreon.designTypes[resID],

				available: 0,

				consumed: 0,
				exported: 0,
				imported: 0,
				produced: 0,

				consumedOptimal: 0,
				exportedOptimal: 0,
				importedOptimal: 0,
				producedOptimal: 0,
				};
			}

		return result[resID];
		}

	var i, j;

	//	Start by adding base consumption

	if (this.baseConsumption)
		{
		for (i = 0; i < this.baseConsumption.length; i += 3)
			{
			var entry = getEntry(this.baseConsumption[i]);
			var optimal = this.baseConsumption[i + 1];
			var actual = this.baseConsumption[i + 2];

			entry.consumedOptimal += optimal;
			entry.consumed += (actual == null ? optimal : actual);
			}
		}

	//	Now add the production of all traits

	for (i = 0; i < this.traits.length; i++)
		{
		var trait = this.traits[i];
		if (trait.productionData)
			{
			for (j = 0; j < trait.productionData.length; j += 3)
				{
				var entry = getEntry(trait.productionData[j]);
				var optimal = trait.productionData[j + 1];
				var actual = trait.productionData[j + 2];

				if (optimal > 0.0)
					{
					entry.producedOptimal += optimal;
					entry.produced += (actual == null ? optimal : actual);
					}
				else
					{
					entry.consumedOptimal += -optimal;
					entry.consumed += (actual == null ? -optimal : -actual);
					}
				}
			}
		}

	//	Now add all imports and exports

	if (this.tradeRoutes)
		{
		for (i = 0; i < this.tradeRoutes.length; i++)
			{
			var tradeRoute = this.tradeRoutes[i];
			var exports;
			var imports;

			if (tradeRoute.return)
				{
				var partnerObj = $Anacreon.objList[tradeRoute.partnerObjID];
				if (partnerObj)
					{
					for (j = 0; j < partnerObj.tradeRoutes.length; j++)
						if (partnerObj.tradeRoutes[j].partnerObjID == this.id)
							{
							exports = partnerObj.tradeRoutes[j].imports;
							imports = partnerObj.tradeRoutes[j].exports;
							}
					}
				}
			else
				{
				exports = tradeRoute.exports;
				imports = tradeRoute.imports;
				}

			if (exports)
				{
				for (j = 0; j < exports.length; j += 4)
					{
					var entry = getEntry(exports[j]);
					var optimal = exports[j + 2];
					var actual = exports[j + 3];

					entry.exported += (actual == null ? optimal : actual);
					entry.exportedOptimal += optimal;
					}
				}

			if (imports)
				{
				for (j = 0; j < imports.length; j += 4)
					{
					var entry = getEntry(imports[j]);
					var optimal = imports[j + 2];
					var actual = imports[j + 3];

					entry.imported += (actual == null ? optimal : actual);
					entry.importedOptimal += optimal;
					}
				}
			}
		}

	//	Finally, add available resources for anything we produce/consume

	if (this.resources)
		{
		for (i = 0; i < this.resources.length; i++)
			{
			var resID = this.resources[i];
			var count = this.resources[i + 1];

			if (result[resID] != null && count > 0)
				result[resID].available = count;
			}
		}

	//	Now that we have all the data, create an array

	var resultArray = [];
	for (i in result)
		resultArray.push(result[i]);

	//	Done

	return resultArray;
	}

WorldObject.prototype.getRebellion = function ()
	{
	var i;

	if (this.rebellionChecked)
		return this.rebellion;

	this.rebellion = null;
	for (i = 0; i < this.traits.length; i++)
		{
		var traitType = $Anacreon.designTypes[this.traits[i].traitID];
		if (traitType.category == "rebellion")
			{
			this.rebellion = this.traits[i];
			break;
			}
		}

	this.rebellionChecked = true;
	return this.rebellion;
	}

WorldObject.prototype.getSectorCapital = function ()
	{
	//	We cache this for efficiency

	if (this.sectorCapital)
		return this.sectorCapital;

	//	Find the nearest capital

	var i;
	var sovereign = $Anacreon.sovereignList[this.sovereignID];
	var allWorlds = sovereign.getWorlds();
	var bestWorld = null;
	var bestDist;
	for (i = 0; i < allWorlds.length; i++)
		{
		var obj = allWorlds[i];
		var designation = $Anacreon.designTypes[obj.designation];
		if (obj.buildComplete == null &&
				(designation.role == "sectorCapital" || designation.role == "imperialCapital"))
			{
			var dist = this.calcDistanceTo(obj);

			if (bestWorld == null || dist < bestDist)
				{
				bestWorld = obj;
				bestDist = dist;
				}
			}
		}

	this.sectorCapital = bestWorld;
	return bestWorld;
	}
	
WorldObject.prototype.getSiege = function ()
	{
	if (!this.siegeObjID)
		return null;

	return $Anacreon.siegeList[this.siegeObjID];
	}

WorldObject.prototype.getSizeAdj = function ()
	{
	if (this.mapSizeAdj)
		return this.mapSizeAdj;

	//	Size of planet depends on its population. We make the area of the circle
	//	proportional to population.

	var minAdj = 0.2;
	var maxPop = 12000;

	if (this.population >= maxPop)
		this.mapSizeAdj = 1.0;
	else
		this.mapSizeAdj = Math.max(minAdj, Math.sqrt(this.population/maxPop));

	return this.mapSizeAdj;
	}

WorldObject.prototype.getSpaceBackgroundImage = function ()
	{
	var region = (this.region ? $Anacreon.regionList[this.region] : null);
	var regionType = (region ? $Anacreon.designTypes[region.type] : null);
	return (regionType ? regionType.backgroundImageTactical : $Anacreon.defaultSpaceRegion.backgroundImageTactical);
	}
	
WorldObject.prototype.getSpaceObject = function ()
	{
	return this;
	}

WorldObject.prototype.getSpaceObjectID = function ()
	{
	return this.id;
	}

WorldObject.prototype.getTargetsToAttack = function ()
	{
	var i;
	var list = [];

	if (this.sovereignID != $Anacreon.userInfo.sovereignID)
		list.push(this);

	if (this.nearObjIDs)
		{
		for (i = 0; i < this.nearObjIDs.length; i++)
			{
			var nearObj = $Anacreon.objList[this.nearObjIDs[i]];
			if (nearObj && nearObj.sovereignID != $Anacreon.userInfo.sovereignID)
				list.push(nearObj);
			}
		}

	return (list.length > 0 ? list : null);
	}

WorldObject.prototype.getTraitByRole = function (role)
	{
	var i;

	for (i = 0; i < this.traits.length; i++)
		{
		var traitType = $Anacreon.designTypes[this.traits[i].traitID];
		if (traitType.role == role)
			return this.traits[i];
		}

	return null;
	}

WorldObject.prototype.getPurchaseData = function (sellerID, resTypeID)

//	Returns a structure as follows:
//
//	buyerObj: Buyer object
//	sellerObj: Seller object
//	resType: Resource type being sold
//	optimal: Quantity desired
//	price: Total price for last transaction
//	actual: Actual amount sold last watch

	{
	var i, j;

	if (this.tradeRoutes == null)
		return null;

	for (i = 0; i < this.tradeRoutes.length; i++)
		{
		var route = this.tradeRoutes[i];
		if (route.partnerObjID == sellerID)
			{
			var partnerObj = $Anacreon.objList[route.partnerObjID];
			var tradeList;

			//	Get the trade information. If it is not on our object then we 
			//	need to find it in the partner.

			if (route.purchases)
				tradeList = route.purchases;
			else
				{
				for (j = 0; j < partnerObj.tradeRoutes.length; j++)
					{
					var route = partnerObj.tradeRoutes[j];
					if (route.partnerObjID == this.id)
						{
						tradeList = route.sales;
						break;
						}
					}

				if (tradeList == null)
					return null;
				}

			for (j = 0; j < tradeList.length; j += 4)
				{
				if (tradeList[j] == resTypeID)
					{
					return {
						buyerObj: this,
						sellerObj: partnerObj,
						resType: $Anacreon.designTypes[resTypeID],
						optimal: tradeList[j + 1],
						price: tradeList[j + 2],
						actual: (tradeList[j + 3] ? tradeList[j + 3] : tradeList[j + 2]),
						};
					}
				}
			}
		}

	return null;
	}

WorldObject.prototype.getTradeData = function (importFromID, resTypeID)

//	Returns a structure as follows:
//
//	importerObj: Importing object
//	exporterObj: Exporting object
//	resType: Resource type being imported
//	alloc: Percent of demand being imported
//	optimal: Optimal ammount being imported
//	actual: Actual amount imported last watch

	{
	var i, j;

	if (this.tradeRoutes == null)
		return null;

	for (i = 0; i < this.tradeRoutes.length; i++)
		{
		var route = this.tradeRoutes[i];
		if (route.partnerObjID == importFromID)
			{
			var partnerObj = $Anacreon.objList[importFromID];
			var tradeList;

			//	Get the trade information. If it is not on our object then we 
			//	need to find it in the partner.

			if (route.imports)
				tradeList = route.imports;
			else
				{
				for (j = 0; j < partnerObj.tradeRoutes.length; j++)
					{
					var route = partnerObj.tradeRoutes[j];
					if (route.partnerObjID == this.id)
						{
						tradeList = route.exports;
						break;
						}
					}

				if (tradeList == null)
					return null;
				}

			for (j = 0; j < tradeList.length; j += 4)
				{
				if (tradeList[j] == resTypeID)
					{
					return {
						importedObj: this,
						exporterObj: partnerObj,
						resType: $Anacreon.designTypes[resTypeID],
						alloc: route.imports[j + 1],
						optimal: route.imports[j + 2],
						actual: (route.imports[j + 3] ? route.imports[j + 3] : route.imports[j + 2]),
						};
					}
				}
			}
		}

	return null;
	}

WorldObject.prototype.getTrait = function (traitID, includeWorldCharacteristics)
	{
	var i;
	
	for (i = 0; i < this.traits.length; i++)
		{
		if (this.traits[i].traitID == traitID)
			return this.traits[i];
		else
			{
			//	See if we inherit from the trait

			var theTrait = $Anacreon.designTypes[this.traits[i].traitID];
			if (theTrait && theTrait.inheritsFrom(traitID))
				return { traitID: traitID };
			}
		}

	//	If we ask for it, include world class, designation, and culture

	if (includeWorldCharacteristics)
		{
		if (traitID == this.worldClass || traitID == this.designation || traitID == this.culture)
			return { traitID: traitID };

		//	Check for inherited traits

		var theTrait = $Anacreon.designTypes[this.worldClass];
		if (theTrait && theTrait.inheritsFrom(traitID))
			return { traitID: traitID };

		theTrait = $Anacreon.designTypes[this.designation];
		if (theTrait && theTrait.inheritsFrom(traitID))
			return { traitID: traitID };

		theTrait = $Anacreon.designTypes[this.culture];
		if (theTrait && theTrait.inheritsFrom(traitID))
			return { traitID: traitID };
		}

	//	See if the sovereign's doctrine matches

	var sovereign = $Anacreon.sovereignList[this.sovereignID];
	if (sovereign 
			&& sovereign.doctrine == traitID)
		return { traitID: traitID };

	return null;
	}

WorldObject.prototype.getValidBattlePlans = function ()
	{
	function composeSovereignInfo (sovInfo, sourceObj, addWarnings)
		{
		//	Compute the forces of this object

		var comp = sourceObj.getForceComposition();

		//	If we already have sovereign info, then modify it.

		if (sovInfo)
			{
			sovInfo.forces.groundForces += comp.groundForces;
			sovInfo.forces.spaceForces += comp.spaceForces;

			return sovInfo;
			}

		//	Otherwise we create it

		else
			{
			//	Compute any warnings when attacking this empire

			var warnings = null;
			var sovereign = $Anacreon.sovereignList[sourceObj.sovereignID];
			if (!sovereign.isIndependent && addWarnings)
				{
				//	If we're attacking a weaker empire, then we might have 
				//	problems with our population.

				if (sovereign.imperialMight < 50)
					{
					//	If this empire has never attacked us, then this is a problem.

					if (sovereign.relationship.theirActions.attacksInitiated == 0)
						warnings = "WARNING: An uprovoked attack on " + sovereign.name + ", which is too small to pose a threat to us, will not be accepted by our citizens.";
					
					//	If this empire has only attacked us in self defense, then we
					//	warn.

					else if (sovereign.relationship.theirActions.offensivesInitiated == 0)
						warnings = "WARNING: Our citizens may not support a wider war against " + sovereign.name + ", an empire too small to threaten us.";
					}
				}

			//	Done

			return {
				id: sourceObj.sovereignID,

				forces: comp,
				warnings: warnings,
				};
			}
		}

	//	getValidBattlePlans ----------------------------------------------------

	var i;
	var planList = [ ];
	var ourForces = SpaceObject.calcForceComposition([ ]);

	//	If this is our own world then we don't need any attack warnings

	var needAttackWarnings = (this.sovereignID != $Anacreon.userInfo.sovereignID);

	//	Make a list of sovereigns that we can attack.

	var enemySovereigns = { };
	if (this.sovereignID == $Anacreon.userInfo.sovereignID)
		ourForces = this.getForceComposition();
	else
		enemySovereigns[this.sovereignID] = composeSovereignInfo(null, this, needAttackWarnings);

	if (this.nearObjIDs)
		{
		for (i = 0; i < this.nearObjIDs.length; i++)
			{
			var nearObj = $Anacreon.objList[this.nearObjIDs[i]];
			if (nearObj)
				{
				//	If this is our fleet then add it to our forces

				if (nearObj.sovereignID == $Anacreon.userInfo.sovereignID)
					{
					var fleetForces = nearObj.getForceComposition();
					ourForces.groundForces += fleetForces.groundForces;
					ourForces.spaceForces += fleetForces.spaceForces;
					}

				//	Otherwise, it is an enemy fleet, so add its sovereign as a
				//	potential target.

				else
					enemySovereigns[nearObj.sovereignID] = composeSovereignInfo(enemySovereigns[nearObj.sovereignID], nearObj, needAttackWarnings);
				}
			}
		}

	//	If this world is not ours, and we've got ground forces, then we can invade it

	var empire = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];
	var nextID = 0;
	if (this.sovereignID != $Anacreon.userInfo.sovereignID
			&& ourForces.groundForces > 0)
		{
		var sovInfo = enemySovereigns[this.sovereignID];
		var sovereign = $Anacreon.sovereignList[this.sovereignID];
		var siege = this.getSiege();

		//	Add warnings

		var warnings = null;
		if (sovInfo.warnings)
			warnings = sovInfo.warnings;
		else if (ourForces.groundForces < sovInfo.forces.groundForces / 2)
			warnings = "WARNING: We do not have enough ground forces to conquer the world.";
		else if (ourForces.groundForces < sovInfo.forces.groundForces)
			warnings = "WARNING: We may not have enough ground forces to conquer the world.";
		else if (ourForces.spaceForces < sovInfo.forces.spaceForces / 3)
			warnings = "WARNING: We do not have enough space forces to defeat the world's defenses.";
		else if (ourForces.spaceForces < sovInfo.forces.spaceForces)
			warnings = "WARNING: We may not have enough space forces to defeat the world's defenses.";

		//	If we have a siege in place, then we're reinforcing the siege

		if (siege && siege.sovereignID == $Anacreon.userInfo.sovereignID)
			{
			planList.push({
				data: {
					objective: "invasion",
					sovereign: sovereign,
					sovereignName: (sovereign.isIndependent ? this.name : sovereign.name),
					enemySovereignIDs: [this.sovereignID],
					description: "Land troops to reinforce siege.",
					groundForcesNeeded: true,
	
					friendlyForces: ourForces,
					enemyForces: sovInfo.forces,
	
					warnings: warnings,
					},
				id: nextID++,
				label: "Reinforce Siege",
				});
			}

		//	Otherwise, normal invasion

		else
			{
			planList.push({
				data: {
					objective: "invasion",
					sovereign: sovereign,
					sovereignName: (sovereign.isIndependent ? this.name : sovereign.name),
					enemySovereignIDs: [this.sovereignID],
					description: "Destroy enemy space forces until it is safe to land ground forces, then take control of the world.",
					groundForcesNeeded: true,
	
					friendlyForces: ourForces,
					enemyForces: sovInfo.forces,
	
					warnings: warnings,
					},
				id: nextID++,
				label: "Invade " + this.name,
				});
			}
		}

	//	Add a tile for each enemy sovereign

	for (i in enemySovereigns)
		{
		var sovInfo = enemySovereigns[i];
		var sovereign = $Anacreon.sovereignList[sovInfo.id];
		var sovereignName = (sovereign.isIndependent ? this.name : sovereign.name);
		var isWorld = (this.sovereignID == sovInfo.id);

		//	Add warnings

		var warnings = null;
		if (sovInfo.warnings)
			warnings = sovInfo.warnings;
		else if (ourForces.spaceForces < sovInfo.forces.spaceForces / 3)
			warnings = "WARNING: We do not have enough space forces to defeat the enemy.";
		else if (ourForces.spaceForces < sovInfo.forces.spaceForces)
			warnings = "WARNING: We may not have enough space forces to defeat the enemy.";

		//	Add the entry

		planList.push({
			data: {
				objective: "spaceSupremacy",
				sovereign: sovereign,
				sovereignName: sovereignName,
				enemySovereignIDs: [sovInfo.id],
				description: "Attack " + sovereignName + " space forces until they are destroyed.",
				groundForcesNeeded: false,

				friendlyForces: ourForces,
				enemyForces: sovInfo.forces,

				warnings: warnings,
				},
			id: nextID++,
			label: "Destroy " + sovereignName + " Ships" + (isWorld ? " & Defenses" : ""),
			});
		}

	//	Done

	return planList;
	}
	
WorldObject.prototype.getValidImprovementList = function ()
	{
	var i, j;
	var improvementList = [];
	
	for (i = 0; i < $Anacreon.designTypes.length; i++)
		{
		var type = $Anacreon.designTypes[i];
		if (type != null 
				&& type.category == "improvement"
				&& !type.npeOnly
				&& !type.designationOnly
				&& type.buildTime != null
				&& this.getTrait(type.id) == null
				&& this.techLevel >= type.minTechLevel)
			{
			//	Make sure we have one of the required upgrade traits

			if (type.buildUpgrade)
				{
				var found = false;
				for (j = 0; j < type.buildUpgrade.length && !found; j++)
					{
					var predecessor = this.getTrait(type.buildUpgrade[j], "includeWorldCharacteristics");
					if (predecessor && predecessor.buildComplete == null)
						found = true;
					}

				if (!found)
					continue;
				}

			//	Make sure we have other requirements

			if (type.buildRequirements)
				{
				var allFound = true;
				for (j = 0; j < type.buildRequirements.length; j++)
					{
					var req = this.getTrait(type.buildRequirements[j], "includeWorldCharacteristics");
					if (!req || req.buildComplete != null)
						{
						allFound = false;
						break;
						}
					}

				if (!allFound)
					continue;
				}

			if (type.buildExclusions)
				{
				var anyFound = false;
				for (j = 0; j < type.buildExclusions.length; j++)
					{
					var req = this.getTrait(type.buildExclusions[j], "includeWorldCharacteristics");
					if (req)
						{
						anyFound = true;
						break;
						}
					}

				if (anyFound)
					continue;
				}

			//	Make sure this improvement isn't superceded by some existing
			//	structure.

			var superceded = false;
			for (j = 0; j < this.traits.length; j++)
				{
				var existingType = $Anacreon.designTypes[this.traits[j].traitID];
				if (existingType.supercedes(type))
					{
					superceded = true;
					break;
					}
				}

			if (superceded)
				continue;

			//	If this is a techAdvance improvement then make sure it is valid

			if (type.role == "techAdvance")
				{
				if (type.techLevelAdvance <= this.techLevel)
					continue;
				}

			//	Add it

			improvementList.push({
				id: type.id,
				label: type.nameDesc
				});
			}
		}
	
	return improvementList;
	}

WorldObject.prototype.hasAttackers = function ()
	{
	var i;

	if (this.sovereignID == $Anacreon.userInfo.sovereignID)
		return true;

	if (this.nearObjIDs)
		{
		for (i = 0; i < this.nearObjIDs.length; i++)
			{
			var nearObj = $Anacreon.objList[this.nearObjIDs[i]];
			if (nearObj && nearObj.sovereignID == $Anacreon.userInfo.sovereignID)
				return true;
			}
		}

	return false;
	}

WorldObject.prototype.hasExportTarget = function ()
	{
	var i;

	//	Find any foreign hub that will buy from us (in range).

	var objList = $Anacreon.objList;
	var total = objList.length;
	
	//	Find all objects belonging to the sovereign
	
	for (i = 0; i < total; i++)
		{
		var obj = objList[i];
		if (obj == null 
				|| obj.sovereignID == this.id
				|| obj["class"] != "world")
			continue;

		//	Must be a trading hub

		var designation = $Anacreon.designTypes[obj.designation];
		if (!this.isTradingHub())
			continue;

		//	Sovereign must support trading

		var sovereign = $Anacreon.sovereignList[obj.sovereignID];
		if (!sovereign.hasBureauOfTrade())
			continue;

		//	Must be in range

		var dist = this.calcDistanceTo(obj);
		if (dist > 200)
			continue;

		//	If we get this far, then we found a world

		return true;
		}

	//	Couldn't find anything

	return false;
	}

WorldObject.prototype.hasLAMs = function ()
	{
	var i;

	if (this.resources == null)
		return false;

	for (i = 0; i < this.resources.length; i += 2)
		{
		var resType = $Anacreon.designTypes[this.resources[i]];
		if (resType.category == "LAMUnit" && this.resources[i + 1] > 0)
			return true;
		}

	return false;
	}

WorldObject.prototype.hitTestBattlePane = function (x, y)
	{
	//	Compute some metrics

	var maxRadius = $Map.maxWorldRadius;
	var worldRadius = maxRadius * this.getSizeAdj();
	var outerRadius = worldRadius * 1.2;
	var inner = outerRadius + 10;

	var paneWidth = 150 + inner;
	var paneHeight = 3 * $Style.tileFontSmallHeight + 2 * $Style.cyTilePadding + 20;

	var xLeft = this.mapPosX - paneWidth;
	var xRight = this.mapPosX;
	var yTop = this.mapPosY - paneHeight;
	var yBottom = this.mapPosY;

	return (x >= xLeft && x < xRight && y >= yTop && y < yBottom);
	}

WorldObject.prototype.isControlledByUs = function ()
	{
	return (this.sovereignID == $Anacreon.userInfo.sovereignID);
	}

WorldObject.prototype.isInAdministrativeRange = function ()
	{
	var sectorCapital = this.getSectorCapital();
	return (sectorCapital && this.calcDistanceTo(sectorCapital) < 250);
	}

WorldObject.prototype.isTradingHub = function ()
	{
	if (this.isTradingHubCache == null)
		{
		var tradingHubAttrib = $Anacreon.getDesignType("core.tradingHubAttribute");
		this.isTradingHubCache = (tradingHubAttrib != null && this.getTrait(tradingHubAttrib.id, true) != null);
		}

	return this.isTradingHubCache;
	}
	
WorldObject.prototype.refreshSelection = function ()
	{
	return $Anacreon.objList[this.id];
	}
