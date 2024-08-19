// var timeout  = setTimeout(function(){}, 0);
// var inputTimeout = setTimeout(function(){}, 0);
var buses = [];
var timeModified = false;
var notesModified = false;
var holderBuses = [];
var routes = {};
const socket = io()

window.addEventListener('load', createDragDrop);
// create drag-and-drop divs
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
        const holders = document.getElementById('busesHolderSort').children
        holderBuses = [];
        routes = {};
        for(var i = 0; i < holders.length; i++){
            holderBuses.push(holders[i].textContent)
        }
        console.log("====buses to save:=====");
        console.log(buses);
        if(buses.length > 0)
            writeDb(buses, datePicker.value);
        // save notes and time content
        if(timeModified || notesModified){
            const info = {
                time : timePicker.value,
                notes : notesInput.value
            }
            writeSchedule(datePicker.value, info)
            timeModified = false;
            notesModified = false;
        }
        buses = [];
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
        // set holder buses to empty
        holderBuses = [];
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
        // autosave functions removed
        // // get release time
        // const releaseTime = timePicker.value;
        // console.log("release time: " + releaseTime);
        // writeSchedule(datePicker.value, releaseTime, 'time');
        // document.getElementById("saveStatus").textContent = "Saved!"
        timeModified = true;
    }
    notesInput.addEventListener('keydown', function(){
        // autosave functions removed
        // // get notes
        // clearTimeout(inputTimeout);
        // document.getElementById("saveStatus").textContent = "";
        // inputTimeout = setTimeout(function(){
        //     document.getElementById("saveStatus").textContent = "Saved!";
        //     // save buses' positions to db
        //     console.log(notesInput.value);
        //     writeSchedule(datePicker.value, notesInput.value, 'notes');
        // }, 1000)
        if (!notesModified){
            notesModified = true;
        }
    })
    // create drag and drop boards
    const sections = document.getElementsByClassName("section");
    for(var i = 0; i < sections.length; i++){
        new Sortable(sections[i], {
            group: "shared",
            sort: i != 0,
            swapThreshold: 2,
            animation: 150,
            filter: ".inactive",
            draggable: ".drag",
            scroll: true,
            scrollSensitivity: 100,
            
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
                    // change save status to unsaved (blank)
                    document.getElementById('saveStatus').textContent = '';
                    const group = ev.to.parentNode.getAttribute('name');
                    const section = ev.to.className.substring(ev.to.className.indexOf('section ') + 'section '.length, ev.to.className.length)
                    var sectionList = ev.to.children;
                    const index = ev.newIndex;
                    
                    console.log(ev)
                    console.log('group: ', group);
                    console.log('section: ', section);
                    console.log('new index: ', index)
                    
                    // get all buses in the section just updated
                    if(ev.to.parentNode.getAttribute('name') != 'Holder'){
                        for(var i = index; i < sectionList.length; i++){
                            console.log(Array.from(sectionList)[i]);
                            const route = sectionList[i].textContent;
                            const position = [section, i].join('-');
                            // check if buses holder contain the bus, if yes, insert bus, if not, update bus
                            var method = holderBuses.includes(route) ? 'insert' : 'update'
    
                            console.log('route: ', route);
                            console.log('position: ', position);
                            console.log('method: ', method)
                            console.log('holder buses: ')
                            console.log(holderBuses);

                            console.log('routes list:')
                            console.log(routes)

                            const bus = {
                                route : route,
                                group : group,
                                position: position,
                                method: method
                            }
                            // find bus in list
                            if(routes[route] == undefined){
                                console.log(`route ${route} not in list yet`)
                                routes[route] = buses.length
                                buses.push(bus);
                                console.log('buses: ', buses)
                            } else {
                                console.log(`replace bus ${route} in list`)
                                // change bus info in list
                                buses[routes[route]] = bus;
                            }
                        }
                    } else {
                        console.log('is holder')
                        console.log('holder route: ', ev.item.textContent)
                        const bus = {
                            route : ev.item.textContent,
                            method : 'delete'
                        }
                        buses.push(bus);
                        console.log('buses: ', buses)
                    }
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
        var className = "bus";
        if(bus.active == false){
            className = "inactive bus";
            document.getElementById("timePicker").className = "inactive";
            document.getElementById("notes").className = "inactive";
        }
        const busDiv = createBus(bus.bus_route, className);
        const group = document.getElementById(bus.bus_group + "Sort");
        if(bus.bus_group != "NHY"){
            const section = group.getElementsByClassName(bus.bus_position.split("-")[0])[0];
            section.appendChild(busDiv);
        } else {
            group.appendChild(busDiv);
        }
    })
    // display buses that are not yet placed
    const busesHolder = document.getElementById("busesHolder").getElementsByClassName("section")[0]; // add to section div inside the holder div
    buses.forEach((bus) => {
        busesHolder.appendChild(createBus(bus.bus_route));
        console.log('bus holder route ', bus)
        holderBuses.push(bus.bus_route)
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
async function writeSchedule(date, info){
    await fetch("/db?" + new URLSearchParams({
        method: "schedule",
        date: date,
    }), {
        method: "POST",
        headers: {
            "Content-type":"application/json"
        },
        body: JSON.stringify(info)
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
    // emit events to the server
    if(formatDate(new Date()) == date){
        socket.emit('update schedule', date);
    }
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
