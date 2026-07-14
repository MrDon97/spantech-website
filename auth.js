// auth.js
const GOOGLE_CLIENT_ID = "1097716960217-sakjsskrd14d5in8qga8eisj3j3vjt4b.apps.googleusercontent.com";
const ADMIN_EMAILS = ["admin@admin.com", "user@gmail.com", "spantech121@gmail.com"];

window.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeGiDHDsvf8KS0gRPLqf_kNRBOxu5aAJo",
  authDomain: "spantech-website.firebaseapp.com",
  projectId: "spantech-website",
  storageBucket: "spantech-website.firebasestorage.app",
  messagingSenderId: "1097716960217",
  appId: "1:1097716960217:web:d6f1e4ba57d5277aa5a7c8"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

function isUserAdmin(user) {
    return user && ADMIN_EMAILS.includes(user.email);
}
window.isUserAdmin = isUserAdmin;

const defaultProducts = [
    { name: "Ready-Mix Concrete", description: "All kind of your concrete needs", imgUrl: "images/concrete.jpg" },
    { name: "Free Cast products", description: "All kind of Free Cast product", imgUrl: "images/freecast.jpg" },
    { name: "Paving Blocks", description: "All kind of Paving Blocks", imgUrl: "images/roadblocks.jpg" },
    { name: "Cement Bricks", description: "All kind of Cement Bricks", imgUrl: "images/cement blocks.jpg" },
    { name: "Consulting", description: "All kind of Consultant needs", imgUrl: "images/consulting.jpg" },
    { name: "Re-Bar Works", description: "Re-bar bending and cutting", imgUrl: "images/rebar.jpg" }
];

async function getCustomProducts() {
    try {
        const snapshot = await db.collection('products').get();
        if (snapshot.empty) {
            // Seed defaults if empty
            const batch = db.batch();
            defaultProducts.forEach(prod => {
                const docRef = db.collection('products').doc();
                batch.set(docRef, prod);
            });
            await batch.commit();
            return defaultProducts;
        }
        let products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch(e) {
        console.error("Error fetching products", e);
        return defaultProducts;
    }
}

async function addCustomProduct(prod) {
    await db.collection('products').add(prod);
}

async function deleteCustomProduct(id) {
    await db.collection('products').doc(id).delete();
}

async function getUsers() {
    try {
        const snapshot = await db.collection('users').get();
        let users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        return users;
    } catch(e) {
        console.error("Error fetching users", e);
        return [];
    }
}

async function deleteUserRecord(id) {
    await db.collection('users').doc(id).delete();
}

function getCurrentUser() {
    // Current active session remains in localStorage
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
}

async function signInWithGoogle() {
    if (!firebase.auth) {
        alert("Firebase Auth SDK not loaded!");
        return false;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        await processUserLogin(user.email, user.displayName, user.photoURL);
        return true;
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        alert("Authentication failed: " + error.message);
        return false;
    }
}

async function processUserLogin(email, fullName, picture) {
    let userObj = {
        email: email,
        fullName: fullName,
        picture: picture || "images/avatar-placeholder.png"
    };

    try {
        const usersRef = db.collection('users');
        const q = usersRef.where("email", "==", email);
        const querySnapshot = await q.get();
        
        if (querySnapshot.empty) {
            userObj.registeredAt = new Date().toISOString();
            await usersRef.add(userObj);
        } else {
            const docRef = querySnapshot.docs[0].ref;
            await docRef.update({
                fullName: fullName,
                picture: userObj.picture
            });
        }
    } catch (error) {
        console.warn("Could not save user to Firestore (might be permission issue). Proceeding with local login.", error);
    }
    
    localStorage.setItem('currentUser', JSON.stringify(userObj));
    return true;
}

window.signInWithGoogle = signInWithGoogle;
window.processUserLogin = processUserLogin;
window.isUserAdmin = isUserAdmin;

async function getQuotationHistory() {
    try {
        const snapshot = await db.collection('quotations').orderBy('date', 'desc').get();
        let history = [];
        snapshot.forEach(doc => history.push({ id: doc.id, ...doc.data() }));
        return history;
    } catch(e) {
        console.error("Error fetching quotes", e);
        return [];
    }
}

async function addQuotationRecord(email, product, quantity, date) {
    await db.collection('quotations').add({ email, product, quantity, date });
}

function logoutUser(e) {
    if (e) e.preventDefault();
    if (firebase.auth) {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html'; // Redirect to home on logout
        }).catch(err => console.error("Logout error", err));
    } else {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Global scope
window.logoutUser = logoutUser;
window.getCustomProducts = getCustomProducts;
window.addCustomProduct = addCustomProduct;
window.deleteCustomProduct = deleteCustomProduct;
window.getUsers = getUsers;
window.deleteUserRecord = deleteUserRecord;
window.getCurrentUser = getCurrentUser;
window.getQuotationHistory = getQuotationHistory;
window.addQuotationRecord = addQuotationRecord;

async function uploadProductImage(file) {
    if (!firebase.storage) {
        throw new Error("Firebase Storage SDK not loaded.");
    }
    const storageRef = firebase.storage().ref();
    const fileName = `products/${Date.now()}_${file.name}`;
    const fileRef = storageRef.child(fileName);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
}
window.uploadProductImage = uploadProductImage;

document.addEventListener('DOMContentLoaded', () => {
    const isQuotationPage = window.location.pathname.endsWith('quotation.html');
    if (isQuotationPage && !getCurrentUser()) {
        window.location.href = 'index.html';
        return;
    }
    updateNavbar();
});

function updateNavbar() {
    const currentUser = getCurrentUser();
    const isLogged = !!currentUser;

    const quoteLinks = document.querySelectorAll('a[href="quotation.html"]');
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const signupLinks = document.querySelectorAll('a[href="login.html#signup"]');

    quoteLinks.forEach(a => {
        if (a.parentElement.tagName === 'LI') {
            a.parentElement.style.display = isLogged ? '' : 'none';
        }
    });

    loginLinks.forEach(a => {
        if (a.parentElement.tagName === 'LI') {
            a.parentElement.style.display = isLogged ? 'none' : '';
        }
    });

    signupLinks.forEach(a => {
        if (a.parentElement.tagName === 'LI') {
            a.parentElement.style.display = isLogged ? 'none' : '';
        }
    });

    if (isLogged) {
        const uls = document.querySelectorAll('nav ul');
        uls.forEach(ul => {
            if (!ul.querySelector('.auth-extra-btn')) {
                const isAdmin = isUserAdmin(currentUser);
                const manuBtn = ul.querySelector('.manuButton');

                let adminLi = null;
                if (isAdmin) {
                    adminLi = document.createElement('li');
                    adminLi.innerHTML = `<a href="admin.html" class="auth-extra-btn">ADMIN</a>`;
                }

                const logoutLi = document.createElement('li');
                logoutLi.innerHTML = `<a href="#" onclick="logoutUser(event)" class="auth-extra-btn">LOGOUT</a>`;

                if (ul.querySelector('li.hideOnMobile')) {
                    if (adminLi) adminLi.classList.add('hideOnMobile');
                    logoutLi.classList.add('hideOnMobile');
                }

                if (manuBtn) {
                    if (adminLi) ul.insertBefore(adminLi, manuBtn);
                    ul.insertBefore(logoutLi, manuBtn);
                } else {
                    if (adminLi) ul.appendChild(adminLi);
                    ul.appendChild(logoutLi);
                }
            }
        });
    }
}
