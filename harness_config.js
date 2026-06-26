/* ============================================================
   harness_config.js — shared schema, defaults, storage, helpers
   Loaded by both "Harness Diagram.html" and "Harness Builder.html".
   The whole bench setup is described by ONE JSON object (see DEFAULT
   below) so it is fully reusable for another engine controller,
   different harnesses and different sensors — just Export/Import JSON.
   ============================================================ */
const HC_KEY = "harnessConfig.v3";

/* Wire-size cross reference (AWG  <->  metric mm²), common automotive sizes */
const AWG2MM = {"22":"0.35","20":"0.5","18":"0.8","16":"1.0","14":"2.0","12":"3.0","10":"5.0","8":"8.0","6":"13.0"};
const MM2AWG = {"0.35":"22","0.5":"20","0.75":"18","0.8":"18","1.0":"16","1.5":"16","2.0":"14","2.5":"14","3.0":"12","4.0":"12","5.0":"10","6.0":"10","8.0":"8","13.0":"6"};

const BUSNAME = {j:"J1939", v:"V-CAN", a:"A-CAN"};
const BUSCOL  = {j:"#3fb950", v:"#4aa3ff", a:"#ffb454"};
const WIRECOL = {WHT:"#e9e9e9",YEL:"#f4d03f",BLU:"#3d7fff",BLK:"#333",GRA:"#9aa7b4",GRN:"#3fb950",ORN:"#e8862e",RED:"#e5484d",BRN:"#8a5a3b",PNK:"#ff8fbf",PUR:"#a26bd6",TAN:"#cdb48f"};

function hcNewId(p){return (p||"id")+"_"+Math.random().toString(36).slice(2,8);}
function hcWireColor(code){const m=String(code||"").match(/^([A-Za-z]{3})/);return m?(WIRECOL[m[1].toUpperCase()]||"#888"):"#888";}

/* ---- the default / example configuration ---- */
function HC_DEFAULT(){return {
 meta:{name:"PACCAR + Cummins bench (example)", note:"Edit in the Builder; this is just a starting point.", version:3},
 harnesses:[
  {id:"cumminsECU",name:"Cummins ECM",drawing:"CM2350 (verify)",kind:"ecu",buses:["j"],box:{x:40,y:470,w:210,h:96},connectors:[
    {id:hcNewId("c"),ref:"Engine Interface",family:"P",partNumber:"",type:"engine ECM connector",mate:"engine/1",image:"",device:null,circuits:[
      {color:"YEL",circuit:"0500-1",awg:"18",mm2:"0.8",signal:"J1939 (+)",pin:"1",desc:"CAN-H"},
      {color:"GRN",circuit:"0500-1",awg:"18",mm2:"0.8",signal:"J1939 (-)",pin:"2",desc:"CAN-L"},
      {color:"RED",circuit:"0100-1",awg:"12",mm2:"3.0",signal:"BATT +",pin:"3",desc:""},
      {color:"BLK",circuit:"0100-2",awg:"12",mm2:"3.0",signal:"GND",pin:"4",desc:""}]},
  ]},
  {id:"engine",name:"Engine Harness — Cummins",drawing:"P5336409",kind:"harness",buses:["j"],box:{x:40,y:300,w:210,h:120},connectors:[
    {id:hcNewId("c"),ref:"OEM Connector",family:"P",partNumber:"",type:"Cummins OEM connector",mate:"chassis/3",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"Engine Connector",family:"P",partNumber:"",type:"Cummins engine connector",mate:"cumminsECU/0",image:"",device:null,circuits:[
      {color:"YEL",circuit:"0500-1",awg:"18",mm2:"0.8",signal:"J1939 (+)",pin:"A",desc:"CAN-H"},
      {color:"GRN",circuit:"0500-1",awg:"18",mm2:"0.8",signal:"J1939 (-)",pin:"B",desc:"CAN-L"},
      {color:"RED",circuit:"0100-1",awg:"12",mm2:"3.0",signal:"BATT +",pin:"C",desc:""},
      {color:"BLK",circuit:"0100-2",awg:"12",mm2:"3.0",signal:"GND",pin:"D",desc:""}]},
    {id:hcNewId("c"),ref:"Aftertreatment",family:"P",partNumber:"",type:"inline to SCR",mate:"aftertreatment/0",image:"",device:null,circuits:[]},
  ]},
  {id:"aftertreatment",name:"MX Aftertreatment Harness",drawing:"M96-1036 (M92-1048)",kind:"harness",buses:["a","j"],box:{x:360,y:80,w:220,h:130},connectors:[
    {id:hcNewId("c"),ref:"P417",family:"P",partNumber:"P20-1390",type:"29-way HDP20 recept",mate:"engine/2",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"P133",family:"P",partNumber:"P20-6377-2921",type:"2-way DT plug",mate:"chassis/1",image:"",device:null,circuits:[
      {color:"YEL",circuit:"0500-2",awg:"18",mm2:"0.8",signal:"J1939 (+)",pin:"26",desc:"CAN-H"},
      {color:"GRN",circuit:"0500-2",awg:"18",mm2:"0.8",signal:"J1939 (-)",pin:"25",desc:"CAN-L"}]},
    {id:hcNewId("c"),ref:"P456",family:"P",partNumber:"P20-6137",type:"16-way AMP/MCP",mate:"chassis/2",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"P450A",family:"P",partNumber:"P20-1258-2116-99314",type:"60-way ACM connector",mate:"acm",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"J454",family:"P",partNumber:"P20-1193-12029",type:"12-way interface",mate:"deftank/0",image:"",device:null,circuits:[
      {color:"WHT",circuit:"3263-4",awg:"16",mm2:"1.0",signal:"DEF QUALITY SENSOR GND",pin:"1",desc:""},
      {color:"YEL",circuit:"3263-4",awg:"16",mm2:"1.0",signal:"DEF QUALITY SENSOR PWR",pin:"2",desc:""},
      {color:"YEL",circuit:"0818-4",awg:"18",mm2:"0.8",signal:"A-CAN (+)",pin:"3",desc:""},
      {color:"GRN",circuit:"0818-4",awg:"18",mm2:"0.8",signal:"A-CAN (-)",pin:"4",desc:""}]},
  ]},
  {id:"deftank",name:"DEF Tank Harness",drawing:"M96-1027 (M92-1037)",kind:"harness",buses:["a"],box:{x:660,y:80,w:220,h:130},connectors:[
    {id:hcNewId("c"),ref:"J454",family:"P",partNumber:"(mates aftertmt J454)",type:"12-way interface",mate:"aftertreatment/4",image:"",device:null,circuits:[
      {color:"WHT",circuit:"3263-4",awg:"16",mm2:"1.0",signal:"DEF QUALITY SENSOR GND",pin:"1",desc:""},
      {color:"YEL",circuit:"3263-4",awg:"16",mm2:"1.0",signal:"DEF QUALITY SENSOR PWR",pin:"2",desc:""},
      {color:"YEL",circuit:"0818-4",awg:"18",mm2:"0.8",signal:"A-CAN (+)",pin:"3",desc:"CAN-H"},
      {color:"GRN",circuit:"0818-4",awg:"18",mm2:"0.8",signal:"A-CAN (-)",pin:"4",desc:"CAN-L"},
    ]},
    {id:hcNewId("c"),ref:"R114 / P114",family:"P",partNumber:"A-CAN 120Ω terminator",type:"CAN terminator",mate:"",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"J936",family:"J",partNumber:"(see BOM)",type:"4-way",mate:"",image:"",
      device:{kind:"sensor",name:"Urea / DEF Quality Sensor",partNumber:"",description:"Reports DEF concentration, temperature and level over the A-CAN bus.",image:""},
      circuits:[
        {color:"WHT",circuit:"3263-4",awg:"16",mm2:"1.0",signal:"GND",pin:"4",desc:""},
        {color:"YEL",circuit:"3263-4",awg:"16",mm2:"1.0",signal:"PWR",pin:"1",desc:""},
        {color:"YEL",circuit:"0818-5",awg:"18",mm2:"0.8",signal:"A-CAN (+)",pin:"3",desc:""},
        {color:"GRN",circuit:"0818-5",awg:"18",mm2:"0.8",signal:"A-CAN (-)",pin:"2",desc:""}]},
    {id:hcNewId("c"),ref:"J970",family:"J",partNumber:"(see BOM)",type:"4-way",mate:"",image:"",
      device:{kind:"actuator",name:"DEF Pump",partNumber:"",description:"Electric dosing pump; PWM controlled with speed feedback.",image:""},
      circuits:[
        {color:"YEL",circuit:"3228-2",awg:"16",mm2:"1.0",signal:"PUMP SUPPLY",pin:"2",desc:""},
        {color:"BLK",circuit:"3228-2",awg:"16",mm2:"1.0",signal:"PUMP GND",pin:"4",desc:""},
        {color:"BLU",circuit:"3228-2",awg:"20",mm2:"0.5",signal:"SPEED SIG",pin:"1",desc:""},
        {color:"GRA",circuit:"3228-2",awg:"20",mm2:"0.5",signal:"PWM CTRL",pin:"3",desc:""}]},
    {id:hcNewId("c"),ref:"J972",family:"J",partNumber:"(see BOM)",type:"2-way",mate:"",image:"",
      device:{kind:"actuator",name:"DEF Tank Heating Coolant Valve",partNumber:"",description:"Routes engine coolant through the DEF tank to thaw frozen DEF.",image:""},
      circuits:[
        {color:"GRA",circuit:"3239-2",awg:"18",mm2:"0.8",signal:"VLV CTRL",pin:"1",desc:""},
        {color:"BLK",circuit:"3239-2",awg:"18",mm2:"0.8",signal:"VLV GND",pin:"4",desc:""}]},
    {id:hcNewId("c"),ref:"J953",family:"J",partNumber:"(see BOM)",type:"2-way",mate:"",image:"",
      device:{kind:"actuator",name:"DEF Line Heater 3 (suction)",partNumber:"",description:"Resistive heater preventing the DEF suction line from freezing.",image:""},
      circuits:[
        {color:"WHT",circuit:"3237-6",awg:"20",mm2:"0.5",signal:"HTR GND",pin:"2",desc:""},
        {color:"YEL",circuit:"3237-6",awg:"20",mm2:"0.5",signal:"HTR PWR",pin:"1",desc:""}]},
  ]},
  {id:"acm",name:"ACM — Aftertreatment Ctrl Module",drawing:"device",kind:"module",buses:["a","j"],box:{x:940,y:90,w:160,h:80},connectors:[]},
  {id:"chassis",name:"Chassis Harness",drawing:"P96-1080",kind:"harness",buses:["v","j"],box:{x:360,y:300,w:220,h:130},connectors:[
    {id:hcNewId("c"),ref:"Cab bulkhead",family:"P",partNumber:"",type:"firewall pass-through",mate:"cecu3/2",image:"",device:null,circuits:[
      {color:"YEL",circuit:"0900-1",awg:"18",mm2:"0.8",signal:"V-CAN (+)",pin:"1",desc:"CAN-H"},
      {color:"GRN",circuit:"0900-1",awg:"18",mm2:"0.8",signal:"V-CAN (-)",pin:"2",desc:"CAN-L"}]},
    {id:hcNewId("c"),ref:"Aftertmt-A",family:"P",partNumber:"",type:"inline",mate:"aftertreatment/1",image:"",device:null,circuits:[
      {color:"YEL",circuit:"0500-2",awg:"18",mm2:"0.8",signal:"J1939 (+)",pin:"5",desc:"CAN-H"},
      {color:"GRN",circuit:"0500-2",awg:"18",mm2:"0.8",signal:"J1939 (-)",pin:"6",desc:"CAN-L"}]},
    {id:hcNewId("c"),ref:"Aftertmt-B",family:"P",partNumber:"",type:"inline",mate:"aftertreatment/2",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"Engine OEM",family:"P",partNumber:"",type:"bulkhead",mate:"engine/0",image:"",device:null,circuits:[]},
  ]},
  {id:"cecu3",name:"CECU3 — Cab ECU",drawing:"G01-1076-0-000",kind:"harness",buses:["v"],box:{x:660,y:300,w:210,h:130},connectors:[
    {id:hcNewId("c"),ref:"Conn A",family:"P",partNumber:"P20-1183-1209",type:"9-way JPT (mates)",mate:"",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"Conn B",family:"P",partNumber:"P20-1172-1224",type:"24-way MQS (mates)",mate:"",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"Conn C",family:"P",partNumber:"P20-1172-1252",type:"52-way MQS (mates)",mate:"chassis/0",image:"",device:null,circuits:[
      {color:"YEL",circuit:"0900-1",awg:"18",mm2:"0.8",signal:"V-CAN (+)",pin:"C1",desc:"CAN-H"},
      {color:"GRN",circuit:"0900-1",awg:"18",mm2:"0.8",signal:"V-CAN (-)",pin:"C2",desc:"CAN-L"}]},
    {id:hcNewId("c"),ref:"Conn D",family:"P",partNumber:"P20-1172-1240",type:"40-way MQS (mates)",mate:"",image:"",device:null,circuits:[]},
    {id:hcNewId("c"),ref:"Conn E",family:"P",partNumber:"P20-1183-2209",type:"9-way JPT (mates)",mate:"",image:"",device:null,circuits:[]},
  ]},
  {id:"ip",name:"Instrument Panel Harness",drawing:"P96-1090",kind:"harness",buses:["v"],box:{x:940,y:300,w:160,h:130},connectors:[
    {id:hcNewId("c"),ref:"IP-to-cab",family:"P",partNumber:"(BOM sh.43-44)",type:"inline",mate:"cecu3",image:"",device:null,circuits:[]},
  ]},
 ],
 connectorDocs:[
  {id:hcNewId("doc"),partNumber:"P20-6377-2921",name:"Deutsch DT 2-way plug",family:"P",image:"",videoUrl:"",
   notes:"Strip ~6 mm; crimp socket terminal; insert until it clicks; fit the orange wedge-lock.",
   tools:[{name:"Deutsch hand crimp tool",partNumber:"HDT-48-00 (verify)",image:"",link:""},
          {name:"Terminal removal tool",partNumber:"0411-310-1605 (verify)",image:"",link:""}],
   terminals:[{role:"socket",terminalPN:"0462-201-16141 (verify)",wire:"16–18 AWG / 1.0–0.8 mm²",sealPN:"",notes:"green band"}]},
  {id:hcNewId("doc"),partNumber:"P20-1390",name:"HDP20 29-way receptacle",family:"P",image:"",videoUrl:"",
   notes:"Crimp pins; insert to lock tab; install rear retainer.",
   tools:[{name:"HDP20 crimp tool",partNumber:"HDT-48-00 (verify)",image:"",link:""}],
   terminals:[{role:"pin",terminalPN:"(verify)",wire:"per circuit",sealPN:"",notes:""}]},
 ]
};
}

/* ---- storage (shared between the two pages via localStorage) ---- */
function hcLoad(){try{const s=localStorage.getItem(HC_KEY);return s?JSON.parse(s):HC_DEFAULT();}catch(e){return HC_DEFAULT();}}
function hcSave(model){try{localStorage.setItem(HC_KEY,JSON.stringify(model));return true;}catch(e){return false;}}
/* downscale+recompress an image data-URL so photos fit in storage (keeps the JSON small) */
function hcCompressImage(dataURL,maxDim,quality,cb){try{const img=new Image();img.onload=function(){let w=img.width,h=img.height;const s=Math.min(1,(maxDim||640)/Math.max(w,h));w=Math.max(1,Math.round(w*s));h=Math.max(1,Math.round(h*s));const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);try{cb(cv.toDataURL("image/jpeg",quality||0.72));}catch(e){cb(dataURL);}};img.onerror=function(){cb(dataURL);};img.src=dataURL;}catch(e){cb(dataURL);}}

/* migrate / normalize: ensure fields, stable ids, node-level device fields,
   convert authoring index mates ("hid/3") -> id mates, and migrate any old
   per-connector device into a standalone sensor/actuator NODE (J side). */
function hcNormalize(m){
  if(!m||!m.harnesses)return hcNormalize(HC_DEFAULT());
  m.harnesses.forEach(h=>{h.connectors=h.connectors||[];h.buses=h.buses||[];h.box=h.box||{x:40,y:40,w:200,h:120};h.kind=h.kind||"harness";
    h.description=h.description||"";h.image=h.image||"";
    h.connectors.forEach(c=>{c.id=c.id||hcNewId("c");c.family=c.family||(/^J/i.test(c.ref)?"J":"P");
      c.circuits=c.circuits||[];c.image=c.image||"";c.mate=c.mate||"";
      (c.circuits||[]).forEach(z=>{z.color=z.color||"";z.circuit=z.circuit||"";z.awg=z.awg||"";z.mm2=z.mm2||"";z.signal=z.signal||"";z.pin=z.pin||"";z.desc=z.desc||"";});});});
  // --- migrate legacy per-connector device -> standalone node ---
  let baseX=Math.max(0,...m.harnesses.map(h=>h.box.x+h.box.w))+60, stackY=60; const added=[];
  m.harnesses.forEach(h=>h.connectors.forEach(c=>{
    if(c.device){const d=c.device;const nodeId=hcNewId(d.kind==="actuator"?"act":"sen");const jc=hcNewId("c");
      added.push({id:nodeId,name:d.name||"Device",drawing:d.partNumber||"",kind:(d.kind==="actuator"?"actuator":"sensor"),
        description:d.description||"",image:d.image||"",buses:[],box:{x:baseX,y:stackY,w:190,h:90},
        connectors:[{id:jc,ref:(/^J/i.test(c.ref)?c.ref:("J"+String(c.ref).replace(/^[PJ]/i,""))),family:"J",partNumber:"",type:"",
          mate:h.id+"/"+c.id,image:"",circuits:JSON.parse(JSON.stringify(c.circuits||[]))}]});
      stackY+=120;
      c.family="P"; if(/^J/i.test(c.ref))c.ref="P"+String(c.ref).replace(/^[PJ]/i,""); c.mate=nodeId+"/"+jc; c.device=null;
    } else if(c.device!==undefined){c.device=null;}
  }));
  if(added.length)m.harnesses.push(...added);
  // resolve index mates -> id mates
  m.harnesses.forEach(h=>h.connectors.forEach(c=>{
    if(c.mate&&c.mate.includes("/")){const[hid,ref]=c.mate.split("/");
      if(/^\d+$/.test(ref)){const th=m.harnesses.find(x=>x.id===hid);if(th&&th.connectors[+ref])c.mate=hid+"/"+th.connectors[+ref].id;}}
  }));
  // connector documentation library
  m.connectorDocs=m.connectorDocs||[];
  m.connectorDocs.forEach(d=>{d.id=d.id||hcNewId("doc");d.partNumber=d.partNumber||"";d.name=d.name||"";d.family=d.family||"";d.image=d.image||"";d.videoUrl=d.videoUrl||"";d.notes=d.notes||"";
    d.tools=d.tools||[];d.tools.forEach(t=>{t.name=t.name||"";t.partNumber=t.partNumber||"";t.image=t.image||"";t.link=t.link||"";});
    d.terminals=d.terminals||[];d.terminals.forEach(t=>{t.role=t.role||"";t.terminalPN=t.terminalPN||"";t.wire=t.wire||"";t.sealPN=t.sealPN||"";t.notes=t.notes||"";});});
  m.harnesses.forEach(h=>h.connectors.forEach(c=>{if(c.docId===undefined)c.docId="";}));
  // manual link overrides (saved in the same JSON)
  m.links=Array.isArray(m.links)?m.links:[];
  m.links.forEach(l=>{l.id=l.id||hcNewId("lnk");l.a=l.a||{};l.b=l.b||{};l.a.connId=l.a.connId||"";l.a.pin=l.a.pin==null?"":String(l.a.pin);l.b.connId=l.b.connId||"";l.b.pin=l.b.pin==null?"":String(l.b.pin);l.wireId=l.wireId||"";l.note=l.note||"";});
  m.linksDisabled=Array.isArray(m.linksDisabled)?m.linksDisabled:[];
  return m;
}
/* ---- net engine: the wire ID (colour+circuit) is the join key ----
   hcWireId({color,circuit}) -> normalized full wire ID e.g. "YEL3228-2"
   hcNets(M) -> { wireId: [ {nodeId,node,kind,connId,ref,pin,signal,color,circuit} ... ] }
   This is how pins on different connectors are matched into one circuit. */
function hcWireId(z){return String((z&&z.color||"")+(z&&z.circuit||"")).replace(/\s+/g,"").toUpperCase();}
function hcNets(M){const nets={};(M.harnesses||[]).forEach(h=>(h.connectors||[]).forEach(c=>(c.circuits||[]).forEach(z=>{
  const id=hcWireId(z);if(!id)return;(nets[id]=nets[id]||[]).push({nodeId:h.id,node:h.name,kind:h.kind,connId:c.id,ref:c.ref,pin:z.pin,signal:z.signal,color:z.color,circuit:z.circuit});})));return nets;}
/* lookup: connId -> {nodeId,node,kind,ref,family,conn} */
function hcConnIndex(M){const idx={};(M.harnesses||[]).forEach(h=>(h.connectors||[]).forEach(c=>{idx[c.id]={nodeId:h.id,node:h.name,kind:h.kind,ref:c.ref,family:c.family,conn:c};}));return idx;}
/* AUTO links: pin-to-pin edges from shared wire IDs.
   - WITHIN a harness (same node): always linked (same wire ID = same net).
   - ACROSS harnesses: only when the two connectors are explicitly mated via the
     connector's "Connects to (other side)" (mate). No mate => no external line. */
function hcAutoLinks(M){const nets=hcNets(M);const idx=hcConnIndex(M);const out=[];
  function mated(ca,cb){const A=idx[ca],B=idx[cb];if(!A||!B)return false;const aM=(A.conn&&A.conn.mate)||"",bM=(B.conn&&B.conn.mate)||"";
    if(aM===B.nodeId+"/"+cb||aM===B.nodeId)return true;
    if(bM===A.nodeId+"/"+ca||bM===A.nodeId)return true;return false;}
  Object.keys(nets).forEach(id=>{const eps=nets[id];for(let i=0;i<eps.length;i++)for(let j=i+1;j<eps.length;j++){
    const a=eps[i],b=eps[j],A=idx[a.connId],B=idx[b.connId];if(!A||!B)continue;
    if(A.nodeId===B.nodeId || mated(a.connId,b.connId)){
      out.push({a:{connId:a.connId,pin:String(a.pin)},b:{connId:b.connId,pin:String(b.pin)},wireId:id,signal:a.signal||b.signal||"",auto:true});}}});
  return out;}
function hcLinkKey(l){const A=l.a.connId+"#"+l.a.pin,B=l.b.connId+"#"+l.b.pin;return [A,B].sort().join("||");}
/* EFFECTIVE links = auto (minus user-disabled) + user manual links. Manual overrides auto with same endpoints.
   M.links = manual links, M.linksDisabled = array of auto link keys the user removed. Both saved in the JSON. */
function hcEffectiveLinks(M){const disabled=new Set(M.linksDisabled||[]);
  const auto=hcAutoLinks(M).filter(l=>!disabled.has(hcLinkKey(l)));
  const manual=(M.links||[]).filter(l=>l&&l.a&&l.b&&l.a.connId&&l.b.connId).map(l=>({a:{connId:l.a.connId,pin:String(l.a.pin)},b:{connId:l.b.connId,pin:String(l.b.pin)},wireId:l.wireId||"",signal:l.signal||"",note:l.note||"",auto:false,id:l.id}));
  const mkeys=new Set(manual.map(hcLinkKey));
  return auto.filter(l=>!mkeys.has(hcLinkKey(l))).concat(manual);}
/* connectors connected to a connector in a DIFFERENT node (via effective links) = inter-harness connectors */
function hcInterConnectors(M){const idx=hcConnIndex(M);const s=new Set();
  hcEffectiveLinks(M).forEach(l=>{const a=idx[l.a.connId],b=idx[l.b.connId];if(a&&b&&a.nodeId!==b.nodeId){s.add(l.a.connId);s.add(l.b.connId);}});return s;}
/* effective links touching a connector, shaped for the popup */
function hcConnLinks(M,connId){const idx=hcConnIndex(M);const self=idx[connId];const out=[];
  hcEffectiveLinks(M).forEach(l=>{let mine,other;if(l.a.connId===connId){mine=l.a;other=l.b;}else if(l.b.connId===connId){mine=l.b;other=l.a;}else return;
    const oi=idx[other.connId];if(!oi)return;
    out.push({id:l.wireId||"",fromPin:mine.pin,to:{ref:oi.ref,pin:other.pin,node:oi.node},sameNode:!!(self&&oi&&self.nodeId===oi.nodeId),auto:l.auto});});
  return out;}

/* resolve the documentation entry attached to a connector (explicit docId, else by matching part number) */
function hcDocFor(m,c){if(!m.connectorDocs)return null;
  if(c.docId){const d=m.connectorDocs.find(x=>x.id===c.docId);if(d)return d;}
  if(c.partNumber){const d=m.connectorDocs.find(x=>x.partNumber&&x.partNumber.toLowerCase()===String(c.partNumber).toLowerCase());if(d)return d;}
  return null;}
/* =========================================================================
   SERVER PERSISTENCE ADAPTER (optional, auto-detected)
   - served over http(s)  -> persist to FastAPI backend at /api (no storage limit)
   - opened as a local file -> fall back to localStorage (offline mode)
   Pages should call hcLoadAsync() at startup and route writes through hcSaveAsync().
   ========================================================================= */
const HC_API = (typeof location!=="undefined" && /^https?:$/.test(location.protocol)) ? (location.origin + "/api") : null;
const HC_CONFIG_NAME = (typeof location!=="undefined" && new URLSearchParams(location.search).get("config")) || "default";
let HC_REV = null;
function HC_isServer(){ return !!HC_API; }
function hcAuthHeaders(){ /* later: return {Authorization:"Bearer "+token}; */ return {}; }
function hcStatus(s){ try{ if(typeof window!=="undefined" && window.__hcStatus) window.__hcStatus(s); }catch(e){} }

async function hcLoadAsync(){
  if(!HC_API){ return hcNormalize(hcLoad()); }
  try{
    const res = await fetch(HC_API+"/configs/"+encodeURIComponent(HC_CONFIG_NAME), {headers: hcAuthHeaders()});
    if(res.status===200){ const data=await res.json(); HC_REV=(data&&data.rev)||res.headers.get("ETag")||null; hcStatus("saved"); return hcNormalize(data.config||data); }
    if(res.status===404){ const seed=hcNormalize(hcLoad()); try{ await hcPut(seed); hcStatus("saved"); }catch(e){ hcStatus("error"); } return seed; }
    if(res.status===401||res.status===403){ hcStatus("error"); }
  }catch(e){ hcStatus("offline"); }
  return hcNormalize(hcLoad());
}

let _hcTimer=null, _hcPending=null, _hcInFlight=false;
function hcSaveAsync(model){
  if(!HC_API){ hcSave(model); return; }
  _hcPending=model; hcStatus("dirty");
  if(_hcTimer) clearTimeout(_hcTimer);
  _hcTimer=setTimeout(hcFlush, 700);
}
async function hcFlush(){
  if(_hcInFlight || !_hcPending) return;
  const m=_hcPending; _hcPending=null; _hcInFlight=true; hcStatus("saving");
  try{ await hcPut(m); hcStatus("saved"); }
  catch(e){ if(e&&e.conflict){ hcStatus("conflict"); } else { hcStatus("error"); _hcPending=_hcPending||m; } }
  finally{ _hcInFlight=false; if(_hcPending) setTimeout(hcFlush,300); }
}
async function hcPut(model){
  const res=await fetch(HC_API+"/configs/"+encodeURIComponent(HC_CONFIG_NAME), {
    method:"PUT",
    headers: Object.assign({"Content-Type":"application/json"}, hcAuthHeaders(), HC_REV?{"If-Match":HC_REV}:{}),
    body: JSON.stringify({config:model, rev:HC_REV})
  });
  if(res.status===409){ const err=new Error("conflict"); err.conflict=true; throw err; }
  if(!res.ok){ throw new Error("save failed "+res.status); }
  const data=await res.json(); HC_REV=(data&&data.rev)||res.headers.get("ETag")||HC_REV; return HC_REV;
}
if(typeof window!=="undefined"){ window.addEventListener("beforeunload", function(){ if(HC_API && _hcPending){ try{ fetch(HC_API+"/configs/"+encodeURIComponent(HC_CONFIG_NAME), {method:"PUT", headers:Object.assign({"Content-Type":"application/json"},hcAuthHeaders(),HC_REV?{"If-Match":HC_REV}:{}), body:JSON.stringify({config:_hcPending, rev:HC_REV}), keepalive:true}); }catch(e){} } }); }

if(typeof module!=="undefined"){module.exports={HC_DEFAULT,hcLoad,hcSave,hcNormalize,hcDocFor,hcWireId,hcNets,hcConnIndex,hcAutoLinks,hcLinkKey,hcEffectiveLinks,hcInterConnectors,hcConnLinks,AWG2MM,MM2AWG,BUSNAME,BUSCOL,hcWireColor,hcNewId,HC_isServer};}
