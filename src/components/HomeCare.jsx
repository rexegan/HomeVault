import { Icon } from '../lib/icons.jsx'
import { careTasks, careCounts, intervalLabel } from '../lib/maintenance.js'

// Home Care: the maintenance calendar the house writes for itself. Tasks come
// from lib/maintenance.js filtered by what this home has; "Mark done" stamps
// today and the next due date rolls forward automatically.
export default function HomeCare({ profile, state, lastDone, today, onMarkDone, onUndo }) {
  const tasks = careTasks(profile, state, lastDone, today)
  const { due, soon } = careCounts(tasks)
  const groups = [
    { key: 'due', label: 'Do now', tasks: tasks.filter((t) => t.status === 'due') },
    { key: 'soon', label: 'Coming up (30 days)', tasks: tasks.filter((t) => t.status === 'soon') },
    { key: 'ok', label: 'Up to date', tasks: tasks.filter((t) => t.status === 'ok') },
  ]

  return (
    <div className="care">
      <div className="intake-lede">
        <h2>Home Care</h2>
        <p>Your house's own maintenance schedule — built from what it has, from the
          Home Profile and floor plan. Mark a task done and it comes back when it's
          due again. {due > 0 ? `${due} ${due === 1 ? 'task needs' : 'tasks need'} attention.` :
          soon > 0 ? 'Nothing overdue — a few things are coming up.' : 'All caught up. 🎉'}</p>
      </div>

      {groups.map((g) => g.tasks.length > 0 && (
        <section className="care-group" key={g.key}>
          <h3 className={'care-group-label ' + g.key}>{g.label}</h3>
          <div className="care-list">
            {g.tasks.map((t) => (
              <TaskCard key={t.id} task={t} today={today} onMarkDone={onMarkDone} onUndo={onUndo} />
            ))}
          </div>
        </section>
      ))}

      <div className="intake-foot">
        <Icon.clock size={18} />
        <span>Intervals are sensible defaults for a typical home. Tasks appear or disappear as you
          fill in the Home Profile — add a generator, well, or fireplace there and its care shows up here.</span>
      </div>
    </div>
  )
}

function TaskCard({ task, onMarkDone, onUndo }) {
  const badge = task.status === 'due'
    ? (task.neverDone ? 'No record yet' : `${Math.abs(task.days)}d overdue`)
    : task.status === 'soon' ? `Due in ${task.days}d` : `Due in ${task.days}d`

  return (
    <div className={'care-card ' + task.status}>
      <div className="care-main">
        <div className="care-title-row">
          <span className="care-title">{task.title}</span>
          <span className={'tag ' + (task.status === 'due' ? 'danger' : task.status === 'soon' ? 'warn' : 'ok')}>{badge}</span>
        </div>
        <div className="care-why">{task.why}</div>
        <div className="care-meta">
          {intervalLabel(task.months)}
          {task.room ? ' · ' + task.room : ''}
          {task.lastDone ? ' · last done ' + fmt(task.lastDone) : ''}
        </div>
      </div>
      <div className="care-actions">
        <button className="btn small" onClick={() => onMarkDone(task.id)}>Mark done</button>
        {task.lastDone && (
          <button className="care-undo" onClick={() => onUndo(task.id)}>clear</button>
        )}
      </div>
    </div>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
