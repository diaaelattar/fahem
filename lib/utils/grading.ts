/**
 * Unified grading utilities for Fahem/إستبق platform.
 * Contains math/LaTeX normalization, Arabic text normalization, and lenient comparison algorithms.
 */

export const normalizeMath = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/\$+/g, '') // strip LaTeX $ delimiters
    .replace(/\\text\{([^}]*)\}/g, '$1') // \text{x} → x
    .replace(/\\[a-zA-Z]+\s*/g, '') // strip other LaTeX commands
    .replace(/(\d),(\d{3})(?=[^\d]|$)/g, '$1$2') // thousands ONLY: 5,000 → 5000 (NOT 9,81)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export const extractNumbers = (text: string): number[] => {
  const clean = normalizeMath(text)
  const matches = clean.match(/\d+(\.\d+)?/g) || []
  return Array.from(new Set(matches.map(Number)))
}

export const normalizeArabic = (text: string): string => {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
    .replace(/[،\-_/\\.:؛"']/g, ' ') // استبدال علامات الترقيم بمسافة
    .replace(/\s+/g, ' ') // إزالة المسافات الزائدة
}

export const extractEquationResult = (text: string): string | null => {
  const clean = normalizeMath(text)
  const parts = clean.split('=')
  if (parts.length >= 2) return parts[parts.length - 1].trim()
  return null
}

/**
 * Checks if student answer matches the correct answer with lenient matching rules.
 */
export const checkAnswer = (
  studentAns: string,
  correctAns: string,
  type: string
): boolean => {
  if (!studentAns || !correctAns) return false

  if (type === 'true_false') {
    const isStudentTrue =
      studentAns === 'صح' || studentAns.toLowerCase() === 'true'
    const isCorrectTrue =
      correctAns === 'صح' || correctAns.toLowerCase() === 'true'
    const isStudentFalse =
      studentAns === 'خطأ' || studentAns.toLowerCase() === 'false'
    const isCorrectFalse =
      correctAns === 'خطأ' || correctAns.toLowerCase() === 'false'
    return (
      (isStudentTrue && isCorrectTrue) || (isStudentFalse && isCorrectFalse)
    )
  }

  // ── Math-aware comparison (runs first, before Arabic normalization) ──
  const ms = normalizeMath(studentAns)
  const mc = normalizeMath(correctAns)
  if (ms === mc) return true
  if (ms.replace(/\s/g, '') === mc.replace(/\s/g, '')) return true

  // Equation result: student writes "\frac{35}{5}=7", correct is "7"
  const studentResult = extractEquationResult(studentAns)
  if (studentResult && studentResult === mc) return true
  const srNum = Number(studentResult)
  const crNum = Number(mc.replace(/[^\d.]/g, ''))
  if (
    studentResult &&
    !isNaN(srNum) &&
    !isNaN(crNum) &&
    srNum > 0 &&
    Math.abs(srNum - crNum) < 1e-9
  )
    return true

  // Key-numbers set matching: student writes "9,81" → [9,81], correct has [9,81] → match!
  const correctNums = extractNumbers(correctAns)
  if (correctNums.length >= 2) {
    const studentNums = extractNumbers(studentAns)
    if (correctNums.every((n) => studentNums.includes(n))) return true
  }

  // Numeric-core: student writes "10", correct is "10 trees"
  const numCoreS = ms.match(/^[\d./+\-\s×÷*]+/)?.[0]?.trim()
  const numCoreC = mc.match(/^[\d./+\-\s×÷*]+/)?.[0]?.trim()
  if (
    numCoreS &&
    numCoreC &&
    numCoreS.replace(/\s/g, '') === numCoreC.replace(/\s/g, '')
  )
    return true

  // Numeric equivalence: 1/2 == 0.5
  const numS = Number(ms.replace(/[^\d.]/g, ''))
  const numC = Number(mc.replace(/[^\d.]/g, ''))
  if (!isNaN(numS) && !isNaN(numC) && numS > 0 && Math.abs(numS - numC) < 1e-9)
    return true

  const ns = normalizeArabic(studentAns)
  const nc = normalizeArabic(correctAns)

  if (type === 'mcq') return ns === nc

  // --- مرن للإكمال والمقالة والتصحيح ---
  if (ns === nc) return true
  if (nc.length >= 3 && ns.includes(nc)) return true
  if (ns.length >= 3 && nc.includes(ns)) return true

  const sw = ns.split(/\s+/).filter((w) => w.length >= 2)
  const cw = nc.split(/\s+/).filter((w) => w.length >= 2)

  if (sw.length > 0 && cw.length > 0) {
    const common = cw.filter((w) => sw.includes(w))
    if (sw.length <= 2 && common.length === sw.length) return true
    const ratioCorrect = common.length / cw.length
    const ratioStudent = common.length / sw.length
    if (ratioCorrect >= 0.4 || ratioStudent >= 0.5) return true
  }

  return false
}
