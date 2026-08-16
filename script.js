const events=[
 {title:"Ganesh Sthapana",date:"Day 1",time:"Morning",desc:"Welcome and Ganesh Sthapana ceremony."},
 {title:"Cultural Program",date:"Festival Day",time:"7:00 PM",desc:"Music, dance and community performances."},
 {title:"Mahaprasad",date:"Festival Day",time:"After Aarti",desc:"Community prasad for devotees."}
];
const notices=[
 "Welcome to Shree Siddhivinayak Ganesh Mitra Mandal!",
 "Program timings will be updated here by the mandal committee.",
 "For donation details, contact the mandal committee."
];
document.getElementById("eventCards").innerHTML=events.map(e=>`<div class="card"><h3>${e.title}</h3><p>${e.date} • ${e.time}</p><span>${e.desc}</span></div>`).join("");
document.getElementById("noticeList").innerHTML=notices.map(n=>`<li>${n}</li>`).join("");
function copyUPI(){navigator.clipboard?.writeText(document.getElementById("upiId").textContent);document.getElementById("copyMsg").textContent=" Copied!";}
function login(){
 const name=document.getElementById("memberName").value.trim();
 const msg=document.getElementById("loginMsg");
 if(!name){msg.textContent="Please enter your name.";return;}
 msg.textContent=`Welcome, ${name}! Demo login successful.`;
}
function toggleMenu(){
 const n=document.getElementById("navlinks");
 n.style.display=n.style.display==="flex"?"none":"flex";
 n.style.flexDirection="column";
 n.style.gap="12px";
}