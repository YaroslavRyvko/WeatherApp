import {
    initializeApp
} from 'firebase/app';
import {
    getDatabase,
    set,
    ref as ref_database,
    get,
    child,
    runTransaction,
    update
} from "firebase/database";
import {
    getAuth,
    updateEmail,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updatePassword,
    signOut,
    deleteUser
} from "firebase/auth";
import {
    getStorage,
    ref as ref_storage,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";

export function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyC1Xig4WBP2klCwMDey0Jk-rUKnCVCSuIg",
        authDomain: "weatherapp-c5678.firebaseapp.com",
        databaseURL: "https://weatherapp-c5678-default-rtdb.firebaseio.com",
        projectId: "weatherapp-c5678",
        storageBucket: "weatherapp-c5678.appspot.com",
        messagingSenderId: "470571318415",
        appId: "1:470571318415:web:f0453235f0a16a6ca9c4fa",
        measurementId: "G-G39871SGQ1",
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const dbRef = ref_database(database);
    const auth = getAuth();

    //Initialize Path
    let path = window.location.href;
    let newPath = path.slice(0, path.lastIndexOf('/'));

    // Check Auth State
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    checkAuthState(currentUser);

    //Initialize Forms
    const signUpForm = document.forms.signUpForm;
    const signinForm = document.forms.signInForm;
    const profileForm = document.forms.profileForm;
    const adminForm = document.forms.adminForm;

    if (signUpForm) {
        signUpForm.submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let email = signUpForm.email.value;
            let password = signUpForm.password.value;
            if (!validation(signUpForm, email, password)) return;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const userData = userCredential.user;
                    set(ref_database(database, "users/" + userData.uid), {
                        email: email,
                        password: password,
                        loginCount: 1,
                    }).then(() => {
                        localStorage.setItem('currentUser', JSON.stringify(userData));
                        checkAuthState(userData);
                    });
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    signUpForm.querySelector('.error').textContent = errorMessage;
                });

            signUpForm.password.value = '';
        });
    }

    if (signinForm) {
        signinForm.submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let email = signinForm.email.value;
            let password = signinForm.password.value;
            if (!validation(signinForm, email, password)) return;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const userData = userCredential.user;
                    const fieldRef = ref_database(database, 'users/' + userData.uid + '/loginCount');
                    runTransaction(fieldRef, (currentValue) => {
                        return (currentValue || 0) + 1;
                    }).then(() => {
                        localStorage.setItem('currentUser', JSON.stringify(userData));
                        checkAuthState(userData);
                    })
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    signinForm.querySelector('.error').textContent = errorMessage;
                });

            signinForm.password.value = '';
        });
    }

    let logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('adminConfig');
                checkAuthState();
            }).catch((error) => {
                console.log(error);
            });
        });
    }

    if (profileForm) {
        profileForm.submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let file = profileForm.file.files[0];
            let email = profileForm.email.value;
            let password = profileForm.password.value;
            let name = profileForm.name.value;
            let surName = profileForm.surName.value;
            if (!validation(profileForm, email, password)) return;

            get(child(dbRef, 'users/' + currentUser.uid)).then((snapshot) => {
                    if (snapshot.exists()) {
                        if (snapshot.val().email != email) {
                            updateEmail(auth.currentUser, email).then(() => {
                                update(ref_database(database, 'users/' + currentUser.uid), {
                                    email: email
                                }).then(() => {
                                    fieldUpdateMessage(profileForm, 'email');
                                    getUserInfo(currentUser.uid);
                                })
                            }).catch((error) => {
                                console.log(error);
                            });
                        }
                        if (snapshot.val().password != password) {
                            updatePassword(auth.currentUser, password).then(() => {
                                update(ref_database(database, 'users/' + currentUser.uid), {
                                    password: password
                                }).then(() => {
                                    fieldUpdateMessage(profileForm, 'password');
                                    getUserInfo(currentUser.uid);
                                })
                            }).catch((error) => {
                                console.log(error);
                            });
                        }
                        if (snapshot.val().name != name) {
                            update(ref_database(database, 'users/' + currentUser.uid), {
                                name: name
                            }).then(() => {
                                fieldUpdateMessage(profileForm, 'name');
                                getUserInfo(currentUser.uid);
                            })
                        }
                        if (snapshot.val().surName != surName) {
                            update(ref_database(database, 'users/' + currentUser.uid), {
                                surName: surName
                            }).then(() => {
                                fieldUpdateMessage(profileForm, 'surName');
                                getUserInfo(currentUser.uid);
                            })
                        }
                    } else {
                        console.log("No data available");
                    }
                })
                .catch((error) => {
                    console.log(error);
                });

            if (file) updateImage(file);
        });

        profileForm.deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteUser(auth.currentUser).then(() => {
                signOut(auth).then(() => {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('admin');
                    checkAuthState();
                }).catch((error) => {
                    console.log(error);
                });
            }).catch((error) => {
                console.log(error);
            });
        })
    }

    function fieldUpdateMessage(form, field) {
        form.querySelector(`.${field}`).innerHTML += `<p class="success">Your ${field} was updated successfully</p>`;
        setTimeout(() => {
            form.querySelector(`.${field}`).querySelector('.success').remove();
        }, 3000);
    }

    if (adminForm) {
        adminForm.submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let email = adminForm.email.value;
            let password = adminForm.password.value;
            let name = adminForm.name.value;
            let surName = adminForm.surName.value;
            let file = adminForm.file.files[0];
            let isAdmin = adminForm.checkAdmin.checked;
            if (!validation(adminForm, email, password)) return;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const userData = userCredential.user;
                    if (file) updateImage(file, userData);
                    set(ref_database(database, "users/" + userData.uid), {
                        email: email,
                        password: password,
                        name: name,
                        surName: surName,
                        admin: isAdmin
                    })
                })
                .then(() => {
                    signInWithEmailAndPassword(
                        auth,
                        JSON.parse(localStorage.getItem('adminConfig')).email,
                        JSON.parse(localStorage.getItem('adminConfig')).password
                    );
                    getUsers();
                    Email.send({
                        Host: "smtp.elasticemail.com",
                        Username: "weatherappjs@gmail.com",
                        Password: "8126751B8E3A5C350BB969B7C8E434E74F36",
                        To: email,
                        From: "weatherappjs@gmail.com",
                        Subject: "Registration Success",
                        Body: "Congratz your account was created on https://yaroslavryvko.github.io/WeatherApp"
                    }).then(
                        message => console.log(message)
                    );
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    adminForm.querySelector('.error').textContent = errorMessage;
                });

            adminForm.email.value = '';
            adminForm.password.value = '';
            adminForm.surName.value = '';
            adminForm.name.value = '';
            adminForm.password.value = '';
            adminForm.file.value = '';
            adminForm.checkAdmin.checked = false;
        });
    }

    let usersContainer = document.querySelector('.users-wrapper');
    getUsers();

    function getUsers() {
        get(child(dbRef, 'users/')).then((snapshot) => {
            if (snapshot.exists()) {
                let data = snapshot.val();
                return data;
            } else {
                console.log("No data available");
            }
        }).then((data) => {
            let users = Object.entries(data);
            if (usersContainer) {
                usersContainer.innerHTML = users.map((user, idx) => {
                        return ` 
                    <div class="user-item">
                        <div><span>${idx+1}.</span>
                        <p class="user-id">${user[0]}</p>
                        <p class="user-mail">${user[1].email}</p>
                        </div>
                        <button class="user-btn">More</button>
                    </div>`;
                    })
                    .join(' ');
            }
            userButtonsInit();
        }).catch((error) => {
            console.error(error);
        });
    };

    function userButtonsInit() {
        let buttons = document.querySelectorAll('.user-btn');
        buttons.forEach(btn => {
            btn.onclick = function () {
                modal.style.display = "block";
                let uid = btn.parentElement.querySelector('.user-id').textContent;
                getDetailedUser(uid);
            }
        })
    }

    let userInfo = document.querySelector('.user-info');

    function getDetailedUser(id) {
        get(child(dbRef, 'users/' + id)).then((snapshot) => {
            if (snapshot.exists()) {
                userInfo.innerHTML = ` 
                    <img src="${snapshot.val().image || 'dist/images/profile.png'}" alt="user Logo"> 
                    <p>Name: ${snapshot.val().name || 'Not Stated'}</p>
                    <p>SurName: ${snapshot.val().surName || 'Not Stated'}</p>
                    <p>Login Count: ${snapshot.val().loginCount || 0}</p>
                    <p>Email adress: ${snapshot.val().email}</p>
                    <p>Password: ${snapshot.val().password}</p>
                    <p>Admin: ${snapshot.val().admin}</p>`;
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    function updateImage(newfile, newUser) {
        const storage = getStorage();
        const name = +new Date() + "-" + newfile.name;
        const storageRef = ref_storage(storage, name);

        uploadBytes(storageRef, newfile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(url => {
                if (newUser) {
                    update(ref_database(database, 'users/' + newUser.uid), {
                        image: url,
                    }).then(() => {
                        getUsers();
                    })
                } else {
                    update(ref_database(database, 'users/' + currentUser.uid), {
                        image: url,
                    }).then(() => {
                        fieldUpdateMessage(profileForm, 'file');
                        getUserInfo(currentUser.uid);
                    })
                }
            });
        });
    }

    // Auth State
    function checkAuthState(user) {
        if (user) {
            if (window.location.href.includes('/admin.html') && !localStorage.getItem('adminConfig')) {
                window.location.replace(newPath);
            }
            if (window.location.href.includes('/auth.html')) {
                window.location.replace(newPath);
            }
            getUserInfo(user.uid);
        } else {
            if (!window.location.href.includes('/auth.html')) {
                window.location.replace(newPath + '/auth.html');
            }
        }
    };

    function getUserInfo(uid) {
        get(child(dbRef, 'users/' + uid)).then((snapshot) => {
            if (snapshot.exists()) {
                if (snapshot.val().admin === true) {
                    localStorage.setItem('adminConfig', JSON.stringify({
                        admin: true,
                        password: snapshot.val().password,
                        email: snapshot.val().email,
                    }));
                    let adminImage = document.querySelector('.admin-link');
                    if (adminImage && localStorage.getItem('adminConfig')) {
                        adminImage.style.display = 'block';
                    }
                }
                initUserProfile(snapshot.val());
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    function initUserProfile(userData) {
        if (profileForm) {
            profileForm.email.value = userData.email;
            profileForm.password.value = userData.password;
            profileForm.name.value = userData.name || '';
            profileForm.surName.value = userData.surName || '';
            profileForm.querySelector('img').src = userData.image || 'dist/images/profile.png';
        }

        let userImage = document.querySelector('.profile-img');
        if (userImage) {
            userImage.src = userData.image || 'dist/images/profile.png';
        }
    }

    //Validation
    function validation(form, email, password) {
        let errors = form.querySelectorAll('.invalid');
        errors.forEach(error => error.remove());
        let errorCheck = true;
        if (!email) {
            form.querySelector('.email').innerHTML += '<p class="invalid">This field is required</p>';
            errorCheck = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            form.querySelector('.email').innerHTML += '<p class="invalid">Invalid email adress</p>';
            errorCheck = false;
        }
        if (!password) {
            form.querySelector('.password').innerHTML += '<p class="invalid">This field is required</p>'
            errorCheck = false;
        } else if (password.length < 6) {
            form.querySelector('.password').innerHTML += '<p class="invalid">Password is too short</p>'
            errorCheck = false;
        }
        return errorCheck;
    }

    //Form Togglers
    let togglers = document.querySelectorAll('.form-toggler');
    if (togglers) {
        togglers.forEach(togler => {
            togler.addEventListener('click', () => {
                if (signInForm.classList.contains('active')) {
                    signInForm.classList.remove('active');
                    signUpForm.classList.add('active');
                } else {
                    signUpForm.classList.remove('active');
                    signInForm.classList.add('active');
                }
            })
        })
    }

    let passwordBtn = document.querySelector('.password-btn');
    if (passwordBtn) {
        passwordBtn.onclick = function (e) {
            e.target.classList.toggle('active');
            if (profileForm.password.type == "password") {
                profileForm.password.type = "text";
            } else {
                profileForm.password.type = "password";
            }
        }
    }

    //Modal 
    let modal = document.querySelector('.modal');
    let closeBtn = document.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.onclick = function () {
            modal.style.display = "none";
        }
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

}