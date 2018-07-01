//	siegeobj.js
//
//	Implements SiegeObject class
//	Copyright (c) 2018 Kronosaur Productions, LLC. All Rights Reserved.
//
//  FIELDS
//
//  id: The numeric ID of the object.
//
//	class: "siege"

function SiegeObject (serverObj)
	{
	$.extend(this, serverObj);
	
	this.kind = "spaceObject";
	}

SiegeObject.prototype.getSpaceObject = function ()
	{
	//	We return the anchor object (the world we're sieging) so that the
	//	info pane can be correct.
	
	return $Anacreon.objList[this.anchorObjID];
	}

SiegeObject.prototype.getSpaceObjectID = function ()
	{
	return this.anchorObjID;
	}

SiegeObject.prototype.getStatusText = function ()
	{
	var locationObj = $Anacreon.objList[this.anchorObjID];
	var isDefender = (locationObj && locationObj.sovereignID == $Anacreon.userInfo.sovereignID);
	var isAttacker = this.sovereignID == $Anacreon.userInfo.sovereignID;

	if (this.status == null)
		{
		return "No information available on siege status.";
		}
	else if (this.status == "attackFailing")
		{
		if (isDefender)
			return "Attackers unable to break through our defenses.";
		else
			{
			var minForces = $Anacreon.formatNumberAsFloat(this.minAttackForces / 100.0, 1);
			return "Siege forces unable to break through defenses (at least " + minForces + " needed).";
			}
		}
	else if (this.status == "attackWinning")
		{
		if (isDefender)
			return "Attackers overpowering defenses.";
		else
			return "Siege forces overpowering defenses.";
		}
	else if (this.status == "defenseFailing")
		{
		if (this.timeLeft > 1)
			{
			if (isDefender)
				return "Defenses will fail in " + $Anacreon.formatDuration(this.timeLeft);
			else
				return "Siege forces will break through defenses in " + $Anacreon.formatDuration(this.timeLeft);
			}
		else
			{
			if (isDefender)
				return "Defenses will fail imminently.";
			else
				return "Siege success imminent.";
			}
		}
	else if (this.status == "defenseWinning")
		{
		if (isDefender)
			return "Defenders degrading siege forces.";
		else
			return "Siege forces being overpowered by defenders.";
		}
	else
		return "Attackers establishing siege.";
	}
