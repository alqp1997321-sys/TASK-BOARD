"use client";

import { useState, useEffect, useRef } from "react";

// ==================== 类型定义 ====================
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type ContentStage = "idea" | "scripting" | "production" | "review" | "published";
type Assignee = "大哥" | "BRO";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee: Assignee;
  createdAt: number;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  script?: string;
  images: string[] | string;
  stage: ContentStage;
  assignee: Assignee;
  createdAt: number;
  updatedAt: number;
}

// ==================== 常量 ====================
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "📋 待办",
  in_progress: "🔄 进行中",
  review: "👀 审核",
  done: "✅ 完成",
};

const STAGE_LABELS: Record<ContentStage, string> = {
  idea: "💡 灵感",
  scripting: "📝 脚本",
  production: "🎬 制作",
  review: "👀 审核",
  published: "🚀 已发布",
};

const STAGE_COLORS: Record<ContentStage, string> = {
  idea: "#fef3c7",
  scripting: "#dbeafe",
  production: "#e0e7ff",
  review: "#fef9c3",
  published: "#d1fae5",
};

// ==================== API 函数 ====================
async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tasks),
  });
}

async function fetchContent(): Promise<ContentItem[]> {
  const res = await fetch("/api/content");
  if (!res.ok) throw new Error("Failed to fetch content");
  return res.json();
}

async function saveContent(items: ContentItem[]): Promise<void> {
  await fetch("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  });
}

// ==================== 任务看板组件 ====================
function TaskBoard({ onError }: { onError: (err: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    assignee: "BRO" as Assignee,
  });

  useEffect(() => {
    fetchTasks().then(setTasks).catch(() => {
      const saved = localStorage.getItem("task-board-tasks");
      if (saved) setTasks(JSON.parse(saved));
      onError("任务加载失败，使用本地数据");
    }).finally(() => setLoading(false));
  }, []);

  const saveTasksHandler = async (newTasks: Task[]) => {
    setTasks(newTasks);
    setLastUpdated(Date.now());
    localStorage.setItem("task-board-tasks", JSON.stringify(newTasks));
    setSyncing(true);
    try {
      await saveTasks(newTasks);
    } catch {
      onError("保存失败");
    } finally {
      setSyncing(false);
    }
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = { id: Date.now().toString(), ...newTask, createdAt: Date.now() };
    saveTasksHandler([task, ...tasks]);
    setNewTask({ title: "", description: "", status: "todo", assignee: "BRO" });
    setShowAddModal(false);
  };

  const updateStatus = (taskId: string, status: TaskStatus) => {
    saveTasksHandler(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const updateAssignee = (taskId: string, assignee: Assignee) => {
    saveTasksHandler(tasks.map(t => t.id === taskId ? { ...t, assignee } : t));
  };

  const deleteTask = (taskId: string) => {
    if (!confirm("确定删除这个任务吗？")) return;
    saveTasksHandler(tasks.filter(t => t.id !== taskId));
  };

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const stats = {
    total: tasks.length,
    todo: tasksByStatus("todo").length,
    inProgress: tasksByStatus("in_progress").length,
    review: tasksByStatus("review").length,
    done: tasksByStatus("done").length,
  };

  if (loading) return <div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}><div>⏳ 加载中...</div></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#333", margin: 0 }}>📋 任务看板</h2>
          <p style={{ color: "#666", marginTop: "4px", fontSize: "14px" }}>
            {lastUpdated ? (syncing ? "🔄 同步中..." : `✅ 已同步 ${new Date(lastUpdated).toLocaleTimeString()}`) : ""}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: "#2563eb", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}>➕ 添加任务</button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "全部", value: stats.total, color: "white" },
          { label: "待办", value: stats.todo, color: "#fef3c7" },
          { label: "进行中", value: stats.inProgress, color: "#dbeafe" },
          { label: "审核", value: stats.review, color: "#fef9c3" },
          { label: "已完成", value: stats.done, color: "#d1fae5" },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: item.color, padding: "12px 20px", borderRadius: "8px", textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{item.value}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {(["todo", "in_progress", "review", "done"] as TaskStatus[]).map(status => (
          <div key={status} style={{ backgroundColor: status === "todo" ? "#f3f4f6" : status === "in_progress" ? "#eff6ff" : status === "review" ? "#fefce8" : "#f0fdf4", borderRadius: "12px", padding: "16px", minHeight: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontWeight: "600", margin: 0 }}>{STATUS_LABELS[status]}</h3>
              <span style={{ backgroundColor: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" }}>{tasksByStatus(status).length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tasksByStatus(status).map(task => (
                <div key={task.id} style={{ backgroundColor: "white", borderRadius: "8px", padding: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "500", fontSize: "14px" }}>{task.title}</span>
                    <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "16px" }}>×</button>
                  </div>
                  {task.description && <p style={{ color: "#666", fontSize: "12px", margin: "0 0 8px 0" }}>{task.description}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <select value={task.assignee} onChange={(e) => updateAssignee(task.id, e.target.value as Assignee)} style={{ fontSize: "11px", padding: "4px", borderRadius: "4px", border: "1px solid", backgroundColor: task.assignee === "大哥" ? "#f3e8ff" : "#e0f2fe", borderColor: task.assignee === "大哥" ? "#d8b4fe" : "#7dd3fc", color: task.assignee === "大哥" ? "#7c3aed" : "#0369a1" }}>
                      <option value="大哥">👤 大哥</option>
                      <option value="BRO">🤖 BRO</option>
                    </select>
                    <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)} style={{ fontSize: "11px", padding: "4px", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                      <option value="todo">📋 待办</option>
                      <option value="in_progress">🔄 进行中</option>
                      <option value="review">👀 审核</option>
                      <option value="done">✅ 完成</option>
                    </select>
                  </div>
                </div>
              ))}
              {tasksByStatus(status).length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>暂无</div>}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ marginBottom: "16px" }}>➕ 添加任务</h3>
            <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="任务标题" style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="描述（可选）" rows={2} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value as Assignee })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="大哥">👤 大哥</option>
                <option value="BRO">🤖 BRO</option>
              </select>
              <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="todo">📋 待办</option>
                <option value="in_progress">🔄 进行中</option>
                <option value="review">👀 审核</option>
                <option value="done">✅ 完成</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer" }}>取消</button>
              <button onClick={addTask} style={{ padding: "8px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 内容 Pipeline 组件 ====================
function ContentPipeline({ onError }: { onError: (err: string) => void }) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    script: "",
    images: "",
    stage: "idea" as ContentStage,
    assignee: "BRO" as Assignee,
  });

  useEffect(() => {
    fetchContent().then(setContent).catch(() => {
      const saved = localStorage.getItem("content-pipeline-items");
      if (saved) setContent(JSON.parse(saved));
      onError("内容加载失败");
    }).finally(() => setLoading(false));
  }, []);

  const saveContentHandler = async (newContent: ContentItem[]) => {
    setContent(newContent);
    setLastUpdated(Date.now());
    localStorage.setItem("content-pipeline-items", JSON.stringify(newContent));
    setSyncing(true);
    try {
      await saveContent(newContent);
    } catch {
      onError("保存失败");
    } finally {
      setSyncing(false);
    }
  };

  const addItem = () => {
    if (!newItem.title.trim()) return;
    const item: ContentItem = {
      id: Date.now().toString(),
      ...newItem,
      images: typeof newItem.images === "string" ? newItem.images.split("\n").filter(Boolean) : newItem.images,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveContentHandler([item, ...content]);
    setNewItem({ title: "", description: "", script: "", images: "", stage: "idea", assignee: "BRO" });
    setShowAddModal(false);
  };

  const updateItem = () => {
    if (!editingItem || !editingItem.title.trim()) return;
    const updatedImages = typeof editingItem.images === "string" 
      ? editingItem.images.split("\n").filter(Boolean)
      : (Array.isArray(editingItem.images) ? editingItem.images : []);
    const updated = content.map(c => c.id === editingItem.id ? { ...editingItem, images: updatedImages, updatedAt: Date.now() } : c);
    saveContentHandler(updated);
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    if (!confirm("确定删除？")) return;
    saveContentHandler(content.filter(c => c.id !== id));
  };

  const contentByStage = (stage: ContentStage) => content.filter(c => c.stage === stage);

  const stages: ContentStage[] = ["idea", "scripting", "production", "review", "published"];

  if (loading) return <div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}><div>⏳ 加载中...</div></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#333", margin: 0 }}>🎬 内容Pipeline</h2>
          <p style={{ color: "#666", marginTop: "4px", fontSize: "14px" }}>
            灵感 → 脚本 → 制作 → 审核 → 发布 {lastUpdated ? (syncing ? "🔄 同步中..." : `✅ ${new Date(lastUpdated).toLocaleTimeString()}`) : ""}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: "#7c3aed", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}>➕ 新建内容</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {stages.map(stage => (
          <div key={stage} style={{ backgroundColor: STAGE_COLORS[stage], padding: "12px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{contentByStage(stage).length}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>{STAGE_LABELS[stage]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        {stages.map(stage => (
          <div key={stage} style={{ backgroundColor: STAGE_COLORS[stage], borderRadius: "12px", padding: "12px", minHeight: "400px" }}>
            <h3 style={{ fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>{STAGE_LABELS[stage]}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {contentByStage(stage).map(item => (
                <div key={item.id} style={{ backgroundColor: "white", borderRadius: "8px", padding: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", cursor: "pointer" }} onClick={() => setEditingItem(item)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "500", fontSize: "13px", flex: 1 }}>{item.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "14px" }}>×</button>
                  </div>
                  {item.description && <p style={{ color: "#666", fontSize: "11px", margin: "0 0 6px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: item.assignee === "大哥" ? "#7c3aed" : "#0369a1", backgroundColor: item.assignee === "大哥" ? "#f3e8ff" : "#e0f2fe", padding: "2px 6px", borderRadius: "4px" }}>
                      {item.assignee === "大哥" ? "👤" : "🤖"} {item.assignee}
                    </span>
                    {typeof item.images === "string" ? item.images.split("\n").filter(Boolean).length : (Array.isArray(item.images) ? item.images.length : 0) > 0 && <span style={{ fontSize: "10px" }}>🖼️ {typeof item.images === "string" ? item.images.split("\n").filter(Boolean).length : item.images.length}</span>}
                  </div>
                </div>
              ))}
              {contentByStage(stage).length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "12px" }}>暂无内容</div>}
            </div>
          </div>
        ))}
      </div>

      {/* 新建弹窗 */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "500px", maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ marginBottom: "16px" }}>➕ 新建内容</h3>
            <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="标题 *" style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="简介/大纲" rows={2} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={newItem.script} onChange={(e) => setNewItem({ ...newItem, script: e.target.value })} placeholder="完整脚本（可选）" rows={4} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={newItem.images} onChange={(e) => setNewItem({ ...newItem, images: e.target.value })} placeholder="图片链接（每行一个）" rows={2} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <select value={newItem.assignee} onChange={(e) => setNewItem({ ...newItem, assignee: e.target.value as Assignee })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="大哥">👤 大哥</option>
                <option value="BRO">🤖 BRO</option>
              </select>
              <select value={newItem.stage} onChange={(e) => setNewItem({ ...newItem, stage: e.target.value as ContentStage })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="idea">💡 灵感</option>
                <option value="scripting">📝 脚本</option>
                <option value="production">🎬 制作</option>
                <option value="review">👀 审核</option>
                <option value="published">🚀 已发布</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer" }}>取消</button>
              <button onClick={addItem} style={{ padding: "8px 20px", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingItem && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "500px", maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ marginBottom: "16px" }}>✏️ 编辑内容</h3>
            <input type="text" value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="标题 *" style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={editingItem.description || ""} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} placeholder="简介/大纲" rows={2} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={editingItem.script || ""} onChange={(e) => setEditingItem({ ...editingItem, script: e.target.value })} placeholder="完整脚本" rows={6} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            <textarea value={typeof editingItem.images === "string" ? editingItem.images : (Array.isArray(editingItem.images) ? editingItem.images.join("\n") : "")} onChange={(e) => setEditingItem({ ...editingItem, images: e.target.value })} placeholder="图片链接（每行一个）" rows={3} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "12px" }} />
            {editingItem.script && (
              <div style={{ marginBottom: "12px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "8px", maxHeight: "150px", overflow: "auto" }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>脚本预览：</div>
                <div style={{ fontSize: "13px", whiteSpace: "pre-wrap" }}>{editingItem.script}</div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <select value={editingItem.assignee} onChange={(e) => setEditingItem({ ...editingItem, assignee: e.target.value as Assignee })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="大哥">👤 大哥</option>
                <option value="BRO">🤖 BRO</option>
              </select>
              <select value={editingItem.stage} onChange={(e) => setEditingItem({ ...editingItem, stage: e.target.value as ContentStage })} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="idea">💡 灵感</option>
                <option value="scripting">📝 脚本</option>
                <option value="production">🎬 制作</option>
                <option value="review">👀 审核</option>
                <option value="published">🚀 已发布</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setEditingItem(null)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer" }}>取消</button>
              <button onClick={updateItem} style={{ padding: "8px 20px", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 主页面组件 ====================
export default function Home() {
  const [activeTab, setActiveTab] = useState<"tasks" | "content">("tasks");
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#333", marginBottom: "20px" }}>🎯 工作台</h1>
        
        {error && (
          <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* 标签导航 */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button
            onClick={() => setActiveTab("tasks")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              backgroundColor: activeTab === "tasks" ? "#2563eb" : "white",
              color: activeTab === "tasks" ? "white" : "#666",
              boxShadow: activeTab === "tasks" ? "none" : "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            📋 任务看板
          </button>
          <button
            onClick={() => setActiveTab("content")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              backgroundColor: activeTab === "content" ? "#7c3aed" : "white",
              color: activeTab === "content" ? "white" : "#666",
              boxShadow: activeTab === "content" ? "none" : "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            🎬 内容Pipeline
          </button>
        </div>

        {/* 内容区域 */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {activeTab === "tasks" ? <TaskBoard onError={setError} /> : <ContentPipeline onError={setError} />}
        </div>
      </div>
    </div>
  );
}
