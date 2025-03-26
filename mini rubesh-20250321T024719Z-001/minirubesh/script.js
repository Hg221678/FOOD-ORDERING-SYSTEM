// Redirect users to login if not signed in
if (window.location.pathname.includes("menu.html") && !localStorage.getItem("loggedInUser")) {
    window.location.href = "login.html";
}

// Signup Function
function signup() {
    let user = document.getElementById("signupUser").value.trim();
    let pass = document.getElementById("signupPass").value.trim();

    if (user && pass) {
        localStorage.setItem("user", user);
        localStorage.setItem("pass", pass);
        alert("Signup Successful! Now login to continue.");
        window.location.href = "login.html";
    } else {
        alert("Please enter a valid username and password.");
    }
}

// Login Function
function login() {
    let user = document.getElementById("loginUser").value.trim();
    let pass = document.getElementById("loginPass").value.trim();
    let storedUser = localStorage.getItem("user");
    let storedPass = localStorage.getItem("pass");

    if (user === storedUser && pass === storedPass) {
        localStorage.setItem("loggedInUser", user);
        alert("Login Successful!");
        window.location.href = "menu.html";
    } else {
        alert("Invalid username or password!");
    }
}

// Display Username in Menu Page
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("userDisplay")) {
        document.getElementById("userDisplay").innerText = "Welcome, " + (localStorage.getItem("loggedInUser") || "Guest");
    }
});

// Logout Function
function logout() {
    localStorage.removeItem("loggedInUser");
    alert("Logged out successfully!");
    window.location.href = "login.html";
}

// Initialize Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Add to Cart Function
function addToCart(name, price) {
    let item = cart.find(item => item.name === name);
    if (item) {
        item.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
    alert(`${name} added to cart!`);
}

// Update Cart Display
function updateCartDisplay() {
    let cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    let cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    if (document.getElementById("cartCount")) {
        document.getElementById("cartCount").innerText = cartCount;
    }

    if (document.getElementById("cartTotal")) {
        document.getElementById("cartTotal").innerText = "₹" + cartTotal.toFixed(2);
    }
}

// Redirect to Cart Page
function goToCart() {
    window.location.href = "cart.html";
}

// Load Cart Items in Cart Page
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("cartItems")) {
        let cartItemsContainer = document.getElementById("cartItems");
        let cartTotalAmount = 0;
        cartItemsContainer.innerHTML = "";

        cart.forEach((item, index) => {
            let itemTotal = item.price * item.quantity;
            cartTotalAmount += itemTotal;

            let li = document.createElement("li");
            li.innerHTML = `${item.name} - ₹${item.price} x ${item.quantity} 
                <button onclick="removeFromCart(${index})">Remove</button>`;
            cartItemsContainer.appendChild(li);
        });

        document.getElementById("cartTotal").innerText = "₹" + cartTotalAmount.toFixed(2);
    }
});

// Remove Item from Cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.reload();
}

// Proceed to Payment
function goToPayment() {
    let address = prompt("Enter your delivery address:");
    if (!address) {
        alert("Please enter an address to proceed.");
        return;
    }
    localStorage.setItem("currentOrderAddress", address);
    window.location.href = "payment.html";
}

// UPI Payment Function
function payUPI(method) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    let address = localStorage.getItem("currentOrderAddress");

    if (!address) {
        alert("Please enter a delivery address before proceeding.");
        return;
    }

    let upiLink = {
        googlepay: `upi://pay?pa=rubeshkrishna2005@oksbi&pn=FoodOrder&am=${totalAmount}&cu=INR`,
        phonepe: `upi://pay?pa=rubeshkrishna2005@oksbi&pn=FoodOrder&am=${totalAmount}&cu=INR`,
        paytm: `upi://pay?pa=rubeshkrishna2005@oksbi&pn=FoodOrder&am=${totalAmount}&cu=INR`
    };
    window.location.href = upiLink[method];

    setTimeout(() => {
        finalizeOrder("UPI Payment");
    }, 5000);
}

// Cash on Delivery (COD) Function
function payCOD() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("Your cart is empty! Add items before placing an order.");
        return;
    }

    let address = localStorage.getItem("currentOrderAddress");
    if (!address) {
        alert("Please enter a delivery address before proceeding.");
        return;
    }

    finalizeOrder("Cash on Delivery");
}

// Finalize Order
function finalizeOrder(paymentMethod) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    let address = localStorage.getItem("currentOrderAddress");

    let order = {
        items: cart,
        totalAmount,
        paymentMethod,
        address,
        status: "Order Placed"
    };

    localStorage.setItem("order", JSON.stringify(order));
    localStorage.removeItem("cart");
    localStorage.removeItem("currentOrderAddress");

    alert("Order placed successfully! You will pay on delivery.");
    window.location.href = "order.html";
}

// Load Order Tracking with Live Updates & Google Maps Tracking
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("orderStatus")) {
        let order = JSON.parse(localStorage.getItem("order"));

        if (order) {
            let statusElement = document.getElementById("orderStatus");
            let orderStages = ["Order Placed ✅", "Preparing Food 🍳", "Out for Delivery 🚚", "Delivered ✅"];
            let currentStage = 0;

            function updateStatus() {
                if (currentStage < orderStages.length) {
                    statusElement.innerHTML = `<h3>${orderStages[currentStage]}</h3>
                        <p>Total Amount: ₹${order.totalAmount}</p>
                        <p>Payment Method: ${order.paymentMethod}</p>
                        <p>Delivery Address: ${order.address}</p>`;
                    currentStage++;
                    setTimeout(updateStatus, 5000);
                }
            }
            updateStatus();
            loadLiveLocation();
        } else {
            document.getElementById("orderStatus").innerHTML = "<p>No recent orders found.</p>";
        }
    }
});

// Live Tracking with Google Maps
function loadLiveLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
}

function showPosition(position) {
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: { lat: position.coords.latitude, lng: position.coords.longitude },
    });
    new google.maps.Marker({ position: map.center, map: map, title: "Your Order is Here!" });
}
