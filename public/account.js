getAccount();
// function to get username & password
async function getAccount(){
    const response = await fetch('/accountdb');
    const data = await response.json();
    displayAccount(data)
}
function displayAccount(account){
    // create input fields
    const usernameInput = document.createElement('input');
    const passwordInput = document.createElement('input');
    usernameInput.setAttribute('type', 'text');
    passwordInput.setAttribute('type', 'password');
    usernameInput.setAttribute('readonly', 'true');
    passwordInput.setAttribute('readonly', 'true');
    usernameInput.setAttribute('onfocus', 'this.blur()');
    passwordInput.setAttribute('onfocus', 'this.blur()');
    usernameInput.id = 'usernameInput';
    passwordInput.id = 'passwordInput';
    usernameInput.value = account.username;
    passwordInput.value = account.password;
    usernameInput.addEventListener("keypress", function(event){
        if(event.key == "Enter"){
            event.preventDefault();
            document.getElementById("usernameBtn").click();
            this.blur();
        }
    })
    // append to respective table data
    const usernameTd = document.getElementById("usernameField");
    const passwordTd = document.getElementById("passwordField");
    usernameTd.appendChild(usernameInput);
    passwordTd.appendChild(passwordInput);
    const passwordForm = document.getElementById('newPasswordForm');
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        changeCreds('password');
        passwordForm.className = 'hidden';
        console.log(e.target);
        document.getElementById('passwordBtn').click();
    })
}
function modifyAccount(btn){
    const usernameInput = document.getElementById('usernameInput');
    const passwordForm = document.getElementById('newPasswordForm');
    if(btn.textContent.includes('Change')){
        if(btn.name == 'password'){
            // show form
            passwordForm.className = '';
            // passwordForm.addEventListener('submit', function(e){
            //     console.log('submitting');
            //     e.preventDefault();
            //     changeCreds('password');
            //     passwordForm.className = 'hidden';
            //     resetBtn(btn);
            //     const inputs = passwordForm.getElementsByTagName('input');
            //     for(var i = 0; i < inputs.length; i++){
            //         inputs[i].value = '';
            //     }
            // })
            
            btn.textContent = 'Cancel';
            const inputs = passwordForm.getElementsByTagName('input');
            console.log(inputs);
            for(var i = 0; i < inputs.length; i++){
                console.log(inputs[i])
                inputs[i].setAttribute('oninput', 'checkPw();')
            }
        } else {
            console.log("change")
            btn.textContent = 'Save';
            console.log(btn.textContent);
            // style button with class
            btn.className = 'saveButton';
            // make input box typeable and focus on box
            usernameInput.removeAttribute('readonly');
            usernameInput.removeAttribute('onfocus');
            usernameInput.focus();
            oldName = usernameInput.value;
            // create event listeners for save button to preserve initial input
            btn.addEventListener("click", function save(){
                const newName = usernameInput.value;
                console.log("old username: " + oldName);
                console.log("newName: " + newName);
                if(newName != oldName){
                    // save new username
                    changeCreds('username', newName);
                }
                // remove event listener after save button is clicked
                btn.removeEventListener("click", save);
            });
        }
    } else if(btn.textContent == 'Save') {
        console.log('saving');
        // turn button back to normal
        resetBtn(btn);
        if(btn.name == 'password'){
            // check if old password matches
            // hide password change form
            passwordForm.className = 'hidden';
        }
    } else if(btn.textContent = 'Cancel'){
        const pwForm = document.getElementById('newPasswordForm');
        pwForm.className = 'hidden';
        const inputs = pwForm.getElementsByTagName('input'); 
        for(var i = 0; i < inputs.length; i++){
            inputs[i].value = '';
        }
        resetBtn(btn);
    }
}
function resetBtn(btn){
    btn.className = '';
    btn.textContent = 'Change ' + btn.name;
    document.getElementById(btn.name + 'Input').setAttribute('readonly', 'true');
    document.getElementById(btn.name + 'Input').setAttribute('onfocus', 'this.blur()');
}
function checkPw(){
    const notif = document.getElementById('notif');
    const oldPw = document.getElementById('oldPassword').value;
    const newPw = document.getElementById('newPassword').value;
    const retypePw = document.getElementById('retypePassword').value;
    if(oldPw != newPw){
        if(newPw != retypePw){
            notif.textContent = 'Passwords do not match';
        } else {
            notif.textContent = '';
        }
    } else {
        notif.textContent = 'New password can\'t be the same as old password';
    }
    if(oldPw.replace(' ', '') == '' || newPw.replace(' ', '') == '' || retypePw.replace(' ', '') == ''){
        notif.textContent = "Can't leave any fields blank.";
    }
}
// function to change account credentials
async function changeCreds(type, newValue='', oldValue=''){
    console.log('called')
    if(type == 'password'){
        newValue = document.getElementById('newPassword').value;
        var oldValue = document.getElementById('oldPassword').value;
        if(document.getElementById('notif').textContent != ''){
            alert(document.getElementById('notif').textContent);
            document.getElementById('passwordBtn').click();
            return;
        }
    }
    const data = await fetch("/accountdb", {
        method: "POST",
        headers: {
            "Content-type":"application/json"
        },
        body: JSON.stringify({type:type, newValue:newValue, oldValue:oldValue})
    })
    const response = await data.json();
    if(response.status == 'failed'){
        alert('Old password entered is incorrect. Try again!');
        document.getElementById('passwordBtn').click();
    } else if(response.status == 'success'){
        alert('Credentials have successfully been changed!');
        location.reload();
    }
}