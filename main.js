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

scheduleBtn.addEventListener("click", function () {
	setShow("showSchedule");
	if (!scheduleContainer.childElementCount) addScheduleBlock();
});
exitScheduleView.addEventListener("click", function () {
	var unsavedChangesExist = recalcUnsavedChanges();
	if (unsavedChangesExist) {
		if (confirm("You have unsaved changes - exiting will delete them! Are you sure?")) {
			setCurrentSchedules(JSON.parse(lastSavedSchedule));
			recalcUnsavedChanges();
			setShow("showMain");
		}
	} else setShow("showMain");
});
saveSchedule.addEventListener("click", function () {
	saveState();
	recalcUnsavedChanges();
	setShow("showMain");
});
deleteAll.addEventListener("click", function () {
	if (!confirm("Are you sure you want to delete all schedules? This is irreversible!")) return;
	scheduleContainer.innerHTML = "";
	saveState();
	recalcUnsavedChanges();
	setShow("showMain");
});

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

addSchedule.addEventListener("click", function () {
	addScheduleBlock();
});

function addPeriod (schId) {
	var periods = document.getElementById("periods" + schId);
	var periodId = lastUsedPeriodIds[schId - 1]++;
	var period = document.createElement("div");
	period.id = "period" + schId + "_" + periodId;
	period.setAttribute("data-id", periodId);
	period.classList.add("period");
	var periodNumber = periods.childElementCount + 1;
	period.insertAdjacentHTML("beforeend", `<label for="periodName${schId}_${periodId}">Name: </label>
<input type="text" oninput="recalcUnsavedChanges()" id="periodName${schId}_${periodId}" title="${hints.schPeriodName}" value="Period ${periodNumber}"><br><br>
<label for="periodStart${schId}_${periodId}">Starts: </label>
<input type="time" oninput="recalcUnsavedChanges()" id="periodStart${schId}_${periodId}" title="${hints.schPeriodStart}">
<div class="floatRight">
	<label for="periodEnd${schId}_${periodId}">Ends: </label>
	<input type="time" oninput="recalcUnsavedChanges()" id="periodEnd${schId}_${periodId}" title="${hints.schPeriodEnd}">
</div><br><br>
<div class="topRightBtnMenu">
	<span class="material-symbols-outlined" onclick="movePeriodUp(${schId},${periodId})" data-purpose="moveUp" title="${hints.periodMoveUp}">move_up</span>
	<span class="material-symbols-outlined textDanger" onclick="removePeriod(${schId},${periodId})" data-purpose="remove" title="${hints.periodRemove}">delete</span>
	<span class="material-symbols-outlined" onclick="movePeriodDown(${schId},${periodId})" data-purpose="moveDown" title="${hints.periodMoveDown}">move_down</span>
</div>`);
	periods.appendChild(period);
	recalcUnsavedChanges();
	return periodId;
}

function addScheduleBlock () {
	var schBlock = document.createElement("div");
	schBlock.classList.add("scheduleBlock");
	var schId = lastUsedScheduleId++;
	lastUsedPeriodIds[schId - 1] = 1;
	schBlock.id = "schedule" + schId;
	schBlock.setAttribute("data-id", schId);
	schBlock.insertAdjacentHTML("beforeend", `<div title="${hints.schName}">
	<label for="schNameInput${schId}" class="schLabel">Schedule name</label>
	<input type="text" oninput="recalcUnsavedChanges()" id="schNameInput${schId}" value="Schedule ${schId}">
</div>
<div title="${hints.schPeriods}">
	<label class="schLabel">Periods</label>
	<div class="periodsBlock" id="periods${schId}"></div>
	<button class="addPeriod" id="addPeriod${schId}" onclick="addPeriod(${schId})">ADD PERIOD</button>
</div>
<div id="days${schId}" title="${hints.schDays}">
	<label class="schLabel">Days of the week</label>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="sunday${schId}"><label for="sunday${schId}"> Sunday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="monday${schId}"><label for="monday${schId}"> Monday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="tuesday${schId}"><label for="tuesday${schId}"> Tuesday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="wednesday${schId}"><label for="wednesday${schId}"> Wednesday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="thursday${schId}"><label for="thursday${schId}"> Thursday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="friday${schId}"><label for="friday${schId}"> Friday</label><br>
	<input type="checkbox" oninput="recalcUnsavedChanges()" id="saturday${schId}"><label for="saturday${schId}"> Saturday</label><br>
</div>
<div class="buttonContainer">
<button class="btnInfo" onclick="moveScheduleUp(${schId})" data-purpose="moveUp">Move up</button>
<button class="btnDanger" onclick="removeSchedule(${schId})" data-purpose="remove">Remove</button>
	<button class="btnInfo" onclick="moveScheduleDown(${schId})" data-purpose="moveDown">Move down</button>
</div>`);
	scheduleContainer.appendChild(schBlock);
	recalcUnsavedChanges();
	return schId;
}

var daysBitmap = {
	"sunday": 64,
	"monday": 32,
	"tuesday": 16,
	"wednesday": 8,
	"thursday": 4,
	"friday": 2,
	"saturday": 1,
};

function currentSchedulesToJSON () {
	var schedulesObj = [];
	scheduleContainer.querySelectorAll(".scheduleBlock").forEach(function (schBlock) {
		var schObj = {
			"name": "<unset>",
			"periods": [],
			"days": 0,
		};
		var schId = parseInt(schBlock.getAttribute("data-id"));
		schObj.name = document.getElementById("schNameInput" + schId).value;
		var days = document.getElementById("days" + schId);
		var dayBitfield = 0;
		days.querySelectorAll("input").forEach(function (dayCheckbox) {
			var dayName = dayCheckbox.id.replace(schId, "");
			if (dayCheckbox.checked) dayBitfield |= daysBitmap[dayName];
		});
		schObj.days = dayBitfield;
		schBlock.querySelectorAll(".period").forEach(function (period) {
			var periodObj = {
				"name": "<unset>",
				"starts": "",
				"ends": "",
			};
			var periodId = parseInt(period.getAttribute("data-id"));
			var combinedId = schId + "_" + periodId;
			periodObj.name = document.getElementById("periodName" + combinedId).value;
			periodObj.starts = document.getElementById("periodStart" + combinedId).value;
			periodObj.ends = document.getElementById("periodEnd" + combinedId).value;
			schObj.periods.push(periodObj);
		});
		schedulesObj.push(schObj);
	});
	return schedulesObj;
}
function setCurrentSchedules (schedules) {
	scheduleContainer.innerHTML = "";
	schedules.forEach(function (savedSchedule) {
		var schId = addScheduleBlock();
		document.getElementById("schNameInput" + schId).value = savedSchedule.name;
		Object.keys(daysBitmap).forEach(function (dayName) {
			if (savedSchedule.days & daysBitmap[dayName]) {
				document.getElementById(dayName + schId).checked = true;
			}
		});
		savedSchedule.periods.forEach(function (period) {
			var periodId = addPeriod(schId);
			var combinedId = schId + "_" + periodId;
			document.getElementById("periodName" + combinedId).value = period.name;
			document.getElementById("periodStart" + combinedId).value = period.starts;
			document.getElementById("periodEnd" + combinedId).value = period.ends;
		});
	});
}
var lastSavedSchedule = null;
function saveState () {
	var schedulesJSONified = currentSchedulesToJSON();
	lastSavedSchedule = JSON.stringify(schedulesJSONified);
	localforage.setItem("savedSchedules", schedulesJSONified);
	unsavedChanges.className = "";
}

// load existing schedules
localforage.getItem("savedSchedules").then(function (savedSchedules) {
	if (!savedSchedules) return;
	setCurrentSchedules(savedSchedules);
	lastSavedSchedule = JSON.stringify(savedSchedules);
});

function recalcUnsavedChanges () {
	if (lastSavedSchedule === null) return false;
	var currentSchedules = currentSchedulesToJSON();
	if (currentSchedules.length) {
		scheduleBtn.innerHTML = `<span class="material-symbols-outlined">edit</span>`;
	} else {
		scheduleBtn.innerHTML = "+ Add Schedule";
	}
	var schedulesStr = JSON.stringify(currentSchedules);
	var unsavedChangesExist = (schedulesStr !== lastSavedSchedule);
	unsavedChanges.className = (unsavedChangesExist ? "": "hidden");
	return unsavedChangesExist;
}

function removeSchedule (schId) {
	document.getElementById("schedule" + schId).remove();
	recalcUnsavedChanges();
}

function moveScheduleDown (schId) {
	var currentSchedule = document.getElementById("schedule" + schId);
	var nextSchedule = currentSchedule.nextElementSibling;
	if (nextSchedule) {
		nextSchedule.insertAdjacentElement("afterend", currentSchedule);
	}
	recalcUnsavedChanges();
}

function moveScheduleUp (schId) {
	var currentSchedule = document.getElementById("schedule" + schId);
	var previousSchedule = currentSchedule.previousElementSibling;
	if (previousSchedule) {
		previousSchedule.insertAdjacentElement("beforebegin", currentSchedule);
	}
	recalcUnsavedChanges();
}

function removePeriod (schId, periodId) {
	document.getElementById("period" + schId + "_" + periodId).remove();
	recalcUnsavedChanges();
}

function movePeriodDown (schId, periodId) {
	var currentPeriod = document.getElementById("period" + schId + "_" + periodId);
	var nextPeriod = currentPeriod.nextElementSibling;
	if (nextPeriod) {
		nextPeriod.insertAdjacentElement("afterend", currentPeriod);
	}
	recalcUnsavedChanges();
}

function movePeriodUp (schId, periodId) {
	var currentPeriod = document.getElementById("period" + schId + "_" + periodId);
	var previousPeriod = currentPeriod.previousElementSibling;
	if (previousPeriod) {
		previousPeriod.insertAdjacentElement("beforebegin", currentPeriod);
	}
	recalcUnsavedChanges();
}

requestAnimationFrame(tick);
