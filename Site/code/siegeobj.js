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

SiegeObject.prototype.getStatusText = function ()
	{
	if (this.status == "attackFailing")
		{
		return "Attackers unable to break through our defenses.";
		}
	else if (this.status == "attackWinning")
		{
		return "Attackers overpowering defenses.";
		}
	else if (this.status == "defenseFailing")
		{
		if (this.timeLeft > 1)
			return "Defenses will fail in " + $Anacreon.formatDuration(siege.timeLeft);
		else
			return "Defenses will fail imminently.";
		}
	else if (this.status == "defenseWinning")
		{
		return "Defenders degrading siege forces.";
		}
	else
		return "Attackers establishing siege.";
	}
