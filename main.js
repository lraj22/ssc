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
	setShow("showSchedule")
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
	var addPeriodBtn = document.getElementById("addPeriod" + schId);
	var period = document.createElement("div");
	period.classList.add("period");
	var periodNumber = periods.childElementCount;
	period.insertAdjacentHTML("beforeend", `<label for="periodName${schId}_${periodId}">Name</label>
<input type="text" id="periodName${schId}_${periodId}" title="${hints.schPeriodName}" value="Period ${periodNumber}"><br><br>
<label>Time</label>
<input type="time" id="periodStart${schId}_${periodId}" title="${hints.schPeriodStart}">
<span> to </span>
<input type="time" id="periodEnd${schId}_${periodId}" title="${hints.schPeriodEnd}"><br><br>`);
	addPeriodBtn.insertAdjacentElement("beforebegin", period);
}

function addScheduleBlock () {
	var schBlock = document.createElement("div");
	schBlock.classList.add("scheduleBlock");
	var schId = lastUsedScheduleId++;
	lastUsedPeriodIds[schId - 1] = 1;
	schBlock.id = "schedule" + schId;
	schBlock.insertAdjacentHTML("beforeend", `<div title="${hints.schName}">
	<label for="schNameInput" class="schLabel">Schedule name</label><input type="text" id="schNameInput">
</div>
<div title="${hints.schPeriods}">
	<label class="schLabel">Periods</label>
	<div class="periodsBlock" id="periods${schId}">
		<button class="addPeriod" id="addPeriod${schId}" onclick="addPeriod(${schId})">ADD PERIOD</button>
	</div>
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
</div>`);
	scheduleContainer.appendChild(schBlock);
}

requestAnimationFrame(tick);
