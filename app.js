const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// Elements
const mainContent = document.getElementById("main-content");
const skeletonGrid = document.getElementById("skeleton-grid");
const cartCount = document.getElementById("cart-count");
const searchInput = document.getElementById("search");
const clearSearchBtn = document.getElementById("clear-search");
const logo = document.getElementById("logo");
const cartModal = document.getElementById("cart-modal");
const closeCart = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartSummary = document.getElementById("cart-summary");
const buyNowBtn = document.getElementById("buy-now");
const clearCartBtn = document.getElementById("clear-cart");
const productModal = document.getElementById("product-modal");
const closeProduct = document.getElementById("close-product");
const pmBody = document.getElementById("pm-body");
const priceRange = document.getElementById("price-range");
const priceRangeLabel = document.getElementById("price-range-label");
const sortSelect = document.getElementById("sort-select");
const starsFilter = document.getElementById("stars-filter");
const openFilters = document.getElementById("open-filters");
const closeFilters = document.getElementById("close-filters");
const filtersPanel = document.getElementById("filters-panel");
const chips = document.getElementById("category-chips");
const toast = document.getElementById("toast");

// State
let cart = JSON.parse(localStorage.getItem("bb_cart") || "[]");
let allProducts = [];
let activeCategory = "all";
let maxPrice = 50000;
let minStars = 0; // 0..5
let query = "";

// Utils
const INR = new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'});
const toINR = (usd) => INR.format(Math.round(usd * 84.5)); // simple FX conversion
const showToast = (msg) => { toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1600); };
const saveCart = () => localStorage.setItem("bb_cart", JSON.stringify(cart));
const by = (k, dir=1) => (a,b) => (a[k]>b[k]?1:-1)*dir;

// Render skeletons
function renderSkeletons(n=12){
  skeletonGrid.innerHTML = '';
  for(let i=0;i<n;i++){
    const s = document.createElement('div');
    s.className='skel-card';
    s.innerHTML = '<div class="skeleton skel-img"></div><div class="skel-body"><div class="skeleton skel-line" style="width:80%"></div><div class="skeleton skel-line" style="width:60%"></div><div class="skeleton skel-line" style="width:40%"></div></div>'
    skeletonGrid.appendChild(s);
  }
}

// Update cart count
function updateCartCount(){ cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0); saveCart(); }

// Add product to cart (with qty)
function addToCart(product, qty=1){
  const idx = cart.findIndex(i=>i.id===product.id);
  if(idx>-1){ cart[idx].qty += qty; }
  else { cart.push({id:product.id, title:product.title, price:product.price, thumbnail:product.thumbnail, qty}); }
  updateCartCount();
  renderCartItems();
  showToast(`${product.title} added to cart`);
}

// Remove product from cart
function removeFromCart(id){ cart = cart.filter(i=>i.id!==id); updateCartCount(); renderCartItems(); }

// Change qty
function changeQty(id, delta){
  const item = cart.find(i=>i.id===id); if(!item) return;
  item.qty += delta; if(item.qty<=0){ removeFromCart(id); } else { updateCartCount(); renderCartItems(); }
}

// Cart summary & items
function renderCartItems(){
  cartItemsContainer.innerHTML = '';
  if(cart.length===0){
    cartItemsContainer.innerHTML = '<p class="muted">Your cart is empty.</p>';
    cartSummary.innerHTML = '';
    return;
  }
  cart.forEach(item=>{
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.title}">
      <div>
        <div><strong>${item.title}</strong></div>
        <div class="muted">${toINR(item.price)}</div>
        <div class="qty">
          <button aria-label="Decrease" data-dec="${item.id}">−</button>
          <span>${item.qty}</span>
          <button aria-label="Increase" data-inc="${item.id}">+</button>
          <button aria-label="Remove" data-del="${item.id}">Remove</button>
        </div>
      </div>
      <div class="price">${INR.format(Math.round(item.price*84.5*item.qty))}</div>`;
    cartItemsContainer.appendChild(row);
  });
  cartItemsContainer.addEventListener('click', onCartClick, { once:true });

  const subtotal = cart.reduce((s,i)=> s + (i.price*84.5*i.qty), 0);
  const shipping = subtotal>999 ? 0 : 79;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;
  cartSummary.innerHTML = `
    <div class="muted">Subtotal: <strong>${INR.format(Math.round(subtotal))}</strong></div>
    <div class="muted">Shipping: <strong>${shipping?INR.format(shipping):'FREE'}</strong></div>
    <div class="muted">Tax (5%): <strong>${INR.format(Math.round(tax))}</strong></div>
    <div class="price">Grand Total: ${INR.format(Math.round(total))}</div>`;
}

function onCartClick(e){
  const idInc = e.target.getAttribute('data-inc');
  const idDec = e.target.getAttribute('data-dec');
  const idDel = e.target.getAttribute('data-del');
  if(idInc) changeQty(Number(idInc), +1);
  if(idDec) changeQty(Number(idDec), -1);
  if(idDel) removeFromCart(Number(idDel));
}

// Create product card
function createCard(p){
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="card-media">
      <img src="${p.thumbnail}" alt="${p.title}">
      <button class="quick" data-quick="${p.id}">Quick view</button>
      ${p.discountPercentage ? `<span class="card-badge">${Math.round(p.discountPercentage)}% off</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-title">${p.title}</div>
      <div class="card-sub">${p.category.replaceAll('-', ' ')}</div>
      <div class="card-foot">
        <span class="price">${toINR(p.price)}</span>
        <button class="add-btn" data-add="${p.id}">Add</button>
      </div>
    </div>`;
  div.addEventListener('click', (e)=>{
    if(e.target.matches('[data-add]')){ const id=Number(e.target.getAttribute('data-add')); const prod = allProducts.find(x=>x.id===id); addToCart(prod,1); }
    if(e.target.matches('[data-quick]')){ const id=Number(e.target.getAttribute('data-quick')); openProduct(id); }
  });
  return div;
}

// Group by category
function groupByCategory(products){
  return products.reduce((acc, p)=>{ (acc[p.category] ||= []).push(p); return acc; }, {});
}

// Render products sections
function renderProducts(products){
  mainContent.innerHTML = '';
  if(!products.length){ mainContent.innerHTML = '<p class="muted">No products match your filters.</p>'; return; }
  const grouped = groupByCategory(products);
  Object.keys(grouped).sort().forEach(cat=>{
    const section = document.createElement('section');
    section.className = 'section';
    section.innerHTML = `<h2>${cat.replaceAll('-', ' ')}</h2>`;
    const grid = document.createElement('div');
    grid.className = 'product-grid';
    grouped[cat].forEach(p => grid.appendChild(createCard(p)));
    section.appendChild(grid);
    mainContent.appendChild(section);
  });
}

// Fetch products
async function fetchProducts(limit=100){
  renderSkeletons();
  try{
    const res = await fetch(`https://dummyjson.com/products?limit=${limit}`);
    const data = await res.json();
    allProducts = data.products;
    buildCategories(allProducts);
    applyFilters();
  }catch(err){
    skeletonGrid.innerHTML = '<p>Failed to load products. Please refresh.</p>';
  }finally{
    skeletonGrid.innerHTML = '';
  }
}

// Category chips
function buildCategories(list){
  const cats = Array.from(new Set(list.map(p=>p.category))).sort();
  chips.innerHTML = `<button class="chip ${activeCategory==='all'?'active':''}" data-cat="all">All</button>` +
    cats.map(c=>`<button class="chip ${c===activeCategory?'active':''}" data-cat="${c}">${c.replaceAll('-', ' ')}</button>`).join('');
  chips.onclick = (e)=>{ if(e.target.matches('[data-cat]')){ activeCategory = e.target.getAttribute('data-cat'); buildCategories(allProducts); applyFilters(); window.scrollTo({top: document.querySelector('.hero').offsetHeight, behavior:'smooth'}); } };
}

// Stars filter buttons
function buildStars(){
  const opts=[4,3,2,1];
  starsFilter.innerHTML = `<button data-stars="0" class="${minStars===0?'active':''}">Any</button>` +
    opts.map(s=>`<button data-stars="${s}" class="${minStars===s?'active':''}">${s}★ & up</button>`).join('');
  starsFilter.onclick=(e)=>{ const v=Number(e.target.getAttribute('data-stars')); if(Number.isFinite(v)){ minStars=v; buildStars(); applyFilters(); } };
}

// Apply filters + search + sort
function applyFilters(){
  let out = [...allProducts];
  if(activeCategory!=="all") out = out.filter(p=>p.category===activeCategory);
  if(query) out = out.filter(p => (p.title+p.description+p.category).toLowerCase().includes(query));
  out = out.filter(p => (p.price*84.5) <= maxPrice);
  if(minStars>0) out = out.filter(p => p.rating >= minStars);
  switch(sortSelect.value){
    case 'price-asc': out.sort(by('price', +1)); break;
    case 'price-desc': out.sort(by('price', -1)); break;
    case 'rating-desc': out.sort(by('rating', -1)); break;
    default: /* relevance */ break;
  }
  renderProducts(out);
}

// Product modal
function openProduct(id){
  const p = allProducts.find(x=>x.id===id); if(!p) return;
  const imgs = [p.thumbnail, ...(p.images||[]).slice(0,3)];
  pmBody.innerHTML = `
    <div class="pm-gallery">${imgs.map(src=>`<img src="${src}" alt="${p.title}">`).join('')}</div>
    <div class="pm-meta">
      <h3>${p.title}</h3>
      <div class="muted">${p.category.replaceAll('-', ' ')} • ${p.rating}★</div>
      <div class="price" style="font-size:1.35rem">${toINR(p.price)} ${p.discountPercentage?`<span class="muted" style="text-decoration:line-through; margin-left:.4rem">${toINR(p.price/(1-p.discountPercentage/100))}</span>`:''}</div>
      <p>${p.description}</p>
      <div class="pm-actions">
        <button class="btn btn-secondary" id="pm-add1">Add</button>
        <button class="btn btn-primary" id="pm-buy">Buy now</button>
      </div>
    </div>`;
  productModal.classList.add('show');
  $('#pm-add1').onclick = ()=> addToCart(p,1);
  $('#pm-buy').onclick = ()=> { addToCart(p,1); openCart(); };
}

function closeProductModal(){ productModal.classList.remove('show'); }

// Cart modal open/close
function openCart(){ renderCartItems(); cartModal.classList.add('show'); }
function closeCartModal(){ cartModal.classList.remove('show'); }

// Events
searchInput.addEventListener('input', (e)=>{ query = e.target.value.trim().toLowerCase(); applyFilters(); });
clearSearchBtn.addEventListener('click', ()=>{ searchInput.value=''; query=''; applyFilters(); searchInput.focus(); });
logo.addEventListener('click', ()=> window.scrollTo({ top: 0, behavior: 'smooth' }));
$('#cart').addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartModal);
closeProduct.addEventListener('click', closeProductModal);
window.addEventListener('click', e=>{ if(e.target===cartModal) closeCartModal(); if(e.target===productModal) closeProductModal(); });

buyNowBtn.addEventListener('click', ()=>{
  if(cart.length===0){ showToast('Your cart is empty.'); return; }
  showToast('Mock checkout — order placed!');
  cart = []; updateCartCount(); renderCartItems(); closeCartModal();
});
clearCartBtn.addEventListener('click', ()=>{ cart=[]; updateCartCount(); renderCartItems(); });

openFilters.addEventListener('click', ()=> filtersPanel.classList.add('show'));
closeFilters.addEventListener('click', ()=> filtersPanel.classList.remove('show'));

priceRange.addEventListener('input', (e)=>{ maxPrice = Number(e.target.value); priceRangeLabel.textContent = INR.format(maxPrice); applyFilters(); });
sortSelect.addEventListener('change', applyFilters);

// Init
(function init(){
  document.getElementById('year').textContent = new Date().getFullYear();
  updateCartCount();
  buildStars();
  priceRangeLabel.textContent = INR.format(maxPrice);
  fetchProducts();
})();
