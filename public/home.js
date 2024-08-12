const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

window.addEventListener('load', getSchedule);

function formatDate(date){
    var today = new Date(date),
        month = '' + (today.getMonth()+1),
        day = '' + (today.getDate()),
        year = today.getFullYear();
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return([month, day, year].join('-'));
}

async function getSchedule(){
    const today = new Date();
    const date = formatDate(today);
    const searchBar = document.getElementById("searchBar");
    searchBar.setAttribute("oninput", "searchBus();")
    // display today's date on page
    document.getElementById("scheduleDate").textContent = weekdays[today.getDay()] + ', ' + date;
    const response = await fetch('/db?' + new URLSearchParams({
        table: 'scheduledBuses',
        date: date,
        user: 'student'
    }));
    console.log(response)
    const schedule = await response.json();
    console.log(schedule);
    // check if schedule is empty
    if(schedule.schedule.length > 0){
        // unhide busesDivs
        const busesDivs = document.getElementsByClassName('busesDiv')
        for(var i = 0; i < busesDivs.length; i++){
            // remove hidden class from busesdivs
            busesDivs[i].classList.remove("hidden");
        }
        displaySchedule(schedule);
    } else {
        // unhide noSchedule message
        const noSchedule = document.getElementsByClassName('noSchedule')[0]
        noSchedule.classList.remove('hidden')
}
}

function displaySchedule(data){
    const schedule = data.schedule;
    const notes = data.notes.length > 0 ? data.notes[0].notes : '';
    schedule.forEach(bus => {
        console.log(bus.bus_route);
        var className = "bus";
        const busDiv = createBus(bus.bus_route, className);
        const group = document.getElementById(bus.bus_group + "Buses");
        console.log(group);
        console.log("position:" + bus.bus_position);
        console.log("group:" + bus.bus_group);
        console.log(bus.bus_position.split("-")[0])
        if(bus.bus_group != "NHY"){
            const section = group.getElementsByClassName(bus.bus_position.split("-")[0])[0];
            section.appendChild(busDiv);
        } else {
            group.appendChild(busDiv);
        }
    })
    document.getElementById("changesNotes").textContent = notes ;
}
// function to make bus divs
function createBus(route, className="bus"){
    const busDiv = document.createElement('div');
    busDiv.textContent = route;
    console.log(className);
    busDiv.className = className;
    return busDiv;
}
// function to search bus
function searchBus(){
    const buses = document.getElementsByClassName('bus');
    console.log(buses);
    for(var i = 0; i < buses.length; i++){
        const bus = buses[i];
        const route = bus.textContent
        console.log(route);
        if(route == document.getElementById("searchBar").value){
            bus.innerHTML = "<mark>" + route + "</mark>"
        } else {
            bus.innerHTML = route;
        }
    }
}