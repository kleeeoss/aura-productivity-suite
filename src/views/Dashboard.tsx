import { useState, useEffect, useMemo } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { format } from 'date-fns';
import { fetchWeather, type WeatherData } from '../utils/weather';
import { calculateProductivityScore } from '../utils/productivityMath';
import { useSettingsStore, type DashboardWidgetId } from '../store/useSettingsStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { useFocusStore } from '../store/useFocusStore';
import { useJournalStore } from '../store/useJournalStore';
import { useActivityStore } from '../store/useActivityStore';
import { useAppStore } from '../store/useAppStore';
import { DashboardCustomizer } from '../components/DashboardCustomizer';
import Calendar from 'react-calendar';
import LiveClock from '../components/LiveClock';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileText, BookOpen, Activity, Calendar as CalendarIcon, Plus, Play, PenTool, Flame, Target, Sliders, CheckCircle2 } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';
import '../calendar.css';

interface QuoteData {
  content: string;
  author: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'task': return <CheckCircle size={16} color="var(--success)" />;
    case 'pomodoro': return <Clock size={16} color="var(--warning)" />;
    case 'note': return <FileText size={16} color="var(--accent-primary)" />;
    case 'journal': return <BookOpen size={16} color="var(--accent-secondary)" />;
    case 'habit': return <Activity size={16} color="var(--danger)" />;
    case 'event': return <CalendarIcon size={16} color="var(--text-primary)" />;
    default: return <Activity size={16} />;
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const Dashboard = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  const { tempUnit, dashboardWidgets } = useSettingsStore();
  const { tasks } = useTaskStore();
  const { habits } = useHabitStore();
  const { pomodorosCompletedToday, dailyFocusHours } = useFocusStore();
  const { entries } = useJournalStore();
  const { activities } = useActivityStore();
  const { setActiveTab, userName, avatar } = useAppStore();

  const isWidgetVisible = useMemo(() => {
    const map = new Map<string, boolean>();
    dashboardWidgets.forEach((w) => map.set(w.id, w.visible));
    return (id: DashboardWidgetId) => map.get(id) ?? true;
  }, [dashboardWidgets]);

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const pendingTasksCount = pendingTasks.length;
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');

  // Count tasks completed today either via completedAt or logged task activity
  const completedTaskActivitiesToday = activities.filter(
    a => a.type === 'task' && a.timestamp.startsWith(todayDateStr) && a.title.toLowerCase().includes('completed')
  ).length;
  const tasksWithTodayCompletion = tasks.filter(
    t => t.status === 'done' && (t as { completedAt?: string }).completedAt?.startsWith(todayDateStr)
  ).length;
  const todayCompletedTasksCount = Math.max(tasksWithTodayCompletion, completedTaskActivitiesToday);

  const completedHabitsCount = habits.filter(h => h.completedDates.includes(todayDateStr)).length;
  const totalHabits = habits.length;
  
  const todayFocusMinutes = dailyFocusHours[todayDateStr] || 0;
  const hasJournalToday = !!entries[todayDateStr];
  
  // Standardized productivity score (0-100) based strictly on today's progress
  const prodScore = calculateProductivityScore({
    todayCompletedTasksCount,
    todayPomodorosCount: pomodorosCompletedToday,
    todayCompletedHabitsCount: completedHabitsCount,
    hasJournalToday,
  });

  const getProdStatus = (score: number) => {
    if (score >= 80) return { text: 'Excellent Day', color: 'var(--success)' };
    if (score >= 50) return { text: 'Good Progress', color: 'var(--warning)' };
    return { text: 'Needs Attention', color: 'var(--danger)' };
  };
  const prodStatus = getProdStatus(prodScore);

  const yesterdayDateStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const activitiesToday = activities.filter(a => a.timestamp.startsWith(todayDateStr)).length;
  const activitiesYesterday = activities.filter(a => a.timestamp.startsWith(yesterdayDateStr)).length;

  let activityComparison = '';
  if (activitiesToday > activitiesYesterday) {
    activityComparison = `↑ +${activitiesToday - activitiesYesterday} from yesterday`;
  } else if (activitiesToday < activitiesYesterday) {
    activityComparison = `↓ -${activitiesYesterday - activitiesToday} from yesterday`;
  } else {
    activityComparison = `Same as yesterday`;
  }

  useEffect(() => {
    setWeatherError(null);
    fetchWeather(tempUnit)
      .then(data => setWeather(data))
      .catch(err => setWeatherError(err.toString()));
  }, [tempUnit]);

  const builtInQuotes = [
    { content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { content: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { content: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { content: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }
  ];

  useEffect(() => {
    const randomQuote = builtInQuotes[Math.floor(Math.random() * builtInQuotes.length)];
    setQuote(randomQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', paddingBottom: '40px', overflowY: 'auto' }}>
      
      {/* Header Profile, Live Clock & Customize Button */}
      {isWidgetVisible('clock') && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '32px', 
              background: avatar ? `url(${avatar}) center/cover` : 'var(--accent-gradient)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
              {!avatar && userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', margin: 0, lineHeight: 1 }}>{getGreeting()}, {userName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
                <LiveClock />
              </div>
            </div>
          </div>

          <button
            className="glass-button"
            onClick={() => setIsCustomizerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Sliders size={16} /> Customize Dashboard
          </button>
        </header>
      )}

      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px 0' }}>
        <button className="glass-button primary" onClick={() => setActiveTab('tasks')}>
          <Plus size={16} /> New Task
        </button>
        <button className="glass-button" onClick={() => setActiveTab('focus')}>
          <Play size={16} /> Start Focus
        </button>
        <button className="glass-button" onClick={() => setActiveTab('notes')}>
          <PenTool size={16} /> New Note
        </button>
        <button className="glass-button" onClick={() => setActiveTab('journal')}>
          <BookOpen size={16} /> Log Journal
        </button>
      </div>

      {/* Quote Banner */}
      {isWidgetVisible('quote') && quote && (
        <GlassPanel style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>
            "{quote.content}" <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>— {quote.author}</span>
          </p>
        </GlassPanel>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* Productivity Score */}
        {isWidgetVisible('score') && (
          <GlassPanel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Productivity Score</h3>
              <Target size={20} color={prodStatus.color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', color: prodStatus.color }}>{prodScore}</span>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>/ 100</span>
                <span style={{ color: prodStatus.color, fontSize: '0.85rem', fontWeight: '600' }}>{prodStatus.text}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {activityComparison}
            </div>
            <div style={{ marginTop: '16px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${prodScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: prodStatus.color }}
              />
            </div>
          </GlassPanel>
        )}

        {/* Focus Progress */}
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Focus Progress</h3>
            <Flame size={20} color="var(--warning)" />
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {pomodorosCompletedToday} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>sessions</span>
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              {(todayFocusMinutes / 60).toFixed(1)} hours today
            </div>
          </div>
        </GlassPanel>

        {/* Daily Overview */}
        {isWidgetVisible('habits') && (
          <GlassPanel>
            <h3>Daily Overview</h3>
            <ul style={{ marginTop: '16px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tasks Pending</span>
                <span style={{ fontWeight: 'bold' }}>{pendingTasksCount}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Habits Completed</span>
                <span style={{ fontWeight: 'bold' }}>{completedHabitsCount} / {totalHabits}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Journal Status</span>
                <span style={{ fontWeight: 'bold', color: hasJournalToday ? 'var(--success)' : 'var(--text-secondary)' }}>
                  {hasJournalToday ? 'Logged' : 'Pending'}
                </span>
              </li>
            </ul>
          </GlassPanel>
        )}

      </div>

      {/* Secondary Row: Tasks + Activity / Weather & Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', flex: 1, minHeight: '350px' }}>
        
        {/* Prioritized Tasks Card */}
        {isWidgetVisible('tasks') && (
          <GlassPanel style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Target Tasks</h3>
              <button 
                onClick={() => setActiveTab('tasks')} 
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                View All
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingTasks.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  All caught up! No pending tasks.
                </div>
              ) : (
                pendingTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--glass-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={16} color="var(--text-secondary)" />
                      <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{t.title}</span>
                    </div>
                    {t.timeSpentMinutes && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                        {t.timeSpentMinutes}m spent
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        )}

        {/* Recent Activity Timeline */}
        {isWidgetVisible('activity') && (
          <GlassPanel style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '16px' }}>Recent Activity</h3>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              {activities.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No recent activity. Start your day!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activities.slice(0, 8).map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                    >
                      <div style={{ marginTop: '4px', background: 'var(--glass-bg)', padding: '6px', borderRadius: '50%', border: '1px solid var(--glass-border)' }}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p style={{ fontWeight: '500', margin: 0 }}>{activity.title}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          {format(new Date(activity.timestamp), 'h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </GlassPanel>
        )}

        {/* Weather & Calendar */}
        {isWidgetVisible('weather') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ width: '100%', marginBottom: '16px' }}>Calendar</h3>
              <div className="custom-calendar-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Calendar 
                  onChange={(val) => setCalendarDate(val as Date)} 
                  value={calendarDate} 
                  className="glass-calendar"
                />
              </div>
            </GlassPanel>

            <GlassPanel>
              <h3>Weather</h3>
              {weather ? (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>{weather.city}</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' }}>
                        {weather.temp}°{tempUnit === 'celsius' ? 'C' : 'F'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span>{weather.condition}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Feels like {weather.feelsLike}°</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Humidity</span>
                      <span style={{ fontWeight: '500' }}>{weather.humidity}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wind</span>
                      <span style={{ fontWeight: '500' }}>{weather.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              ) : weatherError ? (
                <div style={{ color: 'var(--danger)', marginTop: '10px', fontSize: '0.9rem' }}>
                  <p>Failed to fetch weather.</p>
                </div>
              ) : (
                <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
              )}
            </GlassPanel>
          </div>
        )}

      </div>

      {/* Dashboard Customizer Drawer */}
      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
