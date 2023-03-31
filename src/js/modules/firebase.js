import {
    initializeApp
} from 'firebase/app';
import {
    getDatabase,
    set,
    ref as ref_database,
    get,
    child,
    update
} from "firebase/database";
import {
    getAuth,
    updateEmail,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updatePassword,
    signOut,
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
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    set(ref_database(database, "users/" + userData.uid), {
                        email: email,
                        password: password,
                    }).then(() => {
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
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    checkAuthState(userData);
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
                localStorage.removeItem('admin');
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
            let sureName = profileForm.sureName.value;
            if (!validation(profileForm, email, password)) return;

            get(child(dbRef, 'users/' + currentUser.uid)).then((snapshot) => {
                if (snapshot.exists()) {
                    if (snapshot.val().email != email) {
                        updateEmail(auth.currentUser, email).then(() => {
                            update(ref_database(database, 'users/' + currentUser.uid), {
                                email: email
                            })
                        }).catch((error) => {
                            console.log(error);
                        });
                    }
                    if (snapshot.val().password != password) {
                        updatePassword(auth.currentUser, password).then(() => {
                            update(ref_database(database, 'users/' + currentUser.uid), {
                                password: password
                            })
                        }).catch((error) => {
                            console.log(error);
                        });
                    }
                    if (snapshot.val().name != name) {
                        update(ref_database(database, 'users/' + currentUser.uid), {
                            name: name
                        })
                    }
                    if (snapshot.val().sureName != sureName) {
                        update(ref_database(database, 'users/' + currentUser.uid), {
                            sureName: sureName
                        })
                    }
                } else {
                    console.log("No data available");
                }
            }).then(() => {
                profileForm.querySelector('.success').textContent = 'Profile was updated Successfully';
                setTimeout(() => {
                    profileForm.querySelector('.success').textContent = ''
                }, 3000);
            }).catch((error) => {
                console.log(error);
            });

            if (file) updateImage(file);
        });
    }

    function updateImage(newfile) {
        const storage = getStorage();
        const name = +new Date() + "-" + newfile.name;
        const storageRef = ref_storage(storage, name);

        uploadBytes(storageRef, newfile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(url => {
                update(ref_database(database, 'users/' + currentUser.uid), {
                    image: url,
                }).then(() => {
                    getUserInfo(currentUser.uid);
                })
            });
        });
    }

    if (adminForm) {
        adminForm.submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let email = adminForm.email.value;
            let password = adminForm.password.value;
            if (!validation(adminForm, email, password)) return;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const userData = userCredential.user;
                    set(ref_database(database, "users/" + userData.uid), {
                        email: email,
                        password: password,
                    }).then(() => {
                        getUsers();
                        adminForm.querySelector('.success').textContent = 'User added Successfully';
                        adminForm.querySelector('.error').textContent = '';
                        setTimeout(() => {
                            adminForm.querySelector('.success').textContent = ''
                        }, 3000);

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
                    });
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    adminForm.querySelector('.error').textContent = errorMessage;
                });

            adminForm.password.value = '';
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
                    <p>SurName: ${snapshot.val().sureName || 'Not Stated'}</p>
                    <p>Email adress: ${snapshot.val().email}</p>
                    <p>Password: ${snapshot.val().password}</p>`;
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    // Auth State
    function checkAuthState(user) {
        if (user) {
            if (window.location.href.includes('/admin.html') && !localStorage.getItem('admin')) {
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
                    localStorage.setItem('admin', true);
                }
                initUserProfile(snapshot.val());
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    function initUserProfile(user) {
        if (profileForm) {
            profileForm.email.value = user.email;
            profileForm.password.value = user.password;
            profileForm.name.value = user.name || '';
            profileForm.sureName.value = user.sureName || '';
            profileForm.querySelector('img').src = user.image || 'dist/images/profile.png';
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