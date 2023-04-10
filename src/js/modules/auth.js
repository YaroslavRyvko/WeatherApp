import {
    initializeApp
} from 'firebase/app';
import {
    getDatabase,
    set,
    ref,
    runTransaction,
} from "firebase/database";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

export function initAuth() {
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

    //Initialize Path
    let path = window.location.href;
    let newPath = path.slice(0, path.lastIndexOf('/'));

    //Get current User
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    checkAuthState(currentUser);

    if (signUpForm) {
        signUpForm.submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let email = signUpForm.email.value;
            let password = signUpForm.password.value;
            if (!validation(signUpForm, email, password)) return;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const userData = userCredential.user;
                    set(ref(database, "users/" + userData.uid), {
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
                    const fieldRef = ref(database, 'users/' + userData.uid + '/loginCount');
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

    // Auth State
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
}