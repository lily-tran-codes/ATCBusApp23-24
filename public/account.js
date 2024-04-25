getAccount();
// function to get username & password
async function getAccount(){
    const response = await fetch('/accountdb');
    const data = await response.json();
    console.log(data);
    displayAccount(data[0])
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
}
function modifyAccount(btn){
    const usernameInput = document.getElementById('usernameInput');
    const passwordForm = document.getElementById('newPasswordForm');
    if(btn.textContent.includes('Change')){
        console.log("change")
        btn.textContent = 'Save';
        console.log(btn.textContent);
        // style button with class
        btn.className = 'saveButton';
        if(btn.name == 'password'){
            // show form
            passwordForm.className = '';
        } else {
            usernameInput.removeAttribute('readonly');
            usernameInput.removeAttribute('onfocus');
            usernameInput.focus();
        }
    } else if(btn.textContent == 'Save') {
        console.log('saving')
        // turn button's text to original
        btn.textContent = 'Change ' + btn.name;
        // turn button back to normal
        btn.className = '';
        if(btn.name == 'password'){
            // check if old password matches
            // hide password change form
            passwordForm.className = 'hidden';
        }
        document.getElementById(btn.name + 'Input').setAttribute('readonly', 'true');
        document.getElementById(btn.name + 'Input').setAttribute('onfocus', 'this.blur()');
    }
}