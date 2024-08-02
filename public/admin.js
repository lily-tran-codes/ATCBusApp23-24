var timeout  = setTimeout(function(){}, 0);
var inputTimeout = setTimeout(function(){}, 0);
var buses = [];

// creat drag-and-drop divs
function createDragDrop(){
    const datePicker = document.getElementById("datePicker");
    const timePicker = document.getElementById("timePicker");
    const notesInput = document.getElementById("notes");
    // add event listener to button to enable/disable
    document.getElementById("editingButton").addEventListener("click", function(){
        // enable sortable by adding draggable class
        const busDivs = document.getElementsByClassName("bus");
        if(this.textContent.includes("Enable")){
            this.textContent = "Finish Editing";
            for(var i = 0; i < busDivs.length; i++){
                busDivs[i].classList.add("drag");
            }
            if(timePicker.className != 'inactive' && notesInput.className != 'inactive'){
                document.getElementById("notes").removeAttribute("disabled");
                document.getElementById("timePicker").removeAttribute("disabled");
            }
        } else {
            this.textContent = "Enable Editing";
            for(var i = 0; i < busDivs.length; i++)
            busDivs[i].classList.remove("drag");
            document.getElementById("notes").setAttribute("disabled", '');
            document.getElementById("timePicker").setAttribute("disabled", "");
        }
    })
    document.getElementsByClassName("saveButton")[0].addEventListener("click", function(){
        document.getElementById("saveStatus").textContent = "Saved!";
    })
    // load dismissal schedule for today (default date)
    const today = new Date();
    // check if todayday is a weekend, change day to the next Monday
    while(today.getDay() == 6 || today.getDay() == 0){
        today.setDate(today.getDate()+1);
    }
    var scheduleDate = formatDate(today);
    readDb(scheduleDate); // get bus schedule today
    // automatically put today's date for the date picker on load
    datePicker.value = formatDate(today);
    datePicker.onchange = function(){
        // get new date
        scheduleDate = datePicker.value;
        console.log("Date changed to: " + scheduleDate);
        // change editing button
        document.getElementById("editingButton").textContent = "Enable Editing";
        if(scheduleDate.length > 0){
            // clear buses div
            const busDivs = document.getElementsByClassName("bus");
            while(busDivs.length > 0){
                busDivs[0].remove();
            }
            // read db
            readDb(scheduleDate);
        }
        // reset inactive elements
        timePicker.className = '';
        notesInput.className = '';
    };
    timePicker.onchange = function(){
        // get release time
        const releaseTime = timePicker.value;
        console.log("release time: " + releaseTime);
        writeSchedule(datePicker.value, releaseTime, 'time');
        document.getElementById("saveStatus").textContent = "Saved!"
    }
    notesInput.addEventListener('keydown', function(){
        // get notes
        clearTimeout(inputTimeout);
        document.getElementById("saveStatus").textContent = "";
        inputTimeout = setTimeout(function(){
            document.getElementById("saveStatus").textContent = "Saved!";
            // save buses' positions to db
            console.log(notesInput.value);
            writeSchedule(datePicker.value, notesInput.value, 'notes');
        }, 1300)
    })
    // create drag and drop boards
    const sections = document.getElementsByClassName("section");
    for(var i = 0; i < sections.length; i++){
        var sort = true;
        if(i == 0)
            sort = false;
        new Sortable(sections[i], {
            group: "shared",
            sort: sort,
            swapThreshold: 2,
            animation: 150,
            filter: ".inactive",
            draggable: ".drag",
            // ***REMOVED*** prevent bus divs to be put back in buses holder
            // onMove: function onMove(ev){
            //     if(ev.related && ev.related.classList.contains('holder') || ev.related.parentNode.classList.contains('holder')){
            //         return false;
            //     }
            // },
            // save schedule when drag and drop ends
            onEnd: function save(ev){
                // check if location is different
                if(ev.to != ev.from || ev.newIndex != ev.oldIndex){
                    clearTimeout(timeout);
                    document.getElementById("saveStatus").textContent = "";
                    const group = ev.to.parentNode.getAttribute("name");
                    const section = ev.to.className.substring(ev.to.className.indexOf("section ")+"section ".length, ev.to.className.length);
                    var sectionList = ev.to.children;
                    const index = ev.newIndex;
                    console.log(sectionList);
                        for(var i = index; i < sectionList.length; i++){
                            console.log(Array.from(sectionList)[i]);
                            const route = sectionList[i].textContent;
                            const position = [section, i].join("-");
                            var routeFound = false;
                            for(var j = 0; j < buses.length; j++){
                                console.log(buses[j]);
                                if(buses[j].route == route){
                                    buses[j].position = position;
                                    buses[j].group = group;
                                    routeFound = true;
                                    break;
                                }
                            }
                            if (!routeFound){
                                console.log("added route");
                                buses.push({
                                    route : route,
                                    position : position,
                                    group : group,
                                });
                            }
                        }
                    console.log(buses);
                    if(ev.from != ev.to){
                        console.log("Old parent node: ");
                        var sectionList = ev.from.children;
                        const group = ev.from.parentNode.getAttribute("name");
                        const section = group != 'Holder' ? ev.from.className.split(" ")[1] : null;
                        console.log(ev.from);
                        console.log(ev.oldIndex);
                        for(var i = ev.oldIndex + 1; i < sectionList.length; i++){
                            const route = group != sectionList[i].textContent;
                            const position = group != [section, i].join("-");
                            console.log("buses.length: " + buses.length);
                            var routeFound = false;
                            for(var j = 0; j < buses.length; j++){
                                console.log(buses[j]);
                                if(buses[j].route == route){
                                    console.log("updated route");
                                    buses[j].position = position;
                                    buses[j].group = group;
                                    routeFound = true;
                                    console.log(buses);
                                    break;
                                }
                            }
                            if (!routeFound){
                                console.log("added route");
                                buses.push({
                                    route : route,
                                    position : position,
                                    group : group,
                                });
                            }
                        }
                        console.log(buses);
                    }
                    timeout = setTimeout(function(){
                        document.getElementById("saveStatus").textContent = "Saved!";
                        // save buses' positions to db
                        writeDb(buses, datePicker.value);
                        console.log(buses);
                        buses = [];
                    }, 1000)
                }
            },
        })
    }
}
// function to format date into correct format
function formatDate(date){
    var today = new Date(date),
        month = '' + (today.getMonth()+1),
        day = '' + (today.getDate()),
        year = today.getFullYear();
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return([year, month, day].join('-'));
}
// function to display bus numbers on screen
function displayBuses(buses, schedules){
    schedules.forEach(bus => {
        console.log(bus.bus_route);
        var className = "bus";
        if(bus.active == false){
            className = "inactive bus";
            document.getElementById("timePicker").className = "inactive";
            document.getElementById("notes").className = "inactive";
        }
        const busDiv = createBus(bus.bus_route, className);
        const group = document.getElementById(bus.bus_group + "Sort");
        console.log(bus.bus_position);
        console.log(bus.bus_group);
        if(bus.bus_group != "NHY"){
            const section = group.getElementsByClassName(bus.bus_position.split("-")[0])[0];
            section.appendChild(busDiv);
        } else {
            group.appendChild(busDiv);
        }
    })
    // display buses that are not yet placed
    const busesHolder = document.getElementById("busesHolder").getElementsByClassName("section")[0]; // add to section div inside the holder div
    console.log("buses:");
    console.log(buses);
    buses.forEach((bus) => {
        busesHolder.appendChild(createBus(bus.bus_route));
    })
    
}
// function to clear buses schedule
async function clearSchedule(){
    const date = document.getElementById("datePicker").value;
    // confirm admin wants to clear bus schedule
    if(confirm('Are you sure you want to clear the schedule for this day?')){
        // clear bus schedule
        await fetch("/db?" + new URLSearchParams({
            method: "clear",
            date: date,
        }), {
            method: "POST",
            headers: {
                "Content-type":"application/json"
            }
        })
        location.reload();
    }
}
// function to make bus divs
function createBus(route, className="bus"){
    const busDiv = document.createElement('div');
    busDiv.textContent = route;
    console.log(className);
    busDiv.className = className;
    return busDiv;
}
// function to save schedule's info
async function writeSchedule(date, info, type){
    await fetch("/db?" + new URLSearchParams({
        method: "schedule",
        date: date,
    }), {
        method: "POST",
        headers: {
            "Content-type":"application/json"
        },
        body: JSON.stringify({info : info, type : type})
    })
}
// function to save buses
async function writeDb(buses, date){
    await fetch("/db?" + new URLSearchParams({
        method: "update",
        date: date
    }), {
        method: "POST",
        headers: {
            "Content-type":"application/json"
        },
        body: JSON.stringify(buses)
    })
}
// function to get data from server
async function readDb(date){
    // send GET request to server with string query
    const response = await fetch('/db?' + new URLSearchParams({
        table: 'scheduledBuses',
        date: date,
    }));
    const data = await response.json();
    console.log("schedule info:")
    console.log(data.info);
    // display bus routes to Buses div for placement
    displayBuses(data.buses, data.schedule);
    const timePicker = document.getElementById("timePicker");
    const notesInput = document.getElementById("notes");
    if(data.info.length > 0){
        console.log(data.info[0].notes);
        notesInput.value = data.info[0].notes;
        var release_time = data.info[0].release_time;
        release_time = release_time != null ? release_time.substring(release_time.indexOf('T') + 1, release_time.indexOf('.')) : '';
        console.log(release_time);
        timePicker.value = release_time;
    } else {
        timePicker.value = '';
        notesInput.value = '';
    }
}
