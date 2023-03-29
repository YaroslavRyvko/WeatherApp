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
    onAuthStateChanged,
    updatePassword,
    signOut,
} from "firebase/auth";
import {
    getStorage,
    ref as ref_storage,
    uploadBytes 
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
    const auth = getAuth();

    //Initialize Forms
    const signUpForm = document.forms.signUpForm;
    const signinForm = document.forms.signInForm;
    const profileForm = document.forms.profileForm;


    if (signUpForm) {
        signUpForm.submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let email = signUpForm.email.value;
            let password = signUpForm.password.value;
            validation(signUpForm, email, password);

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    set(ref_database(database, "users/" + user.uid), {
                        email: email,
                        password: password,
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
            validation(signinForm, email, password);

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    signinForm.querySelector('.error').textContent = errorMessage;
                });

            signinForm.password.value = '';
        });
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

    if (profileForm) {
        profileForm.submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let file = profileForm.file.files[0];
            let email = profileForm.email.value;
            let password = profileForm.password.value;
            let name = profileForm.name.value;
            let sureName = profileForm.sureName.value;
            let user = JSON.parse(localStorage.getItem('currentUser'));


            update(ref_database(database, 'users/' + user.uid), {
                email: email,
                password: password,
                name: name,
                sureName: sureName,
            })

            uploadImage(file);

            updateEmail(auth.currentUser, email).then(() => {
                console.log('email success');
            }).catch((error) => {
                console.log(error);
            });

            // updatePassword(auth.currentUser, password).then(() => {
            //     console.log('password success');
            // }).catch((error) => {
            //     console.log(error);
            // });
        });
    }

    function uploadImage(newfile) {
        const storage = getStorage();
        const storageRef = ref_storage(storage, 'images');
        
        // 'file' comes from the Blob or File API
        uploadBytes(storageRef, newfile).then((snapshot) => {
          console.log('Uploaded a blob or file!');
        });
    }


    function getUserInfo(user) {
        const dbRef = ref_database(database);
        get(child(dbRef, 'users/' + user.uid)).then((snapshot) => {
            if (snapshot.exists()) {
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
            profileForm.name.value = user.name;
            profileForm.sureName.value = user.sureName;
        }
    }

    //Initialize Path
    let path = window.location.href;
    let newPath = path.slice(0, path.lastIndexOf('/'));

    // Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            getUserInfo(user);
            if (window.location.href.includes('/auth.html')) {
                window.location.replace(newPath);
            }
        } else {
            if (!window.location.href.includes('/auth.html')) {
                window.location.replace(newPath + "/auth.html");
            }
        }
    });

    //Logout
    let logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                localStorage.removeItem('currentUserId');
            }).catch((error) => {
                console.log(error);
            });
        });
    }

    function validation(form, email, password) {
        let errors = form.querySelectorAll('.invalid');
        errors.forEach(error => error.remove());

        if (!email) {
            form.querySelector('.email').innerHTML += '<p class="invalid">This field is required</p>';

        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            form.querySelector('.email').innerHTML += '<p class="invalid">Invalid email adress</p>';
        }
        if (!password) {
            form.querySelector('.password').innerHTML += '<p class="invalid">This field is required</p>';
        }
    }

}