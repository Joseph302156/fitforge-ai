"use client";
import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { UserProfile, saveUserProfile } from "@/lib/supabase";

const GENDERS   = ["Male", "Female", "Other"];
const BUILDS    = ["Slim / Lean", "Average", "Athletic", "Heavy / Stocky"];
const GOALS     = ["Lose fat and get lean","Build muscle and get bigger","Athletic performance","Stay healthy and active"];
const PHYSIQUES = ["Lean and toned","Muscular and strong","Athletic and functional","Healthy and balanced"];

export default function ProfileTab({ profile, onUpdate, isDesktop }: {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  isDesktop?: boolean;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email || "";

  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState<UserProfile>(profile);
  const [saving,  setSaving]    = useState(false);
  const [toastOk, setToastOk]   = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveUserProfile(userId, draft);
    onUpdate(draft);
    setSaving(false);
    setEditing(false);
    setToastOk(true);
    setTimeout(() => setToastOk(false), 2500);
  }

  const user     = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  /* ── read-only tiles ──────────────────────────────────────────── */
  const Tile = ({ label, value }: { label: string; value: string }) => (
    <div style={{flex:1,background:"#f9fafb",borderRadius:"10px",padding:"10px 12px",textAlign:"center",minWidth:0}}>
      <div style={{fontSize:"14px",fontWeight:500,color:"#1f2937",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
      <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>{label}</div>
    </div>
  );

  /* ── section card ─────────────────────────────────────────────── */
  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{background:"white",borderRadius:"16px",border:"1px solid #f3f4f6",padding:"16px 20px",marginBottom:"12px"}}>
      <p style={{fontSize:"11px",fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 12px"}}>{title}</p>
      {children}
    </div>
  );

  /* ── field label ──────────────────────────────────────────────── */
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 6px"}}>{children}</p>
  );

  /* ── pill selector ────────────────────────────────────────────── */
  const PillRow = ({ options, value, onChange }: { options:string[]; value:string; onChange:(v:string)=>void }) => (
    <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)}
          style={{padding:"7px 12px",borderRadius:"8px",border:`1.5px solid ${value===o?"#4f46e5":"#e5e7eb"}`,background:value===o?"#eef2ff":"#f9fafb",color:value===o?"#4338ca":"#6b7280",fontSize:"12px",fontWeight:value===o?500:400,cursor:"pointer",transition:"all 0.15s"}}>
          {o}
        </button>
      ))}
    </div>
  );

  /* ── VIEW MODE ────────────────────────────────────────────────── */
  const viewContent = (
    <>
      {/* Account card */}
      <div style={{background:"white",borderRadius:"16px",border:"1px solid #f3f4f6",padding:"20px",marginBottom:"12px",display:"flex",alignItems:"center",gap:"16px"}}>
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" style={{width:"58px",height:"58px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
        ) : (
          <div style={{width:"58px",height:"58px",borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"20px",fontWeight:700,color:"#4f46e5"}}>{initials}</div>
        )}
        <div style={{minWidth:0,flex:1}}>
          <p style={{fontSize:"16px",fontWeight:600,color:"#1f2937",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</p>
          <p style={{fontSize:"12px",color:"#9ca3af",margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</p>
          <div style={{display:"inline-flex",alignItems:"center",gap:"5px",background:"#f3f4f6",borderRadius:"6px",padding:"3px 8px"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-4.warned 1.31-4.79 3.443l2.931 2.281A4.354 4.354 0 0 1 8 12c2.418 0 4-1.73 4-4 0-.258-.024-.51-.068-.753H8v-2.69h7.545z"/></svg>
            <span style={{fontSize:"10px",color:"#9ca3af",fontWeight:500}}>Google account</span>
          </div>
        </div>
      </div>

      {/* Physical stats */}
      <Card title="Physical Stats">
        <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
          <Tile label="Height"  value={`${profile.heightFt}'${profile.heightIn}"`}/>
          <Tile label="Weight"  value={`${profile.weightLbs} lbs`}/>
          {profile.bodyFatPct != null && <Tile label="Body Fat" value={`~${profile.bodyFatPct}%`}/>}
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <Tile label="Gender" value={profile.gender  || "—"}/>
          <Tile label="Build"  value={profile.build   || "—"}/>
        </div>
      </Card>

      {/* Goals */}
      <Card title="Goals">
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {[
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>, bg:"#eef2ff", label:"Primary goal",      val:profile.fitnessGoal   },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, bg:"#f5f3ff", label:"Target physique", val:profile.targetPhysique},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",gap:"10px",alignItems:"flex-start"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"7px",background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.icon}</div>
              <div>
                <p style={{fontSize:"10px",color:"#9ca3af",margin:"0 0 2px"}}>{r.label}</p>
                <p style={{fontSize:"13px",fontWeight:500,color:"#1f2937",margin:0}}>{r.val||"Not set"}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Notes */}
      <Card title="AI Coach Notes">
        {profile.aiNotes ? (
          <p style={{fontSize:"13px",color:"#374151",lineHeight:1.75,margin:0,fontStyle:"italic"}}>
            &ldquo;{profile.aiNotes}&rdquo;
          </p>
        ) : (
          <p style={{fontSize:"12px",color:"#9ca3af",margin:0}}>No notes yet. Tap <strong>Edit profile</strong> to add context for your AI coach.</p>
        )}
      </Card>

      {/* Edit button */}
      <button onClick={()=>{setDraft({...profile});setEditing(true);}}
        style={{width:"100%",background:"#1a1a2e",color:"white",border:"none",borderRadius:"14px",padding:"13px",fontSize:"14px",fontWeight:500,cursor:"pointer",marginBottom:"20px"}}>
        Edit profile
      </button>
    </>
  );

  /* ── EDIT MODE ────────────────────────────────────────────────── */
  const editContent = (
    <>
      {/* Physical stats */}
      <div style={{background:"white",borderRadius:"16px",border:"1px solid #f3f4f6",padding:"16px 20px",marginBottom:"12px",display:"flex",flexDirection:"column",gap:"14px"}}>
        <p style={{fontSize:"11px",fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em",margin:0}}>Physical Stats</p>

        <div><FieldLabel>Gender</FieldLabel>
          <div style={{display:"flex",gap:"8px"}}>
            {GENDERS.map(g=><button key={g} onClick={()=>setDraft(d=>({...d,gender:g}))} style={{flex:1,padding:"9px",borderRadius:"9px",border:`1.5px solid ${draft.gender===g?"#4f46e5":"#e5e7eb"}`,background:draft.gender===g?"#eef2ff":"#f9fafb",color:draft.gender===g?"#4338ca":"#6b7280",fontSize:"12px",fontWeight:draft.gender===g?500:400,cursor:"pointer"}}>{g}</button>)}
          </div>
        </div>

        <div><FieldLabel>Height</FieldLabel>
          <div style={{display:"flex",gap:"8px"}}>
            <select value={draft.heightFt} onChange={e=>setDraft(d=>({...d,heightFt:Number(e.target.value)}))} style={{flex:1,padding:"9px 10px",borderRadius:"9px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"12px",color:"#374151",outline:"none"}}>
              {[4,5,6,7].map(n=><option key={n} value={n}>{n} ft</option>)}
            </select>
            <select value={draft.heightIn} onChange={e=>setDraft(d=>({...d,heightIn:Number(e.target.value)}))} style={{flex:1,padding:"9px 10px",borderRadius:"9px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"12px",color:"#374151",outline:"none"}}>
              {Array.from({length:12},(_,i)=>i).map(n=><option key={n} value={n}>{n} in</option>)}
            </select>
          </div>
        </div>

        <div><FieldLabel>Weight (lbs)</FieldLabel>
          <input type="number" value={draft.weightLbs} onChange={e=>setDraft(d=>({...d,weightLbs:Number(e.target.value)}))}
            style={{width:"100%",padding:"9px 12px",borderRadius:"9px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"12px",color:"#374151",outline:"none",boxSizing:"border-box"}}/>
        </div>

        <div><FieldLabel>Current build</FieldLabel>
          <PillRow options={BUILDS} value={draft.build} onChange={v=>setDraft(d=>({...d,build:v}))}/>
        </div>

        <div><FieldLabel>Body fat % (optional)</FieldLabel>
          <input type="number" value={draft.bodyFatPct ?? ""} onChange={e=>setDraft(d=>({...d,bodyFatPct:e.target.value===""?null:Number(e.target.value)}))} placeholder="e.g. 18"
            style={{width:"100%",padding:"9px 12px",borderRadius:"9px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"12px",color:"#374151",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>

      {/* Goals */}
      <div style={{background:"white",borderRadius:"16px",border:"1px solid #f3f4f6",padding:"16px 20px",marginBottom:"12px",display:"flex",flexDirection:"column",gap:"14px"}}>
        <p style={{fontSize:"11px",fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em",margin:0}}>Goals</p>
        <div><FieldLabel>Primary goal</FieldLabel>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {GOALS.map(g=><button key={g} onClick={()=>setDraft(d=>({...d,fitnessGoal:g}))} style={{padding:"10px 12px",borderRadius:"9px",border:`1.5px solid ${draft.fitnessGoal===g?"#4f46e5":"#e5e7eb"}`,background:draft.fitnessGoal===g?"#eef2ff":"#f9fafb",color:draft.fitnessGoal===g?"#4338ca":"#374151",fontSize:"12px",cursor:"pointer",textAlign:"left",fontWeight:draft.fitnessGoal===g?500:400}}>{g}</button>)}
          </div>
        </div>
        <div><FieldLabel>Target physique</FieldLabel>
          <PillRow options={PHYSIQUES} value={draft.targetPhysique} onChange={v=>setDraft(d=>({...d,targetPhysique:v}))}/>
        </div>
      </div>

      {/* AI Notes */}
      <div style={{background:"white",borderRadius:"16px",border:"1px solid #f3f4f6",padding:"16px 20px",marginBottom:"12px"}}>
        <p style={{fontSize:"11px",fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>AI Coach Notes</p>
        <textarea value={draft.aiNotes} onChange={e=>setDraft(d=>({...d,aiNotes:e.target.value}))} rows={4}
          placeholder="Injuries, sports you play, schedule, aesthetics, anything your AI coach should know..."
          style={{width:"100%",fontSize:"12px",border:"1.5px solid #e5e7eb",borderRadius:"10px",padding:"10px 12px",color:"#374151",background:"#f9fafb",resize:"none",outline:"none",lineHeight:1.7,boxSizing:"border-box"}}/>
      </div>

      {/* Save / Cancel */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
        <button onClick={()=>{setDraft({...profile});setEditing(false);}}
          style={{flex:1,padding:"13px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:"12px",fontSize:"13px",color:"#6b7280",cursor:"pointer"}}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{flex:2,padding:"13px",background:"#4f46e5",color:"white",border:"none",borderRadius:"12px",fontSize:"13px",fontWeight:500,cursor:"pointer",opacity:saving?0.7:1}}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"#1a1a2e",padding:isDesktop?"24px 28px 20px":"20px",flexShrink:0}}>
        <h1 style={{color:"white",fontSize:isDesktop?"22px":"18px",fontWeight:500,margin:"0 0 4px"}}>My Profile</h1>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:0}}>Your fitness identity &amp; AI coach settings</p>
      </div>

      {/* Scroll body */}
      <div style={{flex:1,overflowY:"auto",padding:isDesktop?"32px 48px":"16px"}}>
        <div style={{maxWidth:isDesktop?"560px":"none",margin:isDesktop?"0 auto":"0"}}>

          {toastOk&&(
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"12px",padding:"10px 16px",marginBottom:"12px",fontSize:"12px",color:"#16a34a",textAlign:"center",fontWeight:500}}>
              ✓ Profile updated!
            </div>
          )}

          {editing ? editContent : viewContent}
        </div>
      </div>
    </div>
  );
}
