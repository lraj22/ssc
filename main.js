// main.js
// the logic of the operation!

// variablization of all [id]s
document.querySelectorAll("[id]").forEach(function (e) { window[e.id] = e; });

function tick () {
	// update time view
	var d = new Date();
	var hours = (d.getHours() % 12) || 12;
	var minutes = d.getMinutes().toString().padStart(2, "0");
	timeView.textContent = hours + ":" + minutes;
	
	// to next tick
	requestAnimationFrame(tick);
}

// page visibility management
var showModes = ["showMain", "showSchedule"];
function setShow (mode) {
	for (var index in showModes) {
		document.body.classList.remove(showModes[index]);
	}
	document.body.classList.add(mode);
}

scheduleBtn.onclick = function () {
	setShow("showSchedule");
	addScheduleBlock();
};
exitScheduleView.onclick = saveSchedule.onclick = function () {
	setShow("showMain");
};

// useful variables
var hints = {
	"schName": "Give this schedule a name. For example: 'Regular Schedule', 'Late Start', 'Block A', etc.",
	"schPeriods": "Add some periods. Ex. class periods, passing periods, lunch, and anything else you want to add.",
	"schPeriodName": "Name of period, ex. First period, 1st-2nd passing period, Lunch, etc.",
	"schPeriodStart": "Start of period, ex. 9:00 AM",
	"schPeriodEnd": "End of period, ex. 10:00 AM",
	"schDays": "Which days of the week is this schedule effective? For example, all weekdays, only Monday, etc.",
	"periodMoveUp": "Move this period up",
	"periodRemove": "Remove this period",
	"periodMoveDown": "Move this period down",
};
var lastUsedScheduleId = 1;
var lastUsedPeriodIds = [];
var _ = ""; // ${} placeholder

addSchedule.onclick = function () {
	addScheduleBlock();
};

function addPeriod (schId) {
	var periods = document.getElementById("periods" + schId);
	var periodId = lastUsedPeriodIds[schId - 1]++;
	var period = document.createElement("div");
	period.id = "period" + schId + "_" + periodId;
	period.classList.add("period");
	var periodNumber = periods.childElementCount + 1;
	period.insertAdjacentHTML("beforeend", `<label for="periodName${schId}_${periodId}">Name: </label>
<input type="text" id="periodName${schId}_${periodId}" title="${hints.schPeriodName}" value="Period ${periodNumber}"><br><br>
<label for="periodStart${schId}_${periodId}">Starts: </label>
<input type="time" id="periodStart${schId}_${periodId}" title="${hints.schPeriodStart}">
<div class="floatRight">
	<label for="periodEnd${schId}_${periodId}">Ends: </label>
	<input type="time" id="periodEnd${schId}_${periodId}" title="${hints.schPeriodEnd}">
</div><br><br>
<div class="topRightBtnMenu">
	<span class="material-symbols-outlined" onclick="movePeriodUp(${schId},${periodId})" data-purpose="moveUp" title="${hints.periodMoveUp}">move_up</span>
	<span class="material-symbols-outlined textDanger" onclick="removePeriod(${schId},${periodId})" data-purpose="remove" title="${hints.periodRemove}">delete</span>
	<span class="material-symbols-outlined" onclick="movePeriodDown(${schId},${periodId})" data-purpose="moveDown" title="${hints.periodMoveDown}">move_down</span>
</div>`);
	periods.appendChild(period);
}

function addScheduleBlock () {
	var schBlock = document.createElement("div");
	schBlock.classList.add("scheduleBlock");
	var schId = lastUsedScheduleId++;
	lastUsedPeriodIds[schId - 1] = 1;
	schBlock.id = "schedule" + schId;
	schBlock.insertAdjacentHTML("beforeend", `<div title="${hints.schName}">
	<label for="schNameInput" class="schLabel">Schedule name</label>
	<input type="text" id="schNameInput" value="Schedule ${schId}">
</div>
<div title="${hints.schPeriods}">
	<label class="schLabel">Periods</label>
	<div class="periodsBlock" id="periods${schId}"></div>
	<button class="addPeriod" id="addPeriod${schId}" onclick="addPeriod(${schId})">ADD PERIOD</button>
</div>
<div title="${hints.schDays}">
	<label class="schLabel">Days of the week</label>
	<input type="checkbox" id="sunday${schId}"><label for="sunday${schId}"> Sunday</label><br>
	<input type="checkbox" id="monday${schId}"><label for="monday${schId}"> Monday</label><br>
	<input type="checkbox" id="tuesday${schId}"><label for="tuesday${schId}"> Tuesday</label><br>
	<input type="checkbox" id="wednesday${schId}"><label for="wednesday${schId}"> Wednesday</label><br>
	<input type="checkbox" id="thursday${schId}"><label for="thursday${schId}"> Thursday</label><br>
	<input type="checkbox" id="friday${schId}"><label for="friday${schId}"> Friday</label><br>
	<input type="checkbox" id="saturday${schId}"><label for="saturday${schId}"> Saturday</label><br>
</div>
<div class="buttonContainer">
<button class="btnInfo" onclick="moveScheduleUp(${schId})" data-purpose="moveUp">Move up</button>
<button class="btnDanger" onclick="removeSchedule(${schId})" data-purpose="remove">Remove</button>
	<button class="btnInfo" onclick="moveScheduleDown(${schId})" data-purpose="moveDown">Move down</button>
</div>`);
	scheduleContainer.appendChild(schBlock);
}

function removeSchedule (schId) {
	document.getElementById("schedule" + schId).remove();
}

function moveScheduleDown (schId) {
	var currentSchedule = document.getElementById("schedule" + schId);
	var nextSchedule = currentSchedule.nextElementSibling;
	if (nextSchedule) {
		nextSchedule.insertAdjacentElement("afterend", currentSchedule);
	}
}

function moveScheduleUp (schId) {
	var currentSchedule = document.getElementById("schedule" + schId);
	var previousSchedule = currentSchedule.previousElementSibling;
	if (previousSchedule) {
		previousSchedule.insertAdjacentElement("beforebegin", currentSchedule);
	}
}

function removePeriod (schId, periodId) {
	document.getElementById("period" + schId + "_" + periodId).remove();
}

function movePeriodDown (schId, periodId) {
	var currentPeriod = document.getElementById("period" + schId + "_" + periodId);
	var nextPeriod = currentPeriod.nextElementSibling;
	if (nextPeriod) {
		nextPeriod.insertAdjacentElement("afterend", currentPeriod);
	}
}

function movePeriodUp (schId, periodId) {
	var currentPeriod = document.getElementById("period" + schId + "_" + periodId);
	var previousPeriod = currentPeriod.previousElementSibling;
	if (previousPeriod) {
		previousPeriod.insertAdjacentElement("beforebegin", currentPeriod);
	}
}

requestAnimationFrame(tick);
