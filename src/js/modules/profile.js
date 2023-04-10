import {
    initializeApp
} from 'firebase/app';
import {
    getDatabase,
    ref as ref_database,
    get,
    update,
} from "firebase/database";
import {
    getAuth,
    updateEmail,
    updatePassword,
    signOut,
    deleteUser,
} from "firebase/auth";
import {
    getStorage,
    ref as ref_storage,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";

export function initProfile() {
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
    const auth = getAuth();

    //Initialize Forms
    const profileForm = document.forms.profileForm;

    //Initialize Path
    let path = window.location.href;
    let newPath = path.slice(0, path.lastIndexOf('/'));
    
    //Get Current User Info
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) getUserInfo(currentUser.uid);

    if (profileForm) {
        profileForm.submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let file = profileForm.file.files[0];
            let email = profileForm.email.value;
            let password = profileForm.password.value;
            let name = profileForm.name.value;
            let surName = profileForm.surName.value;
            if (!validation(profileForm, email, password)) return;

            get(ref_database(database, 'users/' + currentUser.uid)).then((snapshot) => {
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
                                    signOut(auth).then(() => {
                                        localStorage.removeItem('currentUser');
                                        localStorage.removeItem('adminConfig');
                                        checkAuthState();
                                    })
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
                    }
                })
                .catch((error) => {
                    console.log(error);
                });

            if (file) updateImage(file);
        });

        profileForm.deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!localStorage.getItem('adminConfig')) {
                deleteUser(auth.currentUser).then(() => {
                    remove(ref_database(database, 'users/' + currentUser.uid));
                    signOut(auth).then(() => {
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('adminConfig');
                        checkAuthState();
                    })
                }).catch((error) => {
                    console.log(error);
                });
            } else {
                profileForm.querySelector('.error').textContent = 'You can not delete admin user';
            }
        })
    }

    function fieldUpdateMessage(form, field) {
        form.querySelector(`.${field}`).innerHTML += `<p class="success">Your ${field} was updated successfully</p>`;
        setTimeout(() => {
            form.querySelector(`.${field}`).querySelector('.success').remove();
        }, 3000);
    }

    function getUserInfo(uid) {
        get(ref_database(database, 'users/' + uid)).then((snapshot) => {
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

    function updateImage(newfile) {
        const storage = getStorage();
        const name = +new Date() + "-" + newfile.name;
        const storageRef = ref_storage(storage, name);
        uploadBytes(storageRef, newfile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(url => {
                update(ref_database(database, 'users/' + currentUser.uid), {
                    image: url,
                }).then(() => {
                    fieldUpdateMessage(profileForm, 'file');
                    getUserInfo(currentUser.uid);
                })
            });
        });
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

    function checkAuthState(user) {
        if (user) {
            if (window.location.href.includes('/admin.html') && !localStorage.getItem('adminConfig')) {
                window.location.replace(newPath);
            }
            if (window.location.href.includes('/auth.html')) {
                window.location.replace(newPath);
            }
        } else {
            if (!window.location.href.includes('/auth.html')) {
                window.location.replace(newPath + '/auth.html');
            }
        }
    };
}