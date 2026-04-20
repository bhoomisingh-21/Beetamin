import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateLeadInput(body: unknown):
  | { valid: true; data: { name: string; email: string; phone?: string; source?: string } }
  | { valid: false; error: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Invalid body' }

  const { name, email, phone, source } = body as Record<string, unknown>

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.length > 100)
    return { valid: false, error: 'Invalid name' }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { valid: false, error: 'Invalid email' }

  if (phone && (typeof phone !== 'string' || phone.length > 15))
    return { valid: false, error: 'Invalid phone' }

  return {
    valid: true,
    data: {
      name: name.trim().slice(0, 100),
      email: email.toLowerCase().trim(),
      phone: phone ? String(phone).slice(0, 15) : undefined,
      source: source ? String(source).slice(0, 50) : undefined,
    },
  }
}

export function validateAssessmentInput(body: unknown):
  | {
      valid: true
      data: {
        answers: Record<string, unknown>
        name: string
        age: string
        diet: string
        goal: string
      }
    }
  | { valid: false; error: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Invalid body' }
  const o = body as Record<string, unknown>

  if (!o.answers || typeof o.answers !== 'object' || o.answers === null || Array.isArray(o.answers))
    return { valid: false, error: 'Invalid answers' }

  const name = o.name
  if (typeof name !== 'string' || name.trim().length < 1 || name.length > 100)
    return { valid: false, error: 'Invalid name' }

  const ageRaw = o.age
  let ageStr: string
  if (typeof ageRaw === 'number' && Number.isFinite(ageRaw)) {
    ageStr = String(Math.floor(ageRaw))
  } else if (typeof ageRaw === 'string') {
    ageStr = ageRaw.trim()
  } else {
    return { valid: false, error: 'Invalid age' }
  }
  if (ageStr.length < 1 || ageStr.length > 4 || !/^\d+$/.test(ageStr)) return { valid: false, error: 'Invalid age' }
  const ageNum = Number(ageStr)
  if (ageNum < 1 || ageNum > 120) return { valid: false, error: 'Invalid age' }

  const diet = o.diet
  if (typeof diet !== 'string' || diet.length > 50) return { valid: false, error: 'Invalid diet' }

  const goal = o.goal
  if (typeof goal !== 'string' || goal.length > 200) return { valid: false, error: 'Invalid goal' }

  return {
    valid: true,
    data: {
      answers: o.answers as Record<string, unknown>,
      name: name.trim().slice(0, 100),
      age: ageStr,
      diet: diet.trim().slice(0, 50),
      goal: goal.trim().slice(0, 200),
    },
  }
}
