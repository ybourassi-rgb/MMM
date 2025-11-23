import { useEffect, useState } from "react";

function DealCard({ item }) {
  return (
    <div style={{
      height:"calc(100vh - 120px)",
      margin:"0 10px 12px",
      borderRadius:18,
      background:"#0f1422",
      border:"1px solid #1b2440",
      color:"#e9ecf5",
      display:"flex",
      flexDirection:"column",
      overflow:"hidden"
    }}>
      <div style={{
        flex:1, display:"grid", placeItems:"center",
        background:"linear-gradient(180deg,#0b1020,#0a0f1d)",
        color:"#95a0b8", fontWeight:700
      }}>
        {item.mediaLabel || "MEDIA"}
      </div>
      <div style={{padding:12}}>
        <div style={{fontSize:18,fontWeight:800}}>{item.title}</div>
        <div style={{fontSize:13,color:"#8b93a7"}}>{item.subtitle}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [items,setItems]=useState([]);

  useEffect(()=>{
    fetch("/api/feed").then(r=>r.json()).then(d=>setItems(d.items||[]));
  },[]);

  return (
    <div style={{height:"100vh",background:"#07090f"}}>
      <div style={{
        position:"sticky",top:0,padding:"12px 14px",
        background:"#07090f",color:"#fff",fontWeight:800
      }}>
        Money Motor Y
      </div>

      <div style={{
        height:"calc(100vh - 60px)",
        overflowY:"auto",
        scrollSnapType:"y mandatory"
      }}>
        {items.map((it)=>(
          <div key={it.id} style={{scrollSnapAlign:"start"}}>
            <DealCard item={it}/>
          </div>
        ))}
      </div>
    </div>
  );
}
