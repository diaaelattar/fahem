import { describe, it, expect } from 'vitest'
import { canAccessRoute } from './permissions'

describe('canAccessRoute', () => {
  it('should allow admin to access admin routes', () => {
    expect(canAccessRoute('admin', '/admin/dashboard')).toBe(true)
    expect(canAccessRoute('admin', '/admin/users')).toBe(true)
  })

  it('should deny non-admin to access admin routes', () => {
    expect(canAccessRoute('student', '/admin/dashboard')).toBe(false)
    expect(canAccessRoute('teacher', '/admin/dashboard')).toBe(false)
  })

  it('should allow student to access student routes', () => {
    expect(canAccessRoute('student', '/student/dashboard')).toBe(true)
  })

  it('should deny non-student to access student routes', () => {
    expect(canAccessRoute('admin', '/student/dashboard')).toBe(false)
    expect(canAccessRoute('teacher', '/student/dashboard')).toBe(false)
  })

  it('should allow teacher to access teacher routes', () => {
    expect(canAccessRoute('teacher', '/teacher/dashboard')).toBe(true)
  })

  it('should deny non-teacher to access teacher routes', () => {
    expect(canAccessRoute('admin', '/teacher/dashboard')).toBe(false)
    expect(canAccessRoute('student', '/teacher/dashboard')).toBe(false)
  })

  it('should allow any role to access public routes', () => {
    expect(canAccessRoute('admin', '/')).toBe(true)
    expect(canAccessRoute('student', '/about')).toBe(true)
    expect(canAccessRoute('teacher', '/contact')).toBe(true)
  })
})
