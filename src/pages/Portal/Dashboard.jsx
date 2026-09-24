import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, ListChecks, Video, TrendingUp, LogOut, CheckCircle2, ExternalLink, PlayCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const PROGRAM_DAYS = 90
const TABS = [
  { id: 'progress', label: 'Progress', Icon: TrendingUp },
  { id: 'attendance', label: 'Attendance', Icon: CalendarCheck },
  { id: 'tasks', label: 'Tasks', Icon: ListChecks },
  { id: 'meetings', label: 'Meetings', Icon: Video },
  { id: 'lectures', label: 'Lectures', Icon: PlayCircle },
]
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', submitted: 'Submitted', done: 'Done' }

const istDate = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD
const fmtDay = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtWhen = (iso) => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

/** Mon-Fri days from `from` to `to` inclusive (YYYY-MM-DD strings). */
function workingDays(from, to) {
  let n = 0
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) n++
  }
  return n
}

function Bar({ value, label }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="pbar" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${v}%` }} />
    </div>
  )
}

export default function Dashboard({ user }) {
  const [tab, setTab] = useState('progress')
  const [state, setState] = useState({ loading: true, error: '' })
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [tasks, setTasks] = useState([])
  const [taskProgress, setTaskProgress] = useState({})
  const [meetings, setMeetings] = useState([])
  const [notes, setNotes] = useState([])
  const [lectures, setLectures] = useState([])

  const load = useCallback(async () => {
    const [p, a, t, tp, m, n, l] = await Promise.all([
      supabase.from('my_profile').select('*').maybeSingle(),
      supabase.from('attendance').select('att_date,checked_in,note').order('att_date', { ascending: false }),
      supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('task_progress').select('*'),
      supabase.from('meetings').select('*').order('starts_at', { ascending: true }),
      supabase.from('progress_notes').select('*').order('created_at', { ascending: false }),
      supabase.from('lectures').select('*').order('week', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
    ])
    const failed = [p, a, t, tp, m, n, l].find((r) => r.error)
    if (failed) return setState({ loading: false, error: 'Could not load your portal data. Please refresh.' })
    setProfile(p.data)
    setAttendance(a.data)
    setTasks(t.data)
    setTaskProgress(Object.fromEntries(tp.data.map((r) => [r.task_id, r])))
    setMeetings(m.data)
    setNotes(n.data)
    setLectures(l.data)
    setState({ loading: false, error: '' })
  }, [])

  useEffect(() => { load() }, [load])

  const today = istDate()
  const startDate = profile?.paid_at ? istDate(new Date(profile.paid_at)) : today
  const stats = useMemo(() => {
    const dayNo = Math.min(PROGRAM_DAYS, Math.max(1, Math.round((new Date(`${today}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / 864e5) + 1))
    const expected = Math.max(1, workingDays(startDate, today))
    const attended = attendance.length
    const statusOf = (t) => taskProgress[t.id]?.status ?? 'todo'
    const done = tasks.filter((t) => statusOf(t) === 'done').length
    const submitted = tasks.filter((t) => statusOf(t) === 'submitted').length
    const attPct = Math.min(100, (attended / expected) * 100)
    const taskPct = tasks.length ? ((done + submitted * 0.5) / tasks.length) * 100 : 0
    const overall = tasks.length ? (attPct + taskPct) / 2 : attPct
    return { dayNo, expected, attended, done, submitted, attPct, taskPct, overall, timePct: (dayNo / PROGRAM_DAYS) * 100 }
  }, [attendance, tasks, taskProgress, today, startDate])

  const markedToday = attendance.some((r) => r.att_date === today)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')

  const markAttendance = async () => {
    setBusy('att'); setActionError('')
    const { error } = await supabase.from('attendance').insert({ note: null })
    if (error && error.code !== '23505') setActionError('Could not mark attendance. Please try again.')
    await load(); setBusy('')
  }

  const setTaskStatus = async (task, status, submission) => {
    setBusy(task.id); setActionError('')
    const existing = taskProgress[task.id]
    const now = new Date().toISOString()
    const { error } = existing
      ? await supabase.from('task_progress').update({ status, submission, updated_at: now }).eq('task_id', task.id)
      : await supabase.from('task_progress').insert({ task_id: task.id, status, submission })
    if (error) setActionError('Could not update the task. Please try again.')
    await load(); setBusy('')
  }

  if (state.loading) return <section className="section"><div className="wrap"><p className="muted">Loading your portal…</p></div></section>

  const upcoming = meetings.filter((m) => new Date(m.starts_at).getTime() + m.duration_min * 60000 >= Date.now())
  const past = meetings.filter((m) => !upcoming.includes(m)).reverse()
  const name = profile?.first_name ?? user.user_metadata?.first_name ?? 'Intern'

  return (
    <section className="section portal" style={{ borderBottom: 'none' }}>
      <div className="wrap">
        <div className="portal-top">
          <div>
            <div className="eyebrow">Intern Portal</div>
            <h1>Welcome, {name}</h1>
            <p className="muted">Day {stats.dayNo} of {PROGRAM_DAYS} · started {fmtDay(startDate)}</p>
          </div>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}><LogOut size={16} aria-hidden /> Sign out</button>
        </div>

        {state.error && <div className="form-error-summary" role="alert"><h3>{state.error}</h3></div>}
        {actionError && <div className="form-error-summary" role="alert"><h3>{actionError}</h3></div>}

        <div className="portal-tabs" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : undefined} onClick={() => setTab(id)}>
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>

        {tab === 'progress' && (
          <div className="portal-grid">
            <div className="enroll-panel">
              <h2>Overall progress</h2>
              <p className="pbig">{Math.round(stats.overall)}%</p>
              <Bar value={stats.overall} label="Overall progress" />
              <p className="muted small">Average of your attendance and task completion.</p>
              <h3 className="sub">Program timeline</h3>
              <Bar value={stats.timePct} label="Program timeline" />
              <p className="muted small">{stats.dayNo} of {PROGRAM_DAYS} days</p>
            </div>
            <div className="enroll-panel">
              <h2>Breakdown</h2>
              <div className="stat"><span>Attendance</span><b>{stats.attended} / {stats.expected} days</b></div>
              <Bar value={stats.attPct} label="Attendance" />
              <div className="stat"><span>Tasks completed</span><b>{stats.done} / {tasks.length}</b></div>
              <Bar value={stats.taskPct} label="Tasks" />
              <div className="stat"><span>Awaiting review</span><b>{stats.submitted}</b></div>
            </div>
            <div className="enroll-panel wide">
              <h2>Manager feedback</h2>
              {notes.length === 0 && <p className="muted">No feedback yet. Your managers will post weekly notes here.</p>}
              {notes.map((n) => (
                <div className="note" key={n.id}>
                  <div className="note-head">
                    <b>{n.week ? `Week ${n.week}` : fmtDay(n.created_at.slice(0, 10))}</b>
                    {n.rating && <span aria-label={`Rating ${n.rating} of 5`}>{'★'.repeat(n.rating)}{'☆'.repeat(5 - n.rating)}</span>}
                  </div>
                  <p>{n.note}</p>
                  {n.author && <small className="muted">— {n.author}</small>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'attendance' && (
          <div className="portal-grid">
            <div className="enroll-panel">
              <h2>Today</h2>
              <p className="muted">{fmtDay(today)}</p>
              {markedToday ? (
                <p className="ok"><CheckCircle2 size={18} aria-hidden /> You're marked present today.</p>
              ) : (
                <button className="btn btn-accent" disabled={busy === 'att'} onClick={markAttendance}>{busy === 'att' ? 'Marking…' : 'Mark me present'}</button>
              )}
              <p className="muted small">{stats.attended} of {stats.expected} working days attended ({Math.round(stats.attPct)}%)</p>
              <Bar value={stats.attPct} label="Attendance" />
            </div>
            <div className="enroll-panel">
              <h2>History</h2>
              {attendance.length === 0 && <p className="muted">No attendance recorded yet.</p>}
              <ul className="plist">
                {attendance.map((r) => (
                  <li key={r.att_date}><span>{fmtDay(r.att_date)}</span><span className="muted">Present · {new Date(r.checked_in).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</span></li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="enroll-panel">
            <h2>Your tasks</h2>
            {tasks.length === 0 && <p className="muted">No tasks assigned yet. They will appear here once your managers add them.</p>}
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} progress={taskProgress[t.id]} busy={busy === t.id} today={today} onChange={setTaskStatus} />
            ))}
          </div>
        )}

        {tab === 'meetings' && (
          <div className="portal-grid">
            <div className="enroll-panel">
              <h2>Upcoming</h2>
              {upcoming.length === 0 && <p className="muted">No meetings scheduled.</p>}
              {upcoming.map((m) => <Meeting key={m.id} m={m} />)}
            </div>
            <div className="enroll-panel">
              <h2>Past</h2>
              {past.length === 0 && <p className="muted">Nothing yet.</p>}
              {past.map((m) => <Meeting key={m.id} m={m} past />)}
            </div>
          </div>
        )}

        {tab === 'lectures' && <Lectures lectures={lectures} />}
      </div>
    </section>
  )
}

function Meeting({ m, past }) {
  return (
    <div className={`note${past ? ' past' : ''}`}>
      <div className="note-head"><b>{m.title}</b><span className="muted">{m.duration_min} min</span></div>
      <p>{fmtWhen(m.starts_at)} IST{m.host ? ` · ${m.host}` : ''}</p>
      {m.description && <p className="muted">{m.description}</p>}
      {!past && m.link && /^https?:\/\//i.test(m.link) && (
        <a className="btn btn-ghost" href={m.link} target="_blank" rel="noopener noreferrer">Join meeting <ExternalLink size={14} aria-hidden /></a>
      )}
    </div>
  )
}

function Lectures({ lectures }) {
  const [currentId, setCurrentId] = useState(null)
  if (lectures.length === 0) {
    return <div className="enroll-panel"><h2>Lectures</h2><p className="muted">No lectures yet. Recorded sessions will appear here once your managers add them.</p></div>
  }
  const current = lectures.find((l) => l.id === currentId) ?? lectures[lectures.length - 1]
  const groups = []
  for (const l of lectures) {
    const label = l.week ? `Week ${l.week}` : 'Other'
    const g = groups.find((x) => x.label === label)
    g ? g.items.push(l) : groups.push({ label, items: [l] })
  }
  return (
    <div className="portal-grid">
      <div className="enroll-panel wide">
        <div className="lecture-player">
          {/* youtube-nocookie avoids YouTube tracking cookies until the intern presses play. */}
          <iframe key={current.id} src={`https://www.youtube-nocookie.com/embed/${current.youtube_id}?rel=0&modestbranding=1`}
            title={current.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
        </div>
        <h2 style={{ marginTop: 16 }}>{current.title}</h2>
        {current.week && <p className="muted small">Week {current.week}</p>}
        {current.description && <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{current.description}</p>}
      </div>
      <div className="enroll-panel wide">
        <h2>All lectures</h2>
        {groups.map((g) => (
          <div key={g.label}>
            <h3 className="sub">{g.label}</h3>
            <ul className="plist lecture-list">
              {g.items.map((l) => (
                <li key={l.id}>
                  <button className={l.id === current.id ? 'on' : undefined} aria-current={l.id === current.id || undefined} onClick={() => { setCurrentId(l.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    <PlayCircle size={16} aria-hidden /> {l.title}
                  </button>
                  <span className="muted">{fmtDay(l.created_at.slice(0, 10))}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, progress, busy, today, onChange }) {
  const status = progress?.status ?? 'todo'
  const [text, setText] = useState(progress?.submission ?? '')
  const overdue = task.due_date && task.due_date < today && status !== 'done'
  const locked = status === 'done'
  return (
    <div className="task">
      <div className="note-head">
        <b>{task.title}</b>
        <span className={`chip chip-${status}`}>{STATUS_LABEL[status]}</span>
      </div>
      {task.description && <p className="muted">{task.description}</p>}
      {task.due_date && <small className={overdue ? 'late' : 'muted'}>Due {fmtDay(task.due_date)}{overdue ? ' · overdue' : ''}</small>}
      {!locked && (
        <>
          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor={`sub-${task.id}`}>Submission link or notes</label>
            <textarea id={`sub-${task.id}`} rows={2} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            {status === 'todo' && <button className="btn btn-ghost" disabled={busy} onClick={() => onChange(task, 'in_progress', text || null)}>Start</button>}
            {status !== 'todo' && <button className="btn btn-ghost" disabled={busy} onClick={() => onChange(task, 'in_progress', text || null)}>Save draft</button>}
            <button className="btn btn-accent" disabled={busy || !text.trim()} onClick={() => onChange(task, 'submitted', text.trim())}>{status === 'submitted' ? 'Resubmit' : 'Submit for review'}</button>
          </div>
        </>
      )}
    </div>
  )
}
