import { useState, useMemo } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useFocusStore } from '../store/useFocusStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { getTrendData, getHeatmapData, getCategoryDistribution } from '../utils/statisticsAggregator';

const getHeatmapColor = (count: number) => {
  if (count === 0) return 'rgba(255, 255, 255, 0.05)';
  if (count < 3) return 'rgba(99, 102, 241, 0.35)';
  if (count < 6) return 'rgba(99, 102, 241, 0.65)';
  return 'rgba(99, 102, 241, 1)';
};

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Statistics = () => {
  const { pomodorosCompletedToday, sessionHistory, dailyFocusHours, totalFocusTime } = useFocusStore();
  const { tasks } = useTaskStore();
  const { habits } = useHabitStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  
  const activeChartData = useMemo(() => {
    return getTrendData(sessionHistory, tasks, timeRange);
  }, [sessionHistory, tasks, timeRange]);

  const heatmapData = useMemo(() => {
    const habitDates = habits.flatMap(h => h.completedDates);
    const taskDates = tasks
      .filter(t => t.status === 'done' && t.completedAt)
      .map(t => t.completedAt as string);

    return getHeatmapData(dailyFocusHours, habitDates, taskDates);
  }, [dailyFocusHours, habits, tasks]);

  const categoryData = useMemo(() => {
    return getCategoryDistribution(sessionHistory);
  }, [sessionHistory]);

  const pieData = useMemo(() => [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Done', value: completedTasks, color: '#10b981' },
  ].filter(d => d.value > 0), [tasks, completedTasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Statistics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live analytics derived from your actual focus sessions, tasks, and habits.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--glass-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: timeRange === range ? 'var(--glass-hover)' : 'transparent',
                color: timeRange === range ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: timeRange === range ? 'bold' : 'normal',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <GlassPanel style={{ textAlign: 'center' }}>
          <h3>Pomodoros Today</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '16px' }}>
            {pomodorosCompletedToday}
          </div>
        </GlassPanel>
        
        <GlassPanel style={{ textAlign: 'center' }}>
          <h3>Tasks Completed</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '16px' }}>
            {completedTasks}
          </div>
        </GlassPanel>
        
        <GlassPanel style={{ textAlign: 'center' }}>
          <h3>Total Focus Logged</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--warning)', marginTop: '16px' }}>
            {totalFocusTime}m
          </div>
        </GlassPanel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <GlassPanel style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px' }}>{timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Quarterly'} Activity Trends</h3>
          <div style={{ minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                />
                <Legend />
                <defs>
                  <linearGradient id="colorPomodoros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pomodoros" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorPomodoros)" strokeWidth={3} />
                <Area type="monotone" dataKey="tasks" stroke="var(--success)" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px' }}>Focus Time (Minutes)</h3>
          <div style={{ minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                />
                <Bar dataKey="focusTime" fill="var(--warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <GlassPanel style={{ flex: 1, minWidth: '350px' }}>
          <h3 style={{ marginBottom: '24px' }}>Task Status Distribution</h3>
          {pieData.length > 0 ? (
            <div style={{ minHeight: '250px', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-secondary)' }}>
              No tasks to display.
            </div>
          )}
        </GlassPanel>

        <GlassPanel style={{ flex: 2, minWidth: '350px' }}>
          <h3 style={{ marginBottom: '24px' }}>Deep Work Heatmap (90 Days)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: '4px' }}>
            {heatmapData.map((day, idx) => (
              <div 
                key={idx} 
                title={`${day.date}: ${day.count} activities (${day.focusMinutes}m focus)`}
                style={{
                  aspectRatio: '1',
                  background: getHeatmapColor(day.count),
                  borderRadius: '3px',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Less</span>
            <div style={{ width: '12px', height: '12px', background: getHeatmapColor(0), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getHeatmapColor(2), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getHeatmapColor(5), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getHeatmapColor(8), borderRadius: '2px' }} />
            <span>More</span>
          </div>
        </GlassPanel>
      </div>

      {categoryData.length > 0 && categoryData.some(c => c.value > 0) && (
        <GlassPanel>
          <h3 style={{ marginBottom: '16px' }}>Focus Category Distribution</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {categoryData.map((cat, idx) => (
              <div
                key={cat.name}
                style={{
                  padding: '12px 18px',
                  background: 'var(--glass-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {cat.value} sessions · {cat.minutes}m
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};

export default Statistics;
