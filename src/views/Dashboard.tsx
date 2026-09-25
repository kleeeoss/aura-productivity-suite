import React, { useState, useEffect, useMemo } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { format } from 'date-fns';
import { fetchWeather, type WeatherData } from '../utils/weather';
import { calculateProductivityScore } from '../utils/productivityMath';
import { toLocalDateString, getYesterdayLocalDateString } from '../utils/date';
import { useSettingsStore, type DashboardWidgetId, type DashboardWidgetConfig } from '../store/useSettingsStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { useFocusStore } from '../store/useFocusStore';
import { useJournalStore } from '../store/useJournalStore';
import { useActivityStore } from '../store/useActivityStore';
import { useAppStore } from '../store/useAppStore';
import { DashboardCustomizer } from '../components/DashboardCustomizer';
import Calendar from 'react-calendar';
import LiveClock from '../components/LiveClock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  FileText,
  BookOpen,
  Activity,
  Calendar as CalendarIcon,
  Plus,
  Play,
  PenTool,
  Flame,
  Target,
  Sliders,
  CheckCircle2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  EyeOff,
  RotateCcw,
  Check,
  Move,
  Sparkles,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const getWidgetGridSpan = (id: DashboardWidgetId): React.CSSProperties => {
  switch (id) {
    case 'clock':
      return { gridColumn: '1 / -1' };
    case 'quote':
      return { gridColumn: '1 / -1' };
    default:
      return {};
  }
};

interface SortableWidgetProps {
  widget: DashboardWidgetConfig;
  index: number;
  totalWidgets: number;
  isEditMode: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
  widget,
  index,
  totalWidgets,
  isEditMode,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !isEditMode,
  });

  const spanStyle = getWidgetGridSpan(widget.id);

  const style: React.CSSProperties = {
    ...spanStyle,
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderRadius: '16px',
        border: isEditMode ? '2px dashed var(--accent-primary)' : '2px solid transparent',
        padding: isEditMode ? '10px' : 0,
        background: isEditMode ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
        transition: 'border 0.2s ease, background 0.2s ease',
      }}
    >
      {isEditMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: '10px',
            background: 'var(--glass-bg)',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            {...attributes}
            {...listeners}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
            title="Drag to rearrange"
          >
            <GripVertical size={16} color="var(--accent-primary)" />
            <span>
              {index + 1}. {widget.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="glass-button"
              style={{ padding: '4px 6px', opacity: index === 0 ? 0.3 : 1 }}
              title="Move Up"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalWidgets - 1}
              className="glass-button"
              style={{ padding: '4px 6px', opacity: index === totalWidgets - 1 ? 0.3 : 1 }}
              title="Move Down"
            >
              <ArrowDown size={13} />
            </button>
            <button
              onClick={onToggleVisibility}
              className="glass-button"
              style={{ padding: '4px 6px', color: 'var(--danger)' }}
              title="Hide widget from dashboard"
            >
              <EyeOff size={13} />
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState<DashboardWidgetId | null>(null);

  const {
    tempUnit,
    dashboardWidgets,
    reorderWidgets,
    toggleWidgetVisibility,
    resetDashboardWidgets,
  } = useSettingsStore();

  const { tasks } = useTaskStore();
  const { habits } = useHabitStore();
  const { pomodorosCompletedToday, dailyFocusHours } = useFocusStore();
  const { entries } = useJournalStore();
  const { activities } = useActivityStore();
  const { setActiveTab, userName, avatar } = useAppStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedWidgets = useMemo(() => {
    return [...dashboardWidgets].sort((a, b) => a.order - b.order);
  }, [dashboardWidgets]);

  const visibleWidgets = useMemo(() => {
    return sortedWidgets.filter((w) => w.visible);
  }, [sortedWidgets]);

  const hiddenWidgets = useMemo(() => {
    return sortedWidgets.filter((w) => !w.visible);
  }, [sortedWidgets]);

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const pendingTasksCount = pendingTasks.length;
  const todayDateStr = toLocalDateString();

  const completedTaskActivitiesToday = activities.filter(
    (a) =>
      a.type === 'task' &&
      toLocalDateString(a.timestamp) === todayDateStr &&
      a.title.toLowerCase().includes('completed')
  ).length;

  const tasksWithTodayCompletion = tasks.filter(
    (t) =>
      t.status === 'done' &&
      (t as { completedAt?: string }).completedAt &&
      toLocalDateString((t as { completedAt: string }).completedAt) === todayDateStr
  ).length;

  const todayCompletedTasksCount = Math.max(tasksWithTodayCompletion, completedTaskActivitiesToday);
  const completedHabitsCount = habits.filter((h) => h.completedDates.includes(todayDateStr)).length;
  const totalHabits = habits.length;

  const todayFocusMinutes = dailyFocusHours[todayDateStr] || 0;
  const hasJournalToday = !!entries[todayDateStr];

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

  const yesterdayDateStr = getYesterdayLocalDateString();
  const activitiesToday = activities.filter((a) => toLocalDateString(a.timestamp) === todayDateStr).length;
  const activitiesYesterday = activities.filter((a) => toLocalDateString(a.timestamp) === yesterdayDateStr).length;

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
      .then((data) => setWeather(data))
      .catch((err) => setWeatherError(err.toString()));
  }, [tempUnit]);

  const builtInQuotes = [
    { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { content: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { content: "Everything you've ever wanted is on the other side of fear.", author: 'George Addair' },
    { content: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
    { content: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
    { content: 'Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', author: 'Stephen King' },
  ];

  useEffect(() => {
    const randomQuote = builtInQuotes[Math.floor(Math.random() * builtInQuotes.length)];
    setQuote(randomQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as DashboardWidgetId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    reorderWidgets(active.id as DashboardWidgetId, over.id as DashboardWidgetId);
  };

  // Renderers for each individual modular widget
  const renderClockWidget = () => (
    <GlassPanel style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '32px',
            background: avatar ? `url(${avatar}) center/cover` : 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}
        >
          {!avatar && userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '2.4rem', margin: 0, lineHeight: 1.1 }}>
            {getGreeting()}, {userName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </p>
            <LiveClock />
          </div>
        </div>
      </div>
    </GlassPanel>
  );

  const renderQuoteWidget = () => (
    <GlassPanel style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>
        "{quote?.content || 'Focus on being productive instead of busy.'}"{' '}
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>— {quote?.author || 'Tim Ferriss'}</span>
      </p>
    </GlassPanel>
  );

  const renderScoreWidget = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', height: '100%' }}>
      {/* Productivity Score */}
      <GlassPanel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Productivity Score</h3>
          <Target size={20} color={prodStatus.color} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <span style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', color: prodStatus.color }}>
            {prodScore}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>/ 100</span>
            <span style={{ color: prodStatus.color, fontSize: '0.85rem', fontWeight: '600' }}>
              {prodStatus.text}
            </span>
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

      {/* Focus Progress */}
      <GlassPanel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Focus Progress</h3>
          <Flame size={20} color="var(--warning)" />
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {pomodorosCompletedToday} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>sessions</span>
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {(todayFocusMinutes / 60).toFixed(1)} hours today
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <button
            className="glass-button primary"
            onClick={() => setActiveTab('focus')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 12px' }}
          >
            <Play size={14} /> Quick Start Focus
          </button>
        </div>
      </GlassPanel>
    </div>
  );

  const renderHabitsWidget = () => (
    <GlassPanel style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Daily Overview</h3>
        <button
          onClick={() => setActiveTab('habits')}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Habits →
        </button>
      </div>
      <ul style={{ marginTop: '16px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
        <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Tasks Pending</span>
          <span style={{ fontWeight: 'bold' }}>{pendingTasksCount}</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Habits Completed</span>
          <span style={{ fontWeight: 'bold' }}>
            {completedHabitsCount} / {totalHabits}
          </span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Journal Status</span>
          <span style={{ fontWeight: 'bold', color: hasJournalToday ? 'var(--success)' : 'var(--text-secondary)' }}>
            {hasJournalToday ? 'Logged' : 'Pending'}
          </span>
        </li>
      </ul>
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Completion Rate</span>
          <span style={{ fontWeight: 600 }}>
            {totalHabits > 0 ? Math.round((completedHabitsCount / totalHabits) * 100) : 0}%
          </span>
        </div>
      </div>
    </GlassPanel>
  );

  const renderTasksWidget = () => (
    <GlassPanel style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '340px' }}>
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
  );

  const renderActivityWidget = () => (
    <GlassPanel style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '340px' }}>
      <h3 style={{ marginBottom: '16px', margin: '0 0 16px 0' }}>Recent Activity</h3>
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
  );

  const renderWeatherWidget = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ width: '100%', marginBottom: '16px', margin: '0 0 16px 0' }}>Calendar</h3>
        <div className="custom-calendar-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Calendar
            onChange={(val) => setCalendarDate(val as Date)}
            value={calendarDate}
            className="glass-calendar"
          />
        </div>
      </GlassPanel>

      <GlassPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Weather</h3>
          {weather?.isOffline && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
              {weather.isCachedOffline ? 'Offline • Using cached forecast' : 'Offline Mode'}
            </span>
          )}
        </div>
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
  );

  const renderWidgetContent = (id: DashboardWidgetId) => {
    switch (id) {
      case 'clock':
        return renderClockWidget();
      case 'quote':
        return renderQuoteWidget();
      case 'score':
        return renderScoreWidget();
      case 'habits':
        return renderHabitsWidget();
      case 'tasks':
        return renderTasksWidget();
      case 'activity':
        return renderActivityWidget();
      case 'weather':
        return renderWeatherWidget();
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', paddingBottom: '40px', overflowY: 'auto' }}>
      
      {/* Dashboard Top Navigation & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 0' }}>
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

        {/* Dashboard Customization & Mode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`glass-button ${isEditMode ? 'primary' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
            title={isEditMode ? 'Finish editing layout' : 'Reorder widgets via drag and drop'}
          >
            {isEditMode ? <Check size={16} /> : <Move size={16} />}
            {isEditMode ? 'Done Editing' : 'Edit Layout'}
          </button>
          <button
            className="glass-button"
            onClick={() => setIsCustomizerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
            title="Open widget visibility customizer"
          >
            <Sliders size={16} /> Customize
          </button>
        </div>
      </div>

      {/* Edit Mode Notification & Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px 20px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '14px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.95rem' }}>
                  <strong>Dashboard Edit Mode:</strong> Drag widgets by their handles or use arrow buttons to arrange your layout.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={resetDashboardWidgets}
                  className="glass-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <RotateCcw size={14} /> Reset Layout
                </button>
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="glass-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Sliders size={14} /> Visibility Drawer
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="glass-button primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Check size={14} /> Done
                </button>
              </div>
            </div>

            {/* Hidden Widgets Quick Restore Row */}
            {hiddenWidgets.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px dashed var(--glass-border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hidden Widgets:</span>
                {hiddenWidgets.map((hw) => (
                  <button
                    key={hw.id}
                    onClick={() => toggleWidgetVisibility(hw.id)}
                    className="glass-button"
                    style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={`Restore ${hw.label}`}
                  >
                    <Plus size={12} /> Add {hw.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sortable Widgets Grid */}
      {visibleWidgets.length === 0 ? (
        <GlassPanel style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '1.05rem' }}>
            All dashboard widgets are currently hidden.
          </p>
          <button onClick={resetDashboardWidgets} className="glass-button primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={16} /> Restore Default Widgets
          </button>
        </GlassPanel>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <SortableContext
            items={visibleWidgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {visibleWidgets.map((widget, index) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  index={index}
                  totalWidgets={visibleWidgets.length}
                  isEditMode={isEditMode}
                  onMoveUp={() => {
                    if (index > 0) {
                      reorderWidgets(widget.id, visibleWidgets[index - 1].id);
                    }
                  }}
                  onMoveDown={() => {
                    if (index < visibleWidgets.length - 1) {
                      reorderWidgets(widget.id, visibleWidgets[index + 1].id);
                    }
                  }}
                  onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                >
                  {renderWidgetContent(widget.id)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragId ? (
              <div
                style={{
                  padding: '16px 24px',
                  background: 'var(--glass-bg)',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: '16px',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'grabbing',
                  pointerEvents: 'none',
                }}
              >
                <GripVertical size={20} color="var(--accent-primary)" />
                <span>{dashboardWidgets.find((w) => w.id === activeDragId)?.label || 'Widget'}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Dashboard Customizer Drawer */}
      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onEnterEditMode={() => setIsEditMode(true)}
      />
    </div>
  );
};

export default Dashboard;
