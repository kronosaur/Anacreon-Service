//	anacreon.js
//
//	Implements core Anacreon functionality
//	Copyright (c) 2012 Kronosaur Productions, LLC. All Rights Reserved.

//	Core functions -------------------------------------------------------------

var MEGAMETERS_PER_LIGHTYEAR = 9460716019.2;
var MEGAMETERS_PER_AU = 149597.9;

var $Anacreon = {
	//	designTypes: Array of design types (indexed by ID)
	//	gameID: Current gameID
	//	independentID: ID of independent sovereign
	//	nextWatchTime: Time when the next watch is expected
	//	nextUpdateTime: Time when next update is expected (in local time)
	//	objList: Array of objects known to the sovereign (indexed by object ID)
	//	seq: Last sequence number of objList
	//	scenarioInfo: Info about the scenario
	//		mapSize: An array of two elements, width and height.
	//		name: Name of scenario
	//	sovereignList: Array of sovereigns (indexed by sovereign ID)
	//	techLevels: Array of TechLevel objects
	//	update: The update number
	//	userInfo: userInfo structure
	//		uiOptions:
	//			noManeuveringTrails: If TRUE, we do not show maneuvering trails in tactical
	//	waitingForUpdate: If TRUE, then we're waiting for result from server

	//	Options

	debugMode: false,
	};
	
//	General utilities ----------------------------------------------------------

var $MonospaceNumberArray =	[
	"\ue012",
	"\ue013",
	"\ue014",
	"\ue015",
	"\ue016",
	"\ue017",
	"\ue018",
	"\ue019",
	"\ue020",
	"\ue021",
	];

$Anacreon.color = function (value)
	{
	if (value == null || value.length == null || value.length < 3)
		return "#000000";
	else if (value.length >= 4)
		return "rgba(" + value[0] + "," + value[1] + "," + value[2] + "," + value[3]/255 + ")";
	else
		return "rgb(" + value[0] + "," + value[1] + "," + value[2] + ")";
	}

$Anacreon.debugPrices = function ()
	{
	var i;
	var traderSovereign;

	for (i = 0; i < $Anacreon.sovereignList.length; i++)
		{
		var sovereign = $Anacreon.sovereignList[i];
		if (sovereign != null
				&& sovereign.name == "Mesophon Traders Union")
			{
			traderSovereign = sovereign;
			break;
			}
		}

	if (traderSovereign == null)
		return null;

	var bureauOfTrade = traderSovereign.hasBureauOfTrade();
	if (bureauOfTrade == null)
		return null;

	var prices = {};
	for (i = 0; i < bureauOfTrade.buyPrices.length; i += 2)
		{
		var res = $Anacreon.designTypes[bureauOfTrade.buyPrices[i]];
		prices[res.unid] = { buy: bureauOfTrade.buyPrices[i + 1] }
		}

	for (i = 0; i < bureauOfTrade.sellPrices.length; i += 2)
		{
		var res = $Anacreon.designTypes[bureauOfTrade.sellPrices[i]];
		var result = prices[res.unid];
		if (result)
			result.sell = bureauOfTrade.sellPrices[i + 1];
		else
			prices[res.unid] = { sell:bureauOfTrade.sellPrices[i+1] };
		}

	return prices;
	}

$Anacreon.formatConvertToMonospaceNumbers = function (value)
	{
	var i;

	var result = "";
	for (i = 0; i < value.length; i++)
		{
		var charCode = value.charCodeAt(i);
		if (charCode >= 48 && charCode <= 57)
			result += $MonospaceNumberArray[charCode - 48];
		else
			result += value[i];
		}

	return result;
	}

$Anacreon.formatAge = function (ageInWatches)
	{
	if (ageInWatches == 0)
		return "just now";
	else if (ageInWatches == 1)
		return "one watch ago";
	else if (ageInWatches < 60)
		return (Math.round(ageInWatches) + " watches ago");
	else if (ageInWatches < 1440)
		{
		var ageInPeriods = Math.round(ageInWatches / 60);
		if (ageInPeriods == 1)
			return "one period ago";
		else
			return (ageInPeriods + " periods ago");
		}
	else
		{
		var ageInCycles = Math.round(ageInWatches / 1440);
		if (ageInCycles == 1)
			return "one cycle ago";
		else
			return (ageInCycles + " cycles ago");
		}
	}

$Anacreon.formatDuration = function (durationInWatches)
	{
	if (durationInWatches <= 0)
		return "0 watches";
	else if (durationInWatches == 1)
		return "one watch";
	else if (durationInWatches < 60)
		return (Math.round(durationInWatches) + " watches");
	else if (durationInWatches < 1440)
		{
		var durationInPeriods = Math.round(durationInWatches / 6) / 10;
		if (durationInPeriods == 1)
			return "one period";
		else
			return (durationInPeriods + " periods");
		}
	else
		{
		var durationInCycles = Math.round(durationInWatches / 144) / 10;
		if (durationInCycles == 1)
			return "one cycle";
		else
			return (durationInCycles + " cycles");
		}
	}

$Anacreon.formatDurationDigits = function (durationInWatches)
	{
	if (durationInWatches > 1440)
		{
		var cycles = Math.floor(durationInWatches / 1440);
		var watchesRemaining = (durationInWatches % 1440);
		var periods = Math.floor(watchesRemaining / 60);
		var watches = (watchesRemaining % 60);

		return cycles.toString() + ":" + (periods < 10 ? "0" + periods : periods.toString()) + "\u00b7" + (watches < 10 ? "0" + watches : watches.toString());
		}
	else if (durationInWatches > 60)
		{
		var periods = Math.floor(durationInWatches / 60);
		var watches = (durationInWatches % 60);

		return (periods < 10 ? "0" + periods : periods.toString()) + "\u00b7" + (watches < 10 ? "0" + watches : watches.toString());
		}
	else
		{
		if (durationInWatches < 10)
			return "0" + durationInWatches;
		else
			return durationInWatches.toString();
		}
	}

$Anacreon.formatNumberAsFloat = function (value, decimals)
	{
	if (decimals <= 0)
		return $Anacreon.formatNumberAsInteger(value);

	var factor = Math.pow(10, decimals);
	var whole = Math.round(value * factor).toString();
	while (whole.length < decimals + 1)
		whole = "0" + whole;

	var digits = whole.split("");
	var index = digits.length - decimals;

	digits.splice(index, 0, ".");
	index -= 3;

	while (index > 0)
		{
		digits.splice(index, 0, ",");
		index -= 3;
		}

	return digits.join("");
	}

$Anacreon.formatNumberAsInteger = function (value)
	{
	var number = Math.round(value).toString();
	var digits = number.split("");
	var index = digits.length - 3;

	while (index > 0)
		{
		digits.splice(index, 0, ",");
		index -= 3;
		}

	return digits.join("");
	}

$Anacreon.formatPopulation = function (population)
	{
	if (population < 100)
		return population + " million";
	else if (population < 1000)
		return (Math.round(population / 10) / 100) + " billion";
	else if (population < 10000)
		return (Math.round(population / 100) / 10) + " billion";
	else if (population < 1000000)
		return (Math.round(population / 1000)) + " billion";
	else
		return (Math.round(population / 10000) / 100) + " trillion";
	}

$Anacreon.getDateTime = function ()
	{
	var yearDay = $Anacreon.update % 1440;

	return ({
		year: $Anacreon.year0 + Math.floor($Anacreon.update / 1440),
		month: Math.floor(yearDay / 60) + 1,
		day: (yearDay % 60) + 1,
		});
	}

$Anacreon.getDesignType = function (unid)
	{
	var i;

	for (i = 0; i < $Anacreon.designTypes.length; i++)
		{
		var type = $Anacreon.designTypes[i];
		if (type && type.unid == unid)
			return type;
		}

	return null;
	}

$Anacreon.objFindNearest = function (x, y)

//	Returns the object nearest to the given coordinates.

	{
	var i;
	var objList = $Anacreon.objList;
	var total = objList.length;
	
	//	Find nearest object
	
	var bestDist2 = 0.0;
	var bestObj = null;
	for (i = 0; i < total; i++)
		{
		var obj = objList[i];
		if (obj == null)
			continue;
		
		var xDiff = obj.pos[0] - x;
		var yDiff = obj.pos[1] - y;
		var dist2 = xDiff * xDiff + yDiff * yDiff;
		
		if (dist2 < bestDist2 || bestObj == null)
			{
			bestObj = obj;
			bestDist2 = dist2;
			}
		}
		
	return bestObj;
	}

$Anacreon.percentComplete = function (updateComplete, totalUpdates)
	{
	//	Compute how many updates until we're done
	
	var now = new Date();
	var fracLeft = Math.max(0, ($Anacreon.nextWatchTime.getTime() - now.getTime()) / 60000.0);
	var updatesLeft = Math.max(0, (updateComplete - $Anacreon.update) + fracLeft - 1);

	if (updatesLeft > totalUpdates)
		return 0;
	
	return Math.min(1.0, (totalUpdates - updatesLeft) / totalUpdates);
	}

$Anacreon.resCreateTransferArray = function (sourceObj, destObj)

//	Returns a transferArray with resources from the two objects. A transfer
//	array is an array of structures. Each structure has the following fields:
//
//	type: The resource type ID of the resource
//	name: The name of the resource.
//	sourceCount: The count of resources at the source.
//	destCount: The count of resources at the dest.
//	transCount: The amount of resources to transfer. Positive values move from
//		the source to the dest. Negative values move the opposite direction.
//
//	The array is sorted in resource order (ships first).

	{
	function init (resMap, obj, isSource)
		{
		var i;
		var resources = obj.resources;
		if (resources == null)
			return;
		
		for (i = 0; i < resources.length; i += 2)
			{
			var typeID = resources[i];
			var resType = $Anacreon.designTypes[typeID];
			var count = resources[i + 1];

			//	If this is not cargo and this is not an FTL unit, then we 
			//	skip it.

			if (!resType.FTL && !resType.isCargo)
				continue;

			//	Add to our array

			if (resMap[typeID] == null)
				{
				resMap[typeID] = { 
						type: typeID,
						resType: resType,
						name: resType.nameDesc,
						sourceCount: (isSource ? count : 0),
						destCount: (isSource ? 0 : count),
						transCount: 0
						};
				}
			else
				{
				if (isSource)
					resMap[typeID].sourceCount = count;
				else
					resMap[typeID].destCount = count;
				}
			}
		}
		
	//	First generate a map of all resources (we use a map to collapse common
	//	resource types).
	
	var resMap = {};
	init(resMap, sourceObj, true);
	init(resMap, destObj, false);
	
	//	Now iterate over the map and add to the array.
	
	var transferArray = [];
	for (var i in resMap)
		transferArray.push(resMap[i]);
		
	//	Sort the array
	
	transferArray.sort(function (a, b) {
		//	FTL units go first

		if (a.resType.FTL && !b.resType.FTL)
			return -1;
		else if (b.resType.FTL && !a.resType.FTL)
			return 1;

		//	Units go before non-units

		else if (a.resType.category == "groundUnit" && b.resType.category != "groundUnit")
			return -1;
		else if (b.resType.category == "groundUnit" && a.resType.category != "groundUnit")
			return 1;

		//	Sort by name

		else if (a.name.toLowerCase() < b.name.toLowerCase())
			return -1;
		else if (a.name.toLowerCase() > b.name.toLowerCase())
			return 1;
		else
			return 0;
		});
		
	//	Done
	
	return transferArray;
	}

$Anacreon.sortResourceArray = function (resources)
	{
	var i;

	//	First convert to an array of arrays

	var toSort = [];
	for (i = 0; i < resources.length; i += 2)
		{
		toSort.push([
			$Anacreon.designTypes[resources[i]],
			resources[i + 1]
			]);
		}

	//	Sort the array.

	toSort.sort(function (a, b) {
		var aRes = a[0];
		var bRes = b[0];

		//	FTL units go first

		if (aRes.FTL && !bRes.FTL)
			return -1;
		else if (bRes.FTL && !aRes.FTL)
			return 1;

		//	Units go before non-units

		else if (aRes.category == "groundUnit" && bRes.category != "groundUnit")
			return -1;
		else if (bRes.category == "groundUnit" && aRes.category != "groundUnit")
			return 1;

		//	Sort by attack value

		else if (aRes.attackValue > bRes.attackValue)
			return -1;
		else if (bRes.attackValue > aRes.attackValue)
			return 1;

		//	Sort by name

		else if (aRes.nameDesc.toLowerCase() < bRes.nameDesc.toLowerCase())
			return -1;
		else if (aRes.nameDesc.toLowerCase() > bRes.nameDesc.toLowerCase())
			return 1;
		else
			return 0;
		});

	//	Now convert back

	var result = [];
	for (i = 0; i < toSort.length; i++)
		{
		result.push(toSort[i][0].id);
		result.push(toSort[i][1]);
		}

	return result;
	}
	
//	Main functions -------------------------------------------------------------

$Anacreon.processUpdate = function (updateList)
	{
	var i;

	$Anacreon.waitingForUpdate = false;

	//	Keep track of whether we are at war or not (if we are we need to get
	//	updates more frequently).
	
	var isAtWar = false;
	var updateObj = null;
	var historyObj = null;
	var newSelectionID = null;

	//	Clear all caches (we need to do this because sovereigns do not get 
	//	updated every cycle).

	for (i = 0; i < $Anacreon.sovereignList.length; i++)
		if ($Anacreon.sovereignList[i])
			$Anacreon.sovereignList[i].clearCaches();
	
	//	Loop over all server objects
	
	for (i = 0; i < updateList.length; i++)
		{
		var serverObj = updateList[i];
		var objClass = serverObj["class"];

		//	Update the appropriate structure based on the object class
		
		if (objClass == "battlePlan")
			{
			//	NOTE: We guarantee that a battlePlan update only appears if we don't
			//	have an update for the entire object (and vice versa).
			$Anacreon.objList[serverObj.id].battlePlan = serverObj.battlePlan;
			isAtWar = true;
			}
		else if (objClass == "destroyedSpaceObject")
			{
			$Anacreon.objList[serverObj.id] = null;
			}
		else if (objClass == "fleet")
			{
			$Anacreon.objList[serverObj.id] = new FleetObject(serverObj);
			}
		else if (objClass == "history")
			{
			historyObj = serverObj;
			}
		else if (objClass == "region")
			{
			$Anacreon.regionList[serverObj.id] = new Region(serverObj);
			}
		else if (objClass == "relationship")
			{
			//	NOTE: We guarantee that a relationship update only appears if we don't
			//	have an update for the entire object (and vice versa).
			$Anacreon.sovereignList[serverObj.id].relationship = serverObj.relationship;
			}
		else if (objClass == "selection")
			{
			newSelectionID = serverObj.id;
			}
		else if (objClass == "siege")
			{
			$Anacreon.siegeList[serverObj.id] = new SiegeObject(serverObj);
			}
		else if (objClass == "sovereign")
			{
			$Anacreon.sovereignList[serverObj.id] = new Sovereign(serverObj);
			}
		else if (objClass == "world")
			{
			var worldObj = new WorldObject(serverObj);
			$Anacreon.objList[serverObj.id] = worldObj;

			//	Is this world at war? If so, check to see if its something we 
			//	care about.
			
			if (worldObj.battlePlan && worldObj.battlePlan.sovereignID == $Anacreon.userInfo.sovereignID)
				isAtWar = true;
			}
		else if (objClass == "update")
			{
			$Anacreon.seq = serverObj.sequence;
			$Anacreon.update = serverObj.update;
			$Anacreon.year0 = serverObj.year0;
			
			//	Remember the update object
			
			updateObj = serverObj;
			}
		}

	//	Add history from the sovereign to each of the worlds

	if (historyObj)
		{
		for (i = 0; i < historyObj.history.length; i++)
			{
			var entry = historyObj.history[i];
			if (entry.objID)
				{
				var obj = $Anacreon.objList[entry.objID];
				if (obj)
					{
					if (obj.history == null)
						obj.history = [];

					obj.history.push(entry);
					}
				}
			}
		}

	//	If we have no empire, then we put up the message bar

	var sovereign = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];
	if (sovereign && sovereign.capitalID == null)
		$Map.addMessageBar({
			title: "Your empire has been destroyed.",
			buttonLabel: "Restart",
			buttonAction: (function (e)
				{
				restartGame();
				}),
			});
		
	//	Compute the time when the next update is scheduled.
	
	if (updateObj)
		{
		//	If we are at war and we're not in tactical display mode then we need 
		//	to get frequent updates
		
		if (isAtWar && $Map.nextTacticalTime == null)
			{
			$Anacreon.nextUpdateTime = new Date();
			$Anacreon.nextUpdateTime.setTime($Anacreon.nextUpdateTime.getTime() + 1000);
			}
			
		//	Otherwise we wait until the next watch.
		
		else
			{
			$Anacreon.nextUpdateTime = new Date();
			$Anacreon.nextUpdateTime.setTime($Anacreon.nextUpdateTime.getTime() + Math.max(1000, updateObj.nextUpdateTime));
			}

		//	Either way, remember when the server expects the next watch to start

		$Anacreon.nextWatchTime = new Date();
		$Anacreon.nextWatchTime.setTime($Anacreon.nextWatchTime.getTime() + updateObj.nextUpdateTime);
	    }
	else
        {
        $Anacreon.nextWatchTime = new Date();
		$Anacreon.nextWatchTime.setTime($Anacreon.nextWatchTime.getTime() + 1000);
        }

	//	If necessary select a new object

	if (newSelectionID != null)
		$Map.selectObjectByID(newSelectionID);
	}
	
$Anacreon.initSession = function (onInitialized)
	{
	function initGameInfo (chainedFunc)
		{
		$.getJSON("/api/getGameInfo", { authToken: $UserInfo.authToken, gameID: $Anacreon.gameID }, function (data) {
			if ($Hexarc.isError(data))
				{
				$Map.updateError = $Hexarc.getErrorMessage(data);
		        chainedFunc();
				return;
				}

			if (data.userInfo == null)
				{
				restartGame();
				$Map.updateError = "You are not part of this game.";
				chainedFunc();
				return;
				}

			//	Loop over all design types and add to cache
				
			var i;
			$Anacreon.designTypes = [];
			for (i = 0; i < data.scenarioInfo.length; i++)
				{
				var designType = data.scenarioInfo[i];

				//	This special object is about the scenario as a whole

				if (designType["class"] == "scenario")
					{
					$Anacreon.scenarioInfo = designType;
					}

				//	Otherwise, this is a design type

				else
					{
					$Anacreon.designTypes[designType.id] = new DesignType(designType);

					//	If this is the default space region, then remember it.

					if (designType.unid == "core.defaultSpace")
						$Anacreon.defaultSpaceRegion = $Anacreon.designTypes[designType.id];
					}
				}
					
			//	Get user info
				
			$Anacreon.userInfo = data.userInfo;
				
			//	Remember the independent empire ID (later this should come from the server)

			$Anacreon.independentID = 1;

			//	Get sovereigns
				
			$Anacreon.sovereignList = [];
			for (i = 0; i < data.sovereigns.length; i++)
				{
				var sovereign = data.sovereigns[i];
				$Anacreon.sovereignList[sovereign.id] = new Sovereign(sovereign);
				}
					
			//	Done
			
			initObjList(chainedFunc);
			});
		}
		
	function initObjList (chainedFunc)
		{
		$Anacreon.objList = [];
		$Anacreon.regionList = [];
		$Anacreon.siegeList = [];
		$Anacreon.seq = 0;
		
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
		            $Anacreon.processUpdate(data);

		        chainedFunc();
		        }),

		    error: (function (jqXHR, textStatus, errorThrown) {
		        $Anacreon.waitingForUpdate = false;
                $Map.updateError = textStatus;
                chainedFunc();
	    	    })
    		});
		}

	var gameID = $Hexarc.getURLParam("gameID");
	$Anacreon.gameID = gameID;
	var gameInfo;
	
	//	Initialize
	
	initGameInfo(onInitialized);
	}
	
//	DesignType object ----------------------------------------------------------
//
//	COMMON FIELDS
//
//	id: ID of the design type
//	class: One of:
//		"traitDef"
//		"resourceType"
//		"sovereignType"
//	nameDesc: name descriptor
//	shortName: short name (or null)
//	unid: UNID of design type
//
//	RESOURCE TYPES
//
//	category: One of:
//		"commodity"
//		"fixedUnit"
//		"groundUnit"
//		"LAMUnit"
//		"maneuveringUnit"
//		"orbitalUnit"
//		"weaponComponent"
//
//	isCargo: "true" if is cargo
//	isUnit: "true" if it is a unit
//	mass: Mass.
//	
//	UNITS (RESOURCE TYPE)
//
//	attackValue: Relative attack power.
//	cargoSpace: Cargo space required.
//	FTL: Speed of FTL ship (or null if no FTL)
//	stats: Array of field/value pairs
//
//	TRAITS
//
//	category: One of:
//		"culture"
//		"designation"
//		"feature"
//		"improvement"
//		"industry"
//		"rebellion"
//		"worldClass"
//	inheritFrom: If present, a list of traitIDs that we inherit from.
//
//	DESIGNATION (TRAIT)
//
//	exclusions: If non-null, list of traitIDs that prevent designation
//	exports: List of resourceIDs that we export (may be empty).
//	imageMedium: 128x128 icon
//	imageSmall: 48x48 icon
//	maxTechLevel: Maximum tech level for designation.
//	minTechLevel: Minimum tech level to designate.
//	primaryIndustry: TraitID of the primary industry, if any.
//	requirements: If non-null, list of traitIDs that are required to designate
//	role: One of:
//		"academy"
//		"foundation"
//		"imperialCapital"
//		"sectorCapital"
//		"shipyard"
//
//	IMPROVEMENT AND INDUSTRY (TRAIT)
//
//	buildTime: Watches to build (optional)
//	buildUpgrade: List of traitIDs to upgrade from (optional)
//	designationOnly: Can only be build by designating
//	minTechLevel: Minimum tech level to designate.
//	playerAlloc: If TRUE, player can change allocation
//	role: One of:
//		"academyIndustry"
//		"administration"
//		"componentIndustry"
//		"consumerGoodsIndustry"
//		"energyIndustry"
//		"groundDefenseIndustry"
//		"improvement"
//		"lifeSupport"
//		"planetDefense"
//		"rawMaterialIndustry"
//		"shipyardIndustry"
//		"spaceport"
//		"techAdvance"
//		"university"
//
//	WORLD CLASS (TRAIT)
//
//	imageLarge: 800x800 large icon
//		Image definition:
//		0.	ID of image
//		1.	X offset
//		2.	Y offset
//		3.	width
//		4.	height
//
//	imageSmall: 48x48 image icon

function DesignType (serverObj)
	{
	$.extend(this, serverObj);

	//	If this is an image then we add it to the page.

	if (this["class"] == "image")
		{
		var elementID = "idImage" + this.id;
		var imageSrc = "image.hexm?gameID=" + $Anacreon.gameID + "&imageUNID=" + encodeURIComponent(this.unid);
		var imageStyle = "display:none";

		$("body").append("<img id='" + elementID + "' src='" + imageSrc + "' style='" + imageStyle + "'/>");

		var selection = $("#" + elementID);
		selection.on("load", (function (e) {
			$Map.invalidate();
			}));

		this.imageElement = selection[0];
		}
	else if (this["class"] == "resourceType")
		{
		this.isUnit = (this.category == "fixedUnit" ||
				this.category == "groundUnit" ||
				this.category == "LAMUnit" ||
				this.category == "maneuveringUnit" ||
				this.category == "orbitalUnit");

		if (this.shortName == null)
			this.shortName = this.nameDesc;
		}
	}

DesignType.prototype.getImagePattern = function (ctx)
	{
	if (this.imagePattern == null)
		{
		var imageDesc = this.backgroundImage;
		if (imageDesc == null)
			return null;

		var imageType = $Anacreon.designTypes[imageDesc[0]];
		this.imagePattern = ctx.createPattern(imageType.imageElement, "repeat");
		}

	return this.imagePattern;
	}

DesignType.prototype.inheritsFrom = function (traitID)
	{
	var i;
	if (this.inheritFrom)
		{
		for (i = 0; i < this.inheritFrom.length; i++)
			if (this.inheritFrom[i] == traitID)
				return true;
		}

	return false;
	}

DesignType.prototype.paintIconMedium = function (ctx, xPos, yPos, cxWidth, cyHeight)
	{
	var imageDesc = this.imageMedium;
	if (imageDesc == null)
		{
		ctx.fillStyle = "#606060";
		ctx.fillRect(xPos, yPos, cxWidth, cyHeight);
		return;
		}

	var imageType = $Anacreon.designTypes[imageDesc[0]];
	if (imageType == null)
		return;

	ctx.drawImage(imageType.imageElement,
			imageDesc[1],
			imageDesc[2],
			imageDesc[3],
			imageDesc[4],
			xPos,
			yPos,
			cxWidth,
			cyHeight);
	}

DesignType.prototype.paintIconSmall = function (ctx, xPos, yPos, cxWidth, cyHeight)
	{
	var imageDesc = this.imageSmall;
	if (imageDesc == null)
		return;

	var imageType = $Anacreon.designTypes[imageDesc[0]];
	if (imageType == null)
		return;

	ctx.drawImage(imageType.imageElement,
			imageDesc[1],
			imageDesc[2],
			imageDesc[3],
			imageDesc[4],
			xPos,
			yPos,
			cxWidth,
			cyHeight);
	}

DesignType.prototype.supercedes = function (oldType)
	{
	var i;

	if (this.buildUpgrade)
		{
		for (i = 0; i < this.buildUpgrade.length; i++)
			{
			var prevType = $Anacreon.designTypes[this.buildUpgrade[i]];
			if (prevType.id == oldType.id || prevType.supercedes(oldType))
				return true;
			}
		}

	return false;
	}

//	Region Object --------------------------------------------------------------
//
//	FIELDS
//
//	class: "region"
//	id: ID of the region
//	shape: An array of points

function Region (serverObj)
	{
	$.extend(this, serverObj);
	}
	
//	Sovereign object -----------------------------------------------------------
//
//	FIELDS
//
//	class: "sovereign"
//	doctrine: The doctrine of the sovereign (may be null)
//	id: ID of the sovereign
//	isIndependent: True if this is an independent sovereign
//	name: Name of the sovereign
//	relationship: Our relationship with this sovereign
//		firstContact: Update on which we met
//		ourActions: Our past actions
//			attacksInitiated
//			offensivesInitiated
//			worldsConquered
//		theirActions: Their past actions
//			attacksInitiated
//			offensivesInitiated
//			worldsConquered
//	services: List of services offered to us. This is an
//			array of structures with the following fields:
//		type: One of the following:
//			resourceBuyer
//			seller
//	territory: Outline of territory (optional)
//	traits: An array of structures with the following fields:
//		traitID: The ID of the trait definition
//	seq: Sequence
//
//	capitalID: ID of capital (use getCapital() to access)
//	allJumpBeacons: List of objects with jump beacons
//	allLAMSites: List of worlds LAMs (use getLAMSites() to access)
//	allWorlds: List of world IDs (use getWorlds() to access)

function Sovereign (serverObj)
	{
	$.extend(this, serverObj);

	this.isIndependent = (this.id == $Anacreon.independentID);

	//	Convert all trait IDs into structures

	var traits = [];
	if (this.traits)
		{
		for (i = 0; i < this.traits.length; i++)
			if (typeof this.traits[i] == "number")
				traits[i] = { traitID: this.traits[i] };
			else
				traits[i] = this.traits[i];
		}

	this.traits = traits;
	}

Sovereign.prototype.clearCaches = function ()
	{
	this.allLAMSites = null;
	this.allJumpBeacons = null;
	}

Sovereign.prototype.composeText = function (text)
	{
	var i;
	var parts = text.split("%");
	var result = [];

	for (i = 0; i < parts.length; i++)
		{
		if (parts[i] == "EmpireName")
			result.push(this.name);
		else if (parts[i] == "Emperor")
			result.push("Emperor");
		else if (parts[i] == "His")
			result.push("His");
		else
			result.push(parts[i]);
		}

	return result.join("");
	}

Sovereign.prototype.getCapital = function ()
	{
	if (this.capitalID == null)
		{
		var i;
		var allWorlds = this.getWorlds();

		for (i = 0; i < allWorlds.length; i++)
			if ($Anacreon.designTypes[allWorld[i].designation].role == "imperialCapital")
				{
				this.capitalID = allWorlds[i].id;
				break;
				}
		}

	return $Anacreon.objList[this.capitalID];
	}

Sovereign.prototype.getDoctrineID = function ()
	{
	return this.doctrine;
	}

Sovereign.prototype.getJumpBeacons = function ()
	{
	var i;

	if (this.allJumpBeacons == null)
		{
		this.allJumpBeacons = [];
		var allWorlds = this.getWorlds();
		for (i = 0; i < allWorlds.length; i++)
			{
			var worldObj = allWorlds[i];
			if (worldObj.hasJumpBeacon)
				this.allJumpBeacons.push(worldObj);
			}
		}

	return this.allJumpBeacons;
	}

Sovereign.prototype.getLAMSites = function ()
	{
	var i;

	if (this.allLAMSites == null)
		{
		this.allLAMSites = [];
		var allWorlds = this.getWorlds();
		for (i = 0; i < allWorlds.length; i++)
			{
			var worldObj = allWorlds[i];
			var designationType = $Anacreon.designTypes[worldObj.designation];
			if (designationType.role == "citadel")
				this.allLAMSites.push(worldObj);
			}
		}

	return this.allLAMSites;
	}

Sovereign.prototype.getTrait = function (traitID, includeDoctrine)
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

	//	If we ask for it, include doctrine

	if (includeDoctrine)
		{
		if (traitID == this.doctrine)
			return { traitID: traitID };

		//	Check for inherited traits

		var theTrait = $Anacreon.designTypes[this.doctrine];
		if (theTrait && theTrait.inheritsFrom(traitID))
			return { traitID: traitID };
		}

	return null;
	}

Sovereign.prototype.getWorlds = function ()
	{
	var i;

	if (this.allWorlds == null)
		{
		var objList = $Anacreon.objList;
		var total = objList.length;
	
		//	Find all objects belonging to the sovereign
	
		this.allWorlds = [];
		for (i = 0; i < total; i++)
			{
			var obj = objList[i];
			if (obj == null || obj.sovereignID != this.id
					|| obj["class"] != "world")
				continue;
		
			this.allWorlds.push(obj.id);
			}
		}

	var result = [];
	for (i = 0; i < this.allWorlds.length; i++)
		result.push($Anacreon.objList[this.allWorlds[i]]);

	return result;
	}

Sovereign.prototype.hasBureauOfTrade = function ()
	{
	var i;

	if (this.traits == null)
		return null;

	for (i = 0; i < this.traits.length; i++)
		{
		var theTrait = this.traits[i];
		var traitType = $Anacreon.designTypes[this.traits[i].traitID];
		if (traitType.category == "bureauOfTrade")
			return theTrait;
		}

	return null;
	}

Sovereign.prototype.exportsResources = function ()
	{
	var attrib = $Anacreon.getDesignType("core.sellsResourcesAttribute");
	return (attrib != null && this.getTrait(attrib.id, true) != null);
	}
	
//	SpaceObject helper functions -----------------------------------------------

var SpaceObject = {};

SpaceObject.addResourcesInfoLines = function (lines, resources)
	{
	if (resources == null)
		return;
		
	var i;
	for (i = 0; i < resources.length; i += 2)
		{
		lines.push($Anacreon.designTypes[resources[i]].nameDesc);
		lines.push(resources[i + 1]);
		}
	}
	
SpaceObject.calcForceComposition = function (resources)
	{
	var i;

	var groundForces = 0;
	var spaceForces = 0;

	if (resources != null)
		{
		for (i = 0; i < resources.length; i += 2)
			{
			var resType = $Anacreon.designTypes[resources[i]];
			var resCount = resources[i + 1];

			if (resType.category == "groundUnit")
				groundForces += resCount * resType.attackValue;
			else if (resType.category == "fixedUnit" || resType.category == "maneuveringUnit" || resType.category == "orbitalUnit" || resType.category == "LAMUnit")
				spaceForces += resCount * resType.attackValue;
			}
		}

	return {
		groundForces: groundForces,
		spaceForces: spaceForces,
		};
	}

SpaceObject.calcFTLSpeed = function (resources)
	{
	var i;
	var FTL = null;

	for (i = 0; i < resources.length; i += 2)
		{
		var resType = $Anacreon.designTypes[resources[i]];

		if (resType.FTL
				&& (FTL == null || resType.FTL < FTL))
			FTL = resType.FTL;
		}

	return FTL;
	}

SpaceObject.populationValue = function (population)
	{
	if (population < 100)
		return population / 1000;
	else if (population < 1000)
		return Math.round(population / 10) / 100;
	else if (population < 10000)
		return Math.round(population / 100) / 10;
	else
		return Math.round(population / 1000);
	}

//	TradeRouteObject -----------------------------------------------------------
//
//	FIELDS
//
//	obj: Root of the trade route
//	partnerObj: Partner object
//	exports: List of exports from obj to partnerObj.
//		An array with three elements:
//		1.	resourceID being exported
//		2.	% of demand to export
//		3.	optimal amount we want to export last watch
//		4.	If non-null then this is how much we actually exported
//	imports: List of imports from partnerObj to obj.
//		An array with three elements:
//		1.	resourceID being imported
//		2.	% of demand to import
//		3.	amount we want to import
//		4.	If non-null then this is how much we actually imported.

function TradeRouteObject (obj, tradeRoute)
	{
	this.kind = "tradeRoute";

	this.obj = obj;
	this.partnerObj = $Anacreon.objList[tradeRoute.partnerObjID];
	this.imports = tradeRoute.imports;
	this.exports = tradeRoute.exports;
	this.importTech = tradeRoute.importTech;
	this.exportTech = tradeRoute.exportTech;
	this.buyImports = tradeRoute.buyImports;
	this.purchases = tradeRoute.purchases;
	this.sellExports = tradeRoute.sellExports;
	this.sales = tradeRoute.sales;

	//	en-dash to separate the two worlds.

	this.name = this.obj.name + "\u2013" + this.partnerObj.name + " Trade Route";
	}

TradeRouteObject.prototype.canBeRenamed = function ()
	{
	return false;
	}

TradeRouteObject.prototype.drawGalacticMapBackground = function (ctx, mapMetrics, uiMode)
	{
	}

TradeRouteObject.prototype.drawGalacticMapSelection = function (ctx)
	{
	//	Compute the position of the route based on the objects.

	var xToPartner = this.partnerObj.mapPosX - this.obj.mapPosX;
	var yToPartner = this.partnerObj.mapPosY - this.obj.mapPosY;
	var xLineCenter = this.obj.mapPosX + (xToPartner / 2);
	var yLineCenter = this.obj.mapPosY + (yToPartner / 2);

	//	Draw

	MapHelper.paintGalacticMapSelection(ctx, xLineCenter, yLineCenter, 8);
	}
	
TradeRouteObject.prototype.drawGalacticMapForeground = function (ctx, mapMetrics, uiMode)
	{
	}

TradeRouteObject.prototype.getInfoPanes = function () 
	{
	return [
		{	tabLabel: "Overview",
			
			paneDesc: {
				cxStdTile: 120,
				cyStdTile: 42,
				
				onGetTileList: (function (canvasGrid, data)

					//	data:
					//
					//		obj: The selected object. A TradeRouteObject.
			
					{
					var i;
					var tradeRoute = data.obj;
					var tileList = [];

					//	List all imports and exports

					if (tradeRoute.sales)
						InfoPaneHelper.createSalesTiles(tileList,
								tradeRoute.partnerObj,
								tradeRoute.obj,
								tradeRoute.sales);

					InfoPaneHelper.createTradeResourceTiles(tileList,
							tradeRoute.obj,
							tradeRoute.partnerObj,
							tradeRoute.imports);

					if (tradeRoute.importTech)
						InfoPaneHelper.createTechImportTile(tileList,
								tradeRoute.obj,
								tradeRoute.partnerObj,
								tradeRoute.importTech);

					if (tradeRoute.purchases)
						InfoPaneHelper.createSalesTiles(tileList,
								tradeRoute.obj,
								tradeRoute.partnerObj,
								tradeRoute.purchases);

					InfoPaneHelper.createTradeResourceTiles(tileList,
							tradeRoute.partnerObj,
							tradeRoute.obj,
							tradeRoute.exports);

					if (tradeRoute.exportTech)
						InfoPaneHelper.createTechImportTile(tileList,
								tradeRoute.partnerObj,
								tradeRoute.obj,
								tradeRoute.exportTech);

					return tileList;
					}),
				},
			
			getCommandList: (function (objSelected)
				{
				var commandList = [];
				var tradeRoute = objSelected;
				var isForeign = (tradeRoute.obj.sovereignID != $Anacreon.userInfo.sovereignID) && (tradeRoute.partnerObj.sovereignID != $Anacreon.userInfo.sovereignID);
				var sovereign = $Anacreon.sovereignList[$Anacreon.userInfo.sovereignID];

				//	Sell Resources

				if (!isForeign
						&& tradeRoute.buyImports
						&& tradeRoute.partnerObj.sovereignID == $Anacreon.userInfo.sovereignID
						&& tradeRoute.partnerObj.isTradingHub()
						&& sovereign.exportsResources())
					{
					commandList.push({
						label: "Sell",
						data: { tradeRoute: objSelected },
						onCommand: (function (e)
							{
							var obj = e.data.tradeRoute.obj;
							var partnerObj = e.data.tradeRoute.partnerObj;

							//	Figure out which resources we can sell

							var resToSell = partnerObj.calcResourcesToSell(e.data.tradeRoute);
							if (resToSell == null)
								{
								infoDialog({ dlgMessage: "You have no other resource types to sell. Import more resource types to " + partnerObj.name + "."});
								return;
								}

							worldSellResourcesDialog(partnerObj, obj, null, resToSell);
							})
						});
					}

				//	Stop

				if (!isForeign)
					{
					commandList.push({
						label: "Stop Trade",
						data: { tradeRoute: objSelected },
						onCommand: (function (e)
							{
							var obj = e.data.tradeRoute.obj;
							var partnerObj = e.data.tradeRoute.partnerObj;
							worldRemoveTradeRoute(obj, partnerObj);
							})
						});
					}

				return commandList;
				}),
			}
		];
	}

TradeRouteObject.prototype.getSpaceObject = function ()
	{
	return this.obj;
	}

TradeRouteObject.prototype.getSpaceObjectID = function ()
	{
	return this.obj.id;
	}

TradeRouteObject.prototype.refreshSelection = function ()
	{
	var i;
	var obj = $Anacreon.objList[this.obj.id];
	var foundRoute = null;

	var routeList = (obj ? obj.tradeRoutes : null);
	if (routeList)
		{
		for (i = 0; i < routeList.length; i++)
			{
			var tradeRoute = routeList[i];
			if (tradeRoute.partnerObjID == $Map.objSelected.partnerObj.id)
				{
				foundRoute = tradeRoute;
				break;
				}
			}
		}

	if (foundRoute)
		return new TradeRouteObject(obj, foundRoute);
	else if (obj)
		return obj;
	else
		return null;
	}

//	Tech Levels ----------------------------------------------------------------

$Anacreon.techLevels = [
	{	name: "none",
		techLevel: 0,
		},
	
	{	name: "pre-industrial",
		techLevel: 1,
		},
		
	{	name: "industrial",
		techLevel: 2,
		},
		
	{	name: "atomic",
		techLevel: 3,
		},
		
	{	name: "digital",
		techLevel: 4,
		},
		
	{	name: "spacefaring",
		techLevel: 5,
		},
		
	{	name: "fusion",
		techLevel: 6,
		},
		
	{	name: "biotech",
		techLevel: 7,
		},
		
	{	name: "antimatter",
		techLevel: 8,
		},
		
	{	name: "quantum",
		techLevel: 9,
		},
		
	{	name: "post-industrial",
		techLevel: 10,
		},
	];
	