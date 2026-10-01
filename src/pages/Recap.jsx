import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  LayoutGrid,
  Layers,
  Share2,
  Download,
  Dumbbell,
  Trophy,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useWorkouts } from '../context/WorkoutContext';
import {
  getRangeForMode,
  shiftAnchor,
  formatRangeLabel,
  computeRecap,
  computeDelta,
  buildShareText,
} from '../utils/recapUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const STORY_MS = 6000;

const downloadRecapImage = (recap, periodLabel) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, '#4f46e5');
  grad.addColorStop(0.5, '#9333ea');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(900, 200, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(120, 1150, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('FitTrack Recap', 540, 220);
  ctx.font = '500 44px system-ui, sans-serif';
  ctx.fillText(periodLabel.slice(0, 40), 540, 290);
  ctx.font = '120px system-ui';
  ctx.fillText(recap.personality.emoji || '💪', 540, 450);
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.fillText((recap.personality.title || '').slice(0, 24), 540, 570);
  ctx.font = '500 48px system-ui, sans-serif';
  const stats = [
    `${recap.totalWorkouts} workouts  |  ${Math.round(recap.totalVolume).toLocaleString()} kg`,
    `${recap.totalSets} sets  |  ${recap.totalReps} reps  |  ${recap.totalMinutes} min`,
    recap.topExercises[0] ? `Top move: ${recap.topExercises[0].name}` : 'Every rep counts',
    recap.prs.length ? `${recap.prs.length} PR${recap.prs.length > 1 ? 's' : ''} smashed` : 'Next PR is loading...',
  ];
  stats.forEach((line, i) => ctx.fillText(line.slice(0, 42), 540, 700 + i * 80));
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `fittrack-recap-${periodLabel.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
  a.click();
};

const Recap = () => {
  const { workouts, isLoading } = useWorkouts();
  const [mode, setMode] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState('story');
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const range = useMemo(() => getRangeForMode(mode, anchor), [mode, anchor]);
  const prevRange = useMemo(
    () => getRangeForMode(mode, shiftAnchor(anchor, mode, -1)),
    [mode, anchor]
  );
  const recap = useMemo(() => computeRecap(workouts, range), [workouts, range]);
  const prevRecap = useMemo(() => computeRecap(workouts, prevRange), [workouts, prevRange]);
  const delta = useMemo(() => computeDelta(recap, prevRecap), [recap, prevRecap]);
  const periodLabel = useMemo(() => formatRangeLabel(mode, range), [mode, range]);

  const isAtCurrent = useMemo(() => range.end >= new Date(), [range]);
  const totalCards = 7;

  const goPrevPeriod = useCallback(() => {
    setAnchor((a) => shiftAnchor(a, mode, -1));
    setIndex(0);
  }, [mode]);
  const goNextPeriod = useCallback(() => {
    if (isAtCurrent) return;
    setAnchor((a) => shiftAnchor(a, mode, 1));
    setIndex(0);
  }, [mode, isAtCurrent]);
  const goToday = useCallback(() => {
    setAnchor(new Date());
    setIndex(0);
  }, []);

  const switchMode = useCallback((m) => {
    setMode(m);
    setIndex(0);
  }, []);

  useEffect(() => {
    if (view !== 'story' || !isPlaying || recap.isEmpty) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % totalCards), STORY_MS);
    return () => clearTimeout(t);
  }, [view, isPlaying, index, recap.isEmpty]);

  const handleShare = async () => {
    const text = buildShareText(recap, periodLabel);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Recap copied — paste it anywhere!');
    } catch {
      toast.error('Copy failed — screenshot works too');
    }
  };

  const cards = useMemo(() => {
    const topMuscle = recap.muscleSplit[0];
    return [
      {
        id: 'cover',
        emoji: recap.personality.emoji,
        kicker: `${mode === 'week' ? 'Weekly' : 'Monthly'} Wrapped`,
        title: recap.personality.title,
        value: periodLabel,
        sub: recap.personality.line,
        gradient: 'from-indigo-600 via-purple-600 to-pink-500',
      },
      {
        id: 'sessions',
        emoji: '🏋️',
        kicker: 'Sessions',
        title: `${recap.totalWorkouts} workout${recap.totalWorkouts === 1 ? '' : 's'}`,
        value: `${recap.activeDays}/${recap.totalDays} active days`,
        sub:
          delta && delta.workoutDelta !== 0
            ? `${delta.workoutDelta > 0 ? '+' : ''}${delta.workoutDelta} vs previous ${mode}`
            : `${recap.consistency}% consistency${recap.restDays ? ` · ${recap.restDays} rest day${recap.restDays === 1 ? '' : 's'}` : ''}`,
        gradient: 'from-blue-600 via-indigo-600 to-violet-600',
      },
      {
        id: 'volume',
        emoji: '⚖️',
        kicker: 'Iron moved',
        title: `${Math.round(recap.totalVolume).toLocaleString()} kg`,
        value: `${recap.tons} tons`,
        sub:
          recap.funFact ||
          (delta ? `${delta.volumeDeltaPct >= 0 ? '+' : ''}${delta.volumeDeltaPct}% volume vs previous ${mode}` : 'Lift, rest, repeat'),
        gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      },
      {
        id: 'effort',
        emoji: '⏱️',
        kicker: 'Time under tension',
        title: `${recap.totalMinutes} min training`,
        value: `${recap.totalSets} sets · ${recap.totalReps.toLocaleString()} reps`,
        sub: recap.cardioMinutes ? `${recap.cardioMinutes} min cardio included` : 'Strength-first period',
        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      },
      {
        id: 'moves',
        emoji: '🔥',
        kicker: 'Top moves',
        title: recap.topExercises[0]?.name || 'No lifts yet',
        value: recap.topExercises.map((t) => `${t.name} ×${t.count}`).join(' · ') || 'Log a workout to start',
        sub: topMuscle ? `Biggest focus: ${topMuscle.name} (${topMuscle.pct}%)` : 'Find your signature lift',
        gradient: 'from-rose-600 via-red-500 to-orange-500',
      },
      {
        id: 'prs',
        emoji: '🏆',
        kicker: 'Personal records',
        title: recap.prs.length ? `${recap.prs.length} PR${recap.prs.length === 1 ? '' : 's'} smashed` : 'No PRs this time',
        value: recap.prs.slice(0, 2).map((p) => `${p.exercise} ${p.weight}kg`).join(' · ') || 'Next one is close — keep pushing',
        sub: recap.prs[0]?.isFirstTime ? 'First-time record included!' : 'Progress compounds quietly',
        gradient: 'from-yellow-500 via-amber-500 to-orange-600',
      },
      {
        id: 'vibe',
        emoji: '✨',
        kicker: 'Your verdict',
        title: recap.personality.title,
        value: recap.personality.line,
        sub: `${periodLabel} · ${recap.totalWorkouts} sessions · ${recap.consistency}% active`,
        gradient: 'from-fuchsia-600 via-purple-600 to-indigo-600',
        isLast: true,
      },
    ];
  }, [recap, periodLabel, mode, delta]);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading recap">
        <div className="animate-pulse h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="animate-pulse h-96 rounded-3xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-safe">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" aria-hidden="true" />
            Recap
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your Spotify-style gym Wrapped — weekly and monthly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1" role="tablist" aria-label="Period">
            {['week', 'month'].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1" role="tablist" aria-label="View">
            <button
              role="tab"
              aria-selected={view === 'story'}
              onClick={() => setView('story')}
              title="Story view"
              className={`p-2 rounded-full transition-all ${view === 'story' ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600' : 'text-gray-500'}`}
            >
              <Layers className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              role="tab"
              aria-selected={view === 'overview'}
              onClick={() => setView('overview')}
              title="Grid view"
              className={`p-2 rounded-full transition-all ${view === 'overview' ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600' : 'text-gray-500'}`}
            >
              <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={goPrevPeriod} aria-label="Previous period">
          <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" /> Prev
        </Button>
        <button
          onClick={goToday}
          className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-full transition-colors"
          title="Jump to current period"
        >
          {periodLabel}
        </button>
        <Button variant="secondary" size="sm" onClick={goNextPeriod} disabled={isAtCurrent} aria-label="Next period">
          Next <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
        </Button>
      </div>

      {recap.isEmpty ? (
        <Card className="text-center !py-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl" aria-hidden="true">🌙</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quiet {mode} — {periodLabel}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No workouts logged here. Rest counts too, but your next Wrapped needs at least one session.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Link to="/log">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  <Dumbbell className="w-5 h-5 mr-2" aria-hidden="true" /> Log workout
                </Button>
              </Link>
              <Button variant="secondary" size="lg" onClick={goToday}>
                Back to current {mode}
              </Button>
            </div>
          </div>
        </Card>
      ) : view === 'story' ? (
        <div>
          {/* Progress segments */}
          <div className="flex gap-1.5 mb-3" aria-hidden="true">
            {cards.map((c, i) => (
              <div key={c.id} className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600 rounded-full"
                  initial={false}
                  animate={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
                  transition={i === index && isPlaying ? { duration: STORY_MS / 1000, ease: 'linear' } : { duration: 0.2 }}
                  style={{ opacity: i <= index ? 1 : 0.4 }}
                />
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-lifted min-h-[480px] md:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${periodLabel}-${cards[index].id}`}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 bg-gradient-to-br ${cards[index].gradient} text-white p-8 md:p-12 flex flex-col justify-between`}
              >
                <div>
                  <div className="text-7xl md:text-8xl mb-4" aria-hidden="true">{cards[index].emoji}</div>
                  <p className="uppercase tracking-widest text-white/70 text-sm font-bold">{cards[index].kicker}</p>
                  <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mt-2">{cards[index].title}</h2>
                  <p className="text-xl md:text-2xl font-semibold text-white/90 mt-3">{cards[index].value}</p>
                </div>
                <div>
                  <p className="text-white/85 text-base md:text-lg">{cards[index].sub}</p>
                  {cards[index].isLast && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 bg-white text-gray-900 font-bold px-5 py-3 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Share2 className="w-4 h-4" aria-hidden="true" /> Copy recap
                      </button>
                      <button
                        onClick={() => downloadRecapImage(recap, periodLabel)}
                        className="flex items-center gap-2 bg-black/30 text-white font-bold px-5 py-3 rounded-full hover:bg-black/40 transition-colors"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" /> Save image
                      </button>
                    </div>
                  )}
                  <p className="text-white/60 text-sm mt-4">{index + 1} / {cards.length} · {periodLabel}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Tap zones */}
            <button aria-label="Previous card" onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)} className="absolute left-0 top-0 bottom-0 w-1/4 focus:outline-none" />
            <button aria-label="Next card" onClick={() => setIndex((i) => (i + 1) % cards.length)} className="absolute right-0 top-0 bottom-0 w-1/4 focus:outline-none" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)}>
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIndex((i) => (i + 1) % cards.length)}>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsPlaying((p) => !p)} aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}>
                {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" aria-hidden="true" /> Share
              </Button>
              <Button variant="secondary" size="sm" onClick={() => downloadRecapImage(recap, periodLabel)}>
                <Download className="w-4 h-4 mr-1" aria-hidden="true" /> Image
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Overview grid */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Workouts', value: recap.totalWorkouts, icon: Dumbbell, sub: `${recap.consistency}% active` },
            { label: 'Volume', value: `${recap.tons}T`, icon: Flame, sub: `${Math.round(recap.totalVolume).toLocaleString()} kg` },
            { label: 'Time', value: `${recap.totalMinutes}m`, icon: Clock, sub: `${recap.totalSets} sets · ${recap.totalReps} reps` },
            { label: 'PRs', value: recap.prs.length, icon: Trophy, sub: recap.prs[0] ? `${recap.prs[0].exercise} ${recap.prs[0].weight}kg` : 'Next one soon' },
          ].map((s) => (
            <Card key={s.label} elevated className="text-center !p-5">
              <s.icon className="w-6 h-6 mx-auto text-purple-600 mb-2" aria-hidden="true" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{s.sub}</div>
            </Card>
          ))}
          <Card className="col-span-2 lg:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Top moves</h3>
            {recap.topExercises.length === 0 ? (
              <p className="text-sm text-gray-500">No lifts logged.</p>
            ) : (
              <div className="space-y-2">
                {recap.topExercises.map((t, i) => (
                  <div key={t.name} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="font-medium text-gray-900 dark:text-white truncate">#{i + 1} {t.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">×{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="col-span-2 lg:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Muscle focus</h3>
            {recap.muscleSplit.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="space-y-2">
                {recap.muscleSplit.map((m) => (
                  <div key={m.name}>
                    <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 capitalize">
                      <span>{m.name}</span><span>{m.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Recap;
