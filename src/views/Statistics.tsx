import { useState, useMemo } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useFocusStore } from '../store/useFocusStore';
import { useTaskStore } from '../store/useTaskStore';

// Mock data for trends
const mockWeeklyData = [
  { name: 'Mon', pomodoros: 4, tasks: 5, focusTime: 100 },
  { name: 'Tue', pomodoros: 6, tasks: 7, focusTime: 150 },
  { name: 'Wed', pomodoros: 3, tasks: 2, focusTime: 75 },
  { name: 'Thu', pomodoros: 8, tasks: 8, focusTime: 200 },
  { name: 'Fri', pomodoros: 5, tasks: 4, focusTime: 125 },
  { name: 'Sat', pomodoros: 2, tasks: 1, focusTime: 50 },
  { name: 'Sun', pomodoros: 7, tasks: 6, focusTime: 175 },
];

// Generate mock heatmap data for the last 90 days
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Randomly assign between 0 and 10 pomodoros
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 8)
    });
  }
  return data;
};
const heatmapData = generateHeatmapData();

const getHeatmapColor = (count: number) => {
  if (count === 0) return 'rgba(255, 255, 255, 0.05)';
  if (count < 3) return 'rgba(99, 102, 241, 0.4)';
  if (count < 6) return 'rgba(99, 102, 241, 0.7)';
  return 'rgba(99, 102, 241, 1)';
};

const Statistics = () => {
  const { pomodorosCompletedToday } = useFocusStore();
  const { tasks } = useTaskStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  
  const pieData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
  ].filter(d => d.value > 0);

  // In a real app, this data would be filtered based on `timeRange`
  const activeChartData = useMemo(() => {
    if (timeRange === 'week') return mockWeeklyData;
    // Return mock data for month/year for demonstration purposes
    return mockWeeklyData.map(d => ({ ...d, pomodoros: d.pomodoros * 2, tasks: d.tasks * 2, focusTime: d.focusTime * 2 }));
  }, [timeRange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Statistics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Analyze your deep work patterns and productivity.</p>
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
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '16px' }}>{pomodorosCompletedToday}</div>
        </GlassPanel>
        
        <GlassPanel style={{ textAlign: 'center' }}>
          <h3>Tasks Completed</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '16px' }}>{completedTasks}</div>
        </GlassPanel>
        
        <GlassPanel style={{ textAlign: 'center' }}>
          <h3>Total Focus Time</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--warning)', marginTop: '16px' }}>{pomodorosCompletedToday * 25}m</div>
        </GlassPanel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <GlassPanel style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px' }}>{timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Yearly'} Productivity Trend</h3>
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
                title={`${day.date}: ${day.count} Pomodoros`}
                style={{
                  aspectRatio: '1',
                  background: getHeatmapColor(day.count),
                  borderRadius: '3px',
                  border: '1px solid var(--glass-border)'
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
    </div>
  );
};

export default Statistics;
