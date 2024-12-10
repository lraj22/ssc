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

requestAnimationFrame(tick);
