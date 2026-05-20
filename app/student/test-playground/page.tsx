'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound } from '@/lib/utils/audio'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { Swords, Volume2, Image as ImageIcon, Sparkles, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function TestPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'audio' | 'math-svg' | 'game-sim'>('audio')

  // Math/SVG presets
  const mathSvgPresets = [
    {
      title: "معادلات رياضية وفيزيائية معقدة (LaTeX)",
      content: "قانون الحركة الثاني لنيوتن:\n$$F = m \\times a$$\n\nالمعادلة التربيعية العامة:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nتكامل دالة القوة:\n$$\\int_{a}^{b} x^2 \\, dx = \\left[ \\frac{x^3}{3} \\right]_a^b$$"
    },
    {
      title: "رسم هندسي (مثلث قائم الزاوية بـ SVG)",
      content: "في المثلث قائم الزاوية المقابل، أوجد طول الوتر $AC$:\n\n<svg viewBox=\"0 0 300 200\" width=\"100%\" height=\"auto\" className=\"max-w-xs mx-auto\">\n  <polygon points=\"50,50 50,150 200,150\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"3\" />\n  <line x1=\"50\" y1=\"140\" x2=\"60\" y2=\"140\" stroke=\"currentColor\" strokeWidth=\"2\" />\n  <line x1=\"60\" y1=\"140\" x2=\"60\" y2=\"150\" stroke=\"currentColor\" strokeWidth=\"2\" />\n  <text x=\"35\" y=\"55\" fill=\"currentColor\" fontSize=\"16\" fontWeight=\"bold\">A</text>\n  <text x=\"35\" y=\"165\" fill=\"currentColor\" fontSize=\"16\" fontWeight=\"bold\">B</text>\n  <text x=\"210\" y=\"165\" fill=\"currentColor\" fontSize=\"16\" fontWeight=\"bold\">C</text>\n  <text x=\"25\" y=\"105\" fill=\"currentColor\" fontSize=\"14\">$3\\text{ سم}$</text>\n  <text x=\"115\" y=\"170\" fill=\"currentColor\" fontSize=\"14\">$4\\text{ سم}$</text>\n</svg>"
    },
    {
      title: "مخطط فيزيائي (متجهات القوى بـ SVG)",
      content: "جسم متأثر بقوتين متعامدتين كما هو موضح بالرسم:\n\n<svg viewBox=\"0 0 300 200\" width=\"100%\" height=\"auto\" className=\"max-w-xs mx-auto\">\n  <circle cx=\"150\" cy=\"100\" r=\"20\" fill=\"#6366f1\" />\n  <text x=\"145\" y=\"105\" fill=\"#white\" fontSize=\"14\" fontWeight=\"bold\">m</text>\n  <!-- القوة الأولى -->\n  <line x1=\"170\" y1=\"100\" x2=\"250\" y2=\"100\" stroke=\"#10b981\" strokeWidth=\"3\" />\n  <polygon points=\"250,95 260,100 250,105\" fill=\"#10b981\" />\n  <text x=\"210\" y=\"85\" fill=\"#10b981\" fontSize=\"14\" fontWeight=\"bold\">$F_1 = 8\\text{ N}$</text>\n  <!-- القوة الثانية -->\n  <line x1=\"150\" y1=\"80\" x2=\"150\" y2=\"20\" stroke=\"#f43f5e\" strokeWidth=\"3\" />\n  <polygon points=\"145,20 150,10 155,20\" fill=\"#f43f5e\" />\n  <text x=\"165\" y=\"40\" fill=\"#f43f5e\" fontSize=\"14\" fontWeight=\"bold\">$F_2 = 6\\text{ N}$</text>\n</svg>"
    }
  ]

  const [customInput, setCustomInput] = useState(mathSvgPresets[1].content)

  // Game Sim states
  const [simPhase, setSimPhase] = useState<'idle' | 'matching' | 'question' | 'completed'>('idle')
  const [simAnswered, setSimAnswered] = useState<string | null>(null)
  const [simScore, setSimScore] = useState(0)

  const startSim = () => {
    setSimPhase('matching')
    setSimAnswered(null)
    setSimScore(0)
    setTimeout(() => {
      setSimPhase('question')
    }, 2000)
  }

  const handleSimAnswer = (opt: string) => {
    setSimAnswered(opt)
    const correct = opt === '60°'
    playSound(correct ? 'correct' : 'incorrect')
    if (correct) setSimScore(30)
    
    setTimeout(() => {
      setSimPhase('completed')
      playSound(correct ? 'victory' : 'defeat')
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in pb-24" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          لوحة اختبار الميزات التفاعلية الجديدة
        </h1>
        <p className="text-indigo-100">
          هذه الصفحة مخصصة لاختبار وتقييم المؤثرات الصوتية (Web Audio API)، الحركات الانتقالية (Framer Motion)، وعرض الرسوم البيانية الهندسية (SVG) محلياً بدون الحاجة إلى إعدادات إضافية في قاعدة البيانات.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted p-1 rounded-2xl border border-border">
        {(['audio', 'math-svg', 'game-sim'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'audio' && '🔊 المؤثرات الصوتية (Web Audio)'}
            {tab === 'math-svg' && '📐 اختبار الرسوم (SVG & LaTeX)'}
            {tab === 'game-sim' && '⚔️ محاكاة لعبة التحدي'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-border p-6 shadow-sm min-h-[400px]">
        {/* Tab 1: Audio */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Volume2 className="text-indigo-500" />
              تخليق الأصوات محلياً (Web Audio API)
            </h2>
            <p className="text-muted-foreground text-sm">
              يتم تخليق هذه الترددات الصوتية لحظياً داخل المتصفح، وهي مجانية بالكامل ومدمجة وخفيفة الوزن دون أي تحميل لملفات صوتية خارجية.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'correct', label: 'رنين الإجابة الصحيحة', desc: 'نغمة تصاعدية مبهجة', color: 'bg-emerald-500 hover:bg-emerald-600' },
                { type: 'incorrect', label: 'طنين الإجابة الخاطئة', desc: 'نغمة منخفضة متلاشية ثنائية', color: 'bg-rose-500 hover:bg-rose-600' },
                { type: 'victory', label: 'لحن الفوز (Victory)', desc: 'مقطوعة احتفالية متصاعدة عند الفوز', color: 'bg-amber-500 hover:bg-amber-600' },
                { type: 'defeat', label: 'لحن الخسارة (Defeat)', desc: 'نغمات متدرجة منخفضة عند الخسارة', color: 'bg-slate-500 hover:bg-slate-600' }
              ].map(sound => (
                <button
                  key={sound.type}
                  onClick={() => playSound(sound.type as any)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border hover:border-indigo-400 hover:bg-indigo-50/20 transition-all text-center group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform ${sound.color}`}>
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-foreground">{sound.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{sound.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Math & SVG */}
        {activeTab === 'math-svg' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="text-purple-500" />
              مفسر الرموز والرسوم التوضيحية (SVG & MathRenderer)
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {mathSvgPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setCustomInput(preset.content)}
                  className="p-3 text-right rounded-xl border border-border hover:border-indigo-500 hover:bg-indigo-50/20 text-xs font-bold transition-all animate-fade-in"
                >
                  {preset.title}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold block">محرر التجربة التفاعلية:</label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full h-32 p-3 font-mono text-sm border-2 border-border rounded-xl focus:border-indigo-500 focus:outline-none"
                placeholder="اكتب كود LaTeX أو وسم SVG هنا..."
              />
            </div>
            <div className="p-6 border-2 border-indigo-100 bg-slate-50/50 rounded-2xl">
              <label className="text-xs font-bold text-indigo-500 block mb-3 uppercase tracking-wider">المعاينة والناتج النهائي:</label>
              <MathRenderer text={customInput} className="text-lg font-bold" />
            </div>
          </div>
        )}

        {/* Tab 3: Game Simulator */}
        {activeTab === 'game-sim' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Swords className="text-indigo-500" />
                  محاكاة دورة اللعبة وتفاعلاتها المباشرة
                </h2>
                <p className="text-muted-foreground text-sm">اختبار تجربة التحدي بالكامل والحركات الانتقالية المصاحبة</p>
              </div>
              {simPhase !== 'idle' && (
                <button onClick={startSim} className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:underline">
                  <RefreshCw className="w-4 h-4" /> إعادة البدء
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {simPhase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <Swords className="w-16 h-16 text-indigo-200 mb-4 animate-bounce" />
                  <p className="text-muted-foreground mb-4">اضغط على زر البدء لمحاكاة تجربة التحدي والتحقق من الانتقالات الحركية</p>
                  <button onClick={startSim} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all">
                    ابدأ المحاكاة ⚔️
                  </button>
                </motion.div>
              )}

              {simPhase === 'matching' && (
                <motion.div
                  key="matching"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 8, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-24 h-24 rounded-full border-4 border-indigo-200 flex items-center justify-center bg-indigo-50"
                    >
                      <Swords className="w-12 h-12 text-indigo-500" />
                    </motion.div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold">جاري البحث عن خصم...</h3>
                  <p className="text-sm text-muted-foreground">محاكاة المزامنة اللحظية مع خادم التحديات</p>
                </motion.div>
              )}

              {simPhase === 'question' && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-4"
                >
                  <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
                    <span className="font-bold text-indigo-700">السؤال رقم 1</span>
                    <span className="font-bold text-amber-600">{simScore} نقطة</span>
                  </div>
                  <div className="border border-border p-6 rounded-2xl bg-white shadow-sm space-y-4">
                    <p className="font-bold text-lg">
                      إذا كان قياس الزاوية المركزية $AOB$ في الدائرة المقابلة هو $120°$، فما هو قياس الزاوية المحيطية $ACB$ المشتركة معها في نفس القوس؟
                    </p>
                    {/* SVG Diagram inside Question */}
                    <div className="my-4 flex justify-center bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-full overflow-x-auto">
                      <svg viewBox="0 0 200 200" width="160" height="160">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle cx="100" cy="100" r="3" fill="currentColor" />
                        <text x="105" y="105" fill="currentColor" fontSize="10">O</text>
                        <line x1="100" y1="100" x2="31" y2="140" stroke="currentColor" strokeWidth="1" />
                        <line x1="100" y1="100" x2="169" y2="140" stroke="currentColor" strokeWidth="1" />
                        <line x1="31" y1="140" x2="100" y2="20" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="169" y1="140" x2="100" y2="20" stroke="currentColor" strokeWidth="1.5" />
                        <text x="18" y="148" fill="currentColor" fontSize="12">A</text>
                        <text x="174" y="148" fill="currentColor" fontSize="12">B</text>
                        <text x="96" y="15" fill="currentColor" fontSize="12">C</text>
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {['120°', '60°', '90°', '30°'].map((opt, i) => {
                        const isSelected = simAnswered === opt
                        const correct = opt === '60°'
                        let cls = 'w-full text-right p-4 rounded-xl border-2 font-bold transition-all flex items-center justify-between'
                        if (!simAnswered) {
                          cls += ' border-border hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
                        } else if (correct) {
                          cls += ' border-emerald-500 bg-emerald-50 text-emerald-800'
                        } else if (isSelected) {
                          cls += ' border-rose-400 bg-rose-50 text-rose-800'
                        } else {
                          cls += ' border-border opacity-40'
                        }

                        return (
                          <motion.button
                            key={i}
                            disabled={!!simAnswered}
                            onClick={() => handleSimAnswer(opt)}
                            className={cls}
                            whileHover={!simAnswered ? { scale: 1.02 } : {}}
                            whileTap={!simAnswered ? { scale: 0.98 } : {}}
                            animate={simAnswered && isSelected && !correct ? { x: [-6, 6, -6, 6, 0] } : simAnswered && correct ? { scale: [1, 1.03, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <span>{opt}</span>
                            {simAnswered && correct && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                            {simAnswered && isSelected && !correct && <XCircle className="w-5 h-5 text-rose-500" />}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {simPhase === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg text-white font-black ${simScore > 0 ? 'bg-amber-500 animate-bounce' : 'bg-slate-500'}`}
                  >
                    {simScore > 0 ? '🏆 فوز' : '💪 خسارة'}
                  </motion.div>
                  <h3 className="text-xl font-bold">{simScore > 0 ? 'رائع! لقد فزت بالتحدي التخيلي!' : 'حظاً موفقاً في المرة القادمة!'}</h3>
                  <p className="text-muted-foreground text-sm">تم محاكاة المؤثرات الصوتية والانتقالات بنجاح.</p>
                  <button onClick={startSim} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all">
                    محاكاة جديدة
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
