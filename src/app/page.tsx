"use client";

import { useState, useEffect, useRef } from "react";

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type Assignee = "大哥" | "BRO";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee: Assignee;
  createdAt: number;
}

// 使用环境变量（需要在 Vercel 中配置）
const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID || "";
const GIST_TOKEN = process.env.GIST_TOKEN || "";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "📋 待办",
  in_progress: "🔄 进行中",
  review: "👀 审核",
  done: "✅ 完成",
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    assignee: "BRO" as Assignee,
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 从 Gist 加载任务
  const fetchTasks = async () => {
    if (!GIST_ID || !GIST_TOKEN) {
      const saved = localStorage.getItem("task-board-tasks");
      if (saved) setTasks(JSON.parse(saved));
      setLoading(false);
      setError("⚠️ 请在 Vercel 配置环境变量以启用云同步");
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: { Authorization: `token ${GIST_TOKEN}` },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const content = data.files["tasks.json"]?.content || "[]";
      setTasks(JSON.parse(content));
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      const saved = localStorage.getItem("task-board-tasks");
      if (saved) setTasks(JSON.parse(saved));
      setError("同步失败，使用本地数据");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // 保存任务
  const saveTasks = async (newTasks: Task[]) => {
    setTasks(newTasks);
    setLastUpdated(Date.now());
    localStorage.setItem("task-board-tasks", JSON.stringify(newTasks));

    if (!GIST_ID || !GIST_TOKEN) {
      setError("⚠️ 请在 Vercel 配置环境变量以启用云同步");
      return;
    }

    try {
      setSyncing(true);
      await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${GIST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: { "tasks.json": { content: JSON.stringify(newTasks, null, 2) } },
        }),
      });
      setError(null);
    } catch (err) {
      setError("保存失败，数据已保存到本地");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    pollingRef.current = setInterval(fetchTasks, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = { id: Date.now().toString(), ...newTask, createdAt: Date.now() };
    saveTasks([task, ...tasks]);
    setNewTask({ title: "", description: "", status: "todo", assignee: "BRO" });
    setShowAddModal(false);
  };

  const updateStatus = (taskId: string, status: TaskStatus) => {
    saveTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const updateAssignee = (taskId: string, assignee: Assignee) => {
    saveTasks(tasks.map(t => t.id === taskId ? { ...t, assignee } : t));
  };

  const deleteTask = (taskId: string) => {
    if (!confirm("确定删除这个任务吗？")) return;
    saveTasks(tasks.filter(t => t.id !== taskId));
  };

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const stats = {
    total: tasks.length,
    todo: tasksByStatus("todo").length,
    inProgress: tasksByStatus("in_progress").length,
    review: tasksByStatus("review").length,
    done: tasksByStatus("done").length,
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}><div style={{ fontSize: "24px" }}>⏳ 加载中...</div></div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#333", margin: 0 }}>📋 任务看板</h1>
            <p style={{ color: "#666", marginTop: "4px" }}>
              大哥和BRO的工作进度
              {lastUpdated && <span style={{ marginLeft: "12px", fontSize: "12px", color: "#999" }}>{syncing ? "🔄 同步中..." : `✅ 已同步 ${new Date(lastUpdated).toLocaleTimeString()}`}</span>}
            </p>
            {error && <p style={{ color: "#ef4444", marginTop: "4px", fontSize: "12px" }}>{error}</p>}
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: "#2563eb", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", fontSize: "16px", cursor: "pointer" }}>➕ 添加任务</button>
        </div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          <div style={{ backgroundColor: "white", padding: "16px 24px", borderRadius: "8px", textAlign: "center", flex: 1 }}><div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{stats.total}</div><div style={{ color: "#666", fontSize: "14px" }}>全部任务</div></div>
          <div style={{ backgroundColor: "#fef3c7", padding: "16px 24px", borderRadius: "8px", textAlign: "center", flex: 1 }}><div style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>{stats.todo}</div><div style={{ color: "#92400e", fontSize: "14px" }}>待办</div></div>
          <div style={{ backgroundColor: "#dbeafe", padding: "16px 24px", borderRadius: "8px", textAlign: "center", flex: 1 }}><div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e40af" }}>{stats.inProgress}</div><div style={{ color: "#1e40af", fontSize: "14px" }}>进行中</div></div>
          <div style={{ backgroundColor: "#fef9c3", padding: "16px 24px", borderRadius: "8px", textAlign: "center", flex: 1 }}><div style={{ fontSize: "24px", fontWeight: "bold", color: "#854d0e" }}>{stats.review}</div><div style={{ color: "#854d0e", fontSize: "14px" }}>审核</div></div>
          <div style={{ backgroundColor: "#d1fae5", padding: "16px 24px", borderRadius: "8px", textAlign: "center", flex: 1 }}><div style={{ fontSize: "24px", fontWeight: "bold", color: "#065f46" }}>{stats.done}</div><div style={{ color: "#065f46", fontSize: "14px" }}>已完成</div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {(["todo", "in_progress", "review", "done"] as TaskStatus[]).map((status) => (
            <div key={status} style={{ backgroundColor: status === "todo" ? "#f3f4f6" : status === "in_progress" ? "#eff6ff" : status === "review" ? "#fefce8" : "#f0fdf4", borderRadius: "12px", padding: "16px", minHeight: "400px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontWeight: "600", color: "#374151", margin: 0 }}>{STATUS_LABELS[status]}</h2>
                <span style={{ backgroundColor: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>{tasksByStatus(status).length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {tasksByStatus(status).map((task) => (
                  <div key={task.id} style={{ backgroundColor: "white", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h3 style={{ fontWeight: "500", color: "#111", margin: 0, fontSize: "15px" }}>{task.title}</h3>
                      <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}>×</button>
                    </div>
                    {task.description && <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>{task.description}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <select value={task.assignee} onChange={(e) => updateAssignee(task.id, e.target.value as Assignee)} style={{ fontSize: "13px", padding: "6px 10px", borderRadius: "6px", border: "1px solid", backgroundColor: task.assignee === "大哥" ? "#f3e8ff" : "#e0f2fe", borderColor: task.assignee === "大哥" ? "#d8b4fe" : "#7dd3fc", color: task.assignee === "大哥" ? "#7c3aed" : "#0369a1", cursor: "pointer" }}>
                        <option value="大哥">👤 大哥</option>
                        <option value="BRO">🤖 BRO</option>
                      </select>
                      <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)} style={{ fontSize: "13px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "white", cursor: "pointer" }}>
                        <option value="todo">📋 待办</option>
                        <option value="in_progress">🔄 进行中</option>
                        <option value="review">👀 审核</option>
                        <option value="done">✅ 完成</option>
                      </select>
                    </div>
                  </div>
                ))}
                {tasksByStatus(status).length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>暂无任务</div>}
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "480px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px" }}>➕ 添加新任务</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div><label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>任务标题</label><input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="输入任务标题" autoFocus style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>任务描述（可选）</label><textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="输入任务描述" rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px", resize: "vertical", boxSizing: "border-box" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>分配给</label><select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value as Assignee })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}><option value="大哥">👤 大哥</option><option value="BRO">🤖 BRO</option></select></div>
                  <div><label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>状态</label><select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}><option value="todo">📋 待办</option><option value="in_progress">🔄 进行中</option><option value="review">👀 审核</option><option value="done">✅ 完成</option></select></div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button onClick={() => setShowAddModal(false)} style={{ padding: "10px 20px", color: "#6b7280", background: "none", border: "none", fontSize: "15px", cursor: "pointer" }}>取消</button>
                <button onClick={addTask} style={{ backgroundColor: "#2563eb", color: "white", padding: "10px 24px", borderRadius: "8px", border: "none", fontSize: "15px", fontWeight: "500", cursor: "pointer" }}>添加任务</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
