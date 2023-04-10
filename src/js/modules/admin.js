import {
    initializeApp
} from 'firebase/app';
import {
    getDatabase,
    set,
    ref as ref_database,
    get,
    child,
    update,
    orderByKey,
    remove,
    query,
    limitToFirst,
    startAfter
} from "firebase/database";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import {
    getStorage,
    ref as ref_storage,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";

export function initAdmin() {
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

    const adminForm = document.forms.adminForm;

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
                    Email.send({
                        Host: "smtp.elasticemail.com",
                        Username: "weatherappjs@gmail.com",
                        Password: "8126751B8E3A5C350BB969B7C8E434E74F36",
                        To: email,
                        From: "weatherappjs@gmail.com",
                        Subject: "Registration Success",
                        Body: "Congratz your account was created on https://yaroslavryvko.github.io/WeatherApp"
                    })
                    lastItemKey = '';
                    usersContainer.innerHTML = '';
                    iterations = 0;
                    loadUsers(5);
                    loadMoreBtn.style.display = "block";
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
    let lastItemKey = '';
    let iterations = 0;

    function loadUsers(limit) {
        // Construct a Firebase Realtime Database query to load users
        const usersRef = ref_database(database, 'users');

        let usersQuery = query(usersRef, orderByKey(), limitToFirst(limit));

        if (lastItemKey) {
            usersQuery = query(usersRef, orderByKey(), startAfter(lastItemKey), limitToFirst(limit));
        }
        // Execute the Firebase query
        get(usersQuery).then((snapshot) => {
            // Handle the response data here
            const data = snapshot.val();
            const keys = Object.keys(data);

            if (keys.length > 0) {
                lastItemKey = keys[keys.length - 1];
            }
            if (keys.length < limit) {
                loadMoreBtn.style.display = "none";
            }
            let users = Object.entries(data);
            if (usersContainer) {
                usersContainer.innerHTML += users.map((user, idx) => {
                        return ` 
                    <div class="user-item">
                        <div><span>${idx+1+iterations}.</span>
                        <p class="user-id">${user[0]}</p>
                        <p class="user-mail">${user[1].email}</p>
                        </div>
                        <button class="user-btn">More</button>
                    </div>`;
                    })
                    .join(' ');
                iterations += limit;
                userButtonsInit();
                get(usersRef).then((snapshot) => {
                    if (Object.keys(snapshot.val()).length == usersContainer.childElementCount) {
                        loadMoreBtn.style.display = "none";
                    }
                })
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    loadUsers(5);

    let loadMoreBtn = document.querySelector('.loadMore-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadUsers(5);
        })
    }

    function userButtonsInit() {
        let userButtons = document.querySelectorAll('.user-btn');
        let deleteButtons = document.querySelectorAll('.delete-button');
        userButtons.forEach(btn => {
            btn.onclick = function () {
                modal.style.display = "block";
                let uid = btn.parentElement.querySelector('.user-id').textContent;
                getDetailedUser(uid);
            }
        })
        deleteButtons.forEach(btn => {
            btn.onclick = function () {
                let uid = '';
                let email = ''
                let password = '';
                const userRef = ref_database(database, 'users/' + this.getAttribute('data-id'));
                get(userRef).then((snapshot) => {
                    uid = this.getAttribute('data-id');
                    email = snapshot.val().email;
                    password = snapshot.val().password;
                }).then(() => {
                    deleteUser(uid, email, password);;
                })
            }
        })
    }

    function deleteUser(uid, email, password) {
        fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "email": email,
                    "password": password,
                    "returnSecureToken": true
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to get user ID token');
                }
            })
            .then(data => {
                const userIdToken = data.idToken;
                return fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${firebaseConfig.apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            idToken: userIdToken
                        })
                    })
                    .then(() => {
                        remove(ref_database(database, 'users/' + uid)).then(() => {
                            usersContainer.innerHTML = '';
                            lastItemKey = '';
                            iterations = 0;
                            loadUsers(5);
                            loadMoreBtn.style.display = "block";
                        });
                    })
                    .catch(error => {
                        console.log(error);
                    });
            })
            .catch(error => {
                console.log(error);
            });
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
                    <p>Admin: ${snapshot.val().admin || false}</p>
                    <button class="delete-button" data-id="${id}">Delete user</button>
                    `;
                userButtonsInit();
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
                update(ref_database(database, 'users/' + newUser.uid), {
                    image: url,
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