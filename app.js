/* DriveZed Motors — demo SPA. All data lives in localStorage. No backend, no real payments. */
(()=>{
const PHONE="+260970000000", PHONE_TXT="+260 97 000 0000", WA="260970000000";
const ADMIN_PW="drivezed-demo"; // demo password, intentionally shown on the login page
const $=s=>document.querySelector(s), app=$("#app");
const LS={get:(k,d)=>{try{const v=localStorage.getItem("dz_"+k);return v?JSON.parse(v):d}catch(e){return d}},set:(k,v)=>localStorage.setItem("dz_"+k,JSON.stringify(v))};
const K=n=>"K"+Math.round(n).toLocaleString("en-US");
const km=n=>n.toLocaleString("en-US")+" km";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const today=iso(new Date());
// ---------- seed ----------
if(!LS.get("v")){LS.set("cars",window.SEED_CARS);LS.set("v",1);
  LS.set("bookings",[
   {id:"bk_seed1",carId:"dz01",name:"Sample Customer",phone:"+260 96 000 0001",from:iso(addDays(new Date(),3)),to:iso(addDays(new Date(),6)),extras:["insurance"],total:0,status:"confirmed",created:Date.now()-864e5,deposit:"MTN (test)"},
   {id:"bk_seed2",carId:"dz04",name:"Demo Corporate Ltd",phone:"+260 97 000 0002",from:iso(addDays(new Date(),1)),to:iso(addDays(new Date(),4)),extras:["driver","delivery"],total:0,status:"confirmed",created:Date.now()-2*864e5,deposit:"Airtel (test)"},
   {id:"bk_seed3",carId:"dz13",name:"Wedding Booking (sample)",phone:"+260 95 000 0003",from:iso(addDays(new Date(),9)),to:iso(addDays(new Date(),10)),extras:["driver"],total:0,status:"pending",created:Date.now()-3600e3,deposit:"Zamtel (test)"}]);
  LS.set("enquiries",[{id:"eq_seed1",type:"Test drive",carId:"dz02",name:"Sample Lead",phone:"+260 96 000 0004",msg:"Can I test drive on Saturday morning?",date:iso(addDays(new Date(),2)),created:Date.now()-5e6}]);
}
const cars=()=>LS.get("cars",[]), setCars=c=>LS.set("cars",c), car=id=>cars().find(c=>c.id===id);
const favs=()=>LS.get("favs",[]), cmp=()=>LS.get("cmp",[]);
const EXTRAS={driver:{n:"Professional driver",p:450,per:"day"},insurance:{n:"Full insurance cover",p:250,per:"day"},child:{n:"Child seat",p:80,per:"day"},delivery:{n:"Delivery & collection (Lusaka)",p:350,per:"trip"}};
// ---------- helpers ----------
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),2600)}
function modal(html){$("#mbody").innerHTML=html;$("#modal").hidden=false;document.body.style.overflow="hidden"}
function closeModal(){$("#modal").hidden=true;document.body.style.overflow=""}
$("#mclose").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("#burger").onclick=()=>$("#menu").classList.toggle("open");
function waLink(text){return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`}
function counts(){$("#favCount").textContent=favs().length;$("#cmpCount").textContent=cmp().length}
function toggle(key,id,max){let a=LS.get(key,[]);if(a.includes(id))a=a.filter(x=>x!==id);else{if(max&&a.length>=max){toast(`You can compare up to ${max} cars`);return}a.push(id)}LS.set(key,a);counts();return a.includes(id)}
window.DZ={fav:(id,b)=>{const on=toggle("favs",id);if(b)b.classList.toggle("on",!!on);toast(on?"Saved to favourites ♥":"Removed from favourites");if(location.hash.startsWith("#/favourites"))route()},
 cmp:(id,b)=>{const on=toggle("cmp",id,3);if(on===undefined)return;if(b)b.classList.toggle("on",on);toast(on?"Added to compare":"Removed from compare");if(location.hash.startsWith("#/compare"))route()}};
function bookedDates(carId){const s=new Set();LS.get("bookings",[]).filter(b=>b.carId===carId&&b.status!=="cancelled").forEach(b=>{for(let d=new Date(b.from);iso(d)<=b.to;d=addDays(d,1))s.add(iso(d))});return s}
function status(c){return c.status==="sold"?'<span class="tag r">SOLD</span>':c.status==="rented"?'<span class="tag s">ON HIRE</span>':""}
function cardHTML(c){const f=favs().includes(c.id),m=cmp().includes(c.id);return `<article class="card fade">
 <a href="#/car/${c.id}" class="ph"><img loading="lazy" src="${esc(c.img)}" alt="${esc(c.year+" "+c.make+" "+c.model)}"><div class="tags">${c.price?'<span class="tag g">FOR SALE</span>':""}${c.rent?'<span class="tag">FOR HIRE</span>':""}${status(c)}</div></a>
 <div class="ic"><button class="${f?"on":""}" title="Favourite" onclick="DZ.fav('${c.id}',this)">♥</button><button class="${m?"on":""}" title="Compare" onclick="DZ.cmp('${c.id}',this)">⇄</button></div>
 <div class="bd"><a href="#/car/${c.id}"><h3>${c.year} ${esc(c.make)} ${esc(c.model)}</h3></a>
 <div class="specs"><span>⏱ ${km(c.mileage)}</span><span>⛽ ${c.fuel}</span><span>⚙ ${c.gearbox}</span><span>🚘 ${c.body}</span></div>
 <div class="prices"><div>${c.price?`<div class="price">${K(c.price)}</div>`:'<div class="muted">Hire only</div>'}</div><div class="rate">${c.rent?`<b>${K(c.rent)}</b>/day`:"Sale only"}</div></div></div></article>`}
const makes=()=>[...new Set(cars().map(c=>c.make))].sort();
// ---------- pages ----------
function home(){const cs=cars(),feat=cs.filter(c=>c.featured&&c.status!=="sold").slice(0,6);
 app.innerHTML=`<section class="hero" style="padding:0"><img class="bg" src="img/c7.jpg" alt="">
 <div class="wrap"><div class="eyebrow">Lusaka · Buy · Rent · Finance</div><h1>Drive something <span class="gold">remarkable</span>.</h1>
 <p>Hand-picked quality cars for sale and hire in Lusaka. Transparent Kwacha pricing, flexible finance and instant online booking.</p>
 <form class="search" id="hs"><div class="seg" id="hmode"><button type="button" class="on" data-m="buy">Buy</button><button type="button" data-m="rent">Rent</button></div>
 <select id="hmake"><option value="">Any make</option>${makes().map(m=>`<option>${m}</option>`).join("")}</select>
 <select id="hprice"><option value="">Any price</option></select><button class="btn gold">Search cars</button></form></div></section>
 <section><div class="wrap"><div class="stats"><div class="stat"><b>${cs.length}</b><span class="muted">Sample vehicles</span></div><div class="stat"><b>${cs.filter(c=>c.rent).length}</b><span class="muted">Available for hire</span></div><div class="stat"><b>${makes().length}</b><span class="muted">Brands</span></div><div class="stat"><b>24/7</b><span class="muted">WhatsApp enquiries</span></div></div></div></section>
 <section style="padding-top:0"><div class="wrap"><div class="sec-h"><div><div class="eyebrow">Sample stock</div><h2>Featured cars</h2></div><a class="btn ghost sm" href="#/browse">View all →</a></div><div class="grid">${feat.map(cardHTML).join("")}</div></div></section>
 <section><div class="wrap"><div class="sec-h"><h2>Why DriveZed</h2></div><div class="why">
 <div>🛡️<b>Inspected vehicles</b><span class="muted">Every car goes through a multi-point check before listing.</span></div>
 <div>💳<b>Mobile money deposits</b><span class="muted">Reserve with Airtel Money, MTN MoMo or Zamtel Kwacha.</span></div>
 <div>📆<b>Instant hire booking</b><span class="muted">Pick dates, add a driver or insurance, see your total instantly.</span></div>
 <div>🔁<b>Trade-in welcome</b><span class="muted">Get a valuation on your current car and upgrade.</span></div></div></div></section>
 <section><div class="wrap"><div class="cta"><div><h2>Thinking about finance?</h2><p class="muted">Estimate your monthly repayment in seconds.</p></div><a class="btn gold" href="#/finance">Open calculator</a></div></div></section>`;
 let mode="buy";const fillP=()=>{const o=mode==="buy"?[[200000,"Up to K200,000"],[500000,"Up to K500,000"],[900000,"Up to K900,000"],[1500000,"Up to K1.5m"]]:[[800,"Up to K800/day"],[1500,"Up to K1,500/day"],[2500,"Up to K2,500/day"],[5000,"Up to K5,000/day"]];$("#hprice").innerHTML='<option value="">Any price</option>'+o.map(([v,t])=>`<option value="${v}">${t}</option>`).join("")};fillP();
 $("#hmode").onclick=e=>{const b=e.target.closest("button");if(!b)return;mode=b.dataset.m;[...$("#hmode").children].forEach(x=>x.classList.toggle("on",x===b));fillP()};
 $("#hs").onsubmit=e=>{e.preventDefault();const p=new URLSearchParams({mode});if($("#hmake").value)p.set("make",$("#hmake").value);if($("#hprice").value)p.set("max",$("#hprice").value);location.hash="#/browse?"+p}}
function browse(q){const p=new URLSearchParams(q);const st={mode:p.get("mode")||"all",make:p.get("make")||"",body:"",fuel:"",gear:"",min:"",max:p.get("max")||"",q:"",sort:"featured",avail:false};
 const opts=(a)=>a.map(x=>`<option>${x}</option>`).join("");const all=cars();
 app.innerHTML=`<div class="wrap"><div class="page-h"><div class="eyebrow">Sample stock</div><h1>Browse cars</h1></div>
 <div class="layout"><aside class="filters" id="filters">
 <label>Buy or rent</label><div class="seg" id="fmode"><button data-m="all">All</button><button data-m="buy">Buy</button><button data-m="rent">Rent</button></div>
 <label>Make</label><select id="fmake"><option value="">All makes</option>${opts(makes())}</select>
 <label>Body type</label><select id="fbody"><option value="">All types</option>${opts([...new Set(all.map(c=>c.body))].sort())}</select>
 <label>Fuel</label><select id="ffuel"><option value="">Any fuel</option>${opts([...new Set(all.map(c=>c.fuel))].sort())}</select>
 <label>Gearbox</label><select id="fgear"><option value="">Any gearbox</option><option>Automatic</option><option>Manual</option></select>
 <label id="plab">Price range (K)</label><div class="row"><input id="fmin" type="number" placeholder="Min" inputmode="numeric"><input id="fmax" type="number" placeholder="Max" inputmode="numeric"></div>
 <label class="chk"><input type="checkbox" id="favail"> Hide sold / on hire</label>
 <button class="btn ghost sm block" id="freset" style="margin-top:10px">Reset filters</button></aside>
 <div><div class="toolbar"><button class="btn sm fbtn" id="ftog">⚙ Filters</button><input id="fq" type="search" placeholder="Search make, model, colour…"><select id="fsort"><option value="featured">Featured</option><option value="plh">Price: low → high</option><option value="phl">Price: high → low</option><option value="new">Year: newest</option><option value="km">Mileage: lowest</option></select></div>
 <p class="muted" id="fcount" style="margin-bottom:12px"></p><div class="grid" id="res"></div></div></div></div>`;
 const set=(id,v)=>{const el=$(id);if(el)el.value=v};set("#fmake",st.make);set("#fmax",st.max);
 const draw=()=>{[...$("#fmode").children].forEach(b=>b.classList.toggle("on",b.dataset.m===st.mode));$("#plab").textContent=st.mode==="rent"?"Daily rate (K)":"Price range (K)";
  const pr=c=>st.mode==="rent"?c.rent:(c.price||c.rent);
  let r=cars().filter(c=>(st.mode==="all"||(st.mode==="buy"?c.price:c.rent))&&(!st.make||c.make===st.make)&&(!st.body||c.body===st.body)&&(!st.fuel||c.fuel===st.fuel)&&(!st.gear||c.gearbox===st.gear)&&(!st.min||pr(c)>=+st.min)&&(!st.max||pr(c)<=+st.max)&&(!st.avail||c.status==="available")&&(!st.q||`${c.year} ${c.make} ${c.model} ${c.color} ${c.body}`.toLowerCase().includes(st.q.toLowerCase())));
  const s={plh:(a,b)=>pr(a)-pr(b),phl:(a,b)=>pr(b)-pr(a),new:(a,b)=>b.year-a.year,km:(a,b)=>a.mileage-b.mileage,featured:(a,b)=>(b.featured-a.featured)||(a.status>b.status?1:-1)}[st.sort];r.sort(s);
  $("#fcount").textContent=`${r.length} vehicle${r.length===1?"":"s"} found · sample listings`;
  $("#res").innerHTML=r.length?r.map(cardHTML).join(""):'<div class="empty" style="grid-column:1/-1">No cars match these filters. <br><br><button class="btn sm" onclick="document.getElementById(\'freset\').click()">Reset filters</button></div>'};
 $("#fmode").onclick=e=>{const b=e.target.closest("button");if(b){st.mode=b.dataset.m;draw()}};
 [["#fmake","make"],["#fbody","body"],["#ffuel","fuel"],["#fgear","gear"],["#fmin","min"],["#fmax","max"],["#fq","q"],["#fsort","sort"]].forEach(([id,k])=>$(id).oninput=e=>{st[k]=e.target.value;draw()});
 $("#favail").onchange=e=>{st.avail=e.target.checked;draw()};$("#ftog").onclick=()=>$("#filters").classList.toggle("open");
 $("#freset").onclick=()=>{Object.assign(st,{mode:"all",make:"",body:"",fuel:"",gear:"",min:"",max:"",q:"",avail:false});["#fmake","#fbody","#ffuel","#fgear","#fmin","#fmax","#fq"].forEach(i=>$(i).value="");$("#favail").checked=false;draw()};draw()}
function detail(id){const c=car(id);if(!c){app.innerHTML='<div class="wrap"><div class="empty" style="margin:40px 0">Car not found. <a class="gold" href="#/browse">Back to browse</a></div></div>';return}
 const views=[["center","Exterior"],["left","Front ¾"],["right","Rear ¾"],["bottom","Detail"]];const name=`${c.year} ${c.make} ${c.model}`;
 const sold=c.status==="sold",onhire=c.status==="rented";
 app.innerHTML=`<div class="wrap"><p style="padding-top:20px" class="muted"><a href="#/browse">Browse</a> / ${esc(c.make)}</p><div class="detail">
 <div><div class="gal"><div class="main"><img id="gmain" src="${esc(c.img)}" alt="${esc(name)}"></div><div class="thumbs">${views.map((v,i)=>`<button class="${i?"":"on"}" data-p="${v[0]}" data-z="${i?1.35:1}" title="${v[1]}"><img src="${esc(c.img)}" style="object-position:${v[0]};transform:scale(${i?1.35:1})" alt="${v[1]}"></button>`).join("")}</div>
 <p class="muted" style="font-size:12px;margin-top:6px">Illustrative photo · sample listing</p></div>
 <div class="panel" style="margin-top:18px"><h3 style="font-family:Inter;font-size:17px">About this car</h3><p class="muted" style="margin-top:6px">${esc(c.desc)}</p>
 <div class="kv">${[["Year",c.year],["Mileage",km(c.mileage)],["Fuel",c.fuel],["Gearbox",c.gearbox],["Body",c.body],["Engine",c.engine],["Seats",c.seats],["Colour",c.color]].map(([k,v])=>`<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div>
 <button class="btn sm" onclick="DZ.enquire('${c.id}','Test drive')">📅 Book a test drive</button> <button class="btn sm ghost" onclick="DZ.enquire('${c.id}','General enquiry')">✉ Ask a question</button></div></div>
 <div class="sticky"><div class="panel"><div class="tags" style="position:static;margin-bottom:10px"><span class="tag s">SAMPLE STOCK</span>${status(c)}</div>
 <h1 style="font-size:28px">${esc(name)}</h1>
 <div style="display:flex;gap:22px;margin:14px 0;flex-wrap:wrap">${c.price?`<div><div class="muted" style="font-size:12px">Cash price</div><div class="price" style="font-size:26px">${K(c.price)}</div></div>`:""}${c.rent?`<div><div class="muted" style="font-size:12px">Hire from</div><div class="price" style="font-size:26px">${K(c.rent)}<small class="muted" style="font-size:13px">/day</small></div></div>`:""}</div>
 ${c.price?`<p class="muted" style="font-size:13px">Est. finance from <b class="gold">${K(pmt(c.price*.8,.28,60))}/mo</b> · 20% deposit, 60 months (illustrative)</p>`:""}
 <div class="actions">${c.price?`<button class="btn gold" ${sold?"disabled":""} onclick="DZ.buy('${c.id}')">${sold?"Sold":"Buy / Reserve"}</button><button class="btn" ${sold?"disabled":""} onclick="DZ.offer('${c.id}')">Make an offer</button>`:""}
 ${c.rent?`<button class="btn ${c.price?"":"gold"}" style="grid-column:1/-1" ${sold?"disabled":""} onclick="document.getElementById('rentbox').scrollIntoView({behavior:'smooth'})">Rent this car</button>`:""}
 <a class="btn wa" href="${waLink(`Hi DriveZed, I'm interested in the ${name} (ref ${c.id}).`)}" target="_blank" rel="noopener">WhatsApp</a><a class="btn" href="tel:${PHONE}">📞 Call</a>
 <button class="btn ghost sm" onclick="DZ.fav('${c.id}',this)">♥ Favourite</button><button class="btn ghost sm" onclick="DZ.cmp('${c.id}',this)">⇄ Compare</button>
 ${c.price?`<a class="btn ghost sm" style="grid-column:1/-1" href="#/finance?p=${c.price}">Finance calculator →</a>`:""}</div></div>
 ${c.rent&&!sold?rentBox(c):""}</div></div>
 <section><div class="sec-h"><h2>You may also like</h2></div><div class="grid">${cars().filter(x=>x.id!==c.id&&(x.body===c.body||x.make===c.make)).slice(0,3).map(cardHTML).join("")}</div></section></div>`;
 document.querySelectorAll(".thumbs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".thumbs button").forEach(x=>x.classList.remove("on"));b.classList.add("on");const g=$("#gmain");g.style.objectPosition=b.dataset.p;g.style.transform=`scale(${b.dataset.z})`;g.style.transition=".4s"});
 if(c.rent&&!sold)initRent(c)}
function rentBox(c){return `<div class="panel" id="rentbox" style="margin-top:16px"><h3 style="font-family:Inter;font-size:17px">Book this car for hire</h3>${c.status==="rented"?'<p class="err">Currently on hire — you can still book future dates.</p>':""}
 <div class="row"><div><label>Pick-up date</label><input type="date" id="rfrom" min="${today}"></div><div><label>Return date</label><input type="date" id="rto" min="${today}"></div></div>
 <label>Optional extras</label>${Object.entries(EXTRAS).map(([k,e])=>`<label class="chk"><input type="checkbox" value="${k}" class="rx"> ${e.n} <span class="muted" style="margin-left:auto">${K(e.p)}/${e.per}</span></label>`).join("")}
 <div id="rcal"></div><div class="err" id="rerr"></div><div class="sum" id="rsum"><div class="muted">Select dates to see your total.</div></div>
 <div class="row" style="margin-top:10px"><input id="rname" placeholder="Full name" autocomplete="name"><input id="rphone" placeholder="Phone (+260…)" inputmode="tel" autocomplete="tel"></div>
 <button class="btn gold block" id="rbook" style="margin-top:10px" disabled>Continue to deposit</button></div>`}
function initRent(c){const bd=bookedDates(c.id);let q=null;
 const cal=()=>{const s=new Date();s.setDate(1);let h=`<div class="muted" style="font-size:12px;margin-top:12px">Availability — ${s.toLocaleString("en",{month:"long",year:"numeric"})} & next month <span style="color:#ff9b9b">■ booked</span></div>`;
  for(let m=0;m<2;m++){const f=new Date(s.getFullYear(),s.getMonth()+m,1),n=new Date(f.getFullYear(),f.getMonth()+1,0).getDate();h+=`<div style="margin-top:8px;font-weight:600;font-size:13px">${f.toLocaleString("en",{month:"short"})}</div><div class="cal">${"MTWTFSS".split("").map(x=>`<div class="h">${x}</div>`).join("")}${"<div></div>".repeat((f.getDay()+6)%7)}`;
   for(let d=1;d<=n;d++){const k=iso(new Date(f.getFullYear(),f.getMonth(),d));const sel=q&&k>=q.from&&k<=q.to;h+=`<div class="d ${k<today?"past":""} ${bd.has(k)?"b":""} ${sel?"sel":""}">${d}</div>`}h+="</div>"}$("#rcal").innerHTML=h};
 const calc=()=>{const f=$("#rfrom").value,t=$("#rto").value;$("#rerr").textContent="";q=null;$("#rbook").disabled=true;
  if(f&&t){if(t<f){$("#rerr").textContent="Return date must be on or after pick-up.";}else{let clash=null;for(let d=new Date(f);iso(d)<=t;d=addDays(d,1))if(bd.has(iso(d))){clash=iso(d);break}
   if(clash)$("#rerr").textContent=`Sorry — ${clash} is already booked. Please choose other dates.`;else{const days=Math.round((new Date(t)-new Date(f))/864e5)+1;const ex=[...document.querySelectorAll(".rx:checked")].map(x=>x.value);
    const lines=[[`${K(c.rent)} × ${days} day${days>1?"s":""}`,c.rent*days]];ex.forEach(k=>{const e=EXTRAS[k];lines.push([`${e.n}${e.per==="day"?` × ${days}`:""}`,e.per==="day"?e.p*days:e.p])});
    const total=lines.reduce((a,l)=>a+l[1],0),dep=Math.round(total*.2);q={from:f,to:t,days,extras:ex,total,dep};
    $("#rsum").innerHTML=lines.map(l=>`<div><span>${l[0]}</span><span>${K(l[1])}</span></div>`).join("")+`<div class="tot"><span>Total</span><span>${K(total)}</span></div><div class="muted"><span>Deposit due now (20%)</span><span>${K(dep)}</span></div>`;$("#rbook").disabled=false;cal();return}}}
  $("#rsum").innerHTML='<div class="muted">Select available dates to see your total.</div>';cal()};
 ["#rfrom","#rto"].forEach(i=>$(i).onchange=calc);document.querySelectorAll(".rx").forEach(x=>x.onchange=calc);calc();
 $("#rbook").onclick=()=>{const name=$("#rname").value.trim(),phone=$("#rphone").value.trim();if(!name||phone.length<9){$("#rerr").textContent="Please enter your name and a valid phone number.";return}
  pay(q.dep,`Hire deposit · ${c.year} ${c.make} ${c.model}`,(net)=>{const b=LS.get("bookings",[]);b.push({id:uid("bk_"),carId:c.id,name,phone,from:q.from,to:q.to,extras:q.extras,total:q.total,status:"pending",created:Date.now(),deposit:net+" (test)"});LS.set("bookings",b);detail(c.id);toast("Booking received! Reference sent (demo).")},phone)}}
function pmt(P,rate,n){const r=rate/12;return r?P*r/(1-Math.pow(1+r,-n)):P/n}
// ---------- modals ----------
function pay(amount,label,done,phone=""){let net="";modal(`<div class="testmode">⚠ TEST MODE — NO REAL PAYMENT</div><h2>Mobile money deposit</h2><p class="muted" style="margin:6px 0">${esc(label)}</p>
 <div class="sum"><div class="tot" style="border:0;margin:0;padding:0"><span>Amount</span><span>${K(amount)}</span></div></div>
 <label>Choose network</label><div class="mm"><button data-n="Airtel Money" class="airtel">Airtel Money</button><button data-n="MTN MoMo" class="mtn">MTN MoMo</button><button data-n="Zamtel Kwacha" class="zamtel">Zamtel Kwacha</button></div>
 <label>Mobile money number</label><input id="mmno" value="${esc(phone)}" placeholder="+260 9X XXX XXXX" inputmode="tel"><div class="err" id="mmerr"></div>
 <button class="btn gold block" id="mmgo" style="margin-top:14px">Simulate payment prompt</button><p class="muted" style="font-size:12px;margin-top:10px;text-align:center">This is a demonstration. No money is requested or moved. A live site would integrate a licensed payment gateway.</p>`);
 document.querySelectorAll(".mm button").forEach(b=>b.onclick=()=>{net=b.dataset.n;document.querySelectorAll(".mm button").forEach(x=>x.classList.toggle("on",x===b))});
 $("#mmgo").onclick=()=>{if(!net){$("#mmerr").textContent="Select a network.";return}if($("#mmno").value.replace(/\D/g,"").length<9){$("#mmerr").textContent="Enter a valid number.";return}
  $("#mbody").innerHTML=`<div class="testmode">⚠ TEST MODE</div><div style="text-align:center;padding:20px"><div style="font-size:40px">📲</div><h3>Simulating ${esc(net)} prompt…</h3><p class="muted">In a live system the customer would approve on their phone.</p></div>`;
  setTimeout(()=>{$("#mbody").innerHTML=`<div class="testmode">⚠ TEST MODE — NO REAL PAYMENT</div><div style="text-align:center;padding:16px"><div style="font-size:46px">✅</div><h2>Deposit simulated</h2><p class="muted">${K(amount)} via ${esc(net)} (test). Ref: DZ-${Math.random().toString(36).slice(2,8).toUpperCase()}</p><button class="btn gold" style="margin-top:14px" onclick="document.getElementById('mclose').click()">Done</button></div>`;done(net)},1600)}}
function saveEnq(o){const e=LS.get("enquiries",[]);e.push({id:uid("eq_"),created:Date.now(),...o});LS.set("enquiries",e)}
DZ.enquire=(id,type)=>{const c=car(id);modal(`<h2>${esc(type)}</h2><p class="muted">${c?esc(`${c.year} ${c.make} ${c.model}`):""}</p><form id="eqf"><label>Full name</label><input name="name" required><label>Phone</label><input name="phone" required inputmode="tel" placeholder="+260…"><label>Preferred date</label><input name="date" type="date" min="${today}"><label>Message</label><textarea name="msg" rows="3" placeholder="Anything we should know?"></textarea><button class="btn gold block" style="margin-top:14px">Send request</button></form>`);
 $("#eqf").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));saveEnq({type,carId:id,...f});closeModal();toast("Thanks! The team will contact you (demo).")}};
DZ.offer=id=>{const c=car(id);modal(`<h2>Make an offer</h2><p class="muted">${esc(`${c.year} ${c.make} ${c.model}`)} · Asking ${K(c.price)}</p><form id="off"><label>Your offer (K)</label><input name="offer" type="number" required min="1" value="${Math.round(c.price*.95/1000)*1000}"><div class="row"><div><label>Name</label><input name="name" required></div><div><label>Phone</label><input name="phone" required inputmode="tel"></div></div><label class="chk"><input type="checkbox" name="trade"> I have a car to trade in</label><button class="btn gold block" style="margin-top:12px">Submit offer</button></form>`);
 $("#off").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));saveEnq({type:"Offer",carId:id,name:f.name,phone:f.phone,msg:`Offer ${K(+f.offer)}${f.trade?" + trade-in":""}`});closeModal();toast("Offer submitted (demo).")}};
DZ.buy=id=>{const c=car(id),dep=Math.max(5000,Math.round(c.price*.05/1000)*1000);modal(`<h2>Reserve this car</h2><p class="muted">${esc(`${c.year} ${c.make} ${c.model}`)} · ${K(c.price)}</p><p style="margin:12px 0">Hold this vehicle for 72 hours with a refundable reservation deposit of <b class="gold">${K(dep)}</b>.</p><div class="row"><div><label>Name</label><input id="bn"></div><div><label>Phone</label><input id="bp" inputmode="tel"></div></div><div class="err" id="berr"></div><button class="btn gold block" id="bgo" style="margin-top:12px">Continue to deposit</button>`);
 $("#bgo").onclick=()=>{const n=$("#bn").value.trim(),p=$("#bp").value.trim();if(!n||p.length<9){$("#berr").textContent="Enter name and phone.";return}pay(dep,`Reservation deposit · ${c.year} ${c.make} ${c.model}`,net=>saveEnq({type:"Reservation",carId:id,name:n,phone:p,msg:`Deposit ${K(dep)} via ${net} (TEST)`}),p)}};
// ---------- other pages ----------
function finance(q){const p=new URLSearchParams(q);app.innerHTML=`<div class="wrap"><div class="page-h"><div class="eyebrow">Plan your purchase</div><h1>Finance calculator</h1><p class="muted">Illustrative estimate only — not a credit offer.</p></div><section><div class="two"><div class="panel">
 <label>Vehicle price (K)</label><input id="fp" type="number" value="${+p.get("p")||650000}"><label>Deposit: <b id="fdl"></b></label><input id="fd" type="range" min="0" max="60" value="20" style="padding:0;accent-color:#d4af37">
 <label>Term</label><select id="ft">${[12,24,36,48,60,72].map(n=>`<option ${n===60?"selected":""} value="${n}">${n} months</option>`).join("")}</select><label>Interest rate (% p.a., illustrative)</label><input id="fr" type="number" step="0.5" value="28"></div>
 <div class="panel" style="display:flex;flex-direction:column;justify-content:center;text-align:center"><div class="muted">Estimated monthly repayment</div><div class="price" id="fout" style="font-size:44px;margin:8px 0"></div><div class="sum" id="fsum" style="text-align:left"></div><button class="btn gold" style="margin-top:14px" onclick="DZ.enquire('','Finance enquiry')">Request a finance quote</button></div></div></section></div>`;
 const calc=()=>{const P=+$("#fp").value||0,d=+$("#fd").value,n=+$("#ft").value,r=(+$("#fr").value||0)/100;const dep=P*d/100,L=P-dep,m=pmt(L,r,n);$("#fdl").textContent=`${d}% (${K(dep)})`;$("#fout").textContent=K(m);
  $("#fsum").innerHTML=`<div><span>Loan amount</span><span>${K(L)}</span></div><div><span>Total repayable</span><span>${K(m*n)}</span></div><div><span>Total interest</span><span>${K(m*n-L)}</span></div>`};["#fp","#fd","#ft","#fr"].forEach(i=>$(i).oninput=calc);calc()}
function compare(){const cs=cmp().map(car).filter(Boolean);if(!cs.length){app.innerHTML=`<div class="wrap"><div class="page-h"><h1>Compare cars</h1></div><div class="empty">Add up to 3 cars using the ⇄ button on any listing.<br><br><a class="btn gold" href="#/browse">Browse cars</a></div></div>`;return}
 const rows=[["Price",c=>c.price?K(c.price):"—"],["Daily rate",c=>c.rent?K(c.rent):"—"],["Year",c=>c.year],["Mileage",c=>km(c.mileage)],["Fuel",c=>c.fuel],["Gearbox",c=>c.gearbox],["Body",c=>c.body],["Engine",c=>c.engine],["Seats",c=>c.seats],["Colour",c=>c.color]];
 app.innerHTML=`<div class="wrap"><div class="page-h"><h1>Compare cars</h1><p class="muted">${cs.length}/3 selected</p></div><section><div class="tw cmp"><table><tr><th></th>${cs.map(c=>`<td><img src="${c.img}" alt=""><b style="display:block;margin-top:8px">${c.year} ${esc(c.make)} ${esc(c.model)}</b><a class="gold" href="#/car/${c.id}">View</a> · <a class="muted" href="javascript:" onclick="DZ.cmp('${c.id}')">Remove</a></td>`).join("")}</tr>${rows.map(([k,f])=>`<tr><th>${k}</th>${cs.map(c=>`<td>${esc(f(c))}</td>`).join("")}</tr>`).join("")}</table></div></section></div>`}
function favourites(){const cs=favs().map(car).filter(Boolean);app.innerHTML=`<div class="wrap"><div class="page-h"><h1>Your favourites</h1><p class="muted">Saved on this device.</p></div><section>${cs.length?`<div class="grid">${cs.map(cardHTML).join("")}</div>`:'<div class="empty">No favourites yet. Tap ♥ on any car to save it.<br><br><a class="btn gold" href="#/browse">Browse cars</a></div>'}</section></div>`}
function tradein(){app.innerHTML=`<div class="wrap"><div class="page-h"><div class="eyebrow">Upgrade made easy</div><h1>Trade-in your car</h1><p class="muted">Tell us about your current vehicle and we'll get back with a valuation (demo).</p></div><section><form class="panel" id="tif" style="max-width:720px">
 <div class="row"><div><label>Make</label><input name="make" required placeholder="e.g. Toyota"></div><div><label>Model</label><input name="model" required placeholder="e.g. Corolla"></div></div>
 <div class="row"><div><label>Year</label><input name="year" type="number" min="1980" max="2027" required></div><div><label>Mileage (km)</label><input name="mileage" type="number" required></div></div>
 <div class="row"><div><label>Condition</label><select name="cond"><option>Excellent</option><option>Good</option><option>Fair</option><option>Needs work</option></select></div><div><label>Interested in</label><select name="car"><option value="">Not sure yet</option>${cars().map(c=>`<option value="${c.id}">${c.year} ${esc(c.make)} ${esc(c.model)}</option>`).join("")}</select></div></div>
 <div class="row"><div><label>Your name</label><input name="name" required></div><div><label>Phone</label><input name="phone" required inputmode="tel"></div></div><label>Notes</label><textarea name="notes" rows="3"></textarea>
 <button class="btn gold" style="margin-top:14px">Request valuation</button></form></section></div>`;
 $("#tif").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));saveEnq({type:"Trade-in",carId:f.car,name:f.name,phone:f.phone,msg:`${f.year} ${f.make} ${f.model}, ${f.mileage} km, ${f.cond}. ${f.notes||""}`});e.target.reset();toast("Trade-in request sent (demo).")}}
function about(){app.innerHTML=`<div class="wrap"><div class="page-h"><div class="eyebrow">About & contact</div><h1>Visit DriveZed Motors</h1></div><section><div class="two"><div>
 <p>DriveZed Motors is a <b>fictional</b> dealership created to demonstrate what a modern car sales and rental website can do for dealers in Zambia: online stock, instant hire booking, mobile-money deposits, enquiries and a simple admin dashboard.</p>
 <div class="kv" style="margin-top:18px"><div><span>Location</span><b>Lusaka (map illustrative)</b></div><div><span>Hours</span><b>Mon–Sat 08:00–17:00 (sample)</b></div><div><span>Phone</span><b>${PHONE_TXT} (placeholder)</b></div><div><span>Email</span><b>hello@example.com</b></div></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn wa" target="_blank" rel="noopener" href="${waLink("Hi DriveZed, I'd like more information.")}">WhatsApp us</a><a class="btn" href="tel:${PHONE}">📞 Call</a><button class="btn ghost" onclick="DZ.enquire('','Contact form')">✉ Send a message</button></div></div>
 <iframe class="map" loading="lazy" title="Map of Lusaka" src="https://www.openstreetmap.org/export/embed.html?bbox=28.22%2C-15.47%2C28.38%2C-15.36&layer=mapnik&marker=-15.4167%2C28.2833"></iframe></div></section></div>`}
// ---------- admin ----------
function admin(){if(sessionStorage.getItem("dz_admin")!=="1"){app.innerHTML=`<div class="wrap"><section><form class="panel" id="lg" style="max-width:420px;margin:0 auto"><div class="testmode">DEMO ADMIN</div><h2>Dealer dashboard</h2><p class="muted">Demo password: <b class="gold">${ADMIN_PW}</b></p><label>Password</label><input type="password" id="pw" autocomplete="current-password"><div class="err" id="lerr"></div><button class="btn gold block" style="margin-top:12px">Log in</button></form></section></div>`;
  $("#lg").onsubmit=e=>{e.preventDefault();if($("#pw").value===ADMIN_PW){sessionStorage.setItem("dz_admin","1");admin()}else $("#lerr").textContent="Incorrect password."};return}
 const tab=sessionStorage.getItem("dz_tab")||"cars",cs=cars(),bk=LS.get("bookings",[]),eq=LS.get("enquiries",[]);
 const rev=bk.filter(b=>b.status!=="cancelled").reduce((a,b)=>a+(b.total||(car(b.carId)?.rent||0)*(Math.round((new Date(b.to)-new Date(b.from))/864e5)+1)),0);
 const stock=cs.filter(c=>c.price&&c.status!=="sold").reduce((a,c)=>a+c.price,0);
 const nm=id=>{const c=car(id);return c?`${c.year} ${esc(c.make)} ${esc(c.model)}`:"—"};
 let body="";
 if(tab==="cars")body=`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap"><h3 style="font-family:Inter">Inventory</h3><button class="btn gold sm" onclick="DZ.edit()">+ Add car</button></div><div class="tw"><table><tr><th>Car</th><th>Sale</th><th>Hire/day</th><th>Status</th><th>Actions</th></tr>${cs.map(c=>`<tr><td><div style="display:flex;gap:10px;align-items:center"><img src="${esc(c.img)}" style="width:64px;height:40px;object-fit:cover;border-radius:6px" alt=""><span>${nm(c.id)}</span></div></td><td>${c.price?K(c.price):"—"}</td><td>${c.rent?K(c.rent):"—"}</td><td><span class="badge ${c.status}">${c.status}</span></td><td style="white-space:nowrap"><button class="btn sm" onclick="DZ.edit('${c.id}')">Edit</button> <select onchange="DZ.st('${c.id}',this.value)" style="width:auto;padding:6px"><option ${c.status==="available"?"selected":""} value="available">Available</option><option ${c.status==="sold"?"selected":""} value="sold">Mark sold</option><option ${c.status==="rented"?"selected":""} value="rented">Mark rented</option></select> <button class="btn sm ghost" onclick="DZ.del('${c.id}')">🗑</button></td></tr>`).join("")}</table></div>`;
 if(tab==="bookings")body=`<h3 style="font-family:Inter;margin-bottom:10px">Rental bookings</h3><div class="tw"><table><tr><th>Ref</th><th>Car</th><th>Customer</th><th>Dates</th><th>Extras</th><th>Total</th><th>Deposit</th><th>Status</th></tr>${bk.slice().reverse().map(b=>`<tr><td>${esc(b.id.slice(-6).toUpperCase())}</td><td>${nm(b.carId)}</td><td>${esc(b.name)}<br><span class="muted">${esc(b.phone)}</span></td><td>${b.from} → ${b.to}</td><td>${(b.extras||[]).map(x=>EXTRAS[x]?.n.split(" ")[0]).join(", ")||"—"}</td><td>${b.total?K(b.total):"—"}</td><td>${esc(b.deposit||"—")}</td><td><select onchange="DZ.bst('${b.id}',this.value)" style="width:auto;padding:6px">${["pending","confirmed","completed","cancelled"].map(s=>`<option ${b.status===s?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("")||'<tr><td colspan="8" class="muted">No bookings yet</td></tr>'}</table></div>`;
 if(tab==="enquiries")body=`<h3 style="font-family:Inter;margin-bottom:10px">Enquiries, offers & trade-ins</h3><div class="tw"><table><tr><th>When</th><th>Type</th><th>Car</th><th>Customer</th><th>Details</th></tr>${eq.slice().reverse().map(e=>`<tr><td>${new Date(e.created).toLocaleDateString("en-GB")}</td><td><span class="badge rented">${esc(e.type)}</span></td><td>${e.carId?nm(e.carId):"—"}</td><td>${esc(e.name)}<br><span class="muted">${esc(e.phone)}</span></td><td>${esc(e.msg||"")}${e.date?`<br><span class="muted">Preferred: ${esc(e.date)}</span>`:""}</td></tr>`).join("")||'<tr><td colspan="5" class="muted">No enquiries yet</td></tr>'}</table></div>`;
 app.innerHTML=`<div class="wrap"><div class="page-h" style="display:flex;justify-content:space-between;align-items:end;gap:10px;flex-wrap:wrap"><div><div class="eyebrow">Demo admin</div><h1>Dealer dashboard</h1></div><div style="display:flex;gap:8px"><button class="btn sm ghost" onclick="DZ.reset()">Reset demo data</button><button class="btn sm" onclick="sessionStorage.removeItem('dz_admin');location.reload()">Log out</button></div></div>
 <section style="padding:18px 0"><div class="stats"><div class="stat"><b>${cs.filter(c=>c.status==="available").length}/${cs.length}</b><span class="muted">Cars available</span></div><div class="stat"><b>${cs.filter(c=>c.status==="sold").length}</b><span class="muted">Sold</span></div><div class="stat"><b>${bk.filter(b=>b.status!=="cancelled").length}</b><span class="muted">Active bookings · ${K(rev)}</span></div><div class="stat"><b>${eq.length}</b><span class="muted">Enquiries</span></div></div>
 <p class="muted" style="margin-top:10px;font-size:13px">Stock value (for sale): <b class="gold">${K(stock)}</b> · Data is stored in this browser only.</p>
 <div class="tabs">${[["cars","Inventory"],["bookings",`Bookings (${bk.length})`],["enquiries",`Enquiries (${eq.length})`]].map(([k,t])=>`<button class="${tab===k?"on":""}" onclick="sessionStorage.setItem('dz_tab','${k}');DZ.admin()">${t}</button>`).join("")}</div>${body}</section></div>`}
DZ.admin=admin;
DZ.st=(id,s)=>{setCars(cars().map(c=>c.id===id?{...c,status:s}:c));toast("Status updated");admin()};
DZ.bst=(id,s)=>{LS.set("bookings",LS.get("bookings",[]).map(b=>b.id===id?{...b,status:s}:b));toast("Booking updated");admin()};
DZ.del=id=>{if(confirm("Remove this car from the demo inventory?")){setCars(cars().filter(c=>c.id!==id));admin()}};
DZ.reset=()=>{if(confirm("Reset all demo data (cars, bookings, enquiries) on this device?")){["cars","bookings","enquiries","favs","cmp","v"].forEach(k=>localStorage.removeItem("dz_"+k));location.reload()}};
DZ.edit=id=>{const c=id?car(id):{make:"",model:"",year:2020,body:"Sedan",fuel:"Petrol",gearbox:"Automatic",mileage:0,seats:5,engine:"",color:"",price:"",rent:"",img:"img/c12.jpg",featured:false,status:"available",desc:""};
 const f=(n,l,t="text")=>`<div><label>${l}</label><input name="${n}" type="${t}" value="${esc(c[n]??"")}"></div>`,s=(n,l,o)=>`<div><label>${l}</label><select name="${n}">${o.map(x=>`<option ${c[n]===x?"selected":""}>${x}</option>`).join("")}</select></div>`;
 modal(`<h2>${id?"Edit car":"Add car"}</h2><form id="ef"><div class="row">${f("make","Make")}${f("model","Model")}</div><div class="row">${f("year","Year","number")}${f("mileage","Mileage (km)","number")}</div><div class="row">${s("body","Body",["Sedan","SUV","Hatchback","Pickup","Coupe","Van"])}${s("fuel","Fuel",["Petrol","Diesel","Hybrid","Electric"])}</div><div class="row">${s("gearbox","Gearbox",["Automatic","Manual"])}${f("seats","Seats","number")}</div><div class="row">${f("engine","Engine")}${f("color","Colour")}</div><div class="row">${f("price","Sale price K (blank = hire only)","number")}${f("rent","Daily rate K (blank = sale only)","number")}</div>${f("img","Image URL or path")}<label>Description</label><textarea name="desc" rows="3">${esc(c.desc)}</textarea><label class="chk"><input type="checkbox" name="featured" ${c.featured?"checked":""}> Featured on home page</label><div class="err" id="eerr"></div><button class="btn gold block" style="margin-top:12px">Save</button></form>`);
 $("#ef").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(!d.make||!d.model){$("#eerr").textContent="Make and model are required.";return}if(!d.price&&!d.rent){$("#eerr").textContent="Enter a sale price and/or a daily rate.";return}
  const o={...c,...d,year:+d.year,mileage:+d.mileage,seats:+d.seats,price:d.price?+d.price:null,rent:d.rent?+d.rent:null,featured:!!d.featured};let all=cars();if(id)all=all.map(x=>x.id===id?o:x);else{o.id=uid("dz");all.unshift(o)}setCars(all);closeModal();toast("Car saved");admin()}};
// ---------- router ----------
function route(){const h=location.hash.slice(2)||"",[path,q]=h.split("?"),[p,a]=path.split("/");closeModal();$("#menu").classList.remove("open");
 document.querySelectorAll("#menu a").forEach(x=>x.classList.toggle("on",x.getAttribute("href")==="#/"+h));
 ({"":home,browse:()=>browse(q),car:()=>detail(a),finance:()=>finance(q),compare,favourites,"trade-in":tradein,about,admin}[p]||home)();
 const c=p==="car"&&car(a);document.title=(c?`${c.year} ${c.make} ${c.model} · `:"")+"DriveZed Motors (Demo)";
 $("#waFloat").href=waLink(c?`Hi DriveZed, I'm interested in the ${c.year} ${c.make} ${c.model} (ref ${c.id}).`:"Hi DriveZed Motors, I'd like to enquire about a car.");window.scrollTo(0,0);counts()}
addEventListener("hashchange",route);route();
})();
