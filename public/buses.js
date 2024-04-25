// !outside buses on left, inside buses on right
// ! submit button for schedule changes
// ! no changes to schedule after 2-3 days (archived)

// function to display bus routes from database
function displayBuses(buses){
    var updateDate = buses.length == 0 ? "" : buses[0].update_date;
    buses.forEach(bus => {
        addBus(bus['bus_route']);
        console.log()
        if (bus['update_date'] > updateDate)
            updateDate = bus['update_date'];
    })
    updateDate = updateDate.substring(0, updateDate.indexOf("T"))
    console.log(updateDate);
    // disply update date
    document.getElementById("lastUpdated").textContent += updateDate;
    document.getElementById("total").textContent += buses.length;
    document.getElementById("addBusInput").addEventListener("keypress", function(event) {
        if (event.key === "Enter"){
            event.preventDefault();
            document.getElementById("addButton").click();
        }
    })
    document.getElementById("addButton").addEventListener("click", () => {
        const input = document.getElementById("addBusInput");
        if (input.value.replace(/ /g, "") == ""){
            alert("Please enter a value.");
        } else {
            if (addBus(input.value) != 0){
                const bus = {
                    route : input.value,
                    update : formatDate(new Date())
                };
                writeDb(bus, 'add');
                // update date bus list is updated on page
                document.getElementById("lastUpdated").textContent = `Last Updated: ${formatDate(new Date())}`;
                // update total number of buses on page
                document.getElementById("total").textContent = `Total: ${document.getElementById("busTable").rows.length}`
            }
        }
        // append bus to table
        input.value = "";
    })
    document.getElementById("newListButton").addEventListener("click", function(){
        if(confirm("Are you sure you want to archive this list and create a new one?")){
            console.log("yes");
            const bus = {method: 'archive'}
            writeDb(bus, 'archive');
            location.reload();
        } else {
            console.log("no")
        }
    })
}

// function to add bus to table
function addBus(route){
    const table = document.getElementById("busTable");
    // create elements
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const input = document.createElement('input');
    const editBtn = document.createElement('button');
    const delBtn = document.createElement('button');
    // set elements' attributes & text content
    input.setAttribute("type", "text");
    input.setAttribute("value", route); // display bus route on input box, use input box for easier editing of bus routes
    // set buttons and input box to default values & attributes
    resetInputs(editBtn, input, delBtn);
    // append input box and buttons to cell
    td.appendChild(input);
    td.appendChild(editBtn);
    td.appendChild(delBtn);
    // append table data to table row
    tr.appendChild(td);
    const rows = table.getElementsByTagName("tr")
    if (rows.length == 0){
        table.appendChild(tr);
        return 1;
    }
    for(var i = 0; i < rows.length; i++){
        const row = rows[i];
        // ! return error here and there after editing another bus route
        const busRoute = row.childNodes[0].childNodes[0].value;
        if(busRoute > route){
            table.insertBefore(tr, row);
            return 1;
        }
        if(busRoute == route){
            console.log(busRoute);
            console.log(route)
            alert("A bus with that route already exists.")
            return 0;
        }
    }
    table.appendChild(tr);
}

// function to delete bus route
async function deleteBus(button){
    const del = confirm("Are you sure you want to delete this bus route?");
    if(del){
        button.parentNode.remove();
        const route = button.parentNode.getElementsByTagName("input")[0].value;
        const response = await fetch('/db', {
            method: 'DELETE',
            headers: {
                'Content-type' : 'application/json'
            },
            body: JSON.stringify({route : route})
        })
    }
}

// function to edit bus route
function editBus(button){
    // get input box
    const busElement = button.parentNode.children[0]
    const delBtn = button.parentNode.children[2];
    // toggle readonly
    busElement.removeAttribute("readonly");
    busElement.setAttribute("onfocus", "focusInput(this);");
    // focus element
    busElement.focus();
    // get initial route
    const initRoute = busElement.value;
    // change edit button to save button
    button.textContent = "Save";
    button.className = "saveButton";
    const cancelBtn = button.parentNode.lastChild;
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "cancelButton";
    console.log(button.parentNode.lastChild);
    busElement.addEventListener("keypress", function (event){
        if(event.key === "Enter"){
            console.log("enter");
            event.preventDefault();
            button.click();
            this.removeEventListener("keypress", arguments.callee, false) // arguments.callee refers to the current running function
            busElement.blur();
            resetInputs(button, this, delBtn);
        }
    })
    button.addEventListener("click", function save(){
        resetInputs(this, busElement, delBtn);
        saveEdit(this, initRoute);
        button.removeEventListener("click", save);
        cancelBtn.textContent = "X";
        cancelBtn.className = "deleteButton";
        cancelBtn.setAttribute("onclick", "delBus(this);")
    })
    cancelBtn.setAttribute("onclick", function cancel() {
        console.log("canceled")
        this.setAttribute("readonly", "true");
        this.setAttribute("onfocus", "this.blur()");
        this.value = initRoute;
        button.click();
        this.removeEventListener("blur", cancel);
        this.blur();
    });
    // busElement.addEventListener("blur", function cancel(){
    //     this.addEventListener("keypress", function(event){
    //         if(event.key === "Enter"){
    //             console.log("enter in cancel");
    //         }
    //     })
    //     if(this != document.activeElement){
    //     console.log("cancel")
    //     this.setAttribute("readonly", "true");
    //     this.setAttribute("onfocus", "this.blur()");
    //     this.value = initRoute;
    //     button.click();
    //     this.removeEventListener("blur", cancel);
    //     }
    // })
}

// function to reset edit button and input box to default
function resetInputs(button, input, delBtn){
    // default: <button class="editButton" onclick="editBus(this)">Edit</button>
    button.setAttribute("class", "editButton");
    button.removeEventListener("click", saveEdit);
    button.addEventListener("click", function edit(){
        editBus(this);
        button.removeEventListener("click", edit)
    })
    button.textContent = "Edit";

    // default: <input type="text" readonly="true" onfocus="this.blur()" value=route>
    input.setAttribute("readonly", "true"); // set input box to read only to prevent accidental editing
    input.setAttribute("onfocus", "this.blur()"); // blur input box on focus unless edit button is clicked
    input.blur();
    delBtn.setAttribute("class", "deleteButton");
    delBtn.setAttribute("onclick", "deleteBus(this)");
    delBtn.textContent = "X"
}

// function to focus the input
function focusInput(field){
    // set blinking cursor at end of string
    const input = field.value;
    field.value = '';
    field.value = input;
    // save current value in input field to temporary session storage
    sessionStorage.setItem("tempRoute", field.value);
    // listen for enter key pressed to submit input value
    field.addEventListener("keypress", function(event){
        if(event.key === "Enter"){
            event.preventDefault();
            field.parentNode.children[1].click();
            this.removeEventListener("keypress", arguments.callee, false) // arguments.callee refers to the current running function
            field.blur();
        }
    })
}

// function to edit bus route
function saveEdit(button, initialRoute){
    const table = document.getElementById("busTable");
    const rows = table.getElementsByTagName("tr");
    const input = button.parentNode.children[0];
    for(var i = 0; i < rows.length; i++){
        const row = rows[i];
        const rowInput = row.childNodes[0].childNodes[0]
        const busRoute = rowInput.value;
        if(busRoute == input.value && input != rowInput){
            alert("A bus with that route already exists.");
            input.value = initialRoute;
        }
    }
    if (input.value != initialRoute){
        const bus = {
            "initRoute" : initialRoute,
            "updatedRoute" : input.value,
        }
        writeDb(bus, "edit");
    }
}
// function to get active buses
async function readDb(){
    // send GET request to server with string query
    const busesResponse = await fetch('/db?' + new URLSearchParams({
        table: 'buses',
    }));
    const buses = await busesResponse.json();
    // display bus routes to Buses div for placement
    console.log(buses);
    displayBuses(buses)
}
// function to send data to db to save
async function writeDb(bus, method){
    const data = await fetch("/db?" + new URLSearchParams({
        method: method
    }), {
        method: "POST",
        headers: {
            "Content-type":"application/json"
        },
        body: JSON.stringify(bus)
    })
    console.log("wrote to db");
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