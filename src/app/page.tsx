"use client";
import { useState, useEffect } from "react";

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type ContentStage = "idea" | "scripting" | "production" | "review" | "published";
type Assignee = "大哥" | "BRO";

interface Task { id: string; title: string; description?: string; status: TaskStatus; assignee: Assignee; createdAt: number; }
interface ContentItem { id: string; title: string; description?: string; script?: string; images: string[] | string; stage: ContentStage; assignee: Assignee; createdAt: number; updatedAt: number; }
interface CalendarEvent { id: string; title: string; description?: string; date: string; time?: string; type: "cron" | "scheduled" | "reminder"; assignee: Assignee; completed: boolean; createdAt: number; }
interface MemoryDoc { id: string; title: string; content: string; tags: string[]; createdAt: number; updatedAt: number; }
interface TeamMember { id: string; name: string; role: string; description: string; avatar: string; status: "active" | "idle"; skills: string[]; }
interface OfficeAgent { id: string; name: string; avatar: string; role: string; status: "working" | "idle" | "break"; currentTask: string; computerOn: boolean; }

const STATUS_LABELS: Record<TaskStatus, string> = { todo: "📋 待办", in_progress: "🔄 进行中", review: "👀 审核", done: "✅ 完成" };
const STAGE_LABELS: Record<ContentStage, string> = { idea: "💡 灵感", scripting: "📝 脚本", production: "🎬 制作", review: "👀 审核", published: "🚀 已发布" };
const STAGE_COLORS: Record<ContentStage, string> = { idea: "#fef3c7", scripting: "#dbeafe", production: "#e0e7ff", review: "#fef9c3", published: "#d1fae5" };
const EVENT_TYPE_LABELS: Record<string, string> = { cron: "🔄 定时", scheduled: "📅 计划", reminder: "⏰ 提醒" };
const EVENT_TYPE_COLORS: Record<string, string> = { cron: "#dbeafe", scheduled: "#e0e7ff", reminder: "#fef3c7" };

async function fetchTasks() { const r = await fetch("/api/tasks"); return r.ok ? r.json() : []; }
async function saveTasks(t: Task[]) { await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); }
async function fetchContent() { const r = await fetch("/api/content"); return r.ok ? r.json() : []; }
async function saveContent(t: ContentItem[]) { await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); }
async function fetchCalendar() { const r = await fetch("/api/calendar"); return r.ok ? r.json() : []; }
async function saveCalendar(t: CalendarEvent[]) { await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); }
async function fetchMemory() { const r = await fetch("/api/memory"); return r.ok ? r.json() : []; }
async function saveMemory(t: MemoryDoc[]) { await fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); }
async function fetchTeam() { const r = await fetch("/api/team"); return r.ok ? r.json() : []; }
async function saveTeam(t: TeamMember[]) { await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); }
async function fetchOffice() { const r = await fetch("/api/office"); return r.ok ? r.json() : []; }
async function saveOffice(t: OfficeAgent[]) { await fetch("/api/office", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); }

function TaskBoard(props: { onError: (e: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newT, setNewT] = useState({ title: "", description: "", status: "todo" as TaskStatus, assignee: "BRO" as Assignee });

  useEffect(() => { fetchTasks().then(setTasks).catch(() => { const s = localStorage.getItem("task-board-tasks"); if (s) setTasks(JSON.parse(s)); }).finally(() => setLoading(false)); }, []);
  const save = async (nt: Task[]) => { setTasks(nt); localStorage.setItem("task-board-tasks", JSON.stringify(nt)); try { await saveTasks(nt); } catch { props.onError("保存失败"); } };
  const add = () => { if (!newT.title.trim()) return; save([{ id: Date.now().toString(), ...newT, createdAt: Date.now() }, ...tasks]); setNewT({ title: "", description: "", status: "todo", assignee: "BRO" }); setShowAdd(false); };
  const updS = (id: string, s: TaskStatus) => save(tasks.map(t => t.id === id ? { ...t, status: s } : t));
  const updA = (id: string, a: Assignee) => save(tasks.map(t => t.id === id ? { ...t, assignee: a } : t));
  const del = (id: string) => { if (confirm("删除？")) save(tasks.filter(t => t.id !== id)); };
  const byS = (s: TaskStatus) => tasks.filter(t => t.status === s);
  if (loading) return <div style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>⏳</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:"bold",margin:0}}>📋 任务看板</h2>
        <button onClick={() => setShowAdd(true)} style={{backgroundColor:"#2563eb",color:"white",padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer"}}>➕ 添加任务</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        {(["todo","in_progress","review","done"] as TaskStatus[]).map(s => (
          <div key={s} style={{backgroundColor:s==="todo"?"#f3f4f6":s==="in_progress"?"#eff6ff":s==="review"?"#fefce8":"#f0fdf4",borderRadius:12,padding:16,minHeight:300}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><h3 style={{fontWeight:"600",margin:0}}>{STATUS_LABELS[s]}</h3><span style={{backgroundColor:"white",padding:"2px 10px",borderRadius:12,fontSize:12}}>{byS(s).length}</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {byS(s).map(t => (
                <div key={t.id} style={{backgroundColor:"white",borderRadius:8,padding:12,boxShadow:"0 1px 2px rgba(0,0,0,0.1)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontWeight:500,fontSize:14}}>{t.title}</span><button onClick={() => del(t.id)} style={{background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:16}}>×</button></div>
                  {t.description && <p style={{color:"#666",fontSize:12,margin:"0 0 8px 0"}}>{t.description}</p>}
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <select value={t.assignee} onChange={(e) => updA(t.id, e.target.value as Assignee)} style={{fontSize:11,padding:4,borderRadius:4,border:"1px solid",backgroundColor:t.assignee==="大哥"?"#f3e8ff":"#e0f2fe",borderColor:t.assignee==="大哥"?"#d8b4fe":"#7dd3fc",color:t.assignee==="大哥"?"#7c3aed":"#0369a1"}}><option value="大哥">👤</option><option value="BRO">🤖</option></select>
                    <select value={t.status} onChange={(e) => updS(t.id, e.target.value as TaskStatus)} style={{fontSize:11,padding:4,borderRadius:4,border:"1px solid #e5e7eb"}}><option value="todo">📋</option><option value="in_progress">🔄</option><option value="review">👀</option><option value="done">✅</option></select>
                  </div>
                </div>
              ))}
              {byS(s).length===0 && <div style={{textAlign:"center",padding:20,color:"#999"}}>暂无</div>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"100%",maxWidth:400}}>
            <h3 style={{marginBottom:16}}>➕ 添加任务</h3>
            <input type="text" value={newT.title} onChange={(e) => setNewT({...newT,title:e.target.value})} placeholder="任务标题" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={newT.description} onChange={(e) => setNewT({...newT,description:e.target.value})} placeholder="描述" rows={2} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <select value={newT.assignee} onChange={(e) => setNewT({...newT,assignee:e.target.value as Assignee})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="大哥">👤 大哥</option><option value="BRO">🤖 BRO</option></select>
              <select value={newT.status} onChange={(e) => setNewT({...newT,status:e.target.value as TaskStatus})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="todo">📋</option><option value="in_progress">🔄</option><option value="review">👀</option><option value="done">✅</option></select>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={() => setShowAdd(false)}>取消</button><button onClick={add} style={{padding:"8px 20px",backgroundColor:"#2563eb",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>添加</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentPipeline(props: { onError: (e: string) => void }) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [newI, setNewI] = useState({ title: "", description: "", script: "", images: "", stage: "idea" as ContentStage, assignee: "BRO" as Assignee });
  const getImgCnt = (im: string[]|string|undefined):number => { if(!im)return 0; if(Array.isArray(im))return im.length; if(typeof im==="string")return im.split("\n").filter(Boolean).length; return 0; };

  useEffect(() => { fetchContent().then(setContent).catch(() => { const s = localStorage.getItem("content-pipeline-items"); if(s) setContent(JSON.parse(s)); }).finally(() => setLoading(false)); }, []);
  const save = async (nc: ContentItem[]) => { setContent(nc); localStorage.setItem("content-pipeline-items", JSON.stringify(nc)); try { await saveContent(nc); } catch { props.onError("保存失败"); } };
  const add = () => { if(!newI.title.trim())return; const item:ContentItem={id:Date.now().toString(),...newI,images:typeof newI.images==="string"?newI.images.split("\n").filter(Boolean):newI.images,createdAt:Date.now(),updatedAt:Date.now()}; save([item,...content]); setNewI({title:"",description:"",script:"",images:"",stage:"idea",assignee:"BRO"}); setShowAdd(false); };
  const upd = () => { if(!editing||!editing.title.trim())return; const imgs = typeof editing.images==="string"?editing.images.split("\n").filter(Boolean):(Array.isArray(editing.images)?editing.images:[]); save(content.map(c=>c.id===editing.id?{...editing,images:imgs,updatedAt:Date.now()}:c)); setEditing(null); };
  const del = (id:string) => { if(confirm("删除？")) save(content.filter(c=>c.id!==id)); };
  const byS = (s:ContentStage) => content.filter(c=>c.stage===s);
  const stages:ContentStage[]=["idea","scripting","production","review","published"];
  if(loading) return <div style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>⏳</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:"bold",margin:0}}>🎬 内容Pipeline</h2>
        <button onClick={()=>setShowAdd(true)} style={{backgroundColor:"#7c3aed",color:"white",padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer"}}>➕ 新建内容</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>{stages.map(s=><div key={s} style={{backgroundColor:STAGE_COLORS[s],padding:12,borderRadius:8,textAlign:"center"}}><div style={{fontSize:18,fontWeight:"bold"}}>{byS(s).length}</div><div style={{fontSize:12,color:"#666"}}>{STAGE_LABELS[s]}</div></div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {stages.map(s => (
          <div key={s} style={{backgroundColor:STAGE_COLORS[s],borderRadius:12,padding:12,minHeight:400}}>
            <h3 style={{fontWeight:600,marginBottom:12,fontSize:14}}>{STAGE_LABELS[s]}</h3>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {byS(s).map(i => (
                <div key={i.id} style={{backgroundColor:"white",borderRadius:8,padding:12,boxShadow:"0 1px 2px rgba(0,0,0,0.1)",cursor:"pointer"}} onClick={()=>setEditing(i)}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:500,fontSize:13,flex:1}}>{i.title}</span><button onClick={(e)=>{e.stopPropagation();del(i.id)}} style={{background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:14}}>×</button></div>
                  {i.description&&<p style={{color:"#666",fontSize:11,margin:"0 0 6px 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.description}</p>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:10,color:i.assignee==="大哥"?"#7c3aed":"#0369a1",backgroundColor:i.assignee==="大哥"?"#f3e8ff":"#e0f2fe",padding:"2px 6px",borderRadius:4}}>{i.assignee==="大哥"?"👤":"🤖"} {i.assignee}</span>{getImgCnt(i.images)>0&&<span style={{fontSize:10}}>🖼️ {getImgCnt(i.images)}</span>}</div>
                </div>
              ))}
              {byS(s).length===0&&<div style={{textAlign:"center",padding:20,color:"#999",fontSize:12}}>暂无</div>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:500,maxHeight:"80vh",overflow:"auto"}}>
            <h3 style={{marginBottom:16}}>➕ 新建内容</h3>
            <input type="text" value={newI.title} onChange={(e)=>setNewI({...newI,title:e.target.value})} placeholder="标题 *" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={newI.description} onChange={(e)=>setNewI({...newI,description:e.target.value})} placeholder="简介/大纲" rows={2} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={newI.script} onChange={(e)=>setNewI({...newI,script:e.target.value})} placeholder="脚本" rows={4} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={newI.images} onChange={(e)=>setNewI({...newI,images:e.target.value})} placeholder="图片链接" rows={2} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <select value={newI.assignee} onChange={(e)=>setNewI({...newI,assignee:e.target.value as Assignee})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="大哥">👤</option><option value="BRO">🤖</option></select>
              <select value={newI.stage} onChange={(e)=>setNewI({...newI,stage:e.target.value as ContentStage})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="idea">💡</option><option value="scripting">📝</option><option value="production">🎬</option><option value="review">👀</option><option value="published">🚀</option></select>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setShowAdd(false)}>取消</button><button onClick={add} style={{padding:"8px 20px",backgroundColor:"#7c3aed",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>创建</button></div>
          </div>
        </div>
      )}
      {editing && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:500,maxHeight:"80vh",overflow:"auto"}}>
            <h3 style={{marginBottom:16}}>✏️ 编辑</h3>
            <input type="text" value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={editing.description||""} onChange={(e)=>setEditing({...editing,description:e.target.value})} rows={2} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={editing.script||""} onChange={(e)=>setEditing({...editing,script:e.target.value})} rows={6} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={typeof editing.images==="string"?editing.images:(Array.isArray(editing.images)?editing.images.join("\n"):"")} onChange={(e)=>setEditing({...editing,images:e.target.value})} rows={3} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <select value={editing.assignee} onChange={(e)=>setEditing({...editing,assignee:e.target.value as Assignee})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="大哥">👤</option><option value="BRO">🤖</option></select>
              <select value={editing.stage} onChange={(e)=>setEditing({...editing,stage:e.target.value as ContentStage})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="idea">💡</option><option value="scripting">📝</option><option value="production">🎬</option><option value="review">👀</option><option value="published">🚀</option></select>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setEditing(null)}>取消</button><button onClick={upd} style={{padding:"8px 20px",backgroundColor:"#7c3aed",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>保存</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarBoard(props: { onError: (e: string) => void }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<"list"|"calendar">("list");
  const [newE, setNewE] = useState({ title: "", description: "", date: "", time: "", type: "scheduled" as "cron"|"scheduled"|"reminder", assignee: "BRO" as Assignee });

  useEffect(() => { fetchCalendar().then(setEvents).catch(() => { const s = localStorage.getItem("calendar-events"); if(s) setEvents(JSON.parse(s)); }).finally(() => setLoading(false)); }, []);
  const save = async (ne: CalendarEvent[]) => { setEvents(ne); localStorage.setItem("calendar-events", JSON.stringify(ne)); try { await saveCalendar(ne); } catch { props.onError("保存失败"); } };
  const add = () => { if(!newE.title.trim()||!newE.date)return; const e:CalendarEvent={id:Date.now().toString(),...newE,completed:false,createdAt:Date.now()}; save([e,...events]); setNewE({title:"",description:"",date:"",time:"",type:"scheduled",assignee:"BRO"}); setShowAdd(false); };
  const upd = () => { if(!editing||!editing.title.trim())return; save(events.map(ev=>ev.id===editing.id?editing:ev)); setEditing(null); };
  const del = (id:string) => { if(confirm("删除？")) save(events.filter(e=>e.id!==id)); };
  const tog = (id:string) => save(events.map(e=>e.id===id?{...e,completed:!e.completed}:e));
  const weekDays = (()=>{const d=[];for(let i=0;i<7;i++){const x=new Date();x.setDate(x.getDate()+i);d.push(x.toISOString().split("T")[0]);}return d;})();
  const byDate = (date:string) => events.filter(e=>e.date===date);
  const byT = (t:"cron"|"scheduled"|"reminder") => events.filter(e=>e.type===t);
  if(loading) return <div style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>⏳</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:"bold",margin:0}}>📅 日历看板</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setView("list")} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",backgroundColor:view==="list"?"#2563eb":"white",color:view==="list"?"white":"#666"}}>📋 列表</button>
          <button onClick={()=>setView("calendar")} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",backgroundColor:view==="calendar"?"#2563eb":"white",color:view==="calendar"?"white":"#666"}}>📅 周视图</button>
          <button onClick={()=>setShowAdd(true)} style={{backgroundColor:"#2563eb",color:"white",padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer"}}>➕ 添加</button>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:24}}>{[{l:"🔄 定时",v:byT("cron").length,c:"#dbeafe"},{l:"📅 计划",v:byT("scheduled").length,c:"#e0e7ff"},{l:"⏰ 提醒",v:byT("reminder").length,c:"#fef3c7"},{l:"✅ 完成",v:events.filter(e=>e.completed).length,c:"#d1fae5"}].map(x=><div key={x.l} style={{backgroundColor:x.c,padding:"12px 20px",borderRadius:8,flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:"bold"}}>{x.v}</div><div style={{fontSize:12,color:"#666"}}>{x.l}</div></div>)}</div>
      {view==="list"?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {events.length===0&&<div style={{textAlign:"center",padding:40,color:"#999"}}>暂无日程</div>}
          {events.map(e=>(
            <div key={e.id} style={{backgroundColor:"white",borderRadius:8,padding:16,boxShadow:"0 1px 2px rgba(0,0,0,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center",opacity:e.completed?0.6:1}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <input type="checkbox" checked={e.completed} onChange={()=>tog(e.id)} style={{width:18,height:18}} />
                <div><div style={{fontWeight:500,textDecoration:e.completed?"line-through":"none"}}>{e.title}</div><div style={{fontSize:12,color:"#666"}}>{e.date} {e.time} · {EVENT_TYPE_LABELS[e.type]} · {e.assignee==="大哥"?"👤":"🤖"} {e.assignee}</div></div>
              </div>
              <button onClick={()=>del(e.id)} style={{background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:18}}>×</button>
            </div>
          ))}
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {weekDays.map(d=>(
            <div key={d} style={{backgroundColor:"#f9fafb",borderRadius:8,padding:12,minHeight:200}}>
              <div style={{fontWeight:600,marginBottom:8,fontSize:12,textAlign:"center"}}>{new Date(d).toLocaleDateString("zh-CN",{month:"numeric",day:"numeric",weekday:"short"})}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {byDate(d).map(e=>(
                  <div key={e.id} onClick={()=>setEditing(e)} style={{backgroundColor:EVENT_TYPE_COLORS[e.type],padding:"6px 8px",borderRadius:4,fontSize:11,cursor:"pointer",opacity:e.completed?0.6:1}}>
                    <div style={{fontWeight:500,textDecoration:e.completed?"line-through":"none"}}>{e.time||"全天"} {e.title}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:400}}>
            <h3 style={{marginBottom:16}}>➕ 添加日程</h3>
            <input type="text" value={newE.title} onChange={(e)=>setNewE({...newE,title:e.target.value})} placeholder="标题" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="date" value={newE.date} onChange={(e)=>setNewE({...newE,date:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="time" value={newE.time} onChange={(e)=>setNewE({...newE,time:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <select value={newE.type} onChange={(e)=>setNewE({...newE,type:e.target.value as any})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="cron">🔄 定时</option><option value="scheduled">📅 计划</option><option value="reminder">⏰ 提醒</option></select>
              <select value={newE.assignee} onChange={(e)=>setNewE({...newE,assignee:e.target.value as Assignee})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="大哥">👤</option><option value="BRO">🤖</option></select>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setShowAdd(false)}>取消</button><button onClick={add} style={{padding:"8px 20px",backgroundColor:"#2563eb",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>添加</button></div>
          </div>
        </div>
      )}
      {editing && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:400}}>
            <h3 style={{marginBottom:16}}>✏️ 编辑日程</h3>
            <input type="text" value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="date" value={editing.date} onChange={(e)=>setEditing({...editing,date:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="time" value={editing.time||""} onChange={(e)=>setEditing({...editing,time:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <select value={editing.type} onChange={(e)=>setEditing({...editing,type:e.target.value as any})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="cron">🔄 定时</option><option value="scheduled">📅 计划</option><option value="reminder">⏰ 提醒</option></select>
              <select value={editing.assignee} onChange={(e)=>setEditing({...editing,assignee:e.target.value as Assignee})} style={{padding:8,borderRadius:8,border:"1px solid #ddd"}}><option value="大哥">👤</option><option value="BRO">🤖</option></select>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setEditing(null)}>取消</button><button onClick={upd} style={{padding:"8px 20px",backgroundColor:"#2563eb",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>保存</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryBoard(props: { onError: (e: string) => void }) {
  const [memories, setMemories] = useState<MemoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MemoryDoc | null>(null);
  const [search, setSearch] = useState("");
  const [newM, setNewM] = useState({ title: "", content: "", tags: "" });

  useEffect(() => { fetchMemory().then(setMemories).catch(() => { const s = localStorage.getItem("memory-docs"); if (s) setMemories(JSON.parse(s)); }).finally(() => setLoading(false)); }, []);
  const save = async (nm: MemoryDoc[]) => { setMemories(nm); localStorage.setItem("memory-docs", JSON.stringify(nm)); try { await saveMemory(nm); } catch { props.onError("保存失败"); } };
  const add = () => { if (!newM.title.trim()) return; const m: MemoryDoc = { id: Date.now().toString(), title: newM.title, content: newM.content, tags: newM.tags.split(",").map(t => t.trim()).filter(Boolean), createdAt: Date.now(), updatedAt: Date.now() }; save([m, ...memories]); setNewM({ title: "", content: "", tags: "" }); setShowAdd(false); };
  const upd = () => { if (!editing || !editing.title.trim()) return; save(memories.map(m => m.id === editing.id ? { ...editing, updatedAt: Date.now() } : m)); setEditing(null); };
  const del = (id: string) => { if (confirm("删除？")) save(memories.filter(m => m.id !== id)); };
  const filtered = search ? memories.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) : memories;
  if (loading) return <div style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>⏳</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:"bold",margin:0}}>🧠 记忆库</h2>
        <button onClick={()=>setShowAdd(true)} style={{backgroundColor:"#0891b2",color:"white",padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer"}}>➕ 新建记忆</button>
      </div>
      
      {/* 搜索框 */}
      <div style={{marginBottom:24}}>
        <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="🔍 搜索记忆..." style={{width:"100%",padding:"12px 16px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,boxShadow:"0 1px 2px rgba(0,0,0,0.05)"}} />
      </div>

      {/* 记忆列表 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
        {filtered.map(m => (
          <div key={m.id} style={{backgroundColor:"white",borderRadius:12,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.1)",border:"1px solid #e5e7eb",cursor:"pointer"}} onClick={()=>setEditing(m)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <h3 style={{fontSize:16,fontWeight:"600",margin:0,color:"#1f2937"}}>{m.title}</h3>
              <button onClick={(e)=>{e.stopPropagation();del(m.id)}} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:18,padding:0}}>×</button>
            </div>
            <p style={{fontSize:13,color:"#6b7280",margin:"0 0 12px 0",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{m.content}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {m.tags.map((t,i)=><span key={i} style={{fontSize:11,backgroundColor:"#f3f4f6",color:"#4b5563",padding:"2px 8px",borderRadius:12}}>#{t}</span>)}
            </div>
            <div style={{fontSize:11,color:"#9ca3af",marginTop:12}}>{new Date(m.updatedAt).toLocaleDateString("zh-CN")}</div>
          </div>
        ))}
        {filtered.length===0 && <div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:"#9ca3af"}}>{search?"没有找到相关记忆":"暂无记忆，点击添加"}</div>}
      </div>

      {showAdd && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:500,maxHeight:"80vh",overflow:"auto"}}>
            <h3 style={{marginBottom:16}}>➕ 新建记忆</h3>
            <input type="text" value={newM.title} onChange={(e)=>setNewM({...newM,title:e.target.value})} placeholder="标题" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={newM.content} onChange={(e)=>setNewM({...newM,content:e.target.value})} placeholder="内容" rows={8} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12,fontFamily:"inherit",resize:"vertical"}} />
            <input type="text" value={newM.tags} onChange={(e)=>setNewM({...newM,tags:e.target.value})} placeholder="标签 (逗号分隔)" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setShowAdd(false)}>取消</button><button onClick={add} style={{padding:"8px 20px",backgroundColor:"#0891b2",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>创建</button></div>
          </div>
        </div>
      )}

      {editing && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:500,maxHeight:"80vh",overflow:"auto"}}>
            <h3 style={{marginBottom:16}}>✏️ 编辑记忆</h3>
            <input type="text" value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={editing.content} onChange={(e)=>setEditing({...editing,content:e.target.value})} rows={10} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12,fontFamily:"inherit",resize:"vertical"}} />
            <input type="text" value={editing.tags.join(", ")} onChange={(e)=>setEditing({...editing,tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)})} placeholder="标签 (逗号分隔)" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setEditing(null)}>取消</button><button onClick={upd} style={{padding:"8px 20px",backgroundColor:"#0891b2",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>保存</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamBoard(props: { onError: (e: string) => void }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newM, setNewM] = useState({ name: "", role: "", description: "", avatar: "🤖", status: "idle" as "active" | "idle", skills: "" });

  const defaultMembers: TeamMember[] = [
    { id: "1", name: "BRO", role: "主助手", description: "AI助手，协调所有子代理，负责与大哥直接沟通", avatar: "🤖", status: "active", skills: ["任务管理", "决策", "协调"] },
    { id: "2", name: "CodeMaster", role: "开发者", description: "代码开发、调试、技术难题攻关", avatar: "💻", status: "idle", skills: ["Python", "JavaScript", "API", "DevOps"] },
    { id: "3", name: "Wordsmith", role: "写作者", description: "内容创作、文案撰写、脚本编写", avatar: "✍️", status: "idle", skills: ["写作", "翻译", "summarize"] },
    { id: "4", name: "PixelArtist", role: "设计师", description: "视觉设计、图片处理、PDF编辑", avatar: "🎨", status: "idle", skills: ["nano-pdf", "图像处理", "UI设计"] },
    { id: "5", name: "OpsGuard", role: "运维", description: "系统健康检查、安全审计、自动化", avatar: "🛡️", status: "idle", skills: ["healthcheck", "自动化", "监控"] },
  ];

  useEffect(() => { fetchTeam().then(t => { if (t.length === 0) { setTeam(defaultMembers); saveTeam(defaultMembers).catch(() => {}); } else setTeam(t); }).catch(() => setTeam(defaultMembers)).finally(() => setLoading(false)); }, []);
  const save = async (nt: TeamMember[]) => { setTeam(nt); localStorage.setItem("team-members", JSON.stringify(nt)); try { await saveTeam(nt); } catch { props.onError("保存失败"); } };
  const upd = () => { if (!editing || !editing.name.trim()) return; save(team.map(m => m.id === editing.id ? editing : m)); setEditing(null); };
  const add = () => { if (!newM.name.trim()) return; const m: TeamMember = { id: Date.now().toString(), ...newM, skills: newM.skills.split(",").map(s => s.trim()).filter(Boolean) }; save([...team, m]); setNewM({ name: "", role: "", description: "", avatar: "🤖", status: "idle", skills: "" }); };
  const del = (id: string) => { if (confirm("删除成员？")) save(team.filter(m => m.id !== id)); };
  const byRole = (r: string) => team.filter(m => m.role === r);
  const roles = ["主助手", "开发者", "写作者", "设计师", "运维"];
  const roleColors: Record<string, string> = { "主助手": "#fef3c7", "开发者": "#dbeafe", "写作者": "#e0e7ff", "设计师": "#fce7f3", "运维": "#d1fae5" };
  if (loading) return <div style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>⏳</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:"bold",margin:0}}>👥 团队结构</h2>
        <button onClick={() => setShowAdd(true)} style={{backgroundColor:"#dc2626",color:"white",padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer"}}>➕ 添加成员</button>
      </div>

      {/* 角色分组展示 */}
      {roles.map(role => (
        <div key={role} style={{marginBottom:32}}>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:12,height:12,borderRadius:"50%",backgroundColor:roleColors[role]||"#e5e7eb",display:"inline-block"}}></span>
            {role} <span style={{fontWeight:400,fontSize:14,color:"#9ca3af"}}>({byRole(role).length})</span>
          </h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
            {byRole(role).map(m => (
              <div key={m.id} style={{backgroundColor:"white",borderRadius:12,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.1)",border:"1px solid #e5e7eb"}} onClick={()=>setEditing(m)}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <span style={{fontSize:32}}>{m.avatar}</span>
                  <div><div style={{fontWeight:600,fontSize:16}}>{m.name}</div><div style={{fontSize:12,color:m.status==="active"?"#10b981":"#9ca3af"}}>{m.status==="active"?"● 在线":"○ 空闲"}</div></div>
                </div>
                <p style={{fontSize:13,color:"#6b7280",margin:"0 0 12px 0"}}>{m.description}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{m.skills.map((s,i)=><span key={i} style={{fontSize:11,backgroundColor:"#f3f4f6",color:"#4b5563",padding:"2px 8px",borderRadius:12}}>{s}</span>)}</div>
              </div>
            ))}
            {byRole(role).length===0 && <div style={{color:"#9ca3af",fontSize:13,padding:8}}>暂无成员</div>}
          </div>
        </div>
      ))}

      {editing && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:400}}>
            <h3 style={{marginBottom:16}}>✏️ 编辑成员</h3>
            <input type="text" value={editing.name} onChange={(e)=>setEditing({...editing,name:e.target.value})} placeholder="名称" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={editing.role} onChange={(e)=>setEditing({...editing,role:e.target.value})} placeholder="角色" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={editing.avatar} onChange={(e)=>setEditing({...editing,avatar:e.target.value})} placeholder="头像 emoji" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={editing.description} onChange={(e)=>setEditing({...editing,description:e.target.value})} placeholder="描述" rows={2} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={editing.skills.join(", ")} onChange={(e)=>setEditing({...editing,skills:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} placeholder="技能 (逗号分隔)" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <label style={{display:"flex",alignItems:"center",gap:8}}><input type="radio" checked={editing.status==="active"} onChange={()=>setEditing({...editing,status:"active"})} /> 在线</label>
              <label style={{display:"flex",alignItems:"center",gap:8}}><input type="radio" checked={editing.status==="idle"} onChange={()=>setEditing({...editing,status:"idle"})} /> 空闲</label>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button onClick={()=>del(editing.id)} style={{backgroundColor:"#ef4444",color:"white",padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer"}}>删除</button>
              <div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(null)}>取消</button><button onClick={upd} style={{padding:"8px 20px",backgroundColor:"#2563eb",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>保存</button></div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:400}}>
            <h3 style={{marginBottom:16}}>➕ 添加成员</h3>
            <input type="text" value={newM.name} onChange={(e)=>setNewM({...newM,name:e.target.value})} placeholder="名称" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <select value={newM.role} onChange={(e)=>setNewM({...newM,role:e.target.value})} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}}>
              <option value="">选择角色</option>
              {roles.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <input type="text" value={newM.avatar} onChange={(e)=>setNewM({...newM,avatar:e.target.value})} placeholder="头像 emoji" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <textarea value={newM.description} onChange={(e)=>setNewM({...newM,description:e.target.value})} placeholder="描述" rows={2} style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={newM.skills} onChange={(e)=>setNewM({...newM,skills:e.target.value})} placeholder="技能 (逗号分隔)" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setShowAdd(false)}>取消</button><button onClick={add} style={{padding:"8px 20px",backgroundColor:"#2563eb",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>添加</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function OfficeBoard(props: { onError: (e: string) => void }) {
  const [agents, setAgents] = useState<OfficeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OfficeAgent | null>(null);

  const defaultAgents: OfficeAgent[] = [
    { id: "1", name: "BRO", avatar: "🤖", role: "主助手", status: "working", currentTask: "与大哥沟通中", computerOn: true },
    { id: "2", name: "CodeMaster", avatar: "💻", role: "开发者", status: "idle", currentTask: "", computerOn: true },
    { id: "3", name: "Wordsmith", avatar: "✍️", role: "写作者", status: "idle", currentTask: "", computerOn: false },
    { id: "4", name: "PixelArtist", avatar: "🎨", role: "设计师", status: "idle", currentTask: "", computerOn: true },
    { id: "5", name: "OpsGuard", avatar: "🛡️", role: "运维", status: "break", currentTask: "休息中", computerOn: false },
  ];

  useEffect(() => { fetchOffice().then(a => { if (a.length === 0) { setAgents(defaultAgents); saveOffice(defaultAgents).catch(() => {}); } else setAgents(a); }).catch(() => setAgents(defaultAgents)).finally(() => setLoading(false)); }, []);
  const save = async (na: OfficeAgent[]) => { setAgents(na); localStorage.setItem("office-agents", JSON.stringify(na)); try { await saveOffice(na); } catch { props.onError("保存失败"); } };
  const toggleStatus = (id: string) => { save(agents.map(a => a.id === id ? { ...a, status: a.status === "working" ? "idle" : "working", currentTask: a.status === "working" ? "" : "工作中" } : a)); };
  const toggleComputer = (id: string) => { save(agents.map(a => a.id === id ? { ...a, computerOn: !a.computerOn } : a)); };
  const upd = () => { if (!editing) return; save(agents.map(a => a.id === editing.id ? editing : a)); setEditing(null); };
  const byStatus = (s: string) => agents.filter(a => a.status === s);
  const statusColors: Record<string, string> = { working: "#10b981", idle: "#6b7280", break: "#f59e0b" };
  if (loading) return <div style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>⏳</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:24,fontWeight:"bold",margin:0}}>🏢 数字办公室</h2>
        <div style={{display:"flex",gap:12}}>
          <span style={{backgroundColor:"#10b981",color:"white",padding:"6px 12px",borderRadius:20,fontSize:13}}>工作中: {byStatus("working").length}</span>
          <span style={{backgroundColor:"#6b7280",color:"white",padding:"6px 12px",borderRadius:20,fontSize:13}}>空闲: {byStatus("idle").length}</span>
          <span style={{backgroundColor:"#f59e0b",color:"white",padding:"6px 12px",borderRadius:20,fontSize:13}}>休息: {byStatus("break").length}</span>
        </div>
      </div>

      {/* 办公室视图 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:24}}>
        {agents.map(agent => (
          <div key={agent.id} style={{backgroundColor:"white",borderRadius:16,padding:24,boxShadow:"0 4px 6px rgba(0,0,0,0.1)",border:"2px solid",borderColor:agent.status==="working"?"#10b981":agent.status==="break"?"#f59e0b":"#e5e7eb"}}>
            {/* 工作站 */}
            <div style={{position:"relative",height:120,backgroundColor:"#1f2937",borderRadius:12,padding:12,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {/* 显示器 */}
              <div style={{width:80,height:60,backgroundColor:agent.computerOn?"#3b82f6":"#374151",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:agent.computerOn?"0 0 20px #3b82f6":"none"}}>
                {agent.computerOn && <span style={{fontSize:20}}>💻</span>}
              </div>
              {/* 桌子 */}
              <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:120,height:8,backgroundColor:"#9ca3af",borderRadius:4}}></div>
            </div>
            
            {/* Agent 头像和状态 */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{position:"relative"}}>
                <span style={{fontSize:48}}>{agent.avatar}</span>
                <div style={{position:"absolute",bottom:0,right:0,width:16,height:16,borderRadius:"50%",backgroundColor:statusColors[agent.status],border:"3px solid white"}}></div>
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:16}}>{agent.name}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{agent.role}</div>
              </div>
            </div>

            {/* 当前任务 */}
            <div style={{backgroundColor:"#f3f4f6",borderRadius:8,padding:12,marginBottom:12}}>
              <div style={{fontSize:11,color:"#9ca3af",marginBottom:4}}>当前任务</div>
              <div style={{fontSize:13,color:agent.currentTask?"#1f2937":"#9ca3af"}}>{agent.currentTask || "等待任务中..."}</div>
            </div>

            {/* 控制按钮 */}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>toggleStatus(agent.id)} style={{flex:1,padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",backgroundColor:agent.status==="working"?"#ef4444":"#10b981",color:"white",fontSize:13}}>
                {agent.status==="working"?"⏹ 停止工作":"▶️ 开始工作"}
              </button>
              <button onClick={()=>toggleComputer(agent.id)} style={{padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",backgroundColor:agent.computerOn?"#6b7280":"#3b82f6",color:"white",fontSize:13}}>
                {agent.computerOn?"💤 关机":"🖥 开机"}
              </button>
              <button onClick={()=>setEditing(agent)} style={{padding:"8px 12px",borderRadius:8,border:"1px solid #e5e7eb",cursor:"pointer",backgroundColor:"white",fontSize:13}}>✏️</button>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      {editing && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{backgroundColor:"white",borderRadius:12,padding:24,width:"90%",maxWidth:400}}>
            <h3 style={{marginBottom:16}}>✏️ 编辑 Agent</h3>
            <input type="text" value={editing.name} onChange={(e)=>setEditing({...editing,name:e.target.value})} placeholder="名称" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={editing.avatar} onChange={(e)=>setEditing({...editing,avatar:e.target.value})} placeholder="头像 emoji" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={editing.role} onChange={(e)=>setEditing({...editing,role:e.target.value})} placeholder="角色" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <input type="text" value={editing.currentTask} onChange={(e)=>setEditing({...editing,currentTask:e.target.value})} placeholder="当前任务" style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:8,marginBottom:12}} />
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <label style={{display:"flex",alignItems:"center",gap:8}}><input type="radio" checked={editing.status==="working"} onChange={()=>setEditing({...editing,status:"working"})} />工作中</label>
              <label style={{display:"flex",alignItems:"center",gap:8}}><input type="radio" checked={editing.status==="idle"} onChange={()=>setEditing({...editing,status:"idle"})} />空闲</label>
              <label style={{display:"flex",alignItems:"center",gap:8}}><input type="radio" checked={editing.status==="break"} onChange={()=>setEditing({...editing,status:"break"})} />休息</label>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={()=>setEditing(null)}>取消</button><button onClick={upd} style={{padding:"8px 20px",backgroundColor:"#2563eb",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>保存</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"tasks" | "content" | "calendar" | "memory" | "team" | "office">("tasks");
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#f5f5f5",padding:24}}>
      <div style={{maxWidth:"1400px",margin:"0 auto"}}>
        <h1 style={{fontSize:28,fontWeight:"bold",color:"#333",marginBottom:20}}>🎯 工作台</h1>
        
        {error && (
          <div style={{backgroundColor:"#fee2e2",color:"#991b1b",padding:12,borderRadius:8,marginBottom:16,fontSize:14}}>
            {error}
          </div>
        )}

        {/* 标签导航 */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={()=>setActiveTab("tasks")} style={{padding:"12px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:500,backgroundColor:activeTab==="tasks"?"#2563eb":"white",color:activeTab==="tasks"?"white":"#666",boxShadow:activeTab==="tasks"?"none":"0 1px 2px rgba(0,0,0,0.1)"}}>
            📋 任务看板
          </button>
          <button onClick={()=>setActiveTab("content")} style={{padding:"12px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:500,backgroundColor:activeTab==="content"?"#7c3aed":"white",color:activeTab==="content"?"white":"#666",boxShadow:activeTab==="content"?"none":"0 1px 2px rgba(0,0,0,0.1)"}}>
            🎬 内容Pipeline
          </button>
          <button onClick={()=>setActiveTab("calendar")} style={{padding:"12px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:500,backgroundColor:activeTab==="calendar"?"#059669":"white",color:activeTab==="calendar"?"white":"#666",boxShadow:activeTab==="calendar"?"none":"0 1px 2px rgba(0,0,0,0.1)"}}>
            📅 日历看板
          </button>
          <button onClick={()=>setActiveTab("memory")} style={{padding:"12px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:500,backgroundColor:activeTab==="memory"?"#0891b2":"white",color:activeTab==="memory"?"white":"#666",boxShadow:activeTab==="memory"?"none":"0 1px 2px rgba(0,0,0,0.1)"}}>
            🧠 记忆库
          </button>
          <button onClick={()=>setActiveTab("team")} style={{padding:"12px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:500,backgroundColor:activeTab==="team"?"#dc2626":"white",color:activeTab==="team"?"white":"#666",boxShadow:activeTab==="team"?"none":"0 1px 2px rgba(0,0,0,0.1)"}}>
            👥 团队
          </button>
          <button onClick={()=>setActiveTab("office")} style={{padding:"12px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:500,backgroundColor:activeTab==="office"?"#7c3aed":"white",color:activeTab==="office"?"white":"#666",boxShadow:activeTab==="office"?"none":"0 1px 2px rgba(0,0,0,0.1)"}}>
            🏢 办公室
          </button>
        </div>

        {/* 内容区域 */}
        <div style={{backgroundColor:"white",borderRadius:12,padding:24,boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
          {activeTab==="tasks"?<TaskBoard onError={setError}/>:activeTab==="content"?<ContentPipeline onError={setError}/>:activeTab==="calendar"?<CalendarBoard onError={setError}/>:activeTab==="memory"?<MemoryBoard onError={setError}/>:activeTab==="team"?<TeamBoard onError={setError}/>:<OfficeBoard onError={setError}/>}
        </div>
      </div>
    </div>
  );
}  
