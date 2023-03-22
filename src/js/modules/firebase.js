import {
    initializeApp
} from 'firebase/app';
import {
    getDatabase,
    set,
    ref,
    update
} from "firebase/database";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "firebase/auth";

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

    if (signUpForm) {
        signUpForm.submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let email = signUpForm.email.value;
            let password = signUpForm.password.value;
            validation(signUpForm, email, password)

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;

                    set(ref(database, "users/" + user.uid), {
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
            validation(signinForm, email, password)

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const dt = new Date();

                    update(ref(database, 'users/' + user.uid), {
                        last_login: dt,
                    })
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

    //Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (window.location.href.includes('/auth.html')) {
                window.location.replace(window.location.host + "/index.html");
            }
        } else {
            if (!window.location.href.includes('auth.html')) {
                window.location.replace(window.location.host + "/auth.html");
            }
        }
    });

    //Logout
    let logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.replace(window.location.host + "/auth.html");
            }).catch((error) => {
                const errorMessage = error.message;
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