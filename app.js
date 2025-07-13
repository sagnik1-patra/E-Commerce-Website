const mainContent = document.getElementById("main-content");
const cartCount = document.getElementById("cart-count");
const searchInput = document.getElementById("search");
const logo = document.getElementById("logo");
const cartModal = document.getElementById("cart-modal");
const closeCart = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const buyNowBtn = document.getElementById("buy-now");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

// Update cart count
function updateCartCount() {
  cartCount.textContent = cart.length;
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Add product to cart
function addToCart(product) {
  cart.push(product);
  updateCartCount();
  alert(`${product.title} added to cart!`);
}

// Remove product from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartCount();
  renderCartItems();
}

// Render cart modal items
function renderCartItems() {
  cartItemsContainer.innerHTML = "";
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div>
        <img src="${item.thumbnail}" alt="${item.title}">
        <span>${item.title}</span>
      </div>
      <div>
        <span>₹${Math.round(item.price * 85)}</span>
        <button onclick="removeFromCart(${index})">❌</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });
}

// Create product card
function createCard(product) {
  const div = document.createElement("div");
  div.className = "product-card";
  div.innerHTML = `
    <img src="${product.thumbnail}" alt="${product.title}">
    <h3>${product.title}</h3>
    <p>₹${Math.round(product.price * 85)}</p>
    <button>Add to Cart</button>
  `;
  div.querySelector("button").addEventListener("click", () => addToCart(product));
  return div;
}

// Group by category
function groupByCategory(products) {
  return products.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});
}

// Render all products
function renderProducts(products) {
  mainContent.innerHTML = "";
  const grouped = groupByCategory(products);
  Object.keys(grouped).forEach(category => {
    const section = document.createElement("div");
    section.className = "section";
    section.innerHTML = `<h2>${category}</h2>`;
    const grid = document.createElement("div");
    grid.className = "product-grid";
    grouped[category].forEach(p => grid.appendChild(createCard(p)));
    section.appendChild(grid);
    mainContent.appendChild(section);
  });
}

// Fetch products
async function fetchProducts(limit = 100) {
  const res = await fetch(`https://dummyjson.com/products?limit=${limit}`);
  const data = await res.json();
  allProducts = data.products;
  renderProducts(allProducts);
}

// Filter products
searchInput.addEventListener("input", e => {
  const text = e.target.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.title.toLowerCase().includes(text) ||
    p.category.toLowerCase().includes(text)
  );
  renderProducts(filtered);
});

// Cart modal events
document.getElementById("cart").addEventListener("click", () => {
  renderCartItems();
  cartModal.style.display = "block";
});
closeCart.addEventListener("click", () => cartModal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === cartModal) cartModal.style.display = "none";
});

// Proceed to Buy
buyNowBtn.addEventListener("click", () => {
  alert("Proceeding to checkout...");
  cart = [];
  updateCartCount();
  renderCartItems();
  cartModal.style.display = "none";
});

// Scroll to top
logo.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Init
updateCartCount();
fetchProducts();
