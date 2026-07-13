// auth.js
const GOOGLE_CLIENT_ID = "1097716960217-sakjsskrd14d5in8qga8eisj3j3vjt4b.apps.googleusercontent.com";
const ADMIN_EMAILS = ["admin@admin.com", "user@gmail.com", "spantech121@gmail.com"]; // Add your Google account email here to test admin access

window.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

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

function getCustomProducts() {
    const stored = localStorage.getItem('customProducts');
    let products = stored ? JSON.parse(stored) : [];

    if (!localStorage.getItem('defaultsAdded')) {
        products = [...defaultProducts, ...products];
        localStorage.setItem('customProducts', JSON.stringify(products));
        localStorage.setItem('defaultsAdded', 'true');
    }
    return products;
}

function saveCustomProducts(prods) {
    localStorage.setItem('customProducts', JSON.stringify(prods));
}
document.addEventListener('DOMContentLoaded', () => {
    const isQuotationPage = window.location.pathname.endsWith('quotation.html');
    if (isQuotationPage && !getCurrentUser()) {
        window.location.href = 'index.html';
        return;
    }
    updateNavbar();
});

function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
}

function handleGoogleSignIn(credential) {
    const payload = decodeJwt(credential);
    if (!payload) {
        alert("Authentication failed: invalid token.");
        return false;
    }
    return processUserLogin(payload.email, payload.name, payload.picture);
}

function processUserLogin(email, fullName, picture) {
    const users = getUsers();
    let user = users.find(u => u.email === email);
    
    if (!user) {
        user = { 
            fullName: fullName, 
            email: email, 
            picture: picture || "images/avatar-placeholder.png", 
            registeredAt: new Date().toISOString() 
        };
        users.push(user);
        saveUsers(users);
    } else {
        user.fullName = fullName;
        user.picture = picture || user.picture || "images/avatar-placeholder.png";
        saveUsers(users);
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    return true;
}

// Keep loginUser and registerUser interfaces but map them or deprecate them.
// We will expose handleGoogleSignIn and processUserLogin for login.html
window.handleGoogleSignIn = handleGoogleSignIn;
window.processUserLogin = processUserLogin;
window.isUserAdmin = isUserAdmin;


function getQuotationHistory() {
    return JSON.parse(localStorage.getItem('quotationHistory')) || [];
}

function saveQuotationHistory(history) {
    localStorage.setItem('quotationHistory', JSON.stringify(history));
}

function addQuotationRecord(email, product, quantity, date) {
    const history = getQuotationHistory();
    history.push({ email, product, quantity, date });
    saveQuotationHistory(history);
}

function logoutUser(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html'; // Redirect to home on logout
}

// Global scope
window.logoutUser = logoutUser;

function updateNavbar() {
    const currentUser = getCurrentUser();
    const isLogged = !!currentUser;

    // Find all relevant links
    const quoteLinks = document.querySelectorAll('a[href="quotation.html"]');
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const signupLinks = document.querySelectorAll('a[href="login.html#signup"]');

    // Quotations link
    quoteLinks.forEach(a => {
        if (a.parentElement.tagName === 'LI') {
            a.parentElement.style.display = isLogged ? '' : 'none';
        }
    });

    // Hide Login/Signup
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

    // Add admin and logout links for logged in user
    if (isLogged) {
        const uls = document.querySelectorAll('nav ul');
        uls.forEach(ul => {
            // Check if logout already created to prevent duplication
            if (!ul.querySelector('.auth-extra-btn')) {
                const isAdmin = isUserAdmin(currentUser);

                const manuBtn = ul.querySelector('.manuButton');

                let adminLi = null;
                // Admin dashboard link
                if (isAdmin) {
                    adminLi = document.createElement('li');
                    adminLi.innerHTML = `<a href="admin.html" class="auth-extra-btn">ADMIN</a>`;
                }

                // Logout link
                const logoutLi = document.createElement('li');
                logoutLi.innerHTML = `<a href="#" onclick="logoutUser(event)" class="auth-extra-btn">LOGOUT</a>`;

                // Add hideOnMobile if standard
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
