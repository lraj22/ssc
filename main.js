// main.js
// the logic of the operation!

function tick () {
	// update time view
	var d = new Date();
	var hours = (d.getHours() % 12) || 12;
	var minutes = d.getMinutes().toString().padStart(2, "0");
	timeView.textContent = hours + ":" + minutes;
	
	// time left/time since views
	var currentPeriod = getCurrentPeriod();
	if (currentPeriod) {
		timePeriod.textContent = currentPeriod.name;
		timeOver.textContent = msToTimeDiff(d - currentPeriod.starts, Math.ceil) + " over";
		timeLeft.textContent = msToTimeDiff(currentPeriod.ends - d, Math.floor) + " left";
	} else {
		timePeriod.textContent = "";
		timeOver.textContent = "";
		timeLeft.textContent = "";
	}
	
	// to next tick
	requestAnimationFrame(tick);
}

// left 25% of screen to show time over, right 75% to show time left (more common)
window.addEventListener("mousemove", function (e) {
	var percentAcross = (e.clientX / window.innerWidth * 100).toFixed();
	if (percentAcross < 25) document.body.dataset.pointerpos = "left";
	else if (percentAcross > 75) document.body.dataset.pointerpos = "right";
	else document.body.dataset.pointerpos = "center";
});

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
			setCurrentSchedules(lastSavedSchedules);
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

addSchedule.addEventListener("click", function () {
	addScheduleBlock();
});

// load existing schedules
localforage.getItem("savedSchedules").then(function (savedSchedules) {
	if (!savedSchedules) return;
	setCurrentSchedules(savedSchedules);
	lastSavedSchedules = savedSchedules;
	recalcUnsavedChanges();
	var loadURL = new URL(location.href);
	var serializedSchedulesV1 = loadURL.searchParams.get("sv1");
	if (serializedSchedulesV1) {
		var deserialized = deserializeSchCode(serializedSchedulesV1);
		if (JSON.stringify(lastSavedSchedules) !== JSON.stringify(deserialized)) {
			setUsingURL(true);
			setCurrentSchedules(deserialized);
			lastSavedSchedules = deserialized;
		}
	} else setUsingURL(false);
});

backToOwnSchedules.addEventListener("click", function () {
	var currentURL = new URL(location.href);
	currentURL.searchParams.delete("sv1");
	location.assign(currentURL);
});

uploadSchedules.addEventListener("click", function () {
	uploadFileInput.click();
});

uploadFileInput.addEventListener("change", function (changeEvent) {
	var file = changeEvent.target.files[0];
	if (!file) return;
	var reader = new FileReader();
	reader.readAsText(file, "utf-8");
	reader.onload = function (readerEvent) {
		try {
			var schedulesJSON = JSON.parse(readerEvent.target.result);
			var success = setCurrentSchedules(schedulesJSON);
			if (!success) {
				alert("The file you uploaded may be corrupted - there was an error in loading the schedules.");
			}
		} catch (e) {
			alert("The file you uploaded could not be parsed correctly. It may be corrupted, or it may just be the wrong file.");
		}
	};
});

shareSchedules.addEventListener("click", function () {
	shareMenu.classList.toggle("hidden");
});

downloadSchedules.addEventListener("click", function () {
	if (recalcUnsavedChanges()) {
		alert("You have unsaved changes. Please save/discard first, then download your schedules.");
		return;
	}
	var fileTitle = prompt("Give your schedules a title (hint: school name, regular schedules, etc.)");
	if (fileTitle === null) return;
	fileTitle = fileTitle.trim() || "Schedules";
	var downloadLink = document.createElement("a");
	downloadLink.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastSavedSchedules, null, "\t")));
	downloadLink.setAttribute("download", fileTitle + ".json");
	downloadLink.click();
});

copySchedulesLink.addEventListener("click", function () {
	if (recalcUnsavedChanges()) {
		alert("You have unsaved changes. Please save/discard first, then download your schedules.");
		return;
	}
	var serialized = serializeSchedules();
	var schedulesLink = new URL(location.href);
	schedulesLink.searchParams.set("sv1", serialized);
	navigator.clipboard.writeText(schedulesLink.toString()).then(function () {
		alert("The link has been successfully copied! Share it with your classmates!\n" + schedulesLink.toString());
	}).catch(function (error) {
		alert("There was an error. Please copy the link manually:\n" + schedulesLink.toString())
		console.error(error);
	});
});

requestAnimationFrame(tick);
